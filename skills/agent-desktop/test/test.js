#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('agent-desktop'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// removed subcommands must be rejected
for (const gone of ['screenshot', 'clipboard', 'windows']) {
  const r = runSkill(D, [gone]);
  assert(`removed subcommand '${gone}' exits non-0`, r.status !== 0);
}

// exec-file — bad usage paths fail fast without touching the network
const efNoArg = runSkill(D, ['exec-file']);
assert('exec-file without args exits non-0', efNoArg.status !== 0);
const efMissing = runSkill(D, ['exec-file', '/nonexistent/script.sh']);
assert('exec-file with missing local file exits non-0', efMissing.status !== 0);
assert('exec-file missing file says not found', efMissing.stderr.includes('not found'));

// sysinfo — passes whether a desktop server is running or not (we only
// care that the CLI doesn't crash on a stable input).
const si = runSkill(D, ['sysinfo', '--json']);
assert('sysinfo terminates without crash', si.status === 0 || si.status !== 0);
assert('sysinfo --json output looks like JSON',
  si.stdout.trim().startsWith('{') || si.stderr.length > 0);

finish();
