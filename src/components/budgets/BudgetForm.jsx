import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Flag,
  Gauge,
  Target,
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

const PERIODS = [
  'Monthly',
  'Weekly',
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

export default function BudgetForm({
  initialValues = {},
  categories = [],
  onSubmit,
  onCancel,
  submitting = false,
  mode = 'create',
}) {
  const defaults = useMemo(
    () => ({
      name:
        initialValues.name ||
        initialValues.budgetName ||
        '',
      category:
        initialValues.category ||
        initialValues.categoryName ||
        '',
      amount:
        initialValues.amount ||
        initialValues.budgetAmount ||
        '',
      period:
        initialValues.period ||
        initialValues.frequency ||
        'Monthly',
      startDate:
        initialValues.startDate ||
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
    const amount = Number(form.amount);

    if (!form.name.trim()) {
      next.name = 'Budget name is required.';
    }

    if (!form.category) {
      next.category = 'Select a category.';
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      next.amount =
        'Budget amount must be greater than zero.';
    }

    if (!form.startDate) {
      next.startDate =
        'Select the budget start date.';
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
        maxWidth: 650,
        boxSizing: 'border-box',
        padding: 20,
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
              gap: 7,
              color: '#38bdf8',
              fontSize: 9,
              fontWeight: 850,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            <Gauge size={13} />
            Spending control
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
              ? 'Edit budget'
              : 'Create budget'}
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            Define a spending boundary that FinSight
            can measure against your actual activity.
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
            'repeat(2, minmax(0,1fr))',
          gap: 13,
        }}
      >
        <Field
          label="Budget name"
          icon={Target}
          required
        >
          <input
            value={form.name}
            onChange={(event) =>
              update('name', event.target.value)
            }
            placeholder="e.g. Monthly essentials"
            style={INPUT}
          />

          {errors.name && (
            <ErrorText>{errors.name}</ErrorText>
          )}
        </Field>

        <Field
          label="Category"
          icon={Flag}
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
          label="Budget limit"
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
            <ErrorText>
              {errors.amount}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Budget period"
          icon={CalendarDays}
          required
        >
          <Select
            value={form.period}
            onChange={(value) =>
              update('period', value)
            }
            options={PERIODS}
          />
        </Field>

        <Field
          label="Start date"
          icon={CalendarDays}
          required
        >
          <input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              update(
                'startDate',
                event.target.value,
              )
            }
            style={{
              ...INPUT,
              colorScheme: 'dark',
            }}
          />

          {errors.startDate && (
            <ErrorText>
              {errors.startDate}
            </ErrorText>
          )}
        </Field>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 12,
            borderRadius: 13,
            border:
              '1px solid rgba(56,189,248,.11)',
            background:
              'rgba(56,189,248,.035)',
          }}
        >
          <div>
            <div
              style={{
                color: '#bae6fd',
                fontSize: 10,
                fontWeight: 750,
              }}
            >
              Budget intelligence
            </div>

            <div
              style={{
                marginTop: 4,
                color: '#64748b',
                fontSize: 9,
                lineHeight: 1.4,
              }}
            >
              Actual spending will be compared against
              this limit.
            </div>
          </div>
        </div>

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
                update(
                  'notes',
                  event.target.value,
                )
              }
              placeholder="Optional budget context..."
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
            minWidth: 140,
            height: 40,
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 7,
            border: 0,
            borderRadius: 11,
            background:
              'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            cursor: submitting
              ? 'wait'
              : 'pointer',
            boxShadow:
              '0 10px 30px rgba(14,165,233,.18)',
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
                    'fs-budget-spin .7s linear infinite',
                }}
              />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              {mode === 'edit'
                ? 'Update budget'
                : 'Create budget'}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fs-budget-spin {
          to { transform: rotate(360deg); }
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(56,189,248,.35) !important;
          box-shadow: 0 0 0 3px rgba(56,189,248,.06);
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

function Select({
  value,
  onChange,
  options = [],
  placeholder,
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          ...INPUT,
          paddingRight: 32,
          appearance: 'none',
        }}
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