#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync, readFileSync, existsSync, statSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const D = new URL('..', import.meta.url).pathname;
const BIN = join(D, 'bin', 'luckgram');

const dir = mkdtempSync(join(tmpdir(), 'luckgram-test-'));
const LOCAL_TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ-_';
const CLOUD_KEY = 'lgc_' + 'k'.repeat(43);

// spawnSync blocks this process, so the fake servers run in their own.
function startServer(token, mode) {
  const portFile = join(dir, `port-${mode || 'local'}`);
  const child = spawn('node', [join(D, 'test', 'fake-server.js'), portFile, token, mode || ''], { stdio: 'ignore' });
  const wait = new Int32Array(new SharedArrayBuffer(4));
  for (let i = 0; i < 100 && !existsSync(portFile); i++) Atomics.wait(wait, 0, 0, 50);
  return { child, port: Number(readFileSync(portFile, 'utf8')) };
}
const local = startServer(LOCAL_TOKEN);
const cloud = startServer(CLOUD_KEY, 'cloud');
const config = join(dir, 'luckgram.json');
const env = { CICY_LUCKGRAM_CONFIG: config, LUCKGRAM_MCP_URL: '', LUCKGRAM_MCP_TOKEN: '', LUCKGRAM_PROFILE: '', LUCKGRAM_DEVICE: '' };
const run = (args, extra = {}) => runSkill(D, args, { ...env, ...extra });
const withStdin = (args, input, extra = {}) => spawnSync('node', [BIN, ...args], {
  encoding: 'utf8', input, env: { ...process.env, ...env, ...extra }, timeout: 10000,
});

