#!/usr/bin/env node
// A tiny MCP server for the tests: answers like Luckgram Desktop (or, with
// "cloud" as the third argument, like the relay). Writes its port to the file
// given as the first argument; argv[2] is the token it accepts.
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';

const [portFile, token, mode] = process.argv.slice(2);
const accounts = [
  { id: '111', index: 1, name: 'Alice', username: 'alice', phone: '8613800000001', unread: 5, unread_muted: false, premium: false, active: true },
  { id: '7000000000001', index: 2, name: '奶油小可爱', unread: 0, unread_muted: false, premium: true, active: false },
];
const ok = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value, isError: false });
const err = (text) => ({ content: [{ type: 'text', text }], isError: true });

function call(name, args) {
  if (mode === 'cloud' && name === 'list_devices') return ok({ devices: [{ id: 'dev-00000001', name: 'Office PC', version: '7.4.2.124', online: true, last_seen: '2026-11-14T06:00:00.000Z' }] });
  if (name === 'list_accounts') return ok({ accounts, seen_device: args.device ?? null });
  if (name === 'get_active_account') return ok({ account: accounts.find((a) => a.active) });
  if (name === 'switch_account') {
    const found = accounts.find((a) => (args.id !== undefined && a.id === args.id)
      || (args.username !== undefined && a.username === args.username)
      || (args.index !== undefined && a.index === args.index));
    if (!found) return err('No such account is logged in. Call list_accounts to see the accounts.');
    for (const a of accounts) a.active = (a === found);
    return ok({ switched: true, already_active: false, account: found });
  }
  if (name === 'join_chat' && args.chat === 'open_group') return ok({ account: args.account ?? '111', joined: args.account !== '111', already_member: args.account === '111', chat_id: '77', chat_name: 'Open group', echo: args });
  const account = args.account ?? '111';
  if (account !== '111') return err(`The "chats" skill is off for account ${account}. The user switches it on in Luckgram Desktop: Settings > Luckgram > Local MCP server.`);
  if (name === 'list_proxies' || name === 'add_proxy' || name === 'use_proxy' || name === 'remove_proxy') {
    const proxies = [{ index: 1, type: 'socks5', host: '10.0.0.2', port: 1080, user: 'bob', has_password: true, selected: name !== 'use_proxy' || args.index === 1 }];
    return ok({ account, mode: args.mode ?? 'proxy', proxies, added: true, index: 1, used: args.use !== false, removed: true, echo: args });
  }
  if (name === 'list_chats') return ok({ account, total: 1, offset: 0, complete: true, chats: [{ id: '5', type: 'user', name: 'Bob', unread: 2, unread_mark: false, muted: false, pinned: true, last_message_date: 1794630000 }], echo: args });
  if (name === 'list_friends') return ok({ account, total: 1, offset: 0, friends: [{ id: '5', name: 'Bob', username: 'bob', bot: false, mutual: true }], echo: args });
  if (name === 'find_user') return ok({ account, user: { id: '9', name: 'Carol', username: args.username ?? 'carol', bot: false, friend: false }, echo: args });
  if (name === 'add_friend') return ok({ account, added: true, already_friend: false, user: { id: '9', name: 'Carol' }, echo: args });
  if (name === 'get_messages') return ok({ account, chat_id: '5', chat_name: 'Bob', messages: [{ id: 7, date: 1794630000, out: false, from_id: '5', from_name: 'Bob', text: 'hello' }], echo: args });
  if (name === 'send_message') return args.text === 'limit' ? err('Rate limit for send_message on this account (30 an hour, 200 a day). Try again in 120 seconds. Do not retry sooner.') : ok({ account, queued: true, chat_id: '5', chat_name: 'Bob', echo: args });
  const TOKEN = '7214567890:AAHk3mN9xQ2vB7cL5tR8wY1zP4sD6fG0jKe';
  if (name === 'botfather_list_bots') return ok({ account, bots: ['my_shop_bot', 'other_bot'], more: args.account === '111', reply: { id: 30, text: 'Choose a bot from the list below:' } });
  if (name === 'botfather_create_bot') return args.username === 'taken_bot' ? err('BotFather answered: Sorry, this username is already taken. Please try something different.') : ok({ account, created: true, username: args.username, link: 'https://t.me/' + args.username, token: TOKEN, reply: { id: 31, text: 'Done! Use this token: ' + TOKEN }, echo: args });
  if (name === 'botfather_get_token' || name === 'botfather_revoke_token') return ok({ account, bot: args.bot, token: TOKEN, tool: name });
  if (name.startsWith('botfather_set_') || name === 'botfather_delete_bot') return ok({ account, bot: args.bot, done: true, echo: args, tool: name });
  if (name === 'botfather_send') return ok({ account, reply: { id: 40, out: false, text: 'Choose a bot.', buttons: [{ text: '@my_shop_bot' }, { text: 'Docs', url: 'https://core.telegram.org/bots' }] }, echo: args });
  if (name === 'botfather_press') return ok({ account, changed: true, reply: { id: args.message_id, out: false, text: 'Here it is: @my_shop_bot.', buttons: [{ text: 'Edit Bot' }] }, echo: args });
  if (name === 'botfather_read') return ok({ account, messages: [{ id: 41, out: false, text: 'Success! Name updated.' }, { id: 40, out: true, text: 'My Shop' }], echo: args });
  if (name === 'join_chat') return ok({ account, joined: true, already_member: false, chat_id: '77', chat_name: 'Some group', echo: args });
  if (name === 'leave_chat') return ok({ account, left: true, was_member: true, chat_id: '77', chat_name: 'Some group', echo: args });
  if (name === 'update_profile') return ok({ account, updated: true, name: 'Alice', bio: args.bio, echo: args });
  return { rpcError: { code: -32602, message: 'Unknown tool: ' + name } };
}

const server = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const send = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    if (req.headers.authorization !== 'Bearer ' + token) return send(401, { error: 'no' });
    const m = JSON.parse(body);
    if (m.method === 'initialize') return send(200, { jsonrpc: '2.0', id: m.id, result: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'luckgram-desktop', title: 'Luckgram Desktop', version: '1.0.0' } } });
    if (m.method === 'tools/list') return send(200, { jsonrpc: '2.0', id: m.id, result: { tools: [{ name: 'list_accounts', description: 'List accounts' }, { name: 'list_chats', description: 'List chats' }] } });
    if (m.method === 'tools/call') {
      const result = call(m.params.name, m.params.arguments ?? {});
      return send(200, result.rpcError ? { jsonrpc: '2.0', id: m.id, error: result.rpcError } : { jsonrpc: '2.0', id: m.id, result });
    }
    send(200, { jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'Method not found' } });
  });
});
server.listen(0, '127.0.0.1', () => writeFileSync(portFile, String(server.address().port)));
setTimeout(() => process.exit(0), 60_000).unref();
