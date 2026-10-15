import React from 'react';
import {
  CalendarDays,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

const CONTROL_STYLE = {
  height: 38,
  boxSizing: 'border-box',
  borderRadius: 11,
  border: '1px solid rgba(148,163,184,.10)',
  background: 'rgba(2,6,23,.62)',
  color: '#cbd5e1',
  outline: 'none',
  fontSize: 10,
};

export default function TransactionFilters({
  filters = {},
  onChange,
  categories = [],
  accounts = [],
  onReset,
}) {
  const update = (key, value) => {
    onChange?.({
      ...filters,
      [key]: value,
    });
  };

  return (
    <section
      style={{
        padding: 14,
        borderRadius: 18,
        border:
          '1px solid rgba(148,163,184,.10)',
        background:
          'linear-gradient(145deg, rgba(15,23,42,.78), rgba(2,6,23,.84))',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,.025)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 11,
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        <SlidersHorizontal size={13} />
        Transaction filters
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(220px, 1.6fr) repeat(4, minmax(130px, 1fr)) auto',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#475569',
            }}
          />

          <input
            value={filters.search || ''}
            onChange={(event) =>
              update('search', event.target.value)
            }
            placeholder="Search transactions..."
            style={{
              ...CONTROL_STYLE,
              width: '100%',
              padding: '0 11px 0 34px',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <select
            value={filters.type || 'all'}
            onChange={(event) =>
              update('type', event.target.value)
            }
            style={{
              ...CONTROL_STYLE,
              width: '100%',
              padding: '0 30px 0 11px',
              appearance: 'none',
            }}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <ChevronDown
            size={13}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#475569',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <select
            value={filters.category || 'all'}
            onChange={(event) =>
              update(
                'category',
                event.target.value,
              )
            }
            style={{
              ...CONTROL_STYLE,
              width: '100%',
              padding: '0 30px 0 11px',
              appearance: 'none',
            }}
          >
            <option value="all">
              All categories
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>

          <ChevronDown
            size={13}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#475569',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <select
            value={filters.account || 'all'}
            onChange={(event) =>
              update(
                'account',
                event.target.value,
              )
            }
            style={{
              ...CONTROL_STYLE,
              width: '100%',
              padding: '0 30px 0 11px',
              appearance: 'none',
            }}
          >
            <option value="all">
              All accounts
            </option>

            {accounts.map((account) => (
              <option
                key={account}
                value={account}
              >
                {account}
              </option>
            ))}
          </select>

          <ChevronDown
            size={13}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#475569',
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
          }}
        >
          <CalendarDays
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#475569',
            }}
          />

          <input
            type="date"
            value={filters.date || ''}
            onChange={(event) =>
              update('date', event.target.value)
            }
            style={{
              ...CONTROL_STYLE,
              width: '100%',
              padding: '0 8px 0 31px',
              colorScheme: 'dark',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            onReset?.();
            if (!onReset) {
              onChange?.({});
            }
          }}
          style={{
            height: 38,
            width: 38,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 11,
            border:
              '1px solid rgba(148,163,184,.10)',
            background:
              'rgba(255,255,255,.025)',
            color: '#64748b',
            cursor: 'pointer',
          }}
          title="Reset filters"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <style>{`
        @media (max-width: 1050px) {
          .transaction-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 620px) {
          .transaction-filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}