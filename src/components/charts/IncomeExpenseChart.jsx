import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DEFAULT_DATA = [
  { month: 'Jan', income: 0, expenses: 0 },
  { month: 'Feb', income: 0, expenses: 0 },
  { month: 'Mar', income: 0, expenses: 0 },
  { month: 'Apr', income: 0, expenses: 0 },
  { month: 'May', income: 0, expenses: 0 },
  { month: 'Jun', income: 0, expenses: 0 },
];

const formatAmount = (value) => {
  const amount = Number(value) || 0;

  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(amount)}`;
};

const formatFullAmount = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const normalizeData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return DEFAULT_DATA;
  }

  return data.map((item, index) => ({
    month:
      item.month ||
      item.label ||
      item.period ||
      item.name ||
      `Period ${index + 1}`,
    income: Number(
      item.income ??
        item.totalIncome ??
        item.total_income ??
        item.earnings ??
        0,
    ),
    expenses: Number(
      item.expenses ??
        item.expense ??
        item.totalExpenses ??
        item.total_expenses ??
        item.spending ??
        0,
    ),
  }));
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const income =
    payload.find((item) => item.dataKey === 'income')?.value ?? 0;

  const expenses =
    payload.find((item) => item.dataKey === 'expenses')?.value ?? 0;

  const savings = Number(income) - Number(expenses);

  return (
    <div className="fs-ie-tooltip">
      <div className="fs-ie-tooltip-title">
        <span>{label}</span>
        <CalendarDays size={12} />
      </div>

      <div className="fs-ie-tooltip-row">
        <span>
          <i className="income-dot" />
          Income
        </span>
        <strong>{formatFullAmount(income)}</strong>
      </div>

      <div className="fs-ie-tooltip-row">
        <span>
          <i className="expense-dot" />
          Expenses
        </span>
        <strong>{formatFullAmount(expenses)}</strong>
      </div>

      <div className="fs-ie-tooltip-divider" />

      <div className="fs-ie-tooltip-saving">
        <span>Net savings</span>
        <strong className={savings >= 0 ? 'positive' : 'negative'}>
          {formatFullAmount(savings)}
        </strong>
      </div>
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="fs-ie-legend">
    {payload?.map((item) => (
      <div className="fs-ie-legend-item" key={item.dataKey}>
        <span
          className={`fs-ie-legend-dot ${
            item.dataKey === 'income' ? 'income' : 'expenses'
          }`}
        />
        <span>{item.value}</span>
      </div>
    ))}
  </div>
);

const IncomeExpenseChart = ({
  data = DEFAULT_DATA,
  title = 'Income vs Expenses',
  subtitle = 'Monthly cash-flow performance',
  height = 330,
  showHeader = true,
  showLegend = true,
  showControls = true,
  showExport = true,
  currency = 'INR',
  onExport,
  className = '',
}) => {
  const [range, setRange] = useState('6M');
  const [hiddenSeries, setHiddenSeries] = useState([]);

  const chartData = useMemo(() => normalizeData(data), [data]);

  const visibleData = useMemo(() => {
    if (range === '3M') {
      return chartData.slice(-3);
    }

    if (range === '6M') {
      return chartData.slice(-6);
    }

    if (range === '12M') {
      return chartData.slice(-12);
    }

    return chartData;
  }, [chartData, range]);

  const totals = useMemo(() => {
    const income = visibleData.reduce(
      (sum, item) => sum + Number(item.income || 0),
      0,
    );

    const expenses = visibleData.reduce(
      (sum, item) => sum + Number(item.expenses || 0),
      0,
    );

    const savings = income - expenses;

    const savingsRate =
      income > 0 ? (savings / income) * 100 : 0;

    return {
      income,
      expenses,
      savings,
      savingsRate,
    };
  }, [visibleData]);

  const previousPeriod = useMemo(() => {
    if (chartData.length < 2) {
      return null;
    }

    const midpoint = Math.max(
      1,
      Math.floor(chartData.length / 2),
    );

    const previous = chartData.slice(
      Math.max(0, midpoint - visibleData.length),
      midpoint,
    );

    const previousIncome = previous.reduce(
      (sum, item) => sum + Number(item.income || 0),
      0,
    );

    const previousExpenses = previous.reduce(
      (sum, item) => sum + Number(item.expenses || 0),
      0,
    );

    return {
      income: previousIncome,
      expenses: previousExpenses,
    };
  }, [chartData, visibleData.length]);

  const incomeChange = previousPeriod?.income
    ? ((totals.income - previousPeriod.income) /
        previousPeriod.income) *
      100
    : 0;

  const expenseChange = previousPeriod?.expenses
    ? ((totals.expenses - previousPeriod.expenses) /
        previousPeriod.expenses) *
      100
    : 0;

  const toggleSeries = (series) => {
    setHiddenSeries((current) =>
      current.includes(series)
        ? current.filter((item) => item !== series)
        : [...current, series],
    );
  };

  const handleExport = () => {
    if (typeof onExport === 'function') {
      onExport(visibleData);
      return;
    }

    const rows = [
      ['Month', 'Income', 'Expenses', 'Net Savings'],
      ...visibleData.map((item) => [
        item.month,
        item.income,
        item.expenses,
        item.income - item.expenses,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'finsight-income-expense.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const chartHeight = Math.max(250, Number(height) || 330);

  return (
    <section
      className={`fs-income-expense-chart ${className}`}
    >
      {showHeader && (
        <header className="fs-ie-header">
          <div className="fs-ie-heading">
            <div className="fs-ie-icon">
              <BarChart3 size={17} strokeWidth={1.8} />
            </div>

            <div>
              <div className="fs-ie-title-row">
                <h3>{title}</h3>

                <span className="fs-ie-live">
                  <span />
                  LIVE
                </span>
              </div>

              <p>{subtitle}</p>
            </div>
          </div>

          {showControls && (
            <div className="fs-ie-actions">
              {showExport && (
                <button
                  type="button"
                  className="fs-ie-icon-button"
                  onClick={handleExport}
                  title="Export chart data"
                  aria-label="Export chart data"
                >
                  <Download size={15} />
                </button>
              )}

              <button
                type="button"
                className="fs-ie-icon-button"
                title="More options"
                aria-label="More options"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>
          )}
        </header>
      )}

      <div className="fs-ie-metrics">
        <div className="fs-ie-metric">
          <div className="fs-ie-metric-label">
            <span className="fs-ie-metric-dot income" />
            Total income
          </div>

          <strong>{formatFullAmount(totals.income)}</strong>

          <span
            className={`fs-ie-change ${
              incomeChange >= 0 ? 'positive' : 'negative'
            }`}
          >
            {incomeChange >= 0 ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}

            {Math.abs(incomeChange).toFixed(1)}%
          </span>
        </div>

        <div className="fs-ie-metric">
          <div className="fs-ie-metric-label">
            <span className="fs-ie-metric-dot expenses" />
            Total expenses
          </div>

          <strong>{formatFullAmount(totals.expenses)}</strong>

          <span
            className={`fs-ie-change ${
              expenseChange <= 0 ? 'positive' : 'negative'
            }`}
          >
            {expenseChange <= 0 ? (
              <ArrowDownRight size={12} />
            ) : (
              <ArrowUpRight size={12} />
            )}

            {Math.abs(expenseChange).toFixed(1)}%
          </span>
        </div>

        <div className="fs-ie-metric">
          <div className="fs-ie-metric-label">
            <TrendingUp size={12} />
            Net savings
          </div>

          <strong
            className={
              totals.savings >= 0 ? 'saving-positive' : 'saving-negative'
            }
          >
            {formatFullAmount(totals.savings)}
          </strong>

          <span className="fs-ie-saving-rate">
            {totals.savingsRate.toFixed(1)}% savings rate
          </span>
        </div>
      </div>

      {showControls && (
        <div className="fs-ie-toolbar">
          <div className="fs-ie-range">
            {['3M', '6M', '12M', 'ALL'].map((item) => (
              <button
                type="button"
                key={item}
                className={range === item ? 'active' : ''}
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="fs-ie-series-controls">
            <button
              type="button"
              className={
                hiddenSeries.includes('income') ? 'muted' : ''
              }
              onClick={() => toggleSeries('income')}
            >
              <span className="series-dot income" />
              Income
            </button>

            <button
              type="button"
              className={
                hiddenSeries.includes('expenses') ? 'muted' : ''
              }
              onClick={() => toggleSeries('expenses')}
            >
              <span className="series-dot expenses" />
              Expenses
            </button>
          </div>
        </div>
      )}

      <div
        className="fs-ie-chart"
        style={{ height: chartHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visibleData}
            margin={{
              top: 12,
              right: 6,
              left: 4,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="fsIncomeGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#8b5cf6"
                  stopOpacity={0.32}
                />

                <stop
                  offset="100%"
                  stopColor="#8b5cf6"
                  stopOpacity={0}
                />
              </linearGradient>

              <linearGradient
                id="fsExpenseGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#60a5fa"
                  stopOpacity={0.22}
                />

                <stop
                  offset="100%"
                  stopColor="#60a5fa"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,.055)"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#64748b',
                fontSize: 10,
              }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={48}
              tick={{
                fill: '#64748b',
                fontSize: 9,
              }}
              tickFormatter={formatAmount}
            />

            <Tooltip
              cursor={{
                stroke: 'rgba(139,92,246,.35)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={<CustomTooltip />}
            />

            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                height={0}
                content={<CustomLegend />}
              />
            )}

            {!hiddenSeries.includes('income') && (
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#fsIncomeGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: '#0f1117',
                  fill: '#a78bfa',
                }}
              />
            )}

            {!hiddenSeries.includes('expenses') && (
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#fsExpenseGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: '#0f1117',
                  fill: '#93c5fd',
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <footer className="fs-ie-footer">
        <div className="fs-ie-footer-insight">
          <div className="fs-ie-insight-icon">
            <TrendingUp size={13} />
          </div>

          <span>
            {totals.savings >= 0
              ? `You're retaining ${totals.savingsRate.toFixed(
                  1,
                )}% of your income across this period.`
              : 'Your expenses currently exceed your income for this period.'}
          </span>
        </div>

        <span className="fs-ie-currency">
          Currency: {currency}
        </span>
      </footer>

      <style>{`
        .fs-income-expense-chart {
          --ie-bg: var(--fs-bg-card, #10131a);
          --ie-border: var(--fs-border, rgba(255,255,255,.08));
          --ie-text: var(--fs-text-primary, #f8fafc);
          --ie-muted: var(--fs-text-secondary, #94a3b8);

          position: relative;
          width: 100%;
          overflow: hidden;
          border: 1px solid var(--ie-border);
          border-radius: 22px;
          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(124,58,237,.055),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,.006)
            ),
            var(--ie-bg);
          box-sizing: border-box;
        }

        .fs-ie-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 19px 20px 14px;
        }

        .fs-ie-heading {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .fs-ie-icon {
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          display: grid;
          place-items: center;
          color: #a78bfa;
          border: 1px solid rgba(124,58,237,.2);
          border-radius: 10px;
          background: rgba(124,58,237,.08);
        }

        .fs-ie-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fs-ie-title-row h3 {
          margin: 0;
          color: var(--ie-text);
          font-size: 14px;
          font-weight: 760;
          letter-spacing: -.02em;
        }

        .fs-ie-title-row p,
        .fs-ie-heading p {
          margin: 4px 0 0;
          color: var(--ie-muted);
          font-size: 10px;
          line-height: 1.4;
        }

        .fs-ie-live {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          color: #22c55e;
          border: 1px solid rgba(34,197,94,.14);
          border-radius: 999px;
          background: rgba(34,197,94,.055);
          font-size: 7px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .fs-ie-live span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 7px rgba(34,197,94,.8);
          animation: fs-ie-pulse 1.5s ease-in-out infinite;
        }

        .fs-ie-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fs-ie-icon-button {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          color: rgba(148,163,184,.7);
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 9px;
          background: rgba(255,255,255,.018);
          cursor: pointer;
          transition:
            color .2s ease,
            border-color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .fs-ie-icon-button:hover {
          color: #fff;
          border-color: rgba(255,255,255,.13);
          background: rgba(255,255,255,.045);
          transform: translateY(-1px);
        }

        .fs-ie-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
          padding: 0 20px 14px;
        }

        .fs-ie-metric {
          position: relative;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 12px;
          background: rgba(255,255,255,.014);
        }

        .fs-ie-metric-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(148,163,184,.62);
          font-size: 9px;
          font-weight: 650;
        }

        .fs-ie-metric-label svg {
          color: #a78bfa;
        }

        .fs-ie-metric-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .fs-ie-metric-dot.income {
          background: #8b5cf6;
          box-shadow: 0 0 7px rgba(139,92,246,.55);
        }

        .fs-ie-metric-dot.expenses {
          background: #60a5fa;
          box-shadow: 0 0 7px rgba(96,165,250,.5);
        }

        .fs-ie-metric strong {
          display: block;
          margin-top: 6px;
          overflow: hidden;
          color: var(--ie-text);
          font-size: 15px;
          font-weight: 760;
          letter-spacing: -.025em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-ie-metric strong.saving-positive {
          color: #a78bfa;
        }

        .fs-ie-metric strong.saving-negative {
          color: #f87171;
        }

        .fs-ie-change {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          margin-top: 4px;
          font-size: 8px;
          font-weight: 700;
        }

        .fs-ie-change.positive {
          color: #22c55e;
        }

        .fs-ie-change.negative {
          color: #f87171;
        }

        .fs-ie-saving-rate {
          display: block;
          margin-top: 4px;
          color: rgba(148,163,184,.48);
          font-size: 8px;
        }

        .fs-ie-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 20px 10px;
        }

        .fs-ie-range,
        .fs-ie-series-controls {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .fs-ie-range {
          padding: 3px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 9px;
          background: rgba(255,255,255,.015);
        }

        .fs-ie-range button,
        .fs-ie-series-controls button {
          border: 0;
          background: transparent;
          font: inherit;
          cursor: pointer;
        }

        .fs-ie-range button {
          min-width: 34px;
          height: 25px;
          padding: 0 7px;
          color: rgba(148,163,184,.5);
          border-radius: 6px;
          font-size: 8px;
          font-weight: 750;
        }

        .fs-ie-range button:hover {
          color: rgba(226,232,240,.85);
        }

        .fs-ie-range button.active {
          color: #fff;
          background: rgba(124,58,237,.17);
          box-shadow: inset 0 0 0 1px rgba(124,58,237,.15);
        }

        .fs-ie-series-controls {
          gap: 10px;
        }

        .fs-ie-series-controls button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(148,163,184,.68);
          font-size: 8px;
          font-weight: 650;
        }

        .fs-ie-series-controls button:hover {
          color: #fff;
        }

        .fs-ie-series-controls button.muted {
          opacity: .35;
        }

        .series-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .series-dot.income {
          background: #8b5cf6;
        }

        .series-dot.expenses {
          background: #60a5fa;
        }

        .fs-ie-chart {
          width: 100%;
          padding: 0 9px;
        }

        .fs-ie-legend {
          display: flex;
          align-items: center;
          gap: 11px;
          justify-content: flex-end;
          margin-top: -7px;
          margin-right: 4px;
        }

        .fs-ie-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(148,163,184,.55);
          font-size: 8px;
          font-weight: 650;
        }

        .fs-ie-legend-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .fs-ie-legend-dot.income {
          background: #8b5cf6;
        }

        .fs-ie-legend-dot.expenses {
          background: #60a5fa;
        }

        .fs-ie-tooltip {
          min-width: 180px;
          padding: 11px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 12px;
          background: rgba(13,16,24,.96);
          box-shadow:
            0 18px 45px rgba(0,0,0,.38),
            inset 0 1px 0 rgba(255,255,255,.05);
          backdrop-filter: blur(14px);
        }

        .fs-ie-tooltip-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #f8fafc;
          font-size: 10px;
          font-weight: 750;
        }

        .fs-ie-tooltip-title svg {
          color: #64748b;
        }

        .fs-ie-tooltip-row,
        .fs-ie-tooltip-saving {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 4px 0;
          color: #94a3b8;
          font-size: 9px;
        }

        .fs-ie-tooltip-row span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fs-ie-tooltip-row strong {
          color: #e2e8f0;
          font-size: 9px;
        }

        .fs-ie-tooltip-row i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .income-dot {
          background: #8b5cf6;
        }

        .expense-dot {
          background: #60a5fa;
        }

        .fs-ie-tooltip-divider {
          height: 1px;
          margin: 6px 0;
          background: rgba(255,255,255,.06);
        }

        .fs-ie-tooltip-saving {
          color: rgba(148,163,184,.68);
        }

        .fs-ie-tooltip-saving strong.positive {
          color: #a78bfa;
        }

        .fs-ie-tooltip-saving strong.negative {
          color: #f87171;
        }

        .fs-ie-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 11px 20px 14px;
          border-top: 1px solid rgba(255,255,255,.045);
        }

        .fs-ie-footer-insight {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(148,163,184,.57);
          font-size: 9px;
          line-height: 1.4;
        }

        .fs-ie-insight-icon {
          width: 25px;
          height: 25px;
          flex: 0 0 25px;
          display: grid;
          place-items: center;
          color: #a78bfa;
          border-radius: 7px;
          background: rgba(124,58,237,.08);
        }

        .fs-ie-currency {
          flex: 0 0 auto;
          color: rgba(148,163,184,.38);
          font-size: 8px;
          font-weight: 650;
        }

        @keyframes fs-ie-pulse {
          0%, 100% {
            opacity: .55;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }

        @media (max-width: 720px) {
          .fs-ie-header {
            padding: 16px;
          }

          .fs-ie-metrics {
            grid-template-columns: 1fr;
            padding: 0 16px 12px;
          }

          .fs-ie-toolbar {
            padding: 0 16px 10px;
          }

          .fs-ie-footer {
            padding: 11px 16px 14px;
          }

          .fs-ie-chart {
            padding: 0 3px;
          }
        }

        @media (max-width: 520px) {
          .fs-ie-title-row h3 {
            font-size: 13px;
          }

          .fs-ie-live {
            display: none;
          }

          .fs-ie-series-controls {
            display: none;
          }

          .fs-ie-toolbar {
            justify-content: flex-start;
          }

          .fs-ie-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-ie-live span {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

IncomeExpenseChart.displayName = 'IncomeExpenseChart';

export default IncomeExpenseChart;