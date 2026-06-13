#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// --help exits 0 and documents the commands.
const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);
assert('help mentions create', help.stdout.includes('create'));
assert('help mentions tools', help.stdout.includes('tools'));

// no args → shows help, exits non-0 (2).
const noArgs = runSkill(D, []);
assert('no args exits non-0', noArgs.status !== 0);

// unknown subcommand → exit 2.
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits 2', bad.status === 2);

// create without a name → usage error (exit 2), before any network.
const noName = runSkill(D, ['create'], { CICY_API_TOKEN: 'x', CICY_API_PORT: '1' });
assert('create without name exits 2', noName.status === 2);

// show/delete without a name → usage error (exit 2).
const showNoName = runSkill(D, ['show'], { CICY_API_TOKEN: 'x', CICY_API_PORT: '1' });
assert('show without name exits 2', showNoName.status === 2);
const delNoName = runSkill(D, ['delete'], { CICY_API_TOKEN: 'x', CICY_API_PORT: '1' });
assert('delete without name exits 2', delNoName.status === 2);

// missing token (no global.json, no env) → exit 3.
const noToken = runSkill(D, ['list'], { CICY_API_TOKEN: '', CICY_GLOBAL_JSON: '/nonexistent/global.json' });
assert('missing token exits 3', noToken.status === 3);

// reachable command without a server → network error (exit 3).
const noServer = runSkill(D, ['list'], { CICY_API_TOKEN: 'x', CICY_API_PORT: '1' });
assert('list without server exits non-0', noServer.status !== 0);

finish();
