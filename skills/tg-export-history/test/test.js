#!/usr/bin/env node
// Fakes agent-electron so the CLI can be exercised without a desktop: discovery, info, paging export, formats, limit/since.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cli = new URL('../bin/tg-export-history', import.meta.url).pathname;

function fakeAgent(total = 250) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-export-test-'));
  const fake = path.join(dir, 'agent-electron');
  fs.writeFileSync(fake, `#!/usr/bin/env node
const a=process.argv.slice(2); let out; const TOTAL=${total};
const val=(v)=>({success:true,result:{result:{type:'string',value:JSON.stringify(v)}}});
if(a.includes('webcontents')) out={ok:true,data:[{webContentsId:121,url:'https://web.telegram.org/k/#1',title:'TG A'},{webContentsId:9,url:'https://example.com/'}]};
else if(a.includes('Runtime.evaluate')){
  const ex=JSON.parse(a.at(-1)).expression;
  if(ex.includes('contacts.resolveUsername')){
    const ref=JSON.parse(/const ref = (\\{[^;]*\\});/.exec(ex)[1]);
    if(ref.value==='nobody') out=val({ok:false,err:'USERNAME_NOT_OCCUPIED'});
    else if(ref.topic) out=val({ok:true,info:{id:'2101513995',title:'Demo Channel',username:ref.value,type:'channel',members:100,member:true},topic:ref.topic,topicInfo:{id:ref.topic,title:'T'},count:40,latest:{id:40,date:'2026-09-18T07:23:59.000Z'}});
    else if(ref.msgId===4546) out=val({ok:true,info:{id:'2101513995',title:'Demo Channel',username:ref.value,type:'channel',members:100,member:true},topic:0,topicInfo:{id:4546,title:'T'},count:TOTAL,latest:{id:TOTAL,date:'2026-09-18T07:23:59.000Z'}});
    else out=val({ok:true,info:{id:'2101513995',title:'Demo Channel',username:ref.value,type:'channel',members:100,member:true},topic:0,topicInfo:null,count:TOTAL,latest:{id:TOTAL,date:'2026-09-18T07:23:59.000Z'}});
  } else if(ex.includes('messages.getReplies') && Number((/const h = (\\d+)/.exec(ex)||[])[1])){
    const off=Number(/let off = (\\d+)/.exec(ex)[1]); let id=off?off-1:40; const rows=[]; for(;id>=1&&rows.length<100;id--) rows.push({id,date:new Date((1700000000+id*60)*1000).toISOString(),from:'Demo',from_id:'c1',text:'topic msg '+id,media:'',media_id:'',mime:'',size:'',file:'',reply_to:'',fwd:'',views:'',service:'',edit_date:'',grouped_id:''});
    out=val({ok:true,rows,next:rows.length?rows[rows.length-1].id:0,stop:false});
  } else if(ex.includes('messages.getHistory')){
    const off=Number(/let off = (\\d+)/.exec(ex)[1]); const batch=Number(/k < (\\d+)/.exec(ex)[1]); const since=Number(/m\\.date < (\\d+)/.exec(ex)[1]);
    let id=off?off-1:TOTAL; const rows=[]; let stop=false;
    for(let k=0;k<batch&&!stop;k++){ let n=0; for(;n<100&&id>=1;n++,id--){ const date=1700000000+id*60; if(since&&date<since){stop=true;break;} rows.push({id,date:new Date(date*1000).toISOString(),from:'Demo @demo',from_id:'c2101513995',text:'msg '+id,media:id%3?'':'photo',file:'',reply_to:'',fwd:'',views:id*2,service:'',edit_date:'',grouped_id:''}); } if(n<100)break; }
    out=val({ok:true,rows,next:rows.length?rows[rows.length-1].id:0,stop});
  } else out={success:false};
} else out={ok:false};
process.stdout.write(JSON.stringify(out));
`);
  fs.chmodSync(fake, 0o755);
  const run = (args) => { try { return { out: execFileSync('node', [cli, ...args], { encoding: 'utf8', cwd: dir, env: { ...process.env, AGENT_ELECTRON_BIN: fake } }), code: 0 }; } catch (e) { return { out: e.stdout, err: e.stderr, code: e.status }; } };
  return { run, dir };
}

