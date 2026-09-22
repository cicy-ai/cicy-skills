#!/usr/bin/env node
// Fakes agent-electron so the CLI can be exercised without a desktop or network: discovery, show,
// styles, chunked image transfer, preview, dry run, set, --if-none, refusals.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-set-avatar', import.meta.url).pathname;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-set-avatar-test-'));
const JPEG = Buffer.from('ffd8ffe000104a46494600', 'hex');

function fakeAgent(init = {}) {
  const dir = fs.mkdtempSync(path.join(tmp, 'a-'));
  const fake = path.join(dir, 'agent-electron');
  const state = path.join(dir, 'state.json');
  fs.writeFileSync(state, JSON.stringify({ photoId: '111', pushed: '', pushes: 0, uploads: 0, calls: [], ...init }));
  fs.writeFileSync(fake, `#!/usr/bin/env node
const fs=require('node:fs'); const sp=process.env.FAKE_STATE; const s=JSON.parse(fs.readFileSync(sp,'utf8'));
const a=process.argv.slice(2); s.calls.push(a.slice(0,3)); let out;
const val=(v)=>({success:true,result:{result:{type:'string',value:JSON.stringify(v)}}});
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:121,url:'https://web.telegram.org/k/#1',title:'TG A'},{webContentsId:9,url:'https://example.com/'}]};
else if(a.includes('Runtime.evaluate')){
  const ex=JSON.parse(a.at(-1)).expression;
  if(ex.includes('uploadProfilePhoto')){ s.uploads++; s.srcSeen=/"kind":"(\\w+)"/.exec(ex)[1];
    if(s.flood) out=val({ok:false,err:'FLOOD_WAIT_120'}); else { s.photoId=String(1000+s.uploads); out=val({ok:true,photoId:s.photoId,bytes:4321,err:''}); } }
  else if(ex.includes('btoa(')) out=val({ok:true,bytes:${JPEG.length},b64:'${JPEG.toString('base64')}'});
  else if(ex.includes('s.parts.push(')){ s.pushes++; s.pushed+=JSON.parse(/s\\.parts\\.push\\(("[^"]*")\\)/.exec(ex)[1]); out=val({ok:true}); }
  else if(ex.includes('window.__tgSetAvatar = {')){ s.pushed=''; s.pushes=0; out=val({ok:true}); }
  else if(ex.includes('inputUserSelf')) out=val({ok:true,self:{id:'1536446277',phone:'573202594971',username:'',first:'Mel',last:'',photoId:s.photoId}});
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

test('styles lists girl as the default', () => {
  const r = JSON.parse(execFileSync('node', [cli, 'styles', '--json'], { encoding: 'utf8' }));
  assert.deepEqual(r.styles.map((s) => s.name), ['girl', 'girl-cartoon', 'emoji']);
  assert.equal(r.styles.find((s) => s.default).name, 'girl');
});

test('targets lists only Telegram Web K webContents', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['targets', '--json']).out);
  assert.equal(r.targets.length, 1); assert.equal(r.targets[0].target, 'wc:121');
});

test('show reports the account and its current photo', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['show', '--json']).out);
  assert.equal(r.self.id, '1536446277'); assert.equal(r.self.photoId, '111');
});

test('set is a dry run without --yes and uploads nothing', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['set', '--style', 'emoji', '--json']).out);
  assert.equal(r.dryRun, true); assert.equal(r.style, 'emoji'); assert.equal(r.seed, '1536446277');
  assert.equal(st().uploads, 0); assert.equal(st().photoId, '111');
});

test('set --yes with the offline emoji style uploads and reports the new photo id', () => {
  const { run, st } = fakeAgent();
  const r = JSON.parse(run(['set', '--style', 'emoji', '--target', '121', '--yes', '--json']).out);
  assert.equal(r.ok, true); assert.equal(r.previousPhotoId, '111'); assert.equal(r.photoId, '1001');
  assert.equal(st().uploads, 1); assert.equal(st().srcSeen, 'emoji');
});

test('--image sends the file to the page in chunks, byte for byte', () => {
  const { run, st } = fakeAgent();
  const big = Buffer.concat([JPEG, Buffer.alloc(70000, 7)]);
  const f = path.join(tmp, 'big.jpg'); fs.writeFileSync(f, big);
  const r = JSON.parse(run(['set', '--image', f, '--yes', '--json']).out);
  assert.equal(r.ok, true); assert.equal(r.image, f);
  assert.ok(st().pushes > 1); assert.equal(st().pushed, big.toString('base64')); assert.equal(st().srcSeen, 'data');
});

test('--if-none skips accounts that already have a photo', () => {
  const has = fakeAgent();
  const r = JSON.parse(has.run(['set', '--style', 'emoji', '--if-none', '--yes', '--json']).out);
  assert.equal(r.skipped, 'has-photo'); assert.equal(has.st().uploads, 0);
  const none = fakeAgent({ photoId: '' });
  const r2 = JSON.parse(none.run(['set', '--style', 'emoji', '--if-none', '--yes', '--json']).out);
  assert.equal(r2.ok, true); assert.equal(r2.previousPhotoId, ''); assert.equal(none.st().uploads, 1);
});

test('preview writes the rendered JPEG locally without uploading', () => {
  const { run, st } = fakeAgent();
  const out = path.join(tmp, 'p.jpg');
  const r = JSON.parse(run(['preview', '--style', 'emoji', '--out', out, '--json']).out);
  assert.equal(r.ok, true); assert.deepEqual(fs.readFileSync(out), JPEG); assert.equal(st().uploads, 0);
});

test('FLOOD_WAIT is reported as a refusal (exit 3)', () => {
  const { run } = fakeAgent({ flood: true });
  const r = run(['set', '--style', 'emoji', '--yes', '--json']);
  assert.equal(r.code, 3); const j = JSON.parse(r.out);
  assert.equal(j.ok, false); assert.match(j.hint, /wait 120s/);
});

test('bad input is rejected and nothing is uploaded', () => {
  const { run, st } = fakeAgent();
  const txt = path.join(tmp, 'x.txt'); fs.writeFileSync(txt, 'hello');
  assert.equal(run(['set', '--image', txt, '--yes']).code, 1);
  assert.equal(run(['set', '--image', path.join(tmp, 'missing.png'), '--yes']).code, 1);
  assert.equal(run(['set', '--style', 'nope']).code, 1);
  assert.equal(run(['set', '--style', 'emoji', '--image', txt]).code, 1);
  assert.equal(run(['preview', '--style', 'emoji']).code, 1);
  assert.equal(st().uploads, 0);
});
