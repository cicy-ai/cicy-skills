#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const D = new URL('..', import.meta.url).pathname;
const BIN = join(D, JSON.parse(readFileSync(join(D, 'manifest.json'), 'utf8')).entry);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help mentions serve', help.stdout.includes('serve'));
assert('no args exits 2', runSkill(D, []).status === 2);
assert('unknown command exits 2', runSkill(D, ['nope']).status === 2);
assert('bad --auth exits 2', runSkill(D, ['serve', D, '--auth', 'nocolon']).status === 2);

const ip = runSkill(D, ['ip', '--json']);
assert('ip --json exits 0', ip.status === 0);
let ipData = null;
try { ipData = JSON.parse(ip.stdout); } catch {}
assert('ip --json is {ok,data.ips[]}', ipData?.ok === true && Array.isArray(ipData.data.ips));

// live server test
const root = mkdtempSync(join(tmpdir(), 'lanshare-'));
writeFileSync(join(root, 'a.txt'), 'hello world');
writeFileSync(join(root, '.secret'), 'x');
mkdirSync(join(root, 'sub'));
writeFileSync(join(root, 'sub', 'b.md'), '# b');

const child = spawn('node', [BIN, 'serve', root, '--port', '0', '--host', '127.0.0.1', '--auth', 'u:p', '--no-hidden', '--json'], { stdio: ['ignore', 'pipe', 'pipe'] });
let out = '';
const port = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server start timeout')), 5000);
  child.stdout.on('data', (d) => {
    out += d;
    const line = out.split('\n').find((l) => l.startsWith('{'));
    if (line) { clearTimeout(t); resolve(JSON.parse(line).data.port); }
  });
  child.on('exit', () => reject(new Error('server exited early')));
}).catch((e) => { assert(e.message, false); return null; });

if (port) {
  const base = `http://127.0.0.1:${port}`;
  const auth = { Authorization: 'Basic ' + Buffer.from('u:p').toString('base64') };
  const get = (p, h = {}) => fetch(base + p, { headers: h, redirect: 'manual' });

  assert('no auth → 401', (await get('/')).status === 401);
  assert('wrong auth → 401', (await get('/', { Authorization: 'Basic ' + Buffer.from('u:x').toString('base64') })).status === 401);
  const idx = await get('/', auth);
  const html = await idx.text();
  assert('index → 200 html', idx.status === 200 && idx.headers.get('content-type').startsWith('text/html'));
  assert('index lists file and dir', html.includes('a.txt') && html.includes('sub/'));
  assert('index hides dotfiles with --no-hidden', !html.includes('.secret'));
  assert('dotfile refused (404)', (await get('/.secret', auth)).status === 404);
  assert('dir without slash → 301', (await get('/sub', auth)).status === 301);
  const f = await get('/a.txt', auth);
  assert('file → 200 body', f.status === 200 && (await f.text()) === 'hello world');
  const r = await get('/a.txt', { ...auth, Range: 'bytes=0-4' });
  assert('range → 206 partial', r.status === 206 && (await r.text()) === 'hello');
  assert('missing → 404', (await get('/nope', auth)).status === 404);
  assert('POST → 405', (await fetch(base + '/', { method: 'POST', headers: auth })).status === 405);
  const trav = await fetch(base + '/%2e%2e/%2e%2e/etc/passwd', { headers: auth });
  assert('traversal blocked', trav.status === 403 || trav.status === 404);
  child.kill('SIGTERM');
}

// notebook test
const noteFile = join(root, 'note.txt');
const nc = spawn('node', [BIN, 'note', noteFile, '--port', '0', '--host', '127.0.0.1', '--auth', 'n:p', '--json'], { stdio: ['ignore', 'pipe', 'pipe'] });
let nout = '';
const nport = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('note start timeout')), 5000);
  nc.stdout.on('data', (d) => { nout += d; const l = nout.split('\n').find((x) => x.startsWith('{')); if (l) { clearTimeout(t); resolve(JSON.parse(l).data.port); } });
  nc.on('exit', () => reject(new Error('note exited early')));
}).catch((e) => { assert(e.message, false); return null; });
if (nport) {
  const base = `http://127.0.0.1:${nport}`;
  const auth = { Authorization: 'Basic ' + Buffer.from('n:p').toString('base64') };
  assert('note: no auth → 401', (await fetch(base + '/')).status === 401);
  const page = await fetch(base + '/', { headers: auth });
  assert('note: page has textarea', page.status === 200 && (await page.text()).includes('<textarea'));
  const put = await fetch(base + '/api/note', { method: 'PUT', headers: auth, body: 'hi 你好' });
  assert('note: PUT → 204', put.status === 204);
  const got = await fetch(base + '/api/note', { headers: auth });
  assert('note: GET returns saved text', got.status === 200 && (await got.text()) === 'hi 你好');
  assert('note: file written', readFileSync(noteFile, 'utf8') === 'hi 你好');
  assert('note: unknown path → 404', (await fetch(base + '/x', { headers: auth })).status === 404);
  nc.kill('SIGTERM');
}

// daemon lifecycle (isolated state dir)
const home = mkdtempSync(join(tmpdir(), 'lanshare-home-'));
const env = { CICY_HOME: home };
const d = runSkill(D, ['serve', root, '--port', '0', '--host', '127.0.0.1', '--daemon', '--json'], env);
assert('daemon: start exits 0', d.status === 0, d.stderr);
let dinfo = null; try { dinfo = JSON.parse(d.stdout).data; } catch {}
assert('daemon: reports pid + urls', dinfo && dinfo.pid > 0 && dinfo.urls.length > 0);
const st = runSkill(D, ['status', '--json'], env);
let sdata = null; try { sdata = JSON.parse(st.stdout).data; } catch {}
assert('daemon: status shows serve', sdata?.serve?.pid === dinfo?.pid);
assert('daemon: second start refused', runSkill(D, ['serve', root, '--port', '0', '--daemon'], env).status === 2);
const stop = runSkill(D, ['stop', '--json'], env);
assert('daemon: stop exits 0', stop.status === 0);
let stopData = null; try { stopData = JSON.parse(stop.stdout).data; } catch {}
assert('daemon: stop reports pid', stopData?.stopped?.[0]?.pid === dinfo?.pid);
assert('daemon: status empty after stop', runSkill(D, ['status'], env).stdout.trim() === 'not running');

finish();
