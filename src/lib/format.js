/**
 * Formatting + normalisation helpers.
 *
 * The backend returns numeric columns as strings (Postgres `numeric`).
 * Everything the UI displays passes through here first so that charts,
 * sums and animations always receive real numbers.
 */

export const CURRENCY = 'INR';

export function num(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function unwrap(response) {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

/* --------------------------------------------------------------------------
   Currency
   -------------------------------------------------------------------------- */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value, { precise = false } = {}) {
  const n = num(value);
  return (precise ? inrPrecise : inr).format(n);
}

/** Compact form for chart axes and tight cards: ₹1.2L, ₹34.5k */
export function moneyShort(value) {
  const n = num(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}k`;
  return `${sign}₹${abs.toFixed(0)}`;
}

export function percent(value, digits = 0) {
  const n = num(value);
  if (!Number.isFinite(n)) return '0%';
  return `${n.toFixed(digits)}%`;
}

/* --------------------------------------------------------------------------
   Dates
   -------------------------------------------------------------------------- */

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function prettyDate(value, opts = {}) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
}

export function shortDate(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function monthLabel(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function relativeTime(value) {
  const date = toDate(value);
  if (!date) return '—';

  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;

  return prettyDate(date);
}

/** `YYYY-MM-DD` for <input type="date"> and API payloads. */
export function dateInput(value) {
  const date = toDate(value);
  if (!date) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

export function daysUntil(value) {
  const date = toDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(date);
  then.setHours(0, 0, 0, 0);
  return Math.round((then - today) / 86400000);
}

/* --------------------------------------------------------------------------
   Domain helpers
   -------------------------------------------------------------------------- */

export function transactionSign(type) {
  return String(type).toUpperCase() === 'INCOME' ? 1 : -1;
}

export function initials(text = '') {
  return String(text)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase() || '?';
}

export function titleCase(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* --------------------------------------------------------------------------
   Normalisers — flatten DB rows into the shapes the UI renders.
   -------------------------------------------------------------------------- */

export function normaliseAccount(row) {
  return {
    id: row.account_id,
    name: row.account_name ?? 'Account',
    type: row.account_type ?? 'BANK',
    balance: num(row.balance),
    currency: row.currency ?? CURRENCY,
    active: row.is_active !== false,
    owner: row.full_name ?? null,
    raw: row,
  };
}

export function normaliseCategory(row) {
  return {
    id: row.category_id,
    name: row.category_name ?? 'Category',
    type: String(row.category_type ?? 'EXPENSE').toUpperCase(),
    description: row.description ?? '',
    spent: num(row.total_spent),
    transactions: num(row.transactions),
    raw: row,
  };
}

export function normaliseTransaction(row) {
  return {
    id: row.transaction_id,
    amount: num(row.amount),
    type: String(row.transaction_type ?? 'EXPENSE').toUpperCase(),
    description: row.description ?? 'Transaction',
    date: row.transaction_date ?? row.created_at,
    accountId: row.account_id,
    accountName: row.account_name ?? `Account ${row.account_id}`,
    categoryId: row.category_id,
    categoryName: row.category_name ?? 'Uncategorised',
    raw: row,
  };
}

export function normaliseBudget(row, performance = []) {
  const perf =
    performance.find(
      (p) => Number(p.budget_id) === Number(row.budget_id),
    ) ?? {};

  return {
    id: row.budget_id,
    categoryId: row.category_id,
    categoryName: row.category_name ?? perf.category_name ?? 'Budget',
    amount: num(row.budget_amount ?? perf.budget_amount),
    spent: num(perf.actual_spending),
    remaining: num(
      perf.remaining_budget ?? num(row.budget_amount) - num(perf.actual_spending),
    ),
    startDate: row.start_date,
    endDate: row.end_date,
    raw: row,
  };
}

export function normaliseGoal(row) {
  const target = num(row.target_amount);
  const saved = num(row.current_amount);
  const progress =
    target > 0 ? clamp((saved / target) * 100, 0, 100) : 0;

  return {
    id: row.goal_id,
    name: row.goal_name ?? 'Goal',
    target,
    saved,
    remaining: Math.max(target - saved, 0),
    progress,
    targetDate: row.target_date,
    status: String(row.status ?? 'ACTIVE').toUpperCase(),
    raw: row,
  };
}

export function normaliseDebt(row) {
  const principal = num(row.principal_amount);
  const remaining = num(row.remaining_amount);
  const repaid = Math.max(principal - remaining, 0);

  return {
    id: row.debt_id,
    name: row.debt_name ?? 'Debt',
    lender: row.lender ?? '—',
    principal,
    remaining,
    repaid,
    progress: principal > 0 ? clamp((repaid / principal) * 100, 0, 100) : 0,
    interestRate: num(row.interest_rate),
    minimumPayment: num(row.minimum_payment),
    dueDate: row.due_date,
    status: String(row.debt_status ?? 'ACTIVE').toUpperCase(),
    raw: row,
  };
}

export function normaliseRecurring(row) {
  return {
    id: row.recurring_id,
    amount: num(row.amount),
    type: String(row.transaction_type ?? 'EXPENSE').toUpperCase(),
    frequency: String(row.frequency ?? 'MONTHLY').toUpperCase(),
    description: row.description ?? 'Recurring payment',
    accountId: row.account_id,
    categoryId: row.category_id,
    startDate: row.start_date,
    nextRunDate: row.next_run_date,
    endDate: row.end_date,
    active: row.is_active !== false,
    raw: row,
  };
}

/** Convert an arbitrary monthly/periodic amount into a monthly figure. */
export function monthlyEquivalent(amount, frequency) {
  switch (String(frequency).toUpperCase()) {
    case 'DAILY':
      return num(amount) * 30;
    case 'WEEKLY':
      return (num(amount) * 52) / 12;
    case 'YEARLY':
      return num(amount) / 12;
    case 'MONTHLY':
    default:
      return num(amount);
  }
}

/** Sum a list of numbers produced by a selector. */
export function sumBy(list, selector) {
  return asArray(list).reduce((total, item) => total + num(selector(item)), 0);
}
