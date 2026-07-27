#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillDir = process.env.SKILL_DIR || path.resolve(here, '..');
const bin = path.join(skillDir, 'bin', 'cicy-koubo');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cicy-koubo-skill-'));
const project = path.join(temp, 'project');
const state = path.join(temp, 'runtime.json');
const log = path.join(temp, 'runtime.log');
fs.mkdirSync(path.join(project, 'bin'), { recursive: true });
fs.writeFileSync(path.join(project, 'bin', 'cli.js'), '#!/usr/bin/env node\n');
fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({ version: '9.8.7' }));
fs.writeFileSync(state, JSON.stringify({ port: 49155 }));

function call(args) {
  return spawnSync(process.execPath, [bin, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      CICY_KOUBO_PROJECT: project,
      CICY_KOUBO_STATE: state,
      CICY_KOUBO_LOG: log,
    },
  });
}

const help = call(['--help']);
assert.equal(help.status, 0);
assert.match(help.stdout, /cicy-koubo start/);
assert.match(help.stdout, /cicy-koubo douyin/);

const installed = call(['install']);
assert.equal(installed.status, 0);
assert.match(installed.stdout, /already installed/);

const status = call(['status', '--json']);
assert.equal(status.status, 0);
const parsed = JSON.parse(status.stdout);
assert.equal(parsed.installed, true);
assert.equal(parsed.running, false);
assert.equal(parsed.healthy, false);
assert.equal(parsed.version, '9.8.7');
assert.equal(parsed.port, 49155);

const badUrl = call(['douyin', 'https://example.com/video']);
assert.equal(badUrl.status, 2);
assert.match(badUrl.stderr, /expected a douyin\.com URL/);

const badPort = call(['start', '--port', '99999', '--no-open']);
assert.equal(badPort.status, 2);
assert.match(badPort.stderr, /invalid --port/);

fs.rmSync(temp, { recursive: true, force: true });
process.stdout.write('cicy-koubo tests passed\n');
