#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runSkill, assert, finish } from '../../../tools/test-helper.js';

const D = new URL('..', import.meta.url).pathname;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cicy-agent-role-'));
const root = path.join(temp, 'roles');
const spec = path.join(temp, 'spec.json');
fs.writeFileSync(spec, JSON.stringify({
  name: 'Sales Assistant',
  name_zh: '销售助手',
  tools: ['core'],
  greeting: 'Hi, tell me which customer needs follow-up.',
  greeting_zh: '你好，请告诉我需要跟进的客户。',
  role: '# Role\n\nYou are a sales assistant. Confirm facts and never invent prices or commitments.',
  role_zh: '# 角色\n\n你是销售助手，负责确认客户需求、整理跟进记录并报告结果。必须确认事实，不得编造价格、政策或承诺。',
  system: 'You are a conversational work agent operating inside CiCy. Follow the selected role and report outcomes faithfully.',
}));

const help = runSkill(D, ['--help']);
assert('help exits 0', help.status === 0);
assert('help names required files', help.stdout.includes('role.json'));

const created = runSkill(D, ['create', 'sales-assistant', '--spec', spec, '--root', root]);
assert('create exits 0', created.status === 0);
for (const file of ['meta.yaml', 'role.md', 'role.zh.md', 'system.md']) {
  assert(`create writes ${file}`, fs.existsSync(path.join(root, 'sales-assistant', file)));
}

const valid = runSkill(D, ['validate', 'sales-assistant', '--root', root]);
assert('generated role validates', valid.status === 0);

const duplicate = runSkill(D, ['create', 'sales-assistant', '--spec', spec, '--root', root]);
assert('create refuses accidental overwrite', duplicate.status !== 0);

const listed = runSkill(D, ['list', '--root', root]);
assert('list includes generated role', listed.stdout.includes('sales-assistant'));

function marketEnv(version, roleText) {
  const packageDir = path.join(temp, `package-${version}`);
  fs.mkdirSync(packageDir);
  for (const file of ['meta.yaml', 'role.zh.md', 'system.md']) {
    fs.copyFileSync(path.join(root, 'sales-assistant', file), path.join(packageDir, file));
  }
  fs.writeFileSync(path.join(packageDir, 'role.md'), roleText);
  const archive = path.join(temp, `market-role-${version}.tar.gz`);
  const packed = spawnSync('tar', ['-czf', archive, '-C', packageDir, 'meta.yaml', 'role.md', 'role.zh.md', 'system.md']);
  if (packed.status !== 0) throw new Error('test tar failed');
  const bytes = fs.readFileSync(archive);
  const entry = {
    slug: 'market-role', version, name: 'Market Role', name_zh: '市场角色',
    description: 'A deterministic role used by the marketplace tests.',
    description_zh: '用于市场测试的确定性角色。', tags: ['test'],
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    download_url: `data:application/gzip;base64,${bytes.toString('base64')}`,
  };
  return { CICY_AGENT_ROLE_REGISTRY: `data:application/json,${encodeURIComponent(JSON.stringify({ roles: [entry] }))}` };
}

const marketRoot = path.join(temp, 'market-root');
const roleV1 = '# Role\n\nThis is the first marketplace role version with enough content for deterministic validation and installation.\n';
const envV1 = marketEnv('1.0.0', roleV1);
const marketList = runSkill(D, ['market', 'market'], envV1);
assert('market search returns matching role', marketList.stdout.includes('market-role'));
const installed = runSkill(D, ['install', 'market-role', '--root', marketRoot], envV1);
assert('market role installs', installed.status === 0);
assert('install writes provenance metadata', fs.existsSync(path.join(marketRoot, 'market-role', '.cicy-role.json')));

const localRole = path.join(marketRoot, 'market-role', 'role.md');
fs.appendFileSync(localRole, '\nLocal user customization must survive.\n');
const envV2 = marketEnv('1.1.0', '# Role\n\nThis upstream role changed in version two and contains enough content for deterministic conflict validation.\n');
const updated = runSkill(D, ['update', 'market-role', '--root', marketRoot], envV2);
assert('conflicting update exits 4', updated.status === 4);
assert('conflicting update preserves local edit', fs.readFileSync(localRole, 'utf8').includes('Local user customization'));
assert('conflicting update writes upstream candidate', fs.existsSync(localRole + '.upstream'));

fs.rmSync(temp, { recursive: true, force: true });
finish();
