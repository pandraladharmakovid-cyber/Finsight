/**
 * FinSight browser test suite (Playwright).
 *
 *   node tests/ui.test.mjs [baseUrl]
 *
 * Verifies every route renders with real data and that a full
 * create → verify → delete cycle works through the actual UI.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3000';
const SHOTS = new URL('../screenshots', import.meta.url).pathname;

mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, condition, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  \u001b[32m✓\u001b[0m ${name}`);
  } else {
    fail += 1;
    failures.push(name);
    console.log(`  \u001b[31m✗\u001b[0m ${name} ${detail}`);
  }
}

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

const page = await context.newPage();

const consoleErrors = [];
const pageErrors = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const text = msg.text();
    // Ignore favicon / DevTools noise
    if (!text.includes('favicon') && !text.includes('DevTools')) {
      consoleErrors.push(text);
    }
  }
});

page.on('pageerror', (error) => pageErrors.push(error.message));

/* ==========================================================================
   1. Shell + Dashboard
   ========================================================================== */

console.log('\n\u001b[36m1. Application shell & dashboard\u001b[0m');

await page.goto(BASE, { waitUntil: 'networkidle' });
const loginInput = page.locator('#finsight-password');
if (await loginInput.isVisible()) {
  if (!process.env.FINSIGHT_TEST_PASSWORD) {
    throw new Error('Set FINSIGHT_TEST_PASSWORD to sign in before running browser tests.');
  }
  await loginInput.fill(process.env.FINSIGHT_TEST_PASSWORD);
  await page.getByRole('button', { name: /open finsight/i }).click();
  await page.locator('.fs-topbar').waitFor();
}
await page.waitForTimeout(1200);

ok('app redirects to /dashboard', page.url().includes('/dashboard'), page.url());

ok(
  'sidebar navigation renders',
  (await page.locator('.fs-nav-item').count()) >= 10,
);

ok(
  'brand mark is visible',
  await page.locator('.fs-brand-mark').isVisible(),
);

const dashTitle = await page.locator('.fs-topbar h1').textContent();
ok(
  'dashboard header shows the route title',
  dashTitle?.includes('Command Center'),
  dashTitle,
);

const statCount = await page.locator('.fs-stat').count();
ok('KPI stat cards render', statCount >= 4, `found ${statCount}`);

const netWorthText = await page.locator('.fs-card-glow').first().innerText();
ok(
  'net worth value rendered from the API',
  /₹/.test(netWorthText),
  netWorthText.slice(0, 80),
);

await page.screenshot({ path: `${SHOTS}/01-dashboard.png`, fullPage: true });

/* ==========================================================================
   2. Every route
   ========================================================================== */

console.log('\n\u001b[36m2. All routes render real data\u001b[0m');

const routes = [
  ['/transactions', 'Transactions'],
  ['/accounts', 'Accounts'],
  ['/categories', 'Categories'],
  ['/budgets', 'Budgets'],
  ['/savings', 'Savings Goals'],
  ['/debts', 'Debt Management'],
  ['/recurring', 'Recurring Transactions'],
  ['/analytics', 'Analytics'],
  ['/audit', 'Audit Log'],
  ['/settings', 'Settings'],
];

let shotIndex = 2;

for (const [path, expectedTitle] of routes) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const title = await page.locator('.fs-topbar h1').textContent();
  const body = await page.locator('.fs-page').innerText();

  const hasError =
    body.includes('Could not load') || body.includes('Cannot reach');

  ok(
    `${path} renders`,
    title?.includes(expectedTitle) && !hasError && body.length > 80,
    `title="${title}" len=${body.length}${hasError ? ' ERROR-STATE' : ''}`,
  );

  const name = path.replace('/', '');
  await page.screenshot({
    path: `${SHOTS}/${String(shotIndex++).padStart(2, '0')}-${name}.png`,
    fullPage: true,
  });
}

/* ==========================================================================
   3. Command palette
   ========================================================================== */

console.log('\n\u001b[36m3. Command palette\u001b[0m');

await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

await page.keyboard.press('Control+k');
await page.waitForTimeout(400);

ok(
  'Ctrl+K opens the command palette',
  await page.locator('.fs-palette').isVisible(),
);

await page.locator('.fs-palette-input').fill('budget');
await page.waitForTimeout(300);

const paletteItems = await page.locator('.fs-palette-item').count();
ok('palette filters results', paletteItems >= 1, `found ${paletteItems}`);

await page.locator('.fs-palette-item').first().click();
await page.waitForTimeout(700);

ok(
  'selecting a palette command navigates',
  page.url().includes('/budget'),
  page.url(),
);

/* ==========================================================================
   4. Create a transaction through the UI
   ========================================================================== */

console.log('\n\u001b[36m4. Transaction CRUD through the UI\u001b[0m');

