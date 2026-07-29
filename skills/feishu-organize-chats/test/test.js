#!/usr/bin/env node
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSkill, assert, finish } from '../../../tools/test-helper.js';

const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0', noArgs.status === 0);
assert('help mentions plan', noArgs.stdout.includes('plan'));
assert('help mentions cleanup', noArgs.stdout.includes('cleanup'));

const bad = runSkill(D, ['unknown']);
assert('unknown command exits 2', bad.status === 2);

const noPrefix = runSkill(D, ['plan']);
assert('plan requires prefix', noPrefix.status === 2);
assert('missing prefix is explained', noPrefix.stderr.includes('--prefix'));

const missingDB = runSkill(D, ['plan', '--prefix', 'Alice', '--json'], {
  CICY_DB_PATH: '/tmp/feishu-organize-chats-does-not-exist/data.db',
});
assert('missing database exits 3', missingDB.status === 3);
assert('missing database returns JSON', (() => {
  try { return JSON.parse(missingDB.stdout).ok === false; } catch { return false; }
})());

const temp = mkdtempSync(join(tmpdir(), 'feishu-organize-chats-'));
const emptyDB = join(temp, 'data.db');
writeFileSync(emptyDB, '');
const unsafeCleanup = runSkill(D, ['cleanup', '--prefix', 'Alice', '--apply'], {
  CICY_DB_PATH: emptyDB,
});
assert('cleanup apply requires exact confirmation', unsafeCleanup.status === 2);
assert('confirmation error is explicit', unsafeCleanup.stderr.includes('--confirm-prefix'));

finish();
