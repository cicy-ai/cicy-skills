#!/usr/bin/env node
// tools/publish.js
//
// Register a skill version with the cicy-skills registry Worker.
//
// IMPORTANT: This script does NOT upload the zip itself. The zip is expected
// to already be a published GitHub Releases asset at:
//   https://github.com/<repo>/releases/download/<tag>/<name>-<version>.zip
//
// This script:
//   1. Reads manifest.json + the local zip (<name>-<version>.zip)
//   2. Computes sha256 + size
//   3. Optionally HEADs the GitHub Releases URL to confirm reachability
//   4. POSTs the (manifest, verify) tuple to <registry>/v1/admin/publish
//
// Usage:
//   ADMIN_TOKEN=... node tools/publish.js skills/cping
//   ADMIN_TOKEN=... node tools/publish.js skills/cping \
//     --registry https://skills.cicy-ai.com \
//     --repo cicy-ai/cicy-skills \
//     --zip dist/cping-1.0.0.zip
//
// Defaults:
//   --registry  https://skills.cicy-ai.com
//   --repo      cicy-ai/cicy-skills
//   --zip       dist/<name>-<version>.zip
//
// Exit codes:
//   0 — published
//   1 — publish failed (server error)
//   2 — usage / validation failed
//   3 — IO error
//   4 — auth missing

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';

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

// ── compute sha256 + size ──────────────────────────────────────────────────

const buf = readFileSync(zipPath);
const sha256 = createHash('sha256').update(buf).digest('hex');
const size = statSync(zipPath).size;

// ── derive download_url and source ─────────────────────────────────────────

const tag = `${name}-v${version}`;
const asset = `${name}-${version}.zip`;
const downloadUrl = `https://github.com/${REPO}/releases/download/${tag}/${asset}`;

// inject publish fields into manifest
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

// ── HEAD the download_url to confirm asset exists ─────────────────────────

if (!argv.includes('--skip-head')) {
  try {
    const res = await fetch(downloadUrl, { method: 'HEAD', redirect: 'follow' });
    if (!res.ok) {
      process.stderr.write(
        `download_url unreachable: ${res.status} ${res.statusText}\n`,
      );
      process.stderr.write(`url: ${downloadUrl}\n`);
      process.stderr.write(
        'hint: create the GitHub Release first (or pass --skip-head to bypass)\n',
      );
      process.exit(2);
    }
    const remoteSize = Number(res.headers.get('content-length') || 0);
    if (remoteSize > 0 && remoteSize !== size) {
      process.stderr.write(
        `size mismatch: local=${size} remote=${remoteSize}\n`,
      );
      process.exit(2);
    }
  } catch (e) {
    process.stderr.write(`HEAD failed: ${e.message}\n`);
    process.exit(2);
  }
}

// ── POST to registry ───────────────────────────────────────────────────────

const skipHead = argv.includes('--skip-head');
const url = `${REGISTRY.replace(/\/$/, '')}/v1/admin/publish${skipHead ? '?skip_head=1' : ''}`;
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
  process.stdout.write(`  download:    ${downloadUrl}\n`);
  process.stdout.write(`  sha256:      ${sha256}\n`);
  process.stdout.write(`  size:        ${size} bytes\n`);
  process.stdout.write(`  manifest_url:${REGISTRY}/v1/skills/${name}/${version}\n`);
}
