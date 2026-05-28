#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);
assert('help mentions --pane', help.stdout.includes('--pane') || help.stdout.includes('pane_id'));

// no args → non-0 (shows help and exits 2)
const noArgs = runSkill(D, []);
assert('no args exits non-0', noArgs.status !== 0);

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// no identity at all (X_AGENT_SHORT_ID / CICY_PANE_ID / X_AGENT_ID) → exit 2.
// Wipe all three explicitly (the runner inherits them inside a cicy pane).
const noEnv = runSkill(D, ['list', '--json'], { X_AGENT_SHORT_ID: '', CICY_PANE_ID: '', X_AGENT_ID: '' });
assert('no identity env vars exits 2', noEnv.status === 2);
assert('no env error mentions X_AGENT_SHORT_ID',
  noEnv.stderr.includes('X_AGENT_SHORT_ID') || noEnv.stdout.includes('X_AGENT_SHORT_ID'));

// X_AGENT_ID alone resolves the pane (sub-agent fallback) → reaches network,
// so it must NOT exit 2 on identity; with no server it fails as a net error.
const idFallback = runSkill(D, ['list', '--json'],
  { X_AGENT_SHORT_ID: '', CICY_PANE_ID: '', X_AGENT_ID: 'w-10029:main.0', CICY_API_PORT: '1' });
assert('X_AGENT_ID fallback does not exit 2 on identity', idFallback.status !== 2);

// worker pane using --pane flag → exit 2 (rejected client-side)
const workerPane = runSkill(D, ['list', '--pane', 'w-10025'], { X_AGENT_SHORT_ID: 'w-10025' });
assert('worker using --pane exits 2', workerPane.status === 2);

// without server → non-0 (network error)
const list = runSkill(D, ['list', '--json'], { X_AGENT_SHORT_ID: 'w-99999', CICY_API_PORT: '1' });
assert('list without server exits non-0', list.status !== 0);

finish();
