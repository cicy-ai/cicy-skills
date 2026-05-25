#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

const list = runSkill(D, ['list', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('list with no ssh config exits 0', list.status === 0);
let parsed; try { parsed = JSON.parse(list.stdout); } catch {}
assert('list --json is valid JSON', !!parsed);

const show = runSkill(D, ['show', 'no-such-host-xyz', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('show unknown host exits non-0', show.status !== 0);

finish();
