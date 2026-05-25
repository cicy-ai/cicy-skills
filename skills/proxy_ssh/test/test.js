#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// no args → shows usage (exit 0 from argparse)
const noArgs = runSkill(D, []);
assert('no args exits 0 (usage)', noArgs.status === 0);
assert('no args prints usage', noArgs.stdout.includes('proxy_ssh'));

// list → exits 0 (empty) or valid JSON or non-0
const list = runSkill(D, ['list', '--json'], { HOME: '/tmp/no-such-home-xyz' });
const isJson = (() => { try { JSON.parse(list.stdout); return true; } catch { return false; } })();
assert('list is JSON or exits non-0', isJson || list.status !== 0);

// create without required args → non-0
const create = runSkill(D, ['create']);
assert('create without args exits non-0', create.status !== 0);

// start with unknown profile → non-0
const start = runSkill(D, ['start', 'no-such-profile-xyz']);
assert('start unknown profile exits non-0', start.status !== 0);

finish();
