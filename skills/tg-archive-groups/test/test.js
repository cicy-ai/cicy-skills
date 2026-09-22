#!/usr/bin/env node
// Fakes agent-electron so the CLI can be exercised without a desktop: discovery, scan, dry run, archive, unarchive.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-archive-groups', import.meta.url).pathname;

function fakeAgent() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-arch-test-'));
  const fake = path.join(dir, 'agent-electron');
  const state = path.join(dir, 'state.json');
  // 3 groups (one already archived), 1 channel, 1 user
  fs.writeFileSync(state, JSON.stringify({ items: [
    { peerId: '-100', title: 'G1', kind: 'group', folder: 0 }, { peerId: '-200', title: 'G2', kind: 'group', folder: 0 },
    { peerId: '-300', title: 'G3', kind: 'group', folder: 1 }, { peerId: '-400', title: 'C1', kind: 'channel', folder: 0 },
    { peerId: '500', title: 'B1', kind: 'bot', folder: 0 }, { peerId: '777000', title: 'Telegram', kind: 'service', folder: 0 },
    { peerId: '600', title: 'Alice', kind: 'user', folder: 0 }], calls: [] }));
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs'); const sp=process.env.FAKE_STATE; const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const a=process.argv.slice(2); s.calls.push(a); let out;
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:113,url:'https://web.telegram.org/k/',title:'TG'},{webContentsId:9,url:'https://example.com/'}]};
else if(a.includes('Runtime.evaluate')){
  const p=JSON.parse(a.at(-1)); const ex=p.expression;
  if(ex.includes('getDialogs')){ const inc=ex.includes('!true'); const bots=ex.includes('if (true) out.push'); const all=ex.includes("kind: 'user'") && ex.includes("else { users++; if (true)"); const items=s.items.filter(x=>x.kind!=='service').filter(x=>x.kind==='user'?all:(x.kind==='bot'?bots:(inc||x.kind==='group'))).map(x=>({...x,unread:0}));
    out={success:true,result:{result:{type:'string',value:JSON.stringify({ok:true,self:{id:'1',phone:'8801709299917',username:'x'},total:5,users:1,groups:3,channels:1,items})}}}; }
  else if(ex.includes('getGlobalPrivacySettings')){ s.keep=(s.keep||0)+1; out={success:true,result:{result:{type:'string',value:JSON.stringify({ok:true,changed:true})}}}; }
  else if(ex.includes('editPeerFolders')){ const m=/const ids = (\\[[^\\]]*\\]); const f = (\\d)/.exec(ex); const ids=JSON.parse(m[1]).map(String); const f=Number(m[2]);
    for(const x of s.items) if(ids.includes(x.peerId)) x.folder=f; out={success:true,result:{result:{type:'string',value:JSON.stringify({ok:true,moved:ids.length,bad:[]})}}}; }
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
  const r = JSON.parse(fakeAgent().run(['targets', '--json']));
  assert.equal(r.targets.length, 1); assert.equal(r.targets[0].target, 'wc:113');
});

test('scan counts groups + channels by default, groups only with --groups-only', () => {
  const { run } = fakeAgent();
  let r = JSON.parse(run(['scan', '--json']));
  assert.equal(r.included, 4); assert.equal(r.archived, 1); assert.equal(r.not_archived, 3);
  r = JSON.parse(run(['scan', '--groups-only', '--json']));
  assert.equal(r.included, 3); assert.equal(r.not_archived, 2);
  r = JSON.parse(run(['scan', '--bots', '--json']));
  assert.equal(r.included, 5); assert.equal(r.not_archived, 4);
  r = JSON.parse(run(['scan', '--all', '--json']));
  assert.equal(r.included, 6); assert.equal(r.not_archived, 5);
});

test('archive is a dry run without --yes', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['archive', '--target', '113', '--json']));
  assert.equal(r.dryRun, true); assert.equal(r.would_move.length, 3); assert.equal(st().items.filter((x) => x.folder === 1).length, 1);
});

test('archive --yes moves groups + channels; --groups-only spares channels; unarchive brings all back', () => {
  const { run, st } = fakeAgent();
  let r = JSON.parse(run(['archive', '--target', 'wc:113', '--yes', '--groups-only', '--batch', '1', '--delay', '0', '--json']));
  assert.equal(r.moved, 2); assert.equal(r.failed, 0); assert.equal(r.remaining, 0);
  assert.deepEqual(r.keep, { ok: true, changed: true }); assert.equal(st().keep, 1);
  assert.deepEqual(st().items.filter((x) => x.kind === 'group').map((x) => x.folder), [1, 1, 1]);
  assert.equal(st().items.find((x) => x.kind === 'channel').folder, 0);
  r = JSON.parse(run(['archive', '--target', 'wc:113', '--yes', '--delay', '0', '--json']));
  assert.equal(r.moved, 1); assert.equal(st().items.find((x) => x.kind === 'channel').folder, 1);
  r = JSON.parse(run(['archive', '--target', 'wc:113', '--yes', '--bots', '--delay', '0', '--json']));
  assert.equal(r.moved, 1); assert.equal(st().items.find((x) => x.kind === 'bot').folder, 1); assert.equal(st().items.find((x) => x.kind === 'service').folder, 0);
  r = JSON.parse(run(['archive', '--target', 'wc:113', '--yes', '--all', '--delay', '0', '--json']));
  assert.equal(r.moved, 1); assert.equal(st().items.find((x) => x.kind === 'user').folder, 1);
  r = JSON.parse(run(['unarchive', '--target', 'wc:113', '--yes', '--all', '--delay', '0', '--json']));
  assert.equal(r.moved, 6); assert.deepEqual(st().items.map((x) => x.folder), [0, 0, 0, 0, 0, 0, 0]);
});
