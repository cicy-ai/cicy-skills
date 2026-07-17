#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = new URL('..', import.meta.url).pathname;
// An empty venv dir + a bogus interpreter name makes findPython fail fast,
// so tests never depend on (or trigger) a real rapidocr install.
const EMPTY = mkdtempSync(join(tmpdir(), 'ocr-test-'));
const NO_PY = { OCR_VENV_DIR: join(EMPTY, 'venv'), OCR_PYTHON: join(EMPTY, 'no-such-python') };

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('help mentions install', help.stdout.includes('install'));
assert('help mentions --json', help.stdout.includes('--json'));

const noArgs = runSkill(D, []);
assert('no args exits non-0', noArgs.status !== 0);

const badOpt = runSkill(D, ['--nope']);
assert('unknown option exits 2', badOpt.status === 2);

const missing = runSkill(D, ['recognize', '/no/such/image.png'], NO_PY);
assert('missing file exits 2', missing.status === 2);
assert('missing file names the path', missing.stderr.includes('/no/such/image.png'));

const noFiles = runSkill(D, ['recognize'], NO_PY);
assert('recognize without file exits 2', noFiles.status === 2);

const status = runSkill(D, ['status'], NO_PY);
assert('status exits 0', status.status === 0);
assert('status shows venv dir', status.stdout.includes(join(EMPTY, 'venv')));

// existing file but no usable python → exit 1 with the install hint
const self = new URL('test.js', import.meta.url).pathname;
const noPy = runSkill(D, [self], NO_PY);
assert('no python exits 1', noPy.status === 1);
assert('no python suggests ocr install', noPy.stderr.includes('ocr install'));

finish();
