import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  DollarSign,
  Edit3,
  Eye,
  EyeOff,
  Landmark,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

const EMPTY_SUMMARY = {
  totalAccounts: 0,
  totalBalance: 0,
  assets: 0,
  liabilities: 0,
};

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.accounts)) return payload.accounts;
  if (Array.isArray(payload?.data?.accounts)) {
    return payload.data.accounts;
  }
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function normalizeAccount(item, index) {
  const rawType = String(
    item?.account_type ??
      item?.type ??
      item?.accountType ??
      'checking',
  ).toLowerCase();

  const type = rawType.includes('credit')
    ? 'credit'
    : rawType.includes('cash')
      ? 'cash'
      : rawType.includes('saving')
        ? 'savings'
        : rawType.includes('checking')
          ? 'checking'
          : rawType.includes('bank')
            ? 'bank'
            : rawType.includes('investment')
              ? 'investment'
              : rawType.includes('loan')
                ? 'loan'
                : 'other';

  const balance = Number(
    item?.balance ??
      item?.current_balance ??
      item?.currentBalance ??
      item?.amount ??
      0,
  );

  return {
    id:
      item?.account_id ??
      item?.id ??
      item?.accountId ??
      `account-${index}`,
    name:
      item?.account_name ??
      item?.name ??
      item?.accountName ??
      'Unnamed account',
    institution:
      item?.institution ??
      item?.bank_name ??
      item?.bankName ??
      item?.provider ??
      'FinSight Connected Account',
    type,
    rawAccountType: item?.account_type ?? 'CHECKING',
    balance,
    currency: item?.currency ?? 'INR',
    status: item?.is_active === false ? 'inactive' : (item?.status ?? 'active'),
    isActive: item?.is_active !== false,
    mask:
      item?.last_four ??
      item?.lastFour ??
      item?.account_number_last4 ??
      null,
    description:
      item?.description ??
      item?.notes ??
      '',
    createdAt:
      item?.created_at ??
      item?.createdAt ??
      null,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatCompactCurrency(value) {
  const amount = Number(value) || 0;
  const absolute = Math.abs(amount);

  if (absolute >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }

  if (absolute >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }

  if (absolute >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
}

function getAccountIcon(type) {
  switch (type) {
    case 'bank':
    case 'checking':
      return Building2;
    case 'savings':
      return Landmark;
    case 'credit':
      return CreditCard;
    case 'investment':
      return TrendingUp;
    case 'loan':
      return DollarSign;
    case 'cash':
      return Wallet;
    default:
      return WalletCards;
  }
}

function getAccountGradient(type) {
  switch (type) {
    case 'savings':
      return 'from-emerald-500/20 via-emerald-400/5 to-transparent';
    case 'checking':
    case 'bank':
      return 'from-sky-500/20 via-sky-400/5 to-transparent';
    case 'credit':
      return 'from-rose-500/20 via-rose-400/5 to-transparent';
    case 'investment':
      return 'from-violet-500/20 via-violet-400/5 to-transparent';
    case 'loan':
      return 'from-amber-500/20 via-amber-400/5 to-transparent';
    case 'cash':
      return 'from-cyan-500/20 via-cyan-400/5 to-transparent';
    default:
      return 'from-slate-500/20 via-slate-400/5 to-transparent';
  }
}

function getAccountAccent(type) {
  switch (type) {
    case 'savings':
      return 'text-emerald-300';
    case 'checking':
    case 'bank':
      return 'text-sky-300';
    case 'credit':
      return 'text-rose-300';
    case 'investment':
      return 'text-violet-300';
    case 'loan':
      return 'text-amber-300';
    case 'cash':
      return 'text-cyan-300';
    default:
      return 'text-slate-300';
  }
}

function AccountTypePill({ type }) {
  const labels = {
    savings: 'Savings',
    checking: 'Checking',
    bank: 'Bank',
    credit: 'Credit',
    investment: 'Investment',
    loan: 'Loan',
    cash: 'Cash',
    other: 'Other',
  };

  return (
    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
      {labels[type] || 'Other'}
    </span>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || 'active').toLowerCase();
  const active = normalized === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        active
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
          : 'border-amber-400/20 bg-amber-400/10 text-amber-300'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = 'text-violet-300',
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <Icon size={19} className={accent} />
        </div>
      </div>
    </article>
  );
}

function AccountCard({ account, onSelect }) {
  const Icon = getAccountIcon(account.type);
  const accent = getAccountAccent(account.type);

  return (
    <button
      type="button"
      onClick={() => onSelect(account)}
      className={`group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${getAccountGradient(
        account.type,
      )} p-5 text-left shadow-[0_20px_70px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_25px_90px_rgba(0,0,0,0.3)]`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/[0.04] blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 ${accent}`}
          >
            <Icon size={21} />
          </div>

          <div className="flex items-center gap-2">
            <StatusPill status={account.status} />
            <MoreHorizontal
              size={18}
              className="text-slate-600 transition group-hover:text-slate-300"
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="truncate text-lg font-black text-white">
            {account.name}
          </p>

          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="truncate text-xs text-slate-500">
              {account.institution}
            </p>

            {account.mask && (
              <>
                <span className="text-slate-700">•</span>
                <span className="text-xs text-slate-600">
                  •••• {account.mask}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Current balance
            </p>

            <p className={`mt-2 text-2xl font-black tracking-tight ${accent}`}>
              {formatCurrency(account.balance)}
            </p>
          </div>

          <AccountTypePill type={account.type} />
        </div>

        <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full bg-current ${accent}`}
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  8,
                  (Math.abs(account.balance) /
                    Math.max(
                      1,
                      Math.abs(account.balance) +
                        Math.abs(account.balance) * 0.35,
                    )) *
                    100,
                ),
              )}%`,
            }}
          />
        </div>
      </div>
    </button>
  );
}

function AccountFormModal({
  isOpen,
  initialValues,
  submitting,
  onClose,
  onSubmit,
}) {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('CHECKING');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setAccountName(initialValues.name || '');
      setAccountType(
        String(initialValues.rawAccountType || initialValues.type || 'CHECKING').toUpperCase(),
      );
      setBalance(initialValues.balance !== undefined ? String(initialValues.balance) : '0');
      setCurrency(initialValues.currency || 'INR');
      setIsActive(initialValues.isActive !== false);
    } else {
      setAccountName('');
      setAccountType('CHECKING');
      setBalance('');
      setCurrency('INR');
      setIsActive(true);
    }
    setFormError('');
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setFormError('Account name is required.');
      return;
    }
    await onSubmit({
      account_name: accountName.trim(),
      account_type: accountType,
      balance: Number(balance) || 0,
      currency: currency || 'INR',
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0f19] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
              Wealth Infrastructure
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {initialValues ? 'Edit Account' : 'Add New Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {formError && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {formError}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Name *
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. HDFC Primary Savings"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-400"
              >
                <option value="CHECKING" className="bg-slate-950">Checking</option>
                <option value="SAVINGS" className="bg-slate-950">Savings</option>
                <option value="CREDIT" className="bg-slate-950">Credit Card</option>
                <option value="INVESTMENT" className="bg-slate-950">Investment</option>
                <option value="CASH" className="bg-slate-950">Cash Wallet</option>
                <option value="LOAN" className="bg-slate-950">Loan</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Balance (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="text-xs font-bold text-slate-300">Active Account</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/[0.08]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-xs font-black text-white shadow-lg disabled:opacity-50"
          >
            {submitting
              ? 'Saving...'
              : initialValues
                ? 'Update Account'
                : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AccountDrawer({ account, onClose, onEdit, onDelete, deleting }) {
  if (!account) return null;

  const Icon = getAccountIcon(account.type);
  const accent = getAccountAccent(account.type);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close account details"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#090b12] shadow-[-30px_0_100px_rgba(0,0,0,0.55)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#090b12]/90 px-6 py-5 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
              Account intelligence
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Account details
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
          <section
            className={`relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${getAccountGradient(
              account.type,
            )} p-6`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 ${accent}`}
              >
                <Icon size={25} />
              </div>

              <StatusPill status={account.status} />
            </div>

            <p className="mt-7 text-sm text-slate-500">
              Current balance
            </p>

            <p className={`mt-1 text-4xl font-black ${accent}`}>
              {formatCurrency(account.balance)}
            </p>

            <p className="mt-4 text-lg font-bold text-white">
              {account.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {account.institution}
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                Account type
              </p>

              <div className="mt-3">
                <AccountTypePill type={account.type} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                Currency
              </p>

              <p className="mt-3 text-sm font-bold text-slate-200">
                {account.currency}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                Account identifier
              </p>

              <p className="mt-3 text-sm font-bold text-slate-200">
                {account.mask ? `•••• ${account.mask}` : `#${account.id}`}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                Status
              </p>

              <div className="mt-3">
                <StatusPill status={account.status} />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => onEdit(account)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]"
            >
              <Edit3 size={16} />
              Edit Account
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(account.id)}
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

