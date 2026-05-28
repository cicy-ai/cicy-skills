#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);
assert('help mentions lark-cli', noArgs.stdout.includes('lark-cli'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);
assert('unknown subcommand exits 2', bad.status === 2);

// status --json → valid JSON with ok:true, regardless of install state
const status = runSkill(D, ['status', '--json']);
assert('status --json exits 0', status.status === 0);
const parsed = (() => { try { return JSON.parse(status.stdout); } catch { return null; } })();
assert('status --json is valid JSON', parsed !== null);
assert('status --json has ok:true', parsed && parsed.ok === true);
assert('status --json reports npm_package', parsed && parsed.data && parsed.data.npm_package === '@larksuite/cli');

finish();
