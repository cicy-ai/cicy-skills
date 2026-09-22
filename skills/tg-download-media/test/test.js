#!/usr/bin/env node
// Fakes agent-electron so the CLI can be exercised without a desktop: resolve, fetch, chunked download, naming, skip/resume, jsonl filters.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-download-media', import.meta.url).pathname;

function fakeAgent() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-dl-test-'));
  const fake = path.join(dir, 'agent-electron');
  // message 1: photo (3 bytes "abc"), 2: document IMG.MP4 (5 bytes), 3: no media, 4: same media_id as 1, 9: missing
  fs.writeFileSync(fake, `#!/usr/bin/env node
const a=process.argv.slice(2); let out;
const val=(v)=>({success:true,result:{result:{type:'string',value:typeof v==='string'?v:JSON.stringify(v)}}});
const DATA={1:'abc',2:'hello',4:'abc'};
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:121,url:'https://web.telegram.org/k/#1',title:'TG A'}]};
else if(a.includes('Runtime.evaluate')){
  const ex=JSON.parse(a.at(-1)).expression;
  if(ex.includes('contacts.resolveUsername')){ const ref=JSON.parse(/const ref = (\\{[^;]*\\});/.exec(ex)[1]); out=ref.value==='nobody'?val({ok:false,err:'USERNAME_NOT_OCCUPIED'}):val({ok:true,info:{id:'1',title:'Demo',username:ref.value,type:'channel'}}); }
  else if(ex.includes('channels.getMessages')){ const ids=JSON.parse(/const ids = (\\[[^\\]]*\\])/.exec(ex)[1]); const items=[];
    for(const id of ids){ if(id===1||id===4) items.push({id,kind:'photo',media_id:'777',mime:'image/jpeg',size:3,file:'',grouped_id:'g1',text:'',date:1});
      else if(id===2) items.push({id,kind:'document',media_id:'888',mime:'video/mp4',size:5,file:'IMG.MP4',grouped_id:'',text:'',date:1});
      else if(id===3) items.push({id,kind:'',reason:'no media'}); }
    out=val({ok:true,items}); }
  else if(ex.includes('downloadMedia')){ const id=Number(/S.media\\[(\\d+)\\]/.exec(ex)[1]); out=DATA[id]?val({ok:true,size:DATA[id].length,mime:id===2?'video/mp4':'image/jpeg'}):val({ok:false,err:'media not fetched'}); }
  else if(ex.includes('readAsDataURL')){ const id=Number(/S.blobs\\[(\\d+)\\]/.exec(ex)[1]); const m=/blob.slice\\((\\d+), (\\d+)\\)/.exec(ex); out=val(Buffer.from(DATA[id].slice(Number(m[1]),Number(m[2]))).toString('base64')); }
  else out={success:false};
} else out={ok:false};
process.stdout.write(JSON.stringify(out));
`);
  fs.chmodSync(fake, 0o755);
  const run = (args) => { try { return { out: execFileSync('node', [cli, ...args], { encoding: 'utf8', cwd: dir, env: { ...process.env, AGENT_ELECTRON_BIN: fake } }), code: 0 }; } catch (e) { return { out: e.stdout, err: e.stderr, code: e.status }; } };
  return { run, dir };
}

test('--help prints usage', () => { assert.match(execFileSync('node', [cli, '--help'], { encoding: 'utf8' }), /Usage:/); });

test('usage errors: no ids, bad id, unknown chat', () => {
  const { run } = fakeAgent();
  assert.equal(run(['download', '@demo']).code, 1);
  assert.equal(run(['download', '@demo', '--ids', 'x']).code, 1);
  assert.equal(run(['download', '@nobody', '--ids', '1']).code, 3);
});

test('downloads photo + document, names files, dedupes media_id, skips no-media, reports missing', () => {
  const { run, dir } = fakeAgent();
  const r = JSON.parse(run(['download', '@demo', '--ids', '1,2,3,4,9', '--out', 'm', '--json']).out);
  assert.equal(r.downloaded, 2); assert.equal(r.failed, 1); assert.equal(r.skipped, 2);
  assert.equal(fs.readFileSync(path.join(dir, 'm', '1_777.jpg'), 'utf8'), 'abc');
  assert.equal(fs.readFileSync(path.join(dir, 'm', '2_IMG.MP4'), 'utf8'), 'hello');
  assert.ok(r.skipped_items.some((s) => s.id === 4 && /same media_id/.test(s.reason)));
  assert.ok(r.skipped_items.some((s) => s.id === 3 && /no media/.test(s.reason)));
  assert.deepEqual(r.failed_items.map((f) => f.id), [9]);
});

test('second run skips existing files (resumable); --overwrite re-downloads; --album makes sub-folders', () => {
  const { run, dir } = fakeAgent();
  run(['download', '@demo', '--ids', '1', '--out', 'm', '--json']);
  const a = JSON.parse(run(['download', '@demo', '--ids', '1', '--out', 'm', '--json']).out);
  assert.equal(a.downloaded, 0); assert.equal(a.skipped_items[0].reason, 'exists');
  const b = JSON.parse(run(['download', '@demo', '--ids', '1', '--out', 'm', '--overwrite', '--json']).out);
  assert.equal(b.downloaded, 1);
  const c = JSON.parse(run(['download', '@demo', '--ids', '1', '--out', 'alb', '--album', '--json']).out);
  assert.ok(fs.existsSync(path.join(dir, 'alb', 'album_g1', '1_777.jpg')), JSON.stringify(c));
});

test('t.me/<user>/<id> link selects that message; --from-jsonl with --codes / --match filters', () => {
  const { run, dir } = fakeAgent();
  const a = JSON.parse(run(['download', 'https://t.me/demo/2', '--out', 'l', '--json']).out);
  assert.equal(a.downloaded, 1); assert.equal(a.files[0].id, 2);
  const jl = path.join(dir, 'x.jsonl');
  fs.writeFileSync(jl, [{ id: 1, code: 'aa1', text: '#台湾 男生' }, { id: 2, code: 'bb2', text: '#韩国 女生' }, { id: 4, code: 'aa1', text: 'dup' }].map((x) => JSON.stringify(x)).join('\n') + '\n');
  const b = JSON.parse(run(['download', '@demo', '--from-jsonl', jl, '--codes', 'aa1', '--out', 'j1', '--json']).out);
  assert.deepEqual(b.files.map((f) => f.id), [1]); assert.equal(b.skipped, 1);
  const c = JSON.parse(run(['download', '@demo', '--from-jsonl', jl, '--match', '韩国', '--out', 'j2', '--json']).out);
  assert.deepEqual(c.files.map((f) => f.id), [2]);
});
