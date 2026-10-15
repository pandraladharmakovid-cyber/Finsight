import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  AlertOctagon,
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Flag,
  Gauge,
  HandCoins,
  Info,
  Landmark,
  Layers3,
  MoreHorizontal,
  Percent,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Legend,
  Line,
  Pie,
  PieChart as RechartsPieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ==========================================================================
   DEBT OVERVIEW
   Advanced financial intelligence dashboard component
   ========================================================================== */

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const CURRENCY_FORMATTER =
  new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  );

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    'en-IN',
    {
      maximumFractionDigits: 0,
    },
  );

const COMPACT_FORMATTER =
  new Intl.NumberFormat(
    'en-IN',
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  );

const STATUS = {
  healthy: {
    label: 'Healthy',
    color: '#34d399',
    soft: 'rgba(52,211,153,.09)',
    border: 'rgba(52,211,153,.18)',
    icon: CheckCircle2,
  },

  attention: {
    label: 'Attention',
    color: '#fbbf24',
    soft: 'rgba(251,191,36,.09)',
    border: 'rgba(251,191,36,.18)',
    icon: AlertCircle,
  },

  critical: {
    label: 'Critical',
    color: '#fb923c',
    soft: 'rgba(251,146,60,.09)',
    border: 'rgba(251,146,60,.18)',
    icon: AlertOctagon,
  },

  overdue: {
    label: 'Overdue',
    color: '#fb7185',
    soft: 'rgba(251,113,133,.09)',
    border: 'rgba(251,113,133,.18)',
    icon: ShieldAlert,
  },

  paid: {
    label: 'Paid off',
    color: '#60a5fa',
    soft: 'rgba(96,165,250,.09)',
    border: 'rgba(96,165,250,.18)',
    icon: CheckCircle2,
  },
};

const SORT_OPTIONS = [
  {
    id: 'balance',
    label: 'Outstanding balance',
  },
  {
    id: 'interest',
    label: 'Interest rate',
  },
  {
    id: 'payment',
    label: 'Monthly payment',
  },
  {
    id: 'progress',
    label: 'Payoff progress',
  },
  {
    id: 'name',
    label: 'Debt name',
  },
];

const CHART_COLORS = [
  '#60a5fa',
  '#34d399',
  '#a78bfa',
  '#fbbf24',
  '#fb7185',
  '#22d3ee',
  '#f97316',
];

const DEFAULT_PAYMENT_MONTHS = 12;

/* ==========================================================================
   FORMATTERS
   ========================================================================== */

const currency = (
  value,
) =>
  CURRENCY_FORMATTER.format(
    Number(value) || 0,
  );

const number = (
  value,
) =>
  NUMBER_FORMATTER.format(
    Number(value) || 0,
  );

const compactCurrency = (
  value,
) => {
  const amount =
    Number(value) || 0;

  const absolute =
    Math.abs(amount);

  if (
    absolute >=
    10000000
  ) {
    return `₹${(
      amount / 10000000
    ).toFixed(1)}Cr`;
  }

  if (
    absolute >=
    100000
  ) {
    return `₹${(
      amount / 100000
    ).toFixed(1)}L`;
  }

  if (
    absolute >=
    1000
  ) {
    return `₹${(
      amount / 1000
    ).toFixed(1)}K`;
  }

  return `₹${Math.round(
    amount,
  )}`;
};

const percentage = (
  value,
  digits = 1,
) => {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return '0.0%';
  }

  return `${parsed.toFixed(
    digits,
  )}%`;
};

const clamp = (
  value,
  min,
  max,
) =>
  Math.min(
    max,
    Math.max(
      min,
      Number(value) || 0,
    ),
  );

const safeNumber = (
  ...values
) => {
  for (
    const value of values
  ) {
    const parsed =
      Number(value);

    if (
      Number.isFinite(
        parsed,
      )
    ) {
      return parsed;
    }
  }

  return 0;
};

const safeString = (
  ...values
) => {
  for (
    const value of values
  ) {
    if (
      value !== null &&
      value !== undefined &&
      String(
        value,
      ).trim() !== ''
    ) {
      return String(value);
    }
  }

  return '';
};

const shorten = (
  value,
  max = 18,
) => {
  const text =
    String(value || '');

  return text.length >
    max
    ? `${text.slice(
        0,
        max - 1,
      )}…`
    : text;
};

/* ==========================================================================
   NORMALIZATION HELPERS
   ========================================================================== */

const getDebtId = (
  item,
  index,
) =>
  item?.debt_id ??
  item?.debtId ??
  item?.id ??
  `debt-${index}`;

const getDebtName = (
  item,
  index,
) =>
  safeString(
    item?.debt_name,
    item?.debtName,
    item?.name,
    item?.creditor_name,
    item?.creditorName,
    item?.creditor,
    item?.account_name,
    item?.accountName,
    `Debt ${index + 1}`,
  );

const getOriginalBalance = (
  item,
) =>
  safeNumber(
    item?.original_amount,
    item?.originalAmount,
    item?.principal_amount,
    item?.principalAmount,
    item?.original_balance,
    item?.originalBalance,
    item?.loan_amount,
    item?.loanAmount,
  );

const getCurrentBalance = (
  item,
) =>
  safeNumber(
    item?.remaining_balance,
    item?.remainingBalance,
    item?.outstanding_balance,
    item?.outstandingBalance,
    item?.current_balance,
    item?.currentBalance,
    item?.balance,
    item?.amount_remaining,
    item?.amountRemaining,
  );

const getInterestRate = (
  item,
) =>
  safeNumber(
    item?.interest_rate,
    item?.interestRate,
    item?.apr,
    item?.annual_percentage_rate,
  );

const getMinimumPayment = (
  item,
) =>
  safeNumber(
    item?.minimum_payment,
    item?.minimumPayment,
    item?.monthly_payment,
    item?.monthlyPayment,
    item?.payment,
    item?.emi,
    item?.emi_amount,
  );

const getPaidAmount = (
  item,
  original,
  current,
) => {
  const direct =
    safeNumber(
      item?.paid_amount,
      item?.paidAmount,
      item?.total_paid,
      item?.totalPaid,
    );

  if (
    direct > 0
  ) {
    return direct;
  }

  if (
    original > 0 &&
    current >= 0 &&
    current <= original
  ) {
    return (
      original -
      current
    );
  }

  return 0;
};

const getDueDate = (
  item,
) =>
  safeString(
    item?.due_date,
    item?.dueDate,
    item?.next_payment_date,
    item?.nextPaymentDate,
  );

const getTermMonths = (
  item,
) =>
  safeNumber(
    item?.term_months,
    item?.termMonths,
    item?.loan_term_months,
    item?.loanTermMonths,
    item?.duration_months,
    item?.durationMonths,
  );

const getPaymentsMade = (
  item,
) =>
  safeNumber(
    item?.payments_made,
    item?.paymentsMade,
    item?.number_of_payments,
    item?.numberOfPayments,
  );

const getPaymentsRemaining = (
  item,
) =>
  safeNumber(
    item?.payments_remaining,
    item?.paymentsRemaining,
    item?.remaining_payments,
    item?.remainingPayments,
  );

const getDebtType = (
  item,
) =>
  safeString(
    item?.debt_type,
    item?.debtType,
    item?.type,
    item?.category,
    'Debt',
  );

const getLender = (
  item,
) =>
  safeString(
    item?.lender,
    item?.lender_name,
    item?.lenderName,
    item?.creditor,
    item?.creditor_name,
    item?.creditorName,
    'Unknown lender',
  );

const getStatus = (
  item,
  balance,
  dueDate,
  progress,
) => {
  const explicit =
    safeString(
      item?.status,
      item?.debt_status,
      item?.debtStatus,
    ).toLowerCase();

  if (
    explicit ===
      'paid' ||
    explicit ===
      'paid_off' ||
    explicit ===
      'paid off'
  ) {
    return 'paid';
  }

  if (
    explicit ===
      'overdue' ||
    explicit ===
      'late'
  ) {
    return 'overdue';
  }

  if (
    balance <= 0
  ) {
    return 'paid';
  }

  if (
    dueDate
  ) {
    const parsed =
      new Date(
        dueDate,
      );

    if (
      !Number.isNaN(
        parsed.getTime(),
      ) &&
      parsed.getTime() <
        Date.now()
    ) {
      return 'overdue';
    }
  }

  if (
    progress >=
    80
  ) {
    return 'healthy';
  }

  if (
    progress >=
    45
  ) {
    return 'attention';
  }

  return 'critical';
};

const normalizeDebt = (
  item,
  index,
) => {
  const original =
    getOriginalBalance(
      item,
    );

  const balance =
    getCurrentBalance(
      item,
    );

  const paid =
    getPaidAmount(
      item,
      original,
      balance,
    );

  const interest =
    getInterestRate(
      item,
    );

  const payment =
    getMinimumPayment(
      item,
    );

  const progress =
    original > 0
      ? clamp(
          (paid /
            original) *
            100,
          0,
          100,
        )
      : balance <= 0
      ? 100
      : 0;

  const dueDate =
    getDueDate(item);

  const status =
    getStatus(
      item,
      balance,
      dueDate,
      progress,
    );

  const termMonths =
    getTermMonths(item);

  const paymentsMade =
    getPaymentsMade(item);

  const explicitRemaining =
    getPaymentsRemaining(
      item,
    );

  const paymentsRemaining =
    explicitRemaining >
    0
      ? explicitRemaining
      : termMonths >
        paymentsMade
      ? termMonths -
        paymentsMade
      : 0;

  return {
    ...item,

    id: getDebtId(
      item,
      index,
    ),

    name: getDebtName(
      item,
      index,
    ),

    lender:
      getLender(item),

    type:
      getDebtType(item),

    original,

    balance,

    paid,

    interest,

    payment,

    progress,

    dueDate,

    termMonths,

    paymentsMade,

    paymentsRemaining,

    status,

    minimumPayment:
      payment,

    monthlyInterest:
      balance *
      (interest / 100) /
      12,
  };
};

const normalizeDebts = (
  data,
) =>
  Array.isArray(data)
    ? data.map(
        normalizeDebt,
      )
    : [];

/* ==========================================================================
   CALCULATIONS
   ========================================================================== */

const calculateMonthlyInterest = (
  balance,
  rate,
) =>
  Math.max(
    0,
    (Number(balance) || 0) *
      ((Number(rate) ||
        0) /
        100) /
      12,
  );

const calculateAnnualInterest = (
  balance,
  rate,
) =>
  Math.max(
    0,
    (Number(balance) || 0) *
      ((Number(rate) ||
        0) /
        100),
  );

const calculateDebtFreeMonths = (
  balance,
  payment,
  rate,
) => {
  const principal =
    Number(balance) || 0;

  const monthlyPayment =
    Number(payment) || 0;

  const annualRate =
    Number(rate) || 0;

  if (
    principal <= 0
  ) {
    return 0;
  }

  if (
    monthlyPayment <=
    0
  ) {
    return null;
  }

  const monthlyRate =
    annualRate /
    100 /
    12;

  if (
    monthlyRate <= 0
  ) {
    return Math.ceil(
      principal /
        monthlyPayment,
    );
  }

  if (
    monthlyPayment <=
    principal *
      monthlyRate
  ) {
    return null;
  }

  const months =
    -Math.log(
      1 -
        (principal *
          monthlyRate) /
          monthlyPayment,
    ) /
    Math.log(
      1 +
        monthlyRate,
    );

  return Number.isFinite(
    months,
  )
    ? Math.ceil(
        months,
      )
    : null;
};

const calculateTotalInterest = (
  balance,
  payment,
  rate,
) => {
  const months =
    calculateDebtFreeMonths(
      balance,
      payment,
      rate,
    );

  if (
    months === null
  ) {
    return null;
  }

  const total =
    months *
    (Number(payment) || 0);

  return Math.max(
    0,
    total -
      (Number(balance) || 0),
  );
};

