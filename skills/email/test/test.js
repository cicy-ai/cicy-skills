#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = new URL('..', import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), 'email-test-'));
const missing = join(tmp, 'missing.json');
const ready = join(tmp, 'ready.json');
writeFileSync(ready, JSON.stringify({
  smtp: { host: 'smtp.x', port: 465, secure: true, user: 'u', pass: 'p', from: 'a@x' },
}));

// help
const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help mentions smtp', /smtp/i.test(help.stdout));

// status --json on a MISSING config → ok:true, not ready
const s1 = runSkill(D, ['status', '--json'], { CICY_EMAIL_CONFIG: missing });
assert('status(missing) exits 0', s1.status === 0);
let j1; try { j1 = JSON.parse(s1.stdout); } catch {}
assert('status(missing) valid JSON ok', !!j1 && j1.ok === true);
assert('status(missing) has send_ready field', j1 && 'send_ready' in j1.data);
assert('status(missing) send_ready false', j1 && j1.data.send_ready === false);

// status --json on a SMTP-ready config → send_ready true
const s2 = runSkill(D, ['status', '--json'], { CICY_EMAIL_CONFIG: ready });
let j2; try { j2 = JSON.parse(s2.stdout); } catch {}
assert('status(ready) smtp_ready true', j2 && j2.data.smtp_ready === true);
assert('status(ready) send_ready true', j2 && j2.data.send_ready === true);

// send with NO config → exit 3 (refuse — important for token rotation gating)
const sendNoCfg = runSkill(D, ['send', '--to', 'x@y.com', '--subject', 'hi', '--body', 'hi'], { CICY_EMAIL_CONFIG: missing });
assert('send(missing config) exits 3', sendNoCfg.status === 3);

// send with config but no --to → exit 2 (usage)
const sendNoTo = runSkill(D, ['send', '--subject', 'hi', '--body', 'hi'], { CICY_EMAIL_CONFIG: ready });
assert('send(no --to) exits 2', sendNoTo.status === 2);

finish();