await page.goto(`${BASE}/transactions`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

const rowsBefore = await page.locator('.fs-table tbody tr').count();

await page.getByRole('button', { name: 'New', exact: true }).first().click();
await page.waitForTimeout(500);

ok('new-transaction modal opens', await page.locator('.fs-modal').isVisible());

await page.locator('.fs-modal input[type="number"]').first().fill('4321');
await page
  .locator('.fs-modal input[placeholder*="Grocery"]')
  .fill('Playwright verification transaction');

// Account + category selects are the two <select> elements in the form
const selects = page.locator('.fs-modal select');
await selects.nth(0).selectOption({ index: 1 });
await selects.nth(1).selectOption({ index: 1 });

await page.getByRole('button', { name: /Record transaction/i }).click();
await page.waitForTimeout(1800);

const toastVisible = await page.locator('.fs-toast').count();
ok('success toast appears after saving', toastVisible >= 1);

const searchBox = page.locator('input[placeholder*="Search description"]');
await searchBox.fill('Playwright verification');
await page.waitForTimeout(700);

const filteredRows = await page.locator('.fs-table tbody tr').count();
ok(
  'the new transaction appears in the table',
  filteredRows >= 1,
  `rows=${filteredRows} (before=${rowsBefore})`,
);

const rowText = await page.locator('.fs-table tbody tr').first().innerText();
ok(
  'amount and description are correct',
  rowText.includes('4,321') && rowText.includes('Playwright'),
  rowText.replace(/\n/g, ' | ').slice(0, 120),
);

/* --- edit it --- */
await page.locator('.fs-table tbody tr').first().hover();
await page.waitForTimeout(300);
await page
  .locator('.fs-table tbody tr')
  .first()
  .getByRole('button', { name: /^Edit/ })
  .click();
await page.waitForTimeout(500);

ok('edit modal opens', await page.locator('.fs-modal').isVisible());

await page.locator('.fs-modal input[type="number"]').first().fill('5555');
await page.getByRole('button', { name: /Save changes/i }).click();
await page.waitForTimeout(1600);

const editedRow = await page.locator('.fs-table tbody tr').first().innerText();
ok('edited amount is reflected', editedRow.includes('5,555'), editedRow.slice(0, 80));

/* --- delete it --- */
await page.locator('.fs-table tbody tr').first().hover();
await page.waitForTimeout(300);
await page
  .locator('.fs-table tbody tr')
  .first()
  .getByRole('button', { name: /^Delete/ })
  .click();
await page.waitForTimeout(500);

ok(
  'delete confirmation opens',
  await page.locator('.fs-modal').isVisible(),
);

await page.getByRole('button', { name: 'Delete', exact: true }).click();
await page.waitForTimeout(1800);

await searchBox.fill('Playwright verification');
await page.waitForTimeout(600);

const remainingRows = await page.locator('.fs-table tbody tr').count();
const emptyVisible = await page.locator('.fs-empty').count();

ok(
  'deleted transaction is gone',
  remainingRows === 0 || emptyVisible > 0,
  `rows=${remainingRows}`,
);

await page.screenshot({ path: `${SHOTS}/12-transactions-after-crud.png`, fullPage: true });

/* ==========================================================================
   5. Account create → delete
   ========================================================================== */

console.log('\n\u001b[36m5. Account create/delete through the UI\u001b[0m');

await page.goto(`${BASE}/accounts`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

await page.getByRole('button', { name: /Add account/i }).first().click();
await page.waitForTimeout(500);

await page
  .locator('.fs-modal input[placeholder*="HDFC"]')
  .fill('Playwright Test Account');
await page
  .locator('.fs-modal input[type="number"]')
  .first()
  .fill('12345');

await page.getByRole('button', { name: /Create account/i }).click();
await page.waitForTimeout(1800);

const accountCards = await page.locator('.fs-card').allInnerTexts();
ok(
  'created account appears in the grid',
  accountCards.some((text) => text.includes('Playwright Test Account')),
);

// Verify it really hit the API
const apiCheck = await page.evaluate(async () => {
  const res = await fetch('/api/accounts/1');
  const json = await res.json();
  return json.data.some((account) => account.account_name === 'Playwright Test Account');
});
ok('account persisted to the database', apiCheck === true);

await page.getByText('Playwright Test Account').first().hover();
await page.waitForTimeout(300);

const card = page
  .locator('.fs-card')
  .filter({ hasText: 'Playwright Test Account' })
  .first();

await card.getByRole('button', { name: /^Delete/ }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await page.waitForTimeout(1800);

const stillThere = await page.evaluate(async () => {
  const res = await fetch('/api/accounts/1');
  const json = await res.json();
  return json.data.some((account) => account.account_name === 'Playwright Test Account');
});
ok('account removed from the database', stillThere === false);

/* ==========================================================================
   6. Budget create → delete
   ========================================================================== */

console.log('\n\u001b[36m6. Budget create through the UI\u001b[0m');

await page.goto(`${BASE}/budgets`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

await page.getByRole('button', { name: /New budget/i }).first().click();
await page.waitForTimeout(500);

const budgetSelects = page.locator('.fs-modal select');
await budgetSelects.nth(0).selectOption({ index: 1 });
await page.locator('.fs-modal input[type="number"]').first().fill('7777');

await page.getByRole('button', { name: /Create budget/i }).click();
await page.waitForTimeout(1800);

const budgetPersisted = await page.evaluate(async () => {
  const res = await fetch('/api/budgets/1');
  const json = await res.json();
  return json.data.some((row) => Number(row.budget_amount) === 7777);
});
ok('budget persisted with the correct amount', budgetPersisted === true);

/* ==========================================================================
   7. Savings contribution
   ========================================================================== */

console.log('\n\u001b[36m7. Savings goal flow\u001b[0m');

await page.goto(`${BASE}/savings`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const addFundsButtons = await page.getByRole('button', { name: /Add funds/i }).count();
ok('savings goals render with actions', addFundsButtons >= 1, `buttons=${addFundsButtons}`);

if (addFundsButtons > 0) {
  const before = await page.evaluate(async () => {
    const res = await fetch('/api/savings/1');
    const json = await res.json();
    return Number(json.data[0]?.current_amount ?? 0);
  });

  await page.getByRole('button', { name: /Add funds/i }).first().click();
  await page.waitForTimeout(500);
  await page.locator('.fs-modal input[type="number"]').first().fill('250');
  await page.locator('.fs-modal').getByRole('button', { name: /Add funds/i }).click();
  await page.waitForTimeout(1800);

  const after = await page.evaluate(async () => {
    const res = await fetch('/api/savings/1');
    const json = await res.json();
    return Number(json.data[0]?.current_amount ?? 0);
  });

  ok(
    'contribution updates the stored saved amount',
    after === before + 250,
    `before=${before} after=${after}`,
  );
}

/* ==========================================================================
   8. Debt payment
   ========================================================================== */

console.log('\n\u001b[36m8. Debt payment flow\u001b[0m');

await page.goto(`${BASE}/debts`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const payButtons = await page.getByRole('button', { name: /Log payment/i }).count();
ok('debt cards render with payment action', payButtons >= 1, `buttons=${payButtons}`);

if (payButtons > 0) {
  const before = await page.evaluate(async () => {
    const res = await fetch('/api/debts/1');
    const json = await res.json();
    return Number(json.data[0]?.remaining_amount ?? 0);
  });

  await page.getByRole('button', { name: /Log payment/i }).first().click();
  await page.waitForTimeout(500);
  await page.locator('.fs-modal input[type="number"]').first().fill('100');
  await page.getByRole('button', { name: /Record payment/i }).click();
  await page.waitForTimeout(1800);

  const after = await page.evaluate(async () => {
    const res = await fetch('/api/debts/1');
    const json = await res.json();
    return Number(json.data[0]?.remaining_amount ?? 0);
  });

  ok(
    'payment reduces the remaining balance',
    Math.abs(after - (before - 100)) < 0.01,
    `before=${before} after=${after}`,
  );
}

/* ==========================================================================
   9. Category create + validation
   ========================================================================== */

console.log('\n\u001b[36m9. Category flow + form validation\u001b[0m');

await page.goto(`${BASE}/categories`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

await page.getByRole('button', { name: /New category/i }).first().click();
await page.waitForTimeout(500);

// Submit empty first → inline validation
await page.getByRole('button', { name: /Create category/i }).click();
await page.waitForTimeout(400);

ok(
  'empty category name shows validation',
  (await page.locator('.fs-error-text').count()) >= 1,
);

await page
  .locator('.fs-modal input[placeholder*="Groceries"]')
  .fill('Playwright Category');

await page.getByRole('button', { name: /Create category/i }).click();
await page.waitForTimeout(1600);

const catPersisted = await page.evaluate(async () => {
  const res = await fetch('/api/categories');
  const json = await res.json();
  return json.data.some((row) => row.category_name === 'Playwright Category');
});
ok('category persisted to the database', catPersisted === true);

/* ==========================================================================
   10. Recurring create
   ========================================================================== */

console.log('\n\u001b[36m10. Recurring schedule\u001b[0m');

await page.goto(`${BASE}/recurring`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

await page.getByRole('button', { name: /New schedule/i }).first().click();
await page.waitForTimeout(500);

await page
  .locator('.fs-modal input[placeholder*="Netflix"]')
  .fill('Playwright Subscription');
await page.locator('.fs-modal input[type="number"]').first().fill('199');

/* Select order in this modal: frequency, account, category */
const recSelects = page.locator('.fs-modal select');
await recSelects.nth(0).selectOption('MONTHLY');
await recSelects.nth(1).selectOption({ index: 1 });

await page.getByRole('button', { name: /Create schedule/i }).click();
await page.waitForTimeout(1800);

const recPersisted = await page.evaluate(async () => {
  const res = await fetch('/api/recurring/1');
  const json = await res.json();
  return json.data.some((row) => row.description === 'Playwright Subscription');
});
ok('recurring schedule persisted', recPersisted === true);

/* ==========================================================================
   11. Settings — profile + theme
   ========================================================================== */

console.log('\n\u001b[36m11. Settings\u001b[0m');

await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

const accentBefore = await page.evaluate(
  () => document.documentElement.dataset.accent,
);

await page.getByRole('button', { name: /Signal Mint/i }).click();
await page.waitForTimeout(400);

const accentAfter = await page.evaluate(
  () => document.documentElement.dataset.accent,
);

ok(
  'accent theme switch applies to the document',
  accentAfter === 'mint' && accentBefore !== 'mint',
  `${accentBefore} → ${accentAfter}`,
);

await page.getByRole('button', { name: /Aurora Violet/i }).click();
await page.waitForTimeout(300);

const originalName = await page.evaluate(async () => {
  const res = await fetch('/api/users/1');
  const json = await res.json();
  return json.data.full_name;
});

const nameInput = page.locator('.fs-input').first();
await nameInput.fill('Playwright Profile');
await page.getByRole('button', { name: /Save profile/i }).click();
await page.waitForTimeout(1600);

const savedName = await page.evaluate(async () => {
  const res = await fetch('/api/users/1');
  const json = await res.json();
  return json.data.full_name;
});

ok('profile update persists', savedName === 'Playwright Profile', savedName);

await nameInput.fill(originalName);
await page.getByRole('button', { name: /Save profile/i }).click();
await page.waitForTimeout(1400);

/* ==========================================================================
   12. Responsive / mobile
   ========================================================================== */

console.log('\n\u001b[36m12. Mobile layout\u001b[0m');

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

ok(
  'mobile navigation trigger is visible',
  await page.locator('.fs-mobile-trigger').isVisible(),
);

await page.locator('.fs-mobile-trigger').click();
await page.waitForTimeout(500);

const sidebarBox = await page.locator('.fs-sidebar').boundingBox();
ok(
  'sidebar drawer slides into view',
  sidebarBox && sidebarBox.x >= -5 && sidebarBox.x < 40,
  JSON.stringify(sidebarBox),
);

await page.screenshot({ path: `${SHOTS}/13-mobile-dashboard.png`, fullPage: true });

await page.setViewportSize({ width: 1440, height: 900 });

/* ==========================================================================
   13. Console health
   ========================================================================== */

console.log('\n\u001b[36m13. Runtime health\u001b[0m');

ok(
  'no uncaught page errors',
  pageErrors.length === 0,
  pageErrors.slice(0, 3).join(' | '),
);

const meaningfulConsoleErrors = consoleErrors.filter(
  (text) => !text.includes('Failed to load resource'),
);

ok(
  'no console errors',
  meaningfulConsoleErrors.length === 0,
  meaningfulConsoleErrors.slice(0, 3).join(' | '),
);

/* ==========================================================================
   Cleanup test rows
   ========================================================================== */

console.log('\n\u001b[36m14. Cleanup\u001b[0m');

const cleanup = await page.evaluate(async () => {
  const removed = [];

  const cats = await (await fetch('/api/categories')).json();
  for (const row of cats.data ?? []) {
    if (row.category_name === 'Playwright Category') {
      await fetch(`/api/categories/${row.category_id}`, { method: 'DELETE' });
      removed.push('category');
    }
  }

  const rec = await (await fetch('/api/recurring/1')).json();
  for (const row of rec.data ?? []) {
    if (row.description === 'Playwright Subscription') {
      await fetch(`/api/recurring/1/${row.recurring_id}`, { method: 'DELETE' });
      removed.push('recurring');
    }
  }

  const budgets = await (await fetch('/api/budgets/1')).json();
  for (const row of budgets.data ?? []) {
    if (Number(row.budget_amount) === 7777) {
      await fetch(`/api/budgets/1/${row.budget_id}`, { method: 'DELETE' });
      removed.push('budget');
    }
  }

  return removed;
});

ok('test artefacts cleaned up', cleanup.length >= 3, JSON.stringify(cleanup));

/* ==========================================================================
   Summary
   ========================================================================== */

await browser.close();

console.log(
  `\n${fail === 0 ? '\u001b[32m' : '\u001b[31m'}===== UI RESULT: ${pass} passed, ${fail} failed =====\u001b[0m`,
);

if (fail > 0) {
  console.log('\nFailed checks:');
  failures.forEach((name) => console.log(' - ' + name));
  process.exit(1);
}
