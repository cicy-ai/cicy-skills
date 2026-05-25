#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// no args → shows help (exit 0)
const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('telegram-web'));

// --help exits 0 with output
const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// messages missing chatId → non-0
const msgBad = runSkill(D, ['messages', '--json']);
assert('messages without chatId exits non-0', msgBad.status !== 0);

// send missing text → non-0
const sendBad = runSkill(D, ['send', '777000', '--json']);
assert('send without text exits non-0', sendBad.status !== 0);

// eval missing expr → non-0
const evalBad = runSkill(D, ['eval', '--json']);
assert('eval without expression exits non-0', evalBad.status !== 0);

// status with no session file should not crash (in test harness, no global.json
// is guaranteed — but loading session itself shouldn't error). Skip if
// can't reach cicy-code; this is purely a CLI shape test.

finish();
