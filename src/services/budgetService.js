import api from './api.js';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

function requireUserId() {
  return USER_ID;
}

export async function getBudgets() {
  return api.get(`/budgets/${requireUserId()}`);
}

export async function getBudget(budgetId) {
  if (!budgetId) throw new Error('budgetId is required.');
  return api.get(`/budgets/${requireUserId()}/${budgetId}`);
}

export async function getRequiredBudget(budgetId) {
  if (!budgetId) throw new Error('budgetId is required.');
  return api.get(`/budgets/${requireUserId()}/${budgetId}/required`);
}

export async function getBudgetSummary() {
  return api.get(`/budgets/${requireUserId()}/summary`);
}

export async function getBudgetPerformance() {
  return api.get(`/budgets/${requireUserId()}/performance`);
}

export async function createBudget(payload) {
  return api.post(`/budgets/${requireUserId()}`, payload);
}

export async function updateBudget(budgetId, payload) {
  return api.put(`/budgets/${requireUserId()}/${budgetId}`, payload);
}

export async function deleteBudget(budgetId) {
  return api.del(`/budgets/${requireUserId()}/${budgetId}`);
}

export default {
  getBudgets,
  getBudget,
  getRequiredBudget,
  getBudgetSummary,
  getBudgetPerformance,
  createBudget,
  updateBudget,
  deleteBudget,
};
