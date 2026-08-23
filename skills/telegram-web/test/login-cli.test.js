import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { login } from '../lib/login.js';
import { loadSession } from '../lib/session.js';

const cli = new URL('../bin/telegram-web', import.meta.url).pathname;

function response(value) {
  return { success: true, result: { result: { type: 'object', value } } };
}

test('login copies auth only after apply and persists redacted metadata', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegram-web-login-'));
  const sessionPath = path.join(dir, 'telegram-web.json');
  const storage = { user_auth: JSON.stringify({ id: '42', dcID: 2 }), account1: 'sensitive-session', theme: 'dark' };
  const calls = [];
  const transport = {
    client: 'desktop-1',
    chrome(args) {
      calls.push({ tool: 'chrome', command: args.slice(0, 2) });
      return response(JSON.stringify(storage));
    },
    electron(args) {
      calls.push({ tool: 'electron', command: args.slice(0, 3) });
      if (args[0] === 'webcontents') return { ok: true, data: [] };
      if (args[0] === 'proxy') return { ok: true };
      if (args[0] === 'open') return { ok: true, data: { winId: 3, url: 'https://web.telegram.org/a/' } };
      if (args[0] === 'window') return { ok: true, data: { url: 'https://web.telegram.org/a/', isDomReady: true, isLoading: false, profileId: 99 } };
      if (args[0] === 'cdp' && args[2] === 'Page.reload') return { success: true };
      if (args[0] === 'cdp' && args[2] === 'Runtime.evaluate') {
        const expression = JSON.parse(args[3]).expression;
        if (expression.includes('localStorage.clear')) return response({ keys: 3 });
        if (expression.includes('chat-list')) return response({ logged: true, userId: '42' });
      }
      throw new Error(`unexpected electron command ${args[0]} ${args[2] || ''}`);
    },
  };
  const result = await login({
    transport,
    options: { fromProfile: 0, toAccount: 99, proxy: 'socks5://127.0.0.1:9001', url: 'https://web.telegram.org/a/', fromClient: null },
    sessionPath,
    patchBackend: async () => ({ ok: true, foundIn: { moduleId: '17' } }),
    poll: async (check) => check(),
  });
  assert.equal(result.currentUserId, '42');
  assert.equal(result.target, '3');
  assert.doesNotMatch(JSON.stringify(result), /sensitive-session|user_auth|account1/);
  assert.doesNotMatch(fs.readFileSync(sessionPath, 'utf8'), /sensitive-session|user_auth|account1/);
  assert.deepEqual(loadSession(sessionPath).backend, 'a');
  assert.deepEqual(calls.slice(0, 3).map((call) => call.command[0]), ['cdp', 'webcontents', 'proxy']);
  assert.ok(calls.some((call) => call.command[0] === 'open'));
});

test('login rejects a Chrome profile without Telegram auth keys', async () => {
  const transport = { client: null, chrome: () => response(JSON.stringify({ theme: 'dark' })), electron: () => { throw new Error('must not open'); } };
  await assert.rejects(
    () => login({ transport, options: { fromProfile: 0, toAccount: 99, proxy: '', url: 'https://web.telegram.org/a/' }, sessionPath: '/tmp/not-used', patchBackend: async () => ({}) }),
    (error) => error.code === 'SOURCE_NOT_LOGGED_IN',
  );
});

test('login redacts auth storage when the injection transport fails noisily', async () => {
  const storage = { user_auth: '{"id":"42"}', account1: 'sensitive-session' };
  const transport = {
    client: null,
    chrome: () => response(JSON.stringify(storage)),
    electron(args) {
      if (args[0] === 'webcontents') return { ok: true, data: [] };
      if (args[0] === 'open') return { ok: true, data: { winId: 3 } };
      if (args[0] === 'window') return { ok: true, data: { isDomReady: true, isLoading: false } };
      if (args[0] === 'cdp' && args[2] === 'Runtime.evaluate') throw new Error(`failed args contain ${Buffer.from(JSON.stringify(storage)).toString('base64')} sensitive-session`);
      return { ok: true };
    },
  };
  await assert.rejects(
    () => login({ transport, options: { fromProfile: 0, toAccount: 99, proxy: '', url: 'https://web.telegram.org/a/' }, sessionPath: '/tmp/not-used', patchBackend: async () => ({}) , poll: async (check) => check() }),
    (error) => error.code === 'STORAGE_INJECT_FAILED' && !/sensitive-session|eyJ1c2VyX2F1dGgi/.test(error.message),
  );
});

