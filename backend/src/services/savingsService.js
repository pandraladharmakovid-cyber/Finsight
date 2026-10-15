import {
  getSavingsGoalsByUserId,
  getSavingsGoalById,
  getSavingsProgress,
} from '../db/queries.js';

/**
 * FinSight Savings Service
 *
 * Handles savings goals and savings-progress analytics.
 * PostgreSQL remains responsible for the underlying financial queries.
 */

export async function listSavingsGoals(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getSavingsGoalsByUserId(userId);
}

export async function findSavingsGoal(goalId, userId = null) {
  if (!goalId) {
    throw new Error('goalId is required');
  }

  return getSavingsGoalById(goalId, userId);
}

export async function requireSavingsGoal(goalId, userId = null) {
  const goal = await findSavingsGoal(goalId, userId);

  if (!goal) {
    const error = new Error('Savings goal not found');
    error.statusCode = 404;
    throw error;
  }

  return goal;
}

export async function getSavingsProgressData(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getSavingsProgress(userId);
}

export async function getSavingsOverview(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [goals, progress] = await Promise.all([
    getSavingsGoalsByUserId(userId),
    getSavingsProgress(userId),
  ]);

  const totalTarget = goals.reduce(
    (total, goal) =>
      total +
      (Number(
        goal.target_amount ??
          goal.goal_amount ??
          0,
      ) || 0),
    0,
  );

  const totalSaved = goals.reduce(
    (total, goal) =>
      total +
      (Number(
        goal.current_amount ??
          goal.saved_amount ??
          goal.amount_saved ??
          0,
      ) || 0),
    0,
  );

  const overallProgress =
    totalTarget > 0
      ? (totalSaved / totalTarget) * 100
      : 0;

  return {
    goals,
    progress,
    metrics: {
      goalCount: goals.length,
      totalTarget,
      totalSaved,
      remaining: Math.max(totalTarget - totalSaved, 0),
      overallProgress,
    },
  };
}

export default {
  listSavingsGoals,
  findSavingsGoal,
  requireSavingsGoal,
  getSavingsProgressData,
  getSavingsOverview,
};