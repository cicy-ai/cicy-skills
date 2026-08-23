import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, COMMANDS } from '../lib/args.js';
import { requireApply, validateReadOnlyExpression } from '../lib/safety.js';
import { TelegramWebError } from '../lib/errors.js';

test('preserves every recovered command name', () => {
  assert.deepEqual(COMMANDS, [
    'login', 'status', 'patch', 'account', 'chats', 'dialogs',
    'users', 'messages', 'open', 'send', 'eval', 'close',
  ]);
  for (const command of COMMANDS) assert.equal(parseArgs([command]).command, command);
});

test('login uses public platform-neutral defaults', () => {
  const parsed = parseArgs(['login']);
  assert.deepEqual(parsed.options, {
    fromProfile: 0,
    toAccount: 99,
    proxy: null,
    url: 'https://web.telegram.org/a/',
    fromClient: null,
  });
});

test('parses shared and command options without swallowing positionals', () => {
  const parsed = parseArgs([
    '--client', 'desktop-1', '--win', '3', '--backend', 'a', '--json',
    'dialogs', '--limit', '20', '--folder', 'archived',
  ]);
  assert.equal(parsed.client, 'desktop-1');
  assert.equal(parsed.target, '3');
  assert.equal(parsed.win, 3);
  assert.equal(parsed.backend, 'a');
  assert.equal(parsed.json, true);
  assert.equal(parsed.options.limit, 20);
  assert.equal(parsed.options.folder, 'archived');
});

test('rejects unknown commands, flags, backend, folder, and missing values', () => {
  for (const argv of [
    ['delete'], ['status', '--wat'], ['status', '--backend', 'z'],
    ['dialogs', '--folder', 'spam'], ['status', '--client'],
  ]) {
    assert.throws(() => parseArgs(argv), TelegramWebError);
  }
});

test('requires apply for account-changing commands', () => {
  for (const command of ['login', 'open', 'send', 'close']) {
    assert.throws(() => requireApply(command, false), (error) => error.code === 'APPLY_REQUIRED' && error.exitCode === 2);
    assert.doesNotThrow(() => requireApply(command, true));
  }
  assert.doesNotThrow(() => requireApply('status', false));
});

test('eval requires apply only when the expression is mutating', () => {
  assert.equal(validateReadOnlyExpression('state.messages.length'), 'state.messages.length');
  assert.doesNotThrow(() => requireApply('eval', false, 'state.messages.length'));
  for (const expression of [
    'state.x = 1', 'state.x++', 'actions.sendMessage({text:"x"})',
    'fetch("https://example.com")', 'localStorage.clear()', 'new Function("return 1")',
    'document.body.remove()', 'import("./x.js")',
  ]) {
    assert.throws(() => validateReadOnlyExpression(expression), (error) => error.code === 'UNSAFE_EVAL');
    assert.throws(() => requireApply('eval', false, expression), (error) => error.code === 'APPLY_REQUIRED');
  }
});

test('parses send text and messages defaults', () => {
  const send = parseArgs(['send', '777000', 'hello', 'world', '--apply']);
  assert.deepEqual(send.positional, ['777000', 'hello', 'world']);
  assert.equal(send.apply, true);
  assert.equal(parseArgs(['messages', '777000']).options.limit, 30);
});
