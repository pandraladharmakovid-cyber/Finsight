import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  DollarSign,
  Edit3,
  Filter,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

const USER_ID =
  import.meta.env.VITE_FINSIGHT_USER_ID;

const formatMoney = (value) => {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    },
  ).format(amount);
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(date);
};

const normalizeFrequency = (
  value,
) => {
  const frequency = String(
    value || 'monthly',
  )
    .trim()
    .toLowerCase();

  if (
    frequency === 'annual' ||
    frequency === 'annually'
  ) {
    return 'yearly';
  }

  return frequency;
};

const frequencyLabel = (
  value,
) => {
  const frequency =
    normalizeFrequency(value);

  const labels = {
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    daily: 'Daily',
  };

  return (
    labels[frequency] ||
    String(value || 'Monthly')
  );
};

const monthlyEquivalent = (
  amount,
  frequency,
) => {
  const value =
    Number(amount) || 0;

  switch (
    normalizeFrequency(frequency)
  ) {
    case 'daily':
      return value * 30.4375;

    case 'weekly':
      return value * 4.345;

    case 'biweekly':
      return value * 2.1725;

    case 'quarterly':
      return value / 3;

    case 'yearly':
      return value / 12;

    default:
      return value;
  }
};

const getTransactionType = (
  transaction,
) => {
  const type = String(
    transaction?.transaction_type ||
      transaction?.type ||
      '',
  ).toLowerCase();

  if (
    type.includes('income') ||
    type.includes('credit') ||
    type.includes('deposit')
  ) {
    return 'income';
  }

  return 'expense';
};

const isActiveTransaction = (
  transaction,
) => {
  if (
    transaction?.is_active ===
    false
  ) {
    return false;
  }

  if (
    String(
      transaction?.status || '',
    ).toLowerCase() ===
    'inactive'
  ) {
    return false;
  }

  return true;
};

const daysUntil = (value) => {
  if (!value) return null;

  const target = new Date(value);
  const now = new Date();

  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target.getTime() -
      now.getTime()) /
      86400000,
  );
};

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'blue',
}) {
  return (
    <div
      className={`rt-metric-card rt-tone-${tone}`}
    >
      <div className="rt-metric-top">
        <div className="rt-metric-icon">
          <Icon size={18} />
        </div>

        <span className="rt-metric-live">
          <span />
          LIVE
        </span>
      </div>

      <div className="rt-metric-label">
        {label}
      </div>

      <div className="rt-metric-value">
        {value}
      </div>

      <div className="rt-metric-helper">
        {helper}
      </div>
    </div>
  );
}

function StatusPill({
  active,
}) {
  return (
    <span
      className={`rt-status-pill ${
        active
          ? 'rt-status-active'
          : 'rt-status-paused'
      }`}
    >
      {active ? (
        <CheckCircle2 size={12} />
      ) : (
        <PauseCircle size={12} />
      )}

      {active
        ? 'Active'
        : 'Inactive'}
    </span>
  );
}

function TypePill({
  type,
}) {
  const income =
    type === 'income';

  return (
    <span
      className={`rt-type-pill ${
        income
          ? 'rt-type-income'
          : 'rt-type-expense'
      }`}
    >
      {income ? (
        <ArrowUpRight size={12} />
      ) : (
        <ArrowDownLeft size={12} />
      )}

      {income
        ? 'Recurring income'
        : 'Recurring expense'}
    </span>
  );
}

function RecurringCard({
  item,
  onSelect,
}) {
  const active =
    isActiveTransaction(item);

  const type =
    getTransactionType(item);

  const amount =
    Number(item.amount) || 0;

  const days =
    daysUntil(
      item.next_run_date,
    );

  const urgent =
    active &&
    days !== null &&
    days >= 0 &&
    days <= 7;

  return (
    <button
      type="button"
      className="rt-recurring-card"
      onClick={() =>
        onSelect(item)
      }
    >
      <div className="rt-card-accent" />

      <div className="rt-recurring-card-top">
        <div className="rt-recurring-card-icon">
          {type === 'income' ? (
            <TrendingUp
              size={20}
            />
          ) : (
            <TrendingDown
              size={20}
            />
          )}
        </div>

        <div className="rt-card-heading">
          <strong>
            {item.description ||
              'Recurring transaction'}
          </strong>

          <span>
            {frequencyLabel(
              item.frequency,
            )}
          </span>
        </div>

        <MoreHorizontal
          size={18}
          className="rt-card-more"
        />
      </div>

      <div className="rt-card-amount">
        <span
          className={
            type === 'income'
              ? 'rt-income-text'
              : 'rt-expense-text'
          }
        >
          {type === 'income'
            ? '+'
            : '-'}
          {formatMoney(amount)}
        </span>

        <span className="rt-card-frequency">
          /{' '}
          {frequencyLabel(
            item.frequency,
          ).toLowerCase()}
        </span>
      </div>

      <div className="rt-card-divider" />

      <div className="rt-card-meta">
        <div>
          <span>
            NEXT OCCURRENCE
          </span>

          <strong>
            {formatDate(
              item.next_run_date,
            )}
          </strong>
        </div>

        <div className="rt-card-status">
          <StatusPill
            active={active}
          />
        </div>
      </div>

      {urgent && (
        <div className="rt-card-alert">
          <Clock3 size={13} />

          <span>
            {days === 0
              ? 'Runs today'
              : days === 1
                ? 'Runs tomorrow'
                : `Runs in ${days} days`}
          </span>
        </div>
      )}

      <div className="rt-card-footer">
        <span>
          {item.start_date
            ? `Started ${formatDate(
                item.start_date,
              )}`
            : 'Recurring schedule'}
        </span>

        <ChevronRight size={14} />
      </div>
    </button>
  );
}

