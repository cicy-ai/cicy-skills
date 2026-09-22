#!/usr/bin/env node
// Fakes agent-electron so the CLI can be exercised without a desktop: discovery, show, check, dry run, set, clear.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-set-username', import.meta.url).pathname;

function fakeAgent(init = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-set-username-test-'));
  const fake = path.join(dir, 'agent-electron');
  const state = path.join(dir, 'state.json');
  fs.writeFileSync(state, JSON.stringify({ username: '', taken: ['taken_name'], calls: [], ...init }));
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs'); const sp=process.env.FAKE_STATE; const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const a=process.argv.slice(2); s.calls.push(a); let out;
const val=(v)=>({success:true,result:{result:{type:'string',value:JSON.stringify(v)}}});
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:121,url:'https://web.telegram.org/k/#1',title:'TG A'},{webContentsId:9,url:'https://example.com/'}]};
else if(a.includes('Runtime.evaluate')){
  const ex=JSON.parse(a.at(-1)).expression;
  if(ex.includes('account.updateUsername')){ const u=JSON.parse(/const u = ("[^"]*")/.exec(ex)[1]); if(s.taken.includes(u)) out=val({ok:false,err:'USERNAME_OCCUPIED'}); else { s.username=u; out=val({ok:true,username:u,err:''}); } }
  else if(ex.includes('account.checkUsername')){ const u=JSON.parse(/const u = ("[^"]*")/.exec(ex)[1]); out=val(u===s.username?{ok:true,available:true,own:true}:s.taken.includes(u)?{ok:true,available:false,own:false}:u==='flooded'?{ok:false,err:'FLOOD_WAIT_30'}:{ok:true,available:true,own:false}); }
  else if(ex.includes('getSelf')) out=val({ok:true,self:{id:'1536446277',phone:'573202594971',username:s.username,name:'Mel Micheal'}});
  else out={success:false};
} else out={ok:false};
fs.writeFileSync(sp,JSON.stringify(s)); process.stdout.write(JSON.stringify(out));
`);
  fs.chmodSync(fake, 0o755);
  const run = (args) => { try { return { out: execFileSync('node', [cli, ...args], { encoding: 'utf8', env: { ...process.env, AGENT_ELECTRON_BIN: fake, FAKE_STATE: state } }), code: 0 }; } catch (e) { return { out: e.stdout, err: e.stderr, code: e.status }; } };
  const st = () => JSON.parse(fs.readFileSync(state, 'utf8'));
  return { run, st };
}

test('--help prints usage', () => { assert.match(execFileSync('node', [cli, '--help'], { encoding: 'utf8' }), /Usage:/); });

test('targets lists only Telegram Web K webContents', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['targets', '--json']).out);
  assert.equal(r.targets.length, 1); assert.equal(r.targets[0].target, 'wc:121');
});

test('show reports the logged-in account', () => {
  const { run } = fakeAgent({ username: 'mel_shop' });
  const r = JSON.parse(run(['show', '--json']).out);
  assert.equal(r.target, 'wc:121'); assert.equal(r.self.phone, '573202594971'); assert.equal(r.self.username, 'mel_shop');
});

test('local username rules reject bad names before any request (exit 1)', () => {
  const { run, st } = fakeAgent();
  for (const bad of ['abc', '1abc', 'ab-cd', 'abcde_', 'ab__cd', 'a'.repeat(33)]) {
    const r = run(['check', bad, '--json']);
    assert.equal(r.code, 1, bad); assert.equal(JSON.parse(r.out).valid, false, bad);
  }
  assert.equal(st().calls.length, 0);
});

test('check: available / taken / server refusal', () => {
  const { run } = fakeAgent();
  assert.equal(JSON.parse(run(['check', '@mel_shop', '--json']).out).available, true);
  const t = run(['check', 'taken_name', '--json']); assert.equal(t.code, 3); assert.equal(JSON.parse(t.out).available, false);
  const f = run(['check', 'flooded', '--json']); assert.equal(f.code, 3); assert.match(JSON.parse(f.out).hint, /wait 30s/);
});

test('set is a dry run without --yes', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['set', 'mel_shop', '--target', '121', '--json']).out);
  assert.equal(r.dryRun, true); assert.equal(st().username, '');
});

test('set --yes changes the username and reports the previous one', () => {
  const { run, st } = fakeAgent({ username: 'old_name' });
  const r = JSON.parse(run(['set', 'mel_shop', '--target', 'wc:121', '--yes', '--json']).out);
  assert.equal(r.ok, true); assert.equal(r.username, 'mel_shop'); assert.equal(r.previous, 'old_name'); assert.equal(st().username, 'mel_shop');
});

test('set --yes on a taken name exits 3 and changes nothing', () => {
  const { run, st } = fakeAgent();
  const r = run(['set', 'taken_name', '--yes', '--json']);
  assert.equal(r.code, 3); assert.equal(JSON.parse(r.out).ok, false); assert.equal(st().username, '');
});

test('clear --yes removes the username', () => {
  const { run, st } = fakeAgent({ username: 'mel_shop' });
  assert.equal(JSON.parse(run(['clear', '--json']).out).dryRun, true);
  const r = JSON.parse(run(['clear', '--yes', '--json']).out);
  assert.equal(r.ok, true); assert.equal(r.previous, 'mel_shop'); assert.equal(st().username, '');
});