try {
  // ── help and usage ──
  const noArgs = run([]);
  assert('no args prints help, exit 0', noArgs.status === 0 && noArgs.stdout.includes('luckgram accounts'));
  assert('--help exits 0', run(['--help']).status === 0);
  assert('unknown command exits 2', run(['nope']).status === 2);

  // ── not configured ──
  const bare = run(['accounts']);
  assert('not configured exits 3', bare.status === 3);
  assert('not configured says how to configure', bare.stderr.includes('luckgram config'));
  assert('status when not configured exits 3', run(['status']).status === 3);

  // ── config: the token never comes from argv and is never printed ──
  const argv = run(['config', '--local', '--token', LOCAL_TOKEN]);
  assert('config refuses a token on the command line', argv.status === 2 && !existsSync(config));
  assert('config rejects a malformed token', withStdin(['config', '--local', '--token-stdin'], 'short\n').status === 2);
  assert('config: the cloud needs a cloud key', withStdin(['config', '--cloud', '--token-stdin'], LOCAL_TOKEN + '\n').status === 2);
  assert('config: local needs the access token', withStdin(['config', '--local', '--token-stdin'], CLOUD_KEY + '\n').status === 2);

  const localUrl = `http://127.0.0.1:${local.port}/mcp`;
  const saved = withStdin(['config', '--url', localUrl, '--token-stdin'], LOCAL_TOKEN + '\n');
  assert('config saves a profile', saved.status === 0 && saved.stdout.includes('saved profile "local"'));
  assert('config output masks the token', !saved.stdout.includes(LOCAL_TOKEN));
  if (process.platform !== 'win32') {
    assert('config file is 0600', (statSync(config).mode & 0o777) === 0o600);
  }

  const status = run(['status']);
  assert('status connects', status.status === 0 && status.stdout.includes('connected: Luckgram Desktop, 2 tools'));
  assert('status never shows the token', !status.stdout.includes(LOCAL_TOKEN) && !run(['status', '--json']).stdout.includes(LOCAL_TOKEN));
  const statusJson = JSON.parse(run(['status', '--json']).stdout);
  assert('status --json: connected, profile, masked token', statusJson.connected && statusJson.using.profile === 'local' && statusJson.using.token.includes('***'));

  // ── accounts ──
  const accounts = run(['accounts']);
  assert('accounts prints a table', accounts.status === 0 && accounts.stdout.includes('Alice') && accounts.stdout.includes('@alice') && accounts.stdout.includes('active'));
  assert('accounts keeps wide characters aligned', accounts.stdout.includes('奶油小可爱'));
  assert('accounts --json is the tool value', JSON.parse(run(['accounts', '--json']).stdout).accounts.length === 2);
  const sw = run(['switch', '#2']);
  assert('switch by #index', sw.status === 0 && sw.stdout.includes('switched to: 奶油小可爱'));
  assert('active follows', run(['active']).stdout.includes('奶油小可爱'));
  assert('switch by @username', run(['switch', '@alice']).stdout.includes('Alice'));
  assert('switch to an unknown account exits 1', run(['switch', '999']).status === 1);

  // ── skills: arguments reach the tool as the server expects them ──
  const chats = JSON.parse(run(['chats', 'list', '--unread', '--limit', '5', '--json']).stdout);
  assert('chats list --unread --limit', chats.echo.unread_only === true && chats.echo.limit === 5 && chats.echo.account === undefined);
  assert('chats list text', run(['chats', 'list']).stdout.includes('Bob') && run(['chats', 'list']).stdout.includes('pinned'));
  const friends = JSON.parse(run(['friends', 'list', '--query', 'bo', '--account', '111', '--json']).stdout);
  assert('friends list --query --account', friends.echo.query === 'bo' && friends.echo.account === '111');
  const find = JSON.parse(run(['friends', 'find', '@carol', '--json']).stdout);
  assert('friends find @username', find.echo.username === 'carol' && find.echo.phone === undefined);
  assert('friends find +phone', JSON.parse(run(['friends', 'find', '+57 310 000', '--json']).stdout).echo.phone === '+57 310 000');
  const add = JSON.parse(run(['friends', 'add', '9', '--first', 'Li', '--json']).stdout);
  assert('friends add <id> --first', add.echo.user_id === '9' && add.echo.first_name === 'Li');
  const msgs = JSON.parse(run(['messages', 'get', '5', '--limit', '3', '--before', '40', '--json']).stdout);
  assert('messages get <chat> --limit --before', msgs.echo.chat === '5' && msgs.echo.limit === 3 && msgs.echo.before_id === 40);
  assert('messages get text', run(['messages', 'get', '5']).stdout.includes('[7]') && run(['messages', 'get', '5']).stdout.includes('Bob: hello'));
  const send = JSON.parse(run(['messages', 'send', '5', 'see', 'you', 'at', '3', '--reply-to', '7', '--json']).stdout);
  assert('messages send joins the words', send.echo.text === 'see you at 3' && send.echo.reply_to === 7);
  const piped = JSON.parse(withStdin(['messages', 'send', '5', '--stdin', '--json'], 'line one\nline two\n').stdout);
  assert('messages send --stdin keeps lines', piped.echo.text === 'line one\nline two\n');
  assert('messages send with no text exits 2', run(['messages', 'send', '5']).status === 2);
  const bio = JSON.parse(run(['profile', 'set', '--bio', '', '--json']).stdout);
  assert('profile set --bio "" reaches the tool as empty', bio.echo.bio === '');
  assert('profile set with nothing exits 2', run(['profile', 'set']).status === 2);
  assert('--limit must be a number', run(['chats', 'list', '--limit', 'x']).status === 2);

  // ── refusals keep their own words and exit 1 ──
  const off = run(['chats', 'list', '--account', '7000000000001']);
  assert('skill off exits 1', off.status === 1);
  assert('skill off names the skill and the account', off.stderr.includes('"chats" skill is off') && off.stderr.includes('7000000000001'));
  const limited = run(['messages', 'send', '5', 'limit']);
  assert('rate limit exits 1 with the wait', limited.status === 1 && limited.stderr.includes('120 seconds'));
  assert('unknown tool through call exits 1', run(['call', 'nope']).status === 1);
  assert('call passes JSON arguments', JSON.parse(run(['call', 'list_chats', '{"limit":2}']).stdout).echo.limit === 2);
  assert('call rejects bad JSON', run(['call', 'list_chats', '{nope']).status === 2);

  // ── cloud commands on a local profile ──
  assert('devices on a local profile exits 2', run(['devices']).status === 2);

  // ── wrong token, unreachable server ──
  const denied = run(['accounts'], { LUCKGRAM_MCP_URL: localUrl, LUCKGRAM_MCP_TOKEN: 'x'.repeat(43) });
  assert('refused token exits 4', denied.status === 4 && denied.stderr.includes('401'));
  const down = run(['accounts'], { LUCKGRAM_MCP_URL: 'http://127.0.0.1:1/mcp', LUCKGRAM_MCP_TOKEN: LOCAL_TOKEN });
  assert('unreachable server exits 4', down.status === 4 && down.stderr.includes('cannot reach'));
  assert('errors never echo the token', !denied.stderr.includes('x'.repeat(43)) && !down.stderr.includes(LOCAL_TOKEN));

  // ── environment connection, profiles ──
  const viaEnv = run(['accounts'], { CICY_LUCKGRAM_CONFIG: join(dir, 'none.json'), LUCKGRAM_MCP_URL: localUrl, LUCKGRAM_MCP_TOKEN: LOCAL_TOKEN });
  assert('LUCKGRAM_MCP_URL / TOKEN work without a config file', viaEnv.status === 0 && viaEnv.stdout.includes('Alice'));
  assert('an unknown --profile exits 3', run(['accounts', '--profile', 'nope']).status === 3);
  assert('config --use an unknown profile exits 3', run(['config', '--use', 'nope']).status === 3);
} finally {
  local.child.kill();
  cloud.child.kill();
}
finish();
