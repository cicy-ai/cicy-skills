#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// status --json → valid JSON (ok:true even if unconfigured)
const status = runSkill(D, ['status', '--json']);
assert('status --json exits 0', status.status === 0);
let s; try { s = JSON.parse(status.stdout); } catch {}
assert('status --json is valid JSON', !!s);

const fixture = mkdtempSync(join(tmpdir(), 'cf-tunnel-accounts-'));
const config = join(fixture, 'cf.json');
writeFileSync(config, JSON.stringify({
  default: 'primary',
  accounts: {
    primary: { api_token: 'primary-secret-token', account_id: 'a1', domain: 'one.example', zone_id: 'z1', tunnels: { one: { id: 't1', token: 'connector-secret' } } },
    secondary: { api_token: 'secondary-secret-token', account_id: 'a2', domain: 'two.example', zone_id: 'z2', tunnels: { two: { id: 't2', token: 'connector-secret-2' } } },
  },
}));
const primary = runSkill(D, ['status', '--json'], { CICY_CF_CONFIG: config });
const primaryStatus = JSON.parse(primary.stdout).data;
assert('status selects default account', primaryStatus.account === 'primary');
assert('status lists default account tunnels', primaryStatus.tunnels.includes('one'));
assert('status masks account token', !primary.stdout.includes('primary-secret-token'));
const secondary = runSkill(D, ['status', '--json'], { CICY_CF_CONFIG: config, CF_ACCOUNT: 'secondary' });
const secondaryStatus = JSON.parse(secondary.stdout).data;
assert('CF_ACCOUNT selects named account', secondaryStatus.account === 'secondary');
assert('named account uses its tunnels', secondaryStatus.tunnels.includes('two') && !secondaryStatus.tunnels.includes('one'));
assert('status does not expose connector token', !secondary.stdout.includes('connector-secret-2'));

// add without required args → non-0
const add = runSkill(D, ['add']);
assert('add without args exits non-0', add.status !== 0);

// list without tunnel_id → non-0
const list = runSkill(D, ['list', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('list without tunnel config exits non-0', list.status !== 0);

finish();
