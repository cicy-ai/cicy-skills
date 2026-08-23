import { TelegramWebError } from './errors.js';
import { plain } from './normalize.js';
import { validateReadOnlyExpression } from './safety.js';

function createBackendK({ evaluate, mirror, target }) {
  if (typeof evaluate !== 'function' || typeof mirror !== 'function' || !target) throw new TypeError('evaluate, mirror, and target are required');

  async function patch() {
    const result = await mirror(['install', '--target', target, '--json']);
    if (result && result.ok === false) throw new TelegramWebError('PATCH_FAILED', result.error?.message || 'mirror hook failed', 5);
    return plain(result);
  }

  async function mirrorEval(expression) {
    const value = await evaluate(`(() => { const mirrors=window.__mirrors; if(!mirrors || typeof mirrors!=='object') return {__telegramError:'window.__mirrors is unavailable'}; return (${expression}); })()`);
    if (value && value.__telegramError) throw new TelegramWebError('UNSUPPORTED_STATE_SHAPE', value.__telegramError, 5);
    return plain(value);
  }

  function objectGuard(name, body) {
    return `(() => { const value=mirrors[${JSON.stringify(name)}]; if(!value || typeof value!=='object' || Array.isArray(value)) return {__telegramError:${JSON.stringify(`${name} mirror must be an object`)}}; ${body} })()`;
  }

  async function status() {
    return mirrorEval(`({ backend:'k', patched:true, loggedIn:!!mirrors.state?.currentUserId, currentUserId:mirrors.state?.currentUserId == null ? null : String(mirrors.state.currentUserId), chatCount:Object.keys(mirrors.communityDialogs || {}).length, userCount:Object.values(mirrors.peers || {}).filter(p=>p?.type==='user').length, mirrorKeys:Object.keys(mirrors) })`);
  }

  async function account() {
    return mirrorEval(objectGuard('peers', `
      const id=mirrors.state?.currentUserId;
      const user=id == null ? null : value[id];
      if(!user) return {__telegramError:'current account is not present in state/peers mirrors'};
      const username=user.username || user.usernames?.[0]?.username || null;
      return { id:String(id), firstName:user.firstName || '', lastName:user.lastName || '', usernames:username ? [username] : [], phoneNumber:user.phoneNumber || null, isPremium:!!user.isPremium, backend:'k' };
    `));
  }

  async function chats() {
    return mirrorEval(objectGuard('peers', `
      const dialogs=mirrors.communityDialogs && typeof mirrors.communityDialogs==='object' ? mirrors.communityDialogs : {};
      return Object.fromEntries(Object.entries(value).map(([id,p]) => { const d=dialogs[id] || {}; return [id,{ id:String(id), title:p.title || [p.firstName,p.lastName].filter(Boolean).join(' ') || String(id), type:p.type || 'unknown', isVerified:!!p.isVerified, membersCount:p.membersCount ?? null, unreadCount:d.unreadCount || p.unreadCount || 0 }]; }));
    `));
  }

  async function dialogs(options = {}) {
    const limit = Number(options.limit ?? 50);
    const folder = options.folder || 'active';
    if (folder === 'archived') return [];
    return mirrorEval(objectGuard('communityDialogs', `
      const peers=mirrors.peers && typeof mirrors.peers==='object' ? mirrors.peers : {};
      return Object.entries(value).sort((a,b)=>Number(b[1]?.order ?? 0)-Number(a[1]?.order ?? 0)).slice(0,${limit}).map(([key,d]) => { const id=String(d.peerId ?? d.id ?? key); const p=peers[id] || {}; return { id, title:p.title || [p.firstName,p.lastName].filter(Boolean).join(' ') || id, type:p.type || 'unknown', unreadCount:d.unreadCount || 0, lastReadInboxMessageId:d.lastReadInboxMessageId ?? null }; });
    `));
  }

  async function users() {
    return mirrorEval(objectGuard('peers', `
      return Object.fromEntries(Object.entries(value).filter(([,p])=>p?.type==='user').map(([id,u]) => [id,{ id:String(id), firstName:u.firstName || '', lastName:u.lastName || '', username:u.username || u.usernames?.[0]?.username || null, isPremium:!!u.isPremium, isContact:!!u.isContact, isBot:!!u.isBot }]));
    `));
  }

  async function messages(chatId, options = {}) {
    const limit = Number(options.limit ?? 30);
    const id = String(chatId);
    return mirrorEval(objectGuard('messages', `
      const bucket=value[${JSON.stringify(id)}];
      if(bucket == null) return [];
      const byId=bucket.byId && typeof bucket.byId==='object' ? bucket.byId : bucket;
      if(!byId || typeof byId!=='object' || Array.isArray(byId)) return {__telegramError:'messages chat bucket must be an object'};
      return Object.values(byId).sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,${limit}).map(m=>({ id:m.id, date:m.date ?? null, senderId:m.senderId == null ? null : String(m.senderId), isOutgoing:!!m.isOutgoing, content:m.message ?? m.content?.text?.text ?? (m.content ? Object.keys(m.content)[0] : null), replyToMessageId:m.replyToMessageId ?? null }));
    `));
  }

  async function unsupported(action) {
    throw new TelegramWebError('UNSUPPORTED_BACKEND_ACTION', `Web K ${action} has no verified action capability`, 5);
  }

  async function evalExpression(expression, options = {}) {
    if (options.applied) return mirrorEval(`(() => { const mirrors=window.__mirrors; return (${expression}); })()`);
    validateReadOnlyExpression(expression);
    return mirrorEval(`(() => { const freeze=o=>{ if(o&&typeof o==='object'&&!Object.isFrozen(o)){ Object.freeze(o); for(const v of Object.values(o)) freeze(v); } return o; }; const state=freeze(JSON.parse(JSON.stringify(mirrors))); return (${expression}); })()`);
  }

  return {
    backend: 'k', patch, status, account, chats, dialogs, users, messages,
    open: () => unsupported('open'),
    send: () => unsupported('send'),
    evaluate: evalExpression,
  };
}

export { createBackendK };
