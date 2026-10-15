import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Repeat2,
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

const FREQUENCIES = [
  'Weekly',
  'Biweekly',
  'Monthly',
  'Quarterly',
  'Yearly',
];

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

function ErrorText({ children }) {
  return (
    <span
      style={{
        color: '#fb7185',
        fontSize: 9,
      }}
    >
      {children}
    </span>
  );
}

export default function RecurringTransactionForm({
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
      name:
        initialValues.name ??
        initialValues.description ??
        initialValues.title ??
        '',
      type:
        initialValues.type ??
        initialValues.transactionType ??
        'expense',
      amount:
        initialValues.amount ??
        initialValues.transactionAmount ??
        '',
      category:
        initialValues.category ??
        initialValues.categoryName ??
        '',
      account:
        initialValues.account ??
        initialValues.accountName ??
        '',
      frequency:
        initialValues.frequency ??
        initialValues.interval ??
        initialValues.recurrence ??
        'Monthly',
      nextDate:
        initialValues.nextDate ??
        initialValues.next_date ??
        initialValues.nextPaymentDate ??
        new Date()
          .toISOString()
          .slice(0, 10),
      notes: initialValues.notes ?? '',
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

    const amount = Number(form.amount);

    if (!form.name.trim()) {
      next.name =
        'Enter a recurring transaction name.';
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      next.amount =
        'Amount must be greater than zero.';
    }

    if (!form.category) {
      next.category =
        'Select a category.';
    }

    if (!form.account) {
      next.account =
        'Select an account.';
    }

    if (!form.frequency) {
      next.frequency =
        'Select a recurrence frequency.';
    }

    if (!form.nextDate) {
      next.nextDate =
        'Select the next occurrence date.';
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

  const income = form.type === 'income';

  return (
    <form
      onSubmit={submit}
      style={{
        width: '100%',
        maxWidth: 680,
        boxSizing: 'border-box',
        padding: 20,
        borderRadius: 24,
        border:
          '1px solid rgba(148,163,184,.11)',
        background:
          'linear-gradient(145deg, rgba(15,23,42,.95), rgba(2,6,23,.98))',
        boxShadow:
          '0 30px 90px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.025)',
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
              gap: 7,
              color: '#c4b5fd',
              fontSize: 9,
              fontWeight: 850,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            <Repeat2 size={13} />
            Automation layer
          </div>

          <h2
            style={{
              margin: '6px 0 0',
              color: '#f8fafc',
              fontSize: 21,
              fontWeight: 850,
              letterSpacing: '-.035em',
            }}
          >
            {mode === 'edit'
              ? 'Edit recurring item'
              : 'Create recurring item'}
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            Define predictable financial activity so
            future obligations stay visible.
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
          padding: 5,
          marginBottom: 15,
          display: 'grid',
          gridTemplateColumns:
            'repeat(2,1fr)',
          gap: 5,
          borderRadius: 14,
          background:
            'rgba(255,255,255,.025)',
          border:
            '1px solid rgba(148,163,184,.07)',
        }}
      >
        {[
          {
            value: 'expense',
            label: 'Recurring expense',
            color: '#fb7185',
          },
          {
            value: 'income',
            label: 'Recurring income',
            color: '#34d399',
          },
        ].map((item) => {
          const active =
            form.type === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                update('type', item.value)
              }
              style={{
                height: 40,
                border: 0,
                borderRadius: 10,
                background: active
                  ? `${item.color}10`
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
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2,minmax(0,1fr))',
          gap: 13,
        }}
      >
        <Field
          label="Name"
          icon={Repeat2}
          required
        >
          <input
            value={form.name}
            onChange={(event) =>
              update('name', event.target.value)
            }
            placeholder="e.g. Netflix subscription"
            style={INPUT}
          />

          {errors.name && (
            <ErrorText>{errors.name}</ErrorText>
          )}
        </Field>

        <Field
          label="Amount"
          icon={CircleDollarSign}
          required
        >
          <MoneyInput
            value={form.amount}
            onChange={(value) =>
              update('amount', value)
            }
            color={income ? '#34d399' : '#fb7185'}
          />

          {errors.amount && (
            <ErrorText>
              {errors.amount}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Category"
          icon={Repeat2}
          required
        >
          <Select
            value={form.category}
            onChange={(value) =>
              update('category', value)
            }
            options={categories}
            placeholder="Select category"
          />

          {errors.category && (
            <ErrorText>
              {errors.category}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Account"
          icon={CircleDollarSign}
          required
        >
          <Select
            value={form.account}
            onChange={(value) =>
              update('account', value)
            }
            options={accounts}
            placeholder="Select account"
          />

          {errors.account && (
            <ErrorText>
              {errors.account}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Frequency"
          icon={Clock3}
          required
        >
          <Select
            value={form.frequency}
            onChange={(value) =>
              update('frequency', value)
            }
            options={FREQUENCIES}
          />

          {errors.frequency && (
            <ErrorText>
              {errors.frequency}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Next occurrence"
          icon={CalendarClock}
          required
        >
          <input
            type="date"
            value={form.nextDate}
            onChange={(event) =>
              update(
                'nextDate',
                event.target.value,
              )
            }
            style={{
              ...INPUT,
              colorScheme: 'dark',
            }}
          />

          {errors.nextDate && (
            <ErrorText>
              {errors.nextDate}
            </ErrorText>
          )}
        </Field>

        <div
          style={{
            gridColumn: '1 / -1',
          }}
        >
          <Field
            label="Notes"
            icon={FileText}
          >
            <textarea
              value={form.notes}
              onChange={(event) =>
                update('notes', event.target.value)
              }
              placeholder="Optional recurring payment context..."
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
            minWidth: 155,
            height: 40,
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 7,
            border: 0,
            borderRadius: 11,
            background:
              'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            cursor: submitting
              ? 'wait'
              : 'pointer',
            boxShadow:
              '0 10px 30px rgba(139,92,246,.2)',
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
                    'fs-recurring-spin .7s linear infinite',
                }}
              />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              {mode === 'edit'
                ? 'Update schedule'
                : 'Create schedule'}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fs-recurring-spin {
          to { transform: rotate(360deg); }
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(139,92,246,.35) !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,.06);
        }

        @media (max-width: 620px) {
          form > div:last-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}

function MoneyInput({
  value,
  onChange,
  color,
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: color || '#64748b',
          fontWeight: 700,
        }}
      >
        ₹
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="0.00"
        style={{
          ...INPUT,
          paddingLeft: 29,
        }}
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  options = [],
  placeholder,
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={INPUT}
    >
      {placeholder && (
        <option value="">
          {placeholder}
        </option>
      )}

      {options.map((option) => {
        const value =
          typeof option === 'string'
            ? option
            : option?.value;

        const label =
          typeof option === 'string'
            ? option
            : option?.label ?? value;

        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}