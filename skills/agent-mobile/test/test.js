#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// ── basic smoke (no network / no desktop client required) ───────────────────

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help mentions devices', help.stdout.includes('devices'));
assert('--help mentions screenshot', help.stdout.includes('screenshot'));
assert('--help mentions install', help.stdout.includes('install'));
assert('--help mentions tap', help.stdout.includes('tap'));

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// usage errors are detected before any network call (exit 2)
const tapNoArgs = runSkill(D, ['tap']);
assert('tap with no device exits non-0', tapNoArgs.status !== 0);

// with no api_token + no server reachable, devices fails cleanly (env error),
// never hangs or crashes — point at a dead port and blank token.
const offline = runSkill(D, ['devices', '--json'], { CICY_API_TOKEN: 'x', CICY_API_PORT: '1' });
assert('devices offline exits non-0', offline.status !== 0);
assert('devices offline emits json error', /"ok":\s*false/.test(offline.stdout) || offline.stderr.length > 0);

finish();
