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

// new in 0.2.0 — argument gates for the login/reset/batch commands. These run
// without a cicy-desktop attached, so they only cover the pre-transport checks.
for (const [name, args] of [
  ['set-login with no phone', ['set-login', '2']],
  ['open-code with no index', ['open-code']],
  ['reset with no index', ['reset']],
]) assert(`${name} exits 2`, runSkill(D, args).status === 2);

assert('reset without --yes exits 3 (it destroys a login)', runSkill(D, ['reset', '2']).status === 3);
assert('batch rejects a bad mode', runSkill(D, ['batch', 'sideways']).status === 2);

const h = runSkill(D, ['--help']).stdout;
for (const c of ['set-login', 'open-code', 'reset', 'batch'])
  assert(`help documents ${c}`, h.includes(`telegram-matrix ${c}`));

finish();
