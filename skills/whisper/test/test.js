#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = new URL('..', import.meta.url).pathname;
// Point the model dir at an empty temp dir so tests never touch (or depend
// on) the real ~/.cache/whisper-cpp.
const EMPTY = mkdtempSync(join(tmpdir(), 'whisper-test-'));
const ENV = { WHISPER_MODEL_DIR: EMPTY };

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('help mentions transcribe', help.stdout.includes('transcribe'));
assert('help mentions install', help.stdout.includes('install'));

const noArgs = runSkill(D, []);
assert('no args exits non-0', noArgs.status !== 0);

const bad = runSkill(D, ['definitely-not-a-command'], ENV);
assert('unknown command (non-file) exits 2', bad.status === 2);

const models = runSkill(D, ['models'], ENV);
assert('models exits 0', models.status === 0);
assert('models lists base', models.stdout.includes('base'));
assert('models lists large-v3-turbo', models.stdout.includes('large-v3-turbo'));

const status = runSkill(D, ['status'], ENV);
assert('status exits 0', status.status === 0);
assert('status shows model dir', status.stdout.includes(EMPTY));

const missing = runSkill(D, ['transcribe', '/no/such/file.mp3'], ENV);
assert('transcribe missing file exits 2', missing.status === 2);

const noFiles = runSkill(D, ['transcribe'], ENV);
assert('transcribe without file exits 2', noFiles.status === 2);

const badModel = runSkill(D, ['pull', 'not-a-model'], ENV);
assert('pull unknown model exits 2', badModel.status === 2);

const rmNothing = runSkill(D, ['rm', 'base'], ENV);
assert('rm with nothing local exits 1', rmNothing.status === 1);

const badOpt = runSkill(D, ['transcribe', '--nope'], ENV);
assert('unknown transcribe option exits 2', badOpt.status === 2);

// a real (empty) file with a native ext + empty model dir + no network is the
// auto-download path — with an unknown model name it must fail cleanly first.
const f = join(EMPTY, 'x.wav');
writeFileSync(f, '');
const unknownModel = runSkill(D, ['transcribe', f, '-m', 'bogus'], ENV);
assert('transcribe with unknown model exits 2', unknownModel.status === 2);

finish();
