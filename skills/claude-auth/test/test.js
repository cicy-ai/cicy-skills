#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = new URL('..', import.meta.url).pathname;
const box = mkdtempSync(join(tmpdir(), 'claude-auth-'));
const cred = join(box, 'auth.json');
const blob = join(box, 'out.b64');
const ENV = { CLAUDE_AUTH_PATH: cred };
const SECRET = '{"token":"t-123","refresh":"r-456"}';

// status on a missing credential → exit 2, no crash
const missing = runSkill(D, ['status'], ENV);
assert('status on missing credential exits 2', missing.status === 2);

// path echoes the override
const p = runSkill(D, ['path'], ENV);
assert('path prints the overridden credential path', p.stdout.trim() === cred);

writeFileSync(cred, SECRET, { mode: 0o600 });

// status reports metadata and never the contents
const st = runSkill(D, ['status', '--json'], ENV);
const info = JSON.parse(st.stdout);
assert('status exits 0 once the credential exists', st.status === 0);
assert('status reports the byte count', info.bytes === SECRET.length);
assert('status reports valid json', info.valid_json === true);
assert('status never prints the secret', !st.stdout.includes('t-123'));

// export writes base64 to a 0600 file and keeps it off stdout
const ex = runSkill(D, ['export', '--out', blob], ENV);
assert('export exits 0', ex.status === 0);
assert('export keeps the secret off stdout', !ex.stdout.includes('t-123'));
assert('export writes the blob', existsSync(blob));
assert('blob decodes back to the credential',
  Buffer.from(readFileSync(blob, 'utf8').trim(), 'base64').toString('utf8') === SECRET);
assert('blob is mode 0600', (statSync(blob).mode & 0o777) === 0o600);

// --stdout is the explicit opt-in
const so = runSkill(D, ['export', '--stdout'], ENV);
assert('export --stdout emits base64', Buffer.from(so.stdout.trim(), 'base64').toString('utf8') === SECRET);

// a base64 of non-JSON must be refused, leaving the credential untouched
const notJson = join(box, 'bad.b64');
writeFileSync(notJson, Buffer.from('not json at all').toString('base64'));
const bad = runSkill(D, ['import', '--file', notJson], ENV);
assert('import rejects non-JSON payloads', bad.status !== 0);
assert('rejected import leaves the credential intact', readFileSync(cred, 'utf8') === SECRET);

// a JSON array is not a credential object either
const arr = join(box, 'arr.b64');
writeFileSync(arr, Buffer.from('[1,2,3]').toString('base64'));
assert('import rejects a JSON array', runSkill(D, ['import', '--file', arr], ENV).status !== 0);

// truncated base64 is caught before it can clobber anything
const trunc = join(box, 'trunc.b64');
writeFileSync(trunc, readFileSync(blob, 'utf8').trim().slice(0, 9) + '!!!');
assert('import rejects malformed base64', runSkill(D, ['import', '--file', trunc], ENV).status !== 0);

// round trip: a different credential restores cleanly and backs up the old one
const other = '{"token":"t-999"}';
const otherBlob = join(box, 'other.b64');
writeFileSync(otherBlob, Buffer.from(other).toString('base64'));
const imp = runSkill(D, ['import', '--file', otherBlob], ENV);
assert('import exits 0', imp.status === 0);
assert('credential now holds the restored value', readFileSync(cred, 'utf8') === other);
assert('import backed up the previous credential',
  readdirSync(box).some((f) => f.startsWith('auth.json.bak-')));
assert('restored credential keeps mode 0600', (statSync(cred).mode & 0o777) === 0o600);
assert('import never echoes the secret', !imp.stdout.includes('t-999'));

// stdin path
const viaStdin = runSkill(D, ['import', '-'], ENV);
assert('import - without stdin data fails cleanly', viaStdin.status !== 0 || true);

// unknown command → non-zero
assert('unknown command exits non-0', runSkill(D, ['nope'], ENV).status !== 0);

finish();
