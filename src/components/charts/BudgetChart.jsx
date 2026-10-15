import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Info,
} from 'lucide-react';

const normalizeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(normalizeNumber(value));

const compactCurrency = (value) => {
  const number = normalizeNumber(value);

  if (Math.abs(number) >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(number) >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (Math.abs(number) >= 1000) {
    return `₹${(number / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(number)}`;
};

const getStatus = (utilization) => {
  if (utilization > 100) return 'over';
  if (utilization > 90) return 'critical';
  if (utilization > 75) return 'warning';
  return 'healthy';
};

const STATUS = {
  healthy: {
    label: 'Healthy',
    color: '#22c55e',
  },
  warning: {
    label: 'Watch',
    color: '#f59e0b',
  },
  critical: {
    label: 'Critical',
    color: '#f97316',
  },
  over: {
    label: 'Over Budget',
    color: '#ef4444',
  },
};

const normalizeBudget = (item, index) => {
  const budget = normalizeNumber(
    item?.budget_amount ??
      item?.budgetAmount ??
      item?.budget ??
      item?.allocated
  );

  const spent = normalizeNumber(
    item?.actual_spending ??
      item?.actualSpending ??
      item?.spent ??
      item?.spending ??
      item?.amount_spent
  );

  const remaining =
    item?.remaining_budget !== undefined
      ? normalizeNumber(item.remaining_budget)
      : item?.remainingBudget !== undefined
      ? normalizeNumber(item.remainingBudget)
      : budget - spent;

  const utilization =
    budget > 0 ? (spent / budget) * 100 : 0;

  const name =
    item?.category_name ??
    item?.categoryName ??
    item?.category ??
    item?.budget_name ??
    item?.budgetName ??
    `Budget ${index + 1}`;

  return {
    id:
      item?.budget_id ??
      item?.budgetId ??
      item?.id ??
      `budget-${index}`,
    name: String(name),
    budget,
    spent,
    remaining,
    utilization,
    status: getStatus(utilization),
  };
};

const BudgetTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0]?.payload;

  if (!data) {
    return null;
  }

  const status = STATUS[data.status];

  return (
    <div className="budget-chart-tooltip">
      <div className="budget-tooltip-header">
        <div>
          <div className="budget-tooltip-title">
            {data.name}
          </div>

          <div className="budget-tooltip-status">
            <span
              className="budget-tooltip-dot"
              style={{ background: status.color }}
            />
            {status.label}
          </div>
        </div>

        <BarChart3 size={17} />
      </div>

      <div className="budget-tooltip-divider" />

      <div className="budget-tooltip-row">
        <span>Budget</span>
        <strong>{formatCurrency(data.budget)}</strong>
      </div>

      <div className="budget-tooltip-row">
        <span>Spent</span>
        <strong>{formatCurrency(data.spent)}</strong>
      </div>

      <div className="budget-tooltip-row">
        <span>Remaining</span>
        <strong
          className={
            data.remaining < 0
              ? 'budget-tooltip-negative'
              : ''
          }
        >
          {formatCurrency(data.remaining)}
        </strong>
      </div>

      <div className="budget-tooltip-utilization">
        <span>Utilization</span>
        <strong>{data.utilization.toFixed(1)}%</strong>
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  description,
  type = 'default',
}) => (
  <div className={`budget-summary-card ${type}`}>
    <div className="budget-summary-icon">
      <Icon size={17} />
    </div>

    <div className="budget-summary-content">
      <span className="budget-summary-label">
        {label}
      </span>

      <strong className="budget-summary-value">
        {value}
      </strong>

      {description && (
        <span className="budget-summary-description">
          {description}
        </span>
      )}
    </div>
  </div>
);

