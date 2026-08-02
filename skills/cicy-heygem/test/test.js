#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const skillDir = process.env.SKILL_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(skillDir, 'manifest.json'), 'utf8'));
const command = manifest.name;
const prefix = manifest.name.replace(/^cicy-/, 'CICY_').replaceAll('-', '_').toUpperCase();
const gpuRequired = manifest.name !== 'cicy-whisper';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), `${command}-contract-`));
const root = path.join(temp, 'models');
const output = path.join(temp, 'outputs');
const fakeBin = path.join(temp, 'bin');
fs.mkdirSync(fakeBin);
const nvidia = path.join(fakeBin, 'nvidia-smi');
const installRunner = path.join(temp, 'fake-install.sh');
const runRunner = path.join(temp, 'fake-run.sh');
const failRunner = path.join(temp, 'fail.sh');
const escapeRunner = path.join(temp, 'escape.sh');
const symlinkRunner = path.join(temp, 'symlink.sh');
const inputOne = path.join(temp, 'input-one.bin');
const inputTwo = path.join(temp, 'input-two.bin');
fs.writeFileSync(nvidia, '#!/bin/sh\nprintf "Fake GPU, 24576\\n"\n', { mode: 0o755 });
fs.writeFileSync(installRunner, '#!/bin/sh\necho fake install\n', { mode: 0o755 });
fs.writeFileSync(runRunner, '#!/bin/sh\nset -eu\nprintf x > "$CICY_JOB_DIR/artifact.bin"\nprintf \'{"artifact":"%s/artifact.bin"}\\n\' "$CICY_JOB_DIR"\n', { mode: 0o755 });
fs.writeFileSync(failRunner, '#!/bin/sh\nexit 9\n', { mode: 0o755 });
fs.writeFileSync(escapeRunner, `#!/bin/sh\nprintf x > "${temp}/escaped.bin"\nprintf '{"artifact":"${temp}/escaped.bin"}\\n'\n`, { mode: 0o755 });
fs.writeFileSync(symlinkRunner, `#!/bin/sh\nprintf x > "${temp}/symlink-target.bin"\nln -s "${temp}/symlink-target.bin" "$CICY_JOB_DIR/artifact.bin"\nprintf '{"artifact":"%s/artifact.bin"}\\n' "$CICY_JOB_DIR"\n`, { mode: 0o755 });
fs.writeFileSync(inputOne, 'one');
fs.writeFileSync(inputTwo, 'two');
const bin = path.join(skillDir, manifest.entry);

function call(args, extra = {}) {
  return spawnSync(process.execPath, [bin, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, CICY_TEST_MODE: '1', CICY_MODEL_ROOT: root, CICY_OUTPUT_DIR: output, [`${prefix}_INSTALL_RUNNER`]: installRunner, [`${prefix}_RUNNER`]: runRunner, ...extra },
  });
}
function json(result) { return JSON.parse(result.stdout.trim().split('\n').at(-1)); }
function runArgs() {
  if (manifest.name === 'cicy-cosyvoice') return ['--ref', inputOne, '--ref-text', 'hello', '--text', 'world'];
  if (manifest.name === 'cicy-whisper') return [inputOne];
  return [inputOne, inputTwo];
}

const help = call(['--help']);
assert.equal(help.status, 0);
assert.match(help.stdout, new RegExp(`${command} install`));

const doctor = call(['doctor']);
assert.equal(doctor.status, 0);
assert.equal(json(doctor).ok, true);

const aliyunDoctor = call(['doctor'], { ALIBABA_CLOUD_REGION_ID: 'cn-hangzhou' });
assert.equal(aliyunDoctor.status, 0);
assert.equal(json(aliyunDoctor).environment.provider, 'aliyun');
assert.equal(json(aliyunDoctor).environment.is_aliyun, true);

const install = call(['install']);
assert.equal(install.status, 0, install.stderr || install.stdout);
assert.equal(json(install).ok, true);
assert.ok(fs.existsSync(path.join(root, manifest.name.replace('cicy-', ''), 'READY.json')));

