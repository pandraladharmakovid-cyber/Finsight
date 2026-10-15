import React, { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  CreditCard,
  Landmark,
  Receipt,
  Wallet,
  Utensils,
  ShoppingBag,
  Car,
  Banknote,
  TrendingUp,
  CircleDollarSign,
} from 'lucide-react';

import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return currency.format(Math.abs(amount));
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.round(
    (startToday - startDate) / 86400000,
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year:
      date.getFullYear() !== now.getFullYear()
        ? 'numeric'
        : undefined,
  }).format(date);
}

function resolveIcon(transaction) {
  const category = String(
    transaction?.category ?? '',
  ).toLowerCase();

  const description = String(
    transaction?.description ?? '',
  ).toLowerCase();

  if (
    category.includes('food') ||
    category.includes('dining') ||
    description.includes('swiggy') ||
    description.includes('zomato')
  ) {
    return Utensils;
  }

  if (
    category.includes('shopping') ||
    description.includes('amazon') ||
    description.includes('flipkart')
  ) {
    return ShoppingBag;
  }

  if (
    category.includes('transport') ||
    category.includes('travel') ||
    description.includes('uber') ||
    description.includes('ola')
  ) {
    return Car;
  }

  if (
    category.includes('investment') ||
    category.includes('mutual') ||
    description.includes('sip')
  ) {
    return TrendingUp;
  }

  if (
    category.includes('salary') ||
    description.includes('salary')
  ) {
    return Landmark;
  }

  if (
    category.includes('income') ||
    description.includes('payment')
  ) {
    return CircleDollarSign;
  }

  if (
    String(transaction?.account ?? '')
      .toLowerCase()
      .includes('credit')
  ) {
    return CreditCard;
  }

  if (
    String(transaction?.account ?? '')
      .toLowerCase()
      .includes('bank')
  ) {
    return Banknote;
  }

  if (
    String(transaction?.account ?? '')
      .toLowerCase()
      .includes('wallet')
  ) {
    return Wallet;
  }

  return Receipt;
}

function normalizeType(transaction) {
  const type = String(
    transaction?.type ?? '',
  ).toLowerCase();

  if (
    type === 'income' ||
    type === 'credit' ||
    type === 'deposit'
  ) {
    return 'income';
  }

  return 'expense';
}

