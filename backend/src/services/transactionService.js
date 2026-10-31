import {
  getTransactionsByUserId,
  getTransactionById,
  getRecentTransactionsByUserId,
  getTransactionCountByUserId,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../db/queries.js';

export async function listTransactions(userId, filters = {}) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return getTransactionsByUserId(userId, filters);
}

export async function findTransaction(transactionId, userId = null) {
  if (!transactionId) {
    throw new Error('transactionId is required');
  }
  return getTransactionById(transactionId, userId);
}

export async function requireTransaction(transactionId, userId = null) {
  const transaction = await findTransaction(transactionId, userId);

  if (!transaction) {
    const error = new Error('Transaction not found');
    error.statusCode = 404;
    throw error;
  }

  return transaction;
}

export async function listRecentTransactions(userId, limit = 10) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return getRecentTransactionsByUserId(userId, limit);
}

export async function getTransactionCount(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return getTransactionCountByUserId(userId);
}

export async function getTransactionSummary(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [transactions, count] = await Promise.all([
    getRecentTransactionsByUserId(userId, 100),
    getTransactionCountByUserId(userId),
  ]);

  const summary = transactions.reduce(
    (result, transaction) => {
      const amount = Number(transaction.amount) || 0;
      const type = String(transaction.transaction_type || '').toUpperCase();

      if (type === 'INCOME') {
        result.totalIncome += amount;
      } else if (type === 'EXPENSE') {
        result.totalExpenses += amount;
      }

      return result;
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
    },
  );

  return {
    ...summary,
    netCashFlow: summary.totalIncome - summary.totalExpenses,
    transactionCount: count,
    recentTransactions: transactions,
  };
}

export async function addTransactionForUser(userId, data) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return createTransaction(userId, data);
}

export async function editTransactionForUser(transactionId, userId, data) {
  if (!transactionId || !userId) {
    throw new Error('transactionId and userId are required');
  }
  return updateTransaction(transactionId, userId, data);
}

export async function removeTransactionForUser(transactionId, userId) {
  if (!transactionId || !userId) {
    throw new Error('transactionId and userId are required');
  }
  return deleteTransaction(transactionId, userId);
}

export default {
  listTransactions,
  findTransaction,
  requireTransaction,
  listRecentTransactions,
  getTransactionCount,
  getTransactionSummary,
  addTransactionForUser,
  editTransactionForUser,
  removeTransactionForUser,
};
