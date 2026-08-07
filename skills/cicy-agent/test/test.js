#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('cicy-agent'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

const prefixedTeam = runSkill(D, ['--team', 'missing', 'ls'], {
  CICY_AGENT_JSON: '/tmp/cicy-agent-test-missing-teams.json',
});
assert('--team works before the command', prefixedTeam.status !== 0 && !prefixedTeam.stderr.includes('unknown command: --team'));

const cloudMissing = runSkill(D, ['cloud', 'ls'], {
  CICY_CLOUD_DEVICE_JSON: '/tmp/cicy-agent-test-missing-cloud-device.json',
});
assert('cloud command reports missing login clearly', cloudMissing.status !== 0 && cloudMissing.stderr.includes('Cloud login not found'));

// list --json → valid JSON (server may be up on this host)
const list = runSkill(D, ['list', '--json']);
const listJson = (() => { try { JSON.parse(list.stdout); return true; } catch { return false; } })();
assert('list --json is valid JSON or exits non-0', listJson || list.status !== 0);

finish();
