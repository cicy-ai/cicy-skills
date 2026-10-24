#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const D = fileURLToPath(new URL('..', import.meta.url));
const SECRET = 's3cr3t-value-xyz';

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help documents list/show/exec', /list/.test(help.stdout) && /show/.test(help.stdout) && /exec/.test(help.stdout));
assert('no args prints help', runSkill(D, []).status === 0);

for (const c of ['set', 'get']) {
  const r = runSkill(D, [c, 'API_KEY', 'x']);
  assert(`${c} is refused (values only via UI)`, r.status === 1 && /UI/.test(r.stderr));
}
assert('exec without -- is rejected', runSkill(D, ['exec', '--env', 'API_KEY', 'node']).status === 1);
assert('exec with invalid key is rejected', runSkill(D, ['exec', '--env', '1bad', '--', 'node', '-v']).status === 1);

// fake cicy-code
const server = spawn(process.execPath, [join(D, 'test', 'fake-server.mjs')], { stdio: ['ignore', 'pipe', 'inherit'] });
const port = await new Promise((resolve) => server.stdout.once('data', (d) => resolve(String(d).trim())));
const env = { CICY_API_BASE: `http://127.0.0.1:${port}`, CICY_API_TOKEN: 'test-token' };

try {
  const list = runSkill(D, ['list'], env);
  assert('list exits 0', list.status === 0, list.stderr);
  assert('list shows keys and notes', /API_KEY/.test(list.stdout) && /OpenAI prod/.test(list.stdout) && /EMPTY_ONE\s+no/.test(list.stdout));
  assert('list never prints a value (even if the server leaks one)', !list.stdout.includes(SECRET));

  const json = runSkill(D, ['list', '--json'], env);
  let parsed; try { parsed = JSON.parse(json.stdout); } catch {}
  assert('list --json is valid', parsed?.ok === true && parsed.keys.length === 3);
  assert('list --json has no value field', !json.stdout.includes(SECRET) && !('value' in (parsed?.keys?.[0] || {})));

  const show = runSkill(D, ['show', 'API_KEY'], env);
  assert('show prints note, not value', show.status === 0 && /OpenAI prod/.test(show.stdout) && !show.stdout.includes(SECRET));
  assert('show unknown key exits 2', runSkill(D, ['show', 'NOPE'], env).status === 2);

  const script = "console.log('out:'+process.env.API_KEY);console.error('err:'+process.env.API_KEY);console.log('len='+process.env.API_KEY.length)";
  const ex = runSkill(D, ['exec', '--env', 'API_KEY', '--', process.execPath, '-e', script], env);
  assert('exec exits 0', ex.status === 0, ex.stderr);
  assert('exec injects the value (child sees it)', /len=16/.test(ex.stdout));
  assert('exec masks the value in stdout', /out:\*\*\*/.test(ex.stdout) && !ex.stdout.includes(SECRET));
  assert('exec masks the value in stderr', /err:\*\*\*/.test(ex.stderr) && !ex.stderr.includes(SECRET));

  const mapped = runSkill(D, ['exec', '--env', 'DB_PASS:PGPASSWORD', '--', process.execPath, '-e', "console.log(process.env.PGPASSWORD?'mapped':'none')"], env);
  assert('exec KEY:VAR maps to a different env var', /mapped/.test(mapped.stdout));

  const code = runSkill(D, ['exec', '--env', 'API_KEY', '--', process.execPath, '-e', 'process.exit(7)'], env);
  assert('exec propagates the child exit code', code.status === 7);

  assert('exec with a missing key exits 2', runSkill(D, ['exec', '--env', 'NOPE', '--', process.execPath, '-v'], env).status === 2);
  assert('bad token exits 3', runSkill(D, ['list'], { ...env, CICY_API_TOKEN: 'wrong' }).status === 3);
} finally {
  server.kill();
}
assert('unreachable cicy-code exits 3', runSkill(D, ['list'], { CICY_API_BASE: 'http://127.0.0.1:9', CICY_API_TOKEN: 'x' }).status === 3);

// Streaming masker: a value split across chunks is still masked.
const { makeMasker } = await import(join(D, 'bin', 'cicy-keystore'));
const m = makeMasker([SECRET]);
const out = m.push('a ' + SECRET.slice(0, 5)) + m.push(SECRET.slice(5) + ' b') + m.end();
assert('masker catches a value split across chunks', out === 'a *** b', out);

finish();
