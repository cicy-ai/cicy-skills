import { TelegramWebError } from './errors.js';
import { plain } from './normalize.js';
import { validateReadOnlyExpression } from './safety.js';

const WEBPACK_PATCH = `(() => {
  if (window.__tt && typeof window.__getGlobal === 'function') {
    try {
      const g = window.__getGlobal();
      if (g && typeof g === 'object') return { ok: true, alreadyPatched: true, currentUserId: g.currentUserId, isInited: g.isInited };
    } catch {}
  }
  if (!Array.isArray(window.webpackChunktelegram_t)) return { ok: false, err: 'webpackChunktelegram_t not present' };
  let req;
  const patchId = '__telegram_web_' + Date.now();
  try {
    window.webpackChunktelegram_t.push([[patchId], { [patchId]: (m,e,r) => { req = r; } }, (r) => r(patchId)]);
  } catch (error) { return { ok: false, err: 'webpack push failed: ' + error.message }; }
  if (!req) return { ok: false, err: 'webpack require not captured' };
  const ids = Object.keys(req.m || {});
  let typify = null;
  let foundIn = null;
  for (const id of ids) {
    let exports;
    try { exports = req(id); } catch { continue; }
    if (!exports || typeof exports !== 'object') continue;
    for (const key of Object.keys(exports)) {
      let candidate;
      try { candidate = exports[key]; } catch { continue; }
      if (typeof candidate !== 'function' || candidate.length !== 0) continue;
      let source;
      try { source = candidate.toString(); } catch { continue; }
      if (!/getGlobal\\b/.test(source) || !/setGlobal\\b/.test(source) || !/getActions\\b/.test(source)) continue;
      let typed;
      try { typed = candidate(); } catch { continue; }
      if (typed && typeof typed.getGlobal === 'function' && typeof typed.setGlobal === 'function' && typeof typed.getActions === 'function') {
        typify = candidate;
        foundIn = { moduleId: id, exportKey: key };
        break;
      }
    }
    if (typify) break;
  }
  if (!typify) return { ok: false, err: 'typify not found among ' + ids.length + ' modules' };
  const typed = typify();
  window.__tt = typed;
  window.__getGlobal = typed.getGlobal;
  window.__setGlobal = typed.setGlobal;
  window.__getActions = typed.getActions;
  const g = typed.getGlobal();
  return { ok: true, foundIn, currentUserId: g && g.currentUserId, isInited: g && g.isInited, modulesScanned: ids.length };
})()`;

