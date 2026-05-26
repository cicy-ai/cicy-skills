#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// --help
const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);
assert('help mentions spawn-role', help.stdout.includes('spawn-role'));

// no args → exit 2 (prints help)
const noArgs = runSkill(D, []);
assert('no args exits non-0', noArgs.status !== 0);

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// roles → exit 0, lists the bundled roles (offline, no server)
const roles = runSkill(D, ['roles']);
assert('roles exits 0', roles.status === 0);
assert('roles lists qa', roles.stdout.includes('qa'));
assert('roles lists dev-senior', roles.stdout.includes('dev-senior'));

// spawn-role with unknown role → exit 2 (before any network)
const badRole = runSkill(D, ['spawn-role', 'nope'], { CICY_API_TOKEN: 'x' });
assert('spawn-role unknown role exits 2', badRole.status === 2);

// spawn-role valid role but no server → non-0 (create fails)
const noServer = runSkill(D, ['spawn-role', 'qa'], { CICY_API_TOKEN: 'x', CICY_API_PORT: '1' });
assert('spawn-role without server exits non-0', noServer.status !== 0);

finish();