const again = call(['install']);
assert.equal(again.status, 0);
assert.equal(json(again).already_installed, true);

const status = call(['status']);
assert.equal(status.status, 0);
assert.equal(json(status).state, 'ready');

const relative = call(['run', 'relative-input', '--job-id', 'relative-job']);
assert.notEqual(relative.status, 0);
assert.equal(json(relative).code, 'invalid_input_path');

const outputEscapeArgs = manifest.name === 'cicy-cosyvoice'
  ? [...runArgs(), '--out', path.join(temp, 'outside.wav')]
  : (manifest.name === 'cicy-whisper'
      ? [...runArgs(), '--out-dir', temp]
      : [...runArgs(), path.join(temp, 'outside.mp4')]);
const outputEscape = call(['run', ...outputEscapeArgs, '--job-id', 'output-escape-job']);
assert.notEqual(outputEscape.status, 0);
assert.equal(json(outputEscape).code, 'output_path_forbidden');

const run = call(['run', ...runArgs(), '--job-id', 'contract-job']);
assert.equal(run.status, 0, run.stderr || run.stdout);
const runJson = json(run);
assert.equal(runJson.ok, true);
assert.ok(fs.existsSync(runJson.result.artifact));

const duplicate = call(['run', ...runArgs(), '--job-id', 'contract-job']);
assert.notEqual(duplicate.status, 0);

const escaped = call(['run', ...runArgs(), '--job-id', 'escape-job'], { [`${prefix}_RUNNER`]: escapeRunner });
assert.notEqual(escaped.status, 0);
assert.equal(json(escaped).code, 'artifact_verification_failed');

const symlinked = call(['run', ...runArgs(), '--job-id', 'symlink-job'], { [`${prefix}_RUNNER`]: symlinkRunner });
assert.notEqual(symlinked.status, 0);
assert.equal(json(symlinked).code, 'artifact_verification_failed');

const secondRun = call(['run', ...runArgs(), '--job-id', 'second-job']);
assert.equal(secondRun.status, 0);
assert.notEqual(json(secondRun).job_dir, runJson.job_dir);

const engineDir = path.join(root, manifest.name.replace('cicy-', ''));
const runLock = path.join(engineDir, '.run.lock');
fs.mkdirSync(runLock);
fs.writeFileSync(path.join(runLock, 'owner.json'), JSON.stringify({ pid: process.pid }));
const concurrent = call(['run', ...runArgs(), '--job-id', 'concurrent-job']);
assert.notEqual(concurrent.status, 0);
assert.equal(json(concurrent).code, 'run_locked');
fs.rmSync(runLock, { recursive: true, force: true });

const readyPath = path.join(engineDir, 'READY.json');
const brokenReady = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
brokenReady.files_sha = { 'missing.file': '0'.repeat(64) };
fs.writeFileSync(readyPath, JSON.stringify(brokenReady));
const corrupt = call(['status']);
assert.equal(json(corrupt).state, 'corrupt');

const repaired = call(['install', '--force']);
assert.equal(repaired.status, 0);
const failedForce = call(['install', '--force'], { [`${prefix}_INSTALL_RUNNER`]: failRunner });
assert.notEqual(failedForce.status, 0);
assert.equal(fs.existsSync(readyPath), false);
assert.equal(json(call(['status'])).state, 'failed');

const lockDir = path.join(engineDir, '.install.lock');
fs.mkdirSync(lockDir, { recursive: true });
fs.writeFileSync(path.join(lockDir, 'owner.json'), JSON.stringify({ pid: 99999999 }));
const stale = call(['status']);
assert.notEqual(json(stale).state, 'installing');
assert.equal(fs.existsSync(lockDir), false);

if (gpuRequired) {
  fs.writeFileSync(nvidia, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const noGpu = call(['install', '--force']);
  assert.notEqual(noGpu.status, 0);
  assert.equal(json(noGpu).code, 'gpu_requirement_failed');
}

fs.rmSync(temp, { recursive: true, force: true });
process.stdout.write(`${command} contract tests passed\n`);
