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
      account_type ?? accountType ?? 'Checking',
      Number(balance) || 0,
      currency,
      Boolean(is_active),
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
  const isActive = data.is_active !== undefined ? Boolean(data.is_active) : existing.is_active;

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

export async function createCategory(data) {
  const { category_name, categoryName, category_type, categoryType } = data;
  return queryOne(
    `
      INSERT INTO ${TABLES.categories} (category_name, category_type)
      VALUES ($1, $2)
      RETURNING *
    `,
    [category_name ?? categoryName, String(category_type ?? categoryType ?? 'EXPENSE').toUpperCase()],
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

    if (!accountId) {
      const newAcc = await client.query(
        `INSERT INTO ${TABLES.accounts} (user_id, account_name, account_type, balance, currency, is_active)
         VALUES ($1, $2, 'CHECKING', 0, 'INR', TRUE) RETURNING account_id`,
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
          `INSERT INTO ${TABLES.categories} (category_name, category_type) VALUES ($1, $2) RETURNING category_id`,
          [String(categoryNameInput).trim(), rawType === 'INCOME' ? 'INCOME' : 'EXPENSE'],
        );
        categoryId = newCat.rows[0]?.category_id ?? null;
      }
    }

    const amount = Math.abs(Number(data.amount) || 0);
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

    const delta = rawType === 'INCOME' ? amount : -amount;
    await client.query(
      `UPDATE ${TABLES.accounts} SET balance = COALESCE(balance, 0) + $1 WHERE account_id = $2`,
      [delta, accountId],
    );

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

    const amt = Math.abs(Number(existing.amount) || 0);
    const reverseDelta = String(existing.transaction_type).toUpperCase() === 'INCOME' ? -amt : amt;
    await client.query(
      `UPDATE ${TABLES.accounts} SET balance = COALESCE(balance, 0) + $1 WHERE account_id = $2`,
      [reverseDelta, existing.account_id],
    );

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
        `INSERT INTO ${TABLES.categories} (category_name, category_type) VALUES ($1, 'EXPENSE') RETURNING category_id`,
        [String(categoryNameInput).trim()],
      );
      categoryId = createdCat?.category_id ?? null;
    }
  }

  const amountLimit = Number(data.amount_limit ?? data.amountLimit ?? data.amount ?? data.budget_amount ?? 0);
  const startDate = data.start_date ?? data.startDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const endDate = data.end_date ?? data.endDate ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

  return queryOne(
    `
      INSERT INTO ${TABLES.budgets}
        (user_id, category_id, amount_limit, start_date, end_date)
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
  const amountLimit = data.amount_limit ?? data.amountLimit ?? data.amount ?? existing.amount_limit;
  const startDate = data.start_date ?? data.startDate ?? existing.start_date;
  const endDate = data.end_date ?? data.endDate ?? existing.end_date;

  return queryOne(
    `
      UPDATE ${TABLES.budgets}
      SET category_id = $1,
          amount_limit = $2,
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
  const goalName = data.goal_name ?? data.goalName ?? data.name ?? 'New Goal';
  const targetAmount = Number(data.target_amount ?? data.targetAmount ?? 0);
  const currentAmount = Number(data.current_amount ?? data.currentAmount ?? 0);
  const targetDate = data.target_date ?? data.targetDate ?? data.deadline ?? null;

  return queryOne(
    `
      INSERT INTO ${TABLES.savingsGoals}
        (user_id, goal_name, target_amount, current_amount, target_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [userId, goalName, targetAmount, currentAmount, targetDate],
  );
}

export async function updateSavingsGoal(goalId, userId, data) {
  const existing = await getSavingsGoalById(goalId, userId);
  if (!existing) return null;

  const goalName = data.goal_name ?? data.goalName ?? data.name ?? existing.goal_name;
  const targetAmount = data.target_amount ?? data.targetAmount ?? existing.target_amount;
  const currentAmount = data.current_amount ?? data.currentAmount ?? existing.current_amount;
  const targetDate = data.target_date ?? data.targetDate ?? existing.target_date;

  return queryOne(
    `
      UPDATE ${TABLES.savingsGoals}
      SET goal_name = $1,
          target_amount = $2,
          current_amount = $3,
          target_date = $4
      WHERE goal_id = $5 AND user_id = $6
      RETURNING *
    `,
    [goalName, Number(targetAmount), Number(currentAmount), targetDate, goalId, userId],
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
  const debtName = data.debt_name ?? data.debtName ?? data.lender_name ?? data.name ?? 'Debt';
  const totalAmount = Number(data.total_amount ?? data.totalAmount ?? data.principal_amount ?? data.remaining_balance ?? 0);
  const remainingAmount = Number(data.remaining_amount ?? data.remainingAmount ?? data.remaining_balance ?? totalAmount);
  const interestRate = Number(data.interest_rate ?? data.interestRate ?? 0);
  const minimumPayment = Number(data.minimum_payment ?? data.minimumPayment ?? 0);
  const dueDate = data.due_date ?? data.dueDate ?? null;

  return queryOne(
    `
      INSERT INTO ${TABLES.debts}
        (user_id, debt_name, total_amount, remaining_amount, interest_rate, minimum_payment, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [userId, debtName, totalAmount, remainingAmount, interestRate, minimumPayment, dueDate],
  );
}

export async function updateDebt(debtId, userId, data) {
  const existing = await getDebtById(debtId, userId);
  if (!existing) return null;

  const debtName = data.debt_name ?? data.debtName ?? existing.debt_name;
  const totalAmount = data.total_amount ?? data.totalAmount ?? existing.total_amount;
  const remainingAmount = data.remaining_amount ?? data.remainingAmount ?? existing.remaining_amount;
  const interestRate = data.interest_rate ?? data.interestRate ?? existing.interest_rate;
  const minimumPayment = data.minimum_payment ?? data.minimumPayment ?? existing.minimum_payment;
  const dueDate = data.due_date ?? data.dueDate ?? existing.due_date;

  return queryOne(
    `
      UPDATE ${TABLES.debts}
      SET debt_name = $1,
          total_amount = $2,
          remaining_amount = $3,
          interest_rate = $4,
          minimum_payment = $5,
          due_date = $6
      WHERE debt_id = $7 AND user_id = $8
      RETURNING *
    `,
    [debtName, Number(totalAmount), Number(remainingAmount), Number(interestRate), Number(minimumPayment), dueDate, debtId, userId],
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
  const accountId = data.account_id ?? data.accountId ?? 1;
  const categoryId = data.category_id ?? data.categoryId ?? null;
  const amount = Math.abs(Number(data.amount) || 0);
  const transactionType = String(data.transaction_type ?? data.transactionType ?? data.type ?? 'EXPENSE').toUpperCase();
  const description = data.description ?? data.name ?? '';
  const frequency = String(data.frequency ?? 'MONTHLY').toUpperCase();
  const nextRunDate = data.next_run_date ?? data.nextRunDate ?? new Date().toISOString().split('T')[0];
  const isActive = data.is_active !== undefined ? Boolean(data.is_active) : true;

  return queryOne(
    `
      INSERT INTO ${TABLES.recurringTransactions}
        (user_id, account_id, category_id, amount, transaction_type, description, frequency, next_run_date, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [userId, accountId, categoryId, amount, transactionType, description, frequency, nextRunDate, isActive],
  );
}

export async function updateRecurringTransaction(recurringId, userId, data) {
  const existing = await getRecurringTransactionById(recurringId, userId);
  if (!existing) return null;

  const accountId = data.account_id ?? data.accountId ?? existing.account_id;
  const categoryId = data.category_id ?? data.categoryId ?? existing.category_id;
  const amount = data.amount !== undefined ? Math.abs(Number(data.amount)) : Number(existing.amount);
  const transactionType = String(data.transaction_type ?? data.transactionType ?? existing.transaction_type).toUpperCase();
  const description = data.description ?? existing.description;
  const frequency = String(data.frequency ?? existing.frequency).toUpperCase();
  const nextRunDate = data.next_run_date ?? data.nextRunDate ?? existing.next_run_date;
  const isActive = data.is_active !== undefined ? Boolean(data.is_active) : existing.is_active;

  return queryOne(
    `
      UPDATE ${TABLES.recurringTransactions}
      SET account_id = $1,
          category_id = $2,
          amount = $3,
          transaction_type = $4,
          description = $5,
          frequency = $6,
          next_run_date = $7,
          is_active = $8
      WHERE recurring_id = $9 AND user_id = $10
      RETURNING *
    `,
    [accountId, categoryId, amount, transactionType, description, frequency, nextRunDate, isActive, recurringId, userId],
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