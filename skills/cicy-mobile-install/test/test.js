#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// ── basic smoke (no network / no ssh) ───────────────────────────────────────

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);
assert('--help mentions install', help.stdout.includes('install'));
assert('--help mentions android', help.stdout.includes('android'));
assert('--help mentions ios', help.stdout.includes('ios'));
assert('--help documents sideloadly method', help.stdout.includes('sideloadly'));
assert('--help documents xcode method', help.stdout.includes('xcode'));

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

finish();
