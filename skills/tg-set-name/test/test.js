#!/usr/bin/env node
// Fakes agent-electron so the CLI can be exercised without a desktop: discovery, show, suggest, dry run, set.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-set-name', import.meta.url).pathname;

function fakeAgent(init = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-set-name-test-'));
  const fake = path.join(dir, 'agent-electron');
  const state = path.join(dir, 'state.json');
  fs.writeFileSync(state, JSON.stringify({ first: 'Mel', last: 'Micheal', calls: [], ...init }));
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs'); const sp=process.env.FAKE_STATE; const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const a=process.argv.slice(2); s.calls.push(a); let out;
const val=(v)=>({success:true,result:{result:{type:'string',value:JSON.stringify(v)}}});
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:121,url:'https://web.telegram.org/k/#1',title:'TG A'},{webContentsId:9,url:'https://example.com/'}]};
else if(a.includes('Runtime.evaluate')){
  const ex=JSON.parse(a.at(-1)).expression;
  if(ex.includes('account.updateProfile')){ const m=/const first = ("[^"]*"), last = ("[^"]*")/.exec(ex); const f=JSON.parse(m[1]), l=JSON.parse(m[2]);
    if(s.flood) out=val({ok:false,err:'FLOOD_WAIT_60'}); else { s.first=f; s.last=l; out=val({ok:true,first:f,last:l,err:''}); } }
  else if(ex.includes('getSelf')) out=val({ok:true,self:{id:'1536446277',phone:'573202594971',username:'',first:s.first,last:s.last}});
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

test('suggest is offline, deterministic per seed, unique', () => {
  const a = JSON.parse(execFileSync('node', [cli, 'suggest', '--count', '20', '--seed', 'x', '--lang', 'en', '--json'], { encoding: 'utf8' })).names;
  const b = JSON.parse(execFileSync('node', [cli, 'suggest', '--count', '20', '--seed', 'x', '--lang', 'en', '--json'], { encoding: 'utf8' })).names;
  assert.equal(a.length, 20); assert.deepEqual(a, b);
  assert.equal(new Set(a.map((n) => n.first + ' ' + n.last)).size, 20);
  for (const n of a) { assert.ok(n.first); assert.ok(n.last); assert.notEqual(n.first, n.last); }
  const e = JSON.parse(execFileSync('node', [cli, 'suggest', '--count', '3', '--lang', 'en', '--emoji', '--no-last', '--json'], { encoding: 'utf8' })).names;
  for (const n of e) assert.match(n.last, /^\p{Extended_Pictographic}/u);
});

test('default names are cute Chinese first names with an empty last name', () => {
  const z = JSON.parse(execFileSync('node', [cli, 'suggest', '--count', '30', '--seed', 'z', '--json'], { encoding: 'utf8' })).names;
  assert.equal(z.length, 30);
  for (const n of z) { assert.match(n.first, /^\p{Script=Han}{2,5}$/u); assert.equal(n.last, ''); }
  const all = JSON.parse(execFileSync('node', [cli, 'suggest', '--count', '120', '--seed', 'z', '--json'], { encoding: 'utf8' })).names;
  const lens = new Set(all.map((n) => [...n.first].length)); assert.deepEqual([...lens].sort(), [2, 3, 4, 5]);
  const e = JSON.parse(execFileSync('node', [cli, 'suggest', '--count', '3', '--emoji', '--json'], { encoding: 'utf8' })).names;
  for (const n of e) assert.match(n.last, /^\p{Extended_Pictographic}$/u);
  const bad = (() => { try { execFileSync('node', [cli, 'suggest', '--lang', 'fr'], { stdio: 'pipe' }); return 0; } catch (x) { return x.status; } })();
  assert.equal(bad, 1);
});

test('set picks a Chinese name by default (dry run)', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['set', '--json']).out);
  assert.match(r.first, /^\p{Script=Han}+$/u); assert.equal(r.last, '');
});

test('targets lists only Telegram Web K webContents', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['targets', '--json']).out);
  assert.equal(r.targets.length, 1); assert.equal(r.targets[0].target, 'wc:121');
});

test('show reports the logged-in account and its name', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['show', '--json']).out);
  assert.equal(r.self.first, 'Mel'); assert.equal(r.self.last, 'Micheal'); assert.equal(r.self.phone, '573202594971');
});

test('set without a name picks a cute name seeded by the account id (dry run)', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['set', '--json']).out);
  assert.equal(r.dryRun, true); assert.equal(r.picked, true); assert.ok(r.first);
  const again = JSON.parse(run(['set', '--json']).out);
  assert.equal(again.first, r.first); assert.equal(again.last, r.last);
  assert.equal(st().first, 'Mel');
});

test('set --yes applies the picked name and reports the previous one', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['set', '--target', '121', '--yes', '--json']).out);
  assert.equal(r.ok, true); assert.deepEqual(r.previous, { first: 'Mel', last: 'Micheal' });
  assert.equal(st().first, r.first); assert.equal(st().last, r.last);
  const again = JSON.parse(run(['set', '--yes', '--json']).out);
  assert.equal(again.unchanged, true);
});

test('set with explicit names; --no-last clears the last name', () => {
  const { run, st } = fakeAgent();
  run(['set', 'Lily', 'Bloom', '--yes', '--json']); assert.equal(st().first, 'Lily'); assert.equal(st().last, 'Bloom');
  run(['set', '--seed', 'abc', '--no-last', '--yes', '--json']); assert.equal(st().last, '');
});

test('invalid names are rejected before any request (exit 1)', () => {
  const { run, st } = fakeAgent();
  for (const args of [['set', '   '], ['set', 'a'.repeat(65)], ['set', 'Lily', 'b'.repeat(65)]]) {
    const r = run([...args, '--json']); assert.equal(r.code, 1); assert.equal(JSON.parse(r.out).valid, false);
  }
  assert.equal(st().calls.length, 0);
});

test('server refusal exits 3 and changes nothing', () => {
  const { run, st } = fakeAgent({ flood: true });
  const r = run(['set', '--yes', '--json']);
  assert.equal(r.code, 3); assert.match(JSON.parse(r.out).hint, /wait 60s/); assert.equal(st().first, 'Mel');
});
