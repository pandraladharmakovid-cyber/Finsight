import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  MoreHorizontal,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
} from 'lucide-react';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const DATE = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function amount(value) {
  return INR.format(Math.abs(Number(value) || 0));
}

function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : DATE.format(parsed);
}

function typeOf(row) {
  const type = String(row?.type || '').toLowerCase();
  return ['income', 'credit', 'deposit'].includes(type)
    ? 'income'
    : 'expense';
}

function iconFor(row) {
  const account = String(row?.account || '').toLowerCase();

  if (account.includes('credit')) return CreditCard;
  if (account.includes('wallet')) return Wallet;
  return Receipt;
}

export default function TransactionTable({
  transactions = [],
  loading = false,
  error = null,
  onRowClick,
  onDelete,
  onExport,
  pageSize = 10,
  searchable = true,
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return transactions;

    return transactions.filter((row) =>
      [
        row?.description,
        row?.category,
        row?.account,
        row?.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [transactions, query]);

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize),
  );

  const safePage = Math.min(page, pages);

  const visibleRows = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const first =
    filtered.length === 0
      ? 0
      : (safePage - 1) * pageSize + 1;

  const last = Math.min(
    safePage * pageSize,
    filtered.length,
  );

  return (
    <section
      style={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 22,
        border: '1px solid rgba(148,163,184,.11)',
        background:
          'linear-gradient(145deg, rgba(15,23,42,.82), rgba(2,6,23,.94))',
        boxShadow:
          '0 24px 70px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.025)',
      }}
    >
      <div
        style={{
          padding: 18,
          borderBottom:
            '1px solid rgba(148,163,184,.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#f8fafc',
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '-.02em',
              }}
            >
              Transaction ledger
            </div>
            <div
              style={{
                marginTop: 4,
                color: '#64748b',
                fontSize: 10,
              }}
            >
              Complete financial activity
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                style={{
                  height: 34,
                  padding: '0 11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 10,
                  border:
                    '1px solid rgba(148,163,184,.11)',
                  background:
                    'rgba(255,255,255,.035)',
                  color: '#94a3b8',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                Export
              </button>
            )}

            <button
              type="button"
              style={{
                width: 34,
                height: 34,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 10,
                border:
                  '1px solid rgba(148,163,184,.11)',
                background:
                  'rgba(255,255,255,.035)',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {searchable && (
          <div
            style={{
              position: 'relative',
              marginTop: 15,
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#475569',
              }}
            />

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search transactions, accounts, categories..."
              style={{
                width: '100%',
                height: 40,
                boxSizing: 'border-box',
                padding: '0 13px 0 36px',
                borderRadius: 12,
                outline: 'none',
                border:
                  '1px solid rgba(148,163,184,.10)',
                background:
                  'rgba(2,6,23,.62)',
                color: '#e2e8f0',
                fontSize: 11,
              }}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 18 }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              style={{
                height: 58,
                marginBottom: 7,
                borderRadius: 12,
                background:
                  'linear-gradient(100deg, rgba(255,255,255,.025), rgba(255,255,255,.065), rgba(255,255,255,.025))',
                backgroundSize: '200% 100%',
                animation:
                  'fs-table-loading 1.6s ease infinite',
                animationDelay: `${index * 80}ms`,
              }}
            />
          ))}

          <style>{`
            @keyframes fs-table-loading {
              0% { background-position: 100% 0; }
              100% { background-position: -100% 0; }
            }
          `}</style>
        </div>
      ) : error ? (
        <div
          style={{
            minHeight: 260,
            display: 'grid',
            placeItems: 'center',
            color: '#fb7185',
            fontSize: 12,
          }}
        >
          {error.message || 'Unable to load transactions.'}
        </div>
      ) : visibleRows.length === 0 ? (
        <div
          style={{
            minHeight: 260,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: 30,
          }}
        >
          <div>
            <div
              style={{
                width: 54,
                height: 54,
                margin: '0 auto 12px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 17,
                color: '#a78bfa',
                background:
                  'rgba(139,92,246,.09)',
              }}
            >
              <Receipt size={22} />
            </div>
            <div
              style={{
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 750,
              }}
            >
              No transactions found
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: 760,
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  {[
                    'Transaction',
                    'Category',
                    'Account',
                    'Date',
                    'Amount',
                    '',
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: '11px 15px',
                        textAlign:
                          heading === 'Amount'
                            ? 'right'
                            : 'left',
                        color: '#475569',
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '.07em',
                        textTransform: 'uppercase',
                        borderBottom:
                          '1px solid rgba(148,163,184,.07)',
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row, index) => {
                  const income =
                    typeOf(row) === 'income';
                  const Icon = iconFor(row);
                  const id =
                    row?.transactionId ??
                    row?.id ??
                    index;

                  return (
                    <tr
                      key={id}
                      onClick={() =>
                        onRowClick?.(row)
                      }
                      style={{
                        cursor: onRowClick
                          ? 'pointer'
                          : 'default',
                        transition:
                          'background .18s ease',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background =
                          'rgba(255,255,255,.025)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background =
                          'transparent';
                      }}
                    >
                      <td
                        style={{
                          padding: '13px 15px',
                          borderBottom:
                            '1px solid rgba(148,163,184,.055)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 35,
                              height: 35,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: 11,
                              color: income
                                ? '#6ee7b7'
                                : '#fda4af',
                              background: income
                                ? 'rgba(16,185,129,.08)'
                                : 'rgba(244,63,94,.08)',
                            }}
                          >
                            <Icon size={15} />
                          </div>

                          <div>
                            <div
                              style={{
                                color: '#e2e8f0',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {row?.description ||
                                'Unnamed transaction'}
                            </div>

                            <div
                              style={{
                                marginTop: 3,
                                color: '#475569',
                                fontSize: 9,
                              }}
                            >
                              {income
                                ? 'Income'
                                : 'Expense'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '13px 15px',
                          color: '#94a3b8',
                          fontSize: 10,
                          borderBottom:
                            '1px solid rgba(148,163,184,.055)',
                        }}
                      >
                        {row?.category || 'Uncategorized'}
                      </td>

                      <td
                        style={{
                          padding: '13px 15px',
                          color: '#94a3b8',
                          fontSize: 10,
                          borderBottom:
                            '1px solid rgba(148,163,184,.055)',
                        }}
                      >
                        {row?.account || '—'}
                      </td>

                      <td
                        style={{
                          padding: '13px 15px',
                          color: '#64748b',
                          fontSize: 10,
                          borderBottom:
                            '1px solid rgba(148,163,184,.055)',
                        }}
                      >
                        {date(
                          row?.transactionDate ??
                            row?.date,
                        )}
                      </td>

                      <td
                        style={{
                          padding: '13px 15px',
                          textAlign: 'right',
                          color: income
                            ? '#6ee7b7'
                            : '#fda4af',
                          fontSize: 11,
                          fontWeight: 800,
                          borderBottom:
                            '1px solid rgba(148,163,184,.055)',
                        }}
                      >
                        {income ? '+' : '-'}
                        {amount(row?.amount)}
                      </td>

                      <td
                        style={{
                          width: 48,
                          padding: '13px 15px',
                          borderBottom:
                            '1px solid rgba(148,163,184,.055)',
                          position: 'relative',
                        }}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveMenu(
                              activeMenu === id
                                ? null
                                : id,
                            );
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            display: 'grid',
                            placeItems: 'center',
                            border: 0,
                            borderRadius: 8,
                            background:
                              'transparent',
                            color: '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {activeMenu === id && (
                          <div
                            style={{
                              position: 'absolute',
                              zIndex: 20,
                              right: 12,
                              top: 45,
                              width: 130,
                              padding: 5,
                              borderRadius: 11,
                              border:
                                '1px solid rgba(148,163,184,.12)',
                              background:
                                '#0f172a',
                              boxShadow:
                                '0 18px 45px rgba(0,0,0,.4)',
                            }}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onDelete?.(row);
                                setActiveMenu(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 9px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                                border: 0,
                                borderRadius: 7,
                                background:
                                  'transparent',
                                color: '#fb7185',
                                fontSize: 10,
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: '12px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderTop:
                '1px solid rgba(148,163,184,.07)',
            }}
          >
            <span
              style={{
                color: '#475569',
                fontSize: 9,
              }}
            >
              Showing {first}–{last} of{' '}
              {filtered.length}
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() =>
                  setPage((value) =>
                    Math.max(1, value - 1),
                  )
                }
                style={{
                  width: 30,
                  height: 30,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                  border:
                    '1px solid rgba(148,163,184,.09)',
                  background:
                    'rgba(255,255,255,.025)',
                  color:
                    safePage <= 1
                      ? '#334155'
                      : '#94a3b8',
                  cursor:
                    safePage <= 1
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <span
                style={{
                  minWidth: 30,
                  textAlign: 'center',
                  color: '#cbd5e1',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {safePage}
              </span>

              <button
                type="button"
                disabled={safePage >= pages}
                onClick={() =>
                  setPage((value) =>
                    Math.min(
                      pages,
                      value + 1,
                    ),
                  )
                }
                style={{
                  width: 30,
                  height: 30,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                  border:
                    '1px solid rgba(148,163,184,.09)',
                  background:
                    'rgba(255,255,255,.025)',
                  color:
                    safePage >= pages
                      ? '#334155'
                      : '#94a3b8',
                  cursor:
                    safePage >= pages
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}