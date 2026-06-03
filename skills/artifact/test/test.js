#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help mentions cicyArtifact', /cicyArtifact/.test(help.stdout));

const tools = runSkill(D, ['tools']);
assert('tools exits 0', tools.status === 0);
assert('tools lists open', /open/.test(tools.stdout));

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// usage errors for arg-requiring commands (no daemon round-trip).
const open = runSkill(D, ['open']);
assert('open without url exits non-0', open.status !== 0);

// bogus client_id always fails resolution regardless of environment.
const geturl = runSkill(D, ['geturl', '--client', '__no_such_client__', '--json']);
assert('geturl with bogus client exits non-0', geturl.status !== 0);

finish();
