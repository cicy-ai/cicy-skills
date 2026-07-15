#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// no args → help, exit 0
const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('scrm'));

// help exits 0 with output
const help = runSkill(D, ['help']);
assert('help exits 0', help.status === 0);
assert('help has output', help.stdout.length > 0);

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// read command with unreachable API → non-0
const un = runSkill(D, ['unread'], { SCRM_API: 'http://127.0.0.1:1' });
assert('unread without server exits non-0', un.status !== 0);

// session without a name → arg error, non-0 (server-independent)
const noName = runSkill(D, ['session']);
assert('session without name exits non-0', noName.status !== 0);

finish();
