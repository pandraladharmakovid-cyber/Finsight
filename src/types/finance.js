// src/types/finance.js

/**
 * @typedef {Object} Account
 * @property {number|string} id
 * @property {string} name
 * @property {string} [type]
 * @property {number} balance
 * @property {string} [institution]
 * @property {string} [account_number]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} Category
 * @property {number|string} id
 * @property {string} name
 * @property {string} [type]
 * @property {string} [icon]
 * @property {string} [color]
 */

/**
 * @typedef {Object} Transaction
 * @property {number|string} id
 * @property {number} amount
 * @property {string} type
 * @property {string} [description]
 * @property {string} [merchant]
 * @property {string} [category]
 * @property {string} [category_name]
 * @property {number|string} [account_id]
 * @property {string} [account_name]
 * @property {string} transaction_date
 * @property {string} [notes]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} Budget
 * @property {number|string} id
 * @property {string} name
 * @property {number} amount
 * @property {number} [spent]
 * @property {number} [remaining]
 * @property {string} [category]
 * @property {string} [category_name]
 * @property {string} [period]
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {string} [notes]
 * @property {boolean} [is_active]
 */

/**
 * @typedef {Object} SavingsGoal
 * @property {number|string} id
 * @property {string} name
 * @property {number} target_amount
 * @property {number} [current_amount]
 * @property {number} [monthly_contribution]
 * @property {string} [deadline]
 * @property {string} [category]
 * @property {string} [description]
 * @property {string} [status]
 */

/**
 * @typedef {Object} Debt
 * @property {number|string} id
 * @property {string} name
 * @property {string} [lender]
 * @property {string} [type]
 * @property {number} original_amount
 * @property {number} current_balance
 * @property {number} [interest_rate]
 * @property {number} [monthly_payment]
 * @property {string} [due_date]
 * @property {string} [notes]
 * @property {string} [status]
 */

/**
 * @typedef {Object} RecurringTransaction
 * @property {number|string} id
 * @property {string} name
 * @property {number} amount
 * @property {string} type
 * @property {string} [category]
 * @property {string} [category_name]
 * @property {number|string} [account_id]
 * @property {string} [account_name]
 * @property {string} frequency
 * @property {string} next_occurrence
 * @property {boolean} [is_active]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} FinancialSummary
 * @property {number} income
 * @property {number} expenses
 * @property {number} savings
 * @property {number} balance
 * @property {number} [debt]
 * @property {number} [budget_usage]
 * @property {number} [savings_rate]
 * @property {number} [expense_rate]
 * @property {number} [health_score]
 */

/**
 * @typedef {Object} DashboardData
 * @property {FinancialSummary} summary
 * @property {Transaction[]} [recentTransactions]
 * @property {Budget[]} [budgets]
 * @property {SavingsGoal[]} [savingsGoals]
 * @property {Debt[]} [debts]
 * @property {RecurringTransaction[]} [recurringTransactions]
 * @property {Object[]} [incomeTrend]
 * @property {Object[]} [expenseTrend]
 * @property {Object[]} [categoryBreakdown]
 */

/**
 * Create a safe empty financial summary.
 */
export const createEmptyFinancialSummary = () => ({
  income: 0,
  expenses: 0,
  savings: 0,
  balance: 0,
  debt: 0,
  budget_usage: 0,
  savings_rate: 0,
  expense_rate: 0,
  health_score: 0,
});

/**
 * Create an empty dashboard data object.
 */
export const createEmptyDashboardData = () => ({
  summary: createEmptyFinancialSummary(),
  recentTransactions: [],
  budgets: [],
  savingsGoals: [],
  debts: [],
  recurringTransactions: [],
  incomeTrend: [],
  expenseTrend: [],
  categoryBreakdown: [],
});

/**
 * Normalize an API transaction.
 */
export const normalizeTransaction = (
  transaction = {}
) => ({
  id: transaction.id,
  amount: Number(transaction.amount) || 0,
  type:
    transaction.type ||
    transaction.transaction_type ||
    "expense",
  description:
    transaction.description || "",
  merchant:
    transaction.merchant || "",
  category:
    transaction.category ||
    transaction.category_name ||
    "Uncategorized",
  account_id:
    transaction.account_id ?? null,
  account_name:
    transaction.account_name || "",
  transaction_date:
    transaction.transaction_date ||
    transaction.date ||
    null,
  notes: transaction.notes || "",
  created_at:
    transaction.created_at || null,
  updated_at:
    transaction.updated_at || null,
});

/**
 * Normalize budget data from different
 * backend response shapes.
 */
