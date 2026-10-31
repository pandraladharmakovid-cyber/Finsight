import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,

  ssl: env.db.ssl
    ? {
        // When TLS is enabled, verify the server identity instead of silently
        // accepting untrusted certificates. A provider CA may be supplied.
        rejectUnauthorized: true,
        ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
      }
    : undefined,

  max: env.db.maxConnections,
  idleTimeoutMillis: env.db.idleTimeoutMs,
  connectionTimeoutMillis: env.db.connectionTimeoutMs,

  application_name: 'finsight-api',
});

pool.on('error', (error) => {
  console.error('❌ Unexpected PostgreSQL pool error:', error);
});

export const checkDatabaseConnection = async () => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS current_schema,
        CURRENT_TIMESTAMP AS server_time
    `);

    return result.rows[0];
  } finally {
    client.release();
  }
};

export const closeDatabaseConnection = async () => {
  await pool.end();
};

export default pool;
