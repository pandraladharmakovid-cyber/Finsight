import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Percent,
  ShieldAlert,
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

const TYPES = [
  'Credit Card',
  'Personal Loan',
  'Education Loan',
  'Vehicle Loan',
  'Home Loan',
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

export default function DebtForm({
  initialValues = {},
  types = TYPES,
  onSubmit,
  onCancel,
  submitting = false,
  mode = 'create',
}) {
  const defaults = useMemo(
    () => ({
      name:
        initialValues.name ??
        initialValues.debtName ??
        initialValues.lender ??
        '',
      type:
        initialValues.type ??
        initialValues.debtType ??
        'Credit Card',
      originalAmount:
        initialValues.originalAmount ??
        initialValues.original_amount ??
        initialValues.principal ??
        '',
      currentBalance:
        initialValues.currentBalance ??
        initialValues.current_balance ??
        initialValues.balance ??
        '',
      interestRate:
        initialValues.interestRate ??
        initialValues.interest_rate ??
        initialValues.apr ??
        '',
      minimumPayment:
        initialValues.minimumPayment ??
        initialValues.minimum_payment ??
        initialValues.monthlyPayment ??
        '',
      dueDate:
        initialValues.dueDate ??
        initialValues.due_date ??
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

    const original = Number(
      form.originalAmount,
    );

    const balance = Number(
      form.currentBalance,
    );

    const interest = Number(
      form.interestRate || 0,
    );

    const payment = Number(
      form.minimumPayment || 0,
    );

    if (!form.name.trim()) {
      next.name = 'Enter the lender or debt name.';
    }

    if (!form.type) {
      next.type = 'Select a debt type.';
    }

    if (
      !Number.isFinite(original) ||
      original <= 0
    ) {
      next.originalAmount =
        'Original amount must be greater than zero.';
    }

    if (
      !Number.isFinite(balance) ||
      balance < 0
    ) {
      next.currentBalance =
        'Enter a valid current balance.';
    }

    if (
      Number.isFinite(original) &&
      Number.isFinite(balance) &&
      balance > original
    ) {
      next.currentBalance =
        'Current balance cannot exceed the original amount.';
    }

    if (
      interest < 0 ||
      interest > 100
    ) {
      next.interestRate =
        'Interest rate must be between 0% and 100%.';
    }

    if (payment < 0) {
      next.minimumPayment =
        'Payment cannot be negative.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    await onSubmit?.({
      ...form,
      originalAmount: Number(
        form.originalAmount,
      ),
      currentBalance: Number(
        form.currentBalance,
      ),
      interestRate: Number(
        form.interestRate || 0,
      ),
      minimumPayment: Number(
        form.minimumPayment || 0,
      ),
    });
  };

  const original = Number(
    form.originalAmount || 0,
  );

  const balance = Number(
    form.currentBalance || 0,
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
              color: '#fb923c',
              fontSize: 9,
              fontWeight: 850,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            <CreditCard size={13} />
            Liability control
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
              ? 'Edit debt'
              : 'Track a debt'}
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            Track outstanding liabilities so FinSight
            can calculate your real financial position.
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
            '1px solid rgba(249,115,22,.12)',
          background:
            'linear-gradient(135deg, rgba(249,115,22,.055), rgba(244,63,94,.025))',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 15,
          }}
        >
          <div>
            <div
              style={{
                color: '#fb923c',
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              Repayment progress
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
              {paid.toLocaleString('en-IN')} repaid
            </div>
            <div style={{ marginTop: 3 }}>
              ₹
              {balance.toLocaleString('en-IN')}{' '}
              outstanding
            </div>
          </div>
        </div>

        <div
          style={{
            height: 7,
            marginTop: 11,
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
                'linear-gradient(90deg, #f97316, #fb7185)',
              boxShadow:
                '0 0 18px rgba(249,115,22,.24)',
              transition:
                'width .35s cubic-bezier(.22,1,.36,1)',
            }}
          />
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
          label="Debt / lender"
          icon={CreditCard}
          required
        >
          <input
            value={form.name}
            onChange={(event) =>
              update('name', event.target.value)
            }
            placeholder="e.g. HDFC Credit Card"
            style={INPUT}
          />

          {errors.name && (
            <ErrorText>{errors.name}</ErrorText>
          )}
        </Field>

        <Field
          label="Debt type"
          icon={CreditCard}
          required
        >
          <select
            value={form.type}
            onChange={(event) =>
              update('type', event.target.value)
            }
            style={INPUT}
          >
            {types.map((type) => {
              const value =
                typeof type === 'string'
                  ? type
                  : type?.value;

              const label =
                typeof type === 'string'
                  ? type
                  : type?.label ?? value;

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

          {errors.type && (
            <ErrorText>{errors.type}</ErrorText>
          )}
        </Field>

        <Field
          label="Original amount"
          icon={CircleDollarSign}
          required
        >
          <MoneyInput
            value={form.originalAmount}
            onChange={(value) =>
              update('originalAmount', value)
            }
            placeholder="100000"
          />

          {errors.originalAmount && (
            <ErrorText>
              {errors.originalAmount}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Current balance"
          icon={CircleDollarSign}
          required
        >
          <MoneyInput
            value={form.currentBalance}
            onChange={(value) =>
              update(
                'currentBalance',
                value,
              )
            }
            placeholder="75000"
          />

          {errors.currentBalance && (
            <ErrorText>
              {errors.currentBalance}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Interest rate"
          icon={Percent}
        >
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.interestRate}
              onChange={(event) =>
                update(
                  'interestRate',
                  event.target.value,
                )
              }
              placeholder="12.5"
              style={{
                ...INPUT,
                paddingRight: 30,
              }}
            />

            <span
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              %
            </span>
          </div>

          {errors.interestRate && (
            <ErrorText>
              {errors.interestRate}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Monthly payment"
          icon={CircleDollarSign}
        >
          <MoneyInput
            value={form.minimumPayment}
            onChange={(value) =>
              update(
                'minimumPayment',
                value,
              )
            }
            placeholder="5000"
          />

          {errors.minimumPayment && (
            <ErrorText>
              {errors.minimumPayment}
            </ErrorText>
          )}
        </Field>

        <Field
          label="Next payment date"
          icon={CalendarClock}
        >
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              update(
                'dueDate',
                event.target.value,
              )
            }
            style={{
              ...INPUT,
              colorScheme: 'dark',
            }}
          />
        </Field>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: 11,
            borderRadius: 13,
            border:
              '1px solid rgba(251,113,133,.10)',
            background:
              'rgba(251,113,133,.035)',
          }}
        >
          <ShieldAlert
            size={15}
            color="#fb7185"
          />

          <span
            style={{
              color: '#94a3b8',
              fontSize: 9,
              lineHeight: 1.45,
            }}
          >
            Keep balances accurate. Debt affects
            your true net worth.
          </span>
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
            minWidth: 135,
            height: 40,
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 7,
            border: 0,
            borderRadius: 11,
            background:
              'linear-gradient(135deg, #f97316, #ef4444)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            cursor: submitting
              ? 'wait'
              : 'pointer',
            boxShadow:
              '0 10px 30px rgba(249,115,22,.18)',
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
                    'fs-debt-spin .7s linear infinite',
                }}
              />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              {mode === 'edit'
                ? 'Update debt'
                : 'Track debt'}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fs-debt-spin {
          to { transform: rotate(360deg); }
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(249,115,22,.35) !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,.06);
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

function MoneyInput({
  value,
  onChange,
  placeholder,
}) {
  return (
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
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={{
          ...INPUT,
          paddingLeft: 29,
        }}
      />
    </div>
  );
}