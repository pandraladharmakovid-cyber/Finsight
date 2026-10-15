import {
  getBudgetsByUserId,
  getBudgetById,
  getBudgetPerformance,
} from '../db/queries.js';

export async function listBudgets(userId) {
  if (!userId) throw new Error('userId is required');
  return getBudgetsByUserId(userId);
}

export async function findBudget(budgetId, userId = null) {
  if (!budgetId) throw new Error('budgetId is required');
  return getBudgetById(budgetId, userId);
}

export async function requireBudget(budgetId, userId = null) {
  const budget = await findBudget(budgetId, userId);
  if (!budget) {
    const error = new Error('Budget not found');
    error.statusCode = 404;
    throw error;
  }
  return budget;
}

export async function getBudgetPerformanceData(userId) {
  if (!userId) throw new Error('userId is required');
  return getBudgetPerformance(userId);
}

export async function getBudgetSummary(userId) {
  if (!userId) throw new Error('userId is required');
  const [budgets, performance] = await Promise.all([
    getBudgetsByUserId(userId),
    getBudgetPerformance(userId),
  ]);

  const perfMap = new Map(
    performance.map((p) => [String(p.budget_id ?? p.id), p])
  );

  const summary = budgets.reduce(
    (result, budget) => {
      const perf = perfMap.get(String(budget.budget_id ?? budget.id)) || {};
      const amount = Number(
        budget.amount_limit ??
        budget.budget_amount ??
        budget.amount ??
        perf.budget_amount ??
        perf.amount_limit ??
        0,
      );
      const spent = Number(
        perf.actual_spending ??
        perf.spent_amount ??
        perf.spent ??
        budget.spent ??
        0,
      );

      result.totalBudget += amount;
      result.totalSpent += spent;
      result.budgetCount += 1;
      return result;
    },
    { totalBudget: 0, totalSpent: 0, budgetCount: 0 },
  );

  summary.remaining = summary.totalBudget - summary.totalSpent;
  summary.utilization =
    summary.totalBudget > 0
      ? (summary.totalSpent / summary.totalBudget) * 100
      : 0;

  return {
    ...summary,
    budgets,
  };
}

export default {
  listBudgets,
  findBudget,
  requireBudget,
  getBudgetPerformanceData,
  getBudgetSummary,
};
