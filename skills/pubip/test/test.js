#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help mentions ifconfig.me', help.stdout.includes('ifconfig.me'));

const helpShort = runSkill(D, ['-h']);
assert('-h exits 0', helpShort.status === 0);

const helpWord = runSkill(D, ['help']);
assert('help word exits 0', helpWord.status === 0);

finish();
