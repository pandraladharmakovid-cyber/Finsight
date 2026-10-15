import api from './api.js';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

function requireUserId() {
  return USER_ID;
}

export async function getAccounts() {
  return api.get(`/accounts/${requireUserId()}`);
}

export async function getActiveAccounts() {
  return api.get(`/accounts/${requireUserId()}/active`);
}

export async function getAccount(accountId) {
  if (!accountId) throw new Error('accountId is required.');
  return api.get(`/accounts/${requireUserId()}/${accountId}`);
}

export async function getAccountSummary() {
  return api.get(`/accounts/${requireUserId()}/summary`);
}

export async function getRequiredAccount(accountId) {
  if (!accountId) throw new Error('accountId is required.');
  return api.get(`/accounts/${requireUserId()}/${accountId}/required`);
}

export async function createAccount(payload) {
  return api.post(`/accounts/${requireUserId()}`, payload);
}

export async function updateAccount(accountId, payload) {
  return api.put(`/accounts/${requireUserId()}/${accountId}`, payload);
}

export async function deleteAccount(accountId) {
  return api.del(`/accounts/${requireUserId()}/${accountId}`);
}

export default {
  getAccounts,
  getActiveAccounts,
  getAccount,
  getAccountSummary,
  getRequiredAccount,
  createAccount,
  updateAccount,
  deleteAccount,
};
