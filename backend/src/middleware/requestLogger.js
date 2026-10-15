import logger from '../config/logger.js';

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
};

const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info('HTTP request completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: getClientIp(req),
      userAgent: req.get('user-agent') || 'unknown',
    });
  });

  res.on('close', () => {
    if (!res.writableFinished) {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      logger.warn('HTTP request connection closed early', {
        method: req.method,
        path: req.originalUrl,
        durationMs: Number(durationMs.toFixed(2)),
      });
    }
  });

  next();
};

export default requestLogger;