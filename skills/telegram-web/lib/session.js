import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TelegramWebError } from './errors.js';

const SECRET_KEY = /token|auth|password|code|storage/i;

function validateSession(session) {
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    throw new TelegramWebError('INVALID_SESSION', 'session must be an object', 3);
  }
  for (const key of Object.keys(session)) {
    if (SECRET_KEY.test(key)) throw new TelegramWebError('SECRET_IN_SESSION', `secret-like session field is forbidden: ${key}`, 3);
  }
  if (!session.target || !session.url || !['a', 'k'].includes(session.backend)) {
    throw new TelegramWebError('INVALID_SESSION', 'session requires target, url, and backend a|k', 3);
  }
  return session;
}

function loadSession(file) {
  if (!fs.existsSync(file)) return null;
  try { return validateSession(JSON.parse(fs.readFileSync(file, 'utf8'))); }
  catch (error) {
    if (error instanceof TelegramWebError) throw error;
    throw new TelegramWebError('INVALID_SESSION', `cannot parse session file: ${file}`, 3);
  }
}

function saveSession(file, session) {
  validateSession(session);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
  let fd;
  try {
    fd = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(fd, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(temporary, file);
    fs.chmodSync(file, 0o600);
  } catch (error) {
    if (fd != null) fs.closeSync(fd);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
}

function clearSession(file, target) {
  const session = loadSession(file);
  if (!session || session.target !== target) return false;
  fs.unlinkSync(file);
  return true;
}

export { clearSession, loadSession, saveSession, validateSession };
