#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { rmSync, existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = new URL('..', import.meta.url).pathname;

// spec
const spec = runSkill(D, ['spec']);
assert('spec exits 0', spec.status === 0);
assert('spec mentions private development', spec.stdout.includes('Private skill development'));
assert('spec mentions team install', spec.stdout.includes('Team skill install'));
assert('spec mentions public PR', spec.stdout.includes('Public skill PR'));

// paths
const paths = runSkill(D, ['paths']);
assert('paths exits 0', paths.status === 0);
assert('paths shows private/', paths.stdout.includes('private/<name>'));
assert('paths shows team/', paths.stdout.includes('team/<team>/<name>'));

// unknown command → non-0
const bad = runSkill(D, ['nope']);
assert('unknown command exits non-0', bad.status !== 0);

// scaffold into a temp dir and verify the skeleton
const tmp = mkdtempSync(join(tmpdir(), 'css-'));
try {
  const sc = runSkill(D, ['scaffold', 'demo-x', '--dir', tmp]);
  assert('scaffold exits 0', sc.status === 0);
  const base = join(tmp, 'demo-x');
  assert('manifest created', existsSync(join(base, 'manifest.json')));
  assert('SKILL.md created', existsSync(join(base, 'SKILL.md')));
  assert('bin created', existsSync(join(base, 'bin', 'demo-x')));
  assert('references created', existsSync(join(base, 'references', 'help.md')));
  assert('English help created', existsSync(join(base, 'references', 'help.en.md')));
  assert('Chinese help created', existsSync(join(base, 'references', 'help.cn.md')));
  assert('English tools created', existsSync(join(base, 'references', 'tools.en.md')));
  assert('Chinese tools created', existsSync(join(base, 'references', 'tools.cn.md')));

  // frontmatter description must equal manifest description (validator rule)
  const man = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
  const skill = readFileSync(join(base, 'SKILL.md'), 'utf8');
  const m = skill.match(/^description:\s*(.+)$/m);
  assert('SKILL.md description matches manifest', m && m[1].trim() === man.description);
  assert('manifest entry points at bin/demo-x', man.entry === 'bin/demo-x');

  // refuses to overwrite
  const again = runSkill(D, ['scaffold', 'demo-x', '--dir', tmp]);
  assert('scaffold refuses overwrite', again.status !== 0);

  // invalid name rejected
  const badName = runSkill(D, ['scaffold', 'Bad_Name', '--dir', tmp]);
  assert('invalid name rejected', badName.status !== 0);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

finish();
