#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// no args → shows help (exit 0)
const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('agent-electron'));

// --help exits 0 with output
const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// proxy missing args → non-0
const proxyBad = runSkill(D, ['proxy', '--json']);
assert('proxy without args exits non-0', proxyBad.status !== 0);

// open missing --url → non-0
const openBad = runSkill(D, ['open', '99', '--json']);
assert('open without --url exits non-0', openBad.status !== 0);

// cdp missing args → non-0
const cdpBad = runSkill(D, ['cdp', '4', '--json']);
assert('cdp without method exits non-0', cdpBad.status !== 0);

finish();