function DetailModal({
  item,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!item) return null;

  const active =
    isActiveTransaction(item);

  const type =
    getTransactionType(item);

  const amount =
    Number(item.amount) || 0;

  const monthly =
    monthlyEquivalent(
      amount,
      item.frequency,
    );

  return (
    <div className="rt-modal-layer">
      <button
        type="button"
        className="rt-modal-backdrop"
        onClick={onClose}
        aria-label="Close details"
      />

      <section
        className="rt-detail-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="rt-modal-header">
          <div>
            <span>
              RECURRING TRANSACTION
            </span>

            <h2>
              {item.description ||
                'Recurring transaction'}
            </h2>
          </div>

          <button
            type="button"
            className="rt-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="rt-modal-hero">
          <div
            className={`rt-modal-hero-icon ${
              type === 'income'
                ? 'rt-modal-income'
                : 'rt-modal-expense'
            }`}
          >
            {type === 'income' ? (
              <TrendingUp
                size={25}
              />
            ) : (
              <TrendingDown
                size={25}
              />
            )}
          </div>

          <div>
            <span>
              AMOUNT
            </span>

            <strong>
              {formatMoney(amount)}
            </strong>

            <small>
              {frequencyLabel(
                item.frequency,
              )}
            </small>
          </div>

          <StatusPill
            active={active}
          />
        </div>

        <div className="rt-detail-grid">
          <div>
            <span>
              Transaction ID
            </span>

            <strong>
              #{item.recurring_id}
            </strong>
          </div>

          <div>
            <span>
              Transaction type
            </span>

            <strong>
              <TypePill
                type={type}
              />
            </strong>
          </div>

          <div>
            <span>
              Next occurrence
            </span>

            <strong>
              {formatDate(
                item.next_run_date,
              )}
            </strong>
          </div>

          <div>
            <span>
              Monthly equivalent
            </span>

            <strong>
              {formatMoney(monthly)}
            </strong>
          </div>

          <div>
            <span>
              Start date
            </span>

            <strong>
              {formatDate(
                item.start_date,
              )}
            </strong>
          </div>

          <div>
            <span>
              End date
            </span>

            <strong>
              {formatDate(
                item.end_date,
              )}
            </strong>
          </div>

          <div>
            <span>
              Account ID
            </span>

            <strong>
              #{item.account_id ??
                '—'}
            </strong>
          </div>

          <div>
            <span>
              Category ID
            </span>

            <strong>
              #{item.category_id ??
                '—'}
            </strong>
          </div>
        </div>

        <div className="rt-modal-section">
          <div className="rt-modal-section-heading">
            <ShieldCheck
              size={16}
            />

            <strong>
              Schedule intelligence
            </strong>
          </div>

          <p>
            FinSight is using the
            recurring schedule stored
            in PostgreSQL as the source
            of truth. No estimated
            schedule has been generated
            in the interface.
          </p>
        </div>

        <div className="rt-modal-actions">
          <button
            type="button"
            onClick={onClose}
          >
            <X size={15} />
            Close
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(item)}
            style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}
          >
            <Edit3 size={15} />
            Edit schedule
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(item.recurring_id)}
            style={{ color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)' }}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rt-loading">
      <div className="rt-loading-orb">
        <RefreshCw
          size={25}
        />
      </div>

      <strong>
        Loading recurring schedules
      </strong>

      <span>
        Reading live financial data
        from PostgreSQL...
      </span>
    </div>
  );
}

function EmptyState({
  filtered,
}) {
  return (
    <div className="rt-empty">
      <div className="rt-empty-icon">
        <CalendarClock
          size={28}
        />
      </div>

      <strong>
        {filtered
          ? 'No matching schedules'
          : 'No recurring transactions'}
      </strong>

      <span>
        {filtered
          ? 'Try changing your search or filters.'
          : 'There are no recurring transaction records available for this user.'}
      </span>
    </div>
  );
}

