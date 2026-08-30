#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = new URL('..', import.meta.url).pathname;
// Keep every run away from the real ~/cicy-ai/db/vnc.json.
const STATE = join(mkdtempSync(join(tmpdir(), 'vnc-test-')), 'vnc.json');
const ENV = { VNC_STATE: STATE };

const noArgs = runSkill(D, [], ENV);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help'], ENV);
assert('--help exits 0', help.status === 0);
assert('--help lists start', /\bstart\b/.test(help.stdout));

const bad = runSkill(D, ['badcmd'], ENV);
assert('unknown subcommand exits non-0', bad.status !== 0);

// status --json → valid JSON with a displays array
const status = runSkill(D, ['status', '--json'], ENV);
assert('status --json exits 0', status.status === 0);
const parsed = (() => { try { return JSON.parse(status.stdout); } catch { return null; } })();
assert('status --json is valid JSON', parsed !== null);
assert('status --json has displays array', Array.isArray(parsed?.displays));

// errors are JSON too when --json is passed
const badJson = runSkill(D, ['screenshot', ':99', '--json'], ENV);
assert('missing display fails', badJson.status !== 0);
assert(
  'error is JSON under --json',
  (() => { try { return JSON.parse(badJson.stdout).ok === false; } catch { return false; } })(),
);

// stop on an idle display is a no-op, not a crash
const stop = runSkill(D, ['stop', ':99', '--json'], ENV);
assert('stop on idle display exits 0', stop.status === 0);
assert(
  'stop reports nothing stopped',
  (() => { try { return JSON.parse(stop.stdout).stopped.length === 0; } catch { return false; } })(),
);

// display parsing: bare number and colon form are equivalent
const s1 = runSkill(D, ['status', '1', '--json'], ENV);
const s2 = runSkill(D, ['status', ':1', '--json'], ENV);
assert('status accepts bare display number', s1.status === 0 && s2.status === 0);
assert('bare and colon display forms agree', s1.stdout === s2.stdout);

finish();
