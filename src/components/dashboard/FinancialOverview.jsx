import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  EyeOff,
  Filter,
  Gauge,
  Layers3,
  Maximize2,
  Minus,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const formatCurrency = (value) =>
  INR.format(Number(value) || 0);

const formatNumber = (value) =>
  NUMBER.format(Number(value) || 0);

const formatCompactCurrency = (value) => {
  const number = Number(value) || 0;
  const absolute = Math.abs(number);

  if (absolute >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (absolute >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (absolute >= 1000) {
    return `₹${(number / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(number)}`;
};

const formatPercent = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '0.0%';
  }

  return `${number.toFixed(digits)}%`;
};

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, Number(value) || 0));

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const getNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 0;
};

const getString = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    ) {
      return String(value);
    }
  }

  return '';
};

const shortLabel = (value, max = 12) => {
  const string = String(value || '');

  if (string.length <= max) {
    return string;
  }

  return `${string.slice(0, max - 1)}…`;
};

const getPeriodLabel = (item, index) =>
  getString(
    item?.period,
    item?.month,
    item?.month_name,
    item?.monthName,
    item?.label,
    item?.date_label,
    item?.dateLabel,
    `Period ${index + 1}`,
  );

const normalizePoint = (item, index) => {
  const income = getNumber(
    item?.income,
    item?.total_income,
    item?.totalIncome,
    item?.income_amount,
    item?.incomeAmount,
  );

  const expense = getNumber(
    item?.expense,
    item?.expenses,
    item?.total_expense,
    item?.totalExpense,
    item?.total_expenses,
    item?.totalExpenses,
    item?.expense_amount,
    item?.expenseAmount,
  );

  const savings =
    item?.savings !== undefined
      ? getNumber(item.savings)
      : income - expense;

  return {
    ...item,
    id:
      item?.id ??
      item?.period_id ??
      item?.month_id ??
      `financial-period-${index}`,
    period: getPeriodLabel(item, index),
    income,
    expense,
    savings,
    netCashFlow: savings,
    savingsRate:
      income > 0
        ? (savings / income) * 100
        : 0,
  };
};

const normalizeData = (data) =>
  safeArray(data).map(normalizePoint);