function EmptyAccounts({ onAdd }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.025] px-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.06]">
          <WalletCards size={32} className="text-violet-300" />
        </div>
      </div>

      <h3 className="text-xl font-black text-white">
        No accounts found
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Create your first financial account to start tracking balances and transactions.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg"
      >
        <Plus size={15} />
        Add your first account
      </button>
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showBalances, setShowBalances] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const loadAccounts = async ({ silent = false } = {}) => {
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

      const response = await fetch(
        `${API_BASE_URL}/accounts/${encodedUserId}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Account request failed with HTTP ${response.status}`,
        );
      }

      const payload = await response.json();

      const normalizedAccounts = extractArray(payload).map(
        normalizeAccount,
      );

      setAccounts(normalizedAccounts);

      const calculated = normalizedAccounts.reduce(
        (accumulator, account) => {
          const isLiability =
            account.type === 'credit' ||
            account.type === 'loan';

          accumulator.totalAccounts += 1;

          if (isLiability) {
            accumulator.liabilities += Math.abs(account.balance);
          } else {
            accumulator.assets += account.balance;
          }

          accumulator.totalBalance =
            accumulator.assets - accumulator.liabilities;

          return accumulator;
        },
        { ...EMPTY_SUMMARY },
      );

      setSummary(calculated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load accounts.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSaveAccount = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      const encodedUserId = encodeURIComponent(USER_ID);
      const isEdit = Boolean(editingAccount?.id);
      const url = isEdit
        ? `${API_BASE_URL}/accounts/${encodedUserId}/${editingAccount.id}`
        : `${API_BASE_URL}/accounts/${encodedUserId}`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to save account.');
      }

      setIsFormOpen(false);
      setEditingAccount(null);
      await loadAccounts({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to save account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    setSubmitting(true);
    setError('');
    try {
      const encodedUserId = encodeURIComponent(USER_ID);
      const response = await fetch(
        `${API_BASE_URL}/accounts/${encodedUserId}/${accountId}`,
        {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete account.');
      }

      setSelectedAccount(null);
      await loadAccounts({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to delete account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesSearch =
        !query ||
        [
          account.name,
          account.institution,
          account.type,
          account.mask,
          account.description,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          );

      const matchesType =
        typeFilter === 'all' || account.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [accounts, search, typeFilter]);

  const distribution = useMemo(() => {
    const counts = {};

    accounts.forEach((account) => {
      counts[account.type] = (counts[account.type] || 0) + 1;
    });

    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [accounts]);

  const assets = summary.assets;
  const liabilities = summary.liabilities;

  return (
    <main className="min-h-full bg-transparent px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-500/[0.12] via-violet-500/[0.06] to-transparent p-6 shadow-[0_30px_100px_rgba(0,0,0,0.25)] sm:p-8">
          <div className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-sky-500/10 blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-[110px]" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
                <Sparkles size={12} />
                Wealth Infrastructure
              </div>

              <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Accounts
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Your complete financial account layer. Monitor
                balances, separate assets from liabilities and
                manage every connected account in PostgreSQL.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowBalances((value) => !value)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.09]"
              >
                {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
                {showBalances ? 'Hide balances' : 'Show balances'}
              </button>

              <button
                type="button"
                onClick={() => loadAccounts({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.09] disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? 'animate-spin' : ''}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-[0_10px_35px_rgba(139,92,246,0.3)] transition hover:-translate-y-0.5"
              >
                <Plus size={17} />
                Add account
              </button>
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Net worth"
            value={
              showBalances
                ? formatCompactCurrency(summary.totalBalance)
                : '••••••'
            }
            helper="Assets minus liabilities"
            icon={WalletCards}
            accent={
              summary.totalBalance >= 0
                ? 'text-emerald-300'
                : 'text-rose-300'
            }
          />

          <MetricCard
            label="Total assets"
            value={
              showBalances ? formatCompactCurrency(assets) : '••••••'
            }
            helper={`${summary.totalAccounts} connected accounts`}
            icon={TrendingUp}
            accent="text-emerald-300"
          />

          <MetricCard
            label="Liabilities"
            value={
              showBalances
                ? formatCompactCurrency(liabilities)
                : '••••••'
            }
            helper="Credit and loan obligations"
            icon={TrendingDown}
            accent="text-rose-300"
          />

          <MetricCard
            label="Account coverage"
            value={`${summary.totalAccounts}`}
            helper="Tracked financial accounts"
            icon={ShieldCheck}
            accent="text-violet-300"
          />
        </section>

        {/* MAIN ANALYTICS */}
        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 shadow-[0_25px_100px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">
                  Portfolio structure
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Your financial accounts
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Activity size={14} />
                Live backend data
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                    Assets
                  </span>

                  <ArrowDownLeft
                    size={15}
                    className="text-emerald-300"
                  />
                </div>

                <p className="mt-3 text-2xl font-black text-emerald-300">
                  {showBalances ? formatCurrency(assets) : '••••••'}
                </p>
              </div>

              <div className="rounded-2xl border border-rose-400/10 bg-rose-400/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                    Liabilities
                  </span>

                  <ArrowUpRight size={15} className="text-rose-300" />
                </div>

                <p className="mt-3 text-2xl font-black text-rose-300">
                  {showBalances ? formatCurrency(liabilities) : '••••••'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-2xl bg-white/[0.035]"
                  />
                ))
              ) : distribution.length ? (
                distribution.map(([type, count]) => {
                  const percentage =
                    accounts.length > 0
                      ? (count / accounts.length) * 100
                      : 0;

                  return (
                    <div
                      key={type}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2.5 w-2.5 rounded-full bg-current ${getAccountAccent(
                              type,
                            )}`}
                          />

                          <span className="text-sm font-bold capitalize text-slate-300">
                            {type}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-slate-500">
                          {count} account
                          {count === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full bg-current transition-all ${getAccountAccent(
                            type,
                          )}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">
                  No account distribution available.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 shadow-[0_25px_100px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/10 bg-violet-400/10 p-3 text-violet-300">
                <ShieldCheck size={19} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">
                  Financial health
                </p>

                <h2 className="mt-1 text-lg font-black text-white">
                  Balance composition
                </h2>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[18px] border-white/[0.04]">
                <div className="absolute inset-[-18px] rounded-full border-[18px] border-emerald-400/50 border-r-transparent border-b-transparent -rotate-45" />

                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                    Net worth
                  </p>

                  <p className="mt-2 text-2xl font-black text-white">
                    {showBalances
                      ? formatCompactCurrency(summary.totalBalance)
                      : '••••'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.025] px-4 py-3">
                <span className="text-xs text-slate-500">
                  Asset ratio
                </span>

                <span className="text-xs font-bold text-emerald-300">
                  {assets + liabilities > 0
                    ? `${Math.round(
                        (assets / (assets + liabilities)) * 100,
                      )}%`
                    : '0%'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/[0.025] px-4 py-3">
                <span className="text-xs text-slate-500">
                  Liability ratio
                </span>

                <span className="text-xs font-bold text-rose-300">
                  {assets + liabilities > 0
                    ? `${Math.round(
                        (liabilities / (assets + liabilities)) * 100,
                      )}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH / FILTER */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 shadow-[0_25px_100px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search account, bank, type or account number..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40"
              />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-10 text-sm text-slate-300 outline-none focus:border-violet-400/40 lg:w-48"
              >
                <option value="all" className="bg-slate-950">
                  All account types
                </option>
                <option value="bank" className="bg-slate-950">
                  Bank
                </option>
                <option value="checking" className="bg-slate-950">
                  Checking
                </option>
                <option value="savings" className="bg-slate-950">
                  Savings
                </option>
                <option value="credit" className="bg-slate-950">
                  Credit
                </option>
                <option value="investment" className="bg-slate-950">
                  Investment
                </option>
                <option value="loan" className="bg-slate-950">
                  Loan
                </option>
                <option value="cash" className="bg-slate-950">
                  Cash
                </option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-500">
              {filteredAccounts.length} of {accounts.length} accounts
            </div>
          </div>
        </section>

        {/* ACCOUNT GRID */}
        <section>
          {error && (
            <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-400/10 p-2 text-amber-300">
                  <Landmark size={16} />
                </div>

                <div>
                  <p className="text-sm font-bold text-amber-200">
                    Account notice
                  </p>

                  <p className="mt-1 text-xs leading-6 text-amber-200/60">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-[1.7rem] bg-white/[0.035]"
                />
              ))}
            </div>
          ) : filteredAccounts.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onSelect={setSelectedAccount}
                />
              ))}

              <button
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  setIsFormOpen(true);
                }}
                className="group flex min-h-[260px] flex-col items-center justify-center rounded-[1.7rem] border border-dashed border-white/10 bg-white/[0.015] p-6 transition hover:border-violet-400/30 hover:bg-violet-400/[0.03]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-violet-300 transition group-hover:scale-110 group-hover:bg-violet-400/10">
                  <Plus size={23} />
                </div>

                <p className="mt-4 text-sm font-black text-white">
                  Connect another account
                </p>

                <p className="mt-1 text-center text-xs leading-5 text-slate-600">
                  Expand your financial picture by adding another
                  account.
                </p>
              </button>
            </div>
          ) : (
            <EmptyAccounts
              onAdd={() => {
                setEditingAccount(null);
                setIsFormOpen(true);
              }}
            />
          )}
        </section>

        {/* FOOTER STATUS */}
        <section className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            FinSight account intelligence layer
          </div>

          <div className="flex items-center gap-2">
            <span>PostgreSQL</span>
            <span>→</span>
            <span>Express API</span>
            <span>→</span>
            <span>React</span>
          </div>
        </section>
      </div>

      <AccountFormModal
        isOpen={isFormOpen}
        initialValues={editingAccount}
        submitting={submitting}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleSaveAccount}
      />

      <AccountDrawer
        account={selectedAccount}
        deleting={submitting}
        onClose={() => setSelectedAccount(null)}
        onEdit={(acc) => {
          setSelectedAccount(null);
          setEditingAccount(acc);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteAccount}
      />
    </main>
  );
}