import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';

const server = app.listen(env.port, () => {
  logger.info('FinSight API server started', {
    port: env.port,
    environment: env.nodeEnv,
  });
});

const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down FinSight API...`);

  server.close(() => {
    logger.info('FinSight API server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    message: error.message,
    stack: error.stack,
  });

  shutdown('uncaughtException');
});