export default function RecentTransactions({
  transactions = [],
  loading = false,
  error = null,
  onRefresh,
  onViewAll,
  onTransactionClick,
  title = 'Recent transactions',
  subtitle = 'Your latest financial activity',
  limit = 6,
}) {
  const rows = useMemo(() => {
    return Array.isArray(transactions)
      ? transactions.slice(0, limit)
      : [];
  }, [transactions, limit]);

  const hasData = rows.length > 0;

  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={Receipt}
      iconColor="#a78bfa"
      actions={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh transactions"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border:
                  '1px solid rgba(148,163,184,.13)',
                background:
                  'rgba(255,255,255,.035)',
                color: '#94a3b8',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <ArrowRight
                size={15}
                style={{
                  transform: 'rotate(-45deg)',
                }}
              />
            </button>
          )}

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: 0,
                background: 'transparent',
                color: '#a78bfa',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              View all
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      }
      padding="lg"
      radius="xl"
      glow
    >
      {loading ? (
        <div
          style={{
            display: 'grid',
            gap: 10,
          }}
        >
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div
                key={index}
                style={{
                  height: 68,
                  borderRadius: 15,
                  background:
                    'linear-gradient(110deg, rgba(255,255,255,.035), rgba(255,255,255,.07), rgba(255,255,255,.035))',
                  backgroundSize: '200% 100%',
                  animation:
                    'fs-transaction-skeleton 1.8s ease-in-out infinite',
                  animationDelay: `${index * 80}ms`,
                }}
              />
            ),
          )}

          <style>{`
            @keyframes fs-transaction-skeleton {
              0% { background-position: 100% 0; }
              50% { background-position: 0% 0; }
              100% { background-position: -100% 0; }
            }
          `}</style>
        </div>
      ) : error ? (
        <div
          style={{
            minHeight: 180,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: 20,
          }}
        >
          <div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 15,
                margin: '0 auto 12px',
                display: 'grid',
                placeItems: 'center',
                color: '#fda4af',
                background:
                  'rgba(244,63,94,.09)',
                border:
                  '1px solid rgba(244,63,94,.16)',
              }}
            >
              <Receipt size={20} />
            </div>

            <div
              style={{
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Transaction feed unavailable
            </div>

            <div
              style={{
                marginTop: 5,
                color: '#64748b',
                fontSize: 11,
              }}
            >
              {error.message ||
                'Unable to load recent activity.'}
            </div>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                style={{
                  marginTop: 14,
                  border: 0,
                  borderRadius: 9,
                  padding: '8px 13px',
                  background:
                    'rgba(139,92,246,.12)',
                  color: '#c4b5fd',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      ) : !hasData ? (
        <div
          style={{
            minHeight: 180,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
          }}
        >
          <div>
            <div
              style={{
                width: 54,
                height: 54,
                margin: '0 auto 12px',
                borderRadius: 17,
                display: 'grid',
                placeItems: 'center',
                color: '#a78bfa',
                background:
                  'linear-gradient(135deg, rgba(139,92,246,.15), rgba(56,189,248,.07))',
                border:
                  '1px solid rgba(167,139,250,.18)',
              }}
            >
              <Receipt size={22} />
            </div>

            <div
              style={{
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              No transactions yet
            </div>

            <div
              style={{
                marginTop: 5,
                color: '#64748b',
                fontSize: 11,
              }}
            >
              Your latest activity will appear here.
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 8,
          }}
        >
          {rows.map((transaction, index) => {
            const type = normalizeType(
              transaction,
            );

            const income = type === 'income';
            const Icon = resolveIcon(
              transaction,
            );

            const amount = Number(
              transaction.amount,
            ) || 0;

            return (
              <button
                key={
                  transaction.transactionId ??
                  transaction.id ??
                  index
                }
                type="button"
                onClick={() =>
                  onTransactionClick?.(
                    transaction,
                  )
                }
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns:
                    '42px minmax(0,1fr) auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 11px',
                  borderRadius: 15,
                  border:
                    '1px solid rgba(148,163,184,.08)',
                  background:
                    'rgba(255,255,255,.018)',
                  color: 'inherit',
                  textAlign: 'left',
                  cursor: onTransactionClick
                    ? 'pointer'
                    : 'default',
                  transition:
                    'transform .2s ease, background .2s ease, border-color .2s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform =
                    'translateX(3px)';
                  event.currentTarget.style.background =
                    'rgba(255,255,255,.045)';
                  event.currentTarget.style.borderColor =
                    'rgba(167,139,250,.16)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform =
                    'translateX(0)';
                  event.currentTarget.style.background =
                    'rgba(255,255,255,.018)';
                  event.currentTarget.style.borderColor =
                    'rgba(148,163,184,.08)';
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    display: 'grid',
                    placeItems: 'center',
                    color: income
                      ? '#6ee7b7'
                      : '#fda4af',
                    background: income
                      ? 'rgba(16,185,129,.09)'
                      : 'rgba(244,63,94,.08)',
                    border: income
                      ? '1px solid rgba(52,211,153,.14)'
                      : '1px solid rgba(251,113,133,.13)',
                  }}
                >
                  <Icon size={18} />
                </div>

                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#e2e8f0',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {transaction.description}
                    </span>

                    {transaction.category && (
                      <Badge
                        size="xs"
                        variant={
                          income
                            ? 'success'
                            : 'default'
                        }
                      >
                        {transaction.category}
                      </Badge>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#64748b',
                      fontSize: 10,
                    }}
                  >
                    <span>
                      {transaction.account ||
                        'Unknown account'}
                    </span>

                    <span
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background:
                          '#475569',
                      }}
                    />

                    <span>
                      {formatDate(
                        transaction.transactionDate,
                      )}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'right',
                    minWidth: 85,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'flex-end',
                      alignItems: 'center',
                      gap: 4,
                      color: income
                        ? '#6ee7b7'
                        : '#fda4af',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {income ? (
                      <ArrowDownLeft size={13} />
                    ) : (
                      <ArrowUpRight size={13} />
                    )}

                    {income ? '+' : '-'}
                    {formatCurrency(amount)}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: '#475569',
                      fontSize: 9,
                    }}
                  >
                    {income
                      ? 'CREDIT'
                      : 'DEBIT'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}