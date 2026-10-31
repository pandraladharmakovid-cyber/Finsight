import { pool } from '../config/database.js';

const TABLES = Object.freeze({
  users: 'finance.users',
  accounts: 'finance.accounts',
  categories: 'finance.categories',
  transactions: 'finance.transactions',
  budgets: 'finance.budgets',
  savingsGoals: 'finance.savings_goals',
  debts: 'finance.debts',
  recurringTransactions: 'finance.recurring_transactions',
  auditLog: 'finance.audit_log',
});

const VIEWS = Object.freeze({
  accountBalances: 'finance.account_balances',
  budgetPerformance: 'finance.budget_performance',
  categorySpending: 'finance.category_spending',
  debtSummary: 'finance.debt_summary',
  monthlyExpenseAnalysis: 'finance.monthly_expense_analysis',
  savingsProgress: 'finance.savings_progress',
  userFinancialSummary: 'finance.user_financial_summary',
});

export const ACCOUNT_TYPES = Object.freeze([
  'BANK',
  'CASH',
  'CREDIT_CARD',
  'WALLET',
  'INVESTMENT',
]);

const ACCOUNT_TYPE_ALIASES = Object.freeze({
  CHECKING: 'BANK',
  SAVINGS: 'BANK',
  SAVING: 'BANK',
  CURRENT: 'BANK',
  BANK: 'BANK',
  CASH: 'CASH',
  CREDIT: 'CREDIT_CARD',
  CREDITCARD: 'CREDIT_CARD',
  CREDIT_CARD: 'CREDIT_CARD',
  CARD: 'CREDIT_CARD',
  WALLET: 'WALLET',
  UPI: 'WALLET',
  INVESTMENT: 'INVESTMENT',
  INVEST: 'INVESTMENT',
  STOCKS: 'INVESTMENT',
});

export function normalizeAccountType(value) {
  const key = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  return ACCOUNT_TYPE_ALIASES[key] ?? 'BANK';
}

export function readBoolean(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    const normalised = String(value).trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalised)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalised)) {
      return false;
    }
  }

  return undefined;
}

export async function query(text, values = []) {
  return pool.query(text, values);
}

export async function queryRows(text, values = []) {
  const result = await query(text, values);
  return result.rows;
}

export async function queryOne(text, values = []) {
  const result = await query(text, values);
  return result.rows[0] ?? null;
}

/* ============================================================
   USERS
   ============================================================ */

export async function getUserById(userId) {
  return queryOne(
    `SELECT * FROM ${TABLES.users} WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
}

export async function getUserByEmail(email) {
  return queryOne(
    `SELECT * FROM ${TABLES.users} WHERE email = $1 LIMIT 1`,
    [email],
  );
}

export async function getUsers() {
  return queryRows(`SELECT * FROM ${TABLES.users} ORDER BY user_id`);
}

export async function updateUser(userId, data) {
  return queryOne(
    `
      UPDATE ${TABLES.users}
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          monthly_income = COALESCE($4, monthly_income)
      WHERE user_id = $5
      RETURNING *
    `,
    [
      data.full_name ?? data.fullName ?? data.name ?? null,
      data.email ?? null,
      data.phone ?? null,
      data.monthly_income !== undefined
        ? Math.max(0, Number(data.monthly_income) || 0)
        : data.monthlyIncome !== undefined
          ? Math.max(0, Number(data.monthlyIncome) || 0)
          : null,
      userId,
    ],
  );
}

/* ============================================================
   ACCOUNTS (READ + WRITE)
   ============================================================ */

export async function getAccountsByUserId(userId) {
  return queryRows(
    `SELECT * FROM ${TABLES.accounts} WHERE user_id = $1 ORDER BY account_id`,
    [userId],
  );
}

export async function getAccountById(accountId, userId = null) {
  if (userId === null || userId === undefined) {
    return queryOne(
      `SELECT * FROM ${TABLES.accounts} WHERE account_id = $1 LIMIT 1`,
      [accountId],
    );
  }
  return queryOne(
    `SELECT * FROM ${TABLES.accounts} WHERE account_id = $1 AND user_id = $2 LIMIT 1`,
    [accountId, userId],
  );
}

export async function getActiveAccountsByUserId(userId) {
  return queryRows(
    `SELECT * FROM ${TABLES.accounts} WHERE user_id = $1 AND is_active = TRUE ORDER BY account_id`,
    [userId],
  );
}

export async function createAccount(userId, data) {
  const {
    account_name,
    accountName,
    account_type,
    accountType,
    balance = 0,
    currency = 'INR',
    is_active = true,
  } = data;

  return queryOne(
    `
      INSERT INTO ${TABLES.accounts}
        (user_id, account_name, account_type, balance, currency, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      userId,
      account_name ?? accountName ?? 'New Account',
      normalizeAccountType(account_type ?? accountType),
      Number(balance) || 0,
      currency,
      readBoolean(is_active, data.isActive) ?? true,
    ],
  );
}

