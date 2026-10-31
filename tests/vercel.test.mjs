import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';

// Exercise production routing without a real database or sign-in settings.
Object.assign(process.env, {
  NODE_ENV: 'production',
  LOG_LEVEL: 'error',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_NAME: 'routing_test',
  DB_USER: 'routing_test',
  DB_PASSWORD: 'not-a-real-password',
});
delete process.env.FINSIGHT_PASSWORD_HASH;
delete process.env.FINSIGHT_SESSION_SECRET;

const { default: app } = await import('../backend/src/app.js');
const { pool } = await import('../backend/src/config/database.js');
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url)));

let server;
let baseUrl;

before(async () => {
  // An in-memory query stub keeps the suite completely isolated from PostgreSQL.
  pool.query = async (sql) => ({
    rows: /current_database\(\)/i.test(sql)
      ? [{ database_name: 'routing_test', current_schema: 'public' }]
      : [],
  });
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await pool.end();
});

test('Vercel routes API requests to Express and supports SPA deep links', () => {
  assert.equal(config.services.frontend.framework, 'vite');
  assert.deepEqual(config.services.frontend.rewrites, [
    { source: '/(.*)', destination: '/index.html' },
  ]);
  assert.equal(config.services.backend.framework, 'express');
  assert.equal(config.services.backend.root, 'backend');
  assert.equal(config.services.backend.entrypoint, 'src/app.js');
  const [apiRewrite, frontendRewrite] = config.rewrites;
  assert.equal(new RegExp(`^${apiRewrite.source}$`).test('/api/transactions/1/summary'), true);
  assert.deepEqual(apiRewrite.destination, { service: 'backend' });
  assert.deepEqual(frontendRewrite.destination, { service: 'frontend' });
});

test('local credentials are excluded from deployment uploads', async () => {
  const ignoredUploads = await readFile(new URL('../.vercelignore', import.meta.url), 'utf8');
  assert.match(ignoredUploads, /^backend\/\.env$/m);
  assert.match(ignoredUploads, /^\.env\.\*$/m);
});

test('metadata and dashboard are public without authentication configuration', async () => {
  for (const path of ['/api/meta', '/api/meta?source=vercel']) {
    const response = await fetch(baseUrl + path);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(body.data.accountTypes, ['BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'INVESTMENT']);
  }
  const dashboard = await fetch(`${baseUrl}/api/dashboard/1`);
  const body = await dashboard.json();
  assert.equal(dashboard.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.summary);
  assert.ok(Array.isArray(body.data.accounts));
});

test('nested routes and write bodies reach Express without a sign-in header', async () => {
  const nested = await fetch(`${baseUrl}/api/transactions/not-an-id/123/required`);
  assert.equal(nested.status, 400);
  assert.match((await nested.json()).message, /userId must be a positive integer/);

  const post = await fetch(`${baseUrl}/api/transactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'not-an-id', amount: 5 }),
  });
  assert.equal(post.status, 400);
  assert.match((await post.json()).message, /userId must be a positive integer/);
});

test('unknown API routes, including old login routes, return JSON 404s', async () => {
  for (const path of ['/api/missing/route?filter=hello', '/api/auth/session']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /application\/json/);
  }
});

test('health is public and accurately reports database connectivity', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.database.database_name, 'routing_test');

  const query = pool.query;
  pool.query = async () => { throw new Error('database unavailable'); };
  try {
    const unavailable = await fetch(`${baseUrl}/api/health`);
    const result = await unavailable.json();
    assert.equal(result.database, null);
    assert.match(result.message, /database check failed/);
  } finally {
    pool.query = query;
  }
});
