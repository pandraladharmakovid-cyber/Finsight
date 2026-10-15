// src/utils/constants.js

/* -------------------------------------------------------------------------- */
/* APPLICATION                                                                */
/* -------------------------------------------------------------------------- */

export const APP_CONFIG = {
  name: "FinSight",
  fullName: "FinSight — Personal Finance Management",
  version: "1.0.0",
  currency: "INR",
  locale: "en-IN",
  defaultCurrencySymbol: "₹",
};

/* -------------------------------------------------------------------------- */
/* TRANSACTION TYPES                                                          */
/* -------------------------------------------------------------------------- */

export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
};

export const TRANSACTION_TYPE_OPTIONS = [
  {
    value: TRANSACTION_TYPES.EXPENSE,
    label: "Expense",
  },
  {
    value: TRANSACTION_TYPES.INCOME,
    label: "Income",
  },
  {
    value: TRANSACTION_TYPES.TRANSFER,
    label: "Transfer",
  },
];

/* -------------------------------------------------------------------------- */
/* ACCOUNT TYPES                                                              */
/* -------------------------------------------------------------------------- */

export const ACCOUNT_TYPES = {
  BANK: "bank",
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  WALLET: "wallet",
  INVESTMENT: "investment",
  SAVINGS: "savings",
  OTHER: "other",
};

export const ACCOUNT_TYPE_OPTIONS = [
  {
    value: ACCOUNT_TYPES.BANK,
    label: "Bank Account",
  },
  {
    value: ACCOUNT_TYPES.CASH,
    label: "Cash",
  },
  {
    value: ACCOUNT_TYPES.CREDIT_CARD,
    label: "Credit Card",
  },
  {
    value: ACCOUNT_TYPES.DEBIT_CARD,
    label: "Debit Card",
  },
  {
    value: ACCOUNT_TYPES.WALLET,
    label: "Digital Wallet",
  },
  {
    value: ACCOUNT_TYPES.INVESTMENT,
    label: "Investment",
  },
  {
    value: ACCOUNT_TYPES.SAVINGS,
    label: "Savings Account",
  },
  {
    value: ACCOUNT_TYPES.OTHER,
    label: "Other",
  },
];

/* -------------------------------------------------------------------------- */
/* BUDGET                                                                      */
/* -------------------------------------------------------------------------- */

export const BUDGET_PERIODS = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
};

export const BUDGET_PERIOD_OPTIONS = [
  {
    value: BUDGET_PERIODS.WEEKLY,
    label: "Weekly",
  },
  {
    value: BUDGET_PERIODS.MONTHLY,
    label: "Monthly",
  },
  {
    value: BUDGET_PERIODS.QUARTERLY,
    label: "Quarterly",
  },
  {
    value: BUDGET_PERIODS.YEARLY,
    label: "Yearly",
  },
];

/* -------------------------------------------------------------------------- */
/* RECURRING TRANSACTIONS                                                      */
/* -------------------------------------------------------------------------- */

export const RECURRING_FREQUENCIES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
};

export const RECURRING_FREQUENCY_OPTIONS = [
  {
    value: RECURRING_FREQUENCIES.DAILY,
    label: "Daily",
  },
  {
    value: RECURRING_FREQUENCIES.WEEKLY,
    label: "Weekly",
  },
  {
    value: RECURRING_FREQUENCIES.BIWEEKLY,
    label: "Every 2 Weeks",
  },
  {
    value: RECURRING_FREQUENCIES.MONTHLY,
    label: "Monthly",
  },
  {
    value: RECURRING_FREQUENCIES.QUARTERLY,
    label: "Quarterly",
  },
  {
    value: RECURRING_FREQUENCIES.YEARLY,
    label: "Yearly",
  },
];

/* -------------------------------------------------------------------------- */
/* DEBT TYPES                                                                 */
/* -------------------------------------------------------------------------- */

export const DEBT_TYPES = {
  CREDIT_CARD: "credit_card",
  PERSONAL_LOAN: "personal_loan",
  EDUCATION_LOAN: "education_loan",
  HOME_LOAN: "home_loan",
  VEHICLE_LOAN: "vehicle_loan",
  MEDICAL: "medical",
  FAMILY: "family",
  OTHER: "other",
};

export const DEBT_TYPE_OPTIONS = [
  {
    value: DEBT_TYPES.CREDIT_CARD,
    label: "Credit Card",
  },
  {
    value: DEBT_TYPES.PERSONAL_LOAN,
    label: "Personal Loan",
  },
  {
    value: DEBT_TYPES.EDUCATION_LOAN,
    label: "Education Loan",
  },
  {
    value: DEBT_TYPES.HOME_LOAN,
    label: "Home Loan",
  },
  {
    value: DEBT_TYPES.VEHICLE_LOAN,
    label: "Vehicle Loan",
  },
  {
    value: DEBT_TYPES.MEDICAL,
    label: "Medical",
  },
  {
    value: DEBT_TYPES.FAMILY,
    label: "Family / Friend",
  },
  {
    value: DEBT_TYPES.OTHER,
    label: "Other",
  },
];