export async function updateAccount(accountId, userId, data) {
  const existing = await getAccountById(accountId, userId);
  if (!existing) return null;

  const name = data.account_name ?? data.accountName ?? existing.account_name;
  const type = data.account_type ?? data.accountType ?? existing.account_type;
  const balance = data.balance !== undefined ? Number(data.balance) : Number(existing.balance);
  const currency = data.currency ?? existing.currency ?? 'INR';
  const isActive =
    readBoolean(data.is_active, data.isActive, data.active) ?? existing.is_active;

  return queryOne(
    `
      UPDATE ${TABLES.accounts}
      SET account_name = $1,
          account_type = $2,
          balance = $3,
          currency = $4,
          is_active = $5
      WHERE account_id = $6 AND user_id = $7
      RETURNING *
    `,
    [name, type, balance, currency, isActive, accountId, userId],
  );
}

export async function deleteAccount(accountId, userId) {
  return queryOne(
    `DELETE FROM ${TABLES.accounts} WHERE account_id = $1 AND user_id = $2 RETURNING *`,
    [accountId, userId],
  );
}

/* ============================================================
   CATEGORIES (READ + WRITE)
   ============================================================ */

export async function getCategories() {
  return queryRows(`SELECT * FROM ${TABLES.categories} ORDER BY category_id`);
}

export async function getCategoriesByType(categoryType) {
  return queryRows(
    `SELECT * FROM ${TABLES.categories} WHERE category_type = $1 ORDER BY category_id`,
    [categoryType],
  );
}