function fakeCliEnvironment() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegram-web-cli-'));
  const log = path.join(dir, 'calls.jsonl');
  const writeFake = (name, body) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, `#!/usr/bin/env node\n${body}`);
    fs.chmodSync(file, 0o755);
    return file;
  };
  const electron = writeFake('agent-electron', `
const fs=require('node:fs');const a=process.argv.slice(2);fs.appendFileSync(${JSON.stringify(log)},JSON.stringify(a.slice(0,4))+'\\n');
const i=a[0]==='--client'?2:0;const cmd=a[i];
if(cmd==='webcontents') return console.log(JSON.stringify({ok:true,data:[{webContentsId:5,url:'https://web.telegram.org/k/#test',profileId:1}]}));
if(cmd==='window') return console.log(JSON.stringify({ok:true,data:{url:'https://web.telegram.org/k/#test',profileId:1}}));
if(cmd==='close') return console.log(JSON.stringify({ok:true,data:{closed:true}}));
if(cmd==='cdp') { const p=JSON.parse(a[i+3]);const e=p.expression;let v;
 if(e.includes("backend:'k'")) v={backend:'k',patched:true,loggedIn:false,currentUserId:null,chatCount:0,userCount:0,mirrorKeys:['peers','messages']};
 else if(e.includes("mirrors['peers']")||e.includes('mirrors[\"peers\"]')) v={};
 else if(e.includes("mirrors['communityDialogs']")||e.includes('mirrors[\"communityDialogs\"]')) v=[];
 else if(e.includes("mirrors['messages']")||e.includes('mirrors[\"messages\"]')) v=[];
 else v=null;
 return console.log(JSON.stringify({success:true,result:{result:{type:'object',value:v}}})); }
process.stderr.write('unexpected '+cmd);process.exit(9);
`);
  const mirror = writeFake('tg-web-mirror-hook', `process.stdout.write(JSON.stringify({changed:false,verified:true,version:'0.1.0'}));`);
  const chrome = writeFake('agent-chrome', `process.stdout.write(JSON.stringify({ok:true,data:{}}));`);
  return {
    dir, log,
    env: { ...process.env, AGENT_ELECTRON_BIN: electron, AGENT_CHROME_BIN: chrome, TG_WEB_MIRROR_HOOK_BIN: mirror, CICY_TELEGRAM_WEB_SESSION: path.join(dir, 'session.json') },
  };
}

test('CLI blocks mutations before invoking tools and emits stable JSON errors', () => {
  const fixture = fakeCliEnvironment();
  assert.throws(
    () => execFileSync(cli, ['send', '2', 'hello', '--json'], { env: fixture.env, encoding: 'utf8', stdio: 'pipe' }),
    (error) => {
      const value = JSON.parse(error.stdout.toString());
      return error.status === 2 && value.ok === false && value.error.code === 'APPLY_REQUIRED';
    },
  );
  assert.equal(fs.existsSync(fixture.log), false);
});

test('CLI routes recovered Web K read commands and patch with success envelopes', () => {
  const fixture = fakeCliEnvironment();
  for (const argv of [
    ['status'], ['patch'], ['chats'], ['dialogs'], ['users'], ['messages', '2'],
  ]) {
    const value = JSON.parse(execFileSync(cli, [...argv, '--client', 'desktop-1', '--target', 'wc:5', '--json'], { env: fixture.env, encoding: 'utf8' }));
    assert.equal(value.ok, true, argv[0]);
    assert.equal(value.data.backend, 'k', argv[0]);
  }
});

test('CLI close requires apply, closes target, and clears only matching session', () => {
  const fixture = fakeCliEnvironment();
  fs.writeFileSync(fixture.env.CICY_TELEGRAM_WEB_SESSION, JSON.stringify({ version: 1, target: 'wc:5', url: 'https://web.telegram.org/k/', backend: 'k' }), { mode: 0o600 });
  const value = JSON.parse(execFileSync(cli, ['close', '--apply', '--target', 'wc:5', '--json'], { env: fixture.env, encoding: 'utf8' }));
  assert.deepEqual(value, { ok: true, data: { backend: 'k', closed: true, target: 'wc:5' } });
  assert.equal(fs.existsSync(fixture.env.CICY_TELEGRAM_WEB_SESSION), false);
});