const calculateStatusCounts = (
  debts,
) => ({
  healthy:
    debts.filter(
      (item) =>
        item.status ===
        'healthy',
    ).length,

  attention:
    debts.filter(
      (item) =>
        item.status ===
        'attention',
    ).length,

  critical:
    debts.filter(
      (item) =>
        item.status ===
        'critical',
    ).length,

  overdue:
    debts.filter(
      (item) =>
        item.status ===
        'overdue',
    ).length,

  paid:
    debts.filter(
      (item) =>
        item.status ===
        'paid',
    ).length,
});

/* ==========================================================================
   CSV EXPORT
   ========================================================================== */

const exportDebtsToCsv = (
  debts,
) => {
  if (
    !debts.length
  ) {
    return;
  }

  const headers = [
    'Debt',
    'Lender',
    'Type',
    'Original Balance',
    'Outstanding Balance',
    'Paid Amount',
    'Interest Rate',
    'Monthly Payment',
    'Payoff Progress',
    'Status',
    'Due Date',
  ];

  const rows =
    debts.map(
      (item) => [
        item.name,
        item.lender,
        item.type,
        item.original,
        item.balance,
        item.paid,
        item.interest,
        item.payment,
        item.progress.toFixed(
          2,
        ),
        STATUS[
          item.status
        ]?.label ||
          item.status,
        item.dueDate,
      ],
    );

  const csv = [
    headers,
    ...rows,
  ]
    .map(
      (row) =>
        row
          .map(
            (value) =>
              `"${String(
                value ??
                  '',
              ).replaceAll(
                '"',
                '""',
              )}"`,
          )
          .join(','),
    )
    .join('\n');

  const blob =
    new Blob(
      [csv],
      {
        type:
          'text/csv;charset=utf-8;',
      },
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      'a',
    );

  anchor.href = url;

  anchor.download =
    'finsight-debt-overview.csv';

  anchor.click();

  URL.revokeObjectURL(
    url,
  );
};

/* ==========================================================================
   ANIMATED NUMBER
   ========================================================================== */

function AnimatedNumber({
  value,
  formatter = currency,
  duration = 650,
}) {
  const [
    display,
    setDisplay,
  ] = useState(0);

  const previous =
    useRef(0);

  useEffect(() => {
    const target =
      Number(value) || 0;

    const start =
      Number(
        previous.current,
      ) || 0;

    const started =
      performance.now();

    let frame;

    const animate = (
      now,
    ) => {
      const progress =
        clamp(
          (now - started) /
            duration,
          0,
          1,
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      const next =
        start +
        (target - start) *
          eased;

      setDisplay(next);

      if (
        progress <
        1
      ) {
        frame =
          requestAnimationFrame(
            animate,
          );
      } else {
        previous.current =
          target;
      }
    };

    frame =
      requestAnimationFrame(
        animate,
      );

    return () => {
      if (frame) {
        cancelAnimationFrame(
          frame,
        );
      }
    };
  }, [
    value,
    duration,
  ]);

  return formatter(
    display,
  );
}

/* ==========================================================================
   STATUS BADGE
   ========================================================================== */

function DebtStatusBadge({
  status,
}) {
  const config =
    STATUS[
      status
    ] ||
    STATUS.healthy;

  const Icon =
    config.icon;

  return (
    <span
      className="do-status-badge"
      style={{
        color:
          config.color,
        borderColor:
          config.border,
        background:
          config.soft,
      }}
    >
      <Icon
        size={10}
      />

      {config.label}
    </span>
  );
}

/* ==========================================================================
   PROGRESS RING
   ========================================================================== */

function DebtProgressRing({
  value,
  color = '#60a5fa',
  size = 86,
  stroke = 7,
}) {
  const radius =
    (size - stroke) /
    2;

  const circumference =
    2 *
    Math.PI *
    radius;

  const progress =
    clamp(
      value,
      0,
      100,
    );

  const offset =
    circumference -
    (progress /
      100) *
      circumference;

  return (
    <div
      className="do-progress-ring"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={
            size / 2
          }
          cy={
            size / 2
          }
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,.08)"
          strokeWidth={
            stroke
          }
        />

        <circle
          cx={
            size / 2
          }
          cy={
            size / 2
          }
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={
            stroke
          }
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            offset
          }
          transform={`rotate(-90 ${
            size / 2
          } ${
            size / 2
          })`}
        />
      </svg>

      <div className="do-ring-center">
        <strong>
          {Math.round(
            progress,
          )}
          %
        </strong>

        <span>
          paid
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   KPI CARD
   ========================================================================== */

function DebtKpi({
  icon: Icon,
  label,
  value,
  secondary,
  tone = 'blue',
  hidden = false,
  trend,
}) {
  const trendValue =
    Number(trend);

  const hasTrend =
    Number.isFinite(
      trendValue,
    );

  return (
    <div
      className={`do-kpi do-kpi-${tone}`}
    >
      <div className="do-kpi-top">
        <div className="do-kpi-icon">
          <Icon
            size={16}
          />
        </div>

        {hasTrend && (
          <div className="do-kpi-trend">
            {trendValue >=
            0 ? (
              <ArrowUpRight
                size={10}
              />
            ) : (
              <ArrowDownRight
                size={10}
              />
            )}

            {Math.abs(
              trendValue,
            ).toFixed(1)}
            %
          </div>
        )}
      </div>

      <div className="do-kpi-label">
        {label}
      </div>

      <div className="do-kpi-value">
        {hidden ? (
          <span className="do-hidden">
            •••••••
          </span>
        ) : (
          value
        )}
      </div>

      <div className="do-kpi-secondary">
        {secondary}
      </div>
    </div>
  );
}

/* ==========================================================================
   DEBT CARD
   ========================================================================== */

function DebtCard({
  debt,
  hiddenAmounts,
  selected,
  onSelect,
  onOpen,
}) {
  const config =
    STATUS[
      debt.status
    ] ||
    STATUS.healthy;

  const color =
    config.color;

  return (
    <article
      className={`do-debt-card ${
        selected
          ? 'do-debt-selected'
          : ''
      }`}
      style={{
        '--debt-color':
          color,
        '--debt-soft':
          config.soft,
        '--debt-border':
          config.border,
      }}
    >
      <div className="do-debt-glow" />

      <div className="do-debt-header">

        <div className="do-debt-title-wrap">

          <button
            type="button"
            className="do-select-box"
            onClick={() =>
              onSelect?.(
                debt,
              )
            }
          >
            {selected && (
              <Check
                size={10}
              />
            )}
          </button>

          <div className="do-debt-title-area">

            <div className="do-debt-title">
              <span className="do-debt-dot" />

              <span>
                {shorten(
                  debt.name,
                  25,
                )}
              </span>
            </div>

            <div className="do-debt-lender">
              {debt.lender}
            </div>

          </div>
        </div>

        <DebtStatusBadge
          status={
            debt.status
          }
        />

      </div>

      <div className="do-debt-middle">

        <div className="do-balance-block">

          <span>
            Outstanding
          </span>

          <strong>
            {hiddenAmounts
              ? '••••••'
              : currency(
                  debt.balance,
                )}
          </strong>

          <small>
            {hiddenAmounts
              ? '••••'
              : `${percentage(
                  debt.interest,
                  2,
                )} APR`}
          </small>

        </div>

        <DebtProgressRing
          value={
            debt.progress
          }
          color={
            color
          }
          size={82}
          stroke={7}
        />

      </div>

      <div className="do-debt-metrics">

        <div>
          <span>
            Monthly payment
          </span>

          <strong>
            {hiddenAmounts
              ? '••••••'
              : currency(
                  debt.payment,
                )}
          </strong>
        </div>

        <div>
          <span>
            Paid
          </span>

          <strong>
            {hiddenAmounts
              ? '••••••'
              : currency(
                  debt.paid,
                )}
          </strong>
        </div>

        <div>
          <span>
            Due
          </span>

          <strong>
            {debt.dueDate ||
              '—'}
          </strong>
        </div>

      </div>

      <div className="do-debt-progress">

        <div className="do-debt-progress-track">

          <div
            className="do-debt-progress-fill"
            style={{
              width:`${clamp(
                debt.progress,
                0,
                100,
              )}%`,
              background:
                color,
            }}
          />

        </div>

        <div className="do-debt-progress-label">
          <span>
            {percentage(
              debt.progress,
            )}{' '}
            repaid
          </span>

          <span>
            {debt.paymentsRemaining >
            0
              ? `${number(
                  debt.paymentsRemaining,
                )} payments left`
              : 'Final payment'}
          </span>
        </div>

      </div>

      <div className="do-debt-footer">

        <div className="do-interest-chip">

          <Percent
            size={10}
          />

          <span>
            {percentage(
              debt.interest,
              2,
            )}{' '}
            interest
          </span>

        </div>

        <button
          type="button"
          className="do-details-button"
          onClick={() =>
            onOpen?.(
              debt,
            )
          }
        >
          View details

          <ArrowRight
            size={11}
          />
        </button>

      </div>

    </article>
  );
}

/* ==========================================================================
   DEBT TRAJECTORY CHART
   ========================================================================== */

function DebtTrajectoryChart({
  debts,
  hiddenAmounts,
}) {
  const chartData =
    useMemo(() => {
      const active =
        debts.filter(
          (item) =>
            item.balance >
            0,
        );

      if (
        !active.length
      ) {
        return [];
      }

      const months = 12;

      return Array.from(
        {
          length:
            months + 1,
        },
        (
          _,
          index,
        ) => {
          const month =
            index;

          const total =
            active.reduce(
              (
                sum,
                debt,
              ) => {
                const monthly =
                  debt.payment >
                  0
                    ? debt.payment
                    : 0;

                const rate =
                  debt.interest /
                  100 /
                  12;

                let balance =
                  debt.balance;

                if (
                  rate >
                    0 &&
                  monthly >
                    0
                ) {
                  for (
                    let i = 0;
                    i <
                      month;
                    i += 1
                  ) {
                    balance =
                      Math.max(
                        0,
                        balance *
                          (1 +
                            rate) -
                          monthly,
                      );
                  }
                } else {
                  balance =
                    Math.max(
                      0,
                      balance -
                        monthly *
                          month,
                    );
                }

                return (
                  sum +
                  balance
                );
              },
              0,
            );

          const date =
            new Date();

          date.setMonth(
            date.getMonth() +
              month,
          );

          return {
            month:
              month === 0
                ? 'Now'
                : date.toLocaleDateString(
                    'en-IN',
                    {
                      month:
                        'short',
                    },
                  ),

            balance:
              total,
          };
        },
      );
    }, [debts]);

  if (
    !chartData.length
  ) {
    return (
      <div className="do-chart-empty">
        <TrendingDown
          size={21}
        />

        <span>
          No active debt trajectory
        </span>
      </div>
    );
  }

  return (
    <div className="do-trajectory-chart">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={
            chartData
          }
          margin={{
            top:10,
            right:12,
            left:0,
            bottom:0,
          }}
        >
          <defs>

            <linearGradient
              id="debtTrajectoryFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#60a5fa"
                stopOpacity=".25"
              />

              <stop
                offset="100%"
                stopColor="#60a5fa"
                stopOpacity="0"
              />
            </linearGradient>

          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(148,163,184,.055)"
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fill:'#475569',
              fontSize:8,
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill:'#475569',
              fontSize:8,
            }}
            tickFormatter={
              compactCurrency
            }
            width={45}
          />

          <Tooltip
            cursor={{
              stroke:
                'rgba(96,165,250,.25)',
            }}
            content={({
              active,
              payload,
              label,
            }) => {
              if (
                !active ||
                !payload?.length
              ) {
                return null;
              }

              return (
                <div className="do-chart-tooltip">

                  <strong>
                    {label}
                  </strong>

                  <div>
                    <span>
                      Projected balance
                    </span>

                    <b>
                      {hiddenAmounts
                        ? '••••••'
                        : currency(
                            payload[0]
                              ?.value,
                          )}
                    </b>
                  </div>

                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke="#60a5fa"
            strokeWidth={2}
            fill="url(#debtTrajectoryFill)"
            dot={false}
            activeDot={{
              r:4,
              fill:'#60a5fa',
              stroke:'#0f172a',
              strokeWidth:2,
            }}
          />

        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}

/* ==========================================================================
   DEBT DISTRIBUTION
   ========================================================================== */

function DebtDistribution({
  debts,
  hiddenAmounts,
}) {
  const data =
    useMemo(
      () =>
        debts
          .filter(
            (item) =>
              item.balance >
              0,
          )
          .sort(
            (a, b) =>
              b.balance -
              a.balance,
          )
          .slice(0, 7)
          .map(
            (item) => ({
              name:
                item.name,
              value:
                item.balance,
            }),
          ),
      [debts],
    );

  const total =
    data.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        item.value,
      0,
    );

  if (
    !data.length
  ) {
    return (
      <div className="do-chart-empty">
        <PieChart
          size={21}
        />

        <span>
          No outstanding debt
        </span>
      </div>
    );
  }

  return (
    <div className="do-distribution-layout">

      <div className="do-donut-wrap">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <RechartsPieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="87%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map(
                (
                  item,
                  index,
                ) => (
                  <Cell
                    key={
                      item.name
                    }
                    fill={
                      CHART_COLORS[
                        index %
                          CHART_COLORS.length
                      ]
                    }
                  />
                ),
              )}
            </Pie>

            <Tooltip
              content={({
                active,
                payload,
              }) => {
                if (
                  !active ||
                  !payload?.length
                ) {
                  return null;
                }

                return (
                  <div className="do-chart-tooltip">

                    <strong>
                      {
                        payload[0]
                          ?.name
                      }
                    </strong>

                    <div>
                      <span>
                        Balance
                      </span>

                      <b>
                        {hiddenAmounts
                          ? '••••••'
                          : currency(
                              payload[0]
                                ?.value,
                            )}
                      </b>
                    </div>

                    <div>
                      <span>
                        Share
                      </span>

                      <b>
                        {total >
                        0
                          ? percentage(
                              (payload[0]
                                ?.value /
                                total) *
                                100,
                            )
                          : '0%'}
                      </b>
                    </div>

                  </div>
                );
              }}
            />

          </RechartsPieChart>
        </ResponsiveContainer>

        <div className="do-donut-center">

          <span>
            Outstanding
          </span>

          <strong>
            {hiddenAmounts
              ? '••••'
              : compactCurrency(
                  total,
                )}
          </strong>

        </div>

      </div>

      <div className="do-distribution-list">

        {data.map(
          (
            item,
            index,
          ) => (
            <div
              className="do-distribution-item"
              key={
                item.name
              }
            >

              <div className="do-distribution-name">

                <span
                  style={{
                    background:
                      CHART_COLORS[
                        index %
                          CHART_COLORS.length
                      ],
                  }}
                />

                <span>
                  {shorten(
                    item.name,
                    17,
                  )}
                </span>

              </div>

              <strong>
                {total >
                0
                  ? percentage(
                      (item.value /
                        total) *
                        100,
                    )
                  : '0%'}
              </strong>

            </div>
          ),
        )}

      </div>

    </div>
  );
}

