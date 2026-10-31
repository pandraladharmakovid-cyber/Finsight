/**
 * FinSight API client.
 *
 * Every request goes through this single module so that:
 *  - the base URL is resolved once (relative `/api` by default),
 *  - failures become predictable `ApiError` instances,
 *  - the UI can show meaningful messages instead of "fetch failed".
 */

const RAW_BASE =
  import.meta.env.VITE_API_BASE_URL || '/api';

export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

export const USER_ID = Number(
  import.meta.env.VITE_FINSIGHT_USER_ID || 1,
);

const DEFAULT_TIMEOUT = 20000;

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path) {
  if (!path) return API_BASE_URL;

  if (/^https?:\/\//i.test(path)) return path;

  return `${API_BASE_URL}/${String(path).replace(/^\/+/, '')}`;
}

function messageFrom(payload, fallback) {
  if (typeof payload === 'string' && payload.trim()) return payload;

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
    if (Array.isArray(payload.errors) && payload.errors.length) {
      return payload.errors
        .map((e) => (typeof e === 'string' ? e : e?.message))
        .filter(Boolean)
        .join(', ');
    }
  }

  return fallback;
}

export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
    signal,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const finalHeaders = { Accept: 'application/json', ...headers };
  let payload = body;

  if (
    body !== undefined &&
    body !== null &&
    typeof body !== 'string' &&
    !(body instanceof FormData)
  ) {
    payload = JSON.stringify(body);
    finalHeaders['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: finalHeaders,
      body: method === 'GET' || method === 'HEAD' ? undefined : payload,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      throw new ApiError(
        messageFrom(data, `Request failed (${response.status})`),
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error?.name === 'AbortError') {
      throw new ApiError('The request timed out. Is the API running?', 408);
    }

    throw new ApiError(
      'Cannot reach the FinSight API. Start the backend and try again.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

export const get = (path, options) => request(path, { ...options, method: 'GET' });
export const post = (path, body, options) =>
  request(path, { ...options, method: 'POST', body });
export const put = (path, body, options) =>
  request(path, { ...options, method: 'PUT', body });
export const del = (path, options) =>
  request(path, { ...options, method: 'DELETE' });

/* --------------------------------------------------------------------------
   ENDPOINT MAP — one place that mirrors the Express routes.
   -------------------------------------------------------------------------- */

export const api = {
  userId: USER_ID,

  health: () => get('/health'),
  meta: () => get('/meta'),

  user: () => get(`/users/${USER_ID}`),
  updateUser: (payload) => put(`/users/${USER_ID}`, payload),

  dashboard: () => get(`/dashboard/${USER_ID}`),

  categories: () => get(`/categories`),
  createCategory: (payload) =>
    post('/categories', { ...payload, userId: USER_ID }),
  updateCategory: (id, payload) => put(`/categories/${id}`, payload),
  deleteCategory: (id) => del(`/categories/${id}`),

  transactions: (query = '') =>
    get(`/transactions/${USER_ID}${query ? `?${query}` : ''}`),
  transactionSummary: () => get(`/transactions/${USER_ID}/summary`),
  createTransaction: (payload) =>
    post(`/transactions/${USER_ID}`, payload),
  updateTransaction: (id, payload) =>
    put(`/transactions/${USER_ID}/${id}`, payload),
  deleteTransaction: (id) => del(`/transactions/${USER_ID}/${id}`),

  accounts: () => get(`/accounts/${USER_ID}`),
  accountSummary: () => get(`/accounts/${USER_ID}/summary`),
  createAccount: (payload) => post(`/accounts/${USER_ID}`, payload),
  updateAccount: (id, payload) => put(`/accounts/${USER_ID}/${id}`, payload),
  deleteAccount: (id) => del(`/accounts/${USER_ID}/${id}`),

  budgets: () => get(`/budgets/${USER_ID}`),
  budgetPerformance: () => get(`/budgets/${USER_ID}/performance`),
  budgetSummary: () => get(`/budgets/${USER_ID}/summary`),
  createBudget: (payload) => post(`/budgets/${USER_ID}`, payload),
  updateBudget: (id, payload) => put(`/budgets/${USER_ID}/${id}`, payload),
  deleteBudget: (id) => del(`/budgets/${USER_ID}/${id}`),

  savings: () => get(`/savings/${USER_ID}`),
  savingsOverview: () => get(`/savings/${USER_ID}/overview`),
  createSavingsGoal: (payload) => post(`/savings/${USER_ID}`, payload),
  updateSavingsGoal: (id, payload) =>
    put(`/savings/${USER_ID}/${id}`, payload),
  deleteSavingsGoal: (id) => del(`/savings/${USER_ID}/${id}`),

  debts: () => get(`/debts/${USER_ID}`),
  debtOverview: () => get(`/debts/${USER_ID}/overview`),
  createDebt: (payload) => post(`/debts/${USER_ID}`, payload),
  updateDebt: (id, payload) => put(`/debts/${USER_ID}/${id}`, payload),
  deleteDebt: (id) => del(`/debts/${USER_ID}/${id}`),

  recurring: () => get(`/recurring/${USER_ID}`),
  recurringOverview: () => get(`/recurring/${USER_ID}/overview`),
  createRecurring: (payload) => post(`/recurring/${USER_ID}`, payload),
  updateRecurring: (id, payload) =>
    put(`/recurring/${USER_ID}/${id}`, payload),
  deleteRecurring: (id) => del(`/recurring/${USER_ID}/${id}`),

  analyticsFinancial: () => get(`/analytics/${USER_ID}/financial`),
  analyticsSpending: () => get(`/analytics/${USER_ID}/spending`),

  audit: (limit = 100) => get(`/audit/${USER_ID}?limit=${limit}`),
  auditOverview: () => get(`/audit/${USER_ID}/overview`),
};

export default api;
