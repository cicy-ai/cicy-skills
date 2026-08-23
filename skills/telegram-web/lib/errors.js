class TelegramWebError extends Error {
  constructor(code, message, exitCode = 1) {
    super(message);
    this.name = 'TelegramWebError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

function usageError(message) {
  return new TelegramWebError('USAGE', message, 2);
}

export { TelegramWebError, usageError };
