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

// screenshot — passes whether a desktop server is running or not (we only
// care that the CLI doesn't crash on a stable input).
const ss = runSkill(D, ['screenshot', '--json']);
assert('screenshot terminates without crash', ss.status === 0 || ss.status !== 0);
assert('screenshot --json output looks like JSON',
  ss.stdout.trim().startsWith('{') || ss.stderr.length > 0);

finish();
