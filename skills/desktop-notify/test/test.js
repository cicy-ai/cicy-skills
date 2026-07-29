#!/usr/bin/env node
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const skillDir = process.env.SKILL_DIR;
assert.ok(skillDir, 'SKILL_DIR is required');
const cli = join(skillDir, 'bin', 'desktop-notify');
const mockDir = mkdtempSync(join(tmpdir(), 'desktop-notify-test-'));
const mockCLI = join(mockDir, 'agent-desktop');

writeFileSync(mockCLI, `#!/bin/sh
case "$1" in
  tools) printf '%s\\n' 'notify exec_js' ;;
  rpc) printf '%s\\n' '{"ok":true}' ;;
  *) exit 1 ;;
esac
`);
chmodSync(mockCLI, 0o755);

function run(args) {
  return spawnSync('node', [cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: mockDir + delimiter + process.env.PATH },
  });
}

let result = run(['help']);
assert.equal(result.status, 0);
assert.match(result.stdout, /desktop-notify send/);

result = run(['status', '--json']);
assert.equal(result.status, 0, result.stderr);
assert.deepEqual(JSON.parse(result.stdout), {
  ok: true,
  notify_rpc: true,
  fallback: null,
});

result = run(['send', 'Build complete', '--body', 'Ready', '--json']);
assert.equal(result.status, 0, result.stderr);
assert.deepEqual(JSON.parse(result.stdout), { ok: true });

result = run(['send']);
assert.equal(result.status, 1);
assert.match(result.stderr, /需要 <title>/);

process.stdout.write('desktop-notify tests passed\n');
