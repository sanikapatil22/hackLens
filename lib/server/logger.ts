type LogLevel = 'info' | 'warn' | 'error';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;
const levelPriority: Record<LogLevel, number> = {
  info: 0,
  warn: 1,
  error: 2,
};

function shouldLog(level: LogLevel): boolean {
  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) {
    return false;
  }

  const configuredLevel: LogLevel = levelPriority[LOG_LEVEL] !== undefined ? LOG_LEVEL : 'info';
  return levelPriority[level] >= levelPriority[configuredLevel];
}

function serialize(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  return {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
}

function print(level: LogLevel, entry: ReturnType<typeof serialize>) {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    if (level === 'error') {
      console.error(entry);
      return;
    }

    console.log(entry);
    return;
  }

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = serialize(level, message, meta);
  print(level, entry);
}

export function logApi(route: string, status: string, meta?: Record<string, unknown>) {
  log(status === 'error' ? 'error' : 'info', `api:${route}:${status}`, meta);
}

export function logService(service: string, action: string, meta?: Record<string, unknown>) {
  log('info', `service:${service}:${action}`, meta);
}

export function logAI(event: string, meta?: Record<string, unknown>) {
  const level: LogLevel = event.includes('error') || event.includes('timeout') ? 'error' : 'info';
  log(level, `ai:${event}`, meta);
}
