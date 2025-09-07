type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const envLevel: LogLevel = (import.meta?.env?.VITE_LOG_LEVEL as LogLevel) ||
  (process?.env?.VITE_LOG_LEVEL as LogLevel) ||
  (import.meta?.env?.MODE === 'production' ? 'info' : 'debug');

const levelPriority: Record<Exclude<LogLevel, 'silent'>, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let currentLevel: LogLevel = envLevel;

function shouldLog(level: Exclude<LogLevel, 'silent'>) {
  if (currentLevel === 'silent') return false;
  return levelPriority[level] >= levelPriority[(currentLevel as Exclude<LogLevel, 'silent'>)] ?? 10;
}

function formatMessage(level: string, message: string, context?: unknown) {
  const time = new Date().toISOString();
  if (context !== undefined) {
    return [`[${time}] [${level.toUpperCase()}] ${message}`, context];
  }
  return [`[${time}] [${level.toUpperCase()}] ${message}`];
}

export const logger = {
  setLevel(level: LogLevel) {
    currentLevel = level;
  },
  debug(message: string, context?: unknown) {
    if (shouldLog('debug')) console.debug(...formatMessage('debug', message, context));
  },
  info(message: string, context?: unknown) {
    if (shouldLog('info')) console.info(...formatMessage('info', message, context));
  },
  warn(message: string, context?: unknown) {
    if (shouldLog('warn')) console.warn(...formatMessage('warn', message, context));
  },
  error(message: string, context?: unknown) {
    if (shouldLog('error')) console.error(...formatMessage('error', message, context));
  },
};

export type { LogLevel };
