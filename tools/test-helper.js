// tools/test-helper.js — minimal sync test helpers for skill test suites.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

let _p = 0, _f = 0;

export function runSkill(skillDir, args, env = {}) {
  const manifest = JSON.parse(readFileSync(join(skillDir, 'manifest.json'), 'utf8'));
  return spawnSync('node', [join(skillDir, manifest.entry), ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 10000,
  });
}

export function assert(label, ok, detail = '') {
  if (ok) { process.stdout.write(`  ✓ ${label}\n`); _p++; }
  else { process.stdout.write(`  ✗ ${label}${detail ? '\n    ' + detail : ''}\n`); _f++; }
}

export function finish() {
  process.stdout.write(`  ${_p} passed, ${_f} failed\n`);
  process.exit(_f > 0 ? 1 : 0);
}
