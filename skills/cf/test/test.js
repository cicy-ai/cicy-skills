#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// config set requires key=value
const bad = runSkill(D, ['config', 'set']);
assert('config set no args exits non-0', bad.status !== 0);

// status --json → valid JSON (ok:true even if unconfigured)
const status = runSkill(D, ['status', '--json']);
assert('status --json exits 0', status.status === 0);
let s; try { s = JSON.parse(status.stdout); } catch {}
assert('status --json is valid JSON', !!s);
assert('status --json has ok field', 'ok' in (s || {}));

// curl without config → non-0
const curl = runSkill(D, ['curl', '/zones', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('curl without api_token exits non-0', curl.status !== 0);

finish();
