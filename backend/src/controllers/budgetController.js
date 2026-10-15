import {
  listBudgets,
  findBudget,
  requireBudget,
  getBudgetSummary,
  getBudgetPerformanceData,
} from '../services/budgetService.js';
import { createBudget, updateBudget, deleteBudget } from '../db/queries.js';

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
  const created = await createBudget(userId, req.body);
  return res.status(201).json({ success: true, data: created });
}

export async function updateExistingBudget(req, res) {
  const userId = Number(req.params.userId ?? req.body.userId ?? 1);
  const budgetId = Number(req.params.budgetId);
  const updated = await updateBudget(budgetId, userId, req.body);
  return res.status(200).json({ success: true, data: updated });
}

export async function deleteExistingBudget(req, res) {
  const userId = Number(req.params.userId ?? 1);
  const budgetId = Number(req.params.budgetId);
  const deleted = await deleteBudget(budgetId, userId);
  return res.status(200).json({ success: true, data: deleted });
}
export async function getBudget(req, res) {
  const userId = Number(req.params.userId);
  const budgetId = Number(req.params.budgetId);
  const budget = await findBudget(budgetId, userId);
  if (!budget) {
    return res.status(404).json({ success: false, message: 'Budget not found' });
  }
  return res.status(200).json({ success: true, data: budget });
}
