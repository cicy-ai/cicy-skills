#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// ping with a definitely-bogus client_id should always fail, regardless of
// whether other clients happen to be connected in the test environment.
const ping = runSkill(D, ['ping', '__no_such_client__', '--json']);
assert('ping with bogus client_id exits non-0', ping.status !== 0);

finish();
