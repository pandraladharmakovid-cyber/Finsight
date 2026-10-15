import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Download,
  Edit3,
  Filter,
  Layers3,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react';
import TransactionForm from '../components/transactions/TransactionForm.jsx';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Rent & Housing',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Salary',
  'Freelance',
  'Investments',
];

const DEFAULT_ACCOUNTS = [
  'Primary Checking',
  'Savings Account',
  'Credit Card',
  'Cash Wallet',
];

const EMPTY_SUMMARY = {
  total: 0,
  income: 0,
  expenses: 0,
  net: 0,
};

function normalizeTransaction(item, index) {
  const amount = Number(
    item?.amount ??
      item?.transaction_amount ??
      item?.value ??
      0,
  );

  const rawType = String(
    item?.transaction_type ??
      item?.type ??
      item?.flow_type ??
      '',
  ).toLowerCase();

  const type =
    rawType.includes('income') ||
    rawType.includes('credit') ||
    rawType.includes('deposit')
      ? 'income'
      : rawType.includes('transfer')
        ? 'transfer'
        : 'expense';

  return {
    id:
      item?.transaction_id ??
      item?.id ??
      item?.transactionId ??
      `transaction-${index}`,
    description:
      item?.description ??
      item?.merchant ??
      item?.payee ??
      item?.name ??
      'Untitled transaction',
    category:
      item?.category_name ??
      item?.category ??
      item?.categoryName ??
      'Uncategorized',
    account:
      item?.account_name ??
      item?.account ??
      item?.accountName ??
      'Primary Checking',
    accountId: item?.account_id ?? item?.accountId ?? null,
    categoryId: item?.category_id ?? item?.categoryId ?? null,
    date:
      item?.transaction_date ??
      item?.date ??
      item?.created_at ??
      item?.createdAt ??
      null,
    amount: Math.abs(amount),
    signedAmount:
      type === 'income'
        ? Math.abs(amount)
        : type === 'expense'
          ? -Math.abs(amount)
          : amount,
    type,
    status:
      item?.status ??
      item?.transaction_status ??
      'completed',
    notes: item?.notes ?? item?.note ?? '',
  };
}

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.transactions)) {
    return payload.data.transactions;
  }
  if (Array.isArray(payload?.transactions)) {
    return payload.transactions;
  }
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function extractSummary(payload) {
  const source =
    payload?.data?.summary ??
    payload?.summary ??
    payload?.data ??
    payload ??
    {};

  return {
    total: Number(
      source?.total ??
        source?.transactionCount ??
        source?.transaction_count ??
        source?.count ??
        0,
    ),
    income: Number(
      source?.income ??
        source?.totalIncome ??
        source?.total_income ??
        source?.income_total ??
        0,
    ),
    expenses: Number(
      source?.expenses ??
        source?.expense ??
        source?.totalExpenses ??
        source?.total_expenses ??
        source?.expense_total ??
        0,
    ),
    net: Number(
      source?.net ??
        source?.netCashFlow ??
        source?.net_flow ??
        source?.net_income ??
        0,
    ),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatRelativeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;

  return formatDate(value);
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  positive,
  negative,
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-white">
            {value}
          </p>

          <p
            className={`mt-2 text-xs ${
              positive
                ? 'text-emerald-400'
                : negative
                  ? 'text-rose-400'
                  : 'text-slate-500'
            }`}
          >
            {helper}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <Icon size={20} className="text-violet-300" />
        </div>
      </div>
    </article>
  );
}

