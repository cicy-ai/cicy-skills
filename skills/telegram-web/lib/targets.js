import { TelegramWebError } from './errors.js';

function backendFromUrl(url) {
  if (/^https:\/\/web\.telegram\.org\/a(?:\/|$)/.test(url || '')) return 'a';
  if (/^https:\/\/web\.telegram\.org\/k(?:\/|$)/.test(url || '')) return 'k';
  throw new TelegramWebError('UNSUPPORTED_URL', `not a supported Telegram Web A/K URL: ${url || '(empty)'}`, 4);
}

function unwrapData(response) {
  return response && Object.prototype.hasOwnProperty.call(response, 'data') ? response.data : response;
}

function inspectedTarget(transport, target, requestedBackend) {
  const data = unwrapData(transport.electron(['window', target, '--json']));
  const info = data?.result?.url ? data.result : data;
  const url = info && info.url;
  const backend = backendFromUrl(url);
  if (requestedBackend && requestedBackend !== backend) {
    throw new TelegramWebError('BACKEND_CONFLICT', `target URL selects backend ${backend}, not ${requestedBackend}`, 4);
  }
  return { target, url, backend, profileId: info.profileId ?? info.accountIdx ?? null };
}

function discoverTarget(transport, options = {}, session = null) {
  if (options.target) return inspectedTarget(transport, String(options.target), options.backend);
  if (session && session.target) {
    try { return inspectedTarget(transport, session.target, options.backend); }
    catch (error) {
      if (error.code === 'BACKEND_CONFLICT') throw error;
    }
  }
  const response = transport.electron(['webcontents', '--json']);
  const list = unwrapData(response);
  const candidates = (Array.isArray(list) ? list : []).flatMap((item) => {
    try {
      const backend = backendFromUrl(item.url);
      if (options.backend && options.backend !== backend) return [];
      return [{ target: `wc:${item.webContentsId}`, url: item.url, backend, profileId: item.profileId ?? null }];
    } catch { return []; }
  });
  if (candidates.length === 0) throw new TelegramWebError('TARGET_NOT_FOUND', 'no live Telegram Web A/K target found', 4);
  if (candidates.length > 1) {
    throw new TelegramWebError('TARGET_AMBIGUOUS', `multiple Telegram Web targets found: ${candidates.map((item) => item.target).join(', ')}`, 4);
  }
  return candidates[0];
}

export { backendFromUrl, discoverTarget };
