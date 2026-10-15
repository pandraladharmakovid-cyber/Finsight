import {
  listSavingsGoals,
  getSavingsOverview,
  getSavingsProgressData,
  findSavingsGoal,
} from '../services/savingsService.js';
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '../db/queries.js';

export async function getSavingsGoals(req, res) {
  const userId = Number(req.params.userId);
  const goals = await listSavingsGoals(userId);
  return res.status(200).json({ success: true, data: goals });
}

export async function getSavingsOverviewData(req, res) {
  const userId = Number(req.params.userId);
  const overview = await getSavingsOverview(userId);
  return res.status(200).json({ success: true, data: overview });
}

export async function getSavingsProgress(req, res) {
  const userId = Number(req.params.userId);
  const progress = await getSavingsProgressData(userId);
  return res.status(200).json({ success: true, data: progress });
}

export async function createNewGoal(req, res) {
  const userId = Number(req.params.userId ?? 1);
  const created = await createSavingsGoal(userId, req.body);
  return res.status(201).json({ success: true, data: created });
}

export async function updateExistingGoal(req, res) {
  const userId = Number(req.params.userId ?? 1);
  const goalId = Number(req.params.goalId);
  const updated = await updateSavingsGoal(goalId, userId, req.body);
  return res.status(200).json({ success: true, data: updated });
}

export async function deleteExistingGoal(req, res) {
  const userId = Number(req.params.userId ?? 1);
  const goalId = Number(req.params.goalId);
  const deleted = await deleteSavingsGoal(goalId, userId);
  return res.status(200).json({ success: true, data: deleted });
}
export async function getSavingsGoal(req, res) {
  const userId = Number(req.params.userId);
  const goalId = Number(req.params.goalId);
  const goal = await findSavingsGoal(goalId, userId);
  if (!goal) {
    return res.status(404).json({ success: false, message: 'Savings goal not found' });
  }
  return res.status(200).json({ success: true, data: goal });
}
