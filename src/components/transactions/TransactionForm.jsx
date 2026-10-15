import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Landmark,
  Tag,
  Wallet,
  X,
} from 'lucide-react';

const INPUT = {
  width: '100%',
  height: 43,
  boxSizing: 'border-box',
  padding: '0 12px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.11)',
  background: 'rgba(2,6,23,.72)',
  color: '#e2e8f0',
  outline: 'none',
  fontSize: 11,
};

function Field({
  label,
  icon: Icon,
  children,
  required = false,
}) {
  return (
    <label
      style={{
        display: 'grid',
        gap: 6,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#94a3b8',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '.05em',
          textTransform: 'uppercase',
        }}
      >
        <Icon size={12} />
        {label}
        {required && (
          <span style={{ color: '#fb7185' }}>
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

export default function TransactionForm({
  initialValues = {},
  categories = [],
  accounts = [],
  onSubmit,
  onCancel,
  submitting = false,
  mode = 'create',
}) {
  const defaults = useMemo(
    () => ({
      type: initialValues.type || 'expense',
      amount: initialValues.amount || '',
      description:
        initialValues.description || '',
      category: initialValues.category || '',
      account: initialValues.account || '',
      transactionDate:
        initialValues.transactionDate ||
        initialValues.date ||
        new Date()
          .toISOString()
          .slice(0, 10),
      notes: initialValues.notes || '',
    }),
    [initialValues],
  );

  const [form, setForm] = useState(defaults);
  const [errors, setErrors] = useState({});

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((current) => ({
        ...current,
        [key]: '',
      }));
    }
  };

  const validate = () => {
    const next = {};
    const numericAmount = Number(form.amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      next.amount =
        'Enter an amount greater than zero.';
    }

    if (!form.description.trim()) {
      next.description =
        'Description is required.';
    }

    if (!form.category) {
      next.category =
        'Select a category.';
    }

    if (!form.account) {
      next.account =
        'Select an account.';
    }

    if (!form.transactionDate) {
      next.transactionDate =
        'Select a transaction date.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    await onSubmit?.({
      ...form,
      amount: Number(form.amount),
    });
  };

  return (
    <form
      onSubmit={submit}
      style={{
        width: '100%',
        maxWidth: 720,
        padding: 20,
        boxSizing: 'border-box',
        borderRadius: 24,
        border:
          '1px solid rgba(148,163,184,.11)',
        background:
          'linear-gradient(145deg, rgba(15,23,42,.94), rgba(2,6,23,.97))',
        boxShadow:
          '0 30px 90px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.025)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#c4b5fd',
              fontSize: 9,
              fontWeight: 850,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            <CircleDollarSign size={13} />
            Financial ledger
          </div>

          <h2
            style={{
              margin: '6px 0 0',
              color: '#f8fafc',
              fontSize: 21,
              lineHeight: 1.15,
              fontWeight: 850,
              letterSpacing: '-.035em',
            }}
          >
            {mode === 'edit'
              ? 'Edit transaction'
              : 'Record transaction'}
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            Capture the transaction with enough
            context for meaningful financial analytics.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              border:
                '1px solid rgba(148,163,184,.10)',
              background:
                'rgba(255,255,255,.025)',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: 13,
        }}
      >
        <div
          style={{
            gridColumn: '1 / -1',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, 1fr)',
              padding: 4,
              borderRadius: 14,
              background:
                'rgba(255,255,255,.025)',
              border:
                '1px solid rgba(148,163,184,.08)',
            }}
          >
            {[
              {
                value: 'expense',
                label: 'Expense',
                icon: ArrowUpRight,
                color: '#fb7185',
              },
              {
                value: 'income',
                label: 'Income',
                icon: ArrowDownLeft,
                color: '#6ee7b7',
              },
            ].map((item) => {
              const Icon = item.icon;
              const active =
                form.type === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    update(
                      'type',
                      item.value,
                    )
                  }
                  style={{
                    height: 42,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 7,
                    border: 0,
                    borderRadius: 10,
                    background: active
                      ? `${item.color}12`
                      : 'transparent',
                    color: active
                      ? item.color
                      : '#64748b',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: active
                      ? `inset 0 0 0 1px ${item.color}22`
                      : 'none',
                  }}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <Field
          label="Amount"
          icon={CircleDollarSign}
          required
        >
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ₹
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                update(
                  'amount',
                  event.target.value,
                )
              }
              placeholder="0.00"
              style={{
                ...INPUT,
                paddingLeft: 29,
              }}
            />
          </div>

          {errors.amount && (
            <span
              style={{
                color: '#fb7185',
                fontSize: 9,
              }}
            >
              {errors.amount}
            </span>
          )}
        </Field>

        <Field
          label="Date"
          icon={CalendarDays}
          required
        >
          <input
            type="date"
            value={form.transactionDate}
            onChange={(event) =>
              update(
                'transactionDate',
                event.target.value,
              )
            }
            style={{
              ...INPUT,
              colorScheme: 'dark',
            }}
          />

          {errors.transactionDate && (
            <span
              style={{
                color: '#fb7185',
                fontSize: 9,
              }}
            >
              {errors.transactionDate}
            </span>
          )}
        </Field>

        <Field
          label="Description"
          icon={FileText}
          required
        >
          <input
            value={form.description}
            onChange={(event) =>
              update(
                'description',
                event.target.value,
              )
            }
            placeholder="e.g. Monthly salary"
            style={INPUT}
          />

          {errors.description && (
            <span
              style={{
                color: '#fb7185',
                fontSize: 9,
              }}
            >
              {errors.description}
            </span>
          )}
        </Field>

        <Field
          label="Category"
          icon={Tag}
          required
        >
          <div style={{ position: 'relative' }}>
            <select
              value={form.category}
              onChange={(event) =>
                update(
                  'category',
                  event.target.value,
                )
              }
              style={{
                ...INPUT,
                paddingRight: 32,
                appearance: 'none',
              }}
            >
              <option value="">
                Select category
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
                right: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#475569',
              }}
            />
          </div>

          {errors.category && (
            <span
              style={{
                color: '#fb7185',
                fontSize: 9,
              }}
            >
              {errors.category}
            </span>
          )}
        </Field>

        <Field
          label="Account"
          icon={Landmark}
          required
        >
          <div style={{ position: 'relative' }}>
            <select
              value={form.account}
              onChange={(event) =>
                update(
                  'account',
                  event.target.value,
                )
              }
              style={{
                ...INPUT,
                paddingRight: 32,
                appearance: 'none',
              }}
            >
              <option value="">
                Select account
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
                right: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#475569',
              }}
            />
          </div>

          {errors.account && (
            <span
              style={{
                color: '#fb7185',
                fontSize: 9,
              }}
            >
              {errors.account}
            </span>
          )}
        </Field>

        <div
          style={{
            gridColumn: '1 / -1',
          }}
        >
          <Field
            label="Notes"
            icon={Wallet}
          >
            <textarea
              value={form.notes}
              onChange={(event) =>
                update(
                  'notes',
                  event.target.value,
                )
              }
              placeholder="Optional context..."
              rows={3}
              style={{
                ...INPUT,
                height: 'auto',
                padding: 12,
                resize: 'vertical',
              }}
            />
          </Field>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              height: 40,
              padding: '0 14px',
              borderRadius: 11,
              border:
                '1px solid rgba(148,163,184,.10)',
              background:
                'rgba(255,255,255,.025)',
              color: '#94a3b8',
              fontSize: 10,
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            height: 40,
            minWidth: 145,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            border: 0,
            borderRadius: 11,
            background:
              'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            cursor: submitting
              ? 'wait'
              : 'pointer',
            boxShadow:
              '0 10px 30px rgba(99,102,241,.24)',
            opacity: submitting ? 0.65 : 1,
          }}
        >
          {submitting ? (
            <>
              <span
                style={{
                  width: 13,
                  height: 13,
                  border:
                    '2px solid rgba(255,255,255,.35)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation:
                    'fs-form-spin .7s linear infinite',
                }}
              />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              {mode === 'edit'
                ? 'Update transaction'
                : 'Save transaction'}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fs-form-spin {
          to { transform: rotate(360deg); }
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(139,92,246,.38) !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,.07);
        }

        @media (max-width: 620px) {
          form > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}