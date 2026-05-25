#!/usr/bin/env node
// tools/publish.js
//
// Publish a skill to the cicy-skills registry.
//
// Flow:
//   1. Read manifest.json from skill dir
//   2. Ensure the local zip exists (from pack-skill.js)
//   3. Create GitHub Release (if not exists) and upload the zip asset via `gh`
//   4. Download the asset from GitHub to get the REAL bytes users will receive
//   5. Compute sha256 on the downloaded bytes
//   6. POST to registry with the real sha256
//
// This guarantees the sha256 in the registry always matches what users download.
//
// Usage:
//   ADMIN_TOKEN=... node tools/publish.js skills/cping
//   ADMIN_TOKEN=... node tools/publish.js skills/cping \
//     --registry https://skills.cicy-ai.com \
//     --repo cicy-ai/cicy-skills \
//     --zip dist/cping-1.0.0.zip
//
// Exit codes:
//   0 — published
//   1 — publish failed (server error)
//   2 — usage / validation failed
//   3 — IO error
//   4 — auth missing

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// ── arg parsing ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const json = argv.includes('--json');
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const positional = argv.filter(
  (a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'),
);

const skillDir = positional[0];
if (!skillDir) {
  process.stderr.write(
    'usage: publish.js <skill-dir> [--registry URL] [--repo OWNER/REPO] [--zip PATH] [--json]\n',
  );
  process.exit(2);
}

const REGISTRY = flag('registry', 'https://skills.cicy-ai.com');
const REPO = flag('repo', 'cicy-ai/cicy-skills');
const SKILL_DIR = resolve(skillDir);

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  process.stderr.write('ADMIN_TOKEN env var required\n');
  process.exit(4);
}

// ── load manifest ──────────────────────────────────────────────────────────

const manifestPath = join(SKILL_DIR, 'manifest.json');
if (!existsSync(manifestPath)) {
  process.stderr.write(`manifest.json not found in ${SKILL_DIR}\n`);
  process.exit(3);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const { name, version } = manifest;
if (!name || !version) {
  process.stderr.write('manifest.json missing name/version\n');
  process.exit(2);
}

// ── locate zip ─────────────────────────────────────────────────────────────

const zipPath = resolve(flag('zip', join('dist', `${name}-${version}.zip`)));
if (!existsSync(zipPath)) {
  process.stderr.write(`zip not found at ${zipPath}\n`);
  process.stderr.write(`hint: run "node tools/pack-skill.js ${skillDir}" first\n`);
  process.exit(3);
}

// ── derive tag / asset / download_url ──────────────────────────────────────

const tag = `${name}-v${version}`;
const asset = `${name}-${version}.zip`;
const downloadUrl = `https://github.com/${REPO}/releases/download/${tag}/${asset}`;

// ── step 1: gh release create + upload ─────────────────────────────────────

process.stderr.write(`▸ uploading ${asset} to ${REPO} release ${tag}...\n`);

// Create release (ignore error if already exists)
try {
  execFileSync('gh', [
    'release', 'create', tag,
    '--repo', REPO,
    '--title', `${name} v${version}`,
    '--notes', `Skill release: ${name}@${version}`,
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
} catch {
  // release already exists — fine
}

// Upload asset (--clobber overwrites if re-publishing same version)
try {
  execFileSync('gh', [
    'release', 'upload', tag, zipPath,
    '--repo', REPO,
    '--clobber',
  ], { stdio: ['ignore', 'inherit', 'inherit'] });
} catch (e) {
  process.stderr.write(`✗ gh release upload failed: ${e.message}\n`);
  process.exit(3);
}

// ── step 2: download the asset from GitHub to compute real sha256 ──────────

process.stderr.write(`▸ downloading ${downloadUrl} to verify sha256...\n`);

let realBuf;
try {
  const res = await fetch(downloadUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  realBuf = Buffer.from(await res.arrayBuffer());
} catch (e) {
  process.stderr.write(`✗ download failed: ${e.message}\n`);
  process.stderr.write('hint: the asset may not be available yet; retry in a few seconds\n');
  process.exit(3);
}

const sha256 = createHash('sha256').update(realBuf).digest('hex');
const size = realBuf.length;

process.stderr.write(`  sha256: ${sha256}\n`);
process.stderr.write(`  size:   ${size} bytes\n`);

// ── inject publish fields into manifest ────────────────────────────────────

manifest.publish = {
  ...(manifest.publish || {}),
  published_at: new Date().toISOString(),
  sha256,
  size,
  download_url: downloadUrl,
  source: {
    type: 'github',
    repository: REPO,
    tag,
  },
};

// ── read doc files inlined for registry preview ────────────────────────────

const fileMap = {
  skill_md: manifest.files?.skill_md || 'SKILL.md',
  help_md: manifest.files?.help_md || 'help.md',
  tools_md: manifest.files?.tools_md || 'tools.md',
  readme: manifest.files?.readme || 'README.md',
};

const files = {};
for (const [key, rel] of Object.entries(fileMap)) {
  const path = join(SKILL_DIR, rel);
  if (existsSync(path)) {
    files[key] = readFileSync(path, 'utf8');
  }
}

// ── POST to registry ───────────────────────────────────────────────────────

process.stderr.write(`▸ registering ${name}@${version} with registry...\n`);

const url = `${REGISTRY.replace(/\/$/, '')}/v1/admin/publish`;
let response;
try {
  response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      manifest,
      files,
      verify: { download_url: downloadUrl, sha256, size },
    }),
  });
} catch (e) {
  process.stderr.write(`POST ${url} failed: ${e.message}\n`);
  process.exit(1);
}

const body = await response.text();
let payload;
try { payload = JSON.parse(body); } catch { payload = { raw: body }; }

if (!response.ok) {
  if (json) {
    process.stdout.write(JSON.stringify({ ok: false, status: response.status, response: payload }, null, 2) + '\n');
  } else {
    process.stderr.write(`✗ publish failed (${response.status}):\n`);
    process.stderr.write(JSON.stringify(payload, null, 2) + '\n');
  }
  process.exit(1);
}

const out = {
  ok: true,
  name,
  version,
  download_url: downloadUrl,
  sha256,
  size,
  registry_response: payload,
};

if (json) {
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} else {
  process.stdout.write(`✓ published ${name}@${version}\n`);
  process.stdout.write(`  download: ${downloadUrl}\n`);
  process.stdout.write(`  sha256:   ${sha256}\n`);
  process.stdout.write(`  size:     ${size} bytes\n`);
  process.stdout.write(`  registry: ${REGISTRY}/v1/skills/${name}/${version}\n`);
}
