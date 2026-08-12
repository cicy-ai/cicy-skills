#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const D = new URL('..', import.meta.url).pathname;

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// no args → non-0 (python script will error with no agent-id)
const noArgs = runSkill(D, []);
assert('no args exits non-0', noArgs.status !== 0);

// non-existent agent id → non-0
const bad = runSkill(D, ['no-such-agent-id-xyz']);
assert('unknown agent exits non-0', bad.status !== 0);

const fixture = mkdtempSync(join(tmpdir(), 'agent-summary-'));
const snapshot = join(fixture, 'current.json');
writeFileSync(snapshot, JSON.stringify({
  conversation_id: 'qa-format',
  provider: 'openai',
  body: { messages: [
    { role: 'user', content: 'first question' },
    { role: 'assistant', content: 'first answer' },
    { role: 'user', content: 'second question' },
    { role: 'assistant', content: 'second answer' },
  ] },
}));
mkdirSync(join(fixture, 'summary'), { recursive: true });
const formatted = runSkill(D, [snapshot]);
assert('fixture exits 0', formatted.status === 0);
const transcript = readFileSync(formatted.stdout.trim(), 'utf8');
assert('uses Q labels', transcript.includes('Q: first question'));
assert('uses A labels', transcript.includes('A: first answer'));
assert('does not use USER labels', !transcript.includes('USER:'));
assert('does not use AI labels', !transcript.includes('AI:'));
assert('does not render turn headings', !transcript.includes('## Turn'));

finish();
