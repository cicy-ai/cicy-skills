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
assert('--help lists tabs discovery', help.stdout.includes('tabs [accountIdx]'));
assert('--help lists profiles discovery', help.stdout.includes('profiles [--json]'));
assert('--help lists all-webcontents discovery', help.stdout.includes('webcontents [--json]'));
assert('--help explains account/profile/session identity', help.stdout.includes('accountIdx` = profile id = session id'));
assert('--help marks dual-id commands', help.stdout.includes('close <winId|webContentsId>'));
assert('--help marks dual-id CDP', help.stdout.includes('cdp <winId|webContentsId>'));
assert('--help marks dual-id snapshot', help.stdout.includes('snapshot <winId|webContentsId>'));

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

// Typed ids are parsed before any RPC is attempted. This distinguishes a
// malformed tab reference from an unavailable desktop connection.
const tabBad = runSkill(D, ['window', 'tab:nope', '--json']);
assert('malformed webContentsId exits non-0', tabBad.status !== 0);
assert('malformed webContentsId reports numeric target', tabBad.stdout.includes('must be a number'));

finish();
