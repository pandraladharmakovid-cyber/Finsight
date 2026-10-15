import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Flag,
  PiggyBank,
  Sparkles,
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

const DEFAULT_CATEGORIES = [
  'Emergency fund',
  'Travel',
  'Education',
  'Vehicle',
  'Home',
  'Investment',
  'Technology',
  'Other',
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

export default function SavingsGoalForm({
  initialValues = {},
  categories = DEFAULT_CATEGORIES,
  onSubmit,
  onCancel,
  submitting = false,
  mode = 'create',
}) {
  const defaults = useMemo(
    () => ({
      name:
        initialValues.name ??
        initialValues.goalName ??
        '',
      category:
        initialValues.category ??
        initialValues.categoryName ??
        '',
      targetAmount:
        initialValues.targetAmount ??
        initialValues.target_amount ??
        initialValues.target ??
        '',
      currentAmount:
        initialValues.currentAmount ??
        initialValues.current_amount ??
        initialValues.saved ??
        '',
      deadline:
        initialValues.deadline ??
        initialValues.targetDate ??
        initialValues.target_date ??
        '',
      monthlyContribution:
        initialValues.monthlyContribution ??
        initialValues.monthly_contribution ??
        '',
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

    const target = Number(
      form.targetAmount,
    );

    const current = Number(
      form.currentAmount || 0,
    );

    const monthly = Number(
      form.monthlyContribution || 0,
    );

    if (!form.name.trim()) {
      next.name =
        'Give this savings goal a name.';
    }

    if (!form.category) {
      next.category =
        'Select a goal category.';
    }

    if (
      !Number.isFinite(target) ||
      target <= 0
    ) {
      next.targetAmount =
        'Target amount must be greater than zero.';
    }

    if (
      Number.isFinite(current) &&
      current < 0
    ) {
      next.currentAmount =
        'Current savings cannot be negative.';
    }

    if (
      Number.isFinite(target) &&
      Number.isFinite(current) &&
      current > target
    ) {
      next.currentAmount =
        'Current savings cannot exceed the target.';
    }

    if (
      form.monthlyContribution &&
      (!Number.isFinite(monthly) ||
        monthly < 0)
    ) {
      next.monthlyContribution =
        'Enter a valid contribution amount.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    await onSubmit?.({
      ...form,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(
        form.currentAmount || 0,
      ),
      monthlyContribution: Number(
        form.monthlyContribution || 0,
      ),
    });
  };

  const target = Number(
    form.targetAmount || 0,
  );

  const current = Number(
    form.currentAmount || 0,
  );

  const progress =
    target > 0
      ? Math.min(
          100,
          Math.max(0, (current / target) * 100),
        )
      : 0;

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
          alignItems: 'flex-start',
          justifyContent: 'space-between',
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
              color: '#6ee7b7',
              fontSize: 9,
              fontWeight: 850,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            <PiggyBank size={13} />
            Wealth building
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
              ? 'Edit savings goal'
              : 'Create savings goal'}
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            Turn a financial objective into a
            measurable milestone.
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
          padding: 14,
          marginBottom: 15,
          borderRadius: 17,
          border:
            '1px solid rgba(52,211,153,.12)',
          background:
            'linear-gradient(135deg, rgba(16,185,129,.065), rgba(6,182,212,.025))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#6ee7b7',
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={11} />
              Current progress
            </div>

            <div
              style={{
                marginTop: 5,
                color: '#f8fafc',
                fontSize: 19,
                fontWeight: 850,
              }}
            >
              {Math.round(progress)}%
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              color: '#64748b',
              fontSize: 9,
            }}
          >
            <div>
              ₹
              {current.toLocaleString('en-IN')}
            </div>
            <div style={{ marginTop: 3 }}>
              of ₹
              {target.toLocaleString('en-IN') || '0'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 11 }}>
          <div
            style={{
              height: 7,
              overflow: 'hidden',
              borderRadius: 999,
              background:
                'rgba(255,255,255,.06)',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: 999,
                background:
                  'linear-gradient(90deg, #34d399, #22d3ee)',
                boxShadow:
                  '0 0 18px rgba(52,211,153,.28)',
                transition:
                  'width .35s cubic-bezier(.22,1,.36,1)',
              }}
            />
          </div>
        </div>
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
          label="Goal name"
          icon={Target}
          required
        >
          <input
            value={form.name}
            onChange={(event) =>
              update('name', event.target.value)
            }
            placeholder="e.g. Emergency fund"
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
          <select
            value={form.category}
            onChange={(event) =>
              update(
                'category',
                event.target.value,
              )
            }
            style={INPUT}
          >
            <option value="">
              Select category
            </option>

            {categories.map((category) => {
              const value =
                typeof category === 'string'
                  ? category
                  : category?.value;

              const label =
                typeof category === 'string'
                  ? category
                  : category?.label ?? value;

              return (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              );
            })}
          </select>

          {errors.category && (
            <ErrorText>
              {errors.category}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Target amount"
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
              value={form.targetAmount}
              onChange={(event) =>
                update(
                  'targetAmount',
                  event.target.value,
                )
              }
              placeholder="100000"
              style={{
                ...INPUT,
                paddingLeft: 29,
              }}
            />
          </div>

          {errors.targetAmount && (
            <ErrorText>
              {errors.targetAmount}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Already saved"
          icon={PiggyBank}
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
              value={form.currentAmount}
              onChange={(event) =>
                update(
                  'currentAmount',
                  event.target.value,
                )
              }
              placeholder="0"
              style={{
                ...INPUT,
                paddingLeft: 29,
              }}
            />
          </div>

          {errors.currentAmount && (
            <ErrorText>
              {errors.currentAmount}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Target date"
          icon={CalendarDays}
        >
          <input
            type="date"
            value={form.deadline}
            onChange={(event) =>
              update(
                'deadline',
                event.target.value,
              )
            }
            style={{
              ...INPUT,
              colorScheme: 'dark',
            }}
          />
        </Field>

        <Field
          label="Monthly contribution"
          icon={CircleDollarSign}
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
              value={
                form.monthlyContribution
              }
              onChange={(event) =>
                update(
                  'monthlyContribution',
                  event.target.value,
                )
              }
              placeholder="5000"
              style={{
                ...INPUT,
                paddingLeft: 29,
              }}
            />
          </div>

          {errors.monthlyContribution && (
            <ErrorText>
              {errors.monthlyContribution}
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
            icon={Sparkles}
          >
            <textarea
              value={form.notes}
              onChange={(event) =>
                update('notes', event.target.value)
              }
              placeholder="Why this goal matters..."
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
            minWidth: 150,
            height: 40,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            border: 0,
            borderRadius: 11,
            background:
              'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            cursor: submitting
              ? 'wait'
              : 'pointer',
            boxShadow:
              '0 10px 30px rgba(16,185,129,.18)',
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
                    'fs-savings-spin .7s linear infinite',
                }}
              />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              {mode === 'edit'
                ? 'Update goal'
                : 'Create goal'}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fs-savings-spin {
          to { transform: rotate(360deg); }
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(52,211,153,.35) !important;
          box-shadow: 0 0 0 3px rgba(52,211,153,.06);
        }

        @media (max-width: 620px) {
          form > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}