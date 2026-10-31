import {
  getCategorySpending,
  getMonthlyExpenseAnalysis,
  getBudgetPerformance,
  getAccountBalances,
  getSavingsProgress,
  getDebtSummary,
} from '../db/queries.js';

/**
 * FinSight Analytics Service
 *
 * Centralizes financial analytics consumed by the dashboard,
 * analytics pages, reports, and future visualizations.
 *
 * The PostgreSQL analytical views remain the source of truth.
 */

export async function getSpendingAnalytics(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [categorySpending, monthlyExpenseAnalysis] =
    await Promise.all([
      getCategorySpending(userId),
      getMonthlyExpenseAnalysis(userId),
    ]);

  return {
    categorySpending,
    monthlyExpenseAnalysis,
  };
}

export async function getBudgetAnalytics(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getBudgetPerformance(userId);
}

export async function getAccountAnalytics(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getAccountBalances(userId);
}

export async function getSavingsAnalytics(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getSavingsProgress(userId);
}

export async function getDebtAnalytics(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getDebtSummary(userId);
}

export async function getFinancialAnalytics(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [
    spending,
    budgets,
    accounts,
    savings,
    debts,
  ] = await Promise.all([
    getSpendingAnalytics(userId),
    getBudgetAnalytics(userId),
    getAccountAnalytics(userId),
    getSavingsAnalytics(userId),
    getDebtAnalytics(userId),
  ]);

  return {
    spending,
    budgets,
    accounts,
    savings,
    debts,
    generatedAt: new Date().toISOString(),
  };
}

export default {
  getSpendingAnalytics,
  getBudgetAnalytics,
  getAccountAnalytics,
  getSavingsAnalytics,
  getDebtAnalytics,
  getFinancialAnalytics,
};
