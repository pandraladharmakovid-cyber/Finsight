import api from './api.js';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

function requireUserId() {
  return USER_ID;
}

export async function getDebts() {
  return api.get(`/debts/${requireUserId()}`);
}

export async function getDebt(debtId) {
  if (!debtId) throw new Error('debtId is required.');
  return api.get(`/debts/${requireUserId()}/${debtId}`);
}

export async function getRequiredDebt(debtId) {
  if (!debtId) throw new Error('debtId is required.');
  return api.get(`/debts/${requireUserId()}/${debtId}/required`);
}

export async function getDebtSummary() {
  return api.get(`/debts/${requireUserId()}/summary`);
}

export async function getDebtOverview() {
  return api.get(`/debts/${requireUserId()}/overview`);
}

export async function createDebt(payload) {
  return api.post(`/debts/${requireUserId()}`, payload);
}

export async function updateDebt(debtId, payload) {
  return api.put(`/debts/${requireUserId()}/${debtId}`, payload);
}

export async function deleteDebt(debtId) {
  return api.del(`/debts/${requireUserId()}/${debtId}`);
}

export default {
  getDebts,
  getDebt,
  getRequiredDebt,
  getDebtSummary,
  getDebtOverview,
  createDebt,
  updateDebt,
  deleteDebt,
};
