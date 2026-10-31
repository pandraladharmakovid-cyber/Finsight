import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// This browser test uses an isolated React fixture and never calls the API.
// Set CHROMIUM_EXECUTABLE_PATH if Playwright's bundled Chromium is unavailable.
test('animated totals stay bounded and resume from the displayed value', async () => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    plugins: [react()],
    server: { host: '127.0.0.1', port: 0, strictPort: true },
    appType: 'mpa',
    logLevel: 'error',
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.addInitScript(() => {
      let nextId = 1;
      const frames = new Map();
      window.requestAnimationFrame = (callback) => {
        const id = nextId++;
        frames.set(id, callback);
        return id;
      };
      window.cancelAnimationFrame = (id) => frames.delete(id);
      window.pendingTestFrames = () => frames.size;
      window.stepTestFrame = (timestamp) => {
        const callbacks = [...frames.values()];
        frames.clear();
        callbacks.forEach((callback) => callback(timestamp));
      };
    });
    const port = server.httpServer.address().port;
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/count-up.html`);
    await page.waitForFunction(
      () => typeof window.setCountUpTarget === 'function' && window.pendingTestFrames() > 0,
      null,
      { polling: 10 },
    );

    const output = page.locator('#value');
    const origin = await page.evaluate(() => performance.now() - 5000);
    await page.evaluate((time) => window.stepTestFrame(time), origin);
    await page.waitForTimeout(20);
    assert.equal(Number(await output.textContent()), 0, 'an earlier frame must not produce a negative total');

    await page.evaluate((time) => window.stepTestFrame(time), origin + 500);
    await page.waitForFunction(() => Number(document.querySelector('#value').textContent) > 0, null, { polling: 10 });
    const halfway = Number(await output.textContent());
    assert.ok(halfway > 0 && halfway < 15000);

    await page.evaluate(() => window.setCountUpTarget(30000));
    await page.waitForFunction(() => window.countUpTargetCommitted === 30000, null, { polling: 10 });
    await page.evaluate((time) => window.stepTestFrame(time), origin + 510);
    await page.waitForTimeout(20);
    assert.equal(Number(await output.textContent()), halfway, 'a changed target must start at the current value');

    // Even a clock that moves backwards must not extrapolate beyond the start.
    await page.evaluate((time) => window.stepTestFrame(time), origin + 100);
    await page.waitForTimeout(20);
    assert.equal(Number(await output.textContent()), halfway);

    await page.evaluate((time) => window.stepTestFrame(time), origin + 2000);
    await page.waitForFunction(() => Number(document.querySelector('#value').textContent) === 30000, null, { polling: 10 });

    await page.evaluate(() => window.setCountUpTarget(-500));
    await page.waitForFunction(() => window.countUpTargetCommitted === -500, null, { polling: 10 });
    await page.evaluate((time) => window.stepTestFrame(time), origin + 2010);
    await page.evaluate((time) => window.stepTestFrame(time), origin + 3010);
    await page.waitForFunction(() => Number(document.querySelector('#value').textContent) === -500, null, { polling: 10 });
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
});
