import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  MoreHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import Card from '../ui/Card.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import Badge from '../ui/Badge.jsx';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function money(value) {
  return INR.format(Math.abs(Number(value) || 0));
}

function normalizeBudget(budget) {
  const limit = Number(
    budget?.budgetAmount ??
      budget?.budget_amount ??
      budget?.amount ??
      budget?.limit ??
      budget?.monthlyLimit ??
      0,
  );

  const spent = Number(
    budget?.spentAmount ??
      budget?.spent_amount ??
      budget?.spent ??
      budget?.actual ??
      budget?.used ??
      0,
  );

  const remaining = Math.max(0, limit - spent);

  const percentage =
    limit > 0
      ? Math.min(100, Math.max(0, (spent / limit) * 100))
      : 0;

  return {
    id:
      budget?.id ??
      budget?.budgetId ??
      budget?.budget_id,
    name:
      budget?.name ??
      budget?.budgetName ??
      budget?.budget_name ??
      budget?.category ??
      'Budget',
    category:
      budget?.category ??
      budget?.categoryName ??
      budget?.category_name ??
      'General',
    limit,
    spent,
    remaining,
    percentage,
    period:
      budget?.period ??
      budget?.frequency ??
      'Monthly',
    raw: budget,
  };
}

function stateFor(percentage) {
  if (percentage >= 100) {
    return {
      label: 'Over budget',
      color: '#fb7185',
      variant: 'danger',
      Icon: AlertTriangle,
    };
  }

  if (percentage >= 85) {
    return {
      label: 'Near limit',
      color: '#fbbf24',
      variant: 'warning',
      Icon: AlertTriangle,
    };
  }

  if (percentage >= 60) {
    return {
      label: 'On track',
      color: '#38bdf8',
      variant: 'info',
      Icon: TrendingUp,
    };
  }

  return {
    label: 'Healthy',
    color: '#34d399',
    variant: 'success',
    Icon: TrendingDown,
  };
}

export default function BudgetCard({
  budget,
  onClick,
  onMenu,
  compact = false,
}) {
  const data = useMemo(
    () => normalizeBudget(budget || {}),
    [budget],
  );

  const state = stateFor(data.percentage);
  const StateIcon = state.Icon;

  return (
    <article
      onClick={() => onClick?.(data.raw)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        padding: compact ? 14 : 17,
        borderRadius: 20,
        border: `1px solid ${state.color}18`,
        background:
          'linear-gradient(145deg, rgba(15,23,42,.88), rgba(2,6,23,.95))',
        boxShadow:
          '0 18px 50px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.025)',
        cursor: onClick ? 'pointer' : 'default',
        transition:
          'transform .22s ease, border-color .22s ease, box-shadow .22s ease',
      }}
      onMouseEnter={(event) => {
        if (!onClick) return;

        event.currentTarget.style.transform =
          'translateY(-3px)';
        event.currentTarget.style.borderColor =
          `${state.color}35`;
        event.currentTarget.style.boxShadow =
          `0 22px 55px ${state.color}10, inset 0 1px 0 rgba(255,255,255,.03)`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          'translateY(0)';
        event.currentTarget.style.borderColor =
          `${state.color}18`;
        event.currentTarget.style.boxShadow =
          '0 18px 50px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.025)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 130,
          height: 130,
          right: -70,
          top: -75,
          borderRadius: '50%',
          background: `${state.color}0d`,
          filter: 'blur(26px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
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
          <div
            style={{
              width: 38,
              height: 38,
              flex: '0 0 38px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 12,
              color: state.color,
              background: `${state.color}10`,
              border: `1px solid ${state.color}18`,
            }}
          >
            <Gauge size={17} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: '#e2e8f0',
                fontSize: 12,
                fontWeight: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {data.name}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 3,
                color: '#64748b',
                fontSize: 9,
              }}
            >
              <span>{data.category}</span>
              <span>•</span>
              <span>{data.period}</span>
            </div>
          </div>
        </div>

        {onMenu && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMenu(data.raw);
            }}
            style={{
              width: 29,
              height: 29,
              display: 'grid',
              placeItems: 'center',
              border: 0,
              borderRadius: 9,
              background:
                'rgba(255,255,255,.025)',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={15} />
          </button>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: 17,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: '#f8fafc',
              fontSize: compact ? 18 : 22,
              lineHeight: 1,
              fontWeight: 850,
              letterSpacing: '-.035em',
            }}
          >
            {money(data.spent)}
          </div>

          <div
            style={{
              marginTop: 5,
              color: '#475569',
              fontSize: 9,
            }}
          >
            of {money(data.limit)} budget
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
          }}
        >
          <div
            style={{
              color: state.color,
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 850,
            }}
          >
            {Math.round(data.percentage)}%
          </div>

          <div
            style={{
              marginTop: 5,
              color: '#475569',
              fontSize: 9,
            }}
          >
            used
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: 13,
        }}
      >
        <ProgressBar
          value={data.spent}
          max={data.limit || 100}
          variant={
            data.percentage >= 100
              ? 'danger'
              : data.percentage >= 85
                ? 'warning'
                : data.percentage >= 60
                  ? 'info'
                  : 'success'
          }
          height={7}
          showPercentage={false}
          animated
          glow
        />
      </div>

      <div
        style={{
          marginTop: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: state.color,
            fontSize: 9,
            fontWeight: 750,
          }}
        >
          <StateIcon size={12} />
          {state.label}
        </div>

        <div
          style={{
            color:
              data.remaining > 0
                ? '#64748b'
                : '#fb7185',
            fontSize: 9,
            fontWeight: 650,
          }}
        >
          {data.remaining > 0
            ? `${money(data.remaining)} remaining`
            : 'Limit reached'}
        </div>
      </div>

      {!compact && (
        <div
          style={{
            marginTop: 13,
            paddingTop: 11,
            borderTop:
              '1px solid rgba(148,163,184,.065)',
            display: 'grid',
            gridTemplateColumns:
              'repeat(3, 1fr)',
            gap: 7,
          }}
        >
          <Metric
            label="Budget"
            value={money(data.limit)}
            icon={Target}
          />

          <Metric
            label="Spent"
            value={money(data.spent)}
            icon={CircleDollarSign}
          />

          <Metric
            label="Remaining"
            value={money(data.remaining)}
            icon={ArrowUpRight}
            danger={data.remaining === 0}
          />
        </div>
      )}

      {onClick && (
        <div
          style={{
            marginTop: 11,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
            color: '#475569',
            fontSize: 9,
          }}
        >
          Details
          <ChevronRight size={12} />
        </div>
      )}
    </article>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  danger = false,
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: '8px 7px',
        borderRadius: 10,
        background:
          'rgba(255,255,255,.018)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: '#475569',
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        <Icon size={10} />
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: danger ? '#fb7185' : '#cbd5e1',
          fontSize: 9,
          fontWeight: 750,
        }}
      >
        {value}
      </div>
    </div>
  );
}