test('--help prints usage', () => { assert.match(execFileSync('node', [cli, '--help'], { encoding: 'utf8' }), /Usage:/); });

test('targets lists only Telegram Web K webContents', () => {
  const { run } = fakeAgent();
  const r = JSON.parse(run(['targets', '--json']).out);
  assert.equal(r.targets.length, 1); assert.equal(r.targets[0].target, 'wc:121');
});

test('info resolves @username and t.me links, not-found exits 3', () => {
  const { run } = fakeAgent();
  const a = JSON.parse(run(['info', '@demo_chan', '--json']).out);
  assert.equal(a.info.type, 'channel'); assert.equal(a.count, 250); assert.equal(a.target, 'wc:121');
  const b = JSON.parse(run(['info', 'https://t.me/demo_chan/3894', '--json']).out);
  assert.equal(b.info.username, 'demo_chan');
  const c = run(['info', '@nobody', '--json']); assert.equal(c.code, 3); assert.equal(JSON.parse(c.out).ok, false);
  assert.equal(run(['info', '???']).code, 1);
});

test('export pages through everything, writes json oldest first', () => {
  const { run, dir } = fakeAgent(250);
  const r = JSON.parse(run(['export', '@demo_chan', '--json']).out);
  assert.equal(r.ok, true); assert.equal(r.count, 250);
  const j = JSON.parse(fs.readFileSync(path.join(dir, 'demo_chan-messages.json'), 'utf8'));
  assert.equal(j.meta.count, 250); assert.equal(j.messages[0].id, 1); assert.equal(j.messages.at(-1).id, 250);
  assert.ok(!fs.existsSync(path.join(dir, '.demo_chan-messages.json.partial.jsonl')));
});

test('--format all + --out dir writes json, jsonl and csv; --limit keeps the newest N', () => {
  const { run, dir } = fakeAgent(1000);
  const out = path.join(dir, 'dump') + path.sep;
  const r = JSON.parse(run(['export', '@demo_chan', '--format', 'all', '--out', out, '--limit', '120', '--json']).out);
  assert.equal(r.count, 120);
  for (const f of ['json', 'jsonl', 'csv']) assert.ok(fs.existsSync(r.files[f]), f);
  const lines = fs.readFileSync(r.files.jsonl, 'utf8').trim().split('\n');
  assert.equal(lines.length, 120); assert.equal(JSON.parse(lines[0]).id, 881); assert.equal(JSON.parse(lines.at(-1)).id, 1000);
  const csv = fs.readFileSync(r.files.csv, 'utf8');
  assert.ok(csv.startsWith('﻿id,date,from')); assert.equal(csv.trim().split('\n').length, 121);
});

test('--out file.csv picks the format from the extension; --since stops at older messages', () => {
  const { run, dir } = fakeAgent(300);
  const f = path.join(dir, 'x.csv');
  const r = JSON.parse(run(['export', '@demo_chan', '--out', f, '--since', String(1700000000 + 201 * 60), '--json']).out);
  assert.equal(r.count, 100); assert.deepEqual(Object.keys(r.files), ['csv']); assert.ok(fs.existsSync(f));
});

test('--topic and a topic-root link export only that topic', () => {
  const { run, dir } = fakeAgent(250);
  const a = JSON.parse(run(['export', '@demo_chan', '--topic', '4546', '--json']).out);
  assert.equal(a.count, 40); assert.ok(a.files.json.endsWith('demo_chan-topic4546-messages.json'));
  const b = JSON.parse(run(['export', 'https://t.me/demo_chan/4546', '--json']).out);
  assert.equal(b.count, 40);
  const c = JSON.parse(run(['info', 'https://t.me/demo_chan/4546', '--json']).out);
  assert.equal(c.topic, 4546);
});
