#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// no args → non-0 (python script will error with no agent-id)
const noArgs = runSkill(D, []);
assert('no args exits non-0', noArgs.status !== 0);

// non-existent agent id → non-0
const bad = runSkill(D, ['no-such-agent-id-xyz']);
assert('unknown agent exits non-0', bad.status !== 0);

finish();