/* ==========================================================================
   DEBT DETAIL MODAL
   ========================================================================== */

function DebtDetailModal({
  debt,
  hiddenAmounts,
  onClose,
}) {
  if (
    !debt
  ) {
    return null;
  }

  const config =
    STATUS[
      debt.status
    ] ||
    STATUS.healthy;

  const Icon =
    config.icon;

  const months =
    calculateDebtFreeMonths(
      debt.balance,
      debt.payment,
      debt.interest,
    );

  const totalInterest =
    calculateTotalInterest(
      debt.balance,
      debt.payment,
      debt.interest,
    );

  const monthlyInterest =
    calculateMonthlyInterest(
      debt.balance,
      debt.interest,
    );

  const annualInterest =
    calculateAnnualInterest(
      debt.balance,
      debt.interest,
    );

  return (
    <div
      className="do-modal-backdrop"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="do-modal">

        <div className="do-modal-header">

          <div>

            <div className="do-modal-eyebrow">
              Debt intelligence
            </div>

            <h3>
              {debt.name}
            </h3>

            <p>
              Detailed repayment and
              financial risk analysis
            </p>

          </div>

          <button
            type="button"
            className="do-icon-button"
            onClick={
              onClose
            }
          >
            <X
              size={16}
            />
          </button>

        </div>

        <div
          className="do-modal-status"
          style={{
            color:
              config.color,
            background:
              config.soft,
            borderColor:
              config.border,
          }}
        >

          <Icon
            size={15}
          />

          <div>

            <strong>
              {config.label}
            </strong>

            <span>
              {debt.lender}
              {' · '}
              {debt.type}
            </span>

          </div>

        </div>

        <div className="do-modal-summary">

          <div className="do-modal-main-progress">

            <DebtProgressRing
              value={
                debt.progress
              }
              color={
                config.color
              }
              size={122}
              stroke={9}
            />

            <div>

              <span>
                Repayment progress
              </span>

              <strong>
                {percentage(
                  debt.progress,
                )}
              </strong>

              <small>
                {hiddenAmounts
                  ? '••••••'
                  : `${currency(
                      debt.paid,
                    )} repaid of ${currency(
                      debt.original,
                    )}`}
              </small>

            </div>

          </div>

          <div className="do-modal-stat">

            <span>
              Outstanding
            </span>

            <strong>
              {hiddenAmounts
                ? '••••••'
                : currency(
                    debt.balance,
                  )}
            </strong>

            <small>
              Current principal
            </small>

          </div>

          <div className="do-modal-stat">

            <span>
              Monthly payment
            </span>

            <strong>
              {hiddenAmounts
                ? '••••••'
                : currency(
                    debt.payment,
                  )}
            </strong>

            <small>
              Minimum scheduled payment
            </small>

          </div>

        </div>

        <div className="do-modal-section">

          <div className="do-modal-section-title">

            <Gauge
              size={13}
            />

            Repayment intelligence

          </div>

          <div className="do-modal-grid">

            <div className="do-modal-mini-card">

              <span>
                Interest rate
              </span>

              <strong>
                {percentage(
                  debt.interest,
                  2,
                )}
              </strong>

            </div>

            <div className="do-modal-mini-card">

              <span>
                Monthly interest
              </span>

              <strong>
                {hiddenAmounts
                  ? '••••••'
                  : currency(
                      monthlyInterest,
                    )}
              </strong>

            </div>

            <div className="do-modal-mini-card">

              <span>
                Annual interest
              </span>

              <strong>
                {hiddenAmounts
                  ? '••••••'
                  : currency(
                      annualInterest,
                    )}
              </strong>

            </div>

            <div className="do-modal-mini-card">

              <span>
                Payments left
              </span>

              <strong>
                {debt.paymentsRemaining >
                0
                  ? number(
                      debt.paymentsRemaining,
                    )
                  : months
                  ? number(
                      months,
                    )
                  : '—'}
              </strong>

            </div>

          </div>

        </div>

        <div className="do-modal-section">

          <div className="do-modal-section-title">

            <TrendingDown
              size={13}
            />

            Estimated payoff

          </div>

          <div className="do-payoff-box">

            <div>

              <span>
                Estimated time remaining
              </span>

              <strong>
                {months ===
                null
                  ? 'Payment too low'
                  : months ===
                    0
                  ? 'Paid off'
                  : `${months} months`}
              </strong>

            </div>

            <div>

              <span>
                Estimated future interest
              </span>

              <strong>
                {hiddenAmounts
                  ? '••••••'
                  : totalInterest ===
                    null
                  ? 'Unable to calculate'
                  : currency(
                      totalInterest,
                    )}
              </strong>

            </div>

          </div>

        </div>

        <div className="do-modal-warning">

          <Info
            size={14}
          />

          <div>

            <strong>
              Calculation note
            </strong>

            <span>
              Payoff projections are
              estimates based on the
              current outstanding balance,
              interest rate, and payment.
              Actual lender schedules may
              differ.
            </span>

          </div>

        </div>

      </div>
    </div>
  );
}

/* ==========================================================================
   LOADING
   ========================================================================== */

function DebtLoading() {
  return (
    <div className="do-loading">

      <div className="do-loading-kpis">

        {Array.from({
          length:4,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              className="do-loading-card"
              key={
                index
              }
            >

              <div className="do-skeleton do-sk-icon" />

              <div className="do-skeleton do-sk-label" />

              <div className="do-skeleton do-sk-value" />

              <div className="do-skeleton do-sk-line" />

            </div>
          ),
        )}

      </div>

      <div className="do-loading-main">

        <div className="do-skeleton do-sk-heading" />

        <div className="do-skeleton do-sk-chart" />

        <div className="do-loading-grid">

          {Array.from({
            length:4,
          }).map(
            (
              _,
              index,
            ) => (
              <div
                className="do-loading-debt"
                key={
                  index
                }
              >

                <div className="do-skeleton do-sk-line" />

                <div className="do-skeleton do-sk-big" />

                <div className="do-skeleton do-sk-progress" />

                <div className="do-skeleton do-sk-line" />

              </div>
            ),
          )}

        </div>

      </div>

    </div>
  );
}

/* ==========================================================================
   ERROR
   ========================================================================== */

function DebtError({
  message,
  onRetry,
}) {
  return (
    <div className="do-error">

      <div className="do-error-icon">
        <AlertOctagon
          size={22}
        />
      </div>

      <h3>
        Debt intelligence unavailable
      </h3>

      <p>
        {message ||
          'FinSight could not load the debt portfolio data.'}
      </p>

      {onRetry && (
        <button
          type="button"
          className="do-retry"
          onClick={
            onRetry
          }
        >
          <RefreshCw
            size={13}
          />

          Retry request
        </button>
      )}

    </div>
  );
}

/* ==========================================================================
   EMPTY
   ========================================================================== */

