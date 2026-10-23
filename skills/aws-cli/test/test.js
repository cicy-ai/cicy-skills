#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0 && noArgs.stdout.length > 0);
const help = runSkill(D, ['--help']);
assert('--help exits 0 with output', help.status === 0 && help.stdout.includes('aws-cli'));
assert('unknown subcommand exits 2', runSkill(D, ['badcmd']).status === 2);
assert('exec without -- is a usage error', runSkill(D, ['exec', '--account', 'x']).status === 2);
assert('whoami without --account is a usage error', runSkill(D, ['whoami'], { CICY_API_TOKEN: 't', CICY_API_BASE: 'http://127.0.0.1:9' }).status === 2);
const st = runSkill(D, ['status', '--json'], { CICY_API_TOKEN: 't', CICY_API_BASE: 'http://127.0.0.1:9' });
assert('status --json is valid JSON even when cicy-code is down', (() => { try { JSON.parse(st.stdout); return true; } catch { return false; } })());
finish();
