import test from 'node:test';
import assert from 'node:assert/strict';
import { patchBundle, START_PREFIX, END_MARKER } from '../lib/patch.js';

const anchor = 'this.processMirrorTaskMap=';
const mirrorAssignment = 'window.__mirrors=this.mirrors,';

test('injects one versioned hook before a unique anchor', () => {
  const result = patchBundle(`left;${anchor}right`, '0.1.0');
  assert.equal(result.changed, true);
  assert.equal(result.version, '0.1.0');
  assert.equal(result.source.split(mirrorAssignment).length - 1, 1);
  assert.match(result.source, new RegExp(`${START_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}0\\.1\\.0`));
  assert.equal(result.source.split(END_MARKER).length - 1, 1);
});

test('is idempotent for the installed version', () => {
  const once = patchBundle(`left;${anchor}right`, '0.1.0');
  const twice = patchBundle(once.source, '0.1.0');
  assert.equal(twice.changed, false);
  assert.equal(twice.source, once.source);
});

test('replaces an older marked hook instead of nesting it', () => {
  const old = patchBundle(`left;${anchor}right`, '0.1.0');
  const current = patchBundle(old.source, '0.2.0');
  assert.equal(current.changed, true);
  assert.equal(current.version, '0.2.0');
  assert.doesNotMatch(current.source, /tg-web-mirror-hook:0\.1\.0/);
  assert.equal(current.source.split(mirrorAssignment).length - 1, 1);
  assert.equal(current.source.split(END_MARKER).length - 1, 1);
});

test('adopts the legacy unmarked assignment without duplicating it', () => {
  const result = patchBundle(`left;${mirrorAssignment}${anchor}right`, '0.1.0');
  assert.equal(result.changed, true);
  assert.equal(result.source.split(mirrorAssignment).length - 1, 1);
  assert.equal(result.source.split(END_MARKER).length - 1, 1);
});

test('rejects a missing anchor without returning modified source', () => {
  assert.throws(() => patchBundle('no target here', '0.1.0'), /expected exactly one unpatched anchor; found 0/);
});

test('rejects duplicate anchors', () => {
  assert.throws(() => patchBundle(`${anchor}a;${anchor}b`, '0.1.0'), /expected exactly one unpatched anchor; found 2/);
});

test('rejects malformed or unbalanced markers', () => {
  assert.throws(() => patchBundle(`${START_PREFIX}0.1.0*/${anchor}`, '0.2.0'), /malformed hook markers/);
  assert.throws(() => patchBundle(`${END_MARKER}${anchor}`, '0.2.0'), /malformed hook markers/);
});

test('rejects invalid versions that could break JavaScript comments', () => {
  assert.throws(() => patchBundle(anchor, '0.1.0*/alert(1)'), /invalid version/);
});
