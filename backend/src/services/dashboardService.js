import {
  getRecentTransactionsByUserId,
  getAccountBalances,
  getBudgetPerformance,
  getSavingsProgress,
  getDebtSummary,
  getCategorySpending,
  getMonthlyExpenseAnalysis,
} from '../db/queries.js';

/**
 * FinSight Dashboard Service
 *
 * Aggregates the PostgreSQL analytical views into a single
 * dashboard-ready data model.
 *
 * Financial calculations remain database-driven wherever possible.
 */

export async function getDashboardData(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [
    recentTransactions,
    accountBalances,
    budgetPerformance,
    savingsProgress,
    debtSummary,
    categorySpending,
    monthlyExpenseAnalysis,
  ] = await Promise.all([
    getRecentTransactionsByUserId(userId, 10),
    getAccountBalances(userId),
    getBudgetPerformance(userId),
    getSavingsProgress(userId),
    getDebtSummary(userId),
    getCategorySpending(userId),
    getMonthlyExpenseAnalysis(userId),
  ]);

  const totalBalance = accountBalances.reduce(
    (total, account) => total + (Number(account.balance) || 0),
    0,
  );

  const totalBudget = budgetPerformance.reduce(
    (total, budget) =>
      total +
      (Number(
        budget.budget_amount ??
          budget.amount ??
          budget.planned_amount ??
          0,
      ) || 0),
    0,
  );

  const totalSpent = budgetPerformance.reduce(
    (total, budget) =>
      total +
      (Number(
        budget.spent_amount ??
          budget.spent ??
          budget.actual_amount ??
          0,
      ) || 0),
    0,
  );

  return {
    summary: {
      totalBalance,
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
    },

    accounts: accountBalances,

    budgets: budgetPerformance,

    savings: savingsProgress,

    debts: debtSummary,

    spendingByCategory: categorySpending,

    monthlyExpenses: monthlyExpenseAnalysis,

    recentTransactions,

    generatedAt: new Date().toISOString(),
  };
}

export async function getDashboardAnalytics(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [
    categorySpending,
    monthlyExpenseAnalysis,
    budgetPerformance,
    accountBalances,
  ] = await Promise.all([
    getCategorySpending(userId),
    getMonthlyExpenseAnalysis(userId),
    getBudgetPerformance(userId),
    getAccountBalances(userId),
  ]);

  return {
    categorySpending,
    monthlyExpenseAnalysis,
    budgetPerformance,
    accountBalances,
  };
}

export async function getDashboardActivity(userId, limit = 10) {
  if (!userId) {
    throw new Error('userId is required');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('limit must be an integer between 1 and 100');
  }

  return getRecentTransactionsByUserId(userId, limit);
}

export default {
  getDashboardData,
  getDashboardAnalytics,
  getDashboardActivity,
};