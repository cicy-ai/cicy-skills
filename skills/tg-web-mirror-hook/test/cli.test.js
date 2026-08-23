import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-web-mirror-hook', import.meta.url).pathname;

test('discovers Telegram, installs once, reloads once, then stays idempotent', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-hook-test-'));
  const fake = path.join(dir, 'agent-electron');
  const state = path.join(dir, 'state.json');
  fs.writeFileSync(state, JSON.stringify({ installed: false, reloads: 0, calls: [] }));
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs');
const statePath=process.env.FAKE_STATE;
const s=JSON.parse(fs.readFileSync(statePath,'utf8'));
const a=process.argv.slice(2); s.calls.push(a);
let out;
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:5,url:'https://web.telegram.org/k/#test',type:'window'}]};
else if(a.includes('Page.reload')) { s.reloads++; out={success:true}; }
else if(a.includes('Runtime.evaluate')) {
  const payload=JSON.parse(a.at(-1));
  if(payload.expression.includes('operation = "install"')) {
    const changed=!s.installed; s.installed=true;
    out={success:true,result:{result:{type:'object',value:{ok:true,operation:'install',changed,url:'https://web.telegram.org/k/apiManagerProxy-test.js',cacheName:'assets',version:'0.1.0'}}}};
  } else {
    out={success:true,result:{result:{type:'object',value:{ok:true,operation:'verify',cache:{version:'0.1.0',markerCount:1,url:'https://web.telegram.org/k/apiManagerProxy-test.js'},runtime:{present:true,type:'object',keyCount:12}}}}};
  }
} else { console.error('unexpected args '+JSON.stringify(a)); process.exit(7); }
fs.writeFileSync(statePath,JSON.stringify(s)); process.stdout.write(JSON.stringify(out));
`);
  fs.chmodSync(fake, 0o755);
  const env = { ...process.env, AGENT_ELECTRON_BIN: fake, FAKE_STATE: state };

  const first = JSON.parse(execFileSync(cli, ['install', '--client', 'desktop-1', '--json'], { env, encoding: 'utf8' }));
  assert.equal(first.changed, true);
  assert.equal(first.verified, true);

  const second = JSON.parse(execFileSync(cli, ['install', '--client', 'desktop-1', '--json'], { env, encoding: 'utf8' }));
  assert.equal(second.changed, false);
  assert.equal(second.verified, true);

  const finalState = JSON.parse(fs.readFileSync(state, 'utf8'));
  assert.equal(finalState.reloads, 1);
  assert.ok(finalState.calls.every((call) => call[0] === '--client' && call[1] === 'desktop-1'));
  assert.ok(finalState.calls.some((call) => call.includes('wc:5')));
});

test('refuses ambiguous Telegram targets unless --target is supplied', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-hook-ambiguous-'));
  const fake = path.join(dir, 'agent-electron');
  fs.writeFileSync(fake, `#!/usr/bin/env node
const a=process.argv.slice(2);
if(a.includes('webcontents')) process.stdout.write(JSON.stringify({ok:true,data:[
  {webContentsId:5,url:'https://web.telegram.org/k/#a'},
  {webContentsId:6,url:'https://web.telegram.org/k/#b'}
]})); else process.exit(8);
`);
  fs.chmodSync(fake, 0o755);
  assert.throws(
    () => execFileSync(cli, ['status', '--json'], { env: { ...process.env, AGENT_ELECTRON_BIN: fake }, encoding: 'utf8', stdio: 'pipe' }),
    (error) => /multiple Telegram Web targets/.test(error.stderr.toString()),
  );
});

test('host-install saves the bundled hook through agent-desktop on Windows', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-hook-host-install-'));
  const fake = path.join(dir, 'agent-desktop');
  const calls = path.join(dir, 'calls.jsonl');
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs');
const a=process.argv.slice(2); fs.appendFileSync(process.env.FAKE_CALLS,JSON.stringify(a)+'\\n');
if(a[0]==='clients') process.stdout.write(JSON.stringify({ok:true,data:[{client_id:'desktop-win',platform:'win32',is_cicy_desktop:true}]}));
else if(a[0]==='rpc'&&a[1]==='exec_shell') process.stdout.write(JSON.stringify({ok:true,data:JSON.stringify({stdout:'C:\\\\Users\\\\test\\r\\n',stderr:'',exitCode:0})}));
else if(a[0]==='rpc'&&a[1]==='file_write') { const p=JSON.parse(a[2]); process.stdout.write(JSON.stringify({ok:true,data:JSON.stringify({success:true,path:p.path,size:p.content.length})})); }
else process.exit(9);
`);
  fs.chmodSync(fake, 0o755);
  const env = { ...process.env, AGENT_DESKTOP_BIN: fake, FAKE_CALLS: calls };
  const result = JSON.parse(execFileSync(cli, ['host-install', '--client', 'desktop-win', '--json'], { env, encoding: 'utf8' }));
  const invoked = fs.readFileSync(calls, 'utf8').trim().split('\n').map(JSON.parse);
  const write = invoked.find((call) => call[0] === 'rpc' && call[1] === 'file_write');
  const payload = JSON.parse(write[2]);
  assert.equal(result.path, 'C:\\Users\\test\\data\\electron\\extension\\inject\\telegram.org.js');
  assert.equal(payload.path, result.path);
  assert.match(payload.content, /__cicyTelegramMirrorsPatch/);
  assert.match(payload.content, /window\.__mirrors=this\.mirrors/);
});
