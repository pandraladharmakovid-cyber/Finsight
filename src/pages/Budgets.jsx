import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Filter,
  Gauge,
  Layers3,
  MoreHorizontal,
  PieChart,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '';

const EMPTY_SUMMARY = {
  totalBudget: 0,
  totalSpent: 0,
  remaining: 0,
  utilization: 0,
  budgetCount: 0,
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatCompactCurrency(value) {
  const amount = Number(value) || 0;

  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
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

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.budgets)) {
    return payload.data.budgets;
  }

  if (Array.isArray(payload?.budgets)) {
    return payload.budgets;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

function extractObject(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload || {};
}

function getBudgetAmount(item) {
  return Number(
    item?.amount_limit ??
      item?.budget_amount ??
      item?.amount ??
      item?.planned_amount ??
      0,
  );
}

function getSpentAmount(item) {
  return Number(
    item?.actual_spending ??
      item?.spent ??
      item?.spent_amount ??
      item?.actual_amount ??
      0,
  );
}

function getRemainingAmount(item) {
  const explicit = Number(
    item?.remaining_budget ??
      item?.remaining ??
      item?.remaining_amount,
  );

  if (Number.isFinite(explicit)) {
    return explicit;
  }

  return getBudgetAmount(item) - getSpentAmount(item);
}

function getUtilization(item) {
  const explicit = Number(
    item?.utilization ??
      item?.utilization_percent ??
      item?.percentage ??
      item?.percent_used,
  );

  if (Number.isFinite(explicit)) {
    return Math.max(0, explicit);
  }

  const budget = getBudgetAmount(item);
  const spent = getSpentAmount(item);

  if (budget <= 0) {
    return 0;
  }

  return (spent / budget) * 100;
}

function getCategoryName(item) {
  return (
    item?.category_name ??
    item?.category ??
    item?.categoryName ??
    `Category ${item?.category_id ?? 'Unknown'}`
  );
}

function getStatus(utilization) {
  if (utilization >= 100) {
    return {
      key: 'over',
      label: 'Over budget',
      icon: ShieldAlert,
    };
  }

  if (utilization >= 90) {
    return {
      key: 'danger',
      label: 'Critical',
      icon: AlertTriangle,
    };
  }

  if (utilization >= 75) {
    return {
      key: 'warning',
      label: 'Watch',
      icon: Clock3,
    };
  }

  return {
    key: 'healthy',
    label: 'On track',
    icon: CheckCircle2,
  };
}

function normalizeBudget(rawBudget, performanceById) {
  const budgetId =
    rawBudget?.budget_id ??
    rawBudget?.id ??
    rawBudget?.budgetId;

  const performance =
    performanceById.get(String(budgetId)) || {};

  const budgetAmount =
    getBudgetAmount(performance) || getBudgetAmount(rawBudget);

  const spent =
    getSpentAmount(performance) || getSpentAmount(rawBudget);

  const remaining =
    performance?.remaining_budget !== undefined ||
    performance?.remaining !== undefined
      ? getRemainingAmount(performance)
      : getRemainingAmount(rawBudget);

  const utilization =
    performance &&
    Object.keys(performance).length > 0
      ? getUtilization(performance)
      : budgetAmount > 0
        ? (spent / budgetAmount) * 100
        : 0;

  const categoryName =
    performance?.category_name ||
    rawBudget?.category_name ||
    rawBudget?.category ||
    `Category ${rawBudget?.category_id ?? 'Unknown'}`;

  return {
    id: budgetId ?? `budget-${Math.random()}`,
    budgetId,
    userId:
      rawBudget?.user_id ??
      performance?.user_id ??
      null,
    categoryId:
      rawBudget?.category_id ??
      performance?.category_id ??
      null,
    categoryName,
    budgetAmount,
    spent,
    remaining,
    utilization,
    startDate:
      rawBudget?.start_date ??
      performance?.start_date ??
      null,
    endDate:
      rawBudget?.end_date ??
      performance?.end_date ??
      null,
    createdAt:
      rawBudget?.created_at ??
      performance?.created_at ??
      null,
  };
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  accent = 'blue',
}) {
  const accents = {
    blue: {
      background:
        'linear-gradient(145deg, rgba(59,130,246,0.16), rgba(59,130,246,0.035))',
      iconBackground: 'rgba(59,130,246,0.14)',
    },
    green: {
      background:
        'linear-gradient(145deg, rgba(34,197,94,0.15), rgba(34,197,94,0.035))',
      iconBackground: 'rgba(34,197,94,0.14)',
    },
    amber: {
      background:
        'linear-gradient(145deg, rgba(245,158,11,0.16), rgba(245,158,11,0.035))',
      iconBackground: 'rgba(245,158,11,0.14)',
    },
    red: {
      background:
        'linear-gradient(145deg, rgba(239,68,68,0.16), rgba(239,68,68,0.035))',
      iconBackground: 'rgba(239,68,68,0.14)',
    },
  };

  const selected = accents[accent] || accents.blue;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 168,
        padding: 22,
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.08)',
        background: selected.background,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: '50%',
          right: -65,
          top: -65,
          background: selected.iconBackground,
          filter: 'blur(5px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              color: 'rgba(255,255,255,0.58)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.02em',
              marginBottom: 10,
            }}
          >
            {title}
          </div>

          <div
            style={{
              color: '#fff',
              fontSize: 30,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: '-0.04em',
            }}
          >
            {value}
          </div>

          {subtitle && (
            <div
              style={{
                marginTop: 12,
                color: 'rgba(255,255,255,0.46)',
                fontSize: 12,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            width: 46,
            height: 46,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 15,
            background: selected.iconBackground,
            border: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <Icon size={21} />
        </div>
      </div>

      {trend && (
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 18,
            padding: '6px 9px',
            borderRadius: 999,
            background: trendPositive
              ? 'rgba(34,197,94,0.11)'
              : 'rgba(239,68,68,0.11)',
            color: trendPositive ? '#86efac' : '#fca5a5',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {trendPositive ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}
          {trend}
        </div>
      )}
    </div>
  );
}

function UtilizationRing({ value, size = 108 }) {
  const percentage = Math.max(0, Math.min(Number(value) || 0, 100));

  const tone =
    percentage >= 100
      ? '#f87171'
      : percentage >= 90
        ? '#fb923c'
        : percentage >= 75
          ? '#facc15'
          : '#4ade80';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `conic-gradient(${tone} ${percentage * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size - 18,
          height: size - 18,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: '#10151f',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#fff',
              fontSize: 19,
              fontWeight: 850,
              lineHeight: 1,
            }}
          >
            {Math.round(percentage)}%
          </div>

          <div
            style={{
              marginTop: 5,
              color: 'rgba(255,255,255,0.42)',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            used
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetCard({ budget, onInspect }) {
  const status = getStatus(budget.utilization);
  const StatusIcon = status.icon;

  const progress = Math.max(
    0,
    Math.min(budget.utilization, 100),
  );

  const statusColor =
    status.key === 'over'
      ? '#f87171'
      : status.key === 'danger'
        ? '#fb923c'
        : status.key === 'warning'
          ? '#facc15'
          : '#4ade80';

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 22,
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          right: -100,
          top: -105,
          background: `${statusColor}12`,
          filter: 'blur(12px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 14,
                background: `${statusColor}14`,
                border: `1px solid ${statusColor}28`,
                color: statusColor,
              }}
            >
              <Target size={19} />
            </div>

            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 800,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {budget.categoryName}
              </h3>

              <div
                style={{
                  marginTop: 4,
                  color: 'rgba(255,255,255,0.42)',
                  fontSize: 11,
                }}
              >
                Budget #{budget.budgetId ?? '—'}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onInspect(budget)}
          title="Inspect budget"
          style={{
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 11,
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.65)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <MoreHorizontal size={17} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          marginTop: 24,
        }}
      >
        <div>
          <div
            style={{
              color: 'rgba(255,255,255,0.42)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Spending
          </div>

          <div
            style={{
              marginTop: 7,
              color: '#fff',
              fontSize: 24,
              fontWeight: 850,
              letterSpacing: '-0.03em',
            }}
          >
            {formatCompactCurrency(budget.spent)}
          </div>

          <div
            style={{
              marginTop: 5,
              color: 'rgba(255,255,255,0.42)',
              fontSize: 12,
            }}
          >
            of {formatCompactCurrency(budget.budgetAmount)}
          </div>
        </div>

        <UtilizationRing value={budget.utilization} size={96} />
      </div>

      <div style={{ marginTop: 22 }}>
        <div
          style={{
            height: 9,
            overflow: 'hidden',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${statusColor}, ${statusColor}b5)`,
              boxShadow: `0 0 18px ${statusColor}45`,
              transition: 'width 500ms ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 17,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 15,
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.055)',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Remaining
          </div>

          <div
            style={{
              marginTop: 5,
              color:
                budget.remaining < 0
                  ? '#fca5a5'
                  : '#fff',
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            {formatCompactCurrency(budget.remaining)}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 15,
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.055)',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Status
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 5,
              color: statusColor,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <StatusIcon size={13} />
            {status.label}
          </div>
        </div>
      </div>

      {(budget.startDate || budget.endDate) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            marginTop: 17,
            color: 'rgba(255,255,255,0.4)',
            fontSize: 11,
          }}
        >
          <CalendarDays size={13} />

          <span>
            {formatDate(budget.startDate)} —{' '}
            {formatDate(budget.endDate)}
          </span>
        </div>
      )}
    </article>
  );
}

