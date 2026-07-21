#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints usage', noArgs.stdout.includes('desktop-notify send'));

const help = runSkill(D, ['help']);
assert('help exits 0', help.status === 0);
assert('help mentions status subcommand', help.stdout.includes('status'));

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

const badFlag = runSkill(D, ['send', 't', '--nope']);
assert('unknown flag exits non-0', badFlag.status !== 0);

// send without title fails fast, before touching any transport
const noTitle = runSkill(D, ['send']);
assert('send without title exits non-0', noTitle.status !== 0);
assert('send without title says title required', noTitle.stderr.includes('title'));

finish();
