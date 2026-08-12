#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = new URL('..', import.meta.url).pathname;
const fixture = mkdtempSync(join(tmpdir(), 'chrome-cli-'));
const config = join(fixture, 'chrome.json');
const profiles = join(fixture, 'profiles');
const fakeChrome = join(fixture, 'fake-chrome');
writeFileSync(config, JSON.stringify({
  profile_2: { gmail: 'two@example.com', debuggerPort: 19992, proxy: { url: 'socks5://127.0.0.1:1080', enabled: true } },
}));
writeFileSync(fakeChrome, '#!/bin/sh\nexit 0\n');
chmodSync(fakeChrome, 0o755);

const env = {
  CHROME_CLI_CONFIG: config,
  CHROME_CLI_PROFILE_ROOT: profiles,
  CHROME_CLI_DEBUGGER_BASE_PORT: '19000',
  CHROME_CLI_BINARY: fakeChrome,
};
const run = (args) => runSkill(D, args, env);

const help = run([]);
assert('no args exits 0', help.status === 0);
assert('help explains local architecture', help.stdout.includes('Local macOS/Linux Chrome only'));
assert('help documents identity', help.stdout.includes('accountIdx` = profile ID'));
assert('help routes remote use to agent-chrome', help.stdout.includes('agent-chrome'));

const list = run(['profiles', '--json']);
assert('profiles exits 0', list.status === 0);
const listed = JSON.parse(list.stdout).data;
assert('profiles returns profile ID', listed[0].profileId === 2 && listed[0].accountIdx === 2);
assert('profiles normalizes proxy', listed[0].proxy === 'socks5://127.0.0.1:1080');

const one = run(['profile', 'chrome-2', '--json']);
assert('chrome-N profile ID works', JSON.parse(one.stdout).data.profileId === 2);

const add = run(['add', '--id', '4', '--gmail', 'four@example.com', '--json']);
assert('add exits 0', add.status === 0, add.stderr || add.stdout);
const stored = JSON.parse(readFileSync(config, 'utf8'));
assert('add persists profile', stored.profile_4?.gmail === 'four@example.com');
assert('config has 0600 mode', (await import('node:fs')).statSync(config).mode.toString(8).endsWith('600'));

const setProxy = run(['proxy', '4', 'http://127.0.0.1:7890', '--json']);
assert('proxy exits 0', setProxy.status === 0);
assert('proxy persists object', JSON.parse(readFileSync(config, 'utf8')).profile_4.proxy.url === 'http://127.0.0.1:7890');

const launched = run(['launch', '4', '--json']);
assert('launch invokes configured local binary', launched.status === 0);
assert('launch reports profile identity', JSON.parse(launched.stdout).data.accountIdx === 4);

const bad = run(['cdp', 'Browser.getVersion', '{}']);
assert('cdp requires profile ID', bad.status !== 0);

const unknown = run(['wat']);
assert('unknown command exits non-zero', unknown.status !== 0);

finish();
