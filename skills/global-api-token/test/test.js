#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// show with missing config → non-0 (no file) or valid JSON error
const show = runSkill(D, ['show', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('show with missing config exits non-0', show.status !== 0);

finish();
