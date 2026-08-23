export const ANCHOR = 'this.processMirrorTaskMap=';
export const ASSIGNMENT = 'window.__mirrors=this.mirrors,';
export const START_PREFIX = '/*tg-web-mirror-hook:';
export const END_MARKER = '/*/tg-web-mirror-hook*/';
const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/;

export function occurrences(source, needle) {
  let count = 0;
  let offset = 0;
  while ((offset = source.indexOf(needle, offset)) !== -1) {
    count += 1;
    offset += needle.length;
  }
  return count;
}

export function patchBundle(source, version) {
  if (typeof source !== 'string') throw new TypeError('bundle source must be a string');
  if (!VERSION_PATTERN.test(version)) throw new Error(`invalid version: ${version}`);

  const startCount = occurrences(source, START_PREFIX);
  const endCount = occurrences(source, END_MARKER);
  if (startCount > 1 || endCount > 1 || startCount !== endCount) {
    throw new Error(`malformed hook markers: starts=${startCount}, ends=${endCount}`);
  }

  let clean = source;
  let installedVersion = null;
  if (startCount === 1) {
    const start = clean.indexOf(START_PREFIX);
    const versionEnd = clean.indexOf('*/', start + START_PREFIX.length);
    const end = clean.indexOf(END_MARKER, versionEnd + 2);
    if (versionEnd === -1 || end === -1 || end < versionEnd) {
      throw new Error('malformed hook markers: invalid marker boundaries');
    }
    installedVersion = clean.slice(start + START_PREFIX.length, versionEnd);
    if (!VERSION_PATTERN.test(installedVersion)) {
      throw new Error(`malformed hook markers: invalid installed version ${installedVersion}`);
    }
    const body = clean.slice(versionEnd + 2, end);
    if (body !== ASSIGNMENT) {
      throw new Error('malformed hook markers: unexpected hook body');
    }
    if (installedVersion === version) {
      return { changed: false, source, version };
    }
    clean = clean.slice(0, start) + clean.slice(end + END_MARKER.length);
  }

  const legacy = ASSIGNMENT + ANCHOR;
  if (occurrences(clean, ASSIGNMENT) > 0) {
    if (occurrences(clean, legacy) !== 1 || occurrences(clean, ASSIGNMENT) !== 1) {
      throw new Error('unexpected window.__mirrors assignment outside hook');
    }
    clean = clean.replace(legacy, ANCHOR);
  }

  const anchorCount = occurrences(clean, ANCHOR);
  if (anchorCount !== 1) {
    throw new Error(`expected exactly one unpatched anchor; found ${anchorCount}`);
  }

  const marker = `${START_PREFIX}${version}*/${ASSIGNMENT}${END_MARKER}`;
  return {
    changed: true,
    source: clean.replace(ANCHOR, marker + ANCHOR),
    version,
  };
}
