import env from './env.js';

const LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

const normalizeLevel = (level) => {
  const normalized = String(level || 'info').toLowerCase();

  return Object.prototype.hasOwnProperty.call(LEVELS, normalized)
    ? normalized
    : 'info';
};

const configuredLevel = normalizeLevel(env.logging.level);
const configuredPriority = LEVELS[configuredLevel];

const shouldLog = (level) => {
  return LEVELS[level] >= configuredPriority;
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();

  const base = {
    timestamp,
    level,
    service: 'finsight-api',
    message,
  };

  if (meta !== undefined) {
    base.meta = meta;
  }

  return JSON.stringify(base);
};

const write = (level, message, meta) => {
  if (!shouldLog(level)) {
    return;
  }

  const output = formatMessage(level, message, meta);

  if (level === 'error') {
    console.error(output);
    return;
  }

  if (level === 'warn') {
    console.warn(output);
    return;
  }

  console.log(output);
};

export const logger = Object.freeze({
  debug(message, meta) {
    write('debug', message, meta);
  },

  info(message, meta) {
    write('info', message, meta);
  },

  warn(message, meta) {
    write('warn', message, meta);
  },

  error(message, meta) {
    write('error', message, meta);
  },

  child(context = {}) {
    return Object.freeze({
      debug(message, meta = {}) {
        write('debug', message, {
          ...context,
          ...meta,
        });
      },

      info(message, meta = {}) {
        write('info', message, {
          ...context,
          ...meta,
        });
      },

      warn(message, meta = {}) {
        write('warn', message, {
          ...context,
          ...meta,
        });
      },

      error(message, meta = {}) {
        write('error', message, {
          ...context,
          ...meta,
        });
      },
    });
  },
});

export const getLogLevel = () => configuredLevel;

export default logger;