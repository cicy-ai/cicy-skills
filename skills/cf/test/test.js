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

// config set requires key=value
const bad = runSkill(D, ['config', 'set']);
assert('config set no args exits non-0', bad.status !== 0);

// status --json → valid JSON (ok:true even if unconfigured)
const status = runSkill(D, ['status', '--json']);
assert('status --json exits 0', status.status === 0);
let s; try { s = JSON.parse(status.stdout); } catch {}
assert('status --json is valid JSON', !!s);
assert('status --json has ok field', 'ok' in (s || {}));
assert('status --json omits permissions', !('permissions' in (s?.data || {})));

const fixture = mkdtempSync(join(tmpdir(), 'cf-accounts-'));
const config = join(fixture, 'cf.json');
writeFileSync(config, JSON.stringify({
  default: 'primary',
  accounts: {
    primary: { api_token: 'primary-secret-token', account_id: 'account-primary' },
    secondary: { api_token: 'secondary-secret-token', account_id: 'account-secondary' },
  },
}));
const primary = runSkill(D, ['status', '--json'], { CICY_CF_CONFIG: config });
const primaryStatus = JSON.parse(primary.stdout).data;
assert('status selects default account', primaryStatus.account === 'primary');
assert('default account is configured', primaryStatus.api_token_set && primaryStatus.account_id_set);
assert('status does not reveal full token', !primary.stdout.includes('primary-secret-token'));
const secondary = runSkill(D, ['status', '--json'], { CICY_CF_CONFIG: config, CF_ACCOUNT: 'secondary' });
assert('CF_ACCOUNT selects named account', JSON.parse(secondary.stdout).data.account === 'secondary');
assert('selected account token stays masked', !secondary.stdout.includes('secondary-secret-token'));

// curl without config → non-0
const curl = runSkill(D, ['curl', '/zones', '--json'], { HOME: '/tmp/no-such-home-xyz' });
assert('curl without api_token exits non-0', curl.status !== 0);

finish();
