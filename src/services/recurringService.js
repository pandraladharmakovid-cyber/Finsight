import api from './api.js';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

function requireUserId() {
  return USER_ID;
}

export async function getRecurringTransactions() {
  return api.get(`/recurring/${requireUserId()}`);
}

export async function getRecurringTransaction(recurringTransactionId) {
  if (!recurringTransactionId) throw new Error('recurringTransactionId is required.');
  return api.get(`/recurring/${requireUserId()}/${recurringTransactionId}`);
}

export async function getRequiredRecurringTransaction(recurringTransactionId) {
  if (!recurringTransactionId) throw new Error('recurringTransactionId is required.');
  return api.get(`/recurring/${requireUserId()}/${recurringTransactionId}/required`);
}

export async function getRecurringOverview() {
  return api.get(`/recurring/${requireUserId()}/overview`);
}

export async function createRecurringTransaction(payload) {
  return api.post(`/recurring/${requireUserId()}`, payload);
}

export async function updateRecurringTransaction(recurringId, payload) {
  return api.put(`/recurring/${requireUserId()}/${recurringId}`, payload);
}

export async function deleteRecurringTransaction(recurringId) {
  return api.del(`/recurring/${requireUserId()}/${recurringId}`);
}

export default {
  getRecurringTransactions,
  getRecurringTransaction,
  getRequiredRecurringTransaction,
  getRecurringOverview,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
};
