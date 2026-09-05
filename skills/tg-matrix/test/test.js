#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// no args → help, exit 0
const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints skill name', noArgs.stdout.includes('tg-matrix'));

// --help exits 0 with usage
const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help documents open/status/ls', /open/.test(help.stdout) && /status/.test(help.stdout) && /ls/.test(help.stdout));

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// open with no target → usage error (exit 2)
const noTarget = runSkill(D, ['open']);
assert('open without target exits non-0', noTarget.status !== 0);

// missing control config → transport error, never a hard-coded fallback
const noCfg = runSkill(D, ['status', 'xs-0000'], { CICY_DESKTOP_CTRL: '/nonexistent/desktop-ctrl.json' });
assert('missing config exits non-0', noCfg.status !== 0);
assert('missing config explains why', /cannot read|missing/.test(noCfg.stdout + noCfg.stderr));

finish();