function createBackendA({ evaluate, poll }) {
  if (typeof evaluate !== 'function' || typeof poll !== 'function') throw new TypeError('evaluate and poll are required');

  async function patch() {
    const result = await evaluate(WEBPACK_PATCH);
    if (!result || !result.ok) throw new TelegramWebError('PATCH_FAILED', result && result.err || 'Web A patch failed', 5);
    return plain(result);
  }

  async function globalEval(expression) {
    await patch();
    return plain(await evaluate(`(() => { const g = window.__getGlobal(); return (${expression}); })()`));
  }

  async function status() {
    return globalEval(`({ backend:'a', patched:true, loggedIn:!!g.currentUserId, currentUserId:g.currentUserId || null, currentChatId:g.currentChatId || null, chatCount:g.chats?.listIds?.active?.length ?? 0, userCount:Object.keys(g.users?.byId || {}).length })`);
  }

  async function account() {
    return globalEval(`(() => { const user=g.users?.byId?.[g.currentUserId]; if(!user) return null; return { id:String(g.currentUserId), firstName:user.firstName || '', lastName:user.lastName || '', usernames:(user.usernames || []).map(x=>x.username).filter(Boolean), phoneNumber:user.phoneNumber || null, isPremium:!!user.isPremium, backend:'a' }; })()`);
  }

  async function chats() {
    return globalEval(`Object.fromEntries(Object.entries(g.chats?.byId || {}).map(([id,c]) => [id,{ id:String(id), title:c.title || '', type:c.type || 'unknown', isVerified:!!c.isVerified, membersCount:c.membersCount ?? null, unreadCount:c.unreadCount || 0 }]))`);
  }

  async function dialogs(options = {}) {
    const limit = Number(options.limit ?? 50);
    const folder = options.folder || 'active';
    return globalEval(`(() => { const ids=g.chats?.listIds?.[${JSON.stringify(folder)}] || []; return ids.slice(0,${limit}).map(rawId => { const id=String(rawId); const c=g.chats?.byId?.[rawId]; const u=g.users?.byId?.[rawId]; return { id, title:c?.title || (u ? [u.firstName,u.lastName].filter(Boolean).join(' ') : id), type:c?.type || (u ? 'private' : 'unknown'), unreadCount:c?.unreadCount || 0, lastReadInboxMessageId:c?.lastReadInboxMessageId ?? null }; }); })()`);
  }

  async function users() {
    return globalEval(`Object.fromEntries(Object.entries(g.users?.byId || {}).map(([id,u]) => [id,{ id:String(id), firstName:u.firstName || '', lastName:u.lastName || '', username:u.usernames?.[0]?.username || null, isPremium:!!u.isPremium, isContact:!!u.isContact, isBot:!!u.isBot }]))`);
  }

  async function messages(chatId, options = {}) {
    const limit = Number(options.limit ?? 30);
    return globalEval(`(() => { const byId=g.messages?.byChatId?.[${JSON.stringify(String(chatId))}]?.byId || {}; return Object.values(byId).sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,${limit}).map(m=>({ id:m.id, date:m.date ?? null, senderId:m.senderId == null ? null : String(m.senderId), isOutgoing:!!m.isOutgoing, content:m.content?.text?.text || (m.content ? Object.keys(m.content)[0] : null), replyToMessageId:m.replyToMessageId ?? null })); })()`);
  }

  async function open(chatId) {
    await patch();
    const id = String(chatId);
    const dispatched = await evaluate(`(() => { window.__getActions().openChat({id:${JSON.stringify(id)}}); return true; })()`);
    if (!dispatched) throw new TelegramWebError('ACTION_FAILED', 'openChat dispatch failed', 5);
    const observed = await poll(async () => Boolean(await globalEval(`String(g.currentChatId) === ${JSON.stringify(id)}`)));
    if (!observed) throw new TelegramWebError('ACTION_NOT_VERIFIED', `currentChatId did not become ${id}`, 5);
    return { opened: true, chatId: id };
  }

  async function send(chatId, text) {
    const id = String(chatId);
    await open(id);
    const before = await globalEval(`Math.max(0,...Object.keys(g.messages?.byChatId?.[${JSON.stringify(id)}]?.byId || {}).map(Number))`);
    await evaluate(`(() => { window.__getActions().sendMessage({text:${JSON.stringify(text)}}); return true; })()`);
    const verified = await poll(async () => globalEval(`Object.values(g.messages?.byChatId?.[${JSON.stringify(id)}]?.byId || {}).some(m => Number(m.id) > ${Number(before)} && m.isOutgoing && m.content?.text?.text === ${JSON.stringify(text)})`));
    if (!verified) throw new TelegramWebError('ACTION_NOT_VERIFIED', 'outgoing message was not observed', 5);
    return { sent: true, chatId: id, text };
  }

  async function evalExpression(expression, options = {}) {
    await patch();
    if (options.applied) {
      return plain(await evaluate(`(() => { const g=window.__getGlobal(); const actions=window.__getActions(); const tt=window.__tt; return (${expression}); })()`));
    }
    validateReadOnlyExpression(expression);
    return plain(await evaluate(`(() => { const freeze=o=>{ if(o&&typeof o==='object'&&!Object.isFrozen(o)){ Object.freeze(o); for(const v of Object.values(o)) freeze(v); } return o; }; const state=freeze(JSON.parse(JSON.stringify(window.__getGlobal()))); return (${expression}); })()`));
  }

  return { backend: 'a', patch, status, account, chats, dialogs, users, messages, open, send, evaluate: evalExpression };
}

export { WEBPACK_PATCH, createBackendA };
