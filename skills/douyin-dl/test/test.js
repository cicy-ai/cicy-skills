#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits non-0 (needs input)', noArgs.status !== 0);
assert('no args prints usage', noArgs.stdout.includes('douyin-dl'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help mentions transcribe', help.stdout.includes('transcribe') || help.stdout.includes('转写'));

const bad = runSkill(D, ['--nope']);
assert('unknown option exits non-0', bad.status !== 0);

finish();
