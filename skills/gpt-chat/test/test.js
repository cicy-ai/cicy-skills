#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// without API access → non-0 (network / auth error)
const r = runSkill(D, ['hello', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('without config exits non-0', r.status !== 0);

finish();
