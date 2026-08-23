import { TelegramWebError } from './errors.js';

const MUTATING_COMMANDS = new Set(['login', 'open', 'open-url', 'send', 'close']);
const UNSAFE_PATTERNS = [
  /(?:^|[^=!<>])=(?!=|>)/,
  /\+\+|--/,
  /\b(?:actions|__getActions|__setGlobal|eval|Function|import|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB)\b/,
  /\bdocument\b/,
  /\b(?:remove|append|prepend|replaceWith|insertAdjacent|setAttribute)\s*\(/,
];

function validateReadOnlyExpression(expression) {
  if (typeof expression !== 'string' || !expression.trim()) {
    throw new TelegramWebError('UNSAFE_EVAL', 'read-only eval requires a non-empty expression', 2);
  }
  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(expression))) {
    throw new TelegramWebError('UNSAFE_EVAL', 'expression may mutate state or access a dangerous global; pass --apply for expert eval', 2);
  }
  return expression;
}

function requireApply(command, applied, expression = '') {
  let mutating = MUTATING_COMMANDS.has(command);
  if (command === 'eval' && !applied) {
    try { validateReadOnlyExpression(expression); }
    catch { mutating = true; }
  }
  if (mutating && !applied) {
    throw new TelegramWebError('APPLY_REQUIRED', `${command} changes live state; pass --apply`, 2);
  }
}

export { MUTATING_COMMANDS, requireApply, validateReadOnlyExpression };