function DebtEmpty({
  onCreate,
}) {
  return (
    <div className="do-empty">

      <div className="do-empty-orbit">

        <div className="do-empty-core">
          <Shield
            size={28}
          />
        </div>

      </div>

      <h3>
        No debt accounts found
      </h3>

      <p>
        Add your liabilities to FinSight
        to unlock repayment intelligence,
        interest analysis, debt-free
        projections, and portfolio risk
        monitoring.
      </p>

      {onCreate && (
        <button
          type="button"
          className="do-primary-button"
          onClick={
            onCreate
          }
        >
          <Plus
            size={14}
          />

          Add debt
        </button>
      )}

    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function DebtOverview({
  debts = [],
  data,
  summary,
  loading = false,
  error = false,
  errorMessage,
  title = 'Debt Overview',
  subtitle =
    'Repayment intelligence, liability risk, interest exposure, and debt-free projections',
  onRefresh,
  onCreate,
  onDebtClick,
  onViewAll,
  className = '',
}) {
  const [
    activeFilter,
    setActiveFilter,
  ] = useState(
    'all',
  );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    sortBy,
    setSortBy,
  ] = useState(
    'balance',
  );

  const [
    sortDirection,
    setSortDirection,
  ] = useState(
    'desc',
  );

  const [
    sortOpen,
    setSortOpen,
  ] = useState(false);

  const [
    selected,
    setSelected,
  ] = useState([]);

  const [
    activeDebt,
    setActiveDebt,
  ] = useState(null);

  const [
    hiddenAmounts,
    setHiddenAmounts,
  ] = useState(false);

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    showAnalytics,
    setShowAnalytics,
  ] = useState(true);

  const [
    showCards,
    setShowCards,
  ] = useState(true);

  const [
    viewMode,
    setViewMode,
  ] = useState(
    'grid',
  );

  const [
    period,
    setPeriod,
  ] = useState(
    'Current',
  );

  const rootRef =
    useRef(null);

  const source =
    data || debts;

  const normalized =
    useMemo(
      () =>
        normalizeDebts(
          source,
        ),
      [source],
    );

  const totals =
    useMemo(() => {
      const totalOriginal =
        normalized.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.original,
          0,
        );

      const totalBalance =
        normalized.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.balance,
          0,
        );

      const totalPaid =
        normalized.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.paid,
          0,
        );

      const totalPayment =
        normalized.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.payment,
          0,
        );

      const totalInterest =
        normalized.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            calculateMonthlyInterest(
              item.balance,
              item.interest,
            ),
          0,
        );

      const weightedRate =
        totalBalance >
        0
          ? normalized.reduce(
              (
                sum,
                item,
              ) =>
                sum +
                item.balance *
                  item.interest,
              0,
            ) /
            totalBalance
          : 0;

      const progress =
        totalOriginal >
        0
          ? clamp(
              (totalPaid /
                totalOriginal) *
                100,
              0,
              100,
            )
          : 0;

      const counts =
        calculateStatusCounts(
          normalized,
        );

      return {
        totalOriginal,
        totalBalance,
        totalPaid,
        totalPayment,
        totalInterest,
        weightedRate,
        progress,
        count:
          normalized.length,
        activeCount:
          normalized.filter(
            (item) =>
              item.balance >
              0,
          ).length,
        ...counts,
      };
    }, [normalized]);

  const filtered =
    useMemo(() => {
      let result =
        normalized.slice();

      if (
        activeFilter !==
        'all'
      ) {
        result =
          result.filter(
            (item) =>
              item.status ===
              activeFilter,
          );
      }

      const query =
        search
          .trim()
          .toLowerCase();

      if (query) {
        result =
          result.filter(
            (item) =>
              item.name
                .toLowerCase()
                .includes(
                  query,
                ) ||
              item.lender
                .toLowerCase()
                .includes(
                  query,
                ) ||
              item.type
                .toLowerCase()
                .includes(
                  query,
                ),
          );
      }

      result.sort(
        (
          first,
          second,
        ) => {
          let difference =
            0;

          if (
            sortBy ===
            'balance'
          ) {
            difference =
              first.balance -
              second.balance;
          }

          if (
            sortBy ===
            'interest'
          ) {
            difference =
              first.interest -
              second.interest;
          }

          if (
            sortBy ===
            'payment'
          ) {
            difference =
              first.payment -
              second.payment;
          }

          if (
            sortBy ===
            'progress'
          ) {
            difference =
              first.progress -
              second.progress;
          }

          if (
            sortBy ===
            'name'
          ) {
            difference =
              first.name.localeCompare(
                second.name,
              );
          }

          return sortDirection ===
            'asc'
            ? difference
            : -difference;
        },
      );

      return result;
    }, [
      normalized,
      activeFilter,
      search,
      sortBy,
      sortDirection,
    ]);

  const selectedSet =
    useMemo(
      () =>
        new Set(
          selected,
        ),
      [selected],
    );

  const highestInterestDebt =
    useMemo(
      () =>
        normalized.reduce(
          (
            best,
            item,
          ) =>
            item.interest >
            best.interest
              ? item
              : best,
          {
            interest:0,
            name:'—',
          },
        ),
      [normalized],
    );

  const largestDebt =
    useMemo(
      () =>
        normalized.reduce(
          (
            best,
            item,
          ) =>
            item.balance >
            best.balance
              ? item
              : best,
          {
            balance:0,
            name:'—',
          },
        ),
      [normalized],
    );

  const largestPayment =
    useMemo(
      () =>
        normalized.reduce(
          (
            best,
            item,
          ) =>
            item.payment >
            best.payment
              ? item
              : best,
          {
            payment:0,
            name:'—',
          },
        ),
      [normalized],
    );

  const debtFreeProjection =
    useMemo(() => {
      const active =
        normalized.filter(
          (item) =>
            item.balance >
              0 &&
            item.payment >
              0,
        );

      if (
        !active.length
      ) {
        return null;
      }

      return Math.max(
        ...active.map(
          (item) =>
            calculateDebtFreeMonths(
              item.balance,
              item.payment,
              item.interest,
            ) ||
            DEFAULT_PAYMENT_MONTHS,
        ),
      );
    }, [normalized]);

  const estimatedFutureInterest =
    useMemo(() => {
      return normalized.reduce(
        (
          sum,
          item,
        ) => {
          const value =
            calculateTotalInterest(
              item.balance,
              item.payment,
              item.interest,
            );

          return (
            sum +
            (value ||
              0)
          );
        },
        0,
      );
    }, [normalized]);

  const riskScore =
    useMemo(() => {
      if (
        !normalized.length
      ) {
        return 0;
      }

      const balanceRisk =
        clamp(
          totals.totalBalance /
            Math.max(
              totals.totalOriginal,
              1,
            ) *
            100,
          0,
          100,
        );

      const rateRisk =
        clamp(
          totals.weightedRate *
            5,
          0,
          100,
        );

      const statusRisk =
        clamp(
          (totals.critical *
            18 +
            totals.overdue *
              28 +
            totals.attention *
              7) /
            Math.max(
              normalized.length,
              1,
            ),
          0,
          100,
        );

      return Math.round(
        balanceRisk *
          0.35 +
          rateRisk *
            0.25 +
          statusRisk *
            0.4,
      );
    }, [
      normalized,
      totals,
    ]);

  const handleSelect =
    useCallback(
      (debt) => {
        setSelected(
          (
            current,
          ) => {
            if (
              current.includes(
                debt.id,
              )
            ) {
              return current.filter(
                (
                  id,
                ) =>
                  id !==
                  debt.id,
              );
            }

            return [
              ...current,
              debt.id,
            ];
          },
        );
      },
      [],
    );

  const handleSelectAll =
    useCallback(() => {
      if (
        selected.length ===
        filtered.length
      ) {
        setSelected(
          [],
        );

        return;
      }

      setSelected(
        filtered.map(
          (item) =>
            item.id,
        ),
      );
    }, [
      selected.length,
      filtered,
    ]);

  const handleExport =
    useCallback(() => {
      exportDebtsToCsv(
        filtered,
      );

      setMenuOpen(
        false,
      );
    }, [filtered]);

  const handleFullscreen =
    useCallback(
      async () => {
        try {
          if (
            !document.fullscreenElement
          ) {
            await rootRef.current?.requestFullscreen?.();
          } else {
            await document.exitFullscreen?.();
          }
        } catch {
          // Fullscreen is optional.
        }
      },
      [],
    );

  return (
    <section
      ref={rootRef}
      className={[
        'do-shell',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <style>{`

        /* ================================================================
           ROOT
        ================================================================ */

        .do-shell {
          --do-blue:#60a5fa;
          --do-cyan:#22d3ee;
          --do-green:#34d399;
          --do-yellow:#fbbf24;
          --do-orange:#fb923c;
          --do-red:#fb7185;
          --do-purple:#a78bfa;

          position:relative;
          overflow:hidden;

          border:1px solid rgba(148,163,184,.13);
          border-radius:30px;

          color:#e2e8f0;

          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(96,165,250,.085),
              transparent 30%
            ),
            radial-gradient(
              circle at 0% 100%,
              rgba(251,113,133,.035),
              transparent 26%
            ),
            linear-gradient(
              145deg,
              rgba(15,23,42,.98),
              rgba(15,23,42,.79)
            );

          box-shadow:
            0 35px 110px rgba(0,0,0,.2),
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        .do-shell::before {
          content:"";

          position:absolute;
          z-index:0;

          top:0;
          left:8%;
          right:8%;

          height:1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(96,165,250,.65),
              rgba(34,211,238,.35),
              rgba(167,139,250,.35),
              transparent
            );

          pointer-events:none;
        }

        .do-shell::after {
          content:"";

          position:absolute;
          z-index:0;

          width:420px;
          height:420px;

          top:-280px;
          right:-170px;

          border-radius:50%;

          background:
            radial-gradient(
              circle,
              rgba(96,165,250,.07),
              transparent 68%
            );

          filter:blur(10px);

          pointer-events:none;
        }

        .do-content {
          position:relative;
          z-index:1;

          padding:25px;
        }

        /* ================================================================
           HEADER
        ================================================================ */

        .do-header {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;

          gap:20px;

          margin-bottom:19px;
        }

        .do-heading {
          display:flex;
          align-items:flex-start;

          gap:15px;

          min-width:0;
        }

        .do-heading-icon {
          position:relative;

          width:51px;
          height:51px;

          flex:0 0 51px;

          display:grid;
          place-items:center;

          border:1px solid rgba(96,165,250,.18);
          border-radius:16px;

          color:var(--do-blue);

          background:
            linear-gradient(
              145deg,
              rgba(96,165,250,.14),
              rgba(167,139,250,.045)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.045),
            0 12px 35px rgba(37,99,235,.08);
        }

        .do-heading-icon::before {
          content:"";

          position:absolute;
          inset:-5px;

          border:1px solid rgba(96,165,250,.05);
          border-radius:20px;
        }

        .do-heading-pulse {
          position:absolute;

          right:6px;
          top:6px;

          width:6px;
          height:6px;

          border-radius:50%;

          background:#34d399;

          box-shadow:
            0 0 0 4px rgba(52,211,153,.08);

          animation:do-pulse 2.2s infinite;
        }

        .do-eyebrow {
          display:flex;
          align-items:center;

          gap:7px;

          margin-bottom:4px;

          color:#64748b;

          font-size:8px;
          font-weight:850;

          letter-spacing:.13em;
          text-transform:uppercase;
        }

        .do-live-dot {
          width:5px;
          height:5px;

          border-radius:50%;

          background:#34d399;
        }

        .do-title {
          margin:0;

          color:#f8fafc;

          font-size:clamp(
            19px,
            2vw,
            24px
          );

          line-height:1.15;

          font-weight:900;

          letter-spacing:-.045em;
        }

        .do-subtitle {
          max-width:710px;

          margin:6px 0 0;

          color:#64748b;

          font-size:10px;
          line-height:1.55;
        }

        .do-header-actions {
          display:flex;
          align-items:center;
          justify-content:flex-end;

          gap:7px;

          flex-wrap:wrap;
        }

        .do-period {
          height:37px;

          display:flex;
          align-items:center;

          gap:7px;

          padding:0 10px;

          border:1px solid rgba(148,163,184,.12);
          border-radius:10px;

          color:#64748b;

          background:rgba(15,23,42,.72);
        }

        .do-period select {
          min-width:74px;

          border:0;
          outline:0;

          color:#cbd5e1;
          background:transparent;

          font-size:9px;
          font-weight:750;

          appearance:none;

          cursor:pointer;
        }

        .do-period select option {
          color:#cbd5e1;
          background:#0f172a;
        }

        .do-primary-button {
          height:37px;

          display:inline-flex;
          align-items:center;
          justify-content:center;

          gap:7px;

          padding:0 12px;

          border:1px solid rgba(96,165,250,.2);
          border-radius:10px;

          color:#eff6ff;

          background:
            linear-gradient(
              135deg,
              rgba(59,130,246,.23),
              rgba(37,99,235,.1)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 8px 24px rgba(37,99,235,.08);

          font-size:9px;
          font-weight:800;

          cursor:pointer;

          transition:
            transform .15s ease,
            border-color .15s ease,
            background .15s ease;
        }

        .do-primary-button:hover {
          transform:translateY(-1px);

          border-color:rgba(96,165,250,.36);

          background:
            linear-gradient(
              135deg,
              rgba(59,130,246,.3),
              rgba(37,99,235,.15)
            );
        }

        .do-icon-button {
          width:37px;
          height:37px;

          display:grid;
          place-items:center;

          border:1px solid rgba(148,163,184,.12);
          border-radius:10px;

          color:#94a3b8;
          background:rgba(148,163,184,.028);

          cursor:pointer;

          transition:
            color .15s ease,
            border-color .15s ease,
            background .15s ease;
        }

        .do-icon-button:hover {
          color:#f8fafc;
          border-color:rgba(96,165,250,.23);
          background:rgba(96,165,250,.055);
        }

        .do-menu-wrap {
          position:relative;
        }

        .do-menu {
          position:absolute;
          z-index:80;

          top:44px;
          right:0;

          width:190px;

          padding:6px;

          border:1px solid rgba(148,163,184,.16);
          border-radius:13px;

          background:rgba(2,6,23,.98);

          box-shadow:
            0 25px 70px rgba(0,0,0,.42);

          backdrop-filter:blur(16px);
        }

        .do-menu button {
          width:100%;

          display:flex;
          align-items:center;

          gap:8px;

          padding:9px;

          border:0;
          border-radius:8px;

          color:#94a3b8;
          background:transparent;

          font-size:9px;
          font-weight:700;

          text-align:left;

          cursor:pointer;
        }

        .do-menu button:hover {
          color:#f8fafc;
          background:rgba(148,163,184,.06);
        }

        /* ================================================================
           KPI
        ================================================================ */

        .do-kpis {
          display:grid;

          grid-template-columns:
            repeat(4,minmax(0,1fr));

          gap:10px;

          margin-bottom:12px;
        }

        .do-kpi {
          position:relative;
          overflow:hidden;

          min-width:0;

          padding:15px;

          border:1px solid rgba(148,163,184,.09);
          border-radius:17px;

          background:
            linear-gradient(
              145deg,
              rgba(148,163,184,.038),
              rgba(15,23,42,.16)
            );
        }

        .do-kpi::before {
          content:"";

          position:absolute;

          top:0;
          left:18px;
          right:18px;

          height:1px;

          background:currentColor;

          opacity:.18;
        }

        .do-kpi-blue {
          color:var(--do-blue);
        }

        .do-kpi-red {
          color:var(--do-red);
        }

        .do-kpi-green {
          color:var(--do-green);
        }

        .do-kpi-yellow {
          color:var(--do-yellow);
        }

        .do-kpi-purple {
          color:var(--do-purple);
        }

        .do-kpi-top {
          display:flex;
          align-items:center;
          justify-content:space-between;

          margin-bottom:9px;
        }

        .do-kpi-icon {
          width:31px;
          height:31px;

          display:grid;
          place-items:center;

          border:1px solid currentColor;
          border-radius:9px;

          background:rgba(255,255,255,.018);
        }

        .do-kpi-trend {
          display:flex;
          align-items:center;

          gap:2px;

          color:currentColor;

          font-size:8px;
          font-weight:800;
        }

        .do-kpi-label {
          color:#64748b;

          font-size:8px;
          font-weight:800;

          letter-spacing:.075em;
          text-transform:uppercase;
        }

        .do-kpi-value {
          overflow:hidden;

          margin-top:4px;

          color:#f8fafc;

          font-size:clamp(
            16px,
            2vw,
            22px
          );

          line-height:1.1;

          font-weight:900;

          letter-spacing:-.045em;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-kpi-secondary {
          overflow:hidden;

          margin-top:6px;

          color:#475569;

          font-size:8px;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-hidden {
          color:#475569;
          letter-spacing:.1em;
        }

        /* ================================================================
           COMMAND CENTER
        ================================================================ */

        .do-command-center {
          display:grid;

          grid-template-columns:
            minmax(0,1.65fr)
            minmax(290px,.85fr);

          gap:10px;

          margin-bottom:12px;
        }

        .do-panel {
          position:relative;
          overflow:hidden;

          min-width:0;

          border:1px solid rgba(148,163,184,.09);
          border-radius:20px;

          background:
            linear-gradient(
              180deg,
              rgba(2,6,23,.22),
              rgba(15,23,42,.12)
            );
        }

        .do-panel-header {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:12px;

          padding:14px 15px;

          border-bottom:1px solid rgba(148,163,184,.075);
        }

        .do-panel-title {
          display:flex;
          align-items:center;

          gap:8px;

          color:#cbd5e1;

          font-size:9px;
          font-weight:850;
        }

        .do-panel-title svg {
          color:var(--do-blue);
        }

        .do-panel-caption {
          color:#475569;
          font-size:7px;
        }

        .do-trajectory-chart {
          width:100%;
          height:300px;

          padding:10px 8px 7px 0;
        }

        .do-chart-empty {
          height:300px;

          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;

          gap:8px;

          color:#475569;

          font-size:9px;
        }

        .do-chart-empty svg {
          color:#334155;
        }

        .do-chart-tooltip {
          min-width:180px;

          padding:11px;

          border:1px solid rgba(148,163,184,.15);
          border-radius:12px;

          background:rgba(2,6,23,.98);

          box-shadow:
            0 20px 55px rgba(0,0,0,.35);
        }

        .do-chart-tooltip strong {
          display:block;

          padding-bottom:7px;
          margin-bottom:6px;

          color:#f8fafc;

          border-bottom:1px solid rgba(148,163,184,.07);

          font-size:9px;
        }

        .do-chart-tooltip div {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:20px;

          margin-top:6px;

          color:#64748b;

          font-size:8px;
        }

        .do-chart-tooltip b {
          color:#cbd5e1;
        }

        /* ================================================================
           DISTRIBUTION
        ================================================================ */

        .do-distribution-layout {
          display:grid;

          grid-template-columns:
            155px
            minmax(0,1fr);

          align-items:center;

          min-height:300px;

          padding:14px;
        }

        .do-donut-wrap {
          position:relative;

          width:155px;
          height:155px;
        }

        .do-donut-center {
          position:absolute;

          inset:0;

          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;

          pointer-events:none;
        }

        .do-donut-center span {
          color:#475569;

          font-size:7px;

          text-transform:uppercase;
          letter-spacing:.08em;
        }

        .do-donut-center strong {
          margin-top:3px;

          color:#f8fafc;

          font-size:15px;
          font-weight:900;

          letter-spacing:-.04em;
        }

        .do-distribution-list {
          display:flex;
          flex-direction:column;

          gap:8px;

          min-width:0;

          padding-left:8px;
        }

        .do-distribution-item {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:9px;
        }

        .do-distribution-name {
          display:flex;
          align-items:center;

          gap:7px;

          min-width:0;

          color:#64748b;

          font-size:8px;
        }

        .do-distribution-name > span:first-child {
          width:6px;
          height:6px;

          flex:0 0 6px;

          border-radius:50%;
        }

        .do-distribution-name > span:last-child {
          overflow:hidden;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-distribution-item strong {
          color:#94a3b8;
          font-size:8px;
        }

        /* ================================================================
           INTELLIGENCE STRIP
        ================================================================ */

        .do-intelligence {
          display:grid;

          grid-template-columns:
            repeat(4,minmax(0,1fr));

          gap:8px;

          margin-bottom:12px;
        }

        .do-intelligence-card {
          display:flex;
          align-items:center;

          gap:9px;

          padding:11px;

          border:1px solid rgba(148,163,184,.075);
          border-radius:12px;

          background:
            rgba(148,163,184,.015);
        }

        .do-intelligence-icon {
          width:29px;
          height:29px;

          flex:0 0 29px;

          display:grid;
          place-items:center;

          border-radius:9px;

          color:#60a5fa;

          background:rgba(96,165,250,.07);
        }

        .do-intelligence-copy {
          min-width:0;
        }

        .do-intelligence-copy span {
          display:block;

          color:#475569;

          font-size:7px;
        }

        .do-intelligence-copy strong {
          display:block;

          overflow:hidden;

          margin-top:3px;

          color:#cbd5e1;

          font-size:9px;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-intelligence-copy small {
          display:block;

          overflow:hidden;

          margin-top:2px;

          color:#334155;

          font-size:6px;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        /* ================================================================
           WORKSPACE
        ================================================================ */

        .do-workspace {
          overflow:hidden;

          border:1px solid rgba(148,163,184,.1);
          border-radius:21px;

          background:
            linear-gradient(
              180deg,
              rgba(15,23,42,.4),
              rgba(15,23,42,.17)
            );
        }

        .do-workspace-header {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:15px;

          padding:14px 15px;

          border-bottom:1px solid rgba(148,163,184,.075);
        }

        .do-workspace-title-wrap {
          display:flex;
          align-items:center;

          gap:9px;
        }

        .do-workspace-title-icon {
          color:var(--do-red);
        }

        .do-workspace-title {
          color:#cbd5e1;

          font-size:10px;
          font-weight:850;
        }

        .do-workspace-subtitle {
          margin-top:3px;

          color:#475569;

          font-size:7px;
        }

        .do-workspace-actions {
          display:flex;
          align-items:center;

          gap:7px;

          flex-wrap:wrap;
        }

        .do-search {
          position:relative;
        }

        .do-search svg {
          position:absolute;

          left:9px;
          top:50%;

          transform:translateY(-50%);

          color:#475569;

          pointer-events:none;
        }

        .do-search input {
          width:170px;
          height:32px;

          padding:0 10px 0 29px;

          border:1px solid rgba(148,163,184,.1);
          border-radius:9px;

          outline:none;

          color:#cbd5e1;
          background:rgba(2,6,23,.2);

          font-size:8px;
        }

        .do-search input::placeholder {
          color:#475569;
        }

        .do-search input:focus {
          border-color:rgba(96,165,250,.25);
        }

        .do-sort-wrap {
          position:relative;
        }

        .do-sort-button {
          height:32px;

          display:flex;
          align-items:center;

          gap:6px;

          padding:0 9px;

          border:1px solid rgba(148,163,184,.1);
          border-radius:9px;

          color:#64748b;
          background:rgba(2,6,23,.2);

          font-size:8px;
          font-weight:700;

          cursor:pointer;
        }

        .do-sort-button:hover {
          color:#cbd5e1;
        }

        .do-sort-menu {
          position:absolute;
          z-index:50;

          top:37px;
          right:0;

          width:175px;

          padding:5px;

          border:1px solid rgba(148,163,184,.14);
          border-radius:11px;

          background:rgba(2,6,23,.98);

          box-shadow:
            0 20px 55px rgba(0,0,0,.38);
        }

        .do-sort-menu button {
          width:100%;

          display:flex;
          align-items:center;
          justify-content:space-between;

          padding:8px;

          border:0;
          border-radius:7px;

          color:#64748b;
          background:transparent;

          font-size:8px;

          text-align:left;

          cursor:pointer;
        }

        .do-sort-menu button:hover {
          color:#f8fafc;
          background:rgba(148,163,184,.06);
        }

        .do-filter-row {
          display:flex;
          align-items:center;

          gap:4px;

          padding:10px 12px 5px;

          overflow:auto;
        }

        .do-filter-row button {
          height:25px;

          display:flex;
          align-items:center;

          gap:5px;

          flex:0 0 auto;

          padding:0 8px;

          border:0;
          border-radius:7px;

          color:#475569;
          background:transparent;

          font-size:7px;
          font-weight:750;

          cursor:pointer;
        }

        .do-filter-row button:hover {
          color:#94a3b8;
        }

        .do-filter-row button.active {
          color:#e2e8f0;

          background:rgba(96,165,250,.09);
        }

        .do-filter-dot {
          width:5px;
          height:5px;

          border-radius:50%;
        }

        .do-select-row {
          display:flex;
          align-items:center;

          gap:7px;

          padding:7px 14px;

          border-bottom:1px solid rgba(148,163,184,.055);

          color:#475569;

          font-size:7px;
        }

        .do-select-row button {
          width:17px;
          height:17px;

          display:grid;
          place-items:center;

          border:1px solid rgba(148,163,184,.16);
          border-radius:5px;

          color:#60a5fa;
          background:transparent;

          cursor:pointer;
        }

        .do-selection-count {
          margin-left:auto;

          color:#475569;
        }

        /* ================================================================
           DEBT GRID
        ================================================================ */

        .do-debt-grid {
          display:grid;

          grid-template-columns:
            repeat(2,minmax(0,1fr));

          gap:9px;

          padding:11px;
        }

        /* ================================================================
           DEBT CARD
        ================================================================ */

        .do-debt-card {
          position:relative;
          overflow:hidden;

          min-width:0;

          padding:14px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:15px;

          background:
            linear-gradient(
              145deg,
              rgba(148,163,184,.025),
              rgba(15,23,42,.2)
            );

          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease;
        }

        .do-debt-card:hover {
          transform:translateY(-1px);

          border-color:var(--debt-border);

          background:
            linear-gradient(
              145deg,
              var(--debt-soft),
              rgba(15,23,42,.2)
            );

          box-shadow:
            0 15px 38px rgba(0,0,0,.13);
        }

        .do-debt-selected {
          border-color:rgba(96,165,250,.3) !important;

          box-shadow:
            0 0 0 1px rgba(96,165,250,.08);
        }

        .do-debt-glow {
          position:absolute;

          top:-65px;
          right:-45px;

          width:120px;
          height:120px;

          border-radius:50%;

          background:
            radial-gradient(
              circle,
              var(--debt-soft),
              transparent 68%
            );

          pointer-events:none;
        }

        .do-debt-header {
          position:relative;

          display:flex;
          align-items:flex-start;
          justify-content:space-between;

          gap:10px;
        }

        .do-debt-title-wrap {
          display:flex;
          align-items:flex-start;

          gap:8px;

          min-width:0;
        }

        .do-select-box {
          width:18px;
          height:18px;

          flex:0 0 18px;

          display:grid;
          place-items:center;

          margin-top:1px;

          border:1px solid rgba(148,163,184,.14);
          border-radius:6px;

          color:#60a5fa;
          background:rgba(148,163,184,.02);

          cursor:pointer;
        }

        .do-debt-title-area {
          min-width:0;
        }

        .do-debt-title {
          display:flex;
          align-items:center;

          gap:6px;

          color:#cbd5e1;

          font-size:10px;
          font-weight:850;
        }

        .do-debt-title > span:last-child {
          overflow:hidden;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-debt-dot {
          width:6px;
          height:6px;

          flex:0 0 6px;

          border-radius:50%;

          background:var(--debt-color);

          box-shadow:
            0 0 0 3px var(--debt-soft);
        }

        .do-debt-lender {
          overflow:hidden;

          margin-top:4px;

          color:#475569;

          font-size:7px;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-status-badge {
          display:flex;
          align-items:center;

          gap:4px;

          flex:0 0 auto;

          padding:4px 6px;

          border:1px solid;

          border-radius:6px;

          font-size:6px;
          font-weight:850;

          text-transform:uppercase;
        }

        .do-debt-middle {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:10px;

          margin-top:17px;
        }

        .do-balance-block {
          display:flex;
          flex-direction:column;
        }

        .do-balance-block span {
          color:#475569;
          font-size:7px;
        }

        .do-balance-block strong {
          margin-top:3px;

          color:#f8fafc;

          font-size:19px;
          font-weight:900;

          letter-spacing:-.05em;
        }

        .do-balance-block small {
          margin-top:4px;

          color:var(--debt-color);

          font-size:7px;
          font-weight:750;
        }

        .do-progress-ring {
          position:relative;

          flex:0 0 auto;
        }

        .do-progress-ring svg {
          display:block;
        }

        .do-ring-center {
          position:absolute;

          inset:0;

          display:flex;
          flex-direction:column;

          align-items:center;
          justify-content:center;
        }

        .do-ring-center strong {
          color:#f8fafc;

          font-size:12px;
          font-weight:900;
        }

        .do-ring-center span {
          margin-top:1px;

          color:#475569;

          font-size:6px;
        }

        .do-debt-metrics {
          display:grid;

          grid-template-columns:
            repeat(3,1fr);

          gap:7px;

          margin-top:15px;
        }

        .do-debt-metrics > div {
          min-width:0;

          padding:7px;

          border:1px solid rgba(148,163,184,.055);
          border-radius:8px;

          background:rgba(148,163,184,.015);
        }

        .do-debt-metrics span {
          display:block;

          overflow:hidden;

          color:#475569;

          font-size:6px;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-debt-metrics strong {
          display:block;

          overflow:hidden;

          margin-top:4px;

          color:#cbd5e1;

          font-size:8px;
          font-weight:800;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-debt-progress {
          margin-top:12px;
        }

        .do-debt-progress-track {
          height:6px;

          overflow:hidden;

          border-radius:99px;

          background:rgba(148,163,184,.07);
        }

        .do-debt-progress-fill {
          height:100%;

          border-radius:inherit;

          box-shadow:
            0 0 10px var(--debt-color);

          transition:
            width .65s ease;
        }

        .do-debt-progress-label {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:10px;

          margin-top:5px;

          color:#334155;

          font-size:6px;
        }

        .do-debt-footer {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:10px;

          margin-top:12px;
        }

        .do-interest-chip {
          display:flex;
          align-items:center;

          gap:5px;

          padding:5px 7px;

          border:1px solid rgba(148,163,184,.07);
          border-radius:7px;

          color:#64748b;

          background:rgba(148,163,184,.018);

          font-size:7px;
        }

        .do-details-button {
          display:flex;
          align-items:center;

          gap:4px;

          padding:5px 7px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:7px;

          color:#64748b;
          background:rgba(148,163,184,.02);

          font-size:7px;
          font-weight:750;

          cursor:pointer;
        }

        .do-details-button:hover {
          color:#cbd5e1;

          border-color:rgba(96,165,250,.18);
        }

        /* ================================================================
           COMPARISON
        ================================================================ */

        .do-comparison {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:12px;

          padding:10px 14px;

          border-top:1px solid rgba(148,163,184,.07);

          background:rgba(96,165,250,.025);
        }

        .do-comparison-copy {
          display:flex;
          align-items:center;

          gap:8px;

          color:#64748b;

          font-size:8px;
        }

        .do-clear-selection {
          display:flex;
          align-items:center;

          gap:5px;

          padding:6px 8px;

          border:1px solid rgba(96,165,250,.13);
          border-radius:7px;

          color:#60a5fa;

          background:rgba(96,165,250,.05);

          font-size:7px;
          font-weight:750;

          cursor:pointer;
        }

        /* ================================================================
           EMPTY
        ================================================================ */

        .do-empty {
          min-height:410px;

          display:flex;
          flex-direction:column;

          align-items:center;
          justify-content:center;

          padding:35px;

          text-align:center;
        }

        .do-empty-orbit {
          width:82px;
          height:82px;

          display:grid;
          place-items:center;

          border:1px dashed rgba(96,165,250,.16);
          border-radius:50%;

          animation:
            do-rotate
            15s linear infinite;
        }

        .do-empty-core {
          width:54px;
          height:54px;

          display:grid;
          place-items:center;

          border:1px solid rgba(96,165,250,.16);
          border-radius:16px;

          color:#60a5fa;

          background:rgba(96,165,250,.05);

          animation:
            do-counter
            15s linear infinite;
        }

        .do-empty h3 {
          margin:16px 0 0;

          color:#cbd5e1;

          font-size:13px;
          font-weight:850;
        }

        .do-empty p {
          max-width:450px;

          margin:7px 0 16px;

          color:#475569;

          font-size:9px;
          line-height:1.6;
        }

        /* ================================================================
           ERROR
        ================================================================ */

        .do-error {
          min-height:410px;

          display:flex;
          flex-direction:column;

          align-items:center;
          justify-content:center;

          padding:30px;

          text-align:center;
        }

        .do-error-icon {
          width:54px;
          height:54px;

          display:grid;
          place-items:center;

          border:1px solid rgba(239,68,68,.13);
          border-radius:16px;

          color:#fb7185;

          background:rgba(239,68,68,.07);
        }

        .do-error h3 {
          margin:13px 0 0;

          color:#cbd5e1;

          font-size:13px;
        }

        .do-error p {
          max-width:400px;

          margin:6px 0 13px;

          color:#475569;

          font-size:9px;
          line-height:1.5;
        }

        .do-retry {
          display:inline-flex;
          align-items:center;

          gap:6px;

          padding:8px 11px;

          border:1px solid rgba(148,163,184,.12);
          border-radius:9px;

          color:#94a3b8;
          background:rgba(148,163,184,.035);

          font-size:8px;
          font-weight:750;

          cursor:pointer;
        }

        .do-retry:hover {
          color:#f8fafc;
        }

        /* ================================================================
           LOADING
        ================================================================ */

        .do-loading {
          padding:20px;
        }

        .do-loading-kpis {
          display:grid;

          grid-template-columns:
            repeat(4,1fr);

          gap:10px;

          margin-bottom:12px;
        }

        .do-loading-card,
        .do-loading-debt {
          padding:14px;

          border:1px solid rgba(148,163,184,.07);
          border-radius:16px;

          background:rgba(148,163,184,.018);
        }

        .do-skeleton {
          position:relative;
          overflow:hidden;

          background:rgba(148,163,184,.055);
        }

        .do-skeleton::after {
          content:"";

          position:absolute;
          inset:0;

          transform:translateX(-100%);

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.055),
              transparent
            );

          animation:
            do-shimmer
            1.4s infinite;
        }

        .do-sk-icon {
          width:30px;
          height:30px;

          border-radius:9px;
        }

        .do-sk-label {
          width:48%;
          height:7px;

          margin-top:10px;

          border-radius:5px;
        }

        .do-sk-value {
          width:72%;
          height:18px;

          margin-top:6px;

          border-radius:6px;
        }

        .do-sk-line {
          width:60%;
          height:7px;

          margin-top:9px;

          border-radius:5px;
        }

        .do-sk-heading {
          width:210px;
          height:12px;

          border-radius:6px;
        }

        .do-sk-chart {
          width:100%;
          height:280px;

          margin-top:15px;

          border-radius:13px;
        }

        .do-loading-main {
          padding:15px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:20px;

          background:rgba(148,163,184,.015);
        }

        .do-loading-grid {
          display:grid;

          grid-template-columns:
            repeat(2,1fr);

          gap:9px;

          margin-top:10px;
        }

        .do-loading-debt {
          min-height:160px;
        }

        .do-sk-big {
          width:60%;
          height:22px;

          margin-top:13px;

          border-radius:7px;
        }

        .do-sk-progress {
          width:100%;
          height:6px;

          margin-top:15px;

          border-radius:99px;
        }

        /* ================================================================
           MODAL
        ================================================================ */

        .do-modal-backdrop {
          position:fixed;
          z-index:999;

          inset:0;

          display:flex;
          align-items:center;
          justify-content:center;

          padding:20px;

          background:rgba(2,6,23,.72);

          backdrop-filter:blur(10px);
        }

        .do-modal {
          width:min(
            720px,
            100%
          );

          max-height:90vh;

          overflow:auto;

          padding:20px;

          border:1px solid rgba(148,163,184,.16);
          border-radius:22px;

          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(96,165,250,.07),
              transparent 35%
            ),
            #0b1220;

          box-shadow:
            0 45px 130px rgba(0,0,0,.5),
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        .do-modal-header {
          display:flex;
          justify-content:space-between;

          gap:20px;
        }

        .do-modal-eyebrow {
          color:#60a5fa;

          font-size:7px;
          font-weight:850;

          letter-spacing:.12em;
          text-transform:uppercase;
        }

        .do-modal-header h3 {
          margin:4px 0 0;

          color:#f8fafc;

          font-size:18px;
          font-weight:900;

          letter-spacing:-.035em;
        }

        .do-modal-header p {
          margin:5px 0 0;

          color:#475569;

          font-size:8px;
        }

        .do-modal-status {
          display:flex;
          align-items:center;

          gap:9px;

          margin-top:17px;
          padding:10px;

          border:1px solid;
          border-radius:11px;
        }

        .do-modal-status div {
          display:flex;
          flex-direction:column;
        }

        .do-modal-status strong {
          font-size:9px;
        }

        .do-modal-status span {
          margin-top:2px;

          color:#64748b;

          font-size:7px;
        }

        .do-modal-summary {
          display:grid;

          grid-template-columns:
            1.5fr
            1fr
            1fr;

          gap:8px;

          margin-top:10px;
        }

        .do-modal-main-progress,
        .do-modal-stat {
          padding:13px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:13px;

          background:rgba(148,163,184,.018);
        }

        .do-modal-main-progress {
          display:flex;
          align-items:center;

          gap:12px;
        }

        .do-modal-main-progress > div:last-child {
          display:flex;
          flex-direction:column;
        }

        .do-modal-main-progress span {
          color:#475569;

          font-size:7px;
        }

        .do-modal-main-progress strong {
          margin-top:4px;

          color:#f8fafc;

          font-size:19px;
          font-weight:900;

          letter-spacing:-.05em;
        }

        .do-modal-main-progress small {
          max-width:170px;

          margin-top:3px;

          color:#334155;

          font-size:6px;

          line-height:1.4;
        }

        .do-modal-stat span {
          display:block;

          color:#475569;

          font-size:7px;
        }

        .do-modal-stat strong {
          display:block;

          margin-top:6px;

          color:#e2e8f0;

          font-size:14px;
          font-weight:900;
        }

        .do-modal-stat small {
          display:block;

          margin-top:4px;

          color:#334155;

          font-size:6px;
        }

        .do-modal-section {
          margin-top:11px;

          padding:13px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:13px;

          background:rgba(148,163,184,.015);
        }

        .do-modal-section-title {
          display:flex;
          align-items:center;

          gap:7px;

          color:#94a3b8;

          font-size:8px;
          font-weight:800;
        }

        .do-modal-grid {
          display:grid;

          grid-template-columns:
            repeat(4,1fr);

          gap:7px;

          margin-top:11px;
        }

        .do-modal-mini-card {
          padding:9px;

          border:1px solid rgba(148,163,184,.06);
          border-radius:9px;

          background:rgba(148,163,184,.015);
        }

        .do-modal-mini-card span {
          display:block;

          color:#475569;

          font-size:6px;
        }

        .do-modal-mini-card strong {
          display:block;

          margin-top:4px;

          color:#cbd5e1;

          font-size:9px;
          font-weight:850;
        }

        .do-payoff-box {
          display:grid;

          grid-template-columns:
            1fr
            1fr;

          gap:8px;

          margin-top:10px;
        }

        .do-payoff-box > div {
          padding:10px;

          border:1px solid rgba(96,165,250,.08);
          border-radius:10px;

          background:rgba(96,165,250,.025);
        }

        .do-payoff-box span {
          display:block;

          color:#475569;

          font-size:7px;
        }

        .do-payoff-box strong {
          display:block;

          margin-top:5px;

          color:#cbd5e1;

          font-size:10px;
          font-weight:850;
        }

        .do-modal-warning {
          display:flex;
          align-items:flex-start;

          gap:9px;

          margin-top:10px;
          padding:11px;

          border:1px solid rgba(251,191,36,.12);
          border-radius:11px;

          color:#fbbf24;

          background:rgba(251,191,36,.035);
        }

        .do-modal-warning div {
          display:flex;
          flex-direction:column;
        }

        .do-modal-warning strong {
          font-size:8px;
        }

        .do-modal-warning span {
          margin-top:3px;

          color:#64748b;

          font-size:7px;

          line-height:1.45;
        }

        /* ================================================================
           FOOTER
        ================================================================ */

        .do-footer-signals {
          display:grid;

          grid-template-columns:
            repeat(4,minmax(0,1fr));

          gap:8px;

          margin-top:10px;
        }

        .do-footer-card {
          padding:11px;

          border:1px solid rgba(148,163,184,.07);
          border-radius:12px;

          background:rgba(148,163,184,.015);
        }

        .do-footer-card span {
          display:block;

          color:#475569;

          font-size:7px;
        }

        .do-footer-card strong {
          display:block;

          overflow:hidden;

          margin-top:4px;

          color:#cbd5e1;

          font-size:10px;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-footer-card small {
          display:block;

          overflow:hidden;

          margin-top:2px;

          color:#334155;

          font-size:6px;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .do-footer {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:15px;

          margin-top:10px;
          padding:2px;

          color:#334155;

          font-size:7px;
        }

        .do-footer > div {
          display:flex;
          align-items:center;

          gap:6px;
        }

        /* ================================================================
           ANIMATIONS
        ================================================================ */

        @keyframes do-pulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0 rgba(52,211,153,.2);
          }

          50% {
            box-shadow:
              0 0 0 5px rgba(52,211,153,0);
          }
        }

        @keyframes do-shimmer {
          100% {
            transform:translateX(100%);
          }
        }

        @keyframes do-rotate {
          from {
            transform:rotate(0deg);
          }

          to {
            transform:rotate(360deg);
          }
        }

        @keyframes do-counter {
          from {
            transform:rotate(0deg);
          }

          to {
            transform:rotate(-360deg);
          }
        }

        /* ================================================================
           RESPONSIVE
        ================================================================ */

        @media(max-width:1200px) {

          .do-command-center {
            grid-template-columns:1fr;
          }

          .do-intelligence {
            grid-template-columns:
              repeat(2,1fr);
          }

          .do-kpis {
            grid-template-columns:
              repeat(2,1fr);
          }

        }

        @media(max-width:900px) {

          .do-header {
            flex-direction:column;
          }

          .do-header-actions {
            width:100%;
            justify-content:flex-start;
          }

          .do-debt-grid {
            grid-template-columns:1fr;
          }

          .do-modal-summary {
            grid-template-columns:
              1fr
              1fr;
          }

          .do-modal-main-progress {
            grid-column:1/-1;
          }

        }

        @media(max-width:720px) {

          .do-content {
            padding:16px;
          }

          .do-workspace-header {
            align-items:flex-start;
            flex-direction:column;
          }

          .do-workspace-actions {
            width:100%;
            flex-direction:column;
            align-items:stretch;
          }

          .do-search input {
            width:100%;
          }

          .do-distribution-layout {
            grid-template-columns:1fr;
            justify-items:center;
          }

          .do-distribution-list {
            width:100%;
            padding-left:0;
            margin-top:10px;
          }

          .do-intelligence {
            grid-template-columns:1fr 1fr;
          }

          .do-footer-signals {
            grid-template-columns:
              1fr 1fr;
          }

        }

        @media(max-width:540px) {

          .do-content {
            padding:12px;
          }

          .do-kpis {
            grid-template-columns:
              1fr 1fr;
          }

          .do-kpi {
            padding:11px;
          }

          .do-heading-icon {
            width:44px;
            height:44px;
            flex-basis:44px;
          }

          .do-header-actions {
            display:grid;

            grid-template-columns:
              1fr auto auto auto;
          }

          .do-period {
            width:100%;
          }

          .do-primary-button {
            grid-column:1/-1;
          }

          .do-debt-metrics {
            grid-template-columns:
              1fr 1fr 1fr;
          }

          .do-modal {
            padding:15px;
          }

          .do-modal-summary {
            grid-template-columns:1fr;
          }

          .do-modal-main-progress {
            grid-column:auto;
          }

          .do-modal-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .do-payoff-box {
            grid-template-columns:1fr;
          }

          .do-intelligence {
            grid-template-columns:1fr;
          }

          .do-footer-signals {
            grid-template-columns:1fr 1fr;
          }

        }

        @media(prefers-reduced-motion:reduce) {

          .do-heading-pulse,
          .do-empty-orbit,
          .do-empty-core,
          .do-skeleton::after {
            animation:none !important;
          }

        }

      `}</style>

      <div className="do-content">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <header className="do-header">

          <div className="do-heading">

            <div className="do-heading-icon">

              <ShieldAlert
                size={23}
                strokeWidth={1.8}
              />

              <span className="do-heading-pulse" />

            </div>

            <div>

              <div className="do-eyebrow">

                <span className="do-live-dot" />

                Liability intelligence

              </div>

              <h2 className="do-title">
                {title}
              </h2>

              <p className="do-subtitle">
                {subtitle}
              </p>

            </div>

          </div>

          <div className="do-header-actions">

            <div className="do-period">

              <Calendar
                size={13}
              />

              <select
                value={
                  period
                }
                onChange={(
                  event,
                ) =>
                  setPeriod(
                    event
                      .target
                      .value,
                  )
                }
              >
                <option value="Current">
                  Current
                </option>

                <option value="Monthly">
                  Monthly
                </option>

                <option value="Quarterly">
                  Quarterly
                </option>

                <option value="Yearly">
                  Yearly
                </option>
              </select>

              <ChevronDown
                size={12}
              />

            </div>

            {onCreate && (
              <button
                type="button"
                className="do-primary-button"
                onClick={
                  onCreate
                }
              >
                <Plus
                  size={14}
                />

                New debt
              </button>
            )}

            <button
              type="button"
              className="do-icon-button"
              onClick={() =>
                setHiddenAmounts(
                  (
                    current,
                  ) =>
                    !current,
                )
              }
              title={
                hiddenAmounts
                  ? 'Show amounts'
                  : 'Hide amounts'
              }
            >
              {hiddenAmounts ? (
                <EyeOff
                  size={15}
                />
              ) : (
                <Eye
                  size={15}
                />
              )}
            </button>

            <button
              type="button"
              className="do-icon-button"
              onClick={
                onRefresh
              }
              title="Refresh"
            >
              <RefreshCw
                size={15}
              />
            </button>

            <div className="do-menu-wrap">

              <button
                type="button"
                className="do-icon-button"
                onClick={() =>
                  setMenuOpen(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
              >
                <MoreHorizontal
                  size={16}
                />
              </button>

              {menuOpen && (
                <div className="do-menu">

                  <button
                    type="button"
                    onClick={
                      handleExport
                    }
                  >
                    <Download
                      size={13}
                    />

                    Export debt portfolio
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleFullscreen
                    }
                  >
                    <Layers3
                      size={13}
                    />

                    Fullscreen workspace
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAnalytics(
                        (
                          current,
                        ) =>
                          !current,
                      );

                      setMenuOpen(
                        false,
                      );
                    }}
                  >
                    <Gauge
                      size={13}
                    />

                    Toggle intelligence
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCards(
                        (
                          current,
                        ) =>
                          !current,
                      );

                      setMenuOpen(
                        false,
                      );
                    }}
                  >
                    <CreditCard
                      size={13}
                    />

                    Toggle debt cards
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* ================================================================
            LOADING / ERROR / EMPTY
        ================================================================ */}

        {loading ? (
          <DebtLoading />
        ) : error ? (
          <DebtError
            message={
              errorMessage
            }
            onRetry={
              onRefresh
            }
          />
        ) : normalized.length ===
          0 ? (
          <DebtEmpty
            onCreate={
              onCreate
            }
          />
        ) : (
          <>

            {/* ============================================================
                KPI MATRIX
            ============================================================ */}

            <div className="do-kpis">

              <DebtKpi
                icon={
                  CircleDollarSign
                }
                label="Outstanding debt"
                tone="red"
                value={
                  hiddenAmounts ? (
                    <span className="do-hidden">
                      •••••••
                    </span>
                  ) : (
                    <AnimatedNumber
                      value={
                        totals.totalBalance
                      }
                    />
                  )
                }
                secondary={`${number(
                  totals.activeCount,
                )} active liability${
                  totals.activeCount ===
                  1
                    ? ''
                    : 'ies'
                }`}
              />

              <DebtKpi
                icon={
                  HandCoins
                }
                label="Monthly payments"
                tone="blue"
                value={
                  hiddenAmounts ? (
                    <span className="do-hidden">
                      •••••••
                    </span>
                  ) : (
                    <AnimatedNumber
                      value={
                        totals.totalPayment
                      }
                    />
                  )
                }
                secondary="Required scheduled payments"
              />

              <DebtKpi
                icon={
                  Percent
                }
                label="Weighted APR"
                tone="yellow"
                value={
                  percentage(
                    totals.weightedRate,
                    2,
                  )
                }
                secondary={
                  hiddenAmounts
                    ? 'Interest exposure hidden'
                    : `${currency(
                        totals.totalInterest,
                      )}/month estimated interest`
                }
              />

              <DebtKpi
                icon={
                  Target
                }
                label="Debt-free progress"
                tone="green"
                value={
                  percentage(
                    totals.progress,
                  )
                }
                secondary={`${number(
                  totals.paid,
                )} paid amount tracked`}
              />

            </div>

            {/* ============================================================
                COMMAND CENTER
            ============================================================ */}

            {showAnalytics && (
              <div className="do-command-center">

                <div className="do-panel">

                  <div className="do-panel-header">

                    <div className="do-panel-title">

                      <TrendingDown
                        size={14}
                      />

                      Projected debt trajectory

                    </div>

                    <span className="do-panel-caption">
                      12-month projection
                    </span>

                  </div>

                  <DebtTrajectoryChart
                    debts={
                      normalized
                    }
                    hiddenAmounts={
                      hiddenAmounts
                    }
                  />

                </div>

                <div className="do-panel">

                  <div className="do-panel-header">

                    <div className="do-panel-title">

                      <PieChart
                        size={14}
                      />

                      Liability concentration

                    </div>

                    <span className="do-panel-caption">
                      Outstanding balance mix
                    </span>

                  </div>

                  <DebtDistribution
                    debts={
                      normalized
                    }
                    hiddenAmounts={
                      hiddenAmounts
                    }
                  />

                </div>

              </div>
            )}

            {/* ============================================================
                INTELLIGENCE SIGNALS
            ============================================================ */}

            <div className="do-intelligence">

              <div className="do-intelligence-card">

                <div className="do-intelligence-icon">
                  <AlertOctagon
                    size={14}
                  />
                </div>

                <div className="do-intelligence-copy">

                  <span>
                    Highest interest
                  </span>

                  <strong>
                    {shorten(
                      highestInterestDebt.name,
                      22,
                    )}
                  </strong>

                  <small>
                    {percentage(
                      highestInterestDebt.interest,
                      2,
                    )}{' '}
                    APR
                  </small>

                </div>

              </div>

              <div className="do-intelligence-card">

                <div className="do-intelligence-icon">
                  <Landmark
                    size={14}
                  />
                </div>

                <div className="do-intelligence-copy">

                  <span>
                    Largest liability
                  </span>

                  <strong>
                    {shorten(
                      largestDebt.name,
                      22,
                    )}
                  </strong>

                  <small>
                    {hiddenAmounts
                      ? '••••••'
                      : currency(
                          largestDebt.balance,
                        )}
                  </small>

                </div>

              </div>

              <div className="do-intelligence-card">

                <div className="do-intelligence-icon">
                  <CreditCard
                    size={14}
                  />
                </div>

                <div className="do-intelligence-copy">

                  <span>
                    Largest payment
                  </span>

                  <strong>
                    {shorten(
                      largestPayment.name,
                      22,
                    )}
                  </strong>

                  <small>
                    {hiddenAmounts
                      ? '••••••'
                      : currency(
                          largestPayment.payment,
                        )}{' '}
                    / month
                  </small>

                </div>

              </div>

              <div className="do-intelligence-card">

                <div className="do-intelligence-icon">
                  <Zap
                    size={14}
                  />
                </div>

                <div className="do-intelligence-copy">

                  <span>
                    Projected debt-free
                  </span>

                  <strong>
                    {debtFreeProjection
                      ? `${debtFreeProjection} months`
                      : 'Needs payment data'}
                  </strong>

                  <small>
                    {hiddenAmounts
                      ? 'Interest estimate hidden'
                      : estimatedFutureInterest
                      ? `${currency(
                          estimatedFutureInterest,
                        )} projected interest`
                      : 'No projection available'}
                  </small>

                </div>

              </div>

            </div>

            {/* ============================================================
                WORKSPACE
            ============================================================ */}

            {showCards && (
              <div className="do-workspace">

                <div className="do-workspace-header">

                  <div className="do-workspace-title-wrap">

                    <ShieldAlert
                      size={15}
                      className="do-workspace-title-icon"
                    />

                    <div>

                      <div className="do-workspace-title">
                        Liability command center
                      </div>

                      <div className="do-workspace-subtitle">
                        Search, filter, compare, and inspect every debt account
                      </div>

                    </div>

                  </div>

                  <div className="do-workspace-actions">

                    <div className="do-search">

                      <Search
                        size={12}
                      />

                      <input
                        type="search"
                        value={
                          search
                        }
                        onChange={(
                          event,
                        ) =>
                          setSearch(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Search debts, lenders..."
                      />

                    </div>

                    <div className="do-sort-wrap">

                      <button
                        type="button"
                        className="do-sort-button"
                        onClick={() =>
                          setSortOpen(
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
                      >

                        <Filter
                          size={11}
                        />

                        Sort

                        <ChevronDown
                          size={10}
                        />

                      </button>

                      {sortOpen && (
                        <div className="do-sort-menu">

                          {SORT_OPTIONS.map(
                            (
                              option,
                            ) => (
                              <button
                                type="button"
                                key={
                                  option.id
                                }
                                onClick={() => {

                                  if (
                                    sortBy ===
                                    option.id
                                  ) {
                                    setSortDirection(
                                      (
                                        current,
                                      ) =>
                                        current ===
                                        'asc'
                                          ? 'desc'
                                          : 'asc',
                                    );
                                  } else {
                                    setSortBy(
                                      option.id,
                                    );

                                    setSortDirection(
                                      'desc',
                                    );
                                  }

                                  setSortOpen(
                                    false,
                                  );

                                }}
                              >

                                <span>
                                  {
                                    option.label
                                  }
                                </span>

                                {sortBy ===
                                  option.id && (
                                  <span>
                                    {sortDirection ===
                                    'asc'
                                      ? '↑'
                                      : '↓'}
                                  </span>
                                )}

                              </button>
                            ),
                          )}

                        </div>
                      )}

                    </div>

                  </div>

                </div>

                {/* ========================================================
                    FILTERS
                ======================================================== */}

                <div className="do-filter-row">

                  {[
                    {
                      id:'all',
                      label:'All',
                    },
                    {
                      id:'healthy',
                      label:'Healthy',
                    },
                    {
                      id:'attention',
                      label:'Attention',
                    },
                    {
                      id:'critical',
                      label:'Critical',
                    },
                    {
                      id:'overdue',
                      label:'Overdue',
                    },
                    {
                      id:'paid',
                      label:'Paid off',
                    },
                  ].map(
                    (
                      filter,
                    ) => (
                      <button
                        type="button"
                        key={
                          filter.id
                        }
                        className={
                          activeFilter ===
                          filter.id
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setActiveFilter(
                            filter.id,
                          )
                        }
                      >

                        {filter.id !==
                          'all' && (
                          <span
                            className="do-filter-dot"
                            style={{
                              background:
                                STATUS[
                                  filter.id
                                ]
                                  ?.color,
                            }}
                          />
                        )}

                        {filter.label}

                      </button>
                    ),
                  )}

                </div>

                {/* ========================================================
                    SELECTION
                ======================================================== */}

                <div className="do-select-row">

                  <button
                    type="button"
                    onClick={
                      handleSelectAll
                    }
                  >

                    {selected.length ===
                      filtered.length &&
                    filtered.length >
                      0 ? (
                      <Check
                        size={10}
                      />
                    ) : null}

                  </button>

                  <span>
                    {selected.length
                      ? `${selected.length} selected`
                      : 'Select debt accounts for comparison'}
                  </span>

                  <span className="do-selection-count">
                    {number(
                      filtered.length,
                    )}{' '}
                    shown
                  </span>

                </div>

                {/* ========================================================
                    DEBT CARDS
                ======================================================== */}

                {filtered.length >
                0 ? (
                  <div className="do-debt-grid">

                    {filtered.map(
                      (
                        debt,
                      ) => (
                        <DebtCard
                          key={
                            debt.id
                          }
                          debt={
                            debt
                          }
                          hiddenAmounts={
                            hiddenAmounts
                          }
                          selected={selectedSet.has(
                            debt.id,
                          )}
                          onSelect={
                            handleSelect
                          }
                          onOpen={(
                            item,
                          ) => {
                            setActiveDebt(
                              item,
                            );

                            onDebtClick?.(
                              item,
                            );
                          }}
                        />
                      ),
                    )}

                  </div>
                ) : (
                  <div
                    style={{
                      minHeight:220,
                      display:'flex',
                      flexDirection:'column',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:8,
                      color:'#475569',
                    }}
                  >

                    <Search
                      size={22}
                    />

                    <strong
                      style={{
                        color:'#64748b',
                        fontSize:10,
                      }}
                    >
                      No matching debts
                    </strong>

                    <span
                      style={{
                        fontSize:8,
                      }}
                    >
                      Change the search or
                      status filter.
                    </span>

                  </div>
                )}

                {/* ========================================================
                    COMPARISON STRIP
                ======================================================== */}

                {selected.length >
                  0 && (
                  <div className="do-comparison">

                    <div className="do-comparison-copy">

                      <Layers3
                        size={12}
                      />

                      {selected.length}{' '}
                      debt accounts selected
                      for comparison

                    </div>

                    <button
                      type="button"
                      className="do-clear-selection"
                      onClick={() =>
                        setSelected(
                          [],
                        )
                      }
                    >
                      Clear
                      <X
                        size={10}
                      />
                    </button>

                  </div>
                )}

              </div>
            )}

            {/* ============================================================
                FOOTER SIGNALS
            ============================================================ */}

            <div className="do-footer-signals">

              <div className="do-footer-card">

                <span>
                  Portfolio risk
                </span>

                <strong
                  style={{
                    color:
                      riskScore >
                      70
                        ? '#fb7185'
                        : riskScore >
                          45
                        ? '#fbbf24'
                        : '#34d399',
                  }}
                >
                  {riskScore}
                  /100
                </strong>

                <small>
                  Liability exposure score
                </small>

              </div>

              <div className="do-footer-card">

                <span>
                  Overdue accounts
                </span>

                <strong
                  style={{
                    color:
                      totals.overdue >
                      0
                        ? '#fb7185'
                        : '#34d399',
                  }}
                >
                  {number(
                    totals.overdue,
                  )}
                </strong>

                <small>
                  Payment schedules requiring action
                </small>

              </div>

              <div className="do-footer-card">

                <span>
                  Monthly interest
                </span>

                <strong>
                  {hiddenAmounts
                    ? '••••••'
                    : currency(
                        totals.totalInterest,
                      )}
                </strong>

                <small>
                  Estimated current interest exposure
                </small>

              </div>

              <div className="do-footer-card">

                <span>
                  Debt-free horizon
                </span>

                <strong>
                  {debtFreeProjection
                    ? `${debtFreeProjection} mo`
                    : '—'}
                </strong>

                <small>
                  Based on current payments
                </small>

              </div>

            </div>

            {/* ============================================================
                FOOTER
            ============================================================ */}

            <div className="do-footer">

              <div>

                <Clock
                  size={9}
                />

                <span>
                  {period} liability intelligence
                </span>

              </div>

              <div>

                <span>
                  {number(
                    totals.activeCount,
                  )}{' '}
                  active
                </span>

                <span>
                  •
                </span>

                <span>
                  {number(
                    totals.paid,
                  )}{' '}
                  paid off
                </span>

                <span>
                  •
                </span>

                <span>
                  {percentage(
                    totals.progress,
                  )}{' '}
                  portfolio progress
                </span>

              </div>

            </div>

          </>
        )}

      </div>

      {/* ================================================================
          DETAIL MODAL
      ================================================================ */}

      {activeDebt && (
        <DebtDetailModal
          debt={
            activeDebt
          }
          hiddenAmounts={
            hiddenAmounts
          }
          onClose={() =>
            setActiveDebt(
              null,
            )
          }
        />
      )}

    </section>
  );
}