export default function RecurringTransactions() {
  const [items, setItems] =
    useState([]);

  const [overview, setOverview] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [typeFilter, setTypeFilter] =
    useState('all');

  const [frequencyFilter, setFrequencyFilter] =
    useState('all');

  const [sortBy, setSortBy] =
    useState('next');

  const [selected, setSelected] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState('EXPENSE');
  const [formFreq, setFormFreq] = useState('MONTHLY');
  const [formNextDate, setFormNextDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormDesc('');
    setFormAmount('');
    setFormType('EXPENSE');
    setFormFreq('MONTHLY');
    setFormNextDate(new Date().toISOString().slice(0, 10));
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setSelected(null);
    setEditingItem(item);
    setFormDesc(item.description || '');
    setFormAmount(String(item.amount || ''));
    setFormType(String(item.transaction_type || 'EXPENSE').toUpperCase());
    setFormFreq(String(item.frequency || 'MONTHLY').toUpperCase());
    setFormNextDate(item.next_run_date ? new Date(item.next_run_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setIsFormOpen(true);
  };

  const handleSaveRecurring = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = Boolean(editingItem?.recurring_id);
      const url = isEdit
        ? `${API_BASE_URL}/recurring/${USER_ID}/${editingItem.recurring_id}`
        : `${API_BASE_URL}/recurring/${USER_ID}`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formDesc.trim(),
          amount: Number(formAmount),
          transaction_type: formType,
          frequency: formFreq,
          next_run_date: formNextDate,
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to save recurring transaction');
      setIsFormOpen(false);
      setEditingItem(null);
      await fetchData({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to save schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecurring = async (recurringId) => {
    try {
      await fetch(`${API_BASE_URL}/recurring/${USER_ID}/${recurringId}`, {
        method: 'DELETE',
      });
      setSelected(null);
      await fetchData({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to delete schedule.');
    }
  };

  const fetchData =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!USER_ID) {
          setError(
            'VITE_FINSIGHT_USER_ID is not configured.',
          );
          setLoading(false);
          return;
        }

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        try {
          const [
            recurringResponse,
            overviewResponse,
          ] = await Promise.all([
            fetch(
              `${API_BASE_URL}/recurring/${USER_ID}`,
            ),
            fetch(
              `${API_BASE_URL}/recurring/${USER_ID}/overview`,
            ),
          ]);

          if (
            !recurringResponse.ok
          ) {
            throw new Error(
              `Recurring transactions request failed (${recurringResponse.status}).`,
            );
          }

          if (
            !overviewResponse.ok
          ) {
            throw new Error(
              `Recurring overview request failed (${overviewResponse.status}).`,
            );
          }

          const [
            recurringJson,
            overviewJson,
          ] = await Promise.all([
            recurringResponse.json(),
            overviewResponse.json(),
          ]);

          if (
            recurringJson?.success ===
            false
          ) {
            throw new Error(
              recurringJson.message ||
                'Unable to load recurring transactions.',
            );
          }

          if (
            overviewJson?.success ===
            false
          ) {
            throw new Error(
              overviewJson.message ||
                'Unable to load recurring overview.',
            );
          }

          const recurringData =
            Array.isArray(
              recurringJson?.data,
            )
              ? recurringJson.data
              : [];

          const overviewData =
            overviewJson?.data ||
            {};

          setItems(
            recurringData,
          );

          setOverview(
            overviewData,
          );
        } catch (requestError) {
          console.error(
            'FinSight recurring transactions error:',
            requestError,
          );

          setError(
            requestError?.message ||
              'Unable to load recurring transactions.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics =
    useMemo(() => {
      const dataMetrics =
        overview?.metrics || {};

      const activeItems =
        items.filter(
          isActiveTransaction,
        );

      const calculatedMonthly =
        activeItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            monthlyEquivalent(
              item.amount,
              item.frequency,
            ),
          0,
        );

      return {
        total:
          Number(
            dataMetrics.totalCount,
          ) ||
          items.length,

        active:
          Number(
            dataMetrics.activeCount,
          ) ||
          activeItems.length,

        monthly:
          Number(
            dataMetrics.monthlyRecurringAmount,
          ) ||
          calculatedMonthly,

        incomeMonthly:
          activeItems
            .filter(
              (item) =>
                getTransactionType(
                  item,
                ) ===
                'income',
            )
            .reduce(
              (
                total,
                item,
              ) =>
                total +
                monthlyEquivalent(
                  item.amount,
                  item.frequency,
                ),
              0,
            ),

        expenseMonthly:
          activeItems
            .filter(
              (item) =>
                getTransactionType(
                  item,
                ) ===
                'expense',
            )
            .reduce(
              (
                total,
                item,
              ) =>
                total +
                monthlyEquivalent(
                  item.amount,
                  item.frequency,
                ),
              0,
            ),
      };
    }, [items, overview]);

  const frequencies =
    useMemo(() => {
      return [
        ...new Set(
          items.map(
            (item) =>
              normalizeFrequency(
                item.frequency,
              ),
          ),
        ),
      ];
    }, [items]);

  const filteredItems =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const result =
        items.filter(
          (item) => {
            const matchesSearch =
              !query ||
              [
                item.description,
                item.frequency,
                item.transaction_type,
                item.status,
                item.recurring_id,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(query);

            const active =
              isActiveTransaction(
                item,
              );

            const matchesStatus =
              statusFilter ===
                'all' ||
              (statusFilter ===
                'active' &&
                active) ||
              (statusFilter ===
                'inactive' &&
                !active);

            const type =
              getTransactionType(
                item,
              );

            const matchesType =
              typeFilter ===
                'all' ||
              type === typeFilter;

            const frequency =
              normalizeFrequency(
                item.frequency,
              );

            const matchesFrequency =
              frequencyFilter ===
                'all' ||
              frequency ===
                frequencyFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesType &&
              matchesFrequency
            );
          },
        );

      return result.sort(
        (a, b) => {
          if (
            sortBy ===
            'amount-desc'
          ) {
            return (
              Number(b.amount) -
              Number(a.amount)
            );
          }

          if (
            sortBy ===
            'amount-asc'
          ) {
            return (
              Number(a.amount) -
              Number(b.amount)
            );
          }

          if (
            sortBy ===
            'description'
          ) {
            return String(
              a.description ||
                '',
            ).localeCompare(
              String(
                b.description ||
                  '',
              ),
            );
          }

          const aDate =
            a.next_run_date
              ? new Date(
                  a.next_run_date,
                ).getTime()
              : Infinity;

          const bDate =
            b.next_run_date
              ? new Date(
                  b.next_run_date,
                ).getTime()
              : Infinity;

          return (
            aDate - bDate
          );
        },
      );
    }, [
      items,
      search,
      statusFilter,
      typeFilter,
      frequencyFilter,
      sortBy,
    ]);

  const upcoming =
    useMemo(() => {
      return items
        .filter(
          (item) =>
            isActiveTransaction(
              item,
            ) &&
            item.next_run_date,
        )
        .map((item) => ({
          ...item,
          days:
            daysUntil(
              item.next_run_date,
            ),
        }))
        .filter(
          (item) =>
            item.days !==
              null &&
            item.days >= 0,
        )
        .sort(
          (a, b) =>
            a.days - b.days,
        )
        .slice(0, 5);
    }, [items]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setFrequencyFilter('all');
    setSortBy('next');
  };

  return (
    <>
      <main className="rt-page">
        <section className="rt-hero">
          <div className="rt-hero-copy">
            <div className="rt-hero-eyebrow">
              <span className="rt-eyebrow-line" />
              FINANCIAL AUTOMATION
              <span className="rt-live-badge">
                <span />
                POSTGRESQL LIVE
              </span>
            </div>

            <h1>
              Recurring
              <span>
                Transactions
              </span>
            </h1>

            <p>
              See every recurring
              financial obligation and
              income stream in one
              intelligent command center.
            </p>

            <div className="rt-hero-actions">
              <button
                type="button"
                onClick={() =>
                  fetchData({
                    silent: true,
                  })
                }
                disabled={
                  refreshing ||
                  loading
                }
                className="rt-primary-button"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? 'rt-spin'
                      : ''
                  }
                />

                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh live data'}
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="rt-primary-button"
              >
                <Plus size={15} />
                Add recurring schedule
              </button>

              <div className="rt-source-badge">
                <ShieldCheck
                  size={14}
                />

                <span>
                  Database source of
                  truth
                </span>
              </div>
            </div>
          </div>

          <div className="rt-hero-visual">
            <div className="rt-orbit rt-orbit-one" />
            <div className="rt-orbit rt-orbit-two" />

            <div className="rt-hero-core">
              <div className="rt-core-ring">
                <Activity
                  size={30}
                />
              </div>

              <strong>
                LIVE
              </strong>

              <span>
                recurring engine
              </span>
            </div>

            <div className="rt-floating-node rt-node-one">
              <CalendarClock
                size={15}
              />
              <span>
                SCHEDULES
              </span>
            </div>

            <div className="rt-floating-node rt-node-two">
              <Wallet size={15} />
              <span>
                CASH FLOW
              </span>
            </div>

            <div className="rt-floating-node rt-node-three">
              <Zap size={15} />
              <span>
                AUTOMATED
              </span>
            </div>
          </div>
        </section>

        {error && (
          <section className="rt-error">
            <div>
              <ShieldCheck
                size={20}
              />
            </div>

            <div>
              <strong>
                Live data could not be
                loaded
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchData()
              }
            >
              Retry
            </button>
          </section>
        )}

        <section className="rt-metrics-grid">
          <MetricCard
            label="TOTAL SCHEDULES"
            value={metrics.total}
            helper="Records returned by PostgreSQL"
            icon={RefreshCw}
            tone="blue"
          />

          <MetricCard
            label="ACTIVE SCHEDULES"
            value={metrics.active}
            helper="Currently enabled recurring records"
            icon={CheckCircle2}
            tone="green"
          />

          <MetricCard
            label="MONTHLY COMMITMENT"
            value={formatMoney(
              metrics.monthly,
            )}
            helper="Normalized monthly equivalent"
            icon={DollarSign}
            tone="purple"
          />

          <MetricCard
            label="NET RECURRING FLOW"
            value={formatMoney(
              metrics.incomeMonthly -
                metrics.expenseMonthly,
            )}
            helper="Recurring income minus recurring expense"
            icon={
              metrics.incomeMonthly >=
              metrics.expenseMonthly
                ? TrendingUp
                : TrendingDown
            }
            tone={
              metrics.incomeMonthly >=
              metrics.expenseMonthly
                ? 'green'
                : 'red'
            }
          />
        </section>

        <section className="rt-command-grid">
          <div className="rt-command-panel">
            <div className="rt-panel-heading">
              <div>
                <span>
                  SCHEDULE CONTROL
                </span>

                <h2>
                  Recurring calendar
                </h2>
              </div>

              <CalendarClock
                size={19}
              />
            </div>

            <div className="rt-upcoming-list">
              {upcoming.length ? (
                upcoming.map(
                  (item) => (
                    <button
                      type="button"
                      className="rt-upcoming-row"
                      key={
                        item.recurring_id
                      }
                      onClick={() =>
                        setSelected(
                          item,
                        )
                      }
                    >
                      <div className="rt-upcoming-date">
                        <strong>
                          {item.next_run_date
                            ? new Date(
                                item.next_run_date,
                              ).getDate()
                            : '—'}
                        </strong>

                        <span>
                          {item.next_run_date
                            ? new Intl.DateTimeFormat(
                                'en-IN',
                                {
                                  month:
                                    'short',
                                },
                              ).format(
                                new Date(
                                  item.next_run_date,
                                ),
                              )
                            : ''}
                        </span>
                      </div>

                      <div className="rt-upcoming-copy">
                        <strong>
                          {item.description ||
                            'Recurring transaction'}
                        </strong>

                        <span>
                          {item.days ===
                          0
                            ? 'Today'
                            : item.days ===
                                1
                              ? 'Tomorrow'
                              : `In ${item.days} days`}
                          {' · '}
                          {frequencyLabel(
                            item.frequency,
                          )}
                        </span>
                      </div>

                      <div className="rt-upcoming-amount">
                        <strong
                          className={
                            getTransactionType(
                              item,
                            ) ===
                            'income'
                              ? 'rt-income-text'
                              : 'rt-expense-text'
                          }
                        >
                          {getTransactionType(
                            item,
                          ) ===
                          'income'
                            ? '+'
                            : '-'}
                          {formatMoney(
                            item.amount,
                          )}
                        </strong>

                        <ChevronRight
                          size={14}
                        />
                      </div>
                    </button>
                  ),
                )
              ) : (
                <div className="rt-mini-empty">
                  <Clock3 size={19} />
                  <span>
                    No upcoming active
                    schedules found.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rt-command-panel rt-flow-panel">
            <div className="rt-panel-heading">
              <div>
                <span>
                  RECURRING FLOW
                </span>

                <h2>
                  Monthly impact
                </h2>
              </div>

              <Activity
                size={19}
              />
            </div>

            <div className="rt-flow-visual">
              <div className="rt-flow-bar">
                <span
                  style={{
                    width: `${
                      metrics.monthly
                        ? Math.min(
                            100,
                            (metrics.expenseMonthly /
                              metrics.monthly) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="rt-flow-legend">
                <div>
                  <span className="rt-legend-dot rt-dot-expense" />
                  <span>
                    Expenses
                  </span>
                  <strong>
                    {formatMoney(
                      metrics.expenseMonthly,
                    )}
                  </strong>
                </div>

                <div>
                  <span className="rt-legend-dot rt-dot-income" />
                  <span>
                    Income
                  </span>
                  <strong>
                    {formatMoney(
                      metrics.incomeMonthly,
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rt-intelligence-note">
              <Sparkles
                size={16}
              />

              <span>
                Monthly equivalents are
                normalized from the stored
                frequency and amount. The
                underlying recurring records
                remain unchanged.
              </span>
            </div>
          </div>
        </section>

        <section className="rt-list-section">
          <div className="rt-list-header">
            <div>
              <div className="rt-section-eyebrow">
                ALL SCHEDULES
              </div>

              <h2>
                Recurring transaction
                registry
              </h2>

              <p>
                {filteredItems.length}
                {' '}
                matching record
                {filteredItems.length ===
                1
                  ? ''
                  : 's'}
                {' '}
                from the live API.
              </p>
            </div>

            <div className="rt-list-header-right">
              <div className="rt-live-indicator">
                <span />
                LIVE DATA
              </div>
            </div>
          </div>

          <div className="rt-toolbar">
            <div className="rt-search">
              <Search size={16} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search recurring schedules..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch('')
                  }
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="rt-filter">
              <Filter size={14} />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
              >
                <option value="all">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>

              <ChevronDown
                size={13}
              />
            </div>

            <div className="rt-filter">
              <ArrowUpRight
                size={14}
              />

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value,
                  )
                }
              >
                <option value="all">
                  All types
                </option>

                <option value="income">
                  Income
                </option>

                <option value="expense">
                  Expense
                </option>
              </select>

              <ChevronDown
                size={13}
              />
            </div>

            <div className="rt-filter">
              <Calendar
                size={14}
              />

              <select
                value={
                  frequencyFilter
                }
                onChange={(event) =>
                  setFrequencyFilter(
                    event.target.value,
                  )
                }
              >
                <option value="all">
                  All frequencies
                </option>

                {frequencies.map(
                  (frequency) => (
                    <option
                      key={
                        frequency
                      }
                      value={
                        frequency
                      }
                    >
                      {frequencyLabel(
                        frequency,
                      )}
                    </option>
                  ),
                )}
              </select>

              <ChevronDown
                size={13}
              />
            </div>

            <div className="rt-filter">
              <TrendingDown
                size={14}
              />

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value,
                  )
                }
              >
                <option value="next">
                  Next occurrence
                </option>

                <option value="amount-desc">
                  Amount high → low
                </option>

                <option value="amount-asc">
                  Amount low → high
                </option>

                <option value="description">
                  Description
                </option>
              </select>

              <ChevronDown
                size={13}
              />
            </div>

            {(search ||
              statusFilter !==
                'all' ||
              typeFilter !==
                'all' ||
              frequencyFilter !==
                'all') && (
              <button
                type="button"
                className="rt-reset-button"
                onClick={
                  resetFilters
                }
              >
                Reset
              </button>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredItems.length ? (
            <div className="rt-card-grid">
              {filteredItems.map(
                (item) => (
                  <RecurringCard
                    key={
                      item.recurring_id
                    }
                    item={item}
                    onSelect={
                      setSelected
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState
              filtered={
                items.length > 0
              }
            />
          )}
        </section>

        <section className="rt-bottom-strip">
          <div className="rt-bottom-icon">
            <ShieldCheck size={18} />
          </div>

          <div>
            <strong>
              PostgreSQL-backed
              recurring intelligence
            </strong>

            <span>
              Records, status, amount,
              frequency and next
              occurrence are read directly
              from the existing
              <code>
                finance.recurring_transactions
              </code>
              table.
            </span>
          </div>

          <div className="rt-bottom-status">
            <span />
            Source connected
          </div>
        </section>
      </main>

      <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onEdit={openEditModal}
        onDelete={handleDeleteRecurring}
      />
      {isFormOpen && (
        <div className="rt-modal-layer">
          <button type="button" className="rt-modal-backdrop" onClick={() => setIsFormOpen(false)} />
          <form onSubmit={handleSaveRecurring} className="rt-detail-modal" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>
                {editingItem ? 'Edit Recurring Schedule' : 'New Recurring Schedule'}
              </h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rt-modal-close">
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                Description *
                <input
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. House Rent / Netflix / Salary"
                  style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)', color: '#fff' }}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                  Amount (₹) *
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)', color: '#fff' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                  Type
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#0f172a', color: '#fff' }}
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                  Frequency
                  <select
                    value={formFreq}
                    onChange={(e) => setFormFreq(e.target.value)}
                    style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#0f172a', color: '#fff' }}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                  Next Run Date
                  <input
                    type="date"
                    required
                    value={formNextDate}
                    onChange={(e) => setFormNextDate(e.target.value)}
                    style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)', color: '#fff' }}
                  />
                </label>
              </div>
            </div>
            <div className="rt-modal-actions" style={{ padding: '18px 0 0' }}>
              <button type="button" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="rt-primary-button">
                {submitting ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .rt-page {
          width: 100%;
          min-height: 100%;
          padding: 34px 0 90px;
          color: #eef3fb;
        }

        .rt-hero {
          position: relative;
          min-height: 360px;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, .65fr);
          gap: 20px;
          overflow: hidden;
          padding: 42px;
          box-sizing: border-box;
          border: 1px solid rgba(110, 139, 205, .13);
          border-radius: 25px;
          background:
            radial-gradient(circle at 75% 40%, rgba(99, 88, 255, .12), transparent 30%),
            radial-gradient(circle at 20% 110%, rgba(35, 209, 161, .07), transparent 28%),
            linear-gradient(135deg, rgba(16, 24, 40, .94), rgba(8, 13, 23, .96));
          box-shadow: 0 25px 80px rgba(0,0,0,.19);
        }

        .rt-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .3;
          background-image:
            linear-gradient(rgba(120,145,205,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(120,145,205,.035) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(to right, black, transparent);
        }

        .rt-hero-copy {
          position: relative;
          z-index: 2;
          align-self: center;
          max-width: 760px;
        }

        .rt-hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #7187c7;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .18em;
        }

        .rt-eyebrow-line {
          width: 25px;
          height: 1px;
          background: #6e8cff;
          box-shadow: 0 0 12px rgba(110,140,255,.6);
        }

        .rt-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: 6px;
          padding: 5px 7px;
          border: 1px solid rgba(50,210,162,.12);
          border-radius: 999px;
          color: #54cfa7;
          background: rgba(44,208,160,.045);
          font-size: 7px;
          letter-spacing: .08em;
        }

        .rt-live-badge span,
        .rt-live-indicator span,
        .rt-metric-live span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3fd5a4;
          box-shadow: 0 0 9px rgba(63,213,164,.8);
        }

        .rt-hero h1 {
          margin: 13px 0 12px;
          max-width: 680px;
          color: #f2f5fb;
          font-size: clamp(35px, 4.2vw, 65px);
          line-height: .96;
          letter-spacing: -.055em;
          font-weight: 820;
        }

        .rt-hero h1 span {
          display: block;
          background: linear-gradient(110deg, #9aacff, #b779ff 65%, #73d8c3);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .rt-hero p {
          max-width: 590px;
          margin: 0;
          color: #77849a;
          font-size: 12px;
          line-height: 1.75;
        }

        .rt-hero-actions {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 25px;
        }

        .rt-primary-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 14px;
          border: 1px solid rgba(115,143,229,.2);
          border-radius: 10px;
          color: #eef2ff;
          background: linear-gradient(135deg, rgba(92,119,242,.9), rgba(126,84,211,.9));
          box-shadow: 0 9px 28px rgba(83,101,223,.18);
          cursor: pointer;
          font-size: 9px;
          font-weight: 750;
        }

        .rt-primary-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .rt-source-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 11px;
          border: 1px solid rgba(104,133,192,.1);
          border-radius: 10px;
          color: #637087;
          background: rgba(255,255,255,.018);
          font-size: 8px;
        }

        .rt-source-badge svg {
          color: #55cda7;
        }

        .rt-hero-visual {
          position: relative;
          min-height: 275px;
          display: grid;
          place-items: center;
        }

        .rt-orbit {
          position: absolute;
          border: 1px solid rgba(110,138,230,.13);
          border-radius: 50%;
        }

        .rt-orbit-one {
          width: 255px;
          height: 255px;
          animation: rt-orbit 18s linear infinite;
        }

        .rt-orbit-two {
          width: 175px;
          height: 175px;
          border-style: dashed;
          border-color: rgba(102,218,184,.12);
          animation: rt-orbit-reverse 12s linear infinite;
        }

        .rt-hero-core {
          position: relative;
          z-index: 2;
          width: 112px;
          height: 112px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border: 1px solid rgba(114,143,238,.25);
          border-radius: 50%;
          background:
            radial-gradient(circle, rgba(86,110,221,.2), rgba(11,17,30,.96) 68%);
          box-shadow:
            0 0 60px rgba(82,105,235,.12),
            inset 0 0 35px rgba(95,121,235,.06);
        }

        .rt-core-ring {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(114,144,255,.28);
          border-radius: 50%;
          color: #8ea5ff;
          background: rgba(92,119,238,.08);
        }

        .rt-hero-core strong {
          margin-top: 7px;
          color: #b7c6ff;
          font-size: 8px;
          letter-spacing: .15em;
        }

        .rt-hero-core span {
          margin-top: 2px;
          color: #56647b;
          font-size: 7px;
        }

        .rt-floating-node {
          position: absolute;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border: 1px solid rgba(111,139,201,.12);
          border-radius: 9px;
          color: #7788ad;
          background: rgba(10,16,28,.85);
          box-shadow: 0 10px 30px rgba(0,0,0,.18);
          backdrop-filter: blur(10px);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .rt-node-one {
          top: 18%;
          left: 10%;
          animation: rt-float 5s ease-in-out infinite;
        }

        .rt-node-two {
          right: 4%;
          top: 30%;
          color: #5bc9a7;
          animation: rt-float 6s ease-in-out infinite .5s;
        }

        .rt-node-three {
          left: 17%;
          bottom: 14%;
          color: #a18bff;
          animation: rt-float 7s ease-in-out infinite 1s;
        }

        .rt-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .rt-metric-card {
          position: relative;
          min-height: 155px;
          overflow: hidden;
          padding: 17px;
          box-sizing: border-box;
          border: 1px solid rgba(111,137,198,.1);
          border-radius: 16px;
          background: rgba(12,18,30,.72);
        }

        .rt-metric-card::after {
          content: "";
          position: absolute;
          right: -35px;
          bottom: -65px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: var(--metric-glow);
          filter: blur(30px);
          opacity: .25;
        }

        .rt-tone-blue {
          --metric-glow: rgba(85,120,255,.5);
        }

        .rt-tone-green {
          --metric-glow: rgba(42,207,158,.5);
        }

        .rt-tone-purple {
          --metric-glow: rgba(153,92,255,.5);
        }

        .rt-tone-red {
          --metric-glow: rgba(255,91,116,.5);
        }

        .rt-metric-top {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rt-metric-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(110,140,205,.1);
          border-radius: 9px;
          color: #8299ef;
          background: rgba(87,117,227,.065);
        }

        .rt-tone-green .rt-metric-icon {
          color: #5ed7b1;
          background: rgba(42,207,158,.055);
        }

        .rt-tone-purple .rt-metric-icon {
          color: #aa8cff;
          background: rgba(154,92,255,.055);
        }

        .rt-tone-red .rt-metric-icon {
          color: #ff8496;
          background: rgba(255,91,116,.055);
        }

        .rt-metric-live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #4f6076;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .1em;
        }

        .rt-metric-label {
          position: relative;
          z-index: 2;
          margin-top: 16px;
          color: #5d6b80;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .11em;
        }

        .rt-metric-value {
          position: relative;
          z-index: 2;
          margin-top: 5px;
          color: #dfe6f1;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -.035em;
        }

        .rt-metric-helper {
          position: relative;
          z-index: 2;
          margin-top: 6px;
          color: #4f5d72;
          font-size: 8px;
          line-height: 1.4;
        }

        .rt-command-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 13px;
          margin-top: 14px;
        }

        .rt-command-panel {
          min-height: 315px;
          padding: 20px;
          box-sizing: border-box;
          border: 1px solid rgba(111,137,198,.1);
          border-radius: 17px;
          background: rgba(11,17,29,.74);
        }

        .rt-panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .rt-panel-heading > div span {
          color: #5d7098;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .rt-panel-heading h2 {
          margin: 4px 0 0;
          color: #dfe6f1;
          font-size: 15px;
          letter-spacing: -.02em;
        }

        .rt-panel-heading > svg {
          color: #7088d9;
        }

        .rt-upcoming-list {
          margin-top: 16px;
        }

        .rt-upcoming-row {
          width: 100%;
          display: grid;
          grid-template-columns: 47px minmax(0, 1fr) auto;
          align-items: center;
          gap: 11px;
          padding: 10px 0;
          border: 0;
          border-top: 1px solid rgba(112,132,172,.065);
          background: transparent;
          color: inherit;
          cursor: pointer;
          text-align: left;
        }

        .rt-upcoming-date {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border: 1px solid rgba(106,137,224,.1);
          border-radius: 9px;
          background: rgba(84,117,226,.055);
        }

        .rt-upcoming-date strong {
          color: #c2d0f6;
          font-size: 13px;
        }

        .rt-upcoming-date span {
          color: #62718a;
          font-size: 6px;
          text-transform: uppercase;
        }

        .rt-upcoming-copy {
          min-width: 0;
        }

        .rt-upcoming-copy strong {
          display: block;
          overflow: hidden;
          color: #bdc8d9;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rt-upcoming-copy span {
          display: block;
          margin-top: 3px;
          color: #59677c;
          font-size: 8px;
        }

        .rt-upcoming-amount {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rt-upcoming-amount strong {
          font-size: 9px;
          white-space: nowrap;
        }

        .rt-upcoming-amount svg {
          color: #48566c;
        }

        .rt-mini-empty {
          min-height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #5a687e;
          font-size: 9px;
        }

        .rt-flow-visual {
          margin-top: 42px;
        }

        .rt-flow-bar {
          height: 14px;
          overflow: hidden;
          border: 1px solid rgba(111,139,198,.09);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
        }

        .rt-flow-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #ff7185, #b568ff);
          box-shadow: 0 0 25px rgba(180,91,255,.2);
        }

        .rt-flow-legend {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 17px;
        }

        .rt-flow-legend > div {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          column-gap: 7px;
        }

        .rt-flow-legend > div span:nth-child(2) {
          color: #65738a;
          font-size: 8px;
        }

        .rt-flow-legend strong {
          grid-column: 2;
          margin-top: 3px;
          color: #ccd5e4;
          font-size: 12px;
        }

        .rt-legend-dot {
          grid-row: span 2;
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .rt-dot-expense {
          background: #ff7084;
          box-shadow: 0 0 9px rgba(255,112,132,.45);
        }

        .rt-dot-income {
          background: #49d4a7;
          box-shadow: 0 0 9px rgba(73,212,167,.45);
        }

        .rt-intelligence-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 35px;
          padding: 11px;
          border: 1px solid rgba(119,101,219,.1);
          border-radius: 10px;
          color: #68768d;
          background: rgba(126,94,226,.035);
          font-size: 8px;
          line-height: 1.55;
        }

        .rt-intelligence-note svg {
          flex: 0 0 auto;
          color: #9a80ed;
        }

        .rt-list-section {
          margin-top: 17px;
        }

        .rt-list-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
        }

        .rt-section-eyebrow {
          color: #61749e;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .16em;
        }

        .rt-list-header h2 {
          margin: 5px 0 3px;
          color: #e2e8f2;
          font-size: 20px;
          letter-spacing: -.035em;
        }

        .rt-list-header p {
          margin: 0;
          color: #5d6b80;
          font-size: 9px;
        }

        .rt-live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border: 1px solid rgba(57,210,163,.1);
          border-radius: 999px;
          color: #55c9a4;
          background: rgba(49,210,162,.035);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .rt-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          padding: 10px;
          border: 1px solid rgba(111,137,198,.09);
          border-radius: 13px;
          background: rgba(11,17,29,.65);
        }

        .rt-search {
          flex: 1 1 230px;
          min-width: 190px;
          height: 35px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          border: 1px solid rgba(111,137,198,.1);
          border-radius: 8px;
          color: #63718a;
          background: rgba(255,255,255,.018);
        }

        .rt-search input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          color: #d9e1ed;
          background: transparent;
          font-size: 9px;
        }

        .rt-search input::placeholder {
          color: #4f5d73;
        }

        .rt-search button {
          display: grid;
          place-items: center;
          padding: 2px;
          border: 0;
          background: transparent;
          color: #56657b;
          cursor: pointer;
        }

        .rt-filter {
          position: relative;
          height: 35px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
          border: 1px solid rgba(111,137,198,.1);
          border-radius: 8px;
          color: #63718a;
          background: rgba(255,255,255,.018);
        }

        .rt-filter select {
          appearance: none;
          min-width: 92px;
          padding-right: 13px;
          border: 0;
          outline: 0;
          color: #8491a5;
          background: transparent;
          cursor: pointer;
          font-size: 8px;
        }

        .rt-filter select option {
          color: #dce3ee;
          background: #111927;
        }

        .rt-filter > svg:last-child {
          position: absolute;
          right: 7px;
          pointer-events: none;
        }

        .rt-reset-button {
          height: 35px;
          padding: 0 10px;
          border: 1px solid rgba(255,111,133,.12);
          border-radius: 8px;
          color: #ff8294;
          background: rgba(255,111,133,.035);
          cursor: pointer;
          font-size: 8px;
        }

        .rt-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 13px;
        }

        .rt-recurring-card {
          position: relative;
          overflow: hidden;
          min-width: 0;
          padding: 18px;
          border: 1px solid rgba(111,137,198,.1);
          border-radius: 16px;
          background:
            linear-gradient(145deg, rgba(14,21,34,.88), rgba(9,14,24,.88));
          color: inherit;
          cursor: pointer;
          text-align: left;
          transition:
            transform 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease;
        }

        .rt-recurring-card:hover {
          transform: translateY(-3px);
          border-color: rgba(111,142,224,.2);
          box-shadow: 0 18px 45px rgba(0,0,0,.2);
        }

        .rt-card-accent {
          position: absolute;
          top: 0;
          left: 18px;
          right: 18px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(104,135,245,.5), transparent);
        }

        .rt-recurring-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rt-recurring-card-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(106,137,220,.12);
          border-radius: 10px;
          color: #8299ef;
          background: rgba(82,113,222,.06);
        }

        .rt-card-heading {
          min-width: 0;
          flex: 1;
        }

        .rt-card-heading strong {
          display: block;
          overflow: hidden;
          color: #d2dae7;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rt-card-heading span {
          display: block;
          margin-top: 3px;
          color: #59677d;
          font-size: 8px;
        }

        .rt-card-more {
          color: #4e5b70;
        }

        .rt-card-amount {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 20px;
        }

        .rt-card-amount > span:first-child {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -.035em;
        }

        .rt-card-frequency {
          color: #4e5c71;
          font-size: 8px;
        }

        .rt-income-text {
          color: #59d5ad !important;
        }

        .rt-expense-text {
          color: #ff7f91 !important;
        }

        .rt-card-divider {
          height: 1px;
          margin: 16px 0;
          background: rgba(112,132,172,.07);
        }

        .rt-card-meta {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .rt-card-meta > div:first-child {
          display: flex;
          flex-direction: column;
        }

        .rt-card-meta span {
          color: #4f5d72;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .09em;
        }

        .rt-card-meta strong {
          margin-top: 4px;
          color: #aeb9cb;
          font-size: 9px;
        }

        .rt-status-pill,
        .rt-type-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          padding: 5px 7px;
          border-radius: 999px;
          font-size: 7px;
          font-weight: 750;
        }

        .rt-status-active {
          border: 1px solid rgba(53,211,164,.12);
          color: #57cda6;
          background: rgba(53,211,164,.045);
        }

        .rt-status-paused {
          border: 1px solid rgba(255,184,99,.1);
          color: #d7a260;
          background: rgba(255,184,99,.035);
        }

        .rt-type-income {
          border: 1px solid rgba(53,211,164,.1);
          color: #55cda6;
          background: rgba(53,211,164,.035);
        }

        .rt-type-expense {
          border: 1px solid rgba(255,111,133,.1);
          color: #ed788a;
          background: rgba(255,111,133,.035);
        }

        .rt-card-alert {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 12px;
          padding: 7px 8px;
          border: 1px solid rgba(255,187,91,.1);
          border-radius: 7px;
          color: #dca95e;
          background: rgba(255,187,91,.035);
          font-size: 7px;
        }

        .rt-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 15px;
          color: #4d5b70;
          font-size: 7px;
        }

        .rt-card-footer svg {
          color: #61718b;
        }

        .rt-loading,
        .rt-empty {
          min-height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          margin-top: 13px;
          border: 1px solid rgba(111,137,198,.09);
          border-radius: 17px;
          background: rgba(11,17,29,.6);
        }

        .rt-loading-orb,
        .rt-empty-icon {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(108,139,231,.16);
          border-radius: 16px;
          color: #7d96ed;
          background: rgba(82,114,225,.06);
        }

        .rt-loading strong,
        .rt-empty strong {
          color: #aeb9cb;
          font-size: 11px;
        }

        .rt-loading span,
        .rt-empty span {
          max-width: 390px;
          color: #56647a;
          font-size: 9px;
          text-align: center;
          line-height: 1.55;
        }

        .rt-error {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 13px;
          padding: 12px 14px;
          border: 1px solid rgba(255,103,128,.12);
          border-radius: 12px;
          background: rgba(255,91,116,.035);
        }

        .rt-error > div:first-child {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          color: #ff8295;
          background: rgba(255,91,116,.06);
        }

        .rt-error > div:nth-child(2) {
          flex: 1;
          min-width: 0;
        }

        .rt-error strong {
          display: block;
          color: #e4a5af;
          font-size: 9px;
        }

        .rt-error span {
          display: block;
          margin-top: 3px;
          color: #795d67;
          font-size: 8px;
        }

        .rt-error button {
          padding: 7px 10px;
          border: 1px solid rgba(255,111,133,.12);
          border-radius: 7px;
          color: #ff8798;
          background: rgba(255,111,133,.04);
          cursor: pointer;
          font-size: 8px;
        }

        .rt-bottom-strip {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 14px;
          padding: 13px;
          border: 1px solid rgba(111,137,198,.08);
          border-radius: 13px;
          background: rgba(11,17,29,.5);
        }

        .rt-bottom-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 9px;
          color: #57cda8;
          background: rgba(45,208,160,.05);
        }

        .rt-bottom-strip > div:nth-child(2) {
          min-width: 0;
          flex: 1;
        }

        .rt-bottom-strip strong {
          display: block;
          color: #aeb9cb;
          font-size: 9px;
        }

        .rt-bottom-strip span {
          display: block;
          margin-top: 3px;
          color: #536177;
          font-size: 8px;
        }

        .rt-bottom-strip code {
          margin-left: 3px;
          color: #7487b2;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .rt-bottom-status {
          display: flex !important;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto !important;
          color: #4fbc98 !important;
          font-size: 7px !important;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .rt-bottom-status span {
          width: 5px;
          height: 5px;
          margin: 0 !important;
          border-radius: 50%;
          background: #49d1a4;
        }

        .rt-modal-layer {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .rt-modal-backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(2,5,11,.68);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .rt-detail-modal {
          position: relative;
          z-index: 2;
          width: min(680px, 100%);
          max-height: min(780px, calc(100vh - 40px));
          overflow-y: auto;
          border: 1px solid rgba(111,140,204,.18);
          border-radius: 20px;
          background:
            linear-gradient(145deg, #151f32, #090f1b);
          box-shadow: 0 35px 110px rgba(0,0,0,.55);
          animation: rt-modal-in 180ms ease-out;
        }

        .rt-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding: 20px 21px;
          border-bottom: 1px solid rgba(112,132,172,.08);
        }

        .rt-modal-header span {
          color: #62759f;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .rt-modal-header h2 {
          margin: 5px 0 0;
          color: #e6ecf5;
          font-size: 19px;
          letter-spacing: -.03em;
        }

        .rt-modal-close {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(112,132,172,.1);
          border-radius: 9px;
          color: #718097;
          background: rgba(255,255,255,.025);
          cursor: pointer;
        }

        .rt-modal-hero {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 19px 21px;
        }

        .rt-modal-hero-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 14px;
        }

        .rt-modal-income {
          color: #59d5ad;
          background: rgba(53,211,164,.07);
        }

        .rt-modal-expense {
          color: #ff7f91;
          background: rgba(255,111,133,.07);
        }

        .rt-modal-hero > div:nth-child(2) {
          flex: 1;
        }

        .rt-modal-hero > div:nth-child(2) span,
        .rt-modal-hero > div:nth-child(2) small {
          display: block;
          color: #59677c;
          font-size: 7px;
          text-transform: uppercase;
        }

        .rt-modal-hero > div:nth-child(2) strong {
          display: block;
          margin: 3px 0;
          color: #e3e9f3;
          font-size: 21px;
        }

        .rt-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          margin: 0 21px;
          overflow: hidden;
          border: 1px solid rgba(112,132,172,.08);
          border-radius: 12px;
          background: rgba(112,132,172,.08);
        }

        .rt-detail-grid > div {
          min-width: 0;
          padding: 13px;
          background: rgba(10,16,27,.88);
        }

        .rt-detail-grid span {
          display: block;
          color: #56657b;
          font-size: 7px;
          font-weight: 750;
          letter-spacing: .08em;
        }

        .rt-detail-grid strong {
          display: block;
          margin-top: 5px;
          color: #bbc6d6;
          font-size: 9px;
        }

        .rt-modal-section {
          margin: 16px 21px 0;
          padding: 13px;
          border: 1px solid rgba(119,101,219,.09);
          border-radius: 11px;
          background: rgba(126,94,226,.025);
        }

        .rt-modal-section-heading {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #9c8bea;
        }

        .rt-modal-section-heading strong {
          color: #aeb6cb;
          font-size: 9px;
        }

        .rt-modal-section p {
          margin: 8px 0 0;
          color: #647188;
          font-size: 8px;
          line-height: 1.6;
        }

        .rt-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          padding: 17px 21px;
        }

        .rt-modal-actions button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid rgba(112,132,172,.1);
          border-radius: 8px;
          color: #78869b;
          background: rgba(255,255,255,.025);
          cursor: pointer;
          font-size: 8px;
        }

        .rt-modal-actions button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .rt-spin {
          animation: rt-spin 1s linear infinite;
        }

        @keyframes rt-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rt-orbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rt-orbit-reverse {
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes rt-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes rt-modal-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 1150px) {
          .rt-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .rt-metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .rt-hero {
            grid-template-columns: 1fr;
          }

          .rt-hero-visual {
            min-height: 230px;
          }

          .rt-command-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .rt-page {
            padding-top: 18px;
            padding-bottom: 100px;
          }

          .rt-hero {
            min-height: 0;
            padding: 25px 20px;
            border-radius: 19px;
          }

          .rt-hero h1 {
            font-size: 39px;
          }

          .rt-hero-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .rt-primary-button,
          .rt-source-badge {
            justify-content: center;
          }

          .rt-hero-visual {
            min-height: 210px;
          }

          .rt-orbit-one {
            width: 190px;
            height: 190px;
          }

          .rt-orbit-two {
            width: 130px;
            height: 130px;
          }

          .rt-metrics-grid {
            grid-template-columns: 1fr 1fr;
          }

          .rt-metric-card {
            min-height: 135px;
            padding: 13px;
          }

          .rt-metric-value {
            font-size: 17px;
          }

          .rt-card-grid {
            grid-template-columns: 1fr;
          }

          .rt-toolbar {
            align-items: stretch;
          }

          .rt-search {
            flex-basis: 100%;
          }

          .rt-filter {
            flex: 1 1 42%;
          }

          .rt-filter select {
            width: 100%;
          }

          .rt-list-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .rt-bottom-strip {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .rt-bottom-status {
            margin-left: 45px;
          }

          .rt-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 430px) {
          .rt-metrics-grid {
            grid-template-columns: 1fr;
          }

          .rt-metric-card {
            min-height: 125px;
          }

          .rt-floating-node {
            transform: scale(.85);
          }

          .rt-node-one {
            left: 0;
          }

          .rt-node-two {
            right: 0;
          }

          .rt-node-three {
            left: 4%;
          }

          .rt-flow-legend {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rt-orbit-one,
          .rt-orbit-two,
          .rt-floating-node,
          .rt-spin {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}