export const normalizeBudget = (
  budget = {}
) => ({
  id: budget.id,
  name:
    budget.name ||
    budget.budget_name ||
    "Untitled Budget",
  amount:
    Number(
      budget.amount ??
        budget.budget_amount ??
        0
    ) || 0,
  spent:
    Number(
      budget.spent ??
        budget.amount_spent ??
        0
    ) || 0,
  remaining:
    Number(
      budget.remaining ??
        budget.amount_remaining ??
        0
    ) || 0,
  category:
    budget.category ||
    budget.category_name ||
    "General",
  period:
    budget.period ||
    budget.budget_period ||
    "monthly",
  start_date:
    budget.start_date || null,
  end_date:
    budget.end_date || null,
  notes: budget.notes || "",
  is_active:
    budget.is_active !== false,
});

/**
 * Normalize savings goal.
 */
export const normalizeSavingsGoal = (
  goal = {}
) => ({
  id: goal.id,
  name:
    goal.name ||
    goal.goal_name ||
    "Untitled Goal",
  target_amount:
    Number(
      goal.target_amount ??
        goal.target ??
        0
    ) || 0,
  current_amount:
    Number(
      goal.current_amount ??
        goal.saved_amount ??
        0
    ) || 0,
  monthly_contribution:
    Number(
      goal.monthly_contribution ??
        goal.monthly_target ??
        0
    ) || 0,
  deadline:
    goal.deadline ||
    goal.target_date ||
    null,
  category:
    goal.category ||
    goal.category_name ||
    "General",
  description:
    goal.description ||
    goal.notes ||
    "",
  status:
    goal.status || "active",
});

/**
 * Normalize debt.
 */
export const normalizeDebt = (
  debt = {}
) => ({
  id: debt.id,
  name:
    debt.name ||
    debt.debt_name ||
    "Untitled Debt",
  lender:
    debt.lender ||
    debt.lender_name ||
    "",
  type:
    debt.type ||
    debt.debt_type ||
    "other",
  original_amount:
    Number(
      debt.original_amount ??
        debt.amount ??
        0
    ) || 0,
  current_balance:
    Number(
      debt.current_balance ??
        debt.balance ??
        0
    ) || 0,
  interest_rate:
    Number(
      debt.interest_rate ??
        debt.apr ??
        0
    ) || 0,
  monthly_payment:
    Number(
      debt.monthly_payment ??
        debt.payment ??
        0
    ) || 0,
  due_date:
    debt.due_date || null,
  notes:
    debt.notes || "",
  status:
    debt.status || "active",
});

/**
 * Normalize recurring transaction.
 */
export const normalizeRecurringTransaction = (
  transaction = {}
) => ({
  id: transaction.id,
  name:
    transaction.name ||
    transaction.title ||
    "Recurring Transaction",
  amount:
    Number(transaction.amount) || 0,
  type:
    transaction.type ||
    transaction.transaction_type ||
    "expense",
  category:
    transaction.category ||
    transaction.category_name ||
    "General",
  account_id:
    transaction.account_id ?? null,
  account_name:
    transaction.account_name || "",
  frequency:
    transaction.frequency ||
    transaction.recurrence ||
    "monthly",
  next_occurrence:
    transaction.next_occurrence ||
    transaction.next_date ||
    null,
  is_active:
    transaction.is_active !== false,
  notes:
    transaction.notes || "",
});

/**
 * Normalize dashboard response.
 */
export const normalizeDashboardData = (data = {}) => {
  const summary = {
    ...createEmptyFinancialSummary(),
    ...(data.summary || {}),
  };

  return {
    summary: {
      ...summary,
      income: Number(summary.income) || 0,
      expenses: Number(summary.expenses) || 0,
      savings: Number(summary.savings) || 0,
      balance: Number(summary.balance) || 0,
      debt: Number(summary.debt) || 0,
      budget_usage: Number(summary.budget_usage) || 0,
      savings_rate: Number(summary.savings_rate) || 0,
      expense_rate: Number(summary.expense_rate) || 0,
      health_score: Number(summary.health_score) || 0,
    },

    recentTransactions: Array.isArray(data.recentTransactions)
      ? data.recentTransactions.map(normalizeTransaction)
      : [],

    budgets: Array.isArray(data.budgets)
      ? data.budgets.map(normalizeBudget)
      : [],

    savingsGoals: Array.isArray(data.savingsGoals)
      ? data.savingsGoals.map(normalizeSavingsGoal)
      : [],

    debts: Array.isArray(data.debts)
      ? data.debts.map(normalizeDebt)
      : [],

    recurringTransactions: Array.isArray(
      data.recurringTransactions
    )
      ? data.recurringTransactions.map(
          normalizeRecurringTransaction
        )
      : [],

    incomeTrend: Array.isArray(data.incomeTrend)
      ? data.incomeTrend
      : [],

    expenseTrend: Array.isArray(data.expenseTrend)
      ? data.expenseTrend
      : [],

    categoryBreakdown: Array.isArray(data.categoryBreakdown)
      ? data.categoryBreakdown
      : [],
  };
};

export default {
  createEmptyFinancialSummary,
  createEmptyDashboardData,
  normalizeTransaction,
  normalizeBudget,
  normalizeSavingsGoal,
  normalizeDebt,
  normalizeRecurringTransaction,
  normalizeDashboardData,
};