function TypePill({ type }) {
  const config = {
    income: {
      label: 'Income',
      icon: ArrowDownLeft,
      className:
        'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    },
    expense: {
      label: 'Expense',
      icon: ArrowUpRight,
      className: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    },
    transfer: {
      label: 'Transfer',
      icon: Layers3,
      className: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    },
  };

  const current = config[type] || config.expense;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${current.className}`}
    >
      <Icon size={11} />
      {current.label}
    </span>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || 'completed').toLowerCase();

  const isPending = normalized.includes('pending');
  const isFailed =
    normalized.includes('failed') ||
    normalized.includes('cancel');

  const className = isFailed
    ? 'border-rose-400/20 bg-rose-400/10 text-rose-300'
    : isPending
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
      : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

function EmptyTransactions({ onAdd }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.06]">
          <WalletCards size={32} className="text-violet-300" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white">
        No transactions found
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Start recording your income and expenses directly into PostgreSQL.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg"
      >
        <Plus size={15} />
        Add your first transaction
      </button>
    </div>
  );
}

function TransactionRow({ transaction, onSelect }) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className="group grid w-full grid-cols-[minmax(220px,1.5fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_minmax(130px,0.7fr)_minmax(140px,0.8fr)] items-center gap-4 border-b border-white/[0.06] px-5 py-4 text-left transition hover:bg-white/[0.035]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
            isIncome
              ? 'border-emerald-400/20 bg-emerald-400/10'
              : isTransfer
                ? 'border-sky-400/20 bg-sky-400/10'
                : 'border-rose-400/20 bg-rose-400/10'
          }`}
        >
          {isIncome ? (
            <ArrowDownLeft size={17} className="text-emerald-300" />
          ) : isTransfer ? (
            <Layers3 size={17} className="text-sky-300" />
          ) : (
            <ArrowUpRight size={17} className="text-rose-300" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {transaction.description}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {transaction.notes || transaction.account}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm text-slate-300">
          {transaction.category}
        </p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm text-slate-400">
          {transaction.account}
        </p>
      </div>

      <div>
        <p className="text-sm text-slate-300">
          {formatDate(transaction.date)}
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          {formatRelativeDate(transaction.date)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className={`text-sm font-bold ${
              isIncome
                ? 'text-emerald-300'
                : isTransfer
                  ? 'text-sky-300'
                  : 'text-rose-300'
            }`}
          >
            {isIncome ? '+' : isTransfer ? '' : '-'}
            {formatCurrency(transaction.amount)}
          </p>

          <div className="mt-1">
            <StatusPill status={transaction.status} />
          </div>
        </div>

        <MoreHorizontal
          size={17}
          className="text-slate-600 transition group-hover:text-slate-300"
        />
      </div>
    </button>
  );
}

function DetailDrawer({ transaction, onClose, onEdit, onDelete, deleting }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close transaction details"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#090b12] shadow-[-30px_0_100px_rgba(0,0,0,0.55)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#090b12]/90 px-6 py-5 backdrop-blur-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              Transaction intelligence
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Transaction details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-transparent p-6">
            <div className="flex items-center justify-between">
              <TypePill type={transaction.type} />
              <StatusPill status={transaction.status} />
            </div>

            <p className="mt-7 text-sm text-slate-500">Amount</p>

            <p
              className={`mt-1 text-4xl font-black tracking-tight ${
                transaction.type === 'income'
                  ? 'text-emerald-300'
                  : transaction.type === 'transfer'
                    ? 'text-sky-300'
                    : 'text-rose-300'
              }`}
            >
              {transaction.type === 'income'
                ? '+'
                : transaction.type === 'expense'
                  ? '-'
                  : ''}
              {formatCurrency(transaction.amount)}
            </p>

            <p className="mt-3 text-lg font-semibold text-white">
              {transaction.description}
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            {[
              ['Category', transaction.category],
              ['Account', transaction.account],
              ['Date', formatDate(transaction.date)],
              ['Status', transaction.status],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  {label}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-200">
                  {value || '—'}
                </p>
              </div>
            ))}
          </section>

          {transaction.notes && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Notes
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {transaction.notes}
              </p>
            </section>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]"
            >
              <Edit3 size={16} />
              Edit Transaction
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(transaction.id)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [dbAccounts, setDbAccounts] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Modal state for Create / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const loadTransactions = async ({ silent = false } = {}) => {
    if (!USER_ID) {
      setLoading(false);
      setError(
        'No FinSight user id is configured. Set VITE_FINSIGHT_USER_ID in the frontend environment.',
      );
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const encodedUserId = encodeURIComponent(USER_ID);

      const [transactionsResponse, summaryResponse, accountsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/transactions/${encodedUserId}`, {
            headers: { Accept: 'application/json' },
          }),
          fetch(`${API_BASE_URL}/transactions/${encodedUserId}/summary`, {
            headers: { Accept: 'application/json' },
          }),
          fetch(`${API_BASE_URL}/accounts/${encodedUserId}`, {
            headers: { Accept: 'application/json' },
          }).catch(() => null),
        ]);

      if (!transactionsResponse.ok) {
        throw new Error(
          `Transaction request failed with HTTP ${transactionsResponse.status}`,
        );
      }

      const transactionsPayload = await transactionsResponse.json();
      const transactionsData = extractArray(transactionsPayload).map(
        normalizeTransaction,
      );

      setTransactions(transactionsData);

      if (accountsResponse && accountsResponse.ok) {
        const accountsPayload = await accountsResponse.json();
        const extractedAccs = extractArray(accountsPayload)
          .map((a) => a.account_name ?? a.accountName ?? a.name)
          .filter(Boolean);
        setDbAccounts(extractedAccs);
      }

      if (summaryResponse.ok) {
        const summaryPayload = await summaryResponse.json();
        setSummary(extractSummary(summaryPayload));
      } else {
        const fallback = transactionsData.reduce(
          (accumulator, transaction) => {
            accumulator.total += 1;
            if (transaction.type === 'income') {
              accumulator.income += transaction.amount;
            }
            if (transaction.type === 'expense') {
              accumulator.expenses += transaction.amount;
            }
            accumulator.net = accumulator.income - accumulator.expenses;
            return accumulator;
          },
          { ...EMPTY_SUMMARY },
        );
        setSummary(fallback);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load transactions.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSaveTransaction = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      const encodedUserId = encodeURIComponent(USER_ID);
      const isEdit = Boolean(editingTransaction?.id);
      const url = isEdit
        ? `${API_BASE_URL}/transactions/${encodedUserId}/${editingTransaction.id}`
        : `${API_BASE_URL}/transactions/${encodedUserId}`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          transaction_type: formData.type.toUpperCase(),
          amount: Number(formData.amount),
          description: formData.description,
          category: formData.category,
          account: formData.account,
          transaction_date: formData.transactionDate,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to save transaction.');
      }

      setIsFormOpen(false);
      setEditingTransaction(null);
      await loadTransactions({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    setSubmitting(true);
    setError('');
    try {
      const encodedUserId = encodeURIComponent(USER_ID);
      const response = await fetch(
        `${API_BASE_URL}/transactions/${encodedUserId}/${transactionId}`,
        {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete transaction.');
      }

      setSelectedTransaction(null);
      await loadTransactions({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to delete transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = useMemo(() => {
    const fromTx = transactions
      .map((transaction) => transaction.category)
      .filter(Boolean);
    return [...new Set([...DEFAULT_CATEGORIES, ...fromTx])].sort();
  }, [transactions]);

  const accounts = useMemo(() => {
    const fromTx = transactions
      .map((transaction) => transaction.account)
      .filter(Boolean);
    return [...new Set([...dbAccounts, ...fromTx, ...DEFAULT_ACCOUNTS])].sort();
  }, [transactions, dbAccounts]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = transactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        [
          transaction.description,
          transaction.category,
          transaction.account,
          transaction.notes,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          );

      const matchesType =
        typeFilter === 'all' || transaction.type === typeFilter;

      const matchesCategory =
        categoryFilter === 'all' ||
        transaction.category === categoryFilter;

      const matchesAccount =
        accountFilter === 'all' ||
        transaction.account === accountFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        String(transaction.status).toLowerCase() ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesAccount &&
        matchesStatus
      );
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison =
          new Date(a.date || 0).getTime() -
          new Date(b.date || 0).getTime();
      }

      if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }

      if (sortBy === 'description') {
        comparison = a.description.localeCompare(b.description);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    accountFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const visibleIncome = useMemo(
    () =>
      filteredTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce(
          (total, transaction) => total + transaction.amount,
          0,
        ),
    [filteredTransactions],
  );

  const visibleExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce(
          (total, transaction) => total + transaction.amount,
          0,
        ),
    [filteredTransactions],
  );

  const activeFilterCount = [
    typeFilter !== 'all',
    categoryFilter !== 'all',
    accountFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setStatusFilter('all');
  };

  const exportTransactions = () => {
    if (!filteredTransactions.length) return;

    const headers = [
      'Description',
      'Category',
      'Account',
      'Date',
      'Type',
      'Amount',
      'Status',
    ];

    const rows = filteredTransactions.map((transaction) => [
      transaction.description,
      transaction.category,
      transaction.account,
      formatDate(transaction.date),
      transaction.type,
      transaction.amount,
      transaction.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? '').replaceAll('"', '""')}"`,
          )
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'finsight-transactions.csv';
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-full bg-transparent px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/[0.13] via-white/[0.035] to-transparent p-6 shadow-[0_30px_100px_rgba(0,0,0,0.25)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-violet-500/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[100px]" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                <Sparkles size={12} />
                Financial Intelligence
              </div>

              <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Transactions
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                A complete financial activity command center.
                Record, search, edit, and analyze your real PostgreSQL
                transaction history.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadTransactions({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? 'animate-spin' : ''}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportTransactions}
                disabled={!filteredTransactions.length}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={16} />
                Export
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTransaction(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-[0_10px_35px_rgba(139,92,246,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_45px_rgba(139,92,246,0.4)]"
              >
                <Plus size={17} />
                Add transaction
              </button>
            </div>
          </div>
        </section>

        {/* KPI GRID */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Transactions"
            value={(summary.total || transactions.length).toLocaleString('en-IN')}
            helper={`${filteredTransactions.length} visible in current view`}
            icon={Layers3}
          />

          <StatCard
            label="Income"
            value={formatCurrency(summary.income || visibleIncome)}
            helper="Recorded inflows"
            icon={TrendingUp}
            positive
          />

          <StatCard
            label="Expenses"
            value={formatCurrency(summary.expenses || visibleExpenses)}
            helper="Recorded outflows"
            icon={TrendingDown}
            negative
          />

          <StatCard
            label="Net flow"
            value={formatCurrency(
              summary.net || visibleIncome - visibleExpenses,
            )}
            helper="Income minus expenses"
            icon={WalletCards}
            positive={
              (summary.net || visibleIncome - visibleExpenses) >= 0
            }
            negative={
              (summary.net || visibleIncome - visibleExpenses) < 0
            }
          />
        </section>

        {/* CONTROL CENTER */}
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-[0_25px_100px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="border-b border-white/[0.07] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search merchant, category, account, notes..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-black/30"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition ${
                  showFilters || activeFilterCount
                    ? 'border-violet-400/30 bg-violet-400/10 text-violet-200'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <SlidersHorizontal size={17} />
                Advanced filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSortDirection((value) =>
                    value === 'asc' ? 'desc' : 'asc',
                  )
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08]"
              >
                <CalendarDays size={16} />
                {sortDirection === 'desc'
                  ? 'Newest first'
                  : 'Oldest first'}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <FilterSelect
                  label="Type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={[
                    ['all', 'All types'],
                    ['income', 'Income'],
                    ['expense', 'Expense'],
                    ['transfer', 'Transfer'],
                  ]}
                />

                <FilterSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    ['all', 'All categories'],
                    ...categories.map((category) => [
                      category,
                      category,
                    ]),
                  ]}
                />

                <FilterSelect
                  label="Account"
                  value={accountFilter}
                  onChange={setAccountFilter}
                  options={[
                    ['all', 'All accounts'],
                    ...accounts.map((account) => [account, account]),
                  ]}
                />

                <FilterSelect
                  label="Sort"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    ['date', 'Date'],
                    ['amount', 'Amount'],
                    ['description', 'Description'],
                  ]}
                />

                <div className="sm:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Filter size={14} />
                    {filteredTransactions.length} matching transaction
                    {filteredTransactions.length === 1 ? '' : 's'}
                  </div>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* LIVE FILTER SUMMARY */}
          <div className="grid gap-3 border-b border-white/[0.07] p-4 sm:grid-cols-3">
            <MiniMetric
              label="Visible income"
              value={formatCurrency(visibleIncome)}
              icon={ArrowDownLeft}
              className="text-emerald-300"
            />

            <MiniMetric
              label="Visible expenses"
              value={formatCurrency(visibleExpenses)}
              icon={ArrowUpRight}
              className="text-rose-300"
            />

            <MiniMetric
              label="Visible net"
              value={formatCurrency(visibleIncome - visibleExpenses)}
              icon={TrendingUp}
              className={
                visibleIncome - visibleExpenses >= 0
                  ? 'text-emerald-300'
                  : 'text-rose-300'
              }
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="m-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-amber-400/10 p-2 text-amber-300">
                  <Layers3 size={16} />
                </div>

                <div>
                  <p className="text-sm font-bold text-amber-200">
                    Transaction notice
                  </p>

                  <p className="mt-1 text-xs leading-6 text-amber-200/60">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_minmax(130px,0.7fr)_minmax(140px,0.8fr)] gap-4 border-b border-white/[0.06] bg-white/[0.015] px-5 py-3">
                {[
                  'Transaction',
                  'Category',
                  'Account',
                  'Date',
                  'Amount',
                ].map((heading) => (
                  <button
                    type="button"
                    key={heading}
                    onClick={() => {
                      if (heading === 'Date') setSortBy('date');
                      if (heading === 'Amount') setSortBy('amount');
                      if (heading === 'Transaction')
                        setSortBy('description');
                    }}
                    className="flex items-center gap-1 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:text-slate-300"
                  >
                    {heading}
                    {(heading === 'Date' && sortBy === 'date') ||
                    (heading === 'Amount' && sortBy === 'amount') ||
                    (heading === 'Transaction' &&
                      sortBy === 'description') ? (
                      <ChevronDown
                        size={12}
                        className={
                          sortDirection === 'asc' ? 'rotate-180' : ''
                        }
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-2xl bg-white/[0.035]"
                    />
                  ))}
                </div>
              ) : filteredTransactions.length ? (
                filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onSelect={setSelectedTransaction}
                  />
                ))
              ) : (
                <EmptyTransactions
                  onAdd={() => {
                    setEditingTransaction(null);
                    setIsFormOpen(true);
                  }}
                />
              )}
            </div>
          </div>

          {!loading && filteredTransactions.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredTransactions.length} of{' '}
                {transactions.length} transactions
              </span>

              <span>
                FinSight data source: PostgreSQL → API → React
              </span>
            </div>
          )}
        </section>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <TransactionForm
            mode={editingTransaction ? 'edit' : 'create'}
            initialValues={
              editingTransaction
                ? {
                    type: editingTransaction.type,
                    amount: editingTransaction.amount,
                    description: editingTransaction.description,
                    category: editingTransaction.category,
                    account: editingTransaction.account,
                    transactionDate: editingTransaction.date
                      ? new Date(editingTransaction.date)
                          .toISOString()
                          .slice(0, 10)
                      : '',
                    notes: editingTransaction.notes,
                  }
                : {}
            }
            categories={categories}
            accounts={accounts}
            submitting={submitting}
            onSubmit={handleSaveTransaction}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
          />
        </div>
      )}

      <DetailDrawer
        transaction={selectedTransaction}
        deleting={submitting}
        onClose={() => setSelectedTransaction(null)}
        onEdit={(tx) => {
          setSelectedTransaction(null);
          setEditingTransaction(tx);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteTransaction}
      />
    </main>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-3 pr-9 text-sm text-slate-300 outline-none transition focus:border-violet-400/40"
        >
          {options.map(([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
              className="bg-slate-950"
            >
              {optionLabel}
            </option>
          ))}
        </select>

        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
        />
      </div>
    </label>
  );
}

function MiniMetric({ label, value, icon: Icon, className }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
          {label}
        </p>

        <p className={`mt-1 text-sm font-black ${className}`}>
          {value}
        </p>
      </div>

      <Icon size={16} className={className} />
    </div>
  );
}