import { execFileSync } from 'node:child_process';
import { TelegramWebError } from './errors.js';

function run(executable, args) {
  let stdout;
  try {
    stdout = execFileSync(executable, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : '';
    throw new TelegramWebError('TOOL_FAILED', `${executable} failed${stderr ? `: ${stderr}` : ''}`, 4);
  }
  try { return JSON.parse(stdout); }
  catch { throw new TelegramWebError('TOOL_INVALID_JSON', `${executable} returned invalid JSON`, 4); }
}

function createTransport(options = {}) {
  const bins = {
    electron: options.electronBin || process.env.AGENT_ELECTRON_BIN || 'agent-electron',
    chrome: options.chromeBin || process.env.AGENT_CHROME_BIN || 'agent-chrome',
    mirror: options.mirrorBin || process.env.TG_WEB_MIRROR_HOOK_BIN || 'tg-web-mirror-hook',
  };
  const prefix = options.client ? ['--client', options.client] : [];
  return {
    client: options.client || null,
    electron: (args) => run(bins.electron, [...prefix, ...args]),
    chrome: (args) => run(bins.chrome, [...prefix, ...args]),
    mirror: (args) => run(bins.mirror, [...prefix, ...args]),
  };
}

function decodeCdpValue(response) {
  const outer = response && response.result;
  const exception = outer && outer.exceptionDetails;
  const remote = outer && outer.result ? outer.result : outer;
  if (exception) {
    const description = remote && remote.description ? remote.description : exception.text || 'page evaluation failed';
    throw new TelegramWebError('PAGE_EVAL_FAILED', description, 5);
  }
  if (response && response.success === false) throw new TelegramWebError('PAGE_EVAL_FAILED', response.error || 'CDP command failed', 5);
  if (remote && Object.prototype.hasOwnProperty.call(remote, 'value')) return remote.value;
  if (response && response.data && Object.prototype.hasOwnProperty.call(response.data, 'value')) return response.data.value;
  throw new TelegramWebError('PAGE_RESULT_MISSING', 'CDP result has no serializable value', 5);
}

export { createTransport, decodeCdpValue };
