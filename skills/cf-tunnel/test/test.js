#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// status --json → valid JSON (ok:true even if unconfigured)
const status = runSkill(D, ['status', '--json']);
assert('status --json exits 0', status.status === 0);
let s; try { s = JSON.parse(status.stdout); } catch {}
assert('status --json is valid JSON', !!s);

// add without required args → non-0
const add = runSkill(D, ['add']);
assert('add without args exits non-0', add.status !== 0);

// list without tunnel_id → non-0
const list = runSkill(D, ['list', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('list without tunnel config exits non-0', list.status !== 0);

finish();
