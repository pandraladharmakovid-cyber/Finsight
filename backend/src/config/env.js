import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load backend/.env based on THIS file location, never the shell cwd,
// so the API starts correctly from the project root or from backend/.
const here = dirname(fileURLToPath(import.meta.url));

const candidates = [
  resolve(here, "../../.env"),
  resolve(here, "../.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "backend/.env"),
];

for (const file of candidates) {
  if (existsSync(file)) {
    dotenv.config({ path: file });
    break;
  }
}

const requiredEnv = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

const missingEnv = requiredEnv.filter((key) => {
  const value = process.env[key];
  return !value || value.trim() === '';
});

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(', ')}`,
  );
}

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === '') {
    return fallback;
  }

  return ['true', '1', 'yes', 'on'].includes(
    value.toLowerCase(),
  );
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',

  port: parseNumber(process.env.PORT, 5000),

  db: Object.freeze({
    host: process.env.DB_HOST,
    port: parseNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: parseBoolean(process.env.DB_SSL, false),
    maxConnections: parseNumber(
      process.env.DB_MAX_CONNECTIONS,
      10,
    ),
    idleTimeoutMs: parseNumber(
      process.env.DB_IDLE_TIMEOUT_MS,
      30000,
    ),
    connectionTimeoutMs: parseNumber(
      process.env.DB_CONNECTION_TIMEOUT_MS,
      10000,
    ),
  }),

  cors: Object.freeze({
    origin: process.env.CORS_ORIGIN || '*',
  }),

  logging: Object.freeze({
    level: process.env.LOG_LEVEL || 'info',
  }),
});

export default env;
