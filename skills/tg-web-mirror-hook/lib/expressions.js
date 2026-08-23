import {
  ANCHOR,
  ASSIGNMENT,
  START_PREFIX,
  END_MARKER,
  occurrences,
  patchBundle,
} from './patch.js';

function sharedPrelude(version) {
  return `
const ANCHOR = ${JSON.stringify(ANCHOR)};
const ASSIGNMENT = ${JSON.stringify(ASSIGNMENT)};
const START_PREFIX = ${JSON.stringify(START_PREFIX)};
const END_MARKER = ${JSON.stringify(END_MARKER)};
const VERSION_PATTERN = /^[0-9]+\\.[0-9]+\\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/;
const requestedVersion = ${JSON.stringify(version)};
${occurrences.toString()}
${patchBundle.toString()}
async function findBundles() {
  const found = [];
  for (const cacheName of await caches.keys()) {
    const cache = await caches.open(cacheName);
    for (const request of await cache.keys()) {
      if (!/\\/apiManagerProxy-[^/?]+\\.js(?:[?#]|$)/.test(request.url)) continue;
      const response = await cache.match(request);
      if (!response) continue;
      const source = await response.clone().text();
      if (!source.includes(ANCHOR) && !source.includes(START_PREFIX)) continue;
      found.push({ cacheName, cache, request, response, source });
    }
  }
  return found;
}
function inspectBundle(item) {
  const start = item.source.indexOf(START_PREFIX);
  const versionEnd = start === -1 ? -1 : item.source.indexOf('*/', start + START_PREFIX.length);
  return {
    cacheName: item.cacheName,
    url: item.request.url,
    sourceLength: item.source.length,
    markerCount: occurrences(item.source, START_PREFIX),
    endMarkerCount: occurrences(item.source, END_MARKER),
    version: start === -1 || versionEnd === -1 ? null : item.source.slice(start + START_PREFIX.length, versionEnd),
    anchorCount: occurrences(item.source, ANCHOR),
    assignmentCount: occurrences(item.source, ASSIGNMENT),
  };
}`;
}

export function buildInstallExpression(version) {
  return `(async()=>{
const operation = "install";
${sharedPrelude(version)}
const bundles = await findBundles();
if (bundles.length !== 1) throw new Error('expected exactly one active apiManagerProxy bundle; found ' + bundles.length);
const item = bundles[0];
const result = patchBundle(item.source, requestedVersion);
if (result.changed) {
  const headers = new Headers(item.response.headers);
  const replacement = new Response(result.source, {
    status: item.response.status,
    statusText: item.response.statusText,
    headers,
  });
  await item.cache.put(item.request, replacement);
}
return {ok:true,operation,changed:result.changed,...inspectBundle({...item,source:result.source}),version:requestedVersion};
})()`;
}

export function buildVerifyExpression(version) {
  return `(async()=>{
const operation = "verify";
${sharedPrelude(version)}
const bundles = await findBundles();
const inspected = bundles.map(inspectBundle);
const matching = inspected.filter(item => item.version === requestedVersion && item.markerCount === 1 && item.endMarkerCount === 1);
const mirrors = window.__mirrors;
return {
  ok:true,
  operation,
  cache: matching.length === 1 ? matching[0] : null,
  bundles: inspected,
  runtime: {
    present: typeof mirrors !== 'undefined' && mirrors !== null,
    type: mirrors === null ? 'null' : typeof mirrors,
    keyCount: mirrors && typeof mirrors === 'object' ? Object.keys(mirrors).length : 0,
    keys: mirrors && typeof mirrors === 'object' ? Object.keys(mirrors).slice(0,50) : [],
  },
};
})()`;
}
