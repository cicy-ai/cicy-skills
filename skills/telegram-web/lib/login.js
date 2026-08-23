import { TelegramWebError } from './errors.js';
import { decodeCdpValue } from './transport.js';
import { saveSession } from './session.js';
import { backendFromUrl } from './targets.js';

function unwrapData(response) {
  return response && Object.prototype.hasOwnProperty.call(response, 'data') ? response.data : response;
}

async function defaultPoll(check, attempts = 40, intervalMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const value = await check();
    if (value) return value;
    if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}

function parseStorage(response) {
  let value;
  try { value = decodeCdpValue(response); }
  catch {
    value = unwrapData(response)?.value;
  }
  if (typeof value !== 'string') throw new TelegramWebError('SOURCE_STORAGE_FAILED', 'Chrome localStorage result was not a JSON string', 5);
  try { return JSON.parse(value); }
  catch { throw new TelegramWebError('SOURCE_STORAGE_FAILED', 'Chrome localStorage result was invalid JSON', 5); }
}

async function login({ transport, options, sessionPath, patchBackend, poll = defaultPoll }) {
  const storageExpression = 'JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])))';
  const chromeResponse = transport.chrome([
    'cdp', 'Runtime.evaluate', JSON.stringify({ expression: storageExpression, returnByValue: true }),
    '--idx', String(options.fromProfile), '--json',
  ]);
  const storage = parseStorage(chromeResponse);
  if (!storage.user_auth && !storage.account1) {
    throw new TelegramWebError('SOURCE_NOT_LOGGED_IN', `Chrome profile ${options.fromProfile} has no Telegram auth keys`, 4);
  }

  const existingResponse = transport.electron(['webcontents', '--json']);
  const existing = (unwrapData(existingResponse) || []).filter((item) => item.url && item.url.startsWith(options.url) && Number(item.profileId) === Number(options.toAccount));
  if (existing.length > 1) throw new TelegramWebError('TARGET_AMBIGUOUS', 'multiple target-account Telegram windows already exist', 4);

  if (options.proxy) transport.electron(['proxy', String(options.toAccount), options.proxy]);
  let target;
  if (existing.length === 1) {
    target = `wc:${existing[0].webContentsId}`;
  } else {
    const opened = unwrapData(transport.electron(['open', options.url, '--idx', String(options.toAccount), '--no-reuse', '--json']));
    const winId = opened?.winId ?? opened?.id;
    if (winId == null) throw new TelegramWebError('OPEN_FAILED', 'agent-electron did not return a window id', 5);
    target = String(winId);
  }

  const ready = await poll(() => {
    const info = unwrapData(transport.electron(['window', target, '--json']));
    return info && info.isDomReady && !info.isLoading ? info : null;
  });
  if (!ready) throw new TelegramWebError('DOM_READY_TIMEOUT', `target ${target} did not become DOM-ready`, 5);

  const encoded = Buffer.from(JSON.stringify(storage), 'utf8').toString('base64');
  const injection = `(() => { const values=JSON.parse(atob(${JSON.stringify(encoded)})); localStorage.clear(); for(const [key,value] of Object.entries(values)) localStorage.setItem(key,value); return {keys:Object.keys(values).length}; })()`;
  let injected;
  try {
    injected = decodeCdpValue(transport.electron(['cdp', target, 'Runtime.evaluate', JSON.stringify({ expression: injection, returnByValue: true })]));
  } catch {
    throw new TelegramWebError('STORAGE_INJECT_FAILED', 'failed to inject authenticated localStorage (details redacted)', 5);
  }
  if (!injected || !injected.keys) throw new TelegramWebError('STORAGE_INJECT_FAILED', 'no localStorage keys were injected', 5);
  transport.electron(['cdp', target, 'Page.reload', JSON.stringify({ ignoreCache: false })]);

  const logged = await poll(() => {
    const expression = `(() => { let auth=null; try{auth=JSON.parse(localStorage.getItem('user_auth')||'null')}catch{} return {logged:!!document.querySelector('.chat-list'),userId:auth?.id == null ? null : String(auth.id)}; })()`;
    try {
      const value = decodeCdpValue(transport.electron(['cdp', target, 'Runtime.evaluate', JSON.stringify({ expression, returnByValue: true })]));
      return value?.logged ? value : null;
    } catch { return null; }
  });
  if (!logged) throw new TelegramWebError('LOGIN_TIMEOUT', 'Telegram did not reach a logged-in state', 5);

  const backend = backendFromUrl(options.url);
  const patched = await patchBackend({ target, backend });
  const now = new Date().toISOString();
  const session = {
    version: 1,
    clientId: transport.client,
    target,
    url: options.url,
    backend,
    accountIdx: options.toAccount,
    fromProfile: options.fromProfile,
    currentUserId: logged.userId,
    createdAt: now,
    updatedAt: now,
    patchVersion: patched?.version || null,
  };
  saveSession(sessionPath, session);
  return {
    target,
    backend,
    accountIdx: options.toAccount,
    fromProfile: options.fromProfile,
    currentUserId: logged.userId,
    sessionPath,
    patched: Boolean(patched),
  };
}

export { defaultPoll, login, parseStorage };
