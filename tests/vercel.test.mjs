import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { scryptSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';

// These tests exercise routing and security without connecting to a real DB.
const testPassword = 'only-for-routing-tests-not-a-real-secret';
const salt = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');
const passwordHash = scryptSync(testPassword, salt, 32).toString('hex');
Object.assign(process.env, {
  NODE_ENV: 'production',
  LOG_LEVEL: 'error',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_NAME: 'routing_test',
  DB_USER: 'routing_test',
  DB_PASSWORD: 'not-a-real-password',
  DB_CONNECTION_TIMEOUT_MS: '250',
  FINSIGHT_PASSWORD_HASH: `scrypt:${salt.toString('hex')}:${passwordHash}`,
  FINSIGHT_SESSION_SECRET: 'test-session-secret-with-at-least-forty-three-characters',
});

const { default: handler, restoreApiUrl } = await import('../api/index.js');
const { pool } = await import('../backend/src/config/database.js');
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url)));

let server;
let baseUrl;
let sessionCookie;

before(async () => {
  server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-finsight-request': '1' },
    body: JSON.stringify({ password: testPassword }),
  });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Strict/i);
  sessionCookie = setCookie.split(';')[0];
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
    const response = await fetch(baseUrl + path, { headers: { cookie: sessionCookie } });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data.accountTypes, ['BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'INVESTMENT']);
  }
});

test('nested routes and POST bodies reach Express after rewrite', async () => {
  const nested = await fetch(`${baseUrl}/api?__finsight_path=%2Ftransactions%2Fnot-an-id%2F123%2Frequired`, {
    headers: { cookie: sessionCookie },
  });
  assert.equal(nested.status, 400);
  assert.match((await nested.json()).message, /userId must be a positive integer/);

  const post = await fetch(`${baseUrl}/api?__finsight_path=%2Ftransactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-finsight-request': '1', cookie: sessionCookie },
    body: JSON.stringify({ userId: 'not-an-id', amount: 5 }),
  });
  assert.equal(post.status, 400);
  assert.match((await post.json()).message, /userId must be a positive integer/);
});

test('unknown API routes return JSON 404s, not the SPA', async () => {
  const response = await fetch(`${baseUrl}/api?__finsight_path=%2Fmissing%2Froute&filter=hello`, {
    headers: { cookie: sessionCookie },
  });
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.match((await response.json()).message, /\/api\/missing\/route\?filter=hello/);
});

test('health reports an unavailable database without contacting a real provider', async () => {
  const response = await fetch(`${baseUrl}/api?__finsight_path=%2Fhealth`, {
    headers: { cookie: sessionCookie },
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.database, null);
  assert.match(body.message, /database check failed/);
});

test('every financial endpoint and the database health check require sign-in', async () => {
  for (const path of [
    '/api/users/1',
    '/api/categories',
    '/api/health',
    '/api/meta',
    '/api?__finsight_path=%2Fdashboard%2F1',
  ]) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const badCookie = await fetch(`${baseUrl}/api/meta`, { headers: { cookie: `${sessionCookie}tampered` } });
  assert.equal(badCookie.status, 401);
});

test('login rejects incorrect passwords and writes without the anti-CSRF header', async () => {
  const withoutHeader = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: testPassword }),
  });
  assert.equal(withoutHeader.status, 403);
  const wrong = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-finsight-request': '1' },
    body: JSON.stringify({ password: 'wrong' }),
  });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.get('set-cookie'), null);
  const csrf = await fetch(`${baseUrl}/api/transactions/1`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: sessionCookie },
    body: '{}',
  });
  assert.equal(csrf.status, 403);
});

test('the API rejects cross-origin writes and does not enable CORS', async () => {
  const crossOrigin = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-finsight-request': '1',
      cookie: sessionCookie,
      origin: 'https://untrusted.example',
    },
    body: '{}',
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOrigin.headers.get('access-control-allow-origin'), null);
  const preflight = await fetch(`${baseUrl}/api/transactions/1`, {
    method: 'OPTIONS',
    headers: { origin: 'https://untrusted.example', 'access-control-request-method': 'POST' },
  });
  assert.equal(preflight.headers.get('access-control-allow-origin'), null);
});

test('logout expires the browser session cookie', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-finsight-request': '1', cookie: sessionCookie },
    body: '{}',
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i);
});

test('production fails closed when sign-in configuration is absent', () => {
  const script = `
    const { requireAuthentication } = await import('./backend/src/middleware/auth.js');
    const res = { status(code) { this.code = code; return this; }, json() { console.log(this.code); } };
    requireAuthentication({ headers: {} }, res, () => console.log('bypassed'));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NODE_ENV: 'production', FINSIGHT_PASSWORD_HASH: '', FINSIGHT_SESSION_SECRET: '', FINSIGHT_DISABLE_AUTH: 'true' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '503');
});
