#!/usr/bin/env node
// claude-design — black-box tests. No real agent-chrome calls (we don't have
// a chrome profile in CI), so we only cover argv parsing and help/error paths.

import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// --- help ---
const noArgs = runSkill(D, []);
assert('no args exits 0', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.length > 0);
assert('help mentions agent-chrome', noArgs.stdout.includes('agent-chrome'));
assert('help lists open',     noArgs.stdout.includes('open'));
assert('help lists prompt',   noArgs.stdout.includes('prompt'));
assert('help lists download', noArgs.stdout.includes('download'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// --- bad subcommand ---
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits 2', bad.status === 2);

// --- bad flag ---
const badFlag = runSkill(D, ['open', '--nope']);
assert('unknown flag exits 2', badFlag.status === 2);

// --- missing --idx ---
// (Note: parent env CLAUDE_DESIGN_IDX leaks through; clear it.)
const noIdx = runSkill(D, ['open'], { CLAUDE_DESIGN_IDX: '' });
assert('open without --idx exits 2', noIdx.status === 2);
assert('open without --idx complains about idx', /idx|IDX/.test(noIdx.stderr));

// --- exec without expression ---
const execEmpty = runSkill(D, ['exec'], { CLAUDE_DESIGN_IDX: '0' });
assert('exec without expression exits 2', execEmpty.status === 2);

// --- download with invalid --type ---
const badType = runSkill(D, ['download', '--type', 'bogus'], { CLAUDE_DESIGN_IDX: '0' });
assert('download with invalid --type exits 2', badType.status === 2);

finish();
