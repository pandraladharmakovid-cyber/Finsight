import React, { useMemo } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Repeat2,
  TrendingUp,
} from 'lucide-react';

import Badge from '../ui/Badge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function money(value) {
  return INR.format(Math.abs(Number(value) || 0));
}

function normalize(item = {}) {
  const amount = Number(
    item.amount ??
      item.transactionAmount ??
      item.transaction_amount ??
      item.value ??
      0,
  );

  const type = String(
    item.type ??
      item.transactionType ??
      item.transaction_type ??
      'expense',
  ).toLowerCase();

  const frequency =
    item.frequency ??
    item.interval ??
    item.recurrence ??
    item.recurrenceType ??
    'Monthly';

  const active =
    item.active ??
    item.isActive ??
    item.is_active ??
    item.status === 'active' ??
    true;

  return {
    id:
      item.id ??
      item.recurringId ??
      item.recurring_id,
    name:
      item.name ??
      item.description ??
      item.title ??
      'Recurring transaction',
    category:
      item.category ??
      item.categoryName ??
      item.category_name ??
      'General',
    account:
      item.account ??
      item.accountName ??
      item.account_name ??
      'Account',
    amount,
    type:
      type === 'income' ||
      type === 'credit'
        ? 'income'
        : 'expense',
    frequency,
    nextDate:
      item.nextDate ??
      item.next_date ??
      item.nextPaymentDate ??
      item.next_payment_date ??
      null,
    lastDate:
      item.lastDate ??
      item.last_date ??
      item.lastPaymentDate ??
      item.last_payment_date ??
      null,
    active,
    raw: item,
  };
}

function dateInfo(value) {
  if (!value) {
    return {
      label: 'Not scheduled',
      days: null,
    };
  }

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return {
      label: String(value),
      days: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (target.getTime() - today.getTime()) /
      86400000,
  );

  if (days < 0) {
    return {
      label: `${Math.abs(days)}d overdue`,
      days,
    };
  }

  if (days === 0) {
    return {
      label: 'Due today',
      days,
    };
  }

  if (days === 1) {
    return {
      label: 'Tomorrow',
      days,
    };
  }

  return {
    label: `${days} days`,
    days,
  };
}

export default function RecurringTransactionCard({
  transaction,
  onClick,
  onMenu,
  onToggle,
  compact = false,
}) {
  const data = useMemo(
    () => normalize(transaction),
    [transaction],
  );

  const next = dateInfo(data.nextDate);

  const income = data.type === 'income';
  const overdue =
    next.days !== null && next.days < 0;

  const color = !data.active
    ? '#64748b'
    : overdue
      ? '#fb7185'
      : income
        ? '#34d399'
        : '#a78bfa';

  return (
    <article
      onClick={() => onClick?.(data.raw)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: compact ? 14 : 17,
        borderRadius: 20,
        border: `1px solid ${color}18`,
        background:
          'linear-gradient(145deg, rgba(15,23,42,.9), rgba(2,6,23,.96))',
        boxShadow:
          '0 18px 55px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.025)',
        cursor: onClick ? 'pointer' : 'default',
        transition:
          'transform .22s ease, border-color .22s ease',
        opacity: data.active ? 1 : 0.72,
      }}
      onMouseEnter={(event) => {
        if (!onClick) return;

        event.currentTarget.style.transform =
          'translateY(-3px)';
        event.currentTarget.style.borderColor =
          `${color}38`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          'translateY(0)';
        event.currentTarget.style.borderColor =
          `${color}18`;
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 145,
          height: 145,
          top: -75,
          right: -65,
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
          alignItems: 'flex-start',
          justifyContent: 'space-between',
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
            <Repeat2 size={18} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span
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
              </span>

              <Badge
                size="xs"
                variant={
                  data.active
                    ? 'success'
                    : 'default'
                }
              >
                {data.active
                  ? 'Active'
                  : 'Paused'}
              </Badge>
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
              <span>{data.category}</span>
              <span>•</span>
              <span>{data.frequency}</span>
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
          gap: 15,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color,
              fontSize: compact ? 18 : 22,
              lineHeight: 1,
              fontWeight: 850,
              letterSpacing: '-.035em',
            }}
          >
            {income ? (
              <ArrowDownLeft size={15} />
            ) : (
              <ArrowUpRight size={15} />
            )}
            {income ? '+' : '-'}
            {money(data.amount)}
          </div>

          <div
            style={{
              marginTop: 5,
              color: '#475569',
              fontSize: 9,
            }}
          >
            {income
              ? 'recurring income'
              : 'recurring expense'}
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 5,
              color: overdue
                ? '#fb7185'
                : '#94a3b8',
              fontSize: 10,
              fontWeight: 750,
            }}
          >
            <CalendarClock size={12} />
            {next.label}
          </div>

          <div
            style={{
              marginTop: 4,
              color: '#475569',
              fontSize: 9,
            }}
          >
            next occurrence
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <div
            style={{
              marginTop: 14,
              padding: '10px 11px',
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, 1fr)',
              gap: 7,
              borderRadius: 12,
              background:
                'rgba(255,255,255,.018)',
              border:
                '1px solid rgba(148,163,184,.05)',
            }}
          >
            <Metric
              label="Frequency"
              value={data.frequency}
              icon={Clock3}
            />

            <Metric
              label="Account"
              value={data.account}
              icon={CircleDollarSign}
            />

            <Metric
              label="Status"
              value={
                data.active
                  ? 'Running'
                  : 'Paused'
              }
              icon={
                data.active
                  ? PlayCircle
                  : PauseCircle
              }
              color={color}
            />
          </div>

          {overdue && (
            <div
              style={{
                marginTop: 9,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 10px',
                borderRadius: 11,
                background:
                  'rgba(244,63,94,.055)',
                color: '#fda4af',
                fontSize: 9,
              }}
            >
              <AlertCircle size={12} />
              This recurring item is past its expected
              date.
            </div>
          )}
        </>
      )}

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {onToggle ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(data.raw, !data.active);
            }}
            style={{
              height: 30,
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 9,
              border:
                '1px solid rgba(148,163,184,.08)',
              background:
                'rgba(255,255,255,.025)',
              color: '#94a3b8',
              fontSize: 9,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {data.active ? (
              <PauseCircle size={12} />
            ) : (
              <PlayCircle size={12} />
            )}
            {data.active
              ? 'Pause'
              : 'Resume'}
          </button>
        ) : (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: color,
              fontSize: 9,
              fontWeight: 750,
            }}
          >
            {data.active ? (
              <CheckCircle2 size={12} />
            ) : (
              <TrendingUp size={12} />
            )}
            {data.active
              ? 'Schedule active'
              : 'Schedule paused'}
          </span>
        )}

        {onClick && (
          <span
            style={{
              color: '#475569',
              fontSize: 9,
            }}
          >
            Manage →
          </span>
        )}
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  color = '#94a3b8',
}) {
  return (
    <div style={{ minWidth: 0 }}>
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
          marginTop: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color,
          fontSize: 9,
          fontWeight: 750,
        }}
      >
        {value}
      </div>
    </div>
  );
}