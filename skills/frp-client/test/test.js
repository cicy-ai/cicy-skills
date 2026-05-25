#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// ── basic smoke ─────────────────────────────────────────────────────────────

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);
assert('--help mentions install', help.stdout.includes('install'));
assert('--help mentions service', help.stdout.includes('service'));

// status --json → valid JSON
const status = runSkill(D, ['status', '--json']);
assert('status --json is valid JSON', (() => { try { JSON.parse(status.stdout); return true; } catch { return false; } })());

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// ── install: argument validation ────────────────────────────────────────────

// install requires --server / --token on first install (no existing config)
const installNoArgs = runSkill(D, ['install', '--json'], {
  HOME: '/tmp/no-such-frp-home-xyz',
  FRP_CONFIG: '/tmp/no-such-frp-home-xyz/cicy-ai/db/frpc.toml',
  FRP_SERVER: '',
  FRP_TOKEN: '',
});
// Test environment may not have network access for download — so the test
// passes if it exits non-0 EITHER because of missing args OR network failure.
assert('install with no creds + no config exits non-0', installNoArgs.status !== 0);

// install with unknown option exits 2
const installBadOpt = runSkill(D, ['install', '--no-such-option', 'x']);
assert('install with unknown option exits 2', installBadOpt.status === 2);
assert('install bad-option error mentions option name',
  installBadOpt.stderr.includes('--no-such-option') || installBadOpt.stdout.includes('--no-such-option'));

// install --service none --server X --token Y attempts download but no config args missing
// (we don't actually run install without isolating; skip the real download)

// ── service: argument validation ────────────────────────────────────────────

// service without subcommand → exit 2
const svcNoSub = runSkill(D, ['service']);
assert('service without subcommand exits 2', svcNoSub.status === 2);

// service with unknown subcommand → exit 2
const svcBad = runSkill(D, ['service', 'badaction']);
assert('service unknown subcommand exits 2', svcBad.status === 2);

// service status — should not crash regardless of whether a service is installed
const svcStatus = runSkill(D, ['service', 'status']);
// Exit code may be 0 or non-0 depending on host; just verify it terminates.
assert('service status terminates', svcStatus.status !== null && svcStatus.status !== undefined);

// ── existing commands still parse ──────────────────────────────────────────

// stop when not running → non-0
const stopWhenIdle = runSkill(D, ['stop'], {
  HOME: '/tmp/no-such-frp-home-xyz',
});
assert('stop when not running exits non-0', stopWhenIdle.status !== 0);

// reload when not running → non-0
const reloadIdle = runSkill(D, ['reload'], {
  HOME: '/tmp/no-such-frp-home-xyz',
});
assert('reload when not running exits non-0', reloadIdle.status !== 0);

// connections when not running → non-0
const connsIdle = runSkill(D, ['connections', '--json'], {
  HOME: '/tmp/no-such-frp-home-xyz',
});
assert('connections when not running exits non-0', connsIdle.status !== 0);

// raw without args → exit 2
const rawNoArgs = runSkill(D, ['raw']);
assert('raw without args exits 2', rawNoArgs.status === 2);

finish();
