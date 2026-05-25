#!/usr/bin/env node
// tools/test-skill.js
//
// Run the test suite for a skill (skills/<name>/test/test.js).
//
// Usage:
//   node tools/test-skill.js skills/cping
//   node tools/test-skill.js --all          # run all skills
//
// Exit codes:
//   0 — all tests passed
//   1 — one or more tests failed
//   2 — usage error / no test file found
//   3 — IO error

import { existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const argv = process.argv.slice(2);
const all = argv.includes('--all');

let dirs = [];
if (all) {
  const skillsRoot = resolve('skills');
  dirs = readdirSync(skillsRoot).map((d) => join(skillsRoot, d));
} else {
  const skillDir = argv.find((a) => !a.startsWith('--'));
  if (!skillDir) {
    process.stderr.write('usage: test-skill.js <skill-dir> | --all\n');
    process.exit(2);
  }
  dirs = [resolve(skillDir)];
}

let passed = 0, failed = 0, skipped = 0;

for (const skillDir of dirs) {
  const name = basename(skillDir);
  const testFile = join(skillDir, 'test', 'test.js');
  if (!existsSync(testFile)) {
    process.stdout.write(`  SKIP  ${name} (no test/test.js)\n`);
    skipped++;
    continue;
  }
  const r = spawnSync('node', [testFile], { stdio: 'inherit', env: { ...process.env, SKILL_DIR: skillDir } });
  if (r.status === 0) {
    passed++;
  } else {
    process.stderr.write(`✗ ${name} tests FAILED (exit ${r.status})\n`);
    failed++;
  }
}

process.stdout.write(`\n${passed} passed, ${failed} failed, ${skipped} skipped\n`);
process.exit(failed > 0 ? 1 : 0);
