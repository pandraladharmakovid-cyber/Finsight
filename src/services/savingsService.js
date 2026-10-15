import api from './api.js';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

function requireUserId() {
  return USER_ID;
}

export async function getSavingsGoals() {
  return api.get(`/savings/${requireUserId()}`);
}

export async function getSavingsGoal(goalId) {
  if (!goalId) throw new Error('goalId is required.');
  return api.get(`/savings/${requireUserId()}/${goalId}`);
}

export async function getRequiredSavingsGoal(goalId) {
  if (!goalId) throw new Error('goalId is required.');
  return api.get(`/savings/${requireUserId()}/${goalId}/required`);
}

export async function getSavingsSummary() {
  return api.get(`/savings/${requireUserId()}/overview`);
}

export async function getSavingsOverview() {
  return api.get(`/savings/${requireUserId()}/overview`);
}

export async function createSavingsGoal(payload) {
  return api.post(`/savings/${requireUserId()}`, payload);
}

export async function updateSavingsGoal(goalId, payload) {
  return api.put(`/savings/${requireUserId()}/${goalId}`, payload);
}

export async function deleteSavingsGoal(goalId) {
  return api.del(`/savings/${requireUserId()}/${goalId}`);
}

export default {
  getSavingsGoals,
  getSavingsGoal,
  getRequiredSavingsGoal,
  getSavingsSummary,
  getSavingsOverview,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
};