/* -------------------------------------------------------------------------- */
/* SAVINGS                                                                     */
/* -------------------------------------------------------------------------- */

export const SAVINGS_GOAL_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  PAUSED: "paused",
  CANCELLED: "cancelled",
};

/* -------------------------------------------------------------------------- */
/* UI STATUS                                                                   */
/* -------------------------------------------------------------------------- */

export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  COMPLETED: "completed",
  PAUSED: "paused",
  CANCELLED: "cancelled",
  OVERDUE: "overdue",
};

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

/* -------------------------------------------------------------------------- */
/* DASHBOARD PERIODS                                                          */
/* -------------------------------------------------------------------------- */

export const DASHBOARD_PERIODS = {
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  THREE_MONTHS: "three_months",
  SIX_MONTHS: "six_months",
  THIS_YEAR: "this_year",
  LAST_YEAR: "last_year",
};

export const DASHBOARD_PERIOD_OPTIONS = [
  {
    value: DASHBOARD_PERIODS.THIS_MONTH,
    label: "This Month",
  },
  {
    value: DASHBOARD_PERIODS.LAST_MONTH,
    label: "Last Month",
  },
  {
    value: DASHBOARD_PERIODS.THREE_MONTHS,
    label: "Last 3 Months",
  },
  {
    value: DASHBOARD_PERIODS.SIX_MONTHS,
    label: "Last 6 Months",
  },
  {
    value: DASHBOARD_PERIODS.THIS_YEAR,
    label: "This Year",
  },
  {
    value: DASHBOARD_PERIODS.LAST_YEAR,
    label: "Last Year",
  },
];

/* -------------------------------------------------------------------------- */
/* CHART CONFIGURATION                                                        */
/* -------------------------------------------------------------------------- */

export const CHART_COLORS = {
  income: "#22c55e",
  expense: "#ef4444",
  savings: "#8b5cf6",
  debt: "#f97316",
  budget: "#3b82f6",
  balance: "#06b6d4",
  investment: "#eab308",
};

export const CHART_DEFAULTS = {
  animationDuration: 800,
  animationEasing: "ease-out",
  gridOpacity: 0.08,
};

/* -------------------------------------------------------------------------- */
/* PAGINATION                                                                  */
/* -------------------------------------------------------------------------- */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  DASHBOARD_LIMIT: 10,
  MAX_LIMIT: 100,
};

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                  */
/* -------------------------------------------------------------------------- */

export const VALIDATION = {
  MIN_TRANSACTION_AMOUNT: 0.01,
  MAX_TRANSACTION_AMOUNT: 100_000_000,
  MIN_BUDGET_AMOUNT: 0.01,
  MIN_SAVINGS_TARGET: 0.01,
  MIN_DEBT_AMOUNT: 0.01,
  MAX_NAME_LENGTH: 120,
  MAX_NOTES_LENGTH: 1000,
};

/* -------------------------------------------------------------------------- */
/* STORAGE KEYS                                                                */
/* -------------------------------------------------------------------------- */

export const STORAGE_KEYS = {
  THEME: "finsight-theme",
  SIDEBAR_STATE: "finsight-sidebar-state",
  DASHBOARD_PERIOD: "finsight-dashboard-period",
  DASHBOARD_LAYOUT: "finsight-dashboard-layout",
  CURRENCY: "finsight-currency",
};

/* -------------------------------------------------------------------------- */
/* API                                                                         */
/* -------------------------------------------------------------------------- */

export const API = {
  HEALTH: "/api/health",

  ACCOUNTS: "/api/accounts",
  TRANSACTIONS: "/api/transactions",
  BUDGETS: "/api/budgets",
  SAVINGS: "/api/savings",
  DEBTS: "/api/debts",
  RECURRING: "/api/recurring",

  DASHBOARD: "/api/dashboard",
  ANALYTICS: "/api/analytics",
};

/* -------------------------------------------------------------------------- */
/* NAVIGATION                                                                  */
/* -------------------------------------------------------------------------- */

export const NAVIGATION = [
  {
    id: "overview",
    label: "Financial Overview",
    path: "/",
  },
  {
    id: "transactions",
    label: "Transactions",
    path: "/transactions",
  },
  {
    id: "accounts",
    label: "Accounts",
    path: "/accounts",
  },
  {
    id: "budgets",
    label: "Budgets",
    path: "/budgets",
  },
  {
    id: "savings",
    label: "Savings Goals",
    path: "/savings",
  },
  {
    id: "debts",
    label: "Debt Management",
    path: "/debts",
  },
  {
    id: "recurring",
    label: "Recurring",
    path: "/recurring",
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/analytics",
  },
];