const calculateChange = (current, previous) => {
  if (!Number.isFinite(current)) return 0;
  if (!Number.isFinite(previous) || previous === 0) {
    return 0;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
};

const downloadCsv = (rows) => {
  if (!rows.length) return;

  const headers = [
    'Period',
    'Income',
    'Expenses',
    'Net Cash Flow',
    'Savings Rate',
  ];

  const body = rows.map((row) => [
    row.period,
    row.income,
    row.expense,
    row.netCashFlow,
    row.savingsRate.toFixed(2),
  ]);

  const csv = [
    headers,
    ...body,
  ]
    .map((row) =>
      row
        .map((value) =>
          `"${String(value).replaceAll('"', '""')}"`
        )
        .join(','),
    )
    .join('\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'finsight-financial-overview.csv';
  anchor.click();

  URL.revokeObjectURL(url);
};

/* -------------------------------------------------------------------------- */
/* Animated number                                                            */
/* -------------------------------------------------------------------------- */

function AnimatedNumber({
  value,
  formatter = formatCurrency,
  duration = 700,
}) {
  const [display, setDisplay] = useState(0);
  const previousRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = Number(previousRef.current) || 0;
    const startTime = performance.now();

    let frame;

    const animate = (now) => {
      const progress = clamp(
        (now - startTime) / duration,
        0,
        1,
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      const next =
        start + (target - start) * eased;

      setDisplay(next);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        previousRef.current = target;
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [value, duration]);

  return <>{formatter(display)}</>;
}

/* -------------------------------------------------------------------------- */
/* Mini sparkline                                                             */
/* -------------------------------------------------------------------------- */

function MiniSparkline({
  values = [],
  positive = true,
}) {
  const points = useMemo(() => {
    const numbers = values
      .map(Number)
      .filter(Number.isFinite);

    if (numbers.length < 2) {
      return '';
    }

    const width = 130;
    const height = 42;
    const padding = 3;

    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min || 1;

    return numbers
      .map((value, index) => {
        const x =
          padding +
          (index / (numbers.length - 1)) *
            (width - padding * 2);

        const y =
          height -
          padding -
          ((value - min) / range) *
            (height - padding * 2);

        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  if (!points) {
    return (
      <div className="fo-mini-empty">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <svg
      className={`fo-mini-svg ${
        positive
          ? 'fo-mini-positive'
          : 'fo-mini-negative'
      }`}
      viewBox="0 0 130 42"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric block                                                               */
/* -------------------------------------------------------------------------- */

function MetricBlock({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  trend,
  trendLabel,
  sparkline,
  hidden,
  onToggle,
}) {
  const positive =
    Number(trend) >= 0;

  return (
    <div className={`fo-metric fo-tone-${tone}`}>
      <div className="fo-metric-top">
        <div className="fo-metric-icon">
          <Icon size={17} strokeWidth={1.8} />
        </div>

        {onToggle && (
          <button
            type="button"
            className="fo-visibility"
            onClick={onToggle}
            aria-label={
              hidden
                ? `Show ${label}`
                : `Hide ${label}`
            }
          >
            {hidden ? (
              <EyeOff size={13} />
            ) : (
              <Eye size={13} />
            )}
          </button>
        )}
      </div>

      <div className="fo-metric-label">
        {label}
      </div>

      <div className="fo-metric-value">
        {hidden ? (
          <span className="fo-hidden-value">
            •••••••
          </span>
        ) : (
          value
        )}
      </div>

      <div className="fo-metric-bottom">
        {sparkline?.length > 1 && (
          <div className="fo-mini-chart">
            <MiniSparkline
              values={sparkline}
              positive={positive}
            />
          </div>
        )}

        {trend !== undefined && (
          <div
            className={`fo-trend ${
              positive
                ? 'fo-trend-positive'
                : 'fo-trend-negative'
            }`}
          >
            {positive ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}

            <strong>
              {Math.abs(Number(trend)).toFixed(1)}%
            </strong>

            {trendLabel && (
              <span>{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Custom tooltip                                                             */
/* -------------------------------------------------------------------------- */

function FinancialTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const income = getNumber(
    payload.find(
      (item) => item.dataKey === 'income',
    )?.value,
  );

  const expense = getNumber(
    payload.find(
      (item) => item.dataKey === 'expense',
    )?.value,
  );

  const net = income - expense;

  return (
    <div className="fo-tooltip">
      <div className="fo-tooltip-header">
        <div className="fo-tooltip-period">
          {label}
        </div>

        <div className="fo-tooltip-status">
          <span />
          Financial flow
        </div>
      </div>

      <div className="fo-tooltip-row">
        <div className="fo-tooltip-label">
          <span className="fo-tooltip-dot fo-dot-income" />
          Income
        </div>

        <strong>
          {formatCurrency(income)}
        </strong>
      </div>

      <div className="fo-tooltip-row">
        <div className="fo-tooltip-label">
          <span className="fo-tooltip-dot fo-dot-expense" />
          Expenses
        </div>

        <strong>
          {formatCurrency(expense)}
        </strong>
      </div>

      <div className="fo-tooltip-divider" />

      <div className="fo-tooltip-row fo-tooltip-net">
        <div className="fo-tooltip-label">
          <span className="fo-tooltip-dot fo-dot-net" />
          Net cash flow
        </div>

        <strong
          className={
            net >= 0
              ? 'fo-positive-text'
              : 'fo-negative-text'
          }
        >
          {formatCurrency(net)}
        </strong>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* View selector                                                              */
/* -------------------------------------------------------------------------- */

function ViewSelector({
  value,
  onChange,
}) {
  const options = [
    {
      id: 'trend',
      label: 'Trend',
      icon: TrendingUp,
    },
    {
      id: 'comparison',
      label: 'Comparison',
      icon: BarChart3,
    },
  ];

  return (
    <div className="fo-view-selector">
      {options.map((option) => {
        const Icon = option.icon;
        const active =
          value === option.id;

        return (
          <button
            type="button"
            key={option.id}
            className={
              active
                ? 'fo-view-button fo-view-active'
                : 'fo-view-button'
            }
            onClick={() =>
              onChange(option.id)
            }
          >
            <Icon size={12} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Range navigator                                                             */
/* -------------------------------------------------------------------------- */

function RangeNavigator({
  value,
  onChange,
}) {
  const ranges = [
    '6M',
    '12M',
    '24M',
  ];

  return (
    <div className="fo-range">
      {ranges.map((range) => (
        <button
          type="button"
          key={range}
          className={
            value === range
              ? 'fo-range-button fo-range-active'
              : 'fo-range-button'
          }
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function FinancialOverview({
  data = [],
  financialData,
  title = 'Financial Overview',
  subtitle = 'Comprehensive cash-flow intelligence across your financial activity',
  period = 'Monthly',
  loading = false,
  error = false,
  onRefresh,
  onPeriodChange,
  onViewDetails,
  className = '',
}) {
  const [selectedPeriod, setSelectedPeriod] =
    useState(period);

  const [range, setRange] =
    useState('12M');

  const [chartView, setChartView] =
    useState('trend');

  const [showMetrics, setShowMetrics] =
    useState(true);

  const [fullscreen, setFullscreen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [hideAmounts, setHideAmounts] =
    useState(false);

  const chartRef = useRef(null);

  const sourceData =
    financialData || data;

  const chartData = useMemo(
    () => normalizeData(sourceData),
    [sourceData],
  );

  const visibleData = useMemo(() => {
    if (!chartData.length) {
      return [];
    }

    if (range === '6M') {
      return chartData.slice(-6);
    }

    if (range === '24M') {
      return chartData.slice(-24);
    }

    return chartData.slice(-12);
  }, [chartData, range]);

  const totals = useMemo(() => {
    const income = visibleData.reduce(
      (sum, item) =>
        sum + getNumber(item.income),
      0,
    );

    const expense = visibleData.reduce(
      (sum, item) =>
        sum + getNumber(item.expense),
      0,
    );

    const savings = income - expense;

    const savingsRate =
      income > 0
        ? (savings / income) * 100
        : 0;

    const previous = visibleData.length
      ? visibleData
          .slice(
            0,
            Math.max(
              0,
              visibleData.length - 1,
            ),
          )
          .at(-1)
      : null;

    const current = visibleData.at(-1);

    const incomeChange =
      current && previous
        ? calculateChange(
            current.income,
            previous.income,
          )
        : 0;

    const expenseChange =
      current && previous
        ? calculateChange(
            current.expense,
            previous.expense,
          )
        : 0;

    const savingsChange =
      current && previous
        ? calculateChange(
            current.savings,
            previous.savings,
          )
        : 0;

    return {
      income,
      expense,
      savings,
      savingsRate,
      incomeChange,
      expenseChange,
      savingsChange,
      current,
      previous,
    };
  }, [visibleData]);

  const averageMonthlyIncome =
    visibleData.length > 0
      ? totals.income / visibleData.length
      : 0;

  const averageMonthlyExpense =
    visibleData.length > 0
      ? totals.expense / visibleData.length
      : 0;

  const highestIncome = useMemo(
    () =>
      visibleData.reduce(
        (best, item) =>
          item.income > best.income
            ? item
            : best,
        {
          income: 0,
          period: '—',
        },
      ),
    [visibleData],
  );

  const highestExpense = useMemo(
    () =>
      visibleData.reduce(
        (best, item) =>
          item.expense > best.expense
            ? item
            : best,
        {
          expense: 0,
          period: '—',
        },
      ),
    [visibleData],
  );

  const strongestSavingPeriod =
    useMemo(
      () =>
        visibleData.reduce(
          (best, item) =>
            item.savings > best.savings
              ? item
              : best,
          {
            savings: 0,
            period: '—',
          },
        ),
      [visibleData],
    );

  const insights = useMemo(() => {
    if (!visibleData.length) {
      return [];
    }

    const results = [];

    if (totals.savingsRate >= 30) {
      results.push({
        icon: ShieldCheck,
        tone: 'green',
        title: 'Strong savings discipline',
        text: `Your average savings rate is ${formatPercent(
          totals.savingsRate,
        )}.`,
      });
    } else if (totals.savingsRate >= 15) {
      results.push({
        icon: TrendingUp,
        tone: 'blue',
        title: 'Healthy cash generation',
        text: `You are retaining approximately ${formatPercent(
          totals.savingsRate,
        )} of income.`,
      });
    } else if (totals.savingsRate >= 0) {
      results.push({
        icon: Gauge,
        tone: 'amber',
        title: 'Savings opportunity',
        text: 'Your current cash retention leaves room for improvement.',
      });
    } else {
      results.push({
        icon: TrendingDown,
        tone: 'red',
        title: 'Negative cash flow',
        text: 'Expenses are currently exceeding income.',
      });
    }

    if (
      totals.expense > totals.income * 0.8
    ) {
      results.push({
        icon: Activity,
        tone: 'amber',
        title: 'High expense pressure',
        text: 'Expenses are consuming a large portion of incoming cash.',
      });
    }

    if (
      totals.incomeChange > 10
    ) {
      results.push({
        icon: ArrowUpRight,
        tone: 'green',
        title: 'Income momentum',
        text: 'Income is trending upward versus the previous period.',
      });
    }

    if (
      totals.expenseChange > 15
    ) {
      results.push({
        icon: ArrowDownRight,
        tone: 'red',
        title: 'Expense acceleration',
        text: 'Recent spending is increasing faster than the previous period.',
      });
    }

    return results.slice(0, 3);
  }, [
    visibleData,
    totals,
  ]);

  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
    onPeriodChange?.(value);
  };

  const handleExport = () => {
    downloadCsv(visibleData);
    setMenuOpen(false);
  };

  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await chartRef.current?.requestFullscreen?.();
        setFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setFullscreen(false);
      }
    } catch {
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const listener = () => {
      setFullscreen(
        Boolean(document.fullscreenElement),
      );
    };

    document.addEventListener(
      'fullscreenchange',
      listener,
    );

    return () =>
      document.removeEventListener(
        'fullscreenchange',
        listener,
      );
  }, []);

  const wrapperClass = [
    'fo-shell',
    fullscreen ? 'fo-fullscreen' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      ref={chartRef}
      className={wrapperClass}
    >
      <style>{`
        .fo-shell {
          --fo-blue: #60a5fa;
          --fo-cyan: #22d3ee;
          --fo-green: #34d399;
          --fo-red: #fb7185;
          --fo-amber: #fbbf24;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,.13);
          border-radius: 28px;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(59,130,246,.075),
              transparent 30%
            ),
            radial-gradient(
              circle at 0% 100%,
              rgba(16,185,129,.035),
              transparent 28%
            ),
            linear-gradient(
              145deg,
              rgba(15,23,42,.92),
              rgba(15,23,42,.72)
            );
          box-shadow:
            0 25px 80px rgba(0,0,0,.16),
            inset 0 1px 0 rgba(255,255,255,.035);
          color:#e2e8f0;
        }

        .fo-shell::before {
          content:"";
          position:absolute;
          top:0;
          left:7%;
          right:7%;
          height:1px;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(96,165,250,.55),
              rgba(34,211,238,.35),
              transparent
            );
          pointer-events:none;
        }

        .fo-shell.fo-fullscreen {
          min-height:100vh;
          border-radius:0;
          overflow:auto;
          background:#020617;
        }

        .fo-content {
          position:relative;
          z-index:1;
          padding:24px;
        }

        .fo-header {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:20px;
          margin-bottom:20px;
        }

        .fo-heading {
          display:flex;
          align-items:flex-start;
          gap:14px;
          min-width:0;
        }

        .fo-heading-icon {
          position:relative;
          width:48px;
          height:48px;
          flex:0 0 48px;
          display:grid;
          place-items:center;
          border:1px solid rgba(96,165,250,.17);
          border-radius:15px;
          color:var(--fo-blue);
          background:
            linear-gradient(
              145deg,
              rgba(96,165,250,.13),
              rgba(34,211,238,.055)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 8px 25px rgba(37,99,235,.08);
        }

        .fo-heading-icon::after {
          content:"";
          position:absolute;
          inset:-5px;
          border:1px solid rgba(96,165,250,.06);
          border-radius:18px;
          pointer-events:none;
        }

        .fo-heading-copy {
          min-width:0;
        }

        .fo-eyebrow {
          display:flex;
          align-items:center;
          gap:7px;
          margin-bottom:4px;
          color:#64748b;
          font-size:9px;
          font-weight:800;
          letter-spacing:.11em;
          text-transform:uppercase;
        }

        .fo-live-dot {
          width:6px;
          height:6px;
          border-radius:50%;
          background:#34d399;
          box-shadow:0 0 0 4px rgba(52,211,153,.08);
          animation:fo-pulse 2s infinite;
        }

        .fo-title {
          margin:0;
          color:#f8fafc;
          font-size:clamp(18px,2vw,22px);
          line-height:1.15;
          font-weight:850;
          letter-spacing:-.035em;
        }

        .fo-subtitle {
          max-width:650px;
          margin:6px 0 0;
          color:#64748b;
          font-size:11px;
          line-height:1.5;
        }

        .fo-header-actions {
          display:flex;
          align-items:center;
          gap:8px;
          flex-wrap:wrap;
          justify-content:flex-end;
        }

        .fo-period-control {
          position:relative;
        }

        .fo-period-select {
          height:36px;
          min-width:108px;
          padding:0 31px 0 11px;
          border:1px solid rgba(148,163,184,.13);
          border-radius:10px;
          outline:none;
          appearance:none;
          color:#cbd5e1;
          background:rgba(15,23,42,.8);
          font-size:10px;
          font-weight:700;
          cursor:pointer;
        }

        .fo-period-chevron {
          position:absolute;
          top:50%;
          right:9px;
          transform:translateY(-50%);
          color:#64748b;
          pointer-events:none;
        }

        .fo-icon-button {
          width:36px;
          height:36px;
          display:grid;
          place-items:center;
          border:1px solid rgba(148,163,184,.12);
          border-radius:10px;
          color:#94a3b8;
          background:rgba(148,163,184,.035);
          cursor:pointer;
          transition:
            color .15s ease,
            background .15s ease,
            border-color .15s ease;
        }

        .fo-icon-button:hover {
          color:#f8fafc;
          border-color:rgba(96,165,250,.2);
          background:rgba(96,165,250,.06);
        }

        .fo-menu-wrap {
          position:relative;
        }

        .fo-menu {
          position:absolute;
          z-index:30;
          top:42px;
          right:0;
          width:190px;
          padding:6px;
          border:1px solid rgba(148,163,184,.15);
          border-radius:13px;
          background:rgba(15,23,42,.98);
          box-shadow:0 20px 50px rgba(0,0,0,.3);
        }

        .fo-menu-item {
          width:100%;
          display:flex;
          align-items:center;
          gap:9px;
          padding:9px;
          border:0;
          border-radius:8px;
          color:#94a3b8;
          background:transparent;
          text-align:left;
          font-size:10px;
          font-weight:650;
          cursor:pointer;
        }

        .fo-menu-item:hover {
          color:#f8fafc;
          background:rgba(148,163,184,.07);
        }

        .fo-metrics {
          display:grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap:10px;
          margin-bottom:15px;
        }

        .fo-metric {
          position:relative;
          min-width:0;
          overflow:hidden;
          padding:14px;
          border:1px solid rgba(148,163,184,.09);
          border-radius:16px;
          background:
            linear-gradient(
              145deg,
              rgba(148,163,184,.035),
              rgba(15,23,42,.18)
            );
        }

        .fo-metric::before {
          content:"";
          position:absolute;
          top:0;
          left:16px;
          right:16px;
          height:1px;
          background:currentColor;
          opacity:.18;
        }

        .fo-tone-blue {
          color:var(--fo-blue);
        }

        .fo-tone-green {
          color:var(--fo-green);
        }

        .fo-tone-red {
          color:var(--fo-red);
        }

        .fo-tone-cyan {
          color:var(--fo-cyan);
        }

        .fo-metric-top {
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:9px;
        }

        .fo-metric-icon {
          width:31px;
          height:31px;
          display:grid;
          place-items:center;
          border-radius:9px;
          background:rgba(255,255,255,.025);
          border:1px solid currentColor;
          opacity:.9;
        }

        .fo-visibility {
          width:26px;
          height:26px;
          display:grid;
          place-items:center;
          border:0;
          border-radius:7px;
          color:#475569;
          background:transparent;
          cursor:pointer;
        }

        .fo-visibility:hover {
          color:#cbd5e1;
          background:rgba(148,163,184,.06);
        }

        .fo-metric-label {
          color:#64748b;
          font-size:9px;
          font-weight:750;
          letter-spacing:.07em;
          text-transform:uppercase;
        }

        .fo-metric-value {
          overflow:hidden;
          margin-top:4px;
          color:#f8fafc;
          font-size:clamp(17px,2vw,22px);
          font-weight:850;
          letter-spacing:-.035em;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .fo-hidden-value {
          color:#64748b;
          letter-spacing:.12em;
        }

        .fo-metric-bottom {
          min-height:28px;
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:8px;
          margin-top:8px;
        }

        .fo-mini-chart {
          width:88px;
          height:29px;
          opacity:.7;
        }

        .fo-mini-svg {
          width:100%;
          height:100%;
          overflow:visible;
        }

        .fo-mini-positive {
          color:#34d399;
        }

        .fo-mini-negative {
          color:#fb7185;
        }

        .fo-mini-empty {
          height:100%;
          display:flex;
          align-items:flex-end;
          gap:4px;
          opacity:.2;
        }

        .fo-mini-empty span {
          width:5px;
          border-radius:99px;
          background:currentColor;
        }

        .fo-mini-empty span:nth-child(1) {
          height:35%;
        }

        .fo-mini-empty span:nth-child(2) {
          height:58%;
        }

        .fo-mini-empty span:nth-child(3) {
          height:44%;
        }

        .fo-mini-empty span:nth-child(4) {
          height:76%;
        }

        .fo-mini-empty span:nth-child(5) {
          height:63%;
        }

        .fo-trend {
          display:flex;
          align-items:center;
          gap:3px;
          color:#64748b;
          font-size:8px;
          white-space:nowrap;
        }

        .fo-trend strong {
          font-size:9px;
        }

        .fo-trend-positive {
          color:#4ade80;
        }

        .fo-trend-negative {
          color:#fb7185;
        }

        .fo-workspace {
          position:relative;
          overflow:hidden;
          border:1px solid rgba(148,163,184,.1);
          border-radius:20px;
          background:
            linear-gradient(
              180deg,
              rgba(2,6,23,.26),
              rgba(15,23,42,.16)
            );
        }

        .fo-workspace-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:14px;
          padding:14px 15px;
          border-bottom:1px solid rgba(148,163,184,.08);
        }

        .fo-workspace-title {
          display:flex;
          align-items:center;
          gap:8px;
          color:#cbd5e1;
          font-size:10px;
          font-weight:800;
        }

        .fo-workspace-title-icon {
          color:#60a5fa;
        }

        .fo-workspace-controls {
          display:flex;
          align-items:center;
          gap:7px;
          flex-wrap:wrap;
          justify-content:flex-end;
        }

        .fo-view-selector,
        .fo-range {
          display:flex;
          align-items:center;
          padding:2px;
          border:1px solid rgba(148,163,184,.09);
          border-radius:9px;
          background:rgba(148,163,184,.025);
        }

        .fo-view-button,
        .fo-range-button {
          height:27px;
          display:flex;
          align-items:center;
          gap:5px;
          padding:0 8px;
          border:0;
          border-radius:7px;
          color:#64748b;
          background:transparent;
          font-size:8px;
          font-weight:750;
          cursor:pointer;
          transition:all .15s ease;
        }

        .fo-view-button:hover,
        .fo-range-button:hover {
          color:#cbd5e1;
        }

        .fo-view-active,
        .fo-range-active {
          color:#e2e8f0;
          background:rgba(96,165,250,.1);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
        }

        .fo-chart-area {
          height:370px;
          padding:16px 13px 5px 0;
        }

        .fo-chart-loading {
          height:100%;
          display:flex;
          flex-direction:column;
          justify-content:center;
          gap:14px;
          padding:30px;
        }

        .fo-loading-line {
          height:8px;
          overflow:hidden;
          border-radius:99px;
          background:rgba(148,163,184,.07);
          position:relative;
        }

        .fo-loading-line::after {
          content:"";
          position:absolute;
          inset:0;
          transform:translateX(-100%);
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.07),
              transparent
            );
          animation:fo-shimmer 1.5s infinite;
        }

        .fo-loading-large {
          height:220px;
        }

        .fo-empty-chart {
          height:100%;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          color:#475569;
          text-align:center;
        }

        .fo-empty-icon {
          width:52px;
          height:52px;
          display:grid;
          place-items:center;
          margin-bottom:10px;
          border:1px solid rgba(148,163,184,.08);
          border-radius:15px;
          background:rgba(148,163,184,.025);
        }

        .fo-empty-title {
          color:#94a3b8;
          font-size:11px;
          font-weight:750;
        }

        .fo-empty-text {
          max-width:300px;
          margin-top:5px;
          color:#475569;
          font-size:9px;
          line-height:1.5;
        }

        .fo-bottom-grid {
          display:grid;
          grid-template-columns:
            minmax(0,1.3fr)
            minmax(250px,.7fr);
          gap:10px;
          margin-top:10px;
        }

        .fo-insights {
          min-width:0;
          padding:14px;
          border:1px solid rgba(148,163,184,.08);
          border-radius:16px;
          background:rgba(148,163,184,.018);
        }

        .fo-section-heading {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-bottom:10px;
        }

        .fo-section-title {
          display:flex;
          align-items:center;
          gap:7px;
          color:#94a3b8;
          font-size:9px;
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:.07em;
        }

        .fo-section-title svg {
          color:#a78bfa;
        }

        .fo-insight-list {
          display:grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap:7px;
        }

        .fo-insight {
          min-width:0;
          padding:10px;
          border:1px solid rgba(148,163,184,.07);
          border-radius:11px;
          background:rgba(15,23,42,.25);
        }

        .fo-insight-icon {
          width:25px;
          height:25px;
          display:grid;
          place-items:center;
          margin-bottom:7px;
          border-radius:8px;
        }

        .fo-insight-green .fo-insight-icon {
          color:#4ade80;
          background:rgba(34,197,94,.08);
        }

        .fo-insight-blue .fo-insight-icon {
          color:#60a5fa;
          background:rgba(59,130,246,.08);
        }

        .fo-insight-amber .fo-insight-icon {
          color:#fbbf24;
          background:rgba(245,158,11,.08);
        }

        .fo-insight-red .fo-insight-icon {
          color:#fb7185;
          background:rgba(239,68,68,.08);
        }

        .fo-insight-title {
          overflow:hidden;
          color:#cbd5e1;
          font-size:9px;
          font-weight:750;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .fo-insight-text {
          margin-top:4px;
          color:#64748b;
          font-size:8px;
          line-height:1.45;
        }

        .fo-highlights {
          padding:14px;
          border:1px solid rgba(148,163,184,.08);
          border-radius:16px;
          background:rgba(148,163,184,.018);
        }

        .fo-highlight-list {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:7px;
        }

        .fo-highlight {
          padding:9px;
          border:1px solid rgba(148,163,184,.06);
          border-radius:10px;
          background:rgba(15,23,42,.25);
        }

        .fo-highlight-label {
          color:#64748b;
          font-size:8px;
        }

        .fo-highlight-value {
          display:block;
          margin-top:3px;
          color:#e2e8f0;
          font-size:10px;
          font-weight:800;
        }

        .fo-highlight-period {
          display:block;
          margin-top:2px;
          color:#475569;
          font-size:7px;
        }

        .fo-footer {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:15px;
          margin-top:10px;
          padding:9px 2px 0;
          color:#475569;
          font-size:8px;
        }

        .fo-footer-left,
        .fo-footer-right {
          display:flex;
          align-items:center;
          gap:6px;
        }

        .fo-positive-text {
          color:#4ade80 !important;
        }

        .fo-negative-text {
          color:#fb7185 !important;
        }

        .fo-tooltip {
          min-width:210px;
          padding:13px;
          border:1px solid rgba(148,163,184,.16);
          border-radius:14px;
          background:rgba(2,6,23,.97);
          box-shadow:
            0 20px 60px rgba(0,0,0,.38),
            inset 0 1px 0 rgba(255,255,255,.035);
          backdrop-filter:blur(14px);
        }

        .fo-tooltip-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding-bottom:9px;
          margin-bottom:8px;
          border-bottom:1px solid rgba(148,163,184,.08);
        }

        .fo-tooltip-period {
          color:#f8fafc;
          font-size:10px;
          font-weight:800;
        }

        .fo-tooltip-status {
          display:flex;
          align-items:center;
          gap:5px;
          color:#475569;
          font-size:7px;
          text-transform:uppercase;
          letter-spacing:.05em;
        }

        .fo-tooltip-status span {
          width:5px;
          height:5px;
          border-radius:50%;
          background:#34d399;
        }

        .fo-tooltip-row {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
          margin-top:8px;
          color:#64748b;
          font-size:9px;
        }

        .fo-tooltip-row strong {
          color:#cbd5e1;
          font-size:9px;
        }

        .fo-tooltip-label {
          display:flex;
          align-items:center;
          gap:7px;
        }

        .fo-tooltip-dot {
          width:6px;
          height:6px;
          border-radius:50%;
        }

        .fo-dot-income {
          background:#34d399;
        }

        .fo-dot-expense {
          background:#60a5fa;
        }

        .fo-dot-net {
          background:#a78bfa;
        }

        .fo-tooltip-divider {
          height:1px;
          margin-top:10px;
          background:rgba(148,163,184,.08);
        }

        .fo-tooltip-net {
          margin-top:9px;
        }

        .fo-error {
          display:flex;
          align-items:center;
          justify-content:center;
          min-height:330px;
          padding:25px;
          color:#64748b;
          text-align:center;
        }

        .fo-error-box {
          max-width:360px;
        }

        .fo-error-icon {
          width:48px;
          height:48px;
          display:grid;
          place-items:center;
          margin:0 auto 10px;
          border-radius:14px;
          color:#fb7185;
          background:rgba(239,68,68,.08);
        }

        .fo-error-title {
          color:#cbd5e1;
          font-size:11px;
          font-weight:750;
        }

        .fo-error-text {
          margin-top:5px;
          color:#475569;
          font-size:9px;
        }

        .fo-retry {
          display:inline-flex;
          align-items:center;
          gap:6px;
          margin-top:12px;
          padding:8px 11px;
          border:1px solid rgba(148,163,184,.12);
          border-radius:9px;
          color:#94a3b8;
          background:rgba(148,163,184,.04);
          font-size:9px;
          font-weight:700;
          cursor:pointer;
        }

        .fo-retry:hover {
          color:#f8fafc;
        }

        @keyframes fo-pulse {
          0%,100% {
            box-shadow:
              0 0 0 0 rgba(52,211,153,.18);
          }
          50% {
            box-shadow:
              0 0 0 5px rgba(52,211,153,0);
          }
        }

        @keyframes fo-shimmer {
          100% {
            transform:translateX(100%);
          }
        }

        @media(max-width:1100px) {
          .fo-metrics {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

          .fo-bottom-grid {
            grid-template-columns:1fr;
          }
        }

        @media(max-width:760px) {
          .fo-content {
            padding:16px;
          }

          .fo-header {
            flex-direction:column;
          }

          .fo-header-actions {
            width:100%;
            justify-content:flex-start;
          }

          .fo-period-control {
            flex:1;
          }

          .fo-period-select {
            width:100%;
          }

          .fo-workspace-header {
            align-items:flex-start;
            flex-direction:column;
          }

          .fo-workspace-controls {
            width:100%;
            justify-content:flex-start;
          }

          .fo-chart-area {
            height:300px;
          }

          .fo-insight-list {
            grid-template-columns:1fr;
          }
        }

        @media(max-width:500px) {
          .fo-content {
            padding:12px;
          }

          .fo-heading-icon {
            width:42px;
            height:42px;
            flex-basis:42px;
          }

          .fo-metrics {
            grid-template-columns:1fr 1fr;
          }

          .fo-metric {
            padding:11px;
          }

          .fo-metric-bottom {
            display:block;
          }

          .fo-mini-chart {
            width:100%;
            margin-top:6px;
          }

          .fo-trend {
            margin-top:5px;
          }

          .fo-view-selector,
          .fo-range {
            width:100%;
          }

          .fo-view-button,
          .fo-range-button {
            flex:1;
            justify-content:center;
          }

          .fo-highlight-list {
            grid-template-columns:1fr;
          }
        }

        @media(prefers-reduced-motion:reduce) {
          .fo-live-dot,
          .fo-loading-line::after {
            animation:none !important;
          }
        }
      `}</style>

      <div className="fo-content">

        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <header className="fo-header">
          <div className="fo-heading">
            <div className="fo-heading-icon">
              <Activity
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <div className="fo-heading-copy">
              <div className="fo-eyebrow">
                <span className="fo-live-dot" />
                Financial intelligence
              </div>

              <h2 className="fo-title">
                {title}
              </h2>

              <p className="fo-subtitle">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="fo-header-actions">

            <div className="fo-period-control">
              <select
                className="fo-period-select"
                value={selectedPeriod}
                onChange={(event) =>
                  handlePeriodChange(
                    event.target.value,
                  )
                }
                aria-label="Financial period"
              >
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
                className="fo-period-chevron"
                size={13}
              />
            </div>

            <button
              type="button"
              className="fo-icon-button"
              onClick={() =>
                setHideAmounts(
                  (current) => !current,
                )
              }
              aria-label="Toggle financial amounts"
            >
              {hideAmounts ? (
                <EyeOff size={15} />
              ) : (
                <Eye size={15} />
              )}
            </button>

            <button
              type="button"
              className="fo-icon-button"
              onClick={onRefresh}
              aria-label="Refresh financial overview"
            >
              <RefreshCw size={15} />
            </button>

            <div className="fo-menu-wrap">
              <button
                type="button"
                className="fo-icon-button"
                onClick={() =>
                  setMenuOpen(
                    (current) => !current,
                  )
                }
                aria-label="Financial overview actions"
              >
                <MoreHorizontal size={16} />
              </button>

              {menuOpen && (
                <div className="fo-menu">
                  <button
                    type="button"
                    className="fo-menu-item"
                    onClick={handleExport}
                  >
                    <Download size={13} />
                    Export financial data
                  </button>

                  <button
                    type="button"
                    className="fo-menu-item"
                    onClick={() => {
                      setShowMetrics(
                        (current) =>
                          !current,
                      );
                      setMenuOpen(false);
                    }}
                  >
                    <Layers3 size={13} />
                    Toggle metric cards
                  </button>

                  <button
                    type="button"
                    className="fo-menu-item"
                    onClick={() => {
                      handleFullscreen();
                      setMenuOpen(false);
                    }}
                  >
                    <Maximize2 size={13} />
                    Fullscreen analytics
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* KPI matrix                                                       */}
        {/* ---------------------------------------------------------------- */}

        {showMetrics && (
          <div className="fo-metrics">

            <MetricBlock
              label="Total Income"
              icon={ArrowUpRight}
              tone="green"
              value={
                hideAmounts ? (
                  <span className="fo-hidden-value">
                    •••••••
                  </span>
                ) : (
                  <AnimatedNumber
                    value={totals.income}
                  />
                )
              }
              trend={totals.incomeChange}
              trendLabel="vs prior"
              sparkline={visibleData.map(
                (item) => item.income,
              )}
              hidden={hideAmounts}
              onToggle={() =>
                setHideAmounts(
                  (current) => !current,
                )
              }
            />

            <MetricBlock
              label="Total Expenses"
              icon={ArrowDownRight}
              tone="red"
              value={
                hideAmounts ? (
                  <span className="fo-hidden-value">
                    •••••••
                  </span>
                ) : (
                  <AnimatedNumber
                    value={totals.expense}
                  />
                )
              }
              trend={-totals.expenseChange}
              trendLabel="vs prior"
              sparkline={visibleData.map(
                (item) => item.expense,
              )}
              hidden={hideAmounts}
              onToggle={() =>
                setHideAmounts(
                  (current) => !current,
                )
              }
            />

            <MetricBlock
              label="Net Cash Flow"
              icon={Wallet}
              tone={
                totals.savings >= 0
                  ? 'blue'
                  : 'red'
              }
              value={
                hideAmounts ? (
                  <span className="fo-hidden-value">
                    •••••••
                  </span>
                ) : (
                  <AnimatedNumber
                    value={totals.savings}
                  />
                )
              }
              trend={totals.savingsChange}
              trendLabel="vs prior"
              sparkline={visibleData.map(
                (item) => item.savings,
              )}
              hidden={hideAmounts}
              onToggle={() =>
                setHideAmounts(
                  (current) => !current,
                )
              }
            />

            <MetricBlock
              label="Savings Rate"
              icon={CircleDollarSign}
              tone="cyan"
              value={
                <AnimatedNumber
                  value={totals.savingsRate}
                  formatter={(number) =>
                    formatPercent(number)
                  }
                />
              }
              trend={
                totals.savingsRate
              }
              trendLabel="retention"
              sparkline={visibleData.map(
                (item) =>
                  item.savingsRate,
              )}
            />

          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Main analytical workspace                                        */}
        {/* ---------------------------------------------------------------- */}

        <div className="fo-workspace">

          <div className="fo-workspace-header">

            <div className="fo-workspace-title">
              <BarChart3
                size={14}
                className="fo-workspace-title-icon"
              />

              Cash-flow trajectory
            </div>

            <div className="fo-workspace-controls">

              <ViewSelector
                value={chartView}
                onChange={setChartView}
              />

              <RangeNavigator
                value={range}
                onChange={setRange}
              />

              <button
                type="button"
                className="fo-icon-button"
                style={{
                  width: 31,
                  height: 31,
                }}
                onClick={handleFullscreen}
                aria-label="Fullscreen chart"
              >
                {fullscreen ? (
                  <X size={13} />
                ) : (
                  <Maximize2 size={13} />
                )}
              </button>

            </div>
          </div>

          <div className="fo-chart-area">

            {loading ? (
              <div className="fo-chart-loading">
                <div className="fo-loading-line" />
                <div className="fo-loading-line fo-loading-large" />
                <div
                  className="fo-loading-line"
                  style={{ width: '70%' }}
                />
              </div>
            ) : error ? (
              <div className="fo-error">
                <div className="fo-error-box">

                  <div className="fo-error-icon">
                    <Activity size={20} />
                  </div>

                  <div className="fo-error-title">
                    Financial data unavailable
                  </div>

                  <div className="fo-error-text">
                    FinSight could not load the
                    financial overview data.
                  </div>

                  {onRefresh && (
                    <button
                      type="button"
                      className="fo-retry"
                      onClick={onRefresh}
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  )}

                </div>
              </div>
            ) : !visibleData.length ? (
              <div className="fo-empty-chart">

                <div className="fo-empty-icon">
                  <BarChart3 size={21} />
                </div>

                <div className="fo-empty-title">
                  No financial history available
                </div>

                <div className="fo-empty-text">
                  Once your PostgreSQL financial
                  records contain activity, FinSight
                  will visualize the cash-flow trajectory
                  here.
                </div>

              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                {chartView === 'trend' ? (
                  <ComposedChart
                    data={visibleData}
                    margin={{
                      top: 12,
                      right: 16,
                      left: 8,
                      bottom: 4,
                    }}
                  >

                    <defs>

                      <linearGradient
                        id="fo-income-gradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopOpacity=".24"
                        />

                        <stop
                          offset="55%"
                          stopOpacity=".07"
                        />

                        <stop
                          offset="100%"
                          stopOpacity="0"
                        />
                      </linearGradient>

                      <linearGradient
                        id="fo-expense-gradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopOpacity=".18"
                        />

                        <stop
                          offset="55%"
                          stopOpacity=".045"
                        />

                        <stop
                          offset="100%"
                          stopOpacity="0"
                        />
                      </linearGradient>

                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(148,163,184,.065)"
                      strokeDasharray="3 5"
                    />

                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill:'#475569',
                        fontSize:9,
                      }}
                      tickFormatter={(value) =>
                        shortLabel(value, 9)
                      }
                      dy={8}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={55}
                      tick={{
                        fill:'#475569',
                        fontSize:9,
                      }}
                      tickFormatter={
                        formatCompactCurrency
                      }
                    />

                    <Tooltip
                      cursor={{
                        stroke:
                          'rgba(148,163,184,.16)',
                        strokeWidth:1,
                        strokeDasharray:'4 4',
                      }}
                      content={
                        <FinancialTooltip />
                      }
                    />

                    <ReferenceLine
                      y={0}
                      stroke="rgba(148,163,184,.14)"
                    />

                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#34d399"
                      strokeWidth={2.4}
                      fill="url(#fo-income-gradient)"
                      dot={false}
                      activeDot={{
                        r:4,
                        strokeWidth:2,
                        stroke:'#0f172a',
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expenses"
                      stroke="#60a5fa"
                      strokeWidth={2.4}
                      fill="url(#fo-expense-gradient)"
                      dot={false}
                      activeDot={{
                        r:4,
                        strokeWidth:2,
                        stroke:'#0f172a',
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="savings"
                      name="Net Cash Flow"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                    />

                  </ComposedChart>
                ) : (
                  <BarChart
                    data={visibleData}
                    margin={{
                      top: 12,
                      right: 16,
                      left: 8,
                      bottom: 4,
                    }}
                  >

                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(148,163,184,.065)"
                      strokeDasharray="3 5"
                    />

                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill:'#475569',
                        fontSize:9,
                      }}
                      tickFormatter={(value) =>
                        shortLabel(value, 9)
                      }
                      dy={8}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={55}
                      tick={{
                        fill:'#475569',
                        fontSize:9,
                      }}
                      tickFormatter={
                        formatCompactCurrency
                      }
                    />

                    <Tooltip
                      cursor={{
                        fill:'rgba(148,163,184,.035)',
                      }}
                      content={
                        <FinancialTooltip />
                      }
                    />

                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#34d399"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                      maxBarSize={20}
                    />

                    <Bar
                      dataKey="expense"
                      name="Expenses"
                      fill="#60a5fa"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                      maxBarSize={20}
                    />

                  </BarChart>
                )}
              </ResponsiveContainer>
            )}

          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Intelligence panels                                              */}
        {/* ---------------------------------------------------------------- */}

        <div className="fo-bottom-grid">

          <div className="fo-insights">

            <div className="fo-section-heading">
              <div className="fo-section-title">
                <Sparkles size={12} />
                Financial intelligence
              </div>

              <span
                style={{
                  color:'#475569',
                  fontSize:8,
                }}
              >
                Derived from current data
              </span>
            </div>

            {insights.length ? (
              <div className="fo-insight-list">

                {insights.map(
                  (insight, index) => {
                    const Icon =
                      insight.icon;

                    return (
                      <div
                        className={`fo-insight fo-insight-${insight.tone}`}
                        key={`${insight.title}-${index}`}
                      >
                        <div className="fo-insight-icon">
                          <Icon size={13} />
                        </div>

                        <div className="fo-insight-title">
                          {insight.title}
                        </div>

                        <div className="fo-insight-text">
                          {insight.text}
                        </div>
                      </div>
                    );
                  },
                )}

              </div>
            ) : (
              <div
                style={{
                  padding:'20px 0',
                  color:'#475569',
                  fontSize:9,
                }}
              >
                Financial insights will appear
                when sufficient transaction history
                is available.
              </div>
            )}

          </div>

          <div className="fo-highlights">

            <div className="fo-section-heading">
              <div className="fo-section-title">
                <Zap size={12} />
                Key signals
              </div>
            </div>

            <div className="fo-highlight-list">

              <div className="fo-highlight">
                <span className="fo-highlight-label">
                  Avg. monthly income
                </span>

                <strong className="fo-highlight-value">
                  {hideAmounts
                    ? '••••••'
                    : formatCompactCurrency(
                        averageMonthlyIncome,
                      )}
                </strong>

                <span className="fo-highlight-period">
                  {visibleData.length}{' '}
                  periods
                </span>
              </div>

              <div className="fo-highlight">
                <span className="fo-highlight-label">
                  Avg. monthly expense
                </span>

                <strong className="fo-highlight-value">
                  {hideAmounts
                    ? '••••••'
                    : formatCompactCurrency(
                        averageMonthlyExpense,
                      )}
                </strong>

                <span className="fo-highlight-period">
                  Spending baseline
                </span>
              </div>

              <div className="fo-highlight">
                <span className="fo-highlight-label">
                  Highest income
                </span>

                <strong className="fo-highlight-value">
                  {hideAmounts
                    ? '••••••'
                    : formatCompactCurrency(
                        highestIncome.income,
                      )}
                </strong>

                <span className="fo-highlight-period">
                  {highestIncome.period}
                </span>
              </div>

              <div className="fo-highlight">
                <span className="fo-highlight-label">
                  Highest expense
                </span>

                <strong className="fo-highlight-value">
                  {hideAmounts
                    ? '••••••'
                    : formatCompactCurrency(
                        highestExpense.expense,
                      )}
                </strong>

                <span className="fo-highlight-period">
                  {highestExpense.period}
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer intelligence bar                                          */}
        {/* ---------------------------------------------------------------- */}

        <footer className="fo-footer">

          <div className="fo-footer-left">
            <Clock3 size={10} />

            <span>
              Viewing {selectedPeriod.toLowerCase()}{' '}
              financial intelligence
            </span>
          </div>

          <div className="fo-footer-right">

            <span>
              {visibleData.length} periods analyzed
            </span>

            <span>•</span>

            <span>
              Savings rate{' '}
              <strong
                className={
                  totals.savingsRate >= 0
                    ? 'fo-positive-text'
                    : 'fo-negative-text'
                }
              >
                {formatPercent(
                  totals.savingsRate,
                )}
              </strong>
            </span>

          </div>

        </footer>

      </div>
    </section>
  );
}