import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { patchBundle } from '../lib/patch.js';
import { buildInstallExpression } from '../lib/expressions.js';

test('patched Telegram-style ES module remains parseable', () => {
  const source = 'import value from "./dependency.js";function A(){this.mirrors={},this.processMirrorTaskMap=1}export {A};export default value;';
  const patched = patchBundle(source, '0.1.0');
  const dir = mkdtempSync(join(tmpdir(), 'tg-hook-parse-'));
  const file = join(dir, 'bundle.mjs');
  writeFileSync(file, patched.source);
  assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }));
  rmSync(dir, { recursive: true, force: true });
});

test('browser installer does not parse an ES module as a classic script', () => {
  const expression = buildInstallExpression('0.1.0');
  assert.doesNotMatch(expression, /new Function\s*\(/);
});