export default function BudgetChart({
  data = [],
  title = 'Budget Overview',
  subtitle = 'Compare your planned budget with actual spending',
  height = 380,
  showSummary = true,
  showInsight = true,
}) {
  const budgets = useMemo(
    () => data.map(normalizeBudget),
    [data]
  );

  const summary = useMemo(() => {
    const totalBudget = budgets.reduce(
      (sum, item) => sum + item.budget,
      0
    );

    const totalSpent = budgets.reduce(
      (sum, item) => sum + item.spent,
      0
    );

    const totalRemaining = budgets.reduce(
      (sum, item) => sum + item.remaining,
      0
    );

    const utilization =
      totalBudget > 0
        ? (totalSpent / totalBudget) * 100
        : 0;

    const overBudget = budgets.filter(
      (item) => item.status === 'over'
    ).length;

    const healthy = budgets.filter(
      (item) => item.status === 'healthy'
    ).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      utilization,
      overBudget,
      healthy,
    };
  }, [budgets]);

  const chartData = useMemo(
    () =>
      budgets.map((item) => ({
        ...item,
        displayName:
          item.name.length > 16
            ? `${item.name.slice(0, 16)}…`
            : item.name,
      })),
    [budgets]
  );

  const highestUtilization = useMemo(() => {
    if (!budgets.length) {
      return null;
    }

    return [...budgets].sort(
      (a, b) => b.utilization - a.utilization
    )[0];
  }, [budgets]);

  const empty = budgets.length === 0;

  return (
    <section className="budget-chart-wrapper">
      <style>{`
        .budget-chart-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 90% 0%,
              rgba(59, 130, 246, 0.08),
              transparent 34%
            ),
            radial-gradient(
              circle at 0% 100%,
              rgba(34, 197, 94, 0.045),
              transparent 30%
            ),
            rgba(15, 23, 42, 0.72);
          box-shadow:
            0 18px 50px rgba(0, 0, 0, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
          color: #e2e8f0;
        }

        .budget-chart-inner {
          padding: 24px;
        }

        .budget-chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .budget-chart-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .budget-chart-heading-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(96, 165, 250, 0.18);
          border-radius: 14px;
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.10);
        }

        .budget-chart-title {
          margin: 0;
          color: #f8fafc;
          font-size: 19px;
          line-height: 1.25;
          font-weight: 750;
          letter-spacing: -0.025em;
        }

        .budget-chart-subtitle {
          margin: 6px 0 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.55;
        }

        .budget-chart-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 10px;
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.045);
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .budget-chart-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34,197,94,.45);
        }

        .budget-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 11px;
          margin-bottom: 23px;
        }

        .budget-summary-card {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          padding: 14px;
          border: 1px solid rgba(148, 163, 184, 0.10);
          border-radius: 15px;
          background: rgba(15, 23, 42, 0.46);
        }

        .budget-summary-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #93c5fd;
          background: rgba(59,130,246,.10);
        }

        .budget-summary-card.success .budget-summary-icon {
          color: #4ade80;
          background: rgba(34,197,94,.10);
        }

        .budget-summary-card.warning .budget-summary-icon {
          color: #fbbf24;
          background: rgba(245,158,11,.10);
        }

        .budget-summary-card.danger .budget-summary-icon {
          color: #fb7185;
          background: rgba(239,68,68,.10);
        }

        .budget-summary-content {
          min-width: 0;
        }

        .budget-summary-label {
          display: block;
          margin-bottom: 4px;
          color: #64748b;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .budget-summary-value {
          display: block;
          overflow: hidden;
          color: #f8fafc;
          font-size: 16px;
          font-weight: 750;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .budget-summary-description {
          display: block;
          overflow: hidden;
          margin-top: 4px;
          color: #64748b;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .budget-chart-area {
          min-height: ${height}px;
        }

        .budget-empty {
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .budget-empty-inner {
          max-width: 330px;
        }

        .budget-empty-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin: 0 auto 12px;
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 16px;
          color: #64748b;
          background: rgba(148,163,184,.045);
        }

        .budget-empty-title {
          margin: 0 0 6px;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 700;
        }

        .budget-empty-text {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
        }

        .budget-chart-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 16px;
          padding-top: 15px;
          border-top: 1px solid rgba(148,163,184,.08);
        }

        .budget-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }

        .budget-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #94a3b8;
          font-size: 10px;
        }

        .budget-legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .budget-legend-budget {
          background: #64748b;
        }

        .budget-legend-spent {
          background: #60a5fa;
        }

        .budget-insight {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.5;
          text-align: right;
        }

        .budget-insight svg {
          flex: 0 0 auto;
          color: #60a5fa;
          margin-top: 1px;
        }

        .budget-insight strong {
          color: #cbd5e1;
        }

        .budget-chart-tooltip {
          min-width: 215px;
          padding: 13px;
          border: 1px solid rgba(148,163,184,.17);
          border-radius: 13px;
          background: rgba(15,23,42,.98);
          box-shadow: 0 18px 45px rgba(0,0,0,.35);
          backdrop-filter: blur(18px);
        }

        .budget-tooltip-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .budget-tooltip-header > svg {
          color: #64748b;
        }

        .budget-tooltip-title {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 750;
        }

        .budget-tooltip-status {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 9px;
        }

        .budget-tooltip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .budget-tooltip-divider {
          height: 1px;
          margin: 10px 0;
          background: rgba(148,163,184,.10);
        }

        .budget-tooltip-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 7px;
          color: #64748b;
          font-size: 10px;
        }

        .budget-tooltip-row strong {
          color: #cbd5e1;
          font-weight: 700;
        }

        .budget-tooltip-negative {
          color: #fb7185 !important;
        }

        .budget-tooltip-utilization {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 11px;
          padding-top: 9px;
          border-top: 1px solid rgba(148,163,184,.08);
          color: #64748b;
          font-size: 10px;
        }

        .budget-tooltip-utilization strong {
          color: #60a5fa;
        }

        .budget-axis {
          fill: #64748b;
          font-size: 10px;
        }

        .budget-grid line {
          stroke: rgba(148,163,184,.07);
        }

        @media (max-width: 1000px) {
          .budget-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .budget-chart-inner {
            padding: 17px;
          }

          .budget-chart-header {
            flex-direction: column;
          }

          .budget-chart-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .budget-insight {
            text-align: left;
          }
        }

        @media (max-width: 460px) {
          .budget-summary-grid {
            grid-template-columns: 1fr;
          }

          .budget-chart-title {
            font-size: 17px;
          }

          .budget-chart-badge {
            display: none;
          }
        }
      `}</style>

      <div className="budget-chart-inner">
        <div className="budget-chart-header">
          <div className="budget-chart-heading">
            <div className="budget-chart-heading-icon">
              <BarChart3 size={21} />
            </div>

            <div>
              <h2 className="budget-chart-title">
                {title}
              </h2>

              <p className="budget-chart-subtitle">
                {subtitle}
              </p>
            </div>
          </div>

          {!empty && (
            <div className="budget-chart-badge">
              <span className="budget-chart-badge-dot" />
              {budgets.length} budget
              {budgets.length === 1 ? '' : 's'} tracked
            </div>
          )}
        </div>

        {showSummary && !empty && (
          <div className="budget-summary-grid">
            <SummaryCard
              icon={Wallet}
              label="Total Budget"
              value={formatCurrency(
                summary.totalBudget
              )}
              description="Planned allocation"
            />

            <SummaryCard
              icon={TrendingUp}
              label="Spent"
              value={formatCurrency(
                summary.totalSpent
              )}
              description={`${summary.utilization.toFixed(
                1
              )}% utilized`}
            />

            <SummaryCard
              icon={
                summary.totalRemaining >= 0
                  ? CheckCircle2
                  : AlertTriangle
              }
              label="Remaining"
              value={formatCurrency(
                summary.totalRemaining
              )}
              description={
                summary.totalRemaining >= 0
                  ? 'Available allocation'
                  : 'Budget exceeded'
              }
              type={
                summary.totalRemaining >= 0
                  ? 'success'
                  : 'danger'
              }
            />

            <SummaryCard
              icon={
                summary.utilization > 90
                  ? AlertTriangle
                  : Target
              }
              label="Utilization"
              value={`${summary.utilization.toFixed(1)}%`}
              description={
                summary.overBudget > 0
                  ? `${summary.overBudget} over budget`
                  : `${summary.healthy} healthy budget${
                      summary.healthy === 1 ? '' : 's'
                    }`
              }
              type={
                summary.utilization > 100
                  ? 'danger'
                  : summary.utilization > 75
                  ? 'warning'
                  : 'success'
              }
            />
          </div>
        )}

        <div className="budget-chart-area">
          {empty ? (
            <div className="budget-empty">
              <div className="budget-empty-inner">
                <div className="budget-empty-icon">
                  <BarChart3 size={23} />
                </div>

                <h3 className="budget-empty-title">
                  No budget data available
                </h3>

                <p className="budget-empty-text">
                  Budget information will appear here
                  when your backend returns budget
                  allocation and spending records.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={height}
            >
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 14,
                  left: 4,
                  bottom: 25,
                }}
                barCategoryGap="22%"
              >
                <CartesianGrid
                  className="budget-grid"
                  vertical={false}
                  strokeDasharray="3 5"
                />

                <XAxis
                  dataKey="displayName"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                  interval={0}
                  height={38}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                  tickFormatter={compactCurrency}
                  width={58}
                />

                <Tooltip
                  cursor={{
                    fill: 'rgba(148,163,184,.035)',
                  }}
                  content={<BudgetTooltip />}
                />

                <ReferenceLine
                  y={0}
                  stroke="rgba(148,163,184,.16)"
                />

                <Bar
                  dataKey="budget"
                  name="Budget"
                  fill="#475569"
                  opacity={0.58}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />

                <Bar
                  dataKey="spent"
                  name="Spent"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                >
                  {chartData.map((item) => (
                    <Cell
                      key={item.id}
                      fill={
                        STATUS[item.status]?.color ??
                        '#60a5fa'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {!empty && (
          <div className="budget-chart-footer">
            <div className="budget-legend">
              <div className="budget-legend-item">
                <span className="budget-legend-dot budget-legend-budget" />
                Planned Budget
              </div>

              <div className="budget-legend-item">
                <span className="budget-legend-dot budget-legend-spent" />
                Actual Spending
              </div>

              <div className="budget-legend-item">
                <span
                  className="budget-legend-dot"
                  style={{
                    background: '#22c55e',
                  }}
                />
                Healthy
              </div>

              <div className="budget-legend-item">
                <span
                  className="budget-legend-dot"
                  style={{
                    background: '#f59e0b',
                  }}
                />
                Watch
              </div>

              <div className="budget-legend-item">
                <span
                  className="budget-legend-dot"
                  style={{
                    background: '#ef4444',
                  }}
                />
                Over Budget
              </div>
            </div>

            {showInsight && highestUtilization && (
              <div className="budget-insight">
                {highestUtilization.utilization > 100 ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}

                <span>
                  <strong>
                    {highestUtilization.name}
                  </strong>{' '}
                  has the highest utilization at{' '}
                  <strong>
                    {highestUtilization.utilization.toFixed(
                      1
                    )}
                    %
                  </strong>
                  .
                </span>

                <Info size={13} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}