export async function createCategory(data, userId = null) {
  const name = String(
    data.category_name ?? data.categoryName ?? data.name ?? '',
  ).trim();

  const type = String(
    data.category_type ?? data.categoryType ?? data.type ?? 'EXPENSE',
  ).toUpperCase();

  if (!name) {
    const error = new Error('Category name is required.');
    error.statusCode = 400;
    throw error;
  }

  const owner =
    Number(userId ?? data.user_id ?? data.userId) || 1;

  return queryOne(
    `
      INSERT INTO ${TABLES.categories} (user_id, category_name, category_type, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [
      owner,
      name,
      type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      data.description ?? null,
    ],
  );
}

export async function deleteCategory(categoryId) {
  return queryOne(
    `DELETE FROM ${TABLES.categories} WHERE category_id = $1 RETURNING *`,
    [categoryId],
  );
}

/* ============================================================
   TRANSACTIONS (READ + WRITE WITH BALANCE SYNC)
   ============================================================ */

export async function getTransactionsByUserId(
  userId,
  {
    limit = 50,
    offset = 0,
    accountId = null,
    categoryId = null,
    transactionType = null,
    startDate = null,
    endDate = null,
  } = {},
) {
  const values = [userId];
  const conditions = ['a.user_id = $1'];

  if (accountId !== null && accountId !== undefined && accountId !== '') {
    values.push(accountId);
    conditions.push(`t.account_id = $${values.length}`);
  }
  if (categoryId !== null && categoryId !== undefined && categoryId !== '') {
    values.push(categoryId);
    conditions.push(`t.category_id = $${values.length}`);
  }
  if (transactionType !== null && transactionType !== undefined && transactionType !== '') {
    values.push(transactionType);
    conditions.push(`t.transaction_type = $${values.length}`);
  }
  if (startDate !== null && startDate !== undefined && startDate !== '') {
    values.push(startDate);
    conditions.push(`t.transaction_date >= $${values.length}`);
  }
  if (endDate !== null && endDate !== undefined && endDate !== '') {
    values.push(endDate);
    conditions.push(`t.transaction_date <= $${values.length}`);
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500));
  const safeOffset = Math.max(0, Number(offset) || 0);

  values.push(safeLimit);
  const limitParameter = `$${values.length}`;

  values.push(safeOffset);
  const offsetParameter = `$${values.length}`;

  return queryRows(
    `
      SELECT
        t.*,
        a.account_name,
        a.account_type,
        c.category_name,
        c.category_type
      FROM ${TABLES.transactions} t
      INNER JOIN ${TABLES.accounts} a
        ON a.account_id = t.account_id
      LEFT JOIN ${TABLES.categories} c
        ON c.category_id = t.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.transaction_date DESC, t.transaction_id DESC
      LIMIT ${limitParameter}
      OFFSET ${offsetParameter}
    `,
    values,
  );
}

export async function getTransactionById(transactionId, userId = null) {
  const values = [transactionId];
  const conditions = ['t.transaction_id = $1'];

  if (userId !== null && userId !== undefined) {
    values.push(userId);
    conditions.push(`a.user_id = $${values.length}`);
  }

  return queryOne(
    `
      SELECT
        t.*,
        a.account_name,
        a.account_type,
        c.category_name,
        c.category_type
      FROM ${TABLES.transactions} t
      INNER JOIN ${TABLES.accounts} a
        ON a.account_id = t.account_id
      LEFT JOIN ${TABLES.categories} c
        ON c.category_id = t.category_id
      WHERE ${conditions.join(' AND ')}
      LIMIT 1
    `,
    values,
  );
}

export async function getRecentTransactionsByUserId(userId, limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));

  return queryRows(
    `
      SELECT
        t.*,
        a.account_name,
        a.account_type,
        c.category_name,
        c.category_type
      FROM ${TABLES.transactions} t
      INNER JOIN ${TABLES.accounts} a
        ON a.account_id = t.account_id
      LEFT JOIN ${TABLES.categories} c
        ON c.category_id = t.category_id
      WHERE a.user_id = $1
      ORDER BY t.transaction_date DESC, t.transaction_id DESC
      LIMIT $2
    `,
    [userId, safeLimit],
  );
}

export async function getTransactionCountByUserId(userId) {
  const row = await queryOne(
    `
      SELECT COUNT(*)::integer AS count
      FROM ${TABLES.transactions} t
      INNER JOIN ${TABLES.accounts} a
        ON a.account_id = t.account_id
      WHERE a.user_id = $1
    `,
    [userId],
  );
  return row?.count ?? 0;
}

export async function createTransaction(userId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Resolve account_id (by ID, by account name, or fallback to user's first account)
    let accountId = Number(data.account_id ?? data.accountId) || null;
    const accountNameInput = data.account_name ?? data.accountName ?? data.account;

    if (!accountId && accountNameInput) {
      const accByName = await client.query(
        `SELECT account_id FROM ${TABLES.accounts} WHERE user_id = $1 AND LOWER(account_name) = LOWER($2) LIMIT 1`,
        [userId, String(accountNameInput).trim()],
      );
      accountId = accByName.rows[0]?.account_id ?? null;
    }

    if (!accountId) {
      const firstAcc = await client.query(
        `SELECT account_id FROM ${TABLES.accounts} WHERE user_id = $1 ORDER BY account_id LIMIT 1`,
        [userId],
      );
      accountId = firstAcc.rows[0]?.account_id ?? null;
    }

    // Verify the account really belongs to this user (fail fast, cleanly).
    if (accountId) {
      const owned = await client.query(
        `SELECT account_id FROM ${TABLES.accounts}
         WHERE account_id = $1 AND user_id = $2 LIMIT 1`,
        [accountId, userId],
      );

      if (!owned.rows[0]) {
        const error = new Error(
          `Account ${accountId} does not belong to user ${userId}.`,
        );
        error.statusCode = 400;
        throw error;
      }
    }

    if (!accountId) {
      const newAcc = await client.query(
        `INSERT INTO ${TABLES.accounts} (user_id, account_name, account_type, balance, currency, is_active)
         VALUES ($1, $2, 'BANK', 0, 'INR', TRUE) RETURNING account_id`,
        [userId, accountNameInput || 'Primary Account'],
      );
      accountId = newAcc.rows[0].account_id;
    }

    const rawType = String(data.transaction_type ?? data.transactionType ?? data.type ?? 'EXPENSE').toUpperCase();

    // 2. Resolve category_id (by ID, by category name, or auto-create category if new)
    let categoryId = Number(data.category_id ?? data.categoryId) || null;
    const categoryNameInput = data.category_name ?? data.categoryName ?? data.category;

    if (!categoryId && categoryNameInput) {
      const catByName = await client.query(
        `SELECT category_id FROM ${TABLES.categories} WHERE LOWER(category_name) = LOWER($1) LIMIT 1`,
        [String(categoryNameInput).trim()],
      );
      if (catByName.rows[0]) {
        categoryId = catByName.rows[0].category_id;
      } else {
        const newCat = await client.query(
          `INSERT INTO ${TABLES.categories} (user_id, category_name, category_type)
           VALUES ($1, $2, $3) RETURNING category_id`,
          [userId, String(categoryNameInput).trim(), rawType === 'INCOME' ? 'INCOME' : 'EXPENSE'],
        );
        categoryId = newCat.rows[0]?.category_id ?? null;
      }
    }

    // transactions.category_id is NOT NULL — fall back to a sensible category
    if (!categoryId) {
      const fallbackType = rawType === 'INCOME' ? 'INCOME' : 'EXPENSE';

      const fallback = await client.query(
        `SELECT category_id FROM ${TABLES.categories}
         WHERE user_id = $1 AND category_type = $2
         ORDER BY category_id LIMIT 1`,
        [userId, fallbackType],
      );

      if (fallback.rows[0]) {
        categoryId = fallback.rows[0].category_id;
      } else {
        const created = await client.query(
          `INSERT INTO ${TABLES.categories} (user_id, category_name, category_type)
           VALUES ($1, $2, $3) RETURNING category_id`,
          [userId, rawType === 'INCOME' ? 'General Income' : 'General Expense', fallbackType],
        );
        categoryId = created.rows[0].category_id;
      }
    }

    const amount = Math.abs(Number(data.amount) || 0);

    if (!(amount > 0)) {
      const error = new Error('Amount must be greater than zero.');
      error.statusCode = 400;
      throw error;
    }

    const description = data.description ?? data.merchant ?? data.notes ?? 'Transaction';
    const txDate =
      data.transaction_date ??
      data.transactionDate ??
      data.date ??
      new Date().toISOString().split('T')[0];

    const insertResult = await client.query(
      `
        INSERT INTO ${TABLES.transactions}
          (account_id, category_id, amount, transaction_type, description, transaction_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [accountId, categoryId, amount, rawType, description, txDate],
    );

    const created = insertResult.rows[0];

    /*
     * Account balances are maintained by the database trigger
     * `trg_update_account_balance`. Mutating the balance here as well
     * double-counted every transaction, so it is intentionally omitted.
     */
    await client.query('COMMIT');
    return await getTransactionById(created.transaction_id, userId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateTransaction(transactionId, userId, data) {
  const existing = await getTransactionById(transactionId, userId);
  if (!existing) return null;

  let accountId = Number(data.account_id ?? data.accountId) || null;
  const accountNameInput = data.account_name ?? data.accountName ?? data.account;
  if (!accountId && accountNameInput) {
    const acc = await queryOne(
      `SELECT account_id FROM ${TABLES.accounts} WHERE user_id = $1 AND LOWER(account_name) = LOWER($2) LIMIT 1`,
      [userId, String(accountNameInput).trim()],
    );
    accountId = acc?.account_id;
  }
  accountId = accountId || existing.account_id;

  const rawType = String(
    data.transaction_type ?? data.transactionType ?? data.type ?? existing.transaction_type,
  ).toUpperCase();

  let categoryId = Number(data.category_id ?? data.categoryId) || null;
  const categoryNameInput = data.category_name ?? data.categoryName ?? data.category;
  if (!categoryId && categoryNameInput) {
    const cat = await queryOne(
      `SELECT category_id FROM ${TABLES.categories} WHERE LOWER(category_name) = LOWER($1) LIMIT 1`,
      [String(categoryNameInput).trim()],
    );
    categoryId = cat?.category_id;
  }
  categoryId = categoryId || existing.category_id;

  const amount =
    data.amount !== undefined ? Math.abs(Number(data.amount)) : Number(existing.amount);
  const description = data.description ?? existing.description;
  const txDate =
    data.transaction_date ?? data.transactionDate ?? data.date ?? existing.transaction_date;

  await queryOne(
    `
      UPDATE ${TABLES.transactions}
      SET account_id = $1,
          category_id = $2,
          amount = $3,
          transaction_type = $4,
          description = $5,
          transaction_date = $6
      WHERE transaction_id = $7
      RETURNING *
    `,
    [accountId, categoryId, amount, rawType, description, txDate, transactionId],
  );

  return getTransactionById(transactionId, userId);
}

export async function deleteTransaction(transactionId, userId) {
  const existing = await getTransactionById(transactionId, userId);
  if (!existing) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM ${TABLES.transactions} WHERE transaction_id = $1`,
      [transactionId],
    );

    // Balances are restored by the database trigger on DELETE.
    await client.query('COMMIT');
    return existing;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* ============================================================
   BUDGETS (READ + WRITE)
   ============================================================ */

export async function getBudgetsByUserId(userId) {
  return queryRows(
    `
      SELECT b.*, c.category_name, c.category_type
      FROM ${TABLES.budgets} b
      LEFT JOIN ${TABLES.categories} c ON c.category_id = b.category_id
      WHERE b.user_id = $1
      ORDER BY b.budget_id
    `,
    [userId],
  );
}

export async function getBudgetById(budgetId, userId = null) {
  const values = [budgetId];
  const conditions = ['budget_id = $1'];

  if (userId !== null && userId !== undefined) {
    values.push(userId);
    conditions.push(`user_id = $${values.length}`);
  }

  return queryOne(
    `SELECT * FROM ${TABLES.budgets} WHERE ${conditions.join(' AND ')} LIMIT 1`,
    values,
  );
}

export async function createBudget(userId, data) {
  let categoryId = Number(data.category_id ?? data.categoryId) || null;
  const categoryNameInput = data.category_name ?? data.categoryName ?? data.category;

  if (!categoryId && categoryNameInput) {
    const cat = await queryOne(
      `SELECT category_id FROM ${TABLES.categories} WHERE LOWER(category_name) = LOWER($1) LIMIT 1`,
      [String(categoryNameInput).trim()],
    );
    if (cat) {
      categoryId = cat.category_id;
    } else {
      const createdCat = await queryOne(
        `INSERT INTO ${TABLES.categories} (user_id, category_name, category_type)
         VALUES ($1, $2, 'EXPENSE') RETURNING category_id`,
        [userId, String(categoryNameInput).trim()],
      );
      categoryId = createdCat?.category_id ?? null;
    }
  }

  const amountLimit = Math.abs(
    Number(
      data.budget_amount ??
        data.budgetAmount ??
        data.amount_limit ??
        data.amountLimit ??
        data.amount ??
        0,
    ) || 0,
  );

  if (!(amountLimit > 0)) {
    const error = new Error('Budget amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }
  const startDate = data.start_date ?? data.startDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const endDate = data.end_date ?? data.endDate ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

  return queryOne(
    `
      INSERT INTO ${TABLES.budgets}
        (user_id, category_id, budget_amount, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [userId, categoryId, amountLimit, startDate, endDate],
  );
}

export async function updateBudget(budgetId, userId, data) {
  const existing = await getBudgetById(budgetId, userId);
  if (!existing) return null;

  const categoryId = data.category_id ?? data.categoryId ?? existing.category_id;
  const amountLimit =
    data.budget_amount ??
    data.budgetAmount ??
    data.amount_limit ??
    data.amountLimit ??
    data.amount ??
    existing.budget_amount;
  const startDate = data.start_date ?? data.startDate ?? existing.start_date;
  const endDate = data.end_date ?? data.endDate ?? existing.end_date;

  return queryOne(
    `
      UPDATE ${TABLES.budgets}
      SET category_id = $1,
          budget_amount = $2,
          start_date = $3,
          end_date = $4
      WHERE budget_id = $5 AND user_id = $6
      RETURNING *
    `,
    [categoryId, Number(amountLimit), startDate, endDate, budgetId, userId],
  );
}

export async function deleteBudget(budgetId, userId) {
  return queryOne(
    `DELETE FROM ${TABLES.budgets} WHERE budget_id = $1 AND user_id = $2 RETURNING *`,
    [budgetId, userId],
  );
}

/* ============================================================
   SAVINGS GOALS (READ + WRITE)
   ============================================================ */

export async function getSavingsGoalsByUserId(userId) {
  return queryRows(
    `SELECT * FROM ${TABLES.savingsGoals} WHERE user_id = $1 ORDER BY goal_id`,
    [userId],
  );
}

export async function getSavingsGoalById(goalId, userId = null) {
  const values = [goalId];
  const conditions = ['goal_id = $1'];

  if (userId !== null && userId !== undefined) {
    values.push(userId);
    conditions.push(`user_id = $${values.length}`);
  }

  return queryOne(
    `SELECT * FROM ${TABLES.savingsGoals} WHERE ${conditions.join(' AND ')} LIMIT 1`,
    values,
  );
}

export async function createSavingsGoal(userId, data) {
  const goalName = String(
    data.goal_name ?? data.goalName ?? data.name ?? '',
  ).trim();

  if (!goalName) {
    const error = new Error('Goal name is required.');
    error.statusCode = 400;
    throw error;
  }

  const targetAmount = Math.abs(
    Number(data.target_amount ?? data.targetAmount ?? data.amount ?? 0),
  );

  if (!(targetAmount > 0)) {
    const error = new Error('Target amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }

  // DB invariant: current_amount <= target_amount
  const currentAmount = Math.min(
    Math.abs(Number(data.current_amount ?? data.currentAmount ?? 0) || 0),
    targetAmount,
  );

  const targetDate = data.target_date ?? data.targetDate ?? data.deadline ?? null;

  const rawStatus = String(
    data.status ?? data.goal_status ?? 'ACTIVE',
  ).toUpperCase();

  const status = ['ACTIVE', 'COMPLETED', 'PAUSED'].includes(rawStatus)
    ? rawStatus
    : 'ACTIVE';

  return queryOne(
    `
      INSERT INTO ${TABLES.savingsGoals}
        (user_id, goal_name, target_amount, current_amount, target_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [userId, goalName, targetAmount, currentAmount, targetDate, status],
  );
}

export async function updateSavingsGoal(goalId, userId, data) {
  const existing = await getSavingsGoalById(goalId, userId);
  if (!existing) return null;

  const goalName =
    data.goal_name ?? data.goalName ?? data.name ?? existing.goal_name;

  const targetAmount = Math.abs(
    Number(
      data.target_amount ?? data.targetAmount ?? existing.target_amount,
    ),
  );

  let currentAmount = Math.abs(
    Number(
      data.current_amount ?? data.currentAmount ?? existing.current_amount,
    ),
  );

  currentAmount = Math.min(currentAmount, targetAmount);

  const targetDate =
    data.target_date ?? data.targetDate ?? existing.target_date;

  const rawStatus = String(
    data.status ?? data.goal_status ?? existing.status ?? 'ACTIVE',
  ).toUpperCase();

  const status = ['ACTIVE', 'COMPLETED', 'PAUSED'].includes(rawStatus)
    ? rawStatus
    : 'ACTIVE';

  return queryOne(
    `
      UPDATE ${TABLES.savingsGoals}
      SET goal_name = $1,
          target_amount = $2,
          current_amount = $3,
          target_date = $4,
          status = $5
      WHERE goal_id = $6 AND user_id = $7
      RETURNING *
    `,
    [goalName, targetAmount, currentAmount, targetDate, status, goalId, userId],
  );
}

export async function deleteSavingsGoal(goalId, userId) {
  return queryOne(
    `DELETE FROM ${TABLES.savingsGoals} WHERE goal_id = $1 AND user_id = $2 RETURNING *`,
    [goalId, userId],
  );
}

/* ============================================================
   DEBTS (READ + WRITE)
   ============================================================ */

export async function getDebtsByUserId(userId) {
  return queryRows(
    `SELECT * FROM ${TABLES.debts} WHERE user_id = $1 ORDER BY debt_id`,
    [userId],
  );
}

export async function getDebtById(debtId, userId = null) {
  const values = [debtId];
  const conditions = ['debt_id = $1'];

  if (userId !== null && userId !== undefined) {
    values.push(userId);
    conditions.push(`user_id = $${values.length}`);
  }

  return queryOne(
    `SELECT * FROM ${TABLES.debts} WHERE ${conditions.join(' AND ')} LIMIT 1`,
    values,
  );
}

export async function createDebt(userId, data) {
  const debtName = String(
    data.debt_name ?? data.debtName ?? data.name ?? '',
  ).trim();

  if (!debtName) {
    const error = new Error('Debt name is required.');
    error.statusCode = 400;
    throw error;
  }

  const principalAmount = Math.abs(
    Number(
      data.principal_amount ??
        data.principalAmount ??
        data.total_amount ??
        data.totalAmount ??
        data.remaining_amount ??
        data.remainingAmount ??
        data.remaining_balance ??
        0,
    ),
  );

  if (!(principalAmount > 0)) {
    const error = new Error('Principal amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }

  let remainingAmount = Math.abs(
    Number(
      data.remaining_amount ??
        data.remainingAmount ??
        data.remaining_balance ??
        principalAmount,
    ),
  );

  // DB invariant: remaining_amount <= principal_amount
  remainingAmount = Math.min(remainingAmount, principalAmount);

  const interestRate = Math.max(
    0,
    Number(data.interest_rate ?? data.interestRate ?? 0) || 0,
  );

  const minimumPayment = Math.max(
    0,
    Number(data.minimum_payment ?? data.minimumPayment ?? 0) || 0,
  );

  const dueDate = data.due_date ?? data.dueDate ?? null;

  const status = ['ACTIVE', 'PAID', 'OVERDUE'].includes(
    String(data.debt_status ?? data.debtStatus ?? data.status ?? 'ACTIVE').toUpperCase(),
  )
    ? String(data.debt_status ?? data.debtStatus ?? data.status ?? 'ACTIVE').toUpperCase()
    : 'ACTIVE';

  return queryOne(
    `
      INSERT INTO ${TABLES.debts}
        (user_id, debt_name, lender, principal_amount, remaining_amount,
         interest_rate, minimum_payment, due_date, debt_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      userId,
      debtName,
      data.lender ?? data.lender_name ?? data.bank ?? 'Unknown Lender',
      principalAmount,
      remainingAmount,
      interestRate,
      minimumPayment,
      dueDate,
      status,
    ],
  );
}

export async function updateDebt(debtId, userId, data) {
  const existing = await getDebtById(debtId, userId);
  if (!existing) return null;

  const debtName =
    data.debt_name ?? data.debtName ?? data.name ?? existing.debt_name;

  const lender = data.lender ?? data.lender_name ?? existing.lender;

  const principalAmount = Math.abs(
    Number(
      data.principal_amount ??
        data.principalAmount ??
        data.total_amount ??
        data.totalAmount ??
        existing.principal_amount,
    ),
  );

  let remainingAmount = Math.abs(
    Number(
      data.remaining_amount ??
        data.remainingAmount ??
        existing.remaining_amount,
    ),
  );

  remainingAmount = Math.min(remainingAmount, principalAmount);

  const interestRate = Math.max(
    0,
    Number(data.interest_rate ?? data.interestRate ?? existing.interest_rate) || 0,
  );

  const minimumPayment = Math.max(
    0,
    Number(
      data.minimum_payment ??
        data.minimumPayment ??
        existing.minimum_payment,
    ) || 0,
  );

  const dueDate = data.due_date ?? data.dueDate ?? existing.due_date;

  const rawStatus = String(
    data.debt_status ?? data.debtStatus ?? data.status ?? existing.debt_status ?? 'ACTIVE',
  ).toUpperCase();

  const status = ['ACTIVE', 'PAID', 'OVERDUE'].includes(rawStatus)
    ? rawStatus
    : 'ACTIVE';

  return queryOne(
    `
      UPDATE ${TABLES.debts}
      SET debt_name = $1,
          lender = $2,
          principal_amount = $3,
          remaining_amount = $4,
          interest_rate = $5,
          minimum_payment = $6,
          due_date = $7,
          debt_status = $8
      WHERE debt_id = $9 AND user_id = $10
      RETURNING *
    `,
    [
      debtName,
      lender,
      principalAmount,
      remainingAmount,
      interestRate,
      minimumPayment,
      dueDate,
      status,
      debtId,
      userId,
    ],
  );
}

export async function deleteDebt(debtId, userId) {
  return queryOne(
    `DELETE FROM ${TABLES.debts} WHERE debt_id = $1 AND user_id = $2 RETURNING *`,
    [debtId, userId],
  );
}

/* ============================================================
   RECURRING TRANSACTIONS (READ + WRITE)
   ============================================================ */

export async function getRecurringTransactionsByUserId(userId) {
  return queryRows(
    `SELECT * FROM ${TABLES.recurringTransactions} WHERE user_id = $1 ORDER BY next_run_date ASC, recurring_id ASC`,
    [userId],
  );
}

export async function getRecurringTransactionById(recurringId, userId = null) {
  const values = [recurringId];
  const conditions = ['recurring_id = $1'];

  if (userId !== null && userId !== undefined) {
    values.push(userId);
    conditions.push(`user_id = $${values.length}`);
  }

  return queryOne(
    `SELECT * FROM ${TABLES.recurringTransactions} WHERE ${conditions.join(' AND ')} LIMIT 1`,
    values,
  );
}

export async function getUpcomingRecurringTransactions(userId, limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));

  return queryRows(
    `
      SELECT *
      FROM ${TABLES.recurringTransactions}
      WHERE user_id = $1
        AND is_active = TRUE
        AND next_run_date IS NOT NULL
      ORDER BY next_run_date ASC, recurring_id ASC
      LIMIT $2
    `,
    [userId, safeLimit],
  );
}

export async function createRecurringTransaction(userId, data) {
  const accountId = Number(data.account_id ?? data.accountId) || null;
  const categoryId = Number(data.category_id ?? data.categoryId) || null;

  if (!accountId) {
    const error = new Error('accountId is required.');
    error.statusCode = 400;
    throw error;
  }

  const ownedAccount = await queryOne(
    `SELECT account_id FROM ${TABLES.accounts}
     WHERE account_id = $1 AND user_id = $2 LIMIT 1`,
    [accountId, userId],
  );

  if (!ownedAccount) {
    const error = new Error(
      `Account ${accountId} does not belong to user ${userId}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const amount = Math.abs(Number(data.amount) || 0);

  if (!(amount > 0)) {
    const error = new Error('Amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }

  const rawType = String(
    data.transaction_type ?? data.transactionType ?? data.type ?? 'EXPENSE',
  ).toUpperCase();

  const transactionType = rawType === 'INCOME' ? 'INCOME' : 'EXPENSE';

  const description = data.description ?? data.name ?? '';

  const rawFrequency = String(data.frequency ?? 'MONTHLY').toUpperCase();

  const frequency = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(rawFrequency)
    ? rawFrequency
    : 'MONTHLY';

  const today = new Date().toISOString().split('T')[0];

  const startDate = data.start_date ?? data.startDate ?? today;

  const nextRunDate =
    data.next_run_date ?? data.nextRunDate ?? startDate ?? today;

  let endDate = data.end_date ?? data.endDate ?? null;

  // DB invariant: end_date >= start_date
  if (endDate && String(endDate) < String(startDate)) {
    endDate = startDate;
  }

  const isActive =
    readBoolean(data.is_active, data.isActive, data.active) ?? true;

  // Category is optional on this table, but resolve one when possible.
  let resolvedCategory = categoryId;

  if (!resolvedCategory) {
    const fallback = await queryOne(
      `SELECT category_id FROM ${TABLES.categories}
       WHERE user_id = $1 AND category_type = $2
       ORDER BY category_id LIMIT 1`,
      [userId, transactionType],
    );
    resolvedCategory = fallback?.category_id ?? null;
  }

  return queryOne(
    `
      INSERT INTO ${TABLES.recurringTransactions}
        (user_id, account_id, category_id, amount, transaction_type,
         frequency, description, start_date, end_date, next_run_date, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
    [
      userId,
      accountId,
      resolvedCategory,
      amount,
      transactionType,
      frequency,
      description,
      startDate,
      endDate,
      nextRunDate,
      isActive,
    ],
  );
}

export async function updateRecurringTransaction(recurringId, userId, data) {
  const existing = await getRecurringTransactionById(recurringId, userId);
  if (!existing) return null;

  const accountId =
    Number(data.account_id ?? data.accountId) || existing.account_id;

  const categoryId =
    Number(data.category_id ?? data.categoryId) || existing.category_id;

  const amount = Math.abs(
    Number(data.amount ?? existing.amount) || 0,
  );

  if (!(amount > 0)) {
    const error = new Error('Amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }

  const rawType = String(
    data.transaction_type ??
      data.transactionType ??
      existing.transaction_type,
  ).toUpperCase();

  const transactionType = rawType === 'INCOME' ? 'INCOME' : 'EXPENSE';

  const description = data.description ?? existing.description;

  const rawFrequency = String(
    data.frequency ?? existing.frequency ?? 'MONTHLY',
  ).toUpperCase();

  const frequency = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(rawFrequency)
    ? rawFrequency
    : 'MONTHLY';

  const startDate =
    data.start_date ?? data.startDate ?? existing.start_date;

  let endDate = data.end_date ?? data.endDate ?? existing.end_date;

  if (endDate && String(endDate) < String(startDate)) {
    endDate = startDate;
  }

  const nextRunDate =
    data.next_run_date ??
    data.nextRunDate ??
    existing.next_run_date ??
    startDate;

  const isActive =
    readBoolean(data.is_active, data.isActive, data.active) ??
    existing.is_active;

  return queryOne(
    `
      UPDATE ${TABLES.recurringTransactions}
      SET account_id = $1,
          category_id = $2,
          amount = $3,
          transaction_type = $4,
          description = $5,
          frequency = $6,
          start_date = $7,
          end_date = $8,
          next_run_date = $9,
          is_active = $10
      WHERE recurring_id = $11 AND user_id = $12
      RETURNING *
    `,
    [
      accountId,
      categoryId,
      amount,
      transactionType,
      description,
      frequency,
      startDate,
      endDate,
      nextRunDate,
      isActive,
      recurringId,
      userId,
    ],
  );
}

export async function deleteRecurringTransaction(recurringId, userId) {
  return queryOne(
    `DELETE FROM ${TABLES.recurringTransactions} WHERE recurring_id = $1 AND user_id = $2 RETURNING *`,
    [recurringId, userId],
  );
}

/* ============================================================
   ANALYTICAL VIEWS
   ============================================================ */

export async function getAccountBalances(userId = null) {
  if (userId === null || userId === undefined) {
    return queryRows(`SELECT * FROM ${VIEWS.accountBalances}`);
  }
  return queryRows(`SELECT * FROM ${VIEWS.accountBalances} WHERE user_id = $1`, [userId]);
}

export async function getAccountBalancesByUserId(userId) {
  return queryRows(`SELECT * FROM ${VIEWS.accountBalances} WHERE user_id = $1`, [userId]);
}

export async function getBudgetPerformance(userId = null) {
  if (userId === null || userId === undefined) {
    return queryRows(`SELECT * FROM ${VIEWS.budgetPerformance}`);
  }
  return queryRows(`SELECT * FROM ${VIEWS.budgetPerformance} WHERE user_id = $1`, [userId]);
}

export async function getCategorySpending(userId = null) {
  if (userId === null || userId === undefined) {
    return queryRows(`SELECT * FROM ${VIEWS.categorySpending}`);
  }
  return queryRows(`SELECT * FROM ${VIEWS.categorySpending} WHERE user_id = $1`, [userId]);
}

export async function getDebtSummary(userId = null) {
  if (userId === null || userId === undefined) {
    return queryRows(`SELECT * FROM ${VIEWS.debtSummary}`);
  }
  return queryRows(`SELECT * FROM ${VIEWS.debtSummary} WHERE user_id = $1`, [userId]);
}

export async function getMonthlyExpenseAnalysis(userId = null) {
  if (userId === null || userId === undefined) {
    return queryRows(`SELECT * FROM ${VIEWS.monthlyExpenseAnalysis}`);
  }
  return queryRows(`SELECT * FROM ${VIEWS.monthlyExpenseAnalysis} WHERE user_id = $1`, [userId]);
}

export async function getSavingsProgress(userId = null) {
  if (userId === null || userId === undefined) {
    return queryRows(`SELECT * FROM ${VIEWS.savingsProgress}`);
  }
  return queryRows(`SELECT * FROM ${VIEWS.savingsProgress} WHERE user_id = $1`, [userId]);
}

export async function getUserFinancialSummary(userId = null) {
  if (userId === null || userId === undefined) {
    return queryRows(`SELECT * FROM ${VIEWS.userFinancialSummary}`);
  }
  return queryRows(`SELECT * FROM ${VIEWS.userFinancialSummary} WHERE user_id = $1`, [userId]);
}

/* ============================================================
   DASHBOARD
   ============================================================ */

export async function getDashboardData(userId) {
  const [
    financialSummary,
    accounts,
    recentTransactions,
    budgetPerformance,
    savingsProgress,
    debtSummary,
    categorySpending,
    monthlyExpenseAnalysis,
    upcomingRecurring,
  ] = await Promise.all([
    getUserFinancialSummary(userId),
    getAccountsByUserId(userId),
    getRecentTransactionsByUserId(userId, 10),
    getBudgetPerformance(userId),
    getSavingsProgress(userId),
    getDebtSummary(userId),
    getCategorySpending(userId),
    getMonthlyExpenseAnalysis(userId),
    getUpcomingRecurringTransactions(userId, 10),
  ]);

  return {
    financialSummary,
    accounts,
    recentTransactions,
    budgetPerformance,
    savingsProgress,
    debtSummary,
    categorySpending,
    monthlyExpenseAnalysis,
    upcomingRecurring,
  };
}

/* ============================================================
   AUDIT LOG
   ============================================================ */

export async function getAuditLogsByUserId(userId, limit = 100) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));

  return queryRows(
    `
      SELECT
        audit_id,
        user_id,
        action,
        table_name,
        record_id,
        action_time,
        old_data,
        new_data
      FROM ${TABLES.auditLog}
      WHERE user_id = $1
      ORDER BY action_time DESC, audit_id DESC
      LIMIT $2
    `,
    [userId, safeLimit],
  );
}

export async function getAuditLogsForRecord(userId, tableName, recordId, limit = 50) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));

  return queryRows(
    `
      SELECT
        audit_id,
        user_id,
        action,
        table_name,
        record_id,
        action_time,
        old_data,
        new_data
      FROM ${TABLES.auditLog}
      WHERE user_id = $1
        AND table_name = $2
        AND record_id = $3
      ORDER BY action_time DESC, audit_id DESC
      LIMIT $4
    `,
    [userId, tableName, recordId, safeLimit],
  );
}

/* ============================================================
   DATABASE HEALTH / METADATA
   ============================================================ */

export async function getDatabaseHealth() {
  return queryOne(
    `
      SELECT
        current_database() AS database_name,
        current_schema() AS current_schema,
        CURRENT_TIMESTAMP AS server_time
    `,
  );
}

export async function getFinanceObjectSummary() {
  return queryRows(
    `
      SELECT
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'finance'
      ORDER BY
        CASE table_type
          WHEN 'BASE TABLE' THEN 1
          WHEN 'VIEW' THEN 2
          ELSE 3
        END,
        table_name
    `,
  );
}

export default {
  query,
  queryRows,
  queryOne,

  getUserById,
  getUserByEmail,
  getUsers,
  updateUser,

  getAccountsByUserId,
  getAccountById,
  getActiveAccountsByUserId,
  createAccount,
  updateAccount,
  deleteAccount,

  getCategories,
  getCategoriesByType,
  createCategory,
  deleteCategory,

  getTransactionsByUserId,
  getTransactionById,
  getRecentTransactionsByUserId,
  getTransactionCountByUserId,
  createTransaction,
  updateTransaction,
  deleteTransaction,

  getBudgetsByUserId,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,

  getSavingsGoalsByUserId,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,

  getDebtsByUserId,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,

  getRecurringTransactionsByUserId,
  getRecurringTransactionById,
  getUpcomingRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,

  getAccountBalances,
  getAccountBalancesByUserId,
  getBudgetPerformance,
  getCategorySpending,
  getDebtSummary,
  getMonthlyExpenseAnalysis,
  getSavingsProgress,
  getUserFinancialSummary,

  getDashboardData,

  getAuditLogsByUserId,
  getAuditLogsForRecord,

  getDatabaseHealth,
  getFinanceObjectSummary,
};
