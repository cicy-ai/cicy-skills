#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('cicy-knowledge'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// add with no title → usage error (exit 2), independent of server reachability.
const addNoTitle = runSkill(D, ['add']);
assert('add without title exits non-0', addNoTitle.status !== 0);

// list --json → valid JSON when the server is up, else a non-0 exit.
const list = runSkill(D, ['list', '--json']);
const listJson = (() => { try { JSON.parse(list.stdout); return true; } catch { return false; } })();
assert('list --json is valid JSON or exits non-0', listJson || list.status !== 0);

finish();
