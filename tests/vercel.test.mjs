import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';

// These tests exercise routing and validation without connecting to a real DB.
Object.assign(process.env, {
  NODE_ENV: 'production',
  LOG_LEVEL: 'error',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_NAME: 'routing_test',
  DB_USER: 'routing_test',
  DB_PASSWORD: 'not-a-real-password',
  DB_CONNECTION_TIMEOUT_MS: '250',
});

const { default: handler, restoreApiUrl } = await import('../api/index.js');
const { pool } = await import('../backend/src/config/database.js');
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url)));

let server;
let baseUrl;

before(async () => {
  server = createServer(handler);
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

test('Vercel config routes API requests before frontend deep links', () => {
  const [apiRewrite, spaRewrite] = config.rewrites;
  const apiPattern = new RegExp(`^${apiRewrite.source}$`);
  const spaPattern = new RegExp(`^${spaRewrite.source}$`);

  assert.match(apiRewrite.destination, /^\/api\?__finsight_path=/);
  assert.equal(apiPattern.test('/api/transactions/1/summary'), true);
  assert.equal(spaPattern.test('/api/transactions/1/summary'), false);
  assert.equal(spaPattern.test('/api'), false);
  assert.equal(spaPattern.test('/dashboard/'), true);
  assert.equal(spaRewrite.destination, '/index.html');
});

test('local environment files are excluded from function bundles', async () => {
  const excluded = config.functions['api/index.js'].excludeFiles;
  assert.match(excluded, /(?:\{|,)\.env(?:,|\})/);
  assert.match(excluded, /(?:\{|,)backend\/\.env(?:,|\})/);
  assert.match(excluded, /backend\/\.env\.\*/);
  assert.match(excluded, /\*\*\/\.env/);
  const ignoredUploads = await readFile(new URL('../.vercelignore', import.meta.url), 'utf8');
  assert.match(ignoredUploads, /^backend\/\.env$/m);
  assert.match(ignoredUploads, /^\.env\.\*$/m);
});

test('rewrite recovery retains nested paths and original query parameters', () => {
  assert.equal(
    restoreApiUrl('/api?__finsight_path=%2Ftransactions%2F1%2Fsummary&from=2026-01-01&tag=a&tag=b'),
    '/api/transactions/1/summary?from=2026-01-01&tag=a&tag=b',
  );
  assert.equal(restoreApiUrl('/api/index?__finsight_path=/meta'), '/api/meta');
  assert.equal(restoreApiUrl('/api/index.js?__finsight_path=%2Fmeta'), '/api/meta');
  assert.equal(restoreApiUrl('/api?__finsight_path=%2F&sort=desc'), '/api/?sort=desc');
});

test('original API URLs do not get rewritten a second time', () => {
  assert.equal(restoreApiUrl('/api/meta?x=1'), '/api/meta?x=1');
  assert.equal(restoreApiUrl('/api/meta?__finsight_path=/other'), '/api/meta?__finsight_path=/other');
  assert.equal(restoreApiUrl('/api?x=1'), '/api?x=1');
});

test('the exported function serves metadata for original and rewritten paths', async () => {
  for (const path of ['/api/meta', '/api?__finsight_path=%2Fmeta']) {
    const response = await fetch(baseUrl + path);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data.accountTypes, ['BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'INVESTMENT']);
  }
});

test('nested routes and POST bodies reach Express after rewrite', async () => {
  const nested = await fetch(`${baseUrl}/api?__finsight_path=%2Ftransactions%2Fnot-an-id%2F123%2Frequired`);
  assert.equal(nested.status, 400);
  assert.match((await nested.json()).message, /userId must be a positive integer/);

  const post = await fetch(`${baseUrl}/api?__finsight_path=%2Ftransactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'not-an-id', amount: 5 }),
  });
  assert.equal(post.status, 400);
  assert.match((await post.json()).message, /userId must be a positive integer/);
});

test('unknown API routes return JSON 404s, not the SPA', async () => {
  const response = await fetch(`${baseUrl}/api?__finsight_path=%2Fmissing%2Froute&filter=hello`);
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.match((await response.json()).message, /\/api\/missing\/route\?filter=hello/);
});

test('health reports an unavailable database without contacting a real provider', async () => {
  const response = await fetch(`${baseUrl}/api?__finsight_path=%2Fhealth`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.database, null);
  assert.match(body.message, /database check failed/);
});
