#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';

const skillDir = new URL('..', import.meta.url).pathname;

const help = runSkill(skillDir, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help documents Shorts URLs', help.stdout.includes('YouTube Short'));
assert('--help documents MP3 extraction', help.stdout.includes('--audio'));
assert('--help documents browser cookies', help.stdout.includes('--cookies-from-browser'));

const noArgs = runSkill(skillDir, []);
assert('no arguments exits 0 with help', noArgs.status === 0);
assert('no arguments prints usage', `${noArgs.stdout}\n${noArgs.stderr}`.includes('Usage:'));

const invalid = runSkill(skillDir, ['https://example.com/not-youtube']);
assert('non-YouTube URL exits nonzero', invalid.status !== 0);
assert(
  'non-YouTube URL reports validation error',
  `${invalid.stdout}\n${invalid.stderr}`.toLowerCase().includes('youtube'),
);

finish();
