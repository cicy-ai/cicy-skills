import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

function emit(value) { process.stdout.write(`${JSON.stringify(value)}\n`); }
function fail(message, code = 1, extra = {}) {
  emit({ ok: false, error: message, ...extra });
  process.exit(code);
}
function hasFlag(argv, name) { return argv.includes(name); }
function option(argv, name, fallback = '') {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
function executable(name, args = ['--version']) {
  const r = spawnSync(name, args, { stdio: 'ignore' });
  return !r.error && r.status === 0;
}
function gpuInfo() {
  const r = spawnSync('nvidia-smi', ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  const line = String(r.stdout).trim().split('\n')[0];
  const split = line.lastIndexOf(',');
  return split < 0 ? null : { name: line.slice(0, split).trim(), memory_mb: Number(line.slice(split + 1).trim()) || 0 };
}
function freeGiB(target) {
  fs.mkdirSync(target, { recursive: true });
  const r = spawnSync('df', ['-Pk', target], { encoding: 'utf8' });
  const fields = String(r.stdout || '').trim().split('\n').at(-1)?.trim().split(/\s+/) || [];
  return fields.length >= 4 ? Number((Number(fields[3]) / 1024 / 1024).toFixed(2)) : null;
}
function atomicJSON(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
}
function readJSON(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function regularFile(file, minBytes = 1) { try { const st = fs.statSync(file); return st.isFile() && st.size >= minBytes; } catch { return false; } }
function inside(parent, child) { const rel = path.relative(parent, child); return rel !== '' && !rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel); }
function pidAlive(pid) { try { process.kill(Number(pid), 0); return Number(pid) > 1; } catch { return false; } }
function acquireLock(dir) {
  const create = () => { fs.mkdirSync(dir); atomicJSON(path.join(dir, 'owner.json'), { pid: process.pid, created_at: new Date().toISOString() }); };
  try { create(); return true; } catch {
    const owner = readJSON(path.join(dir, 'owner.json'));
    if (owner && !pidAlive(owner.pid)) {
      fs.rmSync(dir, { recursive: true, force: true });
      try { create(); return true; } catch {}
    }
    return false;
  }
}

export function main(config, metaUrl) {
  const argv = process.argv.slice(2);
  const command = argv[0] || 'help';
  const skillDir = path.resolve(path.dirname(new URL(metaUrl).pathname), '..');
  const isColab = fs.existsSync('/content') && Boolean(process.env.COLAB_RELEASE_TAG || fs.existsSync('/content/drive'));
  const isAliyun = Boolean(process.env.ALIBABA_CLOUD_REGION_ID || process.env.ALIBABA_CLOUD_ECS_METADATA);
  const provider = process.env.CICY_MODEL_PROVIDER || (isColab ? 'colab' : (isAliyun ? 'aliyun' : 'linux'));
  const defaultRoot = isColab ? '/content/cicy-models' : path.join(os.homedir(), 'cicy-ai', 'models');
  const root = path.resolve(process.env.CICY_MODEL_ROOT || defaultRoot);
  if (/\s/.test(root)) fail('CICY_MODEL_ROOT must not contain whitespace', 2, { code: 'invalid_model_root' });
  const engineDir = path.join(root, config.engine);
  const outputRoot = path.resolve(process.env.CICY_OUTPUT_DIR || path.join(root, 'outputs'));
  const readyFile = path.join(engineDir, 'READY.json');
  const logFile = path.join(engineDir, 'install.log');
  const failedFile = path.join(engineDir, 'FAILED.json');
  const lockDir = path.join(engineDir, '.install.lock');
  const gpu = gpuInfo();
  const disk = freeGiB(root);
  const environment = { provider, is_colab: isColab, is_aliyun: isAliyun, root, output_root: outputRoot, gpu, free_disk_gib: disk };
  const validateReady = () => {
    const ready = readJSON(readyFile);
    if (!ready || ready.engine !== config.engine || ready.model !== config.version || typeof ready.files_sha !== 'object') return { ok: false, ready, reason: 'invalid_ready' };
    if (!ready.test_runner) for (const item of config.criticalFiles || []) {
      if (!regularFile(path.join(engineDir, item.path), item.minBytes || 1)) return { ok: false, ready, reason: `missing_or_short:${item.path}` };
    }
    const allowedHashes = new Set(config.hashFiles || []);
    if (!ready.test_runner && Object.keys(ready.files_sha).some((relative) => !allowedHashes.has(relative))) return { ok: false, ready, reason: 'unexpected_checksum_path' };
    for (const [relative, expected] of Object.entries(ready.files_sha)) {
      const file = path.join(engineDir, relative);
      if (!regularFile(file) || sha256(file) !== expected) return { ok: false, ready, reason: `checksum:${relative}` };
    }
    return { ok: true, ready };
  };

  if (command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(`${config.command} — ${config.summary}\n\nUsage:\n  ${config.command} doctor [--json]\n  ${config.command} install [--force]\n  ${config.command} status\n  ${config.command} run <engine options>\n  ${config.command} logs [--lines N]\n`);
    return;
  }
  if (command === 'doctor') {
    const gpuOk = config.gpuOptional || Boolean(gpu && gpu.memory_mb >= config.minGpuMb);
    const diskOk = disk == null || disk >= config.minDiskGiB;
    const result = { ok: gpuOk && diskOk && executable('bash', ['--version']), engine: config.engine, requirements: { gpu_ok: gpuOk, min_gpu_mb: config.minGpuMb, disk_ok: diskOk, min_disk_gib: config.minDiskGiB, bash: executable('bash', ['--version']), ffmpeg: executable('ffmpeg', ['-version']) }, environment };
    emit(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === 'status') {
    const checked = validateReady();
    if (fs.existsSync(lockDir)) acquireLock(lockDir) && fs.rmSync(lockDir, { recursive: true, force: true });
    const locked = fs.existsSync(lockDir);
    const state = checked.ok ? 'ready' : (locked ? 'installing' : (fs.existsSync(readyFile) ? 'corrupt' : (fs.existsSync(failedFile) ? 'failed' : 'missing')));
    emit({ ok: checked.ok, engine: config.engine, state, reason: checked.reason || null, ready: checked.ready, environment });
    return;
  }
  if (command === 'logs') {
    const lines = Math.max(1, Math.min(2000, Number(option(argv, '--lines', '200')) || 200));
    const content = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n').slice(-lines).join('\n') : '';
    process.stdout.write(content + (content.endsWith('\n') ? '' : '\n'));
    return;
  }
  if (command === 'install') {
    if (process.env[`${config.envPrefix}_INSTALL_RUNNER`] && process.env.CICY_TEST_MODE !== '1') fail('custom install runner requires CICY_TEST_MODE=1', 2, { code: 'test_mode_required' });
    const existing = validateReady();
    if (existing.ok && !hasFlag(argv, '--force')) { emit({ ok: true, engine: config.engine, already_installed: true, ready: existing.ready }); return; }
    if (!config.gpuOptional && (!gpu || gpu.memory_mb < config.minGpuMb)) fail(`GPU with at least ${config.minGpuMb} MiB is required`, 1, { code: 'gpu_requirement_failed', environment });
    if (disk != null && disk < config.minDiskGiB) fail(`at least ${config.minDiskGiB} GiB free disk is required`, 1, { code: 'disk_requirement_failed', environment });
    fs.mkdirSync(engineDir, { recursive: true });
    if (!acquireLock(lockDir)) fail('installation already in progress', 1, { code: 'install_locked' });
    fs.rmSync(readyFile, { force: true });
    fs.rmSync(failedFile, { force: true });
    const runner = process.env[`${config.envPrefix}_INSTALL_RUNNER`] || path.join(skillDir, 'scripts', 'install.sh');
    const logFd = fs.openSync(logFile, 'a');
    const startedAt = new Date().toISOString();
    const r = spawnSync(runner, [], { stdio: ['ignore', logFd, logFd], env: { ...process.env, CICY_ENGINE_DIR: engineDir, CICY_MODEL_ROOT: root, CICY_MODEL_CACHE: process.env.CICY_MODEL_CACHE || path.join(root, 'cache'), CICY_MODEL_PROVIDER: provider } });
    fs.closeSync(logFd);
    fs.rmSync(lockDir, { recursive: true, force: true });
    if (r.error || r.status !== 0) {
      const failed = { engine: config.engine, failed_at: new Date().toISOString(), exit_code: r.status ?? null, error: r.error?.message || 'installer failed' };
      atomicJSON(failedFile, failed);
      fail(failed.error, 1, { code: 'install_failed', log: logFile, ...failed });
    }
    const fakeRunner = Boolean(process.env[`${config.envPrefix}_INSTALL_RUNNER`]);
    let verificationError = '';
    if (!fakeRunner) {
      for (const item of config.criticalFiles || []) {
        if (!regularFile(path.join(engineDir, item.path), item.minBytes || 1)) verificationError = `installer did not produce ${item.path}`;
      }
      for (const relative of config.hashFiles || []) if (!regularFile(path.join(engineDir, relative))) verificationError = `installer did not produce ${relative}`;
    }
    if (verificationError) {
      const failed = { engine: config.engine, failed_at: new Date().toISOString(), error: verificationError };
      atomicJSON(failedFile, failed);
      fail(verificationError, 1, { code: 'install_verification_failed', log: logFile });
    }
    const hashFiles = fakeRunner ? [] : (config.hashFiles || []);
    const filesSha = Object.fromEntries(hashFiles.map((relative) => [relative, sha256(path.join(engineDir, relative))]));
    const ready = { engine: config.engine, version: config.version, model: config.version, provider, gpu, root: engineDir, files_sha: filesSha, test_runner: fakeRunner || undefined, installed_at: startedAt, ready_at: new Date().toISOString() };
    atomicJSON(readyFile, ready);
    emit({ ok: true, engine: config.engine, ready, log: logFile });
    return;
  }
  if (command === 'run') {
    if (process.env[`${config.envPrefix}_RUNNER`] && process.env.CICY_TEST_MODE !== '1') fail('custom runner requires CICY_TEST_MODE=1', 2, { code: 'test_mode_required' });
    if (!validateReady().ok && process.env[`${config.envPrefix}_RUNNER`] == null) fail('model is not installed or READY is corrupt; run install first', 1, { code: 'not_ready' });
    fs.mkdirSync(outputRoot, { recursive: true });
    fs.mkdirSync(engineDir, { recursive: true });
    const runner = process.env[`${config.envPrefix}_RUNNER`] || path.join(skillDir, 'scripts', 'run.sh');
    for (const name of config.pathOptions || []) {
      const value = option(argv, name);
      if (!value || !path.isAbsolute(value) || !regularFile(value)) fail(`${name} must be an existing absolute file`, 2, { code: 'invalid_input_path' });
    }
    const positionals = argv.slice(1).filter((value, index, all) => !value.startsWith('--') && !(index > 0 && all[index - 1].startsWith('--')));
    if (config.maxPositionals != null && positionals.length > config.maxPositionals) fail('too many positional arguments', 2, { code: 'output_path_forbidden' });
    for (let i = 0; i < (config.positionalInputCount || 0); i += 1) {
      if (!positionals[i] || !path.isAbsolute(positionals[i]) || !regularFile(positionals[i])) fail(`input ${i + 1} must be an existing absolute file`, 2, { code: 'invalid_input_path' });
    }
    for (const name of config.forbiddenOptions || []) if (argv.includes(name)) fail(`${name} is not allowed; outputs stay in the job directory`, 2, { code: 'output_path_forbidden' });
    const jobId = option(argv, '--job-id', `job-${Date.now()}-${process.pid}`);
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(jobId)) fail('invalid --job-id', 2, { code: 'invalid_job_id' });
    const jobDir = path.join(outputRoot, jobId);
    fs.mkdirSync(jobDir, { recursive: false });
    const runLock = path.join(engineDir, '.run.lock');
    if (!acquireLock(runLock)) fail('another inference is already running', 1, { code: 'run_locked', job_id: jobId });
    const forwarded = argv.slice(1).filter((value, index, all) => value !== '--job-id' && all[index - 1] !== '--job-id');
    const r = spawnSync(runner, forwarded, { encoding: 'utf8', env: { ...process.env, CICY_ENGINE_DIR: engineDir, CICY_MODEL_CACHE: process.env.CICY_MODEL_CACHE || path.join(root, 'cache'), CICY_JOB_ID: jobId, CICY_JOB_DIR: jobDir, CICY_OUTPUT_DIR: outputRoot } });
    fs.rmSync(runLock, { recursive: true, force: true });
    if (r.stderr) process.stderr.write(r.stderr);
    if (r.error || r.status !== 0) fail(r.error?.message || String(r.stderr || 'runner failed').trim(), r.status || 1, { code: 'run_failed', job_id: jobId, job_dir: jobDir });
    const text = String(r.stdout || '').trim();
    let result = null;
    try { result = JSON.parse(text.split('\n').at(-1)); } catch {}
    if (!result || typeof result !== 'object') fail('runner did not return JSON', 1, { code: 'invalid_result', job_id: jobId });
    const artifacts = Object.entries(result).filter(([key]) => ['audio', 'video', 'text', 'srt', 'json', 'artifact'].includes(key));
    if (!artifacts.length) fail('runner returned no artifact', 1, { code: 'invalid_result', job_id: jobId });
    for (const [key, value] of artifacts) {
      let realArtifact = '';
      try { realArtifact = fs.realpathSync(value); } catch {}
      if (typeof value !== 'string' || !path.isAbsolute(value) || !inside(fs.realpathSync(jobDir), realArtifact) || !regularFile(realArtifact)) fail(`invalid ${key} artifact`, 1, { code: 'artifact_verification_failed', job_id: jobId });
    }
    emit({ ok: true, engine: config.engine, job_id: jobId, job_dir: jobDir, result: result || { stdout: text } });
    return;
  }
  fail(`unknown command: ${command}`, 2, { code: 'usage' });
}
