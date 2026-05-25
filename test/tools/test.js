#!/usr/bin/env node
// test/tools/test.js — smoke tests for cicy-skills tool scripts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

let _p = 0, _f = 0;
function assert(label, ok, detail = '') {
  if (ok) { process.stdout.write(`  ✓ ${label}\n`); _p++; }
  else { process.stdout.write(`  ✗ ${label}${detail ? '\n    ' + detail : ''}\n`); _f++; }
}
function finish() {
  process.stdout.write(`  ${_p} passed, ${_f} failed\n`);
  process.exit(_f > 0 ? 1 : 0);
}
function run(script, args, opts = {}) {
  return spawnSync('node', [join('tools', script), ...args], {
    encoding: 'utf8', timeout: 15000, ...opts,
  });
}

// ── helpers ─────────────────────────────────────────────────────────────────

function makeSkill(dir, extra = {}) {
  const bin = join(dir, 'bin', 'my-skill');
  mkdirSync(join(dir, 'bin'), { recursive: true });
  mkdirSync(join(dir, 'references'), { recursive: true });
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({
    $schema: 'https://skills.cicy-ai.com/v1/manifest.schema.json',
    name: 'my-skill',
    version: '1.0.0',
    title: 'My Skill',
    description: 'A test skill for unit testing purposes only.',
    category: 'dev',
    author: 'test',
    license: 'MIT',
    runtime: { node: '>=18' },
    entry: 'bin/my-skill',
    ...extra,
  }));
  writeFileSync(bin, '#!/usr/bin/env node\nprocess.exit(0);\n');
  spawnSync('chmod', ['+x', bin]);
  writeFileSync(join(dir, 'SKILL.md'),
    `---\nname: my-skill\ndescription: A test skill for unit testing purposes only.\n---\n\nUsage here.\n`);
  writeFileSync(join(dir, 'README.md'), '# my-skill\nTest skill.\n');
}

// ── validate-skill.js ────────────────────────────────────────────────────────

process.stdout.write('\nvalidate-skill.js\n');

// usage error
const vsNoArgs = run('validate-skill.js', []);
assert('no args exits 3', vsNoArgs.status === 3);

// valid skill → exits 0
const validDir = mkdtempSync(join(tmpdir(), 'cicy-test-'));
const skillDir = join(validDir, 'my-skill');
mkdirSync(skillDir);
makeSkill(skillDir);
const vsOk = run('validate-skill.js', [skillDir]);
assert('valid skill exits 0', vsOk.status === 0, vsOk.stdout + vsOk.stderr);

// --json output
const vsJson = run('validate-skill.js', [skillDir, '--json']);
assert('--json exits 0', vsJson.status === 0);
let vsJ; try { vsJ = JSON.parse(vsJson.stdout); } catch {}
assert('--json is valid JSON', !!vsJ);
assert('--json ok:true', vsJ?.ok === true);

// missing manifest → exits 2
const emptyDir = mkdtempSync(join(tmpdir(), 'cicy-empty-'));
mkdirSync(join(emptyDir, 'no-manifest'));
const vsMissing = run('validate-skill.js', [join(emptyDir, 'no-manifest')]);
assert('missing manifest exits non-0', vsMissing.status !== 0);

// name mismatch → exits 2
const mismatchDir = join(validDir, 'wrong-name');
mkdirSync(mismatchDir);
makeSkill(mismatchDir); // manifest.name=my-skill but dir=wrong-name
const vsMismatch = run('validate-skill.js', [mismatchDir]);
assert('name mismatch exits 2', vsMismatch.status === 2);

// ── pack-skill.js ────────────────────────────────────────────────────────────

process.stdout.write('\npack-skill.js\n');

// usage error
const psNoArgs = run('pack-skill.js', []);
assert('no args exits 2', psNoArgs.status === 2);

// pack valid skill
const outDir = join(validDir, 'dist');
const psPacked = run('pack-skill.js', [skillDir, '--out', outDir, '--json']);
assert('pack exits 0', psPacked.status === 0, psPacked.stderr);
let psJ; try { psJ = JSON.parse(psPacked.stdout); } catch {}
assert('pack --json is valid JSON', !!psJ);
assert('pack produces zip', !!psJ?.zip && existsSync(psJ.zip));
assert('pack sha256 is 64 hex chars', /^[0-9a-f]{64}$/.test(psJ?.sha256 || ''));
assert('pack size > 0', (psJ?.size || 0) > 0);

// sha256 file matches computed sha256
const zipBuf = readFileSync(psJ.zip);
const computed = createHash('sha256').update(zipBuf).digest('hex');
assert('sha256 file matches zip content', computed === psJ.sha256);

// non-existent skill dir → exits non-0
const psBad = run('pack-skill.js', ['/tmp/no-such-skill-xyz']);
assert('non-existent dir exits non-0', psBad.status !== 0);

// ── test-skill.js ────────────────────────────────────────────────────────────

process.stdout.write('\ntest-skill.js\n');

// usage error
const tsNoArgs = run('test-skill.js', []);
assert('no args exits 2', tsNoArgs.status === 2);

// skill with no test → skip (exit 0)
const tsSkip = run('test-skill.js', [skillDir]);
assert('skill with no test exits 0 (skipped)', tsSkip.status === 0);
assert('skip message mentions "no test"', tsSkip.stdout.includes('no test'));

// skill with passing test → exit 0
const testDir = join(skillDir, 'test');
mkdirSync(testDir, { recursive: true });
const helperAbs = new URL('../../tools/test-helper.js', import.meta.url).pathname;
writeFileSync(join(testDir, 'test.js'), `
import { assert, finish } from ${JSON.stringify(helperAbs)};
assert('always true', true);
finish();
`);
const tsPass = run('test-skill.js', [skillDir]);
assert('passing test exits 0', tsPass.status === 0, tsPass.stdout + tsPass.stderr);

// skill with failing test → exit 1
writeFileSync(join(testDir, 'test.js'), `
import { assert, finish } from ${JSON.stringify(helperAbs)};
assert('always false', false);
finish();
`);
const tsFail = run('test-skill.js', [skillDir]);
assert('failing test exits 1', tsFail.status === 1);

finish();
