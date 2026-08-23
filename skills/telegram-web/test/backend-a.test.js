import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createBackendA, WEBPACK_PATCH } from '../lib/backend-a.js';

function webAContext(moduleId = '731') {
  const state = {
    currentUserId: '1', currentChatId: null, isInited: true, config: { thisDc: 2 },
    users: { byId: {
      1: { firstName: 'Me', lastName: 'User', usernames: [{ username: 'me' }], phoneNumber: '100', isPremium: true, isContact: true },
      2: { firstName: 'Alice', lastName: '', usernames: [{ username: 'alice' }], isContact: true },
    } },
    chats: {
      byId: { 2: { title: 'Alice', type: 'private', unreadCount: 3, lastReadInboxMessageId: 9 } },
      listIds: { active: ['2'], archived: [] },
    },
    messages: { byChatId: { 2: { byId: {
      10: { id: 10, date: 10, senderId: '2', isOutgoing: false, content: { text: { text: 'old' } } },
      11: { id: 11, date: 11, senderId: '1', isOutgoing: true, content: { text: { text: 'new' } }, replyToMessageId: 10 },
    } } } },
  };
  const actions = {
    openChat({ id }) { state.currentChatId = String(id); },
    sendMessage({ text }) {
      const bucket = state.messages.byChatId[state.currentChatId] || (state.messages.byChatId[state.currentChatId] = { byId: {} });
      const id = Math.max(0, ...Object.keys(bucket.byId).map(Number)) + 1;
      bucket.byId[id] = { id, date: id, senderId: state.currentUserId, isOutgoing: true, content: { text: { text } } };
    },
  };
  function typify() { return { getGlobal: () => state, setGlobal: () => {}, getActions: () => actions }; }
  const exportsById = { [moduleId]: { factory: typify } };
  const factories = { [moduleId]: () => {} };
  const window = { webpackChunktelegram_t: [] };
  window.webpackChunktelegram_t.push = (entry) => {
    const injected = entry[1];
    const runtime = entry[2];
    const cache = {};
    const req = (id) => {
      if (exportsById[id]) return exportsById[id];
      if (cache[id]) return cache[id].exports;
      if (!injected[id]) throw new Error(`missing module ${id}`);
      const module = { exports: {} }; cache[id] = module;
      injected[id](module, module.exports, req);
      return module.exports;
    };
    req.m = { ...factories, ...injected };
    return runtime(req);
  };
  return { window, state, actions };
}

function evaluator(context) {
  return async (expression) => vm.runInNewContext(expression, { window: context.window });
}

async function immediatePoll(check) {
  for (let i = 0; i < 5; i += 1) {
    const value = await check();
    if (value) return value;
  }
  return false;
}

test('webpack patch feature-detects changing module IDs and is idempotent', async () => {
  for (const moduleId of ['17', '99001']) {
    const context = webAContext(moduleId);
    const first = await evaluator(context)(WEBPACK_PATCH);
    const second = await evaluator(context)(WEBPACK_PATCH);
    assert.equal(first.ok, true);
    assert.equal(first.foundIn.moduleId, moduleId);
    assert.equal(second.alreadyPatched, true);
    assert.equal(context.window.__getGlobal().currentUserId, '1');
  }
  assert.doesNotMatch(WEBPACK_PATCH, /req\(['"]\d+['"]\)/);
});

test('normalizes account, chats, dialogs, users, and newest messages', async () => {
  const context = webAContext();
  const backend = createBackendA({ evaluate: evaluator(context), poll: immediatePoll });
  assert.deepEqual(await backend.account(), {
    id: '1', firstName: 'Me', lastName: 'User', usernames: ['me'], phoneNumber: '100', isPremium: true, backend: 'a',
  });
  assert.deepEqual(await backend.chats(), {
    2: { id: '2', title: 'Alice', type: 'private', isVerified: false, membersCount: null, unreadCount: 3 },
  });
  assert.deepEqual(await backend.dialogs({ limit: 1, folder: 'active' }), [
    { id: '2', title: 'Alice', type: 'private', unreadCount: 3, lastReadInboxMessageId: 9 },
  ]);
  assert.equal((await backend.users())['2'].username, 'alice');
  const messages = await backend.messages('2', { limit: 1 });
  assert.deepEqual(messages, [{ id: 11, date: 11, senderId: '1', isOutgoing: true, content: 'new', replyToMessageId: 10 }]);
});

test('open waits for observable current chat and send verifies outgoing message', async () => {
  const context = webAContext();
  const backend = createBackendA({ evaluate: evaluator(context), poll: immediatePoll });
  const opened = await backend.open('2');
  assert.deepEqual(opened, { opened: true, chatId: '2' });
  const sent = await backend.send('2', 'hello');
  assert.equal(sent.sent, true);
  assert.equal(sent.chatId, '2');
  assert.equal(sent.text, 'hello');
  assert.ok(Object.values(context.state.messages.byChatId['2'].byId).some((message) => message.isOutgoing && message.content.text.text === 'hello'));
});

test('read-only eval exposes a frozen snapshot instead of live actions', async () => {
  const context = webAContext();
  const backend = createBackendA({ evaluate: evaluator(context), poll: immediatePoll });
  assert.equal(await backend.evaluate('state.currentUserId', { applied: false }), '1');
  assert.equal(context.window.actions, undefined);
});
