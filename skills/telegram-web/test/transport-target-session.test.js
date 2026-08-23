import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTransport, decodeCdpValue } from '../lib/transport.js';
import { discoverTarget, backendFromUrl } from '../lib/targets.js';
import { loadSession, saveSession, clearSession } from '../lib/session.js';

function fakeExecutable(dir, name, logFile) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `#!/usr/bin/env node
const fs=require('node:fs');
const argv=process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logFile)},JSON.stringify({name:${JSON.stringify(name)},argv})+'\\n');
process.stdout.write(JSON.stringify({ok:true,data:{name:${JSON.stringify(name)},argv}}));
`);
  fs.chmodSync(file, 0o755);
  return file;
}

test('transport uses argv arrays and propagates client to every tool', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegram-web-tools-'));
  const log = path.join(dir, 'calls.jsonl');
  const transport = createTransport({
    electronBin: fakeExecutable(dir, 'agent-electron', log),
    chromeBin: fakeExecutable(dir, 'agent-chrome', log),
    mirrorBin: fakeExecutable(dir, 'tg-web-mirror-hook', log),
    client: 'desktop-1',
  });
  transport.electron(['webcontents', '--json']);
  transport.chrome(['cdp', '0', 'Runtime.evaluate', '{}']);
  transport.mirror(['status', '--target', 'wc:5', '--json']);
  const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(({ argv }) => argv[0] === '--client' && argv[1] === 'desktop-1'));
  assert.ok(calls[2].argv.includes('wc:5'));
});

test('decodes CDP values and reports page exceptions', () => {
  assert.deepEqual(decodeCdpValue({ success: true, result: { result: { type: 'object', value: { x: 1 } } } }), { x: 1 });
  assert.throws(
    () => decodeCdpValue({ success: true, result: { result: { description: 'ReferenceError: x' }, exceptionDetails: { text: 'Uncaught' } } }),
    (error) => error.code === 'PAGE_EVAL_FAILED',
  );
});

test('backend selection accepts only Telegram Web A or K', () => {
  assert.equal(backendFromUrl('https://web.telegram.org/a/#1'), 'a');
  assert.equal(backendFromUrl('https://web.telegram.org/k/#1'), 'k');
  assert.throws(() => backendFromUrl('https://example.com/'), (error) => error.code === 'UNSUPPORTED_URL');
});

test('target discovery rejects zero and multiple matches', () => {
  const none = { electron: () => ({ ok: true, data: [{ webContentsId: 1, url: 'https://example.com/' }] }) };
  assert.throws(() => discoverTarget(none, {}, null), (error) => error.code === 'TARGET_NOT_FOUND');
  const many = { electron: () => ({ ok: true, data: [
    { webContentsId: 5, url: 'https://web.telegram.org/a/' },
    { webContentsId: 6, url: 'https://web.telegram.org/k/' },
  ] }) };
  assert.throws(() => discoverTarget(many, {}, null), (error) => error.code === 'TARGET_AMBIGUOUS' && /wc:5/.test(error.message));
});

test('target discovery prefers a live saved session and detects backend conflict', () => {
  const calls = [];
  const transport = { electron(args) {
    calls.push(args);
    if (args[0] === 'window') return { ok: true, data: { url: 'https://web.telegram.org/k/#saved', profileId: 1 } };
    throw new Error('unexpected');
  } };
  const session = { target: 'wc:9', url: 'https://web.telegram.org/k/#saved', backend: 'k' };
  assert.deepEqual(discoverTarget(transport, {}, session), {
    target: 'wc:9', url: 'https://web.telegram.org/k/#saved', backend: 'k', profileId: 1,
  });
  assert.throws(() => discoverTarget(transport, { backend: 'a' }, session), (error) => error.code === 'BACKEND_CONFLICT');
  assert.equal(calls[0][1], 'wc:9');
});

test('explicit target is inspected and returned as typed target', () => {
  const transport = { electron: (args) => ({ ok: true, data: { url: 'https://web.telegram.org/a/', profileId: 99, requested: args[1] } }) };
  assert.deepEqual(discoverTarget(transport, { target: 'wc:4' }, null), {
    target: 'wc:4', url: 'https://web.telegram.org/a/', backend: 'a', profileId: 99,
  });
});

test('explicit target accepts the live agent-electron window result envelope', () => {
  const transport = { electron: () => ({
    ok: true,
    data: { success: true, webContentsId: 5, result: {
      webContentsId: 5, url: 'https://web.telegram.org/k/#live', title: 'Telegram Web',
    } },
  }) };
  assert.deepEqual(discoverTarget(transport, { target: 'wc:5' }, null), {
    target: 'wc:5', url: 'https://web.telegram.org/k/#live', backend: 'k', profileId: null,
  });
});

test('session persistence is atomic, private, schema checked, and target-scoped', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegram-web-session-'));
  const file = path.join(dir, 'telegram-web.json');
  const session = {
    version: 1, clientId: 'desktop-1', target: 'wc:5', url: 'https://web.telegram.org/k/',
    backend: 'k', accountIdx: 1, currentUserId: '42', createdAt: '2026-08-23T00:00:00.000Z',
  };
  saveSession(file, session);
  assert.deepEqual(loadSession(file), session);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(dir), ['telegram-web.json']);
  assert.throws(() => saveSession(file, { ...session, authToken: 'secret' }), (error) => error.code === 'SECRET_IN_SESSION');
  assert.equal(clearSession(file, 'wc:6'), false);
  assert.ok(fs.existsSync(file));
  assert.equal(clearSession(file, 'wc:5'), true);
  assert.equal(loadSession(file), null);
});
