import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Gauge,
  MoreHorizontal,
  Percent,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';

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

function normalizeDebt(debt = {}) {
  const original = Number(
    debt.originalAmount ??
      debt.original_amount ??
      debt.principal ??
      debt.initialBalance ??
      debt.initial_balance ??
      debt.amount ??
      0,
  );

  const balance = Number(
    debt.currentBalance ??
      debt.current_balance ??
      debt.remainingBalance ??
      debt.remaining_balance ??
      debt.outstanding ??
      debt.balance ??
      original,
  );

  const paid = Math.max(
    0,
    original - balance,
  );

  const progress =
    original > 0
      ? Math.min(
          100,
          Math.max(0, (paid / original) * 100),
        )
      : 0;

  const interest = Number(
    debt.interestRate ??
      debt.interest_rate ??
      debt.apr ??
      0,
  );

  const payment = Number(
    debt.minimumPayment ??
      debt.minimum_payment ??
      debt.monthlyPayment ??
      debt.monthly_payment ??
      debt.payment ??
      0,
  );

  return {
    id:
      debt.id ??
      debt.debtId ??
      debt.debt_id,
    name:
      debt.name ??
      debt.debtName ??
      debt.debt_name ??
      debt.lender ??
      debt.creditor ??
      'Debt',
    type:
      debt.type ??
      debt.debtType ??
      debt.debt_type ??
      'Liability',
    original,
    balance: Math.max(0, balance),
    paid,
    progress,
    interest,
    payment,
    dueDate:
      debt.dueDate ??
      debt.due_date ??
      debt.nextPaymentDate ??
      debt.next_payment_date ??
      null,
    raw: debt,
  };
}

function dueInfo(value) {
  if (!value) {
    return {
      label: 'No due date',
      overdue: false,
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      label: String(value),
      overdue: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (date.getTime() - today.getTime()) /
      86400000,
  );

  if (days < 0) {
    return {
      label: `${Math.abs(days)}d overdue`,
      overdue: true,
    };
  }

  if (days === 0) {
    return {
      label: 'Due today',
      overdue: false,
    };
  }

  if (days === 1) {
    return {
      label: 'Due tomorrow',
      overdue: false,
    };
  }

  return {
    label: `${days} days`,
    overdue: false,
  };
}

export default function DebtCard({
  debt,
  onClick,
  onMenu,
  compact = false,
}) {
  const data = useMemo(
    () => normalizeDebt(debt),
    [debt],
  );

  const due = dueInfo(data.dueDate);
  const cleared = data.balance <= 0;
  const highInterest = data.interest >= 15;

  const color = cleared
    ? '#34d399'
    : due.overdue
      ? '#fb7185'
      : highInterest
        ? '#fbbf24'
        : '#f97316';

  return (
    <article
      onClick={() => onClick?.(data.raw)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: compact ? 14 : 17,
        borderRadius: 21,
        border: `1px solid ${color}18`,
        background:
          'linear-gradient(145deg, rgba(15,23,42,.91), rgba(2,6,23,.97))',
        boxShadow:
          '0 18px 55px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.025)',
        cursor: onClick ? 'pointer' : 'default',
        transition:
          'transform .22s ease, border-color .22s ease, box-shadow .22s ease',
      }}
      onMouseEnter={(event) => {
        if (!onClick) return;

        event.currentTarget.style.transform =
          'translateY(-3px)';
        event.currentTarget.style.borderColor =
          `${color}38`;
        event.currentTarget.style.boxShadow =
          `0 25px 65px ${color}10`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          'translateY(0)';
        event.currentTarget.style.borderColor =
          `${color}18`;
        event.currentTarget.style.boxShadow =
          '0 18px 55px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.025)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 155,
          height: 155,
          top: -80,
          right: -70,
          borderRadius: '50%',
          background: `${color}0d`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
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
              width: 40,
              height: 40,
              flex: '0 0 40px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 13,
              color,
              background: `${color}10`,
              border: `1px solid ${color}1c`,
            }}
          >
            {cleared ? (
              <CheckCircle2 size={18} />
            ) : (
              <CreditCard size={18} />
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#e2e8f0',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {data.name}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
                color: '#64748b',
                fontSize: 9,
              }}
            >
              <span>{data.type}</span>
              <span>•</span>
              <span>
                {cleared
                  ? 'Paid off'
                  : due.label}
              </span>
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
          marginTop: 18,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 15,
        }}
      >
        <div>
          <div
            style={{
              color: '#f8fafc',
              fontSize: compact ? 19 : 23,
              lineHeight: 1,
              fontWeight: 850,
              letterSpacing: '-.04em',
            }}
          >
            {money(data.balance)}
          </div>

          <div
            style={{
              marginTop: 5,
              color: '#475569',
              fontSize: 9,
            }}
          >
            outstanding balance
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
          }}
        >
          <div
            style={{
              color,
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 850,
            }}
          >
            {Math.round(data.progress)}%
          </div>

          <div
            style={{
              marginTop: 5,
              color: '#475569',
              fontSize: 9,
            }}
          >
            repaid
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ProgressBar
          value={data.progress}
          max={100}
          variant={
            cleared
              ? 'success'
              : due.overdue
                ? 'danger'
                : 'warning'
          }
          height={7}
          showPercentage={false}
          animated
          glow
        />
      </div>

      {!compact && (
        <div
          style={{
            marginTop: 13,
            display: 'grid',
            gridTemplateColumns:
              'repeat(3, minmax(0,1fr))',
            gap: 7,
          }}
        >
          <Metric
            label="Original"
            value={money(data.original)}
            icon={CircleDollarSign}
          />

          <Metric
            label="Interest"
            value={`${data.interest.toFixed(1)}%`}
            icon={Percent}
            danger={highInterest}
          />

          <Metric
            label="Payment"
            value={money(data.payment)}
            icon={ArrowDownRight}
          />
        </div>
      )}

      {!cleared && (
        <div
          style={{
            marginTop: 10,
            padding: '9px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            borderRadius: 11,
            color: due.overdue
              ? '#fda4af'
              : '#64748b',
            background: due.overdue
              ? 'rgba(244,63,94,.06)'
              : 'rgba(255,255,255,.018)',
            fontSize: 9,
          }}
        >
          {due.overdue ? (
            <ShieldAlert size={12} />
          ) : (
            <CalendarClock size={12} />
          )}

          {due.overdue
            ? `Payment is ${due.label}`
            : `Next payment: ${due.label}`}
        </div>
      )}

      {onClick && (
        <div
          style={{
            marginTop: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            color: '#475569',
            fontSize: 9,
          }}
        >
          Debt details
          <ArrowUpRight size={12} />
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
        padding: 8,
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
          whiteSpace: 'nowrap',
          color: danger ? '#fbbf24' : '#cbd5e1',
          fontSize: 9,
          fontWeight: 750,
        }}
      >
        {value}
      </div>
    </div>
  );
}