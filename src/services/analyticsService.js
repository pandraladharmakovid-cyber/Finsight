import api from './api.js';

const USER_ID =
  import.meta.env.VITE_FINSIGHT_USER_ID;

function requireUserId() {
  if (!USER_ID) {
    throw new Error(
      'VITE_FINSIGHT_USER_ID is not configured.',
    );
  }

  return USER_ID;
}

/**
 * Complete financial analytics.
 *
 * Source of truth:
 * PostgreSQL analytical views through
 * the FinSight backend API.
 */
export async function getFinancialAnalytics() {
  const userId = requireUserId();

  return api.get(
    `/analytics/${userId}/financial`,
  );
}

/**
 * Spending analytics:
 * category spending + monthly
 * expense analysis.
 */
export async function getSpendingAnalytics() {
  const userId = requireUserId();

  return api.get(
    `/analytics/${userId}/spending`,
  );
}

/**
 * Account analytics:
 * account balances and related
 * account-level financial data.
 */
export async function getAccountAnalytics() {
  const userId = requireUserId();

  return api.get(
    `/analytics/${userId}/accounts`,
  );
}

/**
 * Budget analytics:
 * PostgreSQL budget performance
 * calculations.
 */
export async function getBudgetAnalytics() {
  const userId = requireUserId();

  return api.get(
    `/analytics/${userId}/budgets`,
  );
}

/**
 * Debt analytics:
 * PostgreSQL debt summary data.
 */
export async function getDebtAnalytics() {
  const userId = requireUserId();

  return api.get(
    `/analytics/${userId}/debts`,
  );
}

/**
 * Savings analytics:
 * PostgreSQL savings progress data.
 */
export async function getSavingsAnalytics() {
  const userId = requireUserId();

  return api.get(
    `/analytics/${userId}/savings`,
  );
}

export default {
  getFinancialAnalytics,
  getSpendingAnalytics,
  getAccountAnalytics,
  getBudgetAnalytics,
  getDebtAnalytics,
  getSavingsAnalytics,
};