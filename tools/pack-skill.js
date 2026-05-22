#!/usr/bin/env node
// tools/pack-skill.js
//
// Package a skill directory into <name>-<version>.zip with sha256 manifest.
// Uses the system `zip` binary (universal on Linux/macOS; Windows users can
// install via WSL or Git Bash). Zero npm dependencies.
//
// Usage:
//   node tools/pack-skill.js skills/cping
//   node tools/pack-skill.js skills/cping --out dist
//   node tools/pack-skill.js skills/cping --json
//
// Output:
//   <out>/<name>-<version>.zip
//   <out>/<name>-<version>.zip.sha256

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// ── arg parsing ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const json = argv.includes('--json');
const outIdx = argv.indexOf('--out');
const outDir = outIdx >= 0 ? argv[outIdx + 1] : 'dist';
const positional = argv.filter(
  (a, i) => !a.startsWith('--') && argv[i - 1] !== '--out',
);
const skillDir = positional[0];

if (!skillDir) {
  process.stderr.write('usage: pack-skill.js <skill-dir> [--out <dir>] [--json]\n');
  process.exit(2);
}

// ── load manifest ──────────────────────────────────────────────────────────

const SKILL_DIR = resolve(skillDir);
const manifestPath = join(SKILL_DIR, 'manifest.json');
if (!existsSync(manifestPath)) {
  process.stderr.write(`manifest.json not found in ${SKILL_DIR}\n`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const { name, version } = manifest;
if (!name || !version) {
  process.stderr.write('manifest.json missing name/version\n');
  process.exit(2);
}
if (basename(SKILL_DIR) !== name) {
  process.stderr.write(
    `directory name "${basename(SKILL_DIR)}" must equal manifest.name "${name}"\n`,
  );
  process.exit(2);
}

// ── prepare output ─────────────────────────────────────────────────────────

const OUT_DIR = resolve(outDir);
mkdirSync(OUT_DIR, { recursive: true });
const zipName = `${name}-${version}.zip`;
const zipPath = join(OUT_DIR, zipName);
const sha256Path = `${zipPath}.sha256`;

// remove old artifacts
try { execFileSync('rm', ['-f', zipPath, sha256Path]); } catch {}

// ── run zip ────────────────────────────────────────────────────────────────
// Tries the system `zip` binary first; falls back to `python3 -m zipfile` for
// hosts that don't have zip (some minimal Linux containers).

const PARENT = resolve(SKILL_DIR, '..');
const ENTRY = basename(SKILL_DIR);

const excludeRel = [
  'node_modules',
  '.cache',
  '.git',
  'test',
  'tests',
  '.DS_Store',
];

function tryZip() {
  const excludes = excludeRel.flatMap((p) => [`${ENTRY}/${p}/*`, `${ENTRY}/${p}`]);
  // also exclude any *.zip / *.log in skill root
  excludes.push(`${ENTRY}/*.zip`, `${ENTRY}/*.log`, `${ENTRY}/.env*`);
  execFileSync(
    'zip',
    ['-r', '-q', '-X', zipPath, ENTRY, '-x', ...excludes],
    { cwd: PARENT, stdio: ['ignore', 'inherit', 'inherit'] },
  );
}

function tryPython() {
  // Use python3 to walk SKILL_DIR and zip into zipPath, with same excludes.
  const script = `
import os, sys, zipfile, fnmatch
parent = sys.argv[1]
entry = sys.argv[2]
out = sys.argv[3]
exclude_dirs = set(${JSON.stringify(excludeRel)})
exclude_globs = ['*.zip', '*.log', '.env', '.env.*']
src = os.path.join(parent, entry)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src):
        # prune excluded dirs in place
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if any(fnmatch.fnmatch(f, g) for g in exclude_globs):
                continue
            full = os.path.join(root, f)
            arc = os.path.relpath(full, parent)
            zf.write(full, arc)
`;
  execFileSync('python3', ['-c', script, PARENT, ENTRY, zipPath], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
}

let zipMethod;
try {
  tryZip();
  zipMethod = 'zip';
} catch (e1) {
  try {
    tryPython();
    zipMethod = 'python3';
  } catch (e2) {
    process.stderr.write(`zip failed: ${e1.message}\n`);
    process.stderr.write(`python3 fallback failed: ${e2.message}\n`);
    process.stderr.write('hint: install zip or python3\n');
    process.exit(1);
  }
}

// ── sha256 + size ──────────────────────────────────────────────────────────

const buf = readFileSync(zipPath);
const sha256 = createHash('sha256').update(buf).digest('hex');
const size = statSync(zipPath).size;

writeFileSync(sha256Path, `${sha256}  ${zipName}\n`);

// ── output ─────────────────────────────────────────────────────────────────

const result = {
  ok: true,
  name,
  version,
  zip: zipPath,
  sha256_file: sha256Path,
  sha256,
  size,
  zip_method: zipMethod,
};

if (json) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else {
  process.stdout.write(`✓ packed ${name}@${version}\n`);
  process.stdout.write(`  zip:    ${zipPath}\n`);
  process.stdout.write(`  size:   ${size} bytes\n`);
  process.stdout.write(`  sha256: ${sha256}\n`);
}
