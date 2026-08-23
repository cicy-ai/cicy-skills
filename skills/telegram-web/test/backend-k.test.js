import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createBackendK } from '../lib/backend-k.js';

function mirrorsFixture() {
  return {
    state: { currentUserId: '1' },
    peers: {
      1: { id: '1', type: 'user', firstName: 'Me', lastName: 'K', username: 'mek', phoneNumber: '100', isPremium: true, isContact: true },
      2: { id: '2', type: 'user', firstName: 'Alice', username: 'alice', isContact: true },
      '-100': { id: '-100', type: 'channel', title: 'News', isVerified: true, membersCount: 20 },
    },
    communityDialogs: {
      '-100': { peerId: '-100', order: 200, unreadCount: 4, lastReadInboxMessageId: 8 },
      2: { peerId: '2', order: 100, unreadCount: 1, lastReadInboxMessageId: 9 },
    },
    messages: {
      '-100': {
        10: { id: 10, date: 10, senderId: '2', message: 'old', isOutgoing: false },
        11: { id: 11, date: 11, senderId: '1', message: 'new', isOutgoing: true, replyToMessageId: 10 },
      },
    },
    historyStorage: { '-100': [11, 10] },
  };
}

function evaluator(mirrors) {
  return async (expression) => vm.runInNewContext(expression, { window: { __mirrors: mirrors } });
}

test('delegates Web K patch to mirror hook with the typed target', async () => {
  const calls = [];
  const backend = createBackendK({
    evaluate: evaluator(mirrorsFixture()),
    mirror: (args) => { calls.push(args); return { changed: false, verified: true, version: '0.1.0' }; },
    target: 'wc:5',
  });
  const result = await backend.patch();
  assert.equal(result.verified, true);
  assert.deepEqual(calls, [['install', '--target', 'wc:5', '--json']]);
});

test('normalizes account, chats, dialogs, users, and messages from mirrors', async () => {
  const backend = createBackendK({ evaluate: evaluator(mirrorsFixture()), mirror: () => ({}), target: 'wc:5' });
  assert.deepEqual(await backend.account(), {
    id: '1', firstName: 'Me', lastName: 'K', usernames: ['mek'], phoneNumber: '100', isPremium: true, backend: 'k',
  });
  assert.equal((await backend.chats())['-100'].title, 'News');
  assert.deepEqual((await backend.dialogs({ limit: 1, folder: 'active' }))[0], {
    id: '-100', title: 'News', type: 'channel', unreadCount: 4, lastReadInboxMessageId: 8,
  });
  assert.equal((await backend.users())['2'].username, 'alice');
  assert.deepEqual(await backend.messages('-100', { limit: 1 }), [
    { id: 11, date: 11, senderId: '1', isOutgoing: true, content: 'new', replyToMessageId: 10 },
  ]);
});

test('empty but valid mirrors return empty collections', async () => {
  const mirrors = { peers: {}, communityDialogs: {}, messages: {}, state: {} };
  const backend = createBackendK({ evaluate: evaluator(mirrors), mirror: () => ({}), target: 'wc:5' });
  assert.deepEqual(await backend.chats(), {});
  assert.deepEqual(await backend.dialogs(), []);
  assert.deepEqual(await backend.users(), {});
  assert.deepEqual(await backend.messages('1'), []);
});

test('changed or missing mirror shapes fail explicitly', async () => {
  const backend = createBackendK({ evaluate: evaluator({ peers: null, messages: [] }), mirror: () => ({}), target: 'wc:5' });
  await assert.rejects(() => backend.users(), (error) => error.code === 'UNSUPPORTED_STATE_SHAPE');
  await assert.rejects(() => backend.messages('1'), (error) => error.code === 'UNSUPPORTED_STATE_SHAPE');
});

test('unsupported Web K actions fail without trying a UI guess', async () => {
  const backend = createBackendK({ evaluate: evaluator(mirrorsFixture()), mirror: () => ({}), target: 'wc:5' });
  await assert.rejects(() => backend.open('2'), (error) => error.code === 'UNSUPPORTED_BACKEND_ACTION');
  await assert.rejects(() => backend.send('2', 'hello'), (error) => error.code === 'UNSUPPORTED_BACKEND_ACTION');
});

test('read-only eval exposes frozen mirror snapshot', async () => {
  const backend = createBackendK({ evaluate: evaluator(mirrorsFixture()), mirror: () => ({}), target: 'wc:5' });
  assert.equal(await backend.evaluate('state.peers["2"].firstName', { applied: false }), 'Alice');
});
