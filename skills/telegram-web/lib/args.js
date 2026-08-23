import { usageError } from './errors.js';

const COMMANDS = [
  'login', 'status', 'patch', 'account', 'chats', 'dialogs',
  'users', 'messages', 'open', 'open-url', 'send', 'eval', 'close',
];
const COMMAND_SET = new Set(COMMANDS);

function takeValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value == null || value.startsWith('--')) throw usageError(`${flag} requires a value`);
  return value;
}

function integer(value, flag) {
  if (!/^\d+$/.test(String(value))) throw usageError(`${flag} must be a non-negative integer`);
  return Number(value);
}

function parseArgs(argv) {
  const result = {
    command: null,
    positional: [],
    client: null,
    target: null,
    win: null,
    backend: null,
    json: false,
    apply: false,
    options: {},
  };
  const loginDefaults = {
    fromProfile: 0,
    toAccount: 99,
    proxy: null,
    url: 'https://web.telegram.org/a/',
    fromClient: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('-') && result.command == null) {
      if (!COMMAND_SET.has(arg)) throw usageError(`unknown command: ${arg}`);
      result.command = arg;
      if (arg === 'login') result.options = { ...loginDefaults };
      if (arg === 'open-url') result.options.profile = 1;
      if (arg === 'messages') result.options.limit = 30;
      if (arg === 'dialogs') Object.assign(result.options, { limit: 50, folder: 'active' });
      continue;
    }
    if (!arg.startsWith('-')) {
      result.positional.push(arg);
      continue;
    }
    if (arg === '--json') { result.json = true; continue; }
    if (arg === '--apply') { result.apply = true; continue; }
    if (arg === '--no-proxy') { result.options.proxy = null; continue; }

    const value = takeValue(argv, i, arg);
    i += 1;
    if (arg === '--client' || arg === '-c') result.client = value;
    else if (arg === '--target') result.target = value;
    else if (arg === '--win') {
      result.win = integer(value, arg);
      result.target = String(result.win);
    } else if (arg === '--backend') {
      if (!['a', 'k'].includes(value)) throw usageError('--backend must be a or k');
      result.backend = value;
    } else if (arg === '--from-profile') result.options.fromProfile = integer(value, arg);
    else if (arg === '--profile') result.options.profile = integer(value, arg);
    else if (arg === '--to-account') result.options.toAccount = integer(value, arg);
    else if (arg === '--proxy') result.options.proxy = value;
    else if (arg === '--url') result.options.url = value;
    else if (arg === '--from-client') result.options.fromClient = value;
    else if (arg === '--limit') result.options.limit = integer(value, arg);
    else if (arg === '--folder') {
      if (!['active', 'archived'].includes(value)) throw usageError('--folder must be active or archived');
      result.options.folder = value;
    } else throw usageError(`unknown option: ${arg}`);
  }
  if (!result.command) throw usageError('missing command');
  return result;
}

export { COMMANDS, parseArgs };
