import api from './api.js';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

function requireUserId() {
  return USER_ID;
}

export async function getTransactions(filters = {}) {
  const userId = requireUserId();
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return api.get(`/transactions/${userId}${query ? `?${query}` : ''}`);
}

export async function getTransaction(transactionId) {
  const userId = requireUserId();
  if (!transactionId) {
    throw new Error('transactionId is required.');
  }
  return api.get(`/transactions/${userId}/${transactionId}`);
}

export async function getRequiredTransaction(transactionId) {
  const userId = requireUserId();
  if (!transactionId) {
    throw new Error('transactionId is required.');
  }
  return api.get(`/transactions/${userId}/${transactionId}/required`);
}

export async function getRecentTransactions(limit = 10) {
  const userId = requireUserId();
  return api.get(`/transactions/${userId}/recent?limit=${encodeURIComponent(limit)}`);
}

export async function getTransactionCount() {
  const userId = requireUserId();
  return api.get(`/transactions/${userId}/count`);
}

export async function getTransactionSummary() {
  const userId = requireUserId();
  return api.get(`/transactions/${userId}/summary`);
}

export async function createTransaction(payload) {
  const userId = requireUserId();
  return api.post(`/transactions/${userId}`, {
    ...payload,
    userId: Number(userId),
  });
}

export async function updateTransaction(transactionId, payload) {
  const userId = requireUserId();
  return api.put(`/transactions/${userId}/${transactionId}`, {
    ...payload,
    userId: Number(userId),
  });
}

export async function deleteTransaction(transactionId) {
  const userId = requireUserId();
  return api.del(`/transactions/${userId}/${transactionId}`);
}

export default {
  getTransactions,
  getTransaction,
  getRequiredTransaction,
  getRecentTransactions,
  getTransactionCount,
  getTransactionSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};