#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// gmail list without OAuth → non-0
const gmail = runSkill(D, ['gmail', 'list', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('gmail list without oauth exits non-0', gmail.status !== 0);

// sheets read without args → non-0
const sheets = runSkill(D, ['sheets', 'read']);
assert('sheets read without spreadsheet id exits non-0', sheets.status !== 0);

finish();
