import {
  getRecurringTransactionsByUserId,
  getRecurringTransactionById,
} from '../db/queries.js';

/**
 * FinSight Recurring Transactions Service
 *
 * Handles recurring financial obligations and income streams.
 * Database access remains centralized in db/queries.js.
 */

export async function listRecurringTransactions(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getRecurringTransactionsByUserId(userId);
}

export async function findRecurringTransaction(
  recurringTransactionId,
  userId = null,
) {
  if (!recurringTransactionId) {
    throw new Error('recurringTransactionId is required');
  }

  return getRecurringTransactionById(
    recurringTransactionId,
    userId,
  );
}

export async function requireRecurringTransaction(
  recurringTransactionId,
  userId = null,
) {
  const recurringTransaction = await findRecurringTransaction(
    recurringTransactionId,
    userId,
  );

  if (!recurringTransaction) {
    const error = new Error('Recurring transaction not found');
    error.statusCode = 404;
    throw error;
  }

  return recurringTransaction;
}

export async function getRecurringOverview(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const recurringTransactions =
    await getRecurringTransactionsByUserId(userId);

  const activeTransactions = recurringTransactions.filter(
    (transaction) =>
      transaction.is_active === true ||
      transaction.status === 'active',
  );

  const monthlyRecurringAmount = activeTransactions.reduce(
    (total, transaction) => {
      const amount = Number(transaction.amount) || 0;

      const frequency = String(
        transaction.frequency ?? 'monthly',
      ).toLowerCase();

      if (frequency === 'weekly') {
        return total + amount * 4.345;
      }

      if (frequency === 'biweekly') {
        return total + amount * 2.1725;
      }

      if (frequency === 'yearly' || frequency === 'annual') {
        return total + amount / 12;
      }

      return total + amount;
    },
    0,
  );

  return {
    recurringTransactions,
    metrics: {
      totalCount: recurringTransactions.length,
      activeCount: activeTransactions.length,
      monthlyRecurringAmount,
    },
  };
}

export default {
  listRecurringTransactions,
  findRecurringTransaction,
  requireRecurringTransaction,
  getRecurringOverview,
};
