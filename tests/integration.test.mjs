/**
 * FinSight backend integration test suite.
 * Exercises every endpoint and every CRUD flow against the live API.
 *
 *   node tests/integration.test.mjs [baseUrl]
 */

const BASE = process.argv[2] || 'http://localhost:5000/api';
const UID = 1;
let sessionCookie = '';
if (process.env.FINSIGHT_TEST_PASSWORD) {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-FinSight-Request': '1' },
    body: JSON.stringify({ password: process.env.FINSIGHT_TEST_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Test sign-in failed (${login.status}).`);
  sessionCookie = login.headers.get('set-cookie')?.split(';')[0] || '';
}

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

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(['GET', 'HEAD'].includes(method) ? {} : { 'X-FinSight-Request': '1' }),
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, body: json };
}

const get = (p) => call('GET', p);
const post = (p, b) => call('POST', p, b);
const put = (p, b) => call('PUT', p, b);
const del = (p) => call('DELETE', p);

const num = (v) => Number(v ?? 0);

function section(title) {
  console.log(`\n\u001b[36m${title}\u001b[0m`);
}

/* ==========================================================================
   HEALTH + READS
   ========================================================================== */

section('1. Health & metadata');

{
  const r = await get('/health');
  ok('GET /health returns healthy', r.status === 200 && r.body?.success === true);
  ok('health includes database info', Boolean(r.body?.database?.database_name));

  const m = await get('/meta');
  ok('GET /meta exposes account types', Array.isArray(m.body?.data?.accountTypes));
  ok(
    'meta account types match DB constraint',
    JSON.stringify(m.body?.data?.accountTypes) ===
      JSON.stringify(['BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'INVESTMENT']),
  );
}

/* ==========================================================================
   DISCOVER EXISTING DATA
   ========================================================================== */

section('2. Read endpoints');

const accountsRes = await get(`/accounts/${UID}`);
const accounts = accountsRes.body?.data ?? [];
ok('GET /accounts/:userId', accountsRes.status === 200 && Array.isArray(accounts));
ok('at least one account exists', accounts.length > 0);

const accountId = accounts[0]?.account_id;

const catsRes = await get('/categories');
const categories = catsRes.body?.data ?? [];
ok('GET /categories', catsRes.status === 200 && categories.length > 0);

const categoryId = categories[0]?.category_id;

const reads = [
  [`/dashboard/${UID}`, (b) => b?.data?.summary && Array.isArray(b?.data?.accounts)],
  [`/dashboard/${UID}/activity`, (b) => b?.success],
  [`/dashboard/${UID}/analytics`, (b) => b?.success],
  [`/transactions/${UID}`, (b) => Array.isArray(b?.data)],
  [`/transactions/${UID}/recent`, (b) => Array.isArray(b?.data)],
  [`/transactions/${UID}/count`, (b) => b?.success],
  [`/transactions/${UID}/summary`, (b) => b?.success],
  [`/accounts/${UID}/active`, (b) => Array.isArray(b?.data)],
  [`/accounts/${UID}/summary`, (b) => b?.success],
  [`/budgets/${UID}`, (b) => Array.isArray(b?.data)],
  [`/budgets/${UID}/summary`, (b) => b?.success],
  [`/budgets/${UID}/performance`, (b) => Array.isArray(b?.data)],
  [`/savings/${UID}`, (b) => Array.isArray(b?.data)],
  [`/savings/${UID}/overview`, (b) => b?.data?.metrics],
  [`/savings/${UID}/progress`, (b) => Array.isArray(b?.data)],
  [`/debts/${UID}`, (b) => Array.isArray(b?.data)],
  [`/debts/${UID}/summary`, (b) => b?.success],
  [`/debts/${UID}/overview`, (b) => b?.success],
  [`/recurring/${UID}`, (b) => Array.isArray(b?.data)],
  [`/recurring/${UID}/overview`, (b) => b?.data?.metrics],
  [`/analytics/${UID}/financial`, (b) => b?.success],
  [`/analytics/${UID}/spending`, (b) => b?.success],
  [`/analytics/${UID}/accounts`, (b) => b?.success],
  [`/analytics/${UID}/budgets`, (b) => b?.success],
  [`/analytics/${UID}/debts`, (b) => b?.success],
  [`/analytics/${UID}/savings`, (b) => b?.success],
  [`/audit/${UID}`, (b) => Array.isArray(b?.data)],
  [`/audit/${UID}/overview`, (b) => b?.data],
  [`/users/${UID}`, (b) => b?.data?.email],
];

for (const [path, verify] of reads) {
  const r = await get(path);
  ok(`GET ${path}`, r.status === 200 && Boolean(verify(r.body)), `(status ${r.status})`);
}

const userRes = await get(`/users/${UID}`);
ok('GET /users/:userId returns profile', userRes.status === 200 && Boolean(userRes.body?.data?.full_name));

/* ==========================================================================
   TRANSACTIONS — CRUD + BALANCE MATH
   ========================================================================== */

section('3. Transactions (CRUD + balance integrity)');

const balanceBefore = num(accounts.find((a) => a.account_id === accountId)?.balance);

{
  const created = await post(`/transactions/${UID}`, {
    accountId,
    categoryId,
    amount: 500,
    transactionType: 'EXPENSE',
    description: 'Integration test expense',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const tx = created.body?.data;
  ok('POST /transactions creates a row', created.status === 201 && Boolean(tx?.transaction_id));

  const txId = tx?.transaction_id;

  const afterCreate = await get(`/accounts/${UID}/active`);
  const balAfter = num(
    (afterCreate.body?.data ?? []).find((a) => a.account_id === accountId)?.balance,
  );

  ok(
    'expense decreases balance exactly once (no double count)',
    Math.abs(balAfter - (balanceBefore - 500)) < 0.01,
    `expected ${balanceBefore - 500}, got ${balAfter}`,
  );

  const single = await get(`/transactions/${UID}/${txId}`);
  ok('GET /transactions/:userId/:id', single.status === 200 && Boolean(single.body?.data));

  const required = await get(`/transactions/${UID}/${txId}/required`);
  ok('GET /transactions/:userId/:id/required', required.status === 200);

  const updated = await put(`/transactions/${UID}/${txId}`, {
    amount: 750,
    description: 'Integration test updated',
  });

  const balAfterUpdate = num(
    ((await get(`/accounts/${UID}/active`)).body?.data ?? []).find(
      (a) => a.account_id === accountId,
    )?.balance,
  );

  ok('PUT /transactions updates the row', updated.status === 200);
  ok(
    'update re-syncs balance exactly (750 not 1250)',
    Math.abs(balAfterUpdate - (balanceBefore - 750)) < 0.01,
    `expected ${balanceBefore - 750}, got ${balAfterUpdate}`,
  );

  const deleted = await del(`/transactions/${UID}/${txId}`);
  ok('DELETE /transactions removes the row', deleted.status === 200);

  const balAfterDelete = num(
    ((await get(`/accounts/${UID}/active`)).body?.data ?? []).find(
      (a) => a.account_id === accountId,
    )?.balance,
  );

  ok(
    'delete restores original balance',
    Math.abs(balAfterDelete - balanceBefore) < 0.01,
    `expected ${balanceBefore}, got ${balAfterDelete}`,
  );
}

{
  const bad = await post(`/transactions/${UID}`, {
    accountId: 999999,
    amount: 10,
    transactionType: 'EXPENSE',
  });
  ok('creating a transaction on a foreign account → 400', bad.status === 400);

  const zero = await post(`/transactions/${UID}`, {
    accountId,
    amount: 0,
    transactionType: 'EXPENSE',
  });
  ok('zero-amount transaction rejected → 400', zero.status === 400);

  const noCat = await post(`/transactions/${UID}`, {
    accountId,
    amount: 42,
    transactionType: 'INCOME',
    description: 'no category supplied',
  });
  ok('omitted category falls back safely (201)', noCat.status === 201);
  if (noCat.body?.data?.transaction_id) {
    await del(`/transactions/${UID}/${noCat.body.data.transaction_id}`);
  }
}

/* ==========================================================================
   ACCOUNTS
   ========================================================================== */

section('4. Accounts (CRUD + type normalisation)');

{
  const created = await post(`/accounts/${UID}`, {
    accountName: 'Integration Wallet',
    accountType: 'Wallet',
    balance: 2500,
    currency: 'INR',
  });

  const acc = created.body?.data;
  ok('POST /accounts creates a row', created.status === 201 && Boolean(acc?.account_id));
  ok('account type normalised to WALLET', acc?.account_type === 'WALLET', `got ${acc?.account_type}`);

  const id = acc?.account_id;

  const odd = await post(`/accounts/${UID}`, {
    accountName: 'Odd Type Account',
    accountType: 'Checking',
  });
  ok(
    'legacy "Checking" normalised to BANK (no DB constraint crash)',
    odd.status === 201 && odd.body?.data?.account_type === 'BANK',
  );
  if (odd.body?.data?.account_id) {
    await del(`/accounts/${UID}/${odd.body.data.account_id}`);
  }

  const upd = await put(`/accounts/${UID}/${id}`, {
    accountName: 'Integration Wallet 2',
    balance: 3000,
  });
  ok('PUT /accounts updates the row', upd.status === 200 && upd.body?.data?.account_name === 'Integration Wallet 2');

  const one = await get(`/accounts/${UID}/${id}`);
  ok('GET /accounts/:userId/:id', one.status === 200 && num(one.body?.data?.balance) === 3000);

  const removed = await del(`/accounts/${UID}/${id}`);
  ok('DELETE /accounts removes the row', removed.status === 200);
}

/* ==========================================================================
   BUDGETS
   ========================================================================== */

section('5. Budgets (CRUD + real column mapping)');

{
  const created = await post(`/budgets/${UID}`, {
    categoryId,
    budgetAmount: 8000,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  });

  const budget = created.body?.data;
  ok('POST /budgets creates a row', created.status === 201 && Boolean(budget?.budget_id));
  ok('budget_amount is stored (not 0 / not amount_limit)', num(budget?.budget_amount) === 8000, `got ${budget?.budget_amount}`);

  const id = budget?.budget_id;

  const one = await get(`/budgets/${UID}/${id}`);
  ok('GET /budgets/:userId/:id (previously 404 route)', one.status === 200 && Boolean(one.body?.data));

  const req = await get(`/budgets/${UID}/${id}/required`);
  ok('GET /budgets/:userId/:id/required', req.status === 200);

  const upd = await put(`/budgets/${UID}/${id}`, { budgetAmount: 9500 });
  ok('PUT /budgets updates amount', upd.status === 200 && num(upd.body?.data?.budget_amount) === 9500);

  const zero = await post(`/budgets/${UID}`, { categoryId, budgetAmount: 0 });
  ok('zero budget rejected → 400', zero.status === 400);

  const removed = await del(`/budgets/${UID}/${id}`);
  ok('DELETE /budgets removes the row', removed.status === 200);

  const gone = await get(`/budgets/${UID}/${id}/required`);
  ok('required fetch of deleted budget → 404', gone.status === 404);
}

/* ==========================================================================
   SAVINGS
   ========================================================================== */

section('6. Savings goals (CRUD + invariants)');

{
  const created = await post(`/savings/${UID}`, {
    goalName: 'Integration Goal',
    targetAmount: 100000,
    currentAmount: 25000,
    targetDate: '2027-12-31',
    status: 'ACTIVE',
  });

  const goal = created.body?.data;
  ok('POST /savings creates a row', created.status === 201 && Boolean(goal?.goal_id));
  ok('goal status persisted', goal?.status === 'ACTIVE');

  const id = goal?.goal_id;

  const one = await get(`/savings/${UID}/${id}`);
  ok('GET /savings/:userId/:id (previously 404 route)', one.status === 200 && Boolean(one.body?.data));

  const upd = await put(`/savings/${UID}/${id}`, { currentAmount: 60000 });
  ok('PUT /savings updates saved amount', upd.status === 200 && num(upd.body?.data?.current_amount) === 60000);

  const over = await put(`/savings/${UID}/${id}`, { currentAmount: 500000 });
  ok(
    'over-saving clamped to target (DB invariant respected)',
    over.status === 200 && num(over.body?.data?.current_amount) === 100000,
    `got ${over.body?.data?.current_amount}`,
  );

  const paused = await put(`/savings/${UID}/${id}`, { status: 'PAUSED' });
  ok('goal status can be changed to PAUSED', paused.body?.data?.status === 'PAUSED');

  const badStatus = await put(`/savings/${UID}/${id}`, { status: 'NONSENSE' });
  ok('invalid goal status falls back to a legal value', ['ACTIVE', 'COMPLETED', 'PAUSED'].includes(badStatus.body?.data?.status));

  const removed = await del(`/savings/${UID}/${id}`);
  ok('DELETE /savings removes the row', removed.status === 200);
}

/* ==========================================================================
   DEBTS
   ========================================================================== */

section('7. Debts (CRUD + real column mapping)');

{
  const created = await post(`/debts/${UID}`, {
    debtName: 'Integration Loan',
    lender: 'Test Bank',
    principalAmount: 200000,
    remainingAmount: 150000,
    interestRate: 11.5,
    minimumPayment: 5000,
    dueDate: '2027-03-31',
    debtStatus: 'ACTIVE',
  });

  const debt = created.body?.data;
  ok('POST /debts creates a row', created.status === 201 && Boolean(debt?.debt_id));
  ok('principal_amount stored (not total_amount)', num(debt?.principal_amount) === 200000, `got ${debt?.principal_amount}`);
  ok('lender stored', debt?.lender === 'Test Bank');
  ok('debt_status stored', debt?.debt_status === 'ACTIVE');

  const id = debt?.debt_id;

  const one = await get(`/debts/${UID}/${id}`);
  ok('GET /debts/:userId/:id', one.status === 200);

  const upd = await put(`/debts/${UID}/${id}`, { remainingAmount: 120000 });
  ok('PUT /debts updates remaining amount', num(upd.body?.data?.remaining_amount) === 120000);

  const overpay = await put(`/debts/${UID}/${id}`, { remainingAmount: 999999 });
  ok(
    'remaining clamped to principal (DB check respected)',
    num(overpay.body?.data?.remaining_amount) === 200000,
    `got ${overpay.body?.data?.remaining_amount}`,
  );

  const paid = await put(`/debts/${UID}/${id}`, { debtStatus: 'PAID' });
  ok('debt can be marked PAID', paid.body?.data?.debt_status === 'PAID');

  const removed = await del(`/debts/${UID}/${id}`);
  ok('DELETE /debts removes the row', removed.status === 200);
}

/* ==========================================================================
   RECURRING
   ========================================================================== */

section('8. Recurring transactions (CRUD + start_date)');

{
  const created = await post(`/recurring/${UID}`, {
    accountId,
    categoryId,
    amount: 1299,
    transactionType: 'EXPENSE',
    frequency: 'MONTHLY',
    description: 'Integration subscription',
    nextRunDate: '2026-11-05',
  });

  const rec = created.body?.data;
  ok('POST /recurring creates a row', created.status === 201 && Boolean(rec?.recurring_id), JSON.stringify(created.body).slice(0, 200));
  ok('start_date auto-filled (NOT NULL satisfied)', Boolean(rec?.start_date));

  const id = rec?.recurring_id;

  const one = await get(`/recurring/${UID}/${id}`);
  ok('GET /recurring/:userId/:id', one.status === 200);

  const upd = await put(`/recurring/${UID}/${id}`, { amount: 1599, isActive: false });
  ok('PUT /recurring updates amount + active flag', num(upd.body?.data?.amount) === 1599 && upd.body?.data?.is_active === false);

  const badFreq = await put(`/recurring/${UID}/${id}`, { frequency: 'FORTNIGHTLY' });
  ok('invalid frequency falls back to MONTHLY', badFreq.body?.data?.frequency === 'MONTHLY');

  const overview = await get(`/recurring/${UID}/overview`);
  ok('recurring overview metrics present', Boolean(overview.body?.data?.metrics));

  const removed = await del(`/recurring/${UID}/${id}`);
  ok('DELETE /recurring removes the row', removed.status === 200);
}

/* ==========================================================================
   CATEGORIES
   ========================================================================== */

section('9. Categories (CRUD + user ownership)');

{
  const created = await post('/categories', {
    userId: UID,
    categoryName: 'Integration Category',
    categoryType: 'EXPENSE',
    description: 'created by tests',
  });

  const cat = created.body?.data;
  ok('POST /categories creates a row', created.status === 201 && Boolean(cat?.category_id));
  ok('category owned by user (user_id set)', Number(cat?.user_id) === UID, `got ${cat?.user_id}`);

  const id = cat?.category_id;

  const upd = await put(`/categories/${id}`, { categoryName: 'Integration Category 2' });
  ok('PUT /categories updates the row', upd.body?.data?.category_name === 'Integration Category 2');

  const removed = await del(`/categories/${id}`);
  ok('DELETE /categories removes the row', removed.status === 200);

  const missing = await post('/categories', { categoryName: '' });
  ok('empty category name rejected → 400', missing.status === 400);
}

/* ==========================================================================
   PROFILE
   ========================================================================== */

section('10. Profile updates');

{
  const before = await get(`/users/${UID}`);
  const originalName = before.body?.data?.full_name;

  const upd = await put(`/users/${UID}`, { fullName: 'Integration Test User' });
  ok('PUT /users updates full name', upd.status === 200 && upd.body?.data?.full_name === 'Integration Test User');

  const restore = await put(`/users/${UID}`, { fullName: originalName });
  ok('profile restored', restore.body?.data?.full_name === originalName);
}

/* ==========================================================================
   ERROR HANDLING
   ========================================================================== */

section('11. Error handling & 404s');

{
  const notFound = await get('/does-not-exist');
  ok('unknown route → 404 JSON', notFound.status === 404 && notFound.body?.success === false);

  const noUser = await get('/accounts/999999');
  ok('unknown user returns empty list, not a crash', noUser.status === 200 && Array.isArray(noUser.body?.data));

  const badId = await get(`/transactions/${UID}/999999`);
  ok('unknown transaction → 404', badId.status === 404);
}

/* ==========================================================================
   SUMMARY
   ========================================================================== */

console.log(
  `\n${fail === 0 ? '\u001b[32m' : '\u001b[31m'}===== RESULT: ${pass} passed, ${fail} failed =====\u001b[0m`,
);

if (fail > 0) {
  console.log('\nFailed checks:');
  failures.forEach((f) => console.log(' - ' + f));
  process.exit(1);
}
