#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

fs.rmSync(temp, { recursive: true, force: true });
finish();
