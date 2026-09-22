#!/usr/bin/env node
// Fakes agent-electron so the CLI can be exercised without a desktop: discovery, scan, dry run, real clean.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-clean-deleted', import.meta.url).pathname;

function fakeAgent() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-clean-test-'));
  const fake = path.join(dir, 'agent-electron');
  const state = path.join(dir, 'state.json');
  fs.writeFileSync(state, JSON.stringify({ deleted: ['8705327165', '8683336148', '6374580003'], calls: [] }));
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs'); const sp=process.env.FAKE_STATE; const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const a=process.argv.slice(2); s.calls.push(a); let out;
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:121,url:'https://web.telegram.org/k/#1',title:'TG A'},{webContentsId:9,url:'https://example.com/'}]};
else if(a.includes('Runtime.evaluate')){
  const p=JSON.parse(a.at(-1)); const ex=p.expression;
  if(ex.includes('getDialogs')) out={success:true,result:{result:{type:'string',value:JSON.stringify({ok:true,self:{id:'1',phone:'573202594971',username:''},total:506,deleted:s.deleted.map((id,i)=>({peerId:id,date:1700000000-i*86400,unread:0}))})}}};
  else if(ex.includes('flushHistory')){ const m=/const pid = (\\d+)/.exec(ex); const id=m&&m[1]; s.deleted=s.deleted.filter(x=>x!==id); out={success:true,result:{result:{type:'string',value:JSON.stringify({ok:true,err:''})}}}; }
  else out={success:false};
} else out={ok:false};
fs.writeFileSync(sp,JSON.stringify(s)); process.stdout.write(JSON.stringify(out));
`);
  fs.chmodSync(fake, 0o755);
  const run = (args) => execFileSync('node', [cli, ...args], { encoding: 'utf8', env: { ...process.env, AGENT_ELECTRON_BIN: fake, FAKE_STATE: state } });
  const st = () => JSON.parse(fs.readFileSync(state, 'utf8'));
  return { run, st };
}

test('--help prints usage', () => { assert.match(execFileSync('node', [cli, '--help'], { encoding: 'utf8' }), /Usage:/); });

test('targets lists only Telegram Web K webContents', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['targets', '--json']));
  assert.equal(r.targets.length, 1); assert.equal(r.targets[0].target, 'wc:121');
});

test('scan auto-picks the single target and lists deleted accounts', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['scan', '--json']));
  assert.equal(r.target, 'wc:121'); assert.equal(r.total, 506); assert.equal(r.count, 3);
  assert.equal(r.deleted[0].peerId, '8705327165');
});

test('clean is a dry run without --yes', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['clean', '--target', '121', '--json']));
  assert.equal(r.dryRun, true); assert.equal(r.would_delete.length, 3); assert.equal(st().deleted.length, 3);
});

test('clean --yes --limit deletes newest first and reports remaining', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['clean', '--target', 'wc:121', '--yes', '--limit', '2', '--delay', '0', '--json']));
  assert.equal(r.deleted, 2); assert.equal(r.failed, 0); assert.equal(r.remaining, 1);
  assert.deepEqual(st().deleted, ['6374580003']);
});
