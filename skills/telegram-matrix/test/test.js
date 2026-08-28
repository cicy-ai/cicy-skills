#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('help names the skill', noArgs.stdout.includes('telegram-matrix'));
assert('help lists open', noArgs.stdout.includes('telegram-matrix open'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits 2', bad.status === 2);

const confirm = runSkill(D, ['remove-profile', '1']);
assert('destructive command without --yes exits 3', confirm.status === 3);

const missing = runSkill(D, ['set-proxy']);
assert('missing args exits 2', missing.status === 2);

finish();
