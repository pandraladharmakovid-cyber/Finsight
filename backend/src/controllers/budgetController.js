import {
  listBudgets,
  findBudget,
  requireBudget,
  getBudgetSummary,
  getBudgetPerformanceData,
} from '../services/budgetService.js';
import { createBudget, updateBudget, deleteBudget } from '../db/queries.js';

export async function getBudget(req, res) {
  const userId = Number(req.params.userId);
  const budgetId = Number(req.params.budgetId);
  const budget = await findBudget(budgetId, userId);
  return res.status(200).json({ success: true, data: budget });
}

export async function getRequiredBudget(req, res) {
  const userId = Number(req.params.userId);
  const budgetId = Number(req.params.budgetId);
  const budget = await requireBudget(budgetId, userId);
  return res.status(200).json({ success: true, data: budget });
}

export async function getBudgets(req, res) {
  const userId = Number(req.params.userId);
  const budgets = await listBudgets(userId);
  return res.status(200).json({ success: true, data: budgets });
}

export async function getBudgetSummaryData(req, res) {
  const userId = Number(req.params.userId);
  const summary = await getBudgetSummary(userId);
  return res.status(200).json({ success: true, data: summary });
}

export async function getBudgetPerformance(req, res) {
  const userId = Number(req.params.userId);
  const performance = await getBudgetPerformanceData(userId);
  return res.status(200).json({ success: true, data: performance });
}

export async function createNewBudget(req, res) {
  const userId = Number(req.params.userId ?? req.body.userId ?? 1);

  const amount = Number(
    req.body.budget_amount ??
      req.body.budgetAmount ??
      req.body.amount_limit ??
      req.body.amount ??
      0,
  );

  if (!(amount > 0)) {
    const error = new Error('Budget amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }

  const created = await createBudget(userId, req.body);

  return res.status(201).json({
    success: true,
    message: 'Budget created successfully.',
    data: created,
  });
}

export async function updateExistingBudget(req, res) {
  const userId = Number(req.params.userId ?? req.body.userId ?? 1);
  const budgetId = Number(req.params.budgetId);
  const updated = await updateBudget(budgetId, userId, req.body);

  if (!updated) {
    const error = new Error('Budget not found.');
    error.statusCode = 404;
    throw error;
  }

  return res.status(200).json({
    success: true,
    message: 'Budget updated successfully.',
    data: updated,
  });
}

export async function deleteExistingBudget(req, res) {
  const userId = Number(req.params.userId ?? 1);
  const budgetId = Number(req.params.budgetId);
  const deleted = await deleteBudget(budgetId, userId);

  if (!deleted) {
    const error = new Error('Budget not found.');
    error.statusCode = 404;
    throw error;
  }

  return res.status(200).json({
    success: true,
    message: 'Budget deleted successfully.',
    data: deleted,
  });
}