function PerformanceBar({ budget, maxValue }) {
  const budgetAmount = Math.max(budget.budgetAmount, 0);
  const spent = Math.max(budget.spent, 0);

  const budgetWidth =
    maxValue > 0
      ? Math.max(8, (budgetAmount / maxValue) * 100)
      : 8;

  const spentWidth =
    maxValue > 0
      ? Math.min(100, (spent / maxValue) * 100)
      : 0;

  const status = getStatus(budget.utilization);

  const color =
    status.key === 'over'
      ? '#f87171'
      : status.key === 'danger'
        ? '#fb923c'
        : status.key === 'warning'
          ? '#facc15'
          : '#4ade80';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px minmax(0,1fr) 90px',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          overflow: 'hidden',
          color: '#fff',
          fontSize: 12,
          fontWeight: 750,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {budget.categoryName}
      </div>

      <div>
        <div
          style={{
            position: 'relative',
            height: 34,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.045)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${budgetWidth}%`,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 5,
              bottom: 5,
              width: `${spentWidth}%`,
              minWidth: spent > 0 ? 4 : 0,
              borderRadius: 7,
              background: `linear-gradient(90deg, ${color}, ${color}a8)`,
              boxShadow: `0 0 20px ${color}35`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          textAlign: 'right',
          color,
          fontSize: 12,
          fontWeight: 850,
        }}
      >
        {Math.round(budget.utilization)}%
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div
      style={{
        minHeight: 300,
        display: 'grid',
        placeItems: 'center',
        padding: 30,
        borderRadius: 24,
        border: '1px dashed rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.025)',
        textAlign: 'center',
      }}
    >
      <div>
        <div
          style={{
            width: 58,
            height: 58,
            margin: '0 auto 16px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 18,
            background: 'rgba(59,130,246,0.1)',
            color: '#60a5fa',
          }}
        >
          <Target size={25} />
        </div>

        <h3
          style={{
            margin: 0,
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          No budgets found
        </h3>

        <p
          style={{
            maxWidth: 440,
            margin: '9px auto 0',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 13,
            lineHeight: 1.65,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 18,
      }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          style={{
            height: 330,
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.06)',
            background:
              'linear-gradient(100deg, rgba(255,255,255,0.035), rgba(255,255,255,0.075), rgba(255,255,255,0.035))',
            backgroundSize: '200% 100%',
            animation: 'finsightBudgetShimmer 1.5s infinite',
          }}
        />
      ))}
    </div>
  );
}

function BudgetDetailsModal({ budget, onClose, onDelete }) {
  if (!budget) return null;

  const status = getStatus(budget.utilization);
  const StatusIcon = status.icon;

  const statusColor =
    status.key === 'over'
      ? '#f87171'
      : status.key === 'danger'
        ? '#fb923c'
        : status.key === 'warning'
          ? '#facc15'
          : '#4ade80';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(16px)',
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: 'min(620px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.1)',
          background:
            'linear-gradient(145deg, #121925, #0b1018)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            padding: 24,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 10px',
                borderRadius: 999,
                background: `${statusColor}12`,
                color: statusColor,
                fontSize: 10,
                fontWeight: 850,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              <StatusIcon size={12} />
              {status.label}
            </div>

            <h2
              style={{
                margin: '13px 0 0',
                color: '#fff',
                fontSize: 25,
                fontWeight: 850,
                letterSpacing: '-0.03em',
              }}
            >
              {budget.categoryName}
            </h2>

            <p
              style={{
                margin: '7px 0 0',
                color: 'rgba(255,255,255,0.42)',
                fontSize: 12,
              }}
            >
              Budget #{budget.budgetId ?? '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>
        {onDelete && (
          <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onDelete(budget.budgetId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.12)',
                color: '#fca5a5',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} />
              Delete Budget
            </button>
          </div>
        )}

        <div style={{ padding: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {[
              ['Budget', formatCurrency(budget.budgetAmount)],
              ['Spent', formatCurrency(budget.spent)],
              ['Remaining', formatCurrency(budget.remaining)],
              ['Utilization', `${Math.round(budget.utilization)}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: 16,
                  borderRadius: 17,
                  background: 'rgba(255,255,255,0.035)',
                  border:
                    '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 10,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 850,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 19,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'rgba(255,255,255,0.55)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span>Budget utilization</span>
              <span>
                {Math.round(budget.utilization)}%
              </span>
            </div>

            <div
              style={{
                height: 12,
                marginTop: 12,
                overflow: 'hidden',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    budget.utilization,
                    100,
                  )}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: statusColor,
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 18,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 17,
                background: 'rgba(255,255,255,0.025)',
                border:
                  '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'rgba(255,255,255,0.42)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <CalendarDays size={14} />
                Start date
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                {formatDate(budget.startDate)}
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 17,
                background: 'rgba(255,255,255,0.025)',
                border:
                  '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'rgba(255,255,255,0.42)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <CalendarDays size={14} />
                End date
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                {formatDate(budget.endDate)}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 18,
              background:
                status.key === 'over'
                  ? 'rgba(239,68,68,0.08)'
                  : 'rgba(59,130,246,0.07)',
              border:
                status.key === 'over'
                  ? '1px solid rgba(239,68,68,0.16)'
                  : '1px solid rgba(59,130,246,0.12)',
              color: 'rgba(255,255,255,0.58)',
              fontSize: 12,
              lineHeight: 1.65,
            }}
          >
            {status.key === 'over'
              ? 'This budget has exceeded its configured limit. Review the underlying transaction activity and rebalance the remaining period.'
              : status.key === 'danger'
                ? 'Spending is approaching the budget ceiling. Keep discretionary expenses under control for the rest of the budget period.'
                : status.key === 'warning'
                  ? 'Spending is entering the watch zone. There is still room remaining, but continued spending should be monitored.'
                  : 'Spending is currently within the planned budget range.'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [performance, setPerformance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('utilization-desc');

  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('Food & Dining');
  const [newLimit, setNewLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!newCategory.trim() || !newLimit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/budgets/${encodeURIComponent(USER_ID)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: newCategory.trim(),
          amount_limit: Number(newLimit),
        }),
      });
      if (!res.ok) throw new Error('Failed to create budget');
      setIsCreateOpen(false);
      setNewLimit('');
      await loadBudgets({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to create budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!budgetId) return;
    try {
      await fetch(`${API_BASE_URL}/budgets/${encodeURIComponent(USER_ID)}/${budgetId}`, {
        method: 'DELETE',
      });
      setSelectedBudget(null);
      await loadBudgets({ silent: true });
    } catch (err) {
      setError(err.message || 'Unable to delete budget.');
    }
  };

  const loadBudgets = useCallback(
    async ({ silent = false } = {}) => {
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

        const [
          budgetsResponse,
          summaryResponse,
          performanceResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/budgets/${encodedUserId}`,
            {
              headers: {
                Accept: 'application/json',
              },
            },
          ),
          fetch(
            `${API_BASE_URL}/budgets/${encodedUserId}/summary`,
            {
              headers: {
                Accept: 'application/json',
              },
            },
          ),
          fetch(
            `${API_BASE_URL}/budgets/${encodedUserId}/performance`,
            {
              headers: {
                Accept: 'application/json',
              },
            },
          ),
        ]);

        const responses = [
          budgetsResponse,
          summaryResponse,
          performanceResponse,
        ];

        const failedResponse = responses.find(
          (response) => !response.ok,
        );

        if (failedResponse) {
          let detail = '';

          try {
            const body = await failedResponse.json();
            detail =
              body?.message ||
              body?.error ||
              '';
          } catch {
            // Ignore non-JSON error bodies.
          }

          throw new Error(
            detail ||
              `Budget API request failed with HTTP ${failedResponse.status}.`,
          );
        }

        const [
          budgetsPayload,
          summaryPayload,
          performancePayload,
        ] = await Promise.all(
          responses.map((response) => response.json()),
        );

        const rawBudgets = extractArray(
          budgetsPayload,
        );

        const rawPerformance = extractArray(
          performancePayload,
        );

        const performanceMap = new Map(
          rawPerformance.map((item) => {
            const id =
              item?.budget_id ??
              item?.id ??
              item?.budgetId;

            return [String(id), item];
          }),
        );

        const normalizedBudgets = rawBudgets.map(
          (budget) =>
            normalizeBudget(
              budget,
              performanceMap,
            ),
        );

        const rawSummary =
          extractObject(summaryPayload);

        const normalizedSummary = {
          totalBudget: Number(
            rawSummary?.totalBudget ??
              rawSummary?.total_budget ??
              rawSummary?.budget_total ??
              0,
          ),
          totalSpent: Number(
            rawSummary?.totalSpent ??
              rawSummary?.total_spent ??
              rawSummary?.spent_total ??
              0,
          ),
          remaining: Number(
            rawSummary?.remaining ??
              rawSummary?.remaining_budget ??
              0,
          ),
          utilization: Number(
            rawSummary?.utilization ??
              rawSummary?.utilization_percent ??
              0,
          ),
          budgetCount: Number(
            rawSummary?.budgetCount ??
              rawSummary?.budget_count ??
              normalizedBudgets.length,
          ),
        };

        setBudgets(normalizedBudgets);
        setPerformance(rawPerformance);

        setSummary({
          ...normalizedSummary,
          totalBudget:
            normalizedSummary.totalBudget ||
            normalizedBudgets.reduce(
              (sum, item) =>
                sum + item.budgetAmount,
              0,
            ),
          totalSpent:
            normalizedSummary.totalSpent ||
            normalizedBudgets.reduce(
              (sum, item) =>
                sum + item.spent,
              0,
            ),
          remaining:
            normalizedSummary.remaining ||
            normalizedBudgets.reduce(
              (sum, item) =>
                sum + item.remaining,
              0,
            ),
          budgetCount:
            normalizedSummary.budgetCount ||
            normalizedBudgets.length,
        });
      } catch (requestError) {
        setError(
          requestError?.message ||
            'Unable to load FinSight budget data.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const filteredBudgets = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = budgets.filter((budget) => {
      const matchesSearch =
        !query ||
        budget.categoryName
          .toLowerCase()
          .includes(query) ||
        String(
          budget.budgetId ?? '',
        ).includes(query);

      const status = getStatus(
        budget.utilization,
      );

      const matchesStatus =
        statusFilter === 'all' ||
        status.key === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'utilization-asc':
          return (
            a.utilization -
            b.utilization
          );

        case 'amount-desc':
          return (
            b.budgetAmount -
            a.budgetAmount
          );

        case 'spent-desc':
          return (
            b.spent -
            a.spent
          );

        case 'remaining-desc':
          return (
            b.remaining -
            a.remaining
          );

        case 'name-asc':
          return a.categoryName.localeCompare(
            b.categoryName,
          );

        case 'utilization-desc':
        default:
          return (
            b.utilization -
            a.utilization
          );
      }
    });

    return result;
  }, [
    budgets,
    search,
    sortBy,
    statusFilter,
  ]);

  const computed = useMemo(() => {
    const overBudget = budgets.filter(
      (budget) =>
        budget.utilization >= 100,
    ).length;

    const warningBudgets = budgets.filter(
      (budget) =>
        budget.utilization >= 75 &&
        budget.utilization < 100,
    ).length;

    const healthyBudgets = budgets.filter(
      (budget) =>
        budget.utilization < 75,
    ).length;

    const maxPerformanceValue = Math.max(
      ...budgets.map(
        (budget) =>
          Math.max(
            budget.budgetAmount,
            budget.spent,
          ),
      ),
      1,
    );

    const highestSpend = [...budgets].sort(
      (a, b) => b.spent - a.spent,
    )[0];

    const mostUtilized = [...budgets].sort(
      (a, b) =>
        b.utilization -
        a.utilization,
    )[0];

    return {
      overBudget,
      warningBudgets,
      healthyBudgets,
      maxPerformanceValue,
      highestSpend,
      mostUtilized,
    };
  }, [budgets]);

  const utilization =
    Number(summary.utilization) ||
    (summary.totalBudget > 0
      ? (summary.totalSpent /
          summary.totalBudget) *
        100
      : 0);

  return (
    <>
      <style>
        {`
          @keyframes finsightBudgetShimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }

          @keyframes finsightBudgetPulse {
            0%, 100% {
              opacity: 0.55;
              transform: scale(1);
            }
            50% {
              opacity: 0.9;
              transform: scale(1.04);
            }
          }

          .finsight-budget-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .finsight-budget-metrics {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }

          .finsight-budget-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.75fr);
            gap: 18px;
          }

          .finsight-budget-toolbar {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) 170px 190px auto;
            gap: 10px;
            align-items: center;
          }

          @media (max-width: 1200px) {
            .finsight-budget-metrics {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .finsight-budget-layout {
              grid-template-columns: 1fr;
            }

            .finsight-budget-toolbar {
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 800px) {
            .finsight-budget-grid {
              grid-template-columns: 1fr;
            }

            .finsight-budget-metrics {
              grid-template-columns: 1fr;
            }

            .finsight-budget-toolbar {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div
        className="fs-page fs-fade-in"
        style={{
          paddingBottom: 48,
        }}
      >
        <div
          className="fs-page-header"
          style={{
            alignItems: 'flex-start',
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 11px',
                marginBottom: 12,
                borderRadius: 999,
                border:
                  '1px solid rgba(59,130,246,0.18)',
                background:
                  'rgba(59,130,246,0.08)',
                color: '#60a5fa',
                fontSize: 10,
                fontWeight: 850,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
              }}
            >
              <Sparkles size={12} />
              Financial control center
            </div>

            <h1 className="fs-page-title">
              Budgets
            </h1>

            <p className="fs-page-subtitle">
              Monitor spending limits, detect
              budget pressure, and understand
              where your money is being consumed.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() =>
                loadBudgets({
                  silent: true,
                })
              }
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 15px',
                borderRadius: 13,
                border:
                  '1px solid rgba(255,255,255,0.09)',
                background:
                  'rgba(255,255,255,0.045)',
                color: '#fff',
                cursor: refreshing
                  ? 'wait'
                  : 'pointer',
                fontSize: 12,
                fontWeight: 750,
                opacity: refreshing
                  ? 0.65
                  : 1,
              }}
            >
              <RefreshCw
                size={15}
                style={{
                  animation: refreshing
                    ? 'spin 1s linear infinite'
                    : 'none',
                }}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 16px',
                borderRadius: 13,
                border: '1px solid rgba(139,92,246,0.4)',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <Plus size={15} />
              New Budget
            </button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 14px',
                borderRadius: 13,
                border:
                  '1px solid rgba(74,222,128,0.14)',
                background:
                  'rgba(74,222,128,0.055)',
                color: '#86efac',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Zap size={14} />
              Live PostgreSQL data
            </div>
          </div>
        </div>

        {!USER_ID ? (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 20,
              border:
                '1px solid rgba(245,158,11,0.18)',
              background:
                'rgba(245,158,11,0.055)',
              color: 'rgba(255,255,255,0.68)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle
                size={20}
                color="#fbbf24"
              />

              <div>
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  User configuration required
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  Set{' '}
                  <code>
                    VITE_FINSIGHT_USER_ID
                  </code>{' '}
                  in the frontend environment so
                  this page can request the real
                  user's PostgreSQL budget records.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginTop: 20,
              padding: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 15,
              borderRadius: 18,
              border:
                '1px solid rgba(239,68,68,0.18)',
              background:
                'rgba(239,68,68,0.06)',
              color: '#fecaca',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
              }}
            >
              <ShieldAlert
                size={18}
                flexShrink={0}
              />

              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </span>
            </div>

            {USER_ID && (
              <button
                type="button"
                onClick={() => loadBudgets()}
                style={{
                  flexShrink: 0,
                  border: 0,
                  background:
                    'rgba(255,255,255,0.07)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                Retry
              </button>
            )}
          </div>
        ) : null}

        {!loading && !error && (
          <>
            <div
              className="finsight-budget-metrics"
              style={{
                marginTop: 22,
              }}
            >
              <MetricCard
                title="Total budget"
                value={formatCompactCurrency(
                  summary.totalBudget,
                )}
                subtitle={`${summary.budgetCount} active budget${summary.budgetCount === 1 ? '' : 's'}`}
                icon={Target}
                accent="blue"
              />

              <MetricCard
                title="Total spent"
                value={formatCompactCurrency(
                  summary.totalSpent,
                )}
                subtitle={`${Math.round(utilization)}% of planned spending`}
                icon={WalletCards}
                accent={
                  utilization >= 90
                    ? 'red'
                    : utilization >= 75
                      ? 'amber'
                      : 'green'
                }
              />

              <MetricCard
                title="Remaining"
                value={formatCompactCurrency(
                  summary.remaining,
                )}
                subtitle={
                  summary.remaining < 0
                    ? 'Budget deficit detected'
                    : 'Available across budgets'
                }
                icon={CircleDollarSign}
                accent={
                  summary.remaining < 0
                    ? 'red'
                    : 'green'
                }
              />

              <MetricCard
                title="Utilization"
                value={`${Math.round(utilization)}%`}
                subtitle={`${computed.overBudget} over budget`}
                icon={Gauge}
                accent={
                  utilization >= 90
                    ? 'red'
                    : utilization >= 75
                      ? 'amber'
                      : 'blue'
                }
              />
            </div>

            <div
              className="finsight-budget-layout"
              style={{
                marginTop: 18,
              }}
            >
              <section
                style={{
                  minWidth: 0,
                  padding: 22,
                  borderRadius: 24,
                  border:
                    '1px solid rgba(255,255,255,0.08)',
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.022))',
                  boxShadow:
                    '0 20px 60px rgba(0,0,0,0.17)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 18,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 850,
                      }}
                    >
                      <BarChart3
                        size={18}
                        color="#60a5fa"
                      />
                      Budget performance
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        color:
                          'rgba(255,255,255,0.4)',
                        fontSize: 11,
                      }}
                    >
                      Planned allocation versus
                      actual spending
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 15,
                      alignItems: 'center',
                      color:
                        'rgba(255,255,255,0.45)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 3,
                          background:
                            'rgba(255,255,255,0.12)',
                        }}
                      />
                      Planned
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 3,
                          background:
                            '#4ade80',
                        }}
                      />
                      Actual
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 24,
                    display: 'grid',
                    gap: 17,
                  }}
                >
                  {filteredBudgets.length === 0 ? (
                    <div
                      style={{
                        padding: 35,
                        textAlign: 'center',
                        color:
                          'rgba(255,255,255,0.4)',
                        fontSize: 12,
                      }}
                    >
                      No budgets match the current
                      filters.
                    </div>
                  ) : (
                    filteredBudgets
                      .slice(0, 8)
                      .map((budget) => (
                        <PerformanceBar
                          key={budget.id}
                          budget={budget}
                          maxValue={
                            computed.maxPerformanceValue
                          }
                        />
                      ))
                  )}
                </div>
              </section>

              <section
                style={{
                  padding: 22,
                  borderRadius: 24,
                  border:
                    '1px solid rgba(255,255,255,0.08)',
                  background:
                    'linear-gradient(145deg, rgba(59,130,246,0.09), rgba(255,255,255,0.02))',
                  boxShadow:
                    '0 20px 60px rgba(0,0,0,0.17)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 850,
                  }}
                >
                  <PieChart
                    size={18}
                    color="#a78bfa"
                  />
                  Budget health
                </div>

                <div
                  style={{
                    marginTop: 6,
                    color:
                      'rgba(255,255,255,0.4)',
                    fontSize: 11,
                  }}
                >
                  Portfolio-level allocation health
                </div>

                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    marginTop: 20,
                  }}
                >
                  <UtilizationRing
                    value={utilization}
                    size={154}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, 1fr)',
                    gap: 8,
                    marginTop: 22,
                  }}
                >
                  {[
                    [
                      'Healthy',
                      computed.healthyBudgets,
                      '#4ade80',
                    ],
                    [
                      'Watch',
                      computed.warningBudgets,
                      '#facc15',
                    ],
                    [
                      'Critical',
                      computed.overBudget,
                      '#f87171',
                    ],
                  ].map(
                    ([label, value, color]) => (
                      <div
                        key={label}
                        style={{
                          padding: 11,
                          textAlign: 'center',
                          borderRadius: 14,
                          background:
                            'rgba(255,255,255,0.035)',
                          border:
                            '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div
                          style={{
                            color,
                            fontSize: 18,
                            fontWeight: 850,
                          }}
                        >
                          {value}
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            color:
                              'rgba(255,255,255,0.4)',
                            fontSize: 9,
                            fontWeight: 750,
                            textTransform:
                              'uppercase',
                          }}
                        >
                          {label}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </div>

            <section
              style={{
                marginTop: 18,
                padding: 22,
                borderRadius: 24,
                border:
                  '1px solid rgba(255,255,255,0.08)',
                background:
                  'rgba(255,255,255,0.025)',
              }}
            >
              <div
                className="finsight-budget-toolbar"
              >
                <div
                  style={{
                    position: 'relative',
                  }}
                >
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 13,
                      top: '50%',
                      transform:
                        'translateY(-50%)',
                      color:
                        'rgba(255,255,255,0.35)',
                    }}
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search budget categories..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      height: 42,
                      padding:
                        '0 13px 0 39px',
                      borderRadius: 13,
                      border:
                        '1px solid rgba(255,255,255,0.08)',
                      outline: 'none',
                      background:
                        'rgba(255,255,255,0.035)',
                      color: '#fff',
                      fontSize: 12,
                    }}
                  />
                </div>

                <div
                  style={{
                    position: 'relative',
                  }}
                >
                  <Filter
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform:
                        'translateY(-50%)',
                      color:
                        'rgba(255,255,255,0.4)',
                      pointerEvents: 'none',
                    }}
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value,
                      )
                    }
                    style={{
                      width: '100%',
                      height: 42,
                      padding:
                        '0 12px 0 35px',
                      borderRadius: 13,
                      border:
                        '1px solid rgba(255,255,255,0.08)',
                      outline: 'none',
                      background:
                        '#121925',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">
                      All statuses
                    </option>
                    <option value="healthy">
                      On track
                    </option>
                    <option value="warning">
                      Watch
                    </option>
                    <option value="danger">
                      Critical
                    </option>
                    <option value="over">
                      Over budget
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    position: 'relative',
                  }}
                >
                  <ChevronDown
                    size={14}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform:
                        'translateY(-50%)',
                      color:
                        'rgba(255,255,255,0.4)',
                      pointerEvents: 'none',
                    }}
                  />

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value,
                      )
                    }
                    style={{
                      width: '100%',
                      height: 42,
                      padding:
                        '0 34px 0 12px',
                      borderRadius: 13,
                      border:
                        '1px solid rgba(255,255,255,0.08)',
                      outline: 'none',
                      background:
                        '#121925',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                      appearance: 'none',
                    }}
                  >
                    <option value="utilization-desc">
                      Highest utilization
                    </option>
                    <option value="utilization-asc">
                      Lowest utilization
                    </option>
                    <option value="amount-desc">
                      Largest budget
                    </option>
                    <option value="spent-desc">
                      Highest spending
                    </option>
                    <option value="remaining-desc">
                      Most remaining
                    </option>
                    <option value="name-asc">
                      Category A–Z
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    color:
                      'rgba(255,255,255,0.38)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {filteredBudgets.length}{' '}
                  of {budgets.length} budgets
                </div>
              </div>
            </section>

            <section
              style={{
                marginTop: 18,
              }}
            >
              {budgets.length === 0 ? (
                <EmptyState
                  message="The backend returned no budget records for this FinSight user. Once budget records exist in PostgreSQL, this workspace will render them automatically."
                />
              ) : filteredBudgets.length === 0 ? (
                <EmptyState
                  message="No budget matches your current search and status filters. Clear the filters to see the complete budget portfolio."
                />
              ) : (
                <div
                  className="finsight-budget-grid"
                >
                  {filteredBudgets.map(
                    (budget) => (
                      <BudgetCard
                        key={budget.id}
                        budget={budget}
                        onInspect={
                          setSelectedBudget
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </section>

            <section
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 18,
              }}
            >
              <div
                style={{
                  padding: 22,
                  borderRadius: 24,
                  border:
                    '1px solid rgba(255,255,255,0.08)',
                  background:
                    'linear-gradient(145deg, rgba(34,197,94,0.08), rgba(255,255,255,0.02))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 850,
                  }}
                >
                  <TrendingUp
                    size={17}
                    color="#4ade80"
                  />
                  Best controlled
                </div>

                <div
                  style={{
                    marginTop: 17,
                    color:
                      'rgba(255,255,255,0.4)',
                    fontSize: 10,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                  }}
                >
                  Lowest utilization
                </div>

                <div
                  style={{
                    marginTop: 7,
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 850,
                  }}
                >
                  {computed.healthyBudgets > 0
                    ? [...budgets].sort(
                        (a, b) =>
                          a.utilization -
                          b.utilization,
                      )[0]
                        ?.categoryName || '—'
                    : '—'}
                </div>
              </div>

              <div
                style={{
                  padding: 22,
                  borderRadius: 24,
                  border:
                    '1px solid rgba(255,255,255,0.08)',
                  background:
                    'linear-gradient(145deg, rgba(245,158,11,0.08), rgba(255,255,255,0.02))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 850,
                  }}
                >
                  <TrendingDown
                    size={17}
                    color="#facc15"
                  />
                  Highest pressure
                </div>

                <div
                  style={{
                    marginTop: 17,
                    color:
                      'rgba(255,255,255,0.4)',
                    fontSize: 10,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                  }}
                >
                  Most utilized budget
                </div>

                <div
                  style={{
                    marginTop: 7,
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 850,
                  }}
                >
                  {computed.mostUtilized
                    ?.categoryName || '—'}
                </div>

                {computed.mostUtilized && (
                  <div
                    style={{
                      marginTop: 5,
                      color: '#facc15',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {Math.round(
                      computed.mostUtilized
                        .utilization,
                    )}
                    % utilized
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: 22,
                  borderRadius: 24,
                  border:
                    '1px solid rgba(255,255,255,0.08)',
                  background:
                    'linear-gradient(145deg, rgba(167,139,250,0.09), rgba(255,255,255,0.02))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 850,
                  }}
                >
                  <Layers3
                    size={17}
                    color="#a78bfa"
                  />
                  Largest spending pool
                </div>

                <div
                  style={{
                    marginTop: 17,
                    color:
                      'rgba(255,255,255,0.4)',
                    fontSize: 10,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                  }}
                >
                  Highest actual spend
                </div>

                <div
                  style={{
                    marginTop: 7,
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 850,
                  }}
                >
                  {computed.highestSpend
                    ?.categoryName || '—'}
                </div>

                {computed.highestSpend && (
                  <div
                    style={{
                      marginTop: 5,
                      color: '#c4b5fd',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {formatCompactCurrency(
                      computed.highestSpend
                        .spent,
                    )}{' '}
                    spent
                  </div>
                )}
              </div>
            </section>

            <section
              style={{
                marginTop: 18,
                padding: 22,
                borderRadius: 24,
                border:
                  '1px solid rgba(255,255,255,0.08)',
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.075), rgba(167,139,250,0.045), rgba(255,255,255,0.02))',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: -40,
                  bottom: -80,
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  background:
                    'rgba(59,130,246,0.08)',
                  filter: 'blur(30px)',
                  animation:
                    'finsightBudgetPulse 4s ease-in-out infinite',
                }}
              />

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 14,
                    background:
                      'rgba(59,130,246,0.12)',
                    border:
                      '1px solid rgba(59,130,246,0.16)',
                    color: '#60a5fa',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={19} />
                </div>

                <div>
                  <div
                    style={{
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 850,
                    }}
                  >
                    FinSight budget intelligence
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      maxWidth: 900,
                      color:
                        'rgba(255,255,255,0.48)',
                      fontSize: 12,
                      lineHeight: 1.7,
                    }}
                  >
                    This workspace evaluates budget
                    pressure directly from the
                    PostgreSQL budget performance
                    view. The UI does not invent
                    spending records or estimated
                    transactions. Every displayed
                    budget amount and actual-spending
                    figure comes from the application's
                    backend data layer.
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {loading && (
          <div
            style={{
              marginTop: 22,
            }}
          >
            <LoadingState />
          </div>
        )}
      </div>

      <BudgetDetailsModal
        budget={selectedBudget}
        onClose={() => setSelectedBudget(null)}
        onDelete={handleDeleteBudget}
      />

      {isCreateOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <form
            onSubmit={handleCreateBudget}
            style={{
              width: 'min(480px, 100%)',
              padding: 24,
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.12)',
              background: '#101624',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 850 }}>Create Monthly Budget</h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>
                Category Name
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Food & Dining, Shopping"
                  style={{ height: 42, padding: '0 12px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)', color: '#fff' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>
                Monthly Budget Limit (₹)
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="15000"
                  style={{ height: 42, padding: '0 12px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)', color: '#fff' }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button type="button" onClick={() => setIsCreateOpen(false)} style={{ padding: '10px 16px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} style={{ padding: '10px 18px', borderRadius: 11, border: 0, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {submitting ? 'Saving...' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}