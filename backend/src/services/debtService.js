import {
  getDebtsByUserId,
  getDebtById,
  getDebtSummary,
} from '../db/queries.js';

export async function listDebts(userId) {
  if (!userId) throw new Error('userId is required');
  return getDebtsByUserId(userId);
}

export async function findDebt(debtId, userId = null) {
  if (!debtId) throw new Error('debtId is required');
  return getDebtById(debtId, userId);
}

export async function requireDebt(debtId, userId = null) {
  const debt = await findDebt(debtId, userId);
  if (!debt) {
    const error = new Error('Debt not found');
    error.statusCode = 404;
    throw error;
  }
  return debt;
}

export async function getDebtSummaryData(userId) {
  if (!userId) throw new Error('userId is required');
  return getDebtSummary(userId);
}

export async function getDebtOverview(userId) {
  if (!userId) throw new Error('userId is required');
  const [debts, summary] = await Promise.all([
    getDebtsByUserId(userId),
    getDebtSummary(userId),
  ]);

  const totalOutstanding = debts.reduce(
    (total, debt) =>
      total +
      (Number(
        debt.remaining_amount ??
          debt.outstanding_balance ??
          debt.remaining_balance ??
          debt.balance ??
          0,
      ) || 0),
    0,
  );

  const totalMinimumPayment = debts.reduce(
    (total, debt) =>
      total +
      (Number(
        debt.minimum_payment ??
          debt.min_payment ??
          0,
      ) || 0),
    0,
  );

  return {
    debts,
    summary,
    metrics: {
      debtCount: debts.length,
      totalOutstanding,
      totalMinimumPayment,
    },
  };
}

export default {
  listDebts,
  findDebt,
  requireDebt,
  getDebtSummaryData,
  getDebtOverview,
};
