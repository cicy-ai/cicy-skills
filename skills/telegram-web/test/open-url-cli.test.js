import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const cli = new URL('../bin/telegram-web', import.meta.url).pathname;

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegram-web-open-url-'));
  const fake = path.join(dir, 'agent-electron');
  const calls = path.join(dir, 'calls.jsonl');
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs'); const a=process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_CALLS,JSON.stringify(a)+'\\n');
process.stdout.write(JSON.stringify({ok:true,data:{winId:7,accountIdx:3,url:a[a.indexOf('open')+1],reused:true,activated:true}}));
`);
  fs.chmodSync(fake, 0o755);
  return { dir, calls, env: { ...process.env, AGENT_ELECTRON_BIN: fake, FAKE_CALLS: calls } };
}

test('open-url delegates reusable activation to the requested Electron profile', () => {
  const f = fixture();
  const output = JSON.parse(execFileSync(cli, [
    'open-url', 'https://web.telegram.org/k/', '--profile', '3', '--apply', '--json',
  ], { env: f.env, encoding: 'utf8' }));
  const calls = fs.readFileSync(f.calls, 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(calls, [['open', 'https://web.telegram.org/k/', '--idx', '3', '--json']]);
  assert.deepEqual(output, { ok: true, data: { winId: 7, accountIdx: 3, profileId: 3, url: 'https://web.telegram.org/k/', reused: true, activated: true } });
});

test('open-url requires apply and rejects non-Telegram URLs before Electron runs', () => {
  const f = fixture();
  const missingApply = spawnSync(cli, ['open-url', '--profile', '3', '--json'], { env: f.env, encoding: 'utf8' });
  const badUrl = spawnSync(cli, ['open-url', 'https://example.com/', '--profile', '3', '--apply', '--json'], { env: f.env, encoding: 'utf8' });
  assert.notEqual(missingApply.status, 0);
  assert.equal(JSON.parse(missingApply.stdout).error.code, 'APPLY_REQUIRED');
  assert.notEqual(badUrl.status, 0);
  assert.equal(JSON.parse(badUrl.stdout).error.code, 'INVALID_URL');
  assert.equal(fs.existsSync(f.calls), false);
});
