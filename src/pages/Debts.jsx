import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  Landmark,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import DebtForm from '../components/debts/DebtForm.jsx';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(object, keys) {
  for (const key of keys) {
    if (
      object &&
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] !== null &&
      object[key] !== undefined &&
      object[key] !== ''
    ) {
      return object[key];
    }
  }

  return null;
}

function firstNumber(object, keys) {
  const value = firstValue(object, keys);
  return toNumber(value);
}

function formatCurrency(value) {
  const number = toNumber(value);

  if (number === null) {
    return '—';
  }

  return currencyFormatter.format(number);
}

function formatNumber(value) {
  const number = toNumber(value);

  if (number === null) {
    return '—';
  }

  return numberFormatter.format(number);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return dateFormatter.format(date);
}

function getDaysUntil(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  return Math.ceil(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function normalizeDebt(debt, index) {
  const originalBalance = firstNumber(debt, [
    'total_amount',
    'original_balance',
    'principal_amount',
    'principal',
    'initial_balance',
    'initial_amount',
    'loan_amount',
    'amount',
    'total_amount',
  ]);

  const outstandingBalance = firstNumber(debt, [
    'remaining_amount',
    'outstanding_balance',
    'remaining_balance',
    'current_balance',
    'balance',
    'remaining_amount',
    'outstanding_amount',
  ]);

  const minimumPayment = firstNumber(debt, [
    'minimum_payment',
    'min_payment',
    'monthly_payment',
    'payment_amount',
    'emi',
    'installment_amount',
  ]);

  const interestRate = firstNumber(debt, [
    'interest_rate',
    'apr',
    'interest',
  ]);

  const dueDate = firstValue(debt, [
    'due_date',
    'payment_due_date',
    'next_payment_date',
    'next_due_date',
  ]);

  const name = firstValue(debt, [
    'debt_name',
    'name',
    'loan_name',
    'debt_type',
    'loan_type',
    'description',
    'lender',
    'creditor',
  ]);

  const lender = firstValue(debt, [
    'lender',
    'creditor',
    'institution',
    'provider',
    'bank_name',
  ]);

  const explicitStatus = firstValue(debt, [
    'status',
    'debt_status',
    'loan_status',
  ]);

  let status = explicitStatus
    ? String(explicitStatus)
    : null;

  if (!status && outstandingBalance !== null) {
    status =
      outstandingBalance <= 0
        ? 'Cleared'
        : 'Active';
  }

  const paidAmount =
    originalBalance !== null &&
    outstandingBalance !== null
      ? Math.max(
          originalBalance - outstandingBalance,
          0,
        )
      : null;

  const progress =
    originalBalance !== null &&
    originalBalance > 0 &&
    outstandingBalance !== null
      ? Math.min(
          Math.max(
            ((originalBalance - outstandingBalance) /
              originalBalance) *
              100,
            0,
          ),
          100,
        )
      : null;

  const daysUntilDue = getDaysUntil(dueDate);

  let urgency = 'neutral';

  if (
    outstandingBalance !== null &&
    outstandingBalance <= 0
  ) {
    urgency = 'cleared';
  } else if (daysUntilDue !== null) {
    if (daysUntilDue < 0) {
      urgency = 'overdue';
    } else if (daysUntilDue <= 7) {
      urgency = 'soon';
    } else if (daysUntilDue <= 30) {
      urgency = 'upcoming';
    } else {
      urgency = 'normal';
    }
  }

  return {
    raw: debt,
    id:
      firstValue(debt, [
        'debt_id',
        'id',
      ]) ?? `debt-${index}`,

    name:
      name ||
      `Debt #${
        firstValue(debt, ['debt_id', 'id']) ??
        index + 1
      }`,

    lender,
    originalBalance,
    outstandingBalance,
    minimumPayment,
    interestRate,
    dueDate,
    status,
    paidAmount,
    progress,
    daysUntilDue,
    urgency,
  };
}

function normalizeSummary(summary) {
  if (!Array.isArray(summary)) {
    return [];
  }

  return summary;
}

function getStatusClass(status) {
  const value = String(status || '').toLowerCase();

  if (
    value.includes('clear') ||
    value.includes('paid') ||
    value.includes('complete') ||
    value.includes('closed')
  ) {
    return 'cleared';
  }

  if (
    value.includes('overdue') ||
    value.includes('critical') ||
    value.includes('default')
  ) {
    return 'danger';
  }

  if (
    value.includes('pending') ||
    value.includes('inactive')
  ) {
    return 'warning';
  }

  return 'active';
}

function getStatusLabel(debt) {
  if (debt.status) {
    return String(debt.status);
  }

  if (debt.outstandingBalance !== null) {
    return debt.outstandingBalance <= 0
      ? 'Cleared'
      : 'Active';
  }

  return 'Unspecified';
}

function getUrgencyLabel(debt) {
  if (debt.urgency === 'overdue') {
    return 'Overdue';
  }

  if (debt.urgency === 'soon') {
    return 'Due soon';
  }

  if (debt.urgency === 'upcoming') {
    return 'Upcoming';
  }

  if (debt.urgency === 'cleared') {
    return 'Cleared';
  }

  return null;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'blue',
}) {
  return (
    <div className={`debt-metric debt-metric-${tone}`}>
      <div className="debt-metric-top">
        <div className="debt-metric-icon">
          <Icon size={19} strokeWidth={2} />
        </div>

        <MoreHorizontal
          size={18}
          className="debt-muted-icon"
        />
      </div>

      <div className="debt-metric-label">
        {label}
      </div>

      <div className="debt-metric-value">
        {value}
      </div>

      {detail ? (
        <div className="debt-metric-detail">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

function ProgressRing({ progress }) {
  if (progress === null) {
    return (
      <div className="debt-progress-ring debt-progress-ring-na">
        <span>—</span>
      </div>
    );
  }

  const safeProgress = Math.min(
    Math.max(progress, 0),
    100,
  );

  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference -
    (safeProgress / 100) * circumference;

  return (
    <div className="debt-progress-ring">
      <svg
        viewBox="0 0 72 72"
        className="debt-progress-svg"
      >
        <circle
          cx="36"
          cy="36"
          r={radius}
          className="debt-progress-track"
        />

        <circle
          cx="36"
          cy="36"
          r={radius}
          className="debt-progress-value"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <span>
        {Math.round(safeProgress)}%
      </span>
    </div>
  );
}

function DebtCard({ debt, onOpen }) {
  const statusClass =
    getStatusClass(debt.status);

  const urgencyLabel =
    getUrgencyLabel(debt);

  return (
    <article className="debt-card">
      <div className="debt-card-glow" />

      <div className="debt-card-header">
        <div className="debt-identity">
          <div className="debt-avatar">
            <CreditCard
              size={19}
              strokeWidth={2}
            />
          </div>

          <div className="debt-identity-copy">
            <div className="debt-name">
              {debt.name}
            </div>

            {debt.lender ? (
              <div className="debt-lender">
                {debt.lender}
              </div>
            ) : (
              <div className="debt-lender">
                Debt ID #{debt.id}
              </div>
            )}
          </div>
        </div>

        <div className="debt-card-actions">
          {urgencyLabel ? (
            <span
              className={`debt-urgency debt-urgency-${debt.urgency}`}
            >
              {debt.urgency === 'overdue' ? (
                <AlertTriangle size={13} />
              ) : debt.urgency === 'cleared' ? (
                <CheckCircle2 size={13} />
              ) : (
                <Clock3 size={13} />
              )}

              {urgencyLabel}
            </span>
          ) : null}

          <span
            className={`debt-status debt-status-${statusClass}`}
          >
            {getStatusLabel(debt)}
          </span>
        </div>
      </div>

      <div className="debt-card-main">
        <div className="debt-balance-block">
          <span className="debt-balance-label">
            Outstanding balance
          </span>

          <strong className="debt-balance">
            {formatCurrency(
              debt.outstandingBalance,
            )}
          </strong>

          {debt.originalBalance !== null ? (
            <span className="debt-original">
              of {formatCurrency(debt.originalBalance)}
            </span>
          ) : null}
        </div>

        <ProgressRing
          progress={debt.progress}
        />
      </div>

      <div className="debt-card-divider" />

      <div className="debt-card-stats">
        <div>
          <span>Minimum payment</span>
          <strong>
            {formatCurrency(
              debt.minimumPayment,
            )}
          </strong>
        </div>

        <div>
          <span>Interest</span>
          <strong>
            {debt.interestRate !== null
              ? `${formatNumber(
                  debt.interestRate,
                )}%`
              : '—'}
          </strong>
        </div>

        <div>
          <span>Due date</span>
          <strong>
            {formatDate(debt.dueDate)}
          </strong>
        </div>
      </div>

      <button
        type="button"
        className="debt-card-open"
        onClick={() => onOpen(debt)}
      >
        <span>View debt intelligence</span>
        <ChevronRight size={17} />
      </button>
    </article>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="debt-empty">
      <div className="debt-empty-icon">
        <Landmark size={27} />
      </div>

      <h3>
        {hasFilters
          ? 'No debts match your filters'
          : 'No debt records found'}
      </h3>

      <p>
        {hasFilters
          ? 'Try changing the search or status filter.'
          : 'The connected database did not return any debt records for this user.'}
      </p>

      {hasFilters ? (
        <button
          type="button"
          className="debt-secondary-button"
          onClick={onClear}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="debt-loading">
      <Loader2
        size={28}
        className="debt-spinner"
      />

      <span>
        Loading real debt intelligence…
      </span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="debt-error">
      <div className="debt-error-icon">
        <AlertTriangle size={24} />
      </div>

      <div>
        <strong>
          Unable to load debt data
        </strong>

        <p>{message}</p>
      </div>

      <button
        type="button"
        className="debt-retry-button"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="debt-detail-row">
      <div className="debt-detail-label">
        {Icon ? <Icon size={15} /> : null}
        <span>{label}</span>
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function DebtDetailsModal({
  debt,
  onClose,
}) {
  if (!debt) {
    return null;
  }

  const rawFields = Object.entries(
    debt.raw || {},
  );

  return (
    <div
      className="debt-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="debt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-modal-title"
      >
        <div className="debt-modal-header">
          <div>
            <span className="debt-modal-eyebrow">
              Debt intelligence
            </span>

            <h2 id="debt-modal-title">
              {debt.name}
            </h2>

            {debt.lender ? (
              <p>{debt.lender}</p>
            ) : null}
          </div>

          <button
            type="button"
            className="debt-modal-close"
            onClick={onClose}
            aria-label="Close debt details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="debt-modal-highlight">
          <div>
            <span>Outstanding balance</span>

            <strong>
              {formatCurrency(
                debt.outstandingBalance,
              )}
            </strong>
          </div>

          <ProgressRing
            progress={debt.progress}
          />
        </div>

        <div className="debt-detail-grid">
          <DetailRow
            label="Original balance"
            value={formatCurrency(
              debt.originalBalance,
            )}
            icon={CircleDollarSign}
          />

          <DetailRow
            label="Paid amount"
            value={formatCurrency(
              debt.paidAmount,
            )}
            icon={CheckCircle2}
          />

          <DetailRow
            label="Minimum payment"
            value={formatCurrency(
              debt.minimumPayment,
            )}
            icon={Banknote}
          />

          <DetailRow
            label="Interest rate"
            value={
              debt.interestRate !== null
                ? `${formatNumber(
                    debt.interestRate,
                  )}%`
                : '—'
            }
            icon={TrendingDown}
          />

          <DetailRow
            label="Due date"
            value={formatDate(
              debt.dueDate,
            )}
            icon={CalendarClock}
          />

          <DetailRow
            label="Status"
            value={getStatusLabel(debt)}
            icon={ShieldCheck}
          />
        </div>

        <div className="debt-modal-section">
          <div className="debt-modal-section-heading">
            <div>
              <span>Database record</span>
              <h3>Source fields</h3>
            </div>

            <span className="debt-field-count">
              {rawFields.length} fields
            </span>
          </div>

          {rawFields.length ? (
            <div className="debt-raw-grid">
              {rawFields.map(
                ([key, value]) => (
                  <div
                    className="debt-raw-field"
                    key={key}
                  >
                    <span>{key}</span>

                    <strong>
                      {value === null ||
                      value === undefined ||
                      value === ''
                        ? '—'
                        : typeof value ===
                          'object'
                        ? JSON.stringify(
                            value,
                          )
                        : String(value)}
                    </strong>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="debt-no-fields">
              No raw fields were returned.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InsightPanel({
  debts,
  totalOutstanding,
  totalMinimumPayment,
}) {
  const activeDebts = debts.filter(
    (debt) =>
      debt.outstandingBalance !== null &&
      debt.outstandingBalance > 0,
  );

  const overdueDebts = debts.filter(
    (debt) => debt.urgency === 'overdue',
  );

  const dueSoonDebts = debts.filter(
    (debt) =>
      debt.urgency === 'soon',
  );

  const completedDebts = debts.filter(
    (debt) =>
      debt.urgency === 'cleared',
  );

  const totalOriginal = debts.reduce(
    (sum, debt) =>
      sum +
      (debt.originalBalance || 0),
    0,
  );

  const totalPaid = debts.reduce(
    (sum, debt) =>
      sum +
      (debt.paidAmount || 0),
    0,
  );

  const overallProgress =
    totalOriginal > 0
      ? Math.min(
          Math.max(
            (totalPaid / totalOriginal) *
              100,
            0,
          ),
          100,
        )
      : null;

  return (
    <div className="debt-intelligence">
      <div className="debt-intelligence-heading">
        <div>
          <span className="debt-section-kicker">
            FINANCIAL INTELLIGENCE
          </span>

          <h2>
            Debt control center
          </h2>

          <p>
            Derived from the debt records and
            analytical responses returned by
            your backend.
          </p>
        </div>

        <div className="debt-live-indicator">
          <span />
          Live database data
        </div>
      </div>

      <div className="debt-intelligence-grid">
        <div className="debt-intelligence-main">
          <div className="debt-overview-visual">
            <div className="debt-orbit">
              <div className="debt-orbit-inner">
                <CircleDollarSign
                  size={28}
                />

                <span>
                  {formatCurrency(
                    totalOutstanding,
                  )}
                </span>

                <small>
                  outstanding
                </small>
              </div>
            </div>

            <div className="debt-overview-copy">
              <span>
                CURRENT EXPOSURE
              </span>

              <h3>
                {formatCurrency(
                  totalOutstanding,
                )}
              </h3>

              <p>
                Across {activeDebts.length}{' '}
                active debt
                {activeDebts.length === 1
                  ? ''
                  : 's'}
                .
              </p>

              {totalMinimumPayment !==
              null ? (
                <div className="debt-payment-chip">
                  <Banknote size={14} />
                  Minimum payments:{' '}
                  {formatCurrency(
                    totalMinimumPayment,
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="debt-progress-panel">
            <div className="debt-progress-panel-header">
              <div>
                <span>
                  REPAYMENT PROGRESS
                </span>

                <strong>
                  {overallProgress !==
                  null
                    ? `${Math.round(
                        overallProgress,
                      )}%`
                    : '—'}
                </strong>
              </div>

              {overallProgress !==
              null ? (
                <span>
                  {formatCurrency(
                    totalPaid,
                  )}{' '}
                  paid
                </span>
              ) : (
                <span>
                  Insufficient source fields
                </span>
              )}
            </div>

            <div className="debt-wide-progress">
              <div
                style={{
                  width:
                    overallProgress !==
                    null
                      ? `${overallProgress}%`
                      : '0%',
                }}
              />
            </div>
          </div>
        </div>

        <div className="debt-signal-stack">
          <div className="debt-signal debt-signal-danger">
            <div className="debt-signal-icon">
              <AlertTriangle size={18} />
            </div>

            <div>
              <strong>
                {overdueDebts.length}
              </strong>

              <span>
                overdue
              </span>
            </div>
          </div>

          <div className="debt-signal debt-signal-warning">
            <div className="debt-signal-icon">
              <Clock3 size={18} />
            </div>

            <div>
              <strong>
                {dueSoonDebts.length}
              </strong>

              <span>
                due within 7 days
              </span>
            </div>
          </div>

          <div className="debt-signal debt-signal-success">
            <div className="debt-signal-icon">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <strong>
                {completedDebts.length}
              </strong>

              <span>
                cleared
              </span>
            </div>
          </div>

          <div className="debt-signal debt-signal-neutral">
            <div className="debt-signal-icon">
              <TrendingDown size={18} />
            </div>

            <div>
              <strong>
                {formatCurrency(
                  totalMinimumPayment,
                )}
              </strong>

              <span>
                minimum payments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [metrics, setMetrics] =
    useState({
      debtCount: 0,
      totalOutstanding: 0,
      totalMinimumPayment: 0,
    });

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

  const [sortBy, setSortBy] =
    useState('outstanding');

  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isDebtFormOpen, setIsDebtFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSaveDebt = async (formData) => {
    setSubmitting(true);
    try {
      const isEdit = Boolean(editingDebt?.id);
      const url = isEdit
        ? `${API_BASE_URL}/debts/${USER_ID}/${editingDebt.id}`
        : `${API_BASE_URL}/debts/${USER_ID}`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debt_name: formData.name,
          total_amount: Number(formData.originalAmount),
          remaining_amount: Number(formData.currentBalance),
          interest_rate: Number(formData.interestRate || 0),
          minimum_payment: Number(formData.minimumPayment || 0),
          due_date: formData.dueDate || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save debt record.');
      setIsDebtFormOpen(false);
      setEditingDebt(null);
      await loadDebts({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to save debt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    try {
      await fetch(`${API_BASE_URL}/debts/${USER_ID}/${debtId}`, { method: 'DELETE' });
      setSelectedDebt(null);
      await loadDebts({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to delete debt.');
    }
  };

  const [showFilters, setShowFilters] =
    useState(false);

  const loadDebts = useCallback(
    async ({ silent = false } = {}) => {
      if (!USER_ID) {
        setError(
          'VITE_FINSIGHT_USER_ID is not configured. Add the real FinSight user ID to the frontend environment file.',
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
        const response =
          await fetch(
            `${API_BASE_URL}/debts/${USER_ID}/overview`,
          );

        if (!response.ok) {
          throw new Error(
            `Debt API returned HTTP ${response.status}.`,
          );
        }

        const payload =
          await response.json();

        if (!payload?.success) {
          throw new Error(
            payload?.message ||
              'The debt API returned an unsuccessful response.',
          );
        }

        const data =
          payload.data || {};

        const rawDebts = Array.isArray(
          data.debts,
        )
          ? data.debts
          : [];

        const normalized =
          rawDebts.map(
            normalizeDebt,
          );

        const returnedMetrics =
          data.metrics || {};

        const calculatedOutstanding =
          normalized.reduce(
            (sum, debt) =>
              sum +
              (debt.outstandingBalance ||
                0),
            0,
          );

        const calculatedMinimum =
          normalized.reduce(
            (sum, debt) =>
              sum +
              (debt.minimumPayment ||
                0),
            0,
          );

        setDebts(normalized);

        setSummary(
          normalizeSummary(
            data.summary,
          ),
        );

        setMetrics({
          debtCount:
            toNumber(
              returnedMetrics.debtCount,
            ) ??
            normalized.length,

          totalOutstanding:
            toNumber(
              returnedMetrics.totalOutstanding,
            ) ??
            calculatedOutstanding,

          totalMinimumPayment:
            toNumber(
              returnedMetrics.totalMinimumPayment,
            ) ??
            calculatedMinimum,
        });
      } catch (requestError) {
        console.error(
          'FinSight debt overview error:',
          requestError,
        );

        setError(
          requestError?.message ||
            'Unable to connect to the FinSight debt API.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const filteredDebts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const filtered = debts.filter(
      (debt) => {
        const searchable = [
          debt.name,
          debt.lender,
          debt.status,
          debt.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchable.includes(query);

        const status =
          String(
            debt.status || '',
          ).toLowerCase();

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter ===
            'active' &&
            (status.includes(
              'active',
            ) ||
              (!status &&
                debt.outstandingBalance >
                  0))) ||
          (statusFilter ===
            'cleared' &&
            (status.includes(
              'clear',
            ) ||
              status.includes(
                'paid',
              ) ||
              debt.outstandingBalance ===
                0)) ||
          (statusFilter ===
            'attention' &&
            (debt.urgency ===
              'overdue' ||
              debt.urgency ===
                'soon'));

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );

    return [...filtered].sort(
      (a, b) => {
        if (
          sortBy ===
          'outstanding'
        ) {
          return (
            (b.outstandingBalance ||
              0) -
            (a.outstandingBalance ||
              0)
          );
        }

        if (sortBy === 'due') {
          const aDate =
            a.dueDate
              ? new Date(
                  a.dueDate,
                ).getTime()
              : Number.POSITIVE_INFINITY;

          const bDate =
            b.dueDate
              ? new Date(
                  b.dueDate,
                ).getTime()
              : Number.POSITIVE_INFINITY;

          return aDate - bDate;
        }

        if (
          sortBy ===
          'progress'
        ) {
          return (
            (b.progress || 0) -
            (a.progress || 0)
          );
        }

        if (
          sortBy ===
          'payment'
        ) {
          return (
            (b.minimumPayment ||
              0) -
            (a.minimumPayment ||
              0)
          );
        }

        return String(
          a.name,
        ).localeCompare(
          String(b.name),
        );
      },
    );
  }, [
    debts,
    search,
    sortBy,
    statusFilter,
  ]);

  const averageInterest =
    useMemo(() => {
      const rates = debts
        .map(
          (debt) =>
            debt.interestRate,
        )
        .filter(
          (rate) =>
            rate !== null &&
            Number.isFinite(rate),
        );

      if (!rates.length) {
        return null;
      }

      return (
        rates.reduce(
          (sum, rate) =>
            sum + rate,
          0,
        ) / rates.length
      );
    }, [debts]);

  const activeCount =
    debts.filter(
      (debt) =>
        debt.outstandingBalance !==
          null &&
        debt.outstandingBalance >
          0,
    ).length;

  const clearedCount =
    debts.filter(
      (debt) =>
        debt.outstandingBalance !==
          null &&
        debt.outstandingBalance <=
          0,
    ).length;

  const attentionCount =
    debts.filter(
      (debt) =>
        debt.urgency ===
          'overdue' ||
        debt.urgency ===
          'soon',
    ).length;

  const hasFilters =
    Boolean(
      search.trim(),
    ) ||
    statusFilter !==
      'all';

  const clearFilters =
    () => {
      setSearch('');
      setStatusFilter(
        'all',
      );
      setSortBy(
        'outstanding',
      );
    };

  return (
    <>
      <style>{`
        .debts-page {
          position: relative;
          min-height: 100%;
          padding: 28px;
          color: var(--text-primary, #f4f7fb);
          overflow-x: hidden;
        }

        .debts-page::before {
          content: "";
          position: fixed;
          width: 520px;
          height: 520px;
          top: 90px;
          right: -260px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(72, 116, 255, 0.12),
            transparent 68%
          );
          pointer-events: none;
          z-index: 0;
        }

        .debts-page::after {
          content: "";
          position: fixed;
          width: 440px;
          height: 440px;
          bottom: -260px;
          left: -200px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(31, 208, 161, 0.08),
            transparent 68%
          );
          pointer-events: none;
          z-index: 0;
        }

        .debts-shell {
          position: relative;
          z-index: 1;
          max-width: 1700px;
          margin: 0 auto;
        }

        .debt-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .debt-page-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          color: #7e9cff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .debt-page-kicker::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5f85ff;
          box-shadow: 0 0 14px rgba(95, 133, 255, 0.8);
        }

        .debt-page-title {
          margin: 0;
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.02;
          font-weight: 850;
          letter-spacing: -0.045em;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #bfcaff 52%,
            #87a5ff 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .debt-page-subtitle {
          max-width: 700px;
          margin: 12px 0 0;
          color: #8994aa;
          font-size: 14px;
          line-height: 1.7;
        }

        .debt-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .debt-refresh-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border: 1px solid rgba(122, 145, 194, 0.18);
          border-radius: 12px;
          padding: 11px 15px;
          background: rgba(18, 24, 38, 0.72);
          color: #dce5f7;
          cursor: pointer;
          transition: 180ms ease;
          backdrop-filter: blur(14px);
        }

        .debt-refresh-button:hover {
          border-color: rgba(104, 139, 255, 0.5);
          background: rgba(27, 37, 61, 0.9);
          transform: translateY(-1px);
        }

        .debt-refresh-button:disabled {
          opacity: 0.6;
          cursor: wait;
          transform: none;
        }

        .debt-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .debt-metric {
          position: relative;
          min-height: 150px;
          padding: 18px;
          overflow: hidden;
          border: 1px solid rgba(117, 139, 183, 0.14);
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              rgba(22, 29, 46, 0.95),
              rgba(12, 17, 28, 0.9)
            );
          box-shadow:
            0 20px 45px rgba(0, 0, 0, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .debt-metric::after {
          content: "";
          position: absolute;
          width: 150px;
          height: 150px;
          right: -75px;
          top: -75px;
          border-radius: 50%;
          background: var(--metric-glow);
          opacity: 0.75;
          filter: blur(20px);
          pointer-events: none;
        }

        .debt-metric-blue {
          --metric-glow: rgba(74, 113, 255, 0.17);
        }

        .debt-metric-purple {
          --metric-glow: rgba(151, 91, 255, 0.16);
        }

        .debt-metric-green {
          --metric-glow: rgba(28, 202, 153, 0.15);
        }

        .debt-metric-orange {
          --metric-glow: rgba(255, 151, 57, 0.15);
        }

        .debt-metric-top {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 19px;
        }

        .debt-metric-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(120, 145, 198, 0.15);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.035);
          color: #9bb4ff;
        }

        .debt-metric-label {
          position: relative;
          z-index: 1;
          color: #77839a;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .debt-metric-value {
          position: relative;
          z-index: 1;
          margin-top: 5px;
          color: #f5f7fb;
          font-size: clamp(20px, 2.2vw, 28px);
          font-weight: 800;
          letter-spacing: -0.035em;
        }

        .debt-metric-detail {
          position: relative;
          z-index: 1;
          margin-top: 6px;
          color: #66748c;
          font-size: 11px;
        }

        .debt-muted-icon {
          color: #4e5a6d;
        }

        .debt-intelligence {
          position: relative;
          margin-bottom: 22px;
          padding: 24px;
          overflow: hidden;
          border: 1px solid rgba(100, 131, 211, 0.2);
          border-radius: 22px;
          background:
            linear-gradient(
              120deg,
              rgba(22, 31, 53, 0.96),
              rgba(13, 20, 35, 0.97)
            );
          box-shadow:
            0 28px 70px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        .debt-intelligence::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(98, 129, 255, 0.055) 50%,
              transparent 100%
            );
          pointer-events: none;
        }

        .debt-intelligence-heading {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .debt-section-kicker {
          color: #6e8dff;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.18em;
        }

        .debt-intelligence-heading h2 {
          margin: 5px 0 4px;
          color: #f4f7ff;
          font-size: 22px;
          letter-spacing: -0.025em;
        }

        .debt-intelligence-heading p {
          margin: 0;
          color: #7d899f;
          font-size: 12px;
        }

        .debt-live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border: 1px solid rgba(52, 205, 156, 0.18);
          border-radius: 999px;
          color: #86daba;
          background: rgba(36, 176, 131, 0.06);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .debt-live-indicator span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #32d39c;
          box-shadow: 0 0 12px rgba(50, 211, 156, 0.85);
        }

        .debt-intelligence-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(250px, 0.8fr);
          gap: 18px;
        }

        .debt-intelligence-main {
          min-width: 0;
          padding: 22px;
          border: 1px solid rgba(114, 136, 184, 0.12);
          border-radius: 17px;
          background: rgba(5, 9, 18, 0.26);
        }

        .debt-overview-visual {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .debt-orbit {
          position: relative;
          width: 152px;
          height: 152px;
          flex: 0 0 152px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(82, 115, 255, 0.18) 0%,
              rgba(82, 115, 255, 0.04) 48%,
              transparent 69%
            );
        }

        .debt-orbit::before,
        .debt-orbit::after {
          content: "";
          position: absolute;
          border: 1px solid rgba(94, 128, 255, 0.22);
          border-radius: 50%;
        }

        .debt-orbit::before {
          inset: 8px;
        }

        .debt-orbit::after {
          inset: 23px;
          border-style: dashed;
          opacity: 0.55;
        }

        .debt-orbit-inner {
          position: relative;
          z-index: 2;
          width: 102px;
          height: 102px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 2px;
          border: 1px solid rgba(125, 151, 230, 0.18);
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.94);
          box-shadow: 0 0 35px rgba(75, 111, 255, 0.12);
          color: #8ca7ff;
        }

        .debt-orbit-inner span {
          max-width: 94px;
          overflow: hidden;
          color: #f5f7ff;
          font-size: 13px;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .debt-orbit-inner small {
          color: #6e7b91;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .debt-overview-copy > span {
          color: #68758d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .debt-overview-copy h3 {
          margin: 6px 0;
          color: #ffffff;
          font-size: clamp(26px, 3vw, 38px);
          letter-spacing: -0.04em;
        }

        .debt-overview-copy p {
          margin: 0;
          color: #78859b;
          font-size: 12px;
        }

        .debt-payment-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 15px;
          padding: 8px 10px;
          border: 1px solid rgba(112, 139, 205, 0.13);
          border-radius: 9px;
          color: #9ba8bc;
          background: rgba(255, 255, 255, 0.025);
          font-size: 11px;
        }

        .debt-progress-panel {
          margin-top: 25px;
        }

        .debt-progress-panel-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 9px;
        }

        .debt-progress-panel-header div {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .debt-progress-panel-header div span {
          color: #68758d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .debt-progress-panel-header strong {
          color: #eef2ff;
          font-size: 18px;
        }

        .debt-progress-panel-header > span {
          color: #657289;
          font-size: 11px;
        }

        .debt-wide-progress {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.055);
        }

        .debt-wide-progress div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #4e72ff,
            #6d9bff,
            #31d5a0
          );
          box-shadow: 0 0 18px rgba(77, 117, 255, 0.35);
          transition: width 600ms ease;
        }

        .debt-signal-stack {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .debt-signal {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          padding: 15px;
          border: 1px solid rgba(110, 131, 174, 0.12);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.025);
        }

        .debt-signal-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
        }

        .debt-signal div:last-child {
          min-width: 0;
        }

        .debt-signal strong {
          display: block;
          color: #f2f5fb;
          font-size: 18px;
          line-height: 1;
        }

        .debt-signal span {
          display: block;
          margin-top: 4px;
          color: #707d93;
          font-size: 10px;
        }

        .debt-signal-danger .debt-signal-icon {
          color: #ff7c8c;
          background: rgba(255, 86, 107, 0.09);
        }

        .debt-signal-warning .debt-signal-icon {
          color: #ffc36c;
          background: rgba(255, 172, 67, 0.09);
        }

        .debt-signal-success .debt-signal-icon {
          color: #5fe0b3;
          background: rgba(42, 211, 158, 0.09);
        }

        .debt-signal-neutral .debt-signal-icon {
          color: #8eaaff;
          background: rgba(91, 123, 255, 0.09);
        }

        .debt-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .debt-toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .debt-search {
          position: relative;
          min-width: 260px;
          max-width: 440px;
          flex: 1;
        }

        .debt-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #59667c;
          pointer-events: none;
        }

        .debt-search input {
          width: 100%;
          height: 43px;
          box-sizing: border-box;
          border: 1px solid rgba(111, 133, 177, 0.14);
          border-radius: 12px;
          outline: none;
          padding: 0 14px 0 40px;
          background: rgba(16, 22, 35, 0.72);
          color: #eef2f9;
          font-size: 12px;
          transition: 180ms ease;
        }

        .debt-search input::placeholder {
          color: #536076;
        }

        .debt-search input:focus {
          border-color: rgba(93, 128, 255, 0.55);
          box-shadow: 0 0 0 3px rgba(73, 111, 255, 0.08);
        }

        .debt-filter-toggle {
          display: none;
        }

        .debt-filter-select {
          height: 43px;
          border: 1px solid rgba(111, 133, 177, 0.14);
          border-radius: 12px;
          outline: none;
          padding: 0 12px;
          background: rgba(16, 22, 35, 0.72);
          color: #b9c4d6;
          font-size: 12px;
          cursor: pointer;
        }

        .debt-results-count {
          color: #647188;
          font-size: 11px;
          white-space: nowrap;
        }

        .debt-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
        }

        .debt-card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(113, 135, 181, 0.13);
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              rgba(21, 28, 43, 0.94),
              rgba(11, 16, 26, 0.97)
            );
          box-shadow:
            0 18px 45px rgba(0, 0, 0, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.02);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .debt-card:hover {
          transform: translateY(-3px);
          border-color: rgba(101, 132, 219, 0.3);
          box-shadow:
            0 25px 55px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(85, 119, 225, 0.04);
        }

        .debt-card-glow {
          position: absolute;
          width: 160px;
          height: 160px;
          right: -90px;
          top: -90px;
          border-radius: 50%;
          background: rgba(79, 112, 255, 0.08);
          filter: blur(18px);
          pointer-events: none;
        }

        .debt-card-header {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          padding: 17px 17px 0;
        }

        .debt-identity {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .debt-avatar {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(103, 133, 218, 0.18);
          border-radius: 11px;
          background: rgba(82, 113, 226, 0.08);
          color: #8eaaff;
        }

        .debt-identity-copy {
          min-width: 0;
        }

        .debt-name {
          overflow: hidden;
          color: #edf2fb;
          font-size: 13px;
          font-weight: 780;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .debt-lender {
          margin-top: 3px;
          overflow: hidden;
          color: #69768b;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .debt-card-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .debt-status,
        .debt-urgency {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 750;
          white-space: nowrap;
        }

        .debt-status-active {
          color: #8da8ff;
          background: rgba(82, 116, 255, 0.09);
          border: 1px solid rgba(82, 116, 255, 0.14);
        }

        .debt-status-cleared {
          color: #70dfb8;
          background: rgba(39, 205, 153, 0.08);
          border: 1px solid rgba(39, 205, 153, 0.13);
        }

        .debt-status-danger {
          color: #ff8795;
          background: rgba(255, 83, 107, 0.08);
          border: 1px solid rgba(255, 83, 107, 0.13);
        }

        .debt-status-warning {
          color: #ffc36d;
          background: rgba(255, 176, 68, 0.08);
          border: 1px solid rgba(255, 176, 68, 0.13);
        }

        .debt-urgency-overdue {
          color: #ff8997;
          background: rgba(255, 81, 106, 0.08);
        }

        .debt-urgency-soon {
          color: #ffc16b;
          background: rgba(255, 174, 60, 0.08);
        }

        .debt-urgency-upcoming {
          color: #8ba7ff;
          background: rgba(77, 113, 255, 0.08);
        }

        .debt-urgency-cleared {
          color: #6eddb6;
          background: rgba(35, 201, 148, 0.08);
        }

        .debt-card-main {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 24px 17px 19px;
        }

        .debt-balance-block {
          min-width: 0;
        }

        .debt-balance-label {
          display: block;
          color: #657289;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .debt-balance {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #f6f8fc;
          font-size: clamp(22px, 2.4vw, 30px);
          font-weight: 850;
          letter-spacing: -0.045em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .debt-original {
          display: block;
          margin-top: 4px;
          color: #59667b;
          font-size: 10px;
        }

        .debt-progress-ring {
          position: relative;
          width: 70px;
          height: 70px;
          flex: 0 0 70px;
          display: grid;
          place-items: center;
        }

        .debt-progress-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .debt-progress-track {
          fill: none;
          stroke: rgba(255, 255, 255, 0.055);
          stroke-width: 7;
        }

        .debt-progress-value {
          fill: none;
          stroke: #6388ff;
          stroke-width: 7;
          stroke-linecap: round;
          filter: drop-shadow(0 0 5px rgba(99, 136, 255, 0.3));
        }

        .debt-progress-ring span {
          position: relative;
          z-index: 2;
          color: #dce5ff;
          font-size: 11px;
          font-weight: 800;
        }

        .debt-progress-ring-na {
          border: 1px dashed rgba(115, 135, 176, 0.2);
          border-radius: 50%;
        }

        .debt-card-divider {
          height: 1px;
          margin: 0 17px;
          background: rgba(112, 132, 172, 0.09);
        }

        .debt-card-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 15px 17px;
        }

        .debt-card-stats div {
          min-width: 0;
        }

        .debt-card-stats span {
          display: block;
          overflow: hidden;
          color: #58657a;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .debt-card-stats strong {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #c8d1e0;
          font-size: 11px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .debt-card-open {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 0;
          border-top: 1px solid rgba(112, 132, 172, 0.08);
          padding: 11px 17px;
          background: rgba(255, 255, 255, 0.012);
          color: #8198d8;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          text-align: left;
          transition: 180ms ease;
        }

        .debt-card-open:hover {
          color: #a8baff;
          background: rgba(90, 120, 255, 0.05);
        }

        .debt-empty,
        .debt-loading {
          min-height: 330px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          border: 1px dashed rgba(110, 132, 174, 0.16);
          border-radius: 18px;
          background: rgba(13, 18, 29, 0.48);
          text-align: center;
        }

        .debt-empty-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(99, 132, 222, 0.16);
          border-radius: 17px;
          background: rgba(82, 112, 217, 0.07);
          color: #829eff;
        }

        .debt-empty h3 {
          margin: 5px 0 0;
          color: #e5eaf4;
          font-size: 16px;
        }

        .debt-empty p {
          max-width: 420px;
          margin: 0;
          color: #68758a;
          font-size: 11px;
          line-height: 1.6;
        }

        .debt-secondary-button,
        .debt-retry-button {
          border: 1px solid rgba(99, 132, 222, 0.18);
          border-radius: 9px;
          padding: 9px 13px;
          background: rgba(77, 110, 225, 0.08);
          color: #91aaff;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .debt-loading {
          color: #7f8ca2;
          font-size: 12px;
        }

        .debt-spinner {
          animation: debt-spin 0.9s linear infinite;
          color: #7797ff;
        }

        .debt-error {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 18px;
          padding: 15px;
          border: 1px solid rgba(255, 83, 107, 0.16);
          border-radius: 14px;
          background: rgba(255, 60, 86, 0.045);
        }

        .debt-error-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: #ff8190;
          background: rgba(255, 75, 99, 0.08);
        }

        .debt-error > div:nth-child(2) {
          min-width: 0;
          flex: 1;
        }

        .debt-error strong {
          color: #f0b8bf;
          font-size: 12px;
        }

        .debt-error p {
          margin: 3px 0 0;
          overflow-wrap: anywhere;
          color: #876c72;
          font-size: 10px;
        }

        .debt-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(2, 5, 10, 0.74);
          backdrop-filter: blur(12px);
        }

        .debt-modal {
          width: min(780px, 100%);
          max-height: min(850px, 92vh);
          overflow: auto;
          border: 1px solid rgba(113, 139, 203, 0.22);
          border-radius: 22px;
          background:
            linear-gradient(
              145deg,
              #161f32,
              #0c121e
            );
          box-shadow:
            0 35px 100px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        .debt-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 23px 23px 0;
        }

        .debt-modal-eyebrow {
          color: #728fff;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .debt-modal-header h2 {
          margin: 5px 0 3px;
          color: #f3f6fc;
          font-size: 25px;
          letter-spacing: -0.035em;
        }

        .debt-modal-header p {
          margin: 0;
          color: #68758b;
          font-size: 11px;
        }

        .debt-modal-close {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(111, 134, 180, 0.15);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.025);
          color: #8290a6;
          cursor: pointer;
        }

        .debt-modal-highlight {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin: 22px 23px;
          padding: 20px;
          border: 1px solid rgba(100, 130, 207, 0.14);
          border-radius: 16px;
          background: rgba(79, 111, 221, 0.045);
        }

        .debt-modal-highlight span {
          display: block;
          color: #68758d;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .debt-modal-highlight strong {
          display: block;
          margin-top: 5px;
          color: #ffffff;
          font-size: 29px;
          letter-spacing: -0.04em;
        }

        .debt-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 0 23px;
        }

        .debt-detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          min-width: 0;
          padding: 12px;
          border: 1px solid rgba(109, 130, 171, 0.09);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.018);
        }

        .debt-detail-label {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          color: #6d7a90;
          font-size: 10px;
        }

        .debt-detail-label svg {
          flex: 0 0 auto;
          color: #7895ed;
        }

        .debt-detail-row > strong {
          overflow: hidden;
          color: #cdd5e3;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .debt-modal-section {
          margin-top: 23px;
          padding: 20px 23px 23px;
          border-top: 1px solid rgba(110, 132, 172, 0.09);
        }

        .debt-modal-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        .debt-modal-section-heading span:first-child {
          color: #637087;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .debt-modal-section-heading h3 {
          margin: 4px 0 0;
          color: #dfe5ef;
          font-size: 14px;
        }

        .debt-field-count {
          padding: 5px 8px;
          border-radius: 999px;
          color: #788aa9;
          background: rgba(100, 130, 207, 0.06);
          font-size: 9px;
        }

        .debt-raw-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }

        .debt-raw-field {
          min-width: 0;
          padding: 10px;
          border: 1px solid rgba(108, 129, 169, 0.08);
          border-radius: 9px;
          background: rgba(0, 0, 0, 0.12);
        }

        .debt-raw-field span {
          display: block;
          color: #56647a;
          font-size: 9px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .debt-raw-field strong {
          display: block;
          margin-top: 4px;
          overflow-wrap: anywhere;
          color: #abb7c9;
          font-size: 10px;
          font-weight: 600;
        }

        .debt-no-fields {
          color: #667389;
          font-size: 11px;
        }

        @keyframes debt-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1250px) {
          .debt-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .debt-metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .debts-page {
            padding: 20px;
          }

          .debt-intelligence-grid {
            grid-template-columns: 1fr;
          }

          .debt-intelligence-main {
            min-width: 0;
          }

          .debt-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .debt-toolbar-left {
            width: 100%;
          }

          .debt-search {
            max-width: none;
          }

          .debt-filter-select {
            width: 100%;
          }

          .debt-results-count {
            display: none;
          }
        }

        @media (max-width: 680px) {
          .debts-page {
            padding: 15px;
          }

          .debt-page-header {
            flex-direction: column;
          }

          .debt-header-actions {
            width: 100%;
          }

          .debt-refresh-button {
            width: 100%;
            justify-content: center;
          }

          .debt-metrics-grid {
            grid-template-columns: 1fr 1fr;
          }

          .debt-intelligence {
            padding: 16px;
          }

          .debt-intelligence-heading {
            flex-direction: column;
          }

          .debt-overview-visual {
            align-items: flex-start;
            flex-direction: column;
          }

          .debt-orbit {
            width: 125px;
            height: 125px;
            flex-basis: 125px;
          }

          .debt-orbit-inner {
            width: 86px;
            height: 86px;
          }

          .debt-signal-stack {
            grid-template-columns: 1fr;
          }

          .debt-card-grid {
            grid-template-columns: 1fr;
          }

          .debt-card-header {
            flex-wrap: wrap;
          }

          .debt-card-actions {
            flex-direction: row;
            align-items: center;
          }

          .debt-detail-grid,
          .debt-raw-grid {
            grid-template-columns: 1fr;
          }

          .debt-modal-highlight {
            margin: 18px;
          }

          .debt-modal-header,
          .debt-detail-grid {
            padding-left: 18px;
            padding-right: 18px;
          }

          .debt-modal-section {
            padding-left: 18px;
            padding-right: 18px;
          }
        }

        @media (max-width: 430px) {
          .debt-metrics-grid {
            grid-template-columns: 1fr;
          }

          .debt-toolbar-left {
            flex-direction: column;
          }

          .debt-search {
            width: 100%;
          }

          .debt-card-stats {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <main className="debts-page">
        <div className="debts-shell">
          <header className="debt-page-header">
            <div>
              <div className="debt-page-kicker">
                FINANCIAL CONTROL
              </div>

              <h1 className="debt-page-title">
                Debt Intelligence
              </h1>

              <p className="debt-page-subtitle">
                Monitor outstanding liabilities,
                repayment progress, payment pressure,
                and upcoming debt obligations from
                your real FinSight database.
              </p>
            </div>

            <div className="debt-header-actions">
              <button
                type="button"
                className="debt-refresh-button"
                onClick={() =>
                  loadDebts({
                    silent: true,
                  })
                }
                disabled={
                  loading ||
                  refreshing
                }
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? 'debt-spinner'
                      : ''
                  }
                />

                {refreshing
                  ? 'Refreshing'
                  : 'Refresh data'}
              </button>
              <button
                type="button"
                className="debt-refresh-button"
                style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', borderColor: 'transparent', color: '#fff', fontWeight: 800 }}
                onClick={() => {
                  setEditingDebt(null);
                  setIsDebtFormOpen(true);
                }}
              >
                <Plus size={16} />
                Add Debt
              </button>
            </div>
          </header>

          {error ? (
            <ErrorState
              message={error}
              onRetry={() =>
                loadDebts()
              }
            />
          ) : null}

          {!error &&
          loading ? (
            <LoadingState />
          ) : null}

          {!loading &&
          !error ? (
            <>
              <section className="debt-metrics-grid">
                <MetricCard
                  icon={CircleDollarSign}
                  label="Outstanding debt"
                  value={formatCurrency(
                    metrics.totalOutstanding,
                  )}
                  detail={`${activeCount} active position${
                    activeCount === 1
                      ? ''
                      : 's'
                  }`}
                  tone="blue"
                />

                <MetricCard
                  icon={Banknote}
                  label="Minimum payments"
                  value={formatCurrency(
                    metrics.totalMinimumPayment,
                  )}
                  detail="Combined minimum payment requirement"
                  tone="purple"
                />

                <MetricCard
                  icon={TrendingDown}
                  label="Cleared debts"
                  value={formatNumber(
                    clearedCount,
                  )}
                  detail={`of ${debts.length} recorded position${
                    debts.length === 1
                      ? ''
                      : 's'
                  }`}
                  tone="green"
                />

                <MetricCard
                  icon={
                    attentionCount >
                    0
                      ? AlertTriangle
                      : ShieldCheck
                  }
                  label="Attention required"
                  value={formatNumber(
                    attentionCount,
                  )}
                  detail={
                    attentionCount >
                    0
                      ? 'Overdue or due within 7 days'
                      : 'No urgent due dates detected'
                  }
                  tone="orange"
                />
              </section>

              <InsightPanel
                debts={debts}
                totalOutstanding={
                  metrics.totalOutstanding
                }
                totalMinimumPayment={
                  metrics.totalMinimumPayment
                }
              />

              <section className="debt-toolbar">
                <div className="debt-toolbar-left">
                  <div className="debt-search">
                    <Search size={16} />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search debt, lender, status…"
                      aria-label="Search debts"
                    />
                  </div>

                  <select
                    className="debt-filter-select"
                    value={
                      statusFilter
                    }
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value,
                      )
                    }
                    aria-label="Filter debts by status"
                  >
                    <option value="all">
                      All statuses
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="attention">
                      Needs attention
                    </option>

                    <option value="cleared">
                      Cleared
                    </option>
                  </select>

                  <select
                    className="debt-filter-select"
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value,
                      )
                    }
                    aria-label="Sort debts"
                  >
                    <option value="outstanding">
                      Highest balance
                    </option>

                    <option value="due">
                      Earliest due date
                    </option>

                    <option value="payment">
                      Highest payment
                    </option>

                    <option value="progress">
                      Highest progress
                    </option>

                    <option value="name">
                      Name
                    </option>
                  </select>
                </div>

                <span className="debt-results-count">
                  {filteredDebts.length} of{' '}
                  {debts.length} records
                </span>
              </section>

              {filteredDebts.length ? (
                <section className="debt-card-grid">
                  {filteredDebts.map(
                    (debt) => (
                      <DebtCard
                        key={debt.id}
                        debt={debt}
                        onOpen={
                          setSelectedDebt
                        }
                      />
                    ),
                  )}
                </section>
              ) : (
                <EmptyState
                  hasFilters={
                    hasFilters
                  }
                  onClear={
                    clearFilters
                  }
                />
              )}

              {summary.length ? (
                <section
                  style={{
                    marginTop: '22px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      gap: '15px',
                      marginBottom:
                        '10px',
                    }}
                  >
                    <div>
                      <span className="debt-section-kicker">
                        ANALYTICAL VIEW
                      </span>

                      <h2
                        style={{
                          margin:
                            '4px 0 0',
                          color:
                            '#e7ecf5',
                          fontSize:
                            '17px',
                        }}
                      >
                        Debt summary data
                      </h2>
                    </div>

                    <span
                      style={{
                        color:
                          '#5f6c82',
                        fontSize:
                          '10px',
                      }}
                    >
                      {summary.length}{' '}
                      row
                      {summary.length ===
                      1
                        ? ''
                        : 's'}{' '}
                      returned
                    </span>
                  </div>

                  <div
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {summary
                      .slice(0, 8)
                      .map(
                        (
                          row,
                          index,
                        ) => {
                          const entries =
                            Object.entries(
                              row || {},
                            );

                          return (
                            <div
                              key={
                                index
                              }
                              style={{
                                padding:
                                  '14px',
                                border:
                                  '1px solid rgba(111,133,177,.10)',
                                borderRadius:
                                  '13px',
                                background:
                                  'rgba(15,21,33,.55)',
                              }}
                            >
                              {entries
                                .slice(
                                  0,
                                  5,
                                )
                                .map(
                                  ([
                                    key,
                                    value,
                                  ]) => (
                                    <div
                                      key={
                                        key
                                      }
                                      style={{
                                        display:
                                          'flex',
                                        justifyContent:
                                          'space-between',
                                        gap:
                                          '12px',
                                        padding:
                                          '5px 0',
                                        borderBottom:
                                          '1px solid rgba(111,133,177,.06)',
                                      }}
                                    >
                                      <span
                                        style={{
                                          color:
                                            '#5e6b80',
                                          fontSize:
                                            '9px',
                                        }}
                                      >
                                        {key}
                                      </span>

                                      <strong
                                        style={{
                                          maxWidth:
                                            '60%',
                                          overflow:
                                            'hidden',
                                          color:
                                            '#abb6c8',
                                          fontSize:
                                            '9px',
                                          textOverflow:
                                            'ellipsis',
                                          whiteSpace:
                                            'nowrap',
                                        }}
                                      >
                                        {value ===
                                          null ||
                                        value ===
                                          undefined
                                          ? '—'
                                          : String(
                                              value,
                                            )}
                                      </strong>
                                    </div>
                                  ),
                                )}
                            </div>
                          );
                        },
                      )}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      <DebtDetailsModal
        debt={selectedDebt}
        onClose={() => setSelectedDebt(null)}
      />
      {selectedDebt && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1100, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              const d = selectedDebt;
              setSelectedDebt(null);
              setEditingDebt(d);
              setIsDebtFormOpen(true);
            }}
            style={{ padding: '10px 16px', borderRadius: 12, border: 0, background: '#3b82f6', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
          >
            Edit / Record Payment
          </button>
          <button
            type="button"
            onClick={() => handleDeleteDebt(selectedDebt.id)}
            style={{ padding: '10px 16px', borderRadius: 12, border: 0, background: '#ef4444', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
          >
            Delete Debt
          </button>
        </div>
      )}
      {isDebtFormOpen && (
        <div className="debt-modal-backdrop" style={{ zIndex: 1200 }}>
          <DebtForm
            mode={editingDebt ? 'edit' : 'create'}
            initialValues={
              editingDebt
                ? {
                    name: editingDebt.name,
                    originalAmount: editingDebt.originalBalance,
                    currentBalance: editingDebt.outstandingBalance,
                    interestRate: editingDebt.interestRate,
                    minimumPayment: editingDebt.minimumPayment,
                    dueDate: editingDebt.dueDate ? new Date(editingDebt.dueDate).toISOString().slice(0, 10) : '',
                  }
                : {}
            }
            submitting={submitting}
            onSubmit={handleSaveDebt}
            onCancel={() => {
              setIsDebtFormOpen(false);
              setEditingDebt(null);
            }}
          />
        </div>
      )}
    </>
  );
}