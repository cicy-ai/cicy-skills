#!/usr/bin/env node
// tools/yank.js
//
// Yank (un-publish) a skill version from the cicy-skills registry — the inverse
// of publish.js. Deleting a skill's directory from this repo does NOT remove it
// from the registry: publishing is one-way (tag → CI → POST). To take a skill
// off skills.cicy-ai.com you must yank it here.
//
// Yank is a per-version SOFT delete on the Worker:
//   - the version is marked { yanked: true } (it stays in the KV versions list)
//   - it is dropped from `latest` and the public catalog (`skill list` / market)
//   - download returns 410 Gone
// To make a skill disappear from the market entirely, EVERY published version
// must be yanked (otherwise `latest` re-derives to the highest non-yanked one
// and the skill keeps showing). `--all` does this in one shot.
//
// A yank is reversible: re-publishing the same (name, version) clears it.
//
// Usage:
//   ADMIN_TOKEN=... node tools/yank.js <name> <version>     # one version
//   ADMIN_TOKEN=... node tools/yank.js <name> --all         # every version (off the market)
//   ADMIN_TOKEN=... node tools/yank.js <name> --all --registry https://skills.cicy-ai.com
//
// ADMIN_TOKEN is the Worker's admin secret. Locally it lives in
// ~/cicy-ai/db/skills-registry-admin.json (`admin_token`) — read it into the
// env, never paste it on the command line:
//   ADMIN_TOKEN=$(jq -r .admin_token ~/cicy-ai/db/skills-registry-admin.json) \
//     node tools/yank.js cping --all
//
// Exit codes:
//   0 — yanked (all requested versions)
//   1 — one or more yanks failed (server error)
//   2 — usage / validation failed
//   4 — auth missing

const argv = process.argv.slice(2);
const json = argv.includes('--json');
const all = argv.includes('--all');
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const positional = argv.filter(
  (a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'),
);

const name = positional[0];
const versionArg = positional[1];

if (!name || (!all && !versionArg)) {
  process.stderr.write(
    'usage: yank.js <name> <version>   (one version)\n' +
    '       yank.js <name> --all       (every version — removes from the market)\n' +
    '       [--registry URL] [--json]\n',
  );
  process.exit(2);
}
if (all && versionArg) {
  process.stderr.write('pass either <version> or --all, not both\n');
  process.exit(2);
}

const REGISTRY = (flag('registry', 'https://skills.cicy-ai.com')).replace(/\/$/, '');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  process.stderr.write(
    'ADMIN_TOKEN env var required.\n' +
    'Local: ADMIN_TOKEN=$(jq -r .admin_token ~/cicy-ai/db/skills-registry-admin.json) node tools/yank.js ...\n',
  );
  process.exit(4);
}

// ── resolve the version list ────────────────────────────────────────────────

async function listVersions() {
  const url = `${REGISTRY}/v1/skills/${encodeURIComponent(name)}/versions`;
  let res;
  try { res = await fetch(url); }
  catch (e) { process.stderr.write(`GET ${url} failed: ${e.message}\n`); process.exit(1); }
  if (res.status === 404) {
    process.stderr.write(`skill not found in registry: ${name}\n`);
    process.exit(1);
  }
  if (!res.ok) {
    process.stderr.write(`GET ${url} → HTTP ${res.status}\n`);
    process.exit(1);
  }
  const body = await res.json().catch(() => ({}));
  const versions = (body?.data?.versions || []).map((v) => v.version);
  // de-dupe (republish incidents can leave duplicate version rows)
  return [...new Set(versions)];
}

async function yankOne(version) {
  const url = `${REGISTRY}/v1/admin/skills/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    });
  } catch (e) {
    return { version, ok: false, status: 0, error: e.message };
  }
  return { version, ok: res.status === 200, status: res.status };
}

// ── run ──────────────────────────────────────────────────────────────────

const targets = all ? await listVersions() : [versionArg];
if (targets.length === 0) {
  process.stderr.write(`no published versions for ${name} — nothing to yank\n`);
  process.exit(0);
}

const results = [];
for (const v of targets) {
  const r = await yankOne(v);
  results.push(r);
  if (!json) {
    process.stderr.write(`  ${r.ok ? '✓' : '✗'} yank ${name}@${v} → HTTP ${r.status}${r.error ? ` (${r.error})` : ''}\n`);
  }
}

const failed = results.filter((r) => !r.ok);
const out = {
  ok: failed.length === 0,
  name,
  registry: REGISTRY,
  requested: targets.length,
  yanked: results.length - failed.length,
  failed: failed.map((r) => ({ version: r.version, status: r.status, error: r.error })),
};

if (json) {
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} else if (failed.length === 0) {
  process.stderr.write(`✓ yanked ${out.yanked}/${out.requested} version(s) of ${name}${all ? ' — now off the market' : ''}\n`);
} else {
  process.stderr.write(`✗ ${failed.length}/${out.requested} yank(s) failed\n`);
}

process.exit(failed.length === 0 ? 0 : 1);
