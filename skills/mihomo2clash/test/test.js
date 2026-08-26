#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const D = new URL('..', import.meta.url).pathname;
const FIX = join(D, 'test', 'fixture.yaml');
const tmp = mkdtempSync(join(tmpdir(), 'm2c-'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0 && help.stdout.includes('convert'));
assert('no args exits 2', runSkill(D, []).status === 2);
assert('missing input exits 1', runSkill(D, ['check', '-i', join(tmp, 'nope.yaml')]).status === 1);

const chk = runSkill(D, ['check', '--json', '-i', FIX]);
assert('check --json exits 0', chk.status === 0, chk.stderr);
let rep = null; try { rep = JSON.parse(chk.stdout).data.report; } catch {}
assert('check reports dropped direct proxy', rep?.dropped.proxies.some((p) => p.name === 'default_proxy'));
assert('check reports dropped IN-* group', rep?.dropped.groups.some((g) => g.name === 'chrome-profile-1-group'));
assert('check reports 2 dropped rules', rep?.dropped.rules.length === 2);
assert('check reports MATCH rewrite', rep?.rewritten.rules[0]?.to === 'MATCH,default_proxy_group');
assert('check flags non-classic proxies', rep?.nonClassicProxies.some((p) => p.type === 'vless'));

const out = join(tmp, 'out', 'clash.yaml');
const conv = runSkill(D, ['convert', '-i', FIX, '-o', out, '--cn-direct']);
assert('convert exits 0', conv.status === 0, conv.stderr);
assert('output mode 0600', (statSync(out).mode & 0o777) === 0o600);
const y = readFileSync(out, 'utf8');
assert('standard ports', y.includes('port: 7890') && y.includes('socks-port: 7891') && y.includes('allow-lan: false'));
assert('no listeners/auth', !y.includes('listeners:') && !y.includes('authentication') && !y.includes('skip-auth'));
assert('dns port rewritten', y.includes('listen: 0.0.0.0:1053'));
assert('vless kept with nested reality-opts', y.includes('type: vless') && y.includes('public-key: FAKEKEY') && y.includes('short-id: "0123"'));
assert('inline comment stripped from value', y.includes('servername: www.apple.com\n'));
assert('direct proxy dropped', !y.includes('type: direct'));
assert('special chars password quoted', y.includes('password: "p#w: d"'));
assert('IN-* rules dropped', !y.includes('IN-NAME') && !y.includes('IN-USER'));
assert('MATCH rewritten', y.includes('MATCH,default_proxy_group') && !y.includes('MATCH,REJECT'));
assert('GEOIP before MATCH', y.indexOf('GEOIP,CN,DIRECT') > 0 && y.indexOf('GEOIP,CN,DIRECT') < y.indexOf('MATCH,default_proxy_group'));
assert('per-profile group dropped', !y.includes('chrome-profile-1-group'));
const grp = y.slice(y.indexOf('proxy-groups:'), y.indexOf('rules:'));
assert('DIRECT deduplicated in group', (grp.match(/- DIRECT/g) || []).length === 1);
assert('unicode name kept unquoted', y.includes('- name: 节点-主'));

const strict = runSkill(D, ['convert', '-i', FIX, '-o', '-', '--strict']);
assert('--strict drops vless', strict.status === 0 && !strict.stdout.includes('type: vless') && strict.stdout.includes('type: socks5'));

// round trip: output parses back to the same structure via the skill itself
const rt = runSkill(D, ['check', '--json', '-i', out]);
assert('output is re-parseable', rt.status === 0 && JSON.parse(rt.stdout).data.report.kept.proxies === 2);

finish();
