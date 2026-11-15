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
  const proxies = run(['proxy', 'list']);
  assert('proxy list shows the mode and marks the one in use', /mode: through a proxy/.test(proxies.stdout) && /\* 1 {2}socks5 {2}10\.0\.0\.2:1080 {2}user bob {2}\(password\)/.test(proxies.stdout));
  const added = JSON.parse(run(['proxy', 'add', '--type', 'socks5', '--host', '10.0.0.2', '--port', '1080', '--user', 'bob', '--json']).stdout);
  assert('proxy add sends the fields', added.echo.type === 'socks5' && added.echo.host === '10.0.0.2' && added.echo.port === 1080 && added.echo.user === 'bob' && added.echo.use === undefined);
  const secret = JSON.parse(withStdin(['proxy', 'add', '--type', 'socks5', '--host', 'h.io', '--port', '1', '--password-stdin', '--no-use', '--json'], 'p w\n').stdout);
  assert('proxy add --password-stdin reads the password, --no-use only saves', secret.echo.password === 'p w' && secret.echo.use === false);
  const linked = JSON.parse(run(['proxy', 'add', 'tg://socks?server=1.2.3.4&port=1080', '--json']).stdout);
  assert('proxy add <link> sends the link alone', linked.echo.link === 'tg://socks?server=1.2.3.4&port=1080' && linked.echo.type === undefined);
  assert('proxy add with a link and --host exits 2', run(['proxy', 'add', 'tg://socks?server=1.2.3.4&port=1080', '--host', 'x']).status === 2);
  assert('proxy add without a port exits 2', run(['proxy', 'add', '--type', 'socks5', '--host', 'x']).status === 2);
  assert('proxy use 2 sends the index', JSON.parse(run(['proxy', 'use', '2', '--json']).stdout).echo.index === 2);
  const direct = JSON.parse(run(['proxy', 'use', 'Direct', '--json']).stdout);
  assert('proxy use direct sends the mode', direct.echo.mode === 'direct' && direct.echo.index === undefined);
  assert('proxy use x exits 2', run(['proxy', 'use', 'x']).status === 2);
  assert('proxy remove 1 sends the index', JSON.parse(run(['proxy', 'remove', '1', '--json']).stdout).echo.index === 1);
  assert('proxy with nothing exits 2', run(['proxy']).status === 2);
  assert('--limit must be a number', run(['chats', 'list', '--limit', 'x']).status === 2);

  // ── bots, through BotFather ──
  const BOT_TOKEN = '7214567890:AAHk3mN9xQ2vB7cL5tR8wY1zP4sD6fG0jKe';
  assert('bots list', run(['bots', 'list']).stdout.trim() === '@my_shop_bot\n@other_bot');
  assert('bots list says when there is another page', run(['bots', 'list', '--account', '111']).stdout.includes('(more: luckgram botfather press 30 "»")'));
  const created = JSON.parse(run(['bots', 'create', '@new_shop_bot', '--name', 'New Shop', '--json']).stdout);
  assert('bots create strips @ and passes the name', created.echo.username === 'new_shop_bot' && created.echo.name === 'New Shop' && created.token === BOT_TOKEN);
  assert('bots create needs --name', run(['bots', 'create', 'new_shop_bot']).status === 2);
  const tokenFile = join(dir, 'bot.token');
  const saved2 = run(['bots', 'create', 'new_shop_bot', '--name', 'New Shop', '--out', tokenFile]);
  assert('--out writes the token to a file', readFileSync(tokenFile, 'utf8').trim() === BOT_TOKEN);
  assert('--out keeps the token out of the output', saved2.status === 0 && !saved2.stdout.includes(BOT_TOKEN) && saved2.stdout.includes('token saved to'));
  assert('--out keeps the token out of --json too', !run(['bots', 'token', 'my_shop_bot', '--out', tokenFile, '--json']).stdout.includes(BOT_TOKEN));
  if (process.platform !== 'win32') {
    assert('the token file is 0600', (statSync(tokenFile).mode & 0o777) === 0o600);
  }
  const taken = run(['bots', 'create', 'taken_bot', '--name', 'X']);
  assert("BotFather's refusal exits 1 with its words", taken.status === 1 && taken.stderr.includes('already taken'));
  assert('bots token', run(['bots', 'token', 'my_shop_bot']).stdout.includes('token: ' + BOT_TOKEN));
  assert('bots token --revoke calls revoke', JSON.parse(run(['bots', 'token', 'my_shop_bot', '--revoke', '--json']).stdout).tool === 'botfather_revoke_token');
  const set = JSON.parse(run(['bots', 'set', 'my_shop_bot', '--name', 'Shop', '--privacy', 'off', '--json']).stdout);
  assert('bots set runs one tool per flag', set.updated.join(',') === 'name,privacy');
  assert('bots set --privacy takes on or off', run(['bots', 'set', 'my_shop_bot', '--privacy', 'maybe']).status === 2);
  assert('bots set with nothing exits 2', run(['bots', 'set', 'my_shop_bot']).status === 2);
  const cmds = JSON.parse(run(['bots', 'commands', 'my_shop_bot', 'start=Start the bot', '/help=How it works', '--json']).stdout);
  assert('bots commands parses command=description', cmds.echo.commands.length === 2 && cmds.echo.commands[1].command === 'help' && cmds.echo.commands[0].description === 'Start the bot');
  assert('bots commands --clear sends an empty list', JSON.parse(run(['bots', 'commands', 'my_shop_bot', '--clear', '--json']).stdout).echo.commands.length === 0);
  assert('bots commands with nothing exits 2', run(['bots', 'commands', 'my_shop_bot']).status === 2);
  assert('bots commands rejects a bare word', run(['bots', 'commands', 'my_shop_bot', 'start']).status === 2);
  assert('bots delete needs --confirm', run(['bots', 'delete', 'my_shop_bot']).status === 2);
  const deleted = JSON.parse(run(['bots', 'delete', 'my_shop_bot', '--confirm', '@my_shop_bot', '--json']).stdout);
  assert('bots delete passes the confirmation', deleted.echo.confirm === 'my_shop_bot' && deleted.tool === 'botfather_delete_bot');
  const sent = run(['botfather', 'send', '/mybots']);
  assert('botfather send shows the reply and its buttons', sent.stdout.includes('[40] BotFather: Choose a bot.') && sent.stdout.includes('[@my_shop_bot]'));
  const pressed = JSON.parse(run(['botfather', 'press', '40', 'Edit', 'Bot', '--json']).stdout);
  assert('botfather press joins the button text', pressed.echo.message_id === 40 && pressed.echo.button === 'Edit Bot');
  assert('botfather press needs an id and a button', run(['botfather', 'press', '40']).status === 2);
  assert('botfather read', run(['botfather', 'read', '--limit', '2']).stdout.includes('[41] BotFather: Success! Name updated.'));

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

  // ── groups: one account, every account ──
  const joined = JSON.parse(run(['groups', 'join', 'https://t.me/some_group', '--json']).stdout);
  assert('groups join turns a t.me link into the username', joined.joined === true && joined.echo.chat === 'some_group');
  const invite = JSON.parse(run(['groups', 'join', 'https://t.me/+AbCd_123-xyz', '--json']).stdout);
  assert('groups join passes an invite link through', invite.echo.chat === 'https://t.me/+AbCd_123-xyz');
  const all = run(['groups', 'join-all', 'https://t.me/open_group', '--delay', '0', '--json']);
  const allJson = JSON.parse(all.stdout);
  assert('groups join-all works on every account', all.status === 0 && allJson.accounts === 2
    && allJson.summary.joined === 1 && allJson.summary.already_member === 1 && allJson.results[1].account === '7000000000001');
  const partly = run(['groups', 'join-all', '@some_group', '--delay', '0']);
  assert('groups join-all reports accounts whose skill is off, exit 1', partly.status === 1
    && partly.stdout.includes('1 joined') && partly.stdout.includes('1 skill off') && partly.stderr.includes('[2/2]'));
  const onlyOne = JSON.parse(run(['groups', 'leave-all', 'some_group', '--delay', '0', '--only', 'alice', '--json']).stdout);
  assert('groups leave-all --only picks accounts', onlyOne.accounts === 1 && onlyOne.summary.left === 1);
  assert('groups join-all --skip everything exits 1', run(['groups', 'join-all', 'some_group', '--skip', '1,2']).status === 1);
  assert('groups join-all without a chat exits 2', run(['groups', 'join-all']).status === 2);
  assert('groups join-all with a bad --delay exits 2', run(['groups', 'join-all', 'x_group', '--delay', 'soon']).status === 2);

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
