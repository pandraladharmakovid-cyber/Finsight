import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Download,
  MoreHorizontal,
  PieChart as PieChartIcon,
  WalletCards,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from 'recharts';

const DEFAULT_DATA = [
  { category: 'Housing', amount: 0 },
  { category: 'Food', amount: 0 },
  { category: 'Transport', amount: 0 },
  { category: 'Utilities', amount: 0 },
  { category: 'Shopping', amount: 0 },
  { category: 'Entertainment', amount: 0 },
];

const COLORS = [
  '#8b5cf6',
  '#60a5fa',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#a78bfa',
  '#38bdf8',
];

const normalizeData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return DEFAULT_DATA;
  }

  return data
    .map((item, index) => ({
      category:
        item.category ||
        item.category_name ||
        item.categoryName ||
        item.name ||
        `Category ${index + 1}`,
      amount: Number(
        item.amount ??
          item.spending ??
          item.total ??
          item.total_spending ??
          item.actual_spending ??
          item.value ??
          0,
      ),
    }))
    .filter((item) => Number.isFinite(item.amount) && item.amount > 0);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCompactCurrency = (value) => {
  const amount = Number(value) || 0;

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(amount)}`;
};

const ActiveShape = (props) => (
  <g>
    <Sector
      {...props}
      outerRadius={(props.outerRadius || 90) + 7}
      fill={props.fill}
      opacity={1}
    />

    <Sector
      {...props}
      innerRadius={props.innerRadius}
      outerRadius={(props.outerRadius || 90) + 7}
      fill={props.fill}
      opacity={0.16}
    />
  </g>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;

  if (!item) {
    return null;
  }

  return (
    <div className="fs-category-tooltip">
      <div className="fs-category-tooltip-title">
        <span
          className="fs-category-tooltip-color"
          style={{ background: item.color }}
        />

        <span>{item.category}</span>
      </div>

      <strong>{formatCurrency(item.amount)}</strong>

      <div className="fs-category-tooltip-meta">
        <span>{item.percentage.toFixed(1)}% of spending</span>
      </div>
    </div>
  );
};

const CategorySpendingChart = ({
  data = DEFAULT_DATA,
  title = 'Category Spending',
  subtitle = 'Where your money is going',
  height = 350,
  showHeader = true,
  showControls = true,
  showLegend = true,
  showInsights = true,
  onExport,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortMode, setSortMode] = useState('amount');
  const [showAll, setShowAll] = useState(false);

  const processedData = useMemo(() => {
    const normalized = normalizeData(data);

    const total = normalized.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const sorted = [...normalized].sort((a, b) => {
      if (sortMode === 'name') {
        return a.category.localeCompare(b.category);
      }

      return b.amount - a.amount;
    });

    return sorted.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [data, sortMode]);

  const totalSpending = useMemo(
    () =>
      processedData.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ),
    [processedData],
  );

  const visibleData = showAll
    ? processedData
    : processedData.slice(0, 6);

  const activeItem =
    visibleData[
      Math.min(activeIndex, Math.max(visibleData.length - 1, 0))
    ];

  const topCategory = processedData[0];

  const averageSpend =
    processedData.length > 0
      ? totalSpending / processedData.length
      : 0;

  const topCategoryShare =
    totalSpending > 0 && topCategory
      ? (topCategory.amount / totalSpending) * 100
      : 0;

  const handleExport = () => {
    if (typeof onExport === 'function') {
      onExport(processedData);
      return;
    }

    const rows = [
      ['Category', 'Amount', 'Percentage'],
      ...processedData.map((item) => [
        item.category,
        item.amount,
        `${item.percentage.toFixed(2)}%`,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replaceAll('"', '""')}"`,
          )
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'finsight-category-spending.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const chartHeight = Math.max(250, Number(height) || 350);

  return (
    <section
      className={`fs-category-chart ${className}`}
    >
      {showHeader && (
        <header className="fs-category-header">
          <div className="fs-category-heading">
            <div className="fs-category-header-icon">
              <PieChartIcon size={17} strokeWidth={1.8} />
            </div>

            <div>
              <div className="fs-category-title-row">
                <h3>{title}</h3>

                <span className="fs-category-badge">
                  <span />
                  LIVE
                </span>
              </div>

              <p>{subtitle}</p>
            </div>
          </div>

          {showControls && (
            <div className="fs-category-actions">
              <button
                type="button"
                className="fs-category-action"
                onClick={handleExport}
                title="Export spending data"
                aria-label="Export spending data"
              >
                <Download size={14} />
              </button>

              <button
                type="button"
                className="fs-category-action"
                title="More options"
                aria-label="More options"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          )}
        </header>
      )}

      <div className="fs-category-summary">
        <div className="fs-category-total">
          <span>Total spending</span>
          <strong>{formatCurrency(totalSpending)}</strong>

          <div className="fs-category-total-meta">
            <span className="fs-category-total-icon">
              <WalletCards size={11} />
            </span>

            <span>
              {processedData.length} active categor
              {processedData.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
        </div>

        <div className="fs-category-summary-item">
          <span>Top category</span>

          <strong>
            {topCategory?.category || 'No data'}
          </strong>

          <small>
            {topCategory
              ? `${topCategoryShare.toFixed(1)}% of total`
              : '—'}
          </small>
        </div>

        <div className="fs-category-summary-item">
          <span>Average category</span>

          <strong>{formatCompactCurrency(averageSpend)}</strong>

          <small>Across all categories</small>
        </div>
      </div>

      {showControls && (
        <div className="fs-category-toolbar">
          <div className="fs-category-sort">
            <span>Sort</span>

            <button
              type="button"
              onClick={() =>
                setSortMode((current) =>
                  current === 'amount' ? 'name' : 'amount',
                )
              }
            >
              {sortMode === 'amount'
                ? 'Highest spending'
                : 'Category name'}

              <ChevronDown size={12} />
            </button>
          </div>

          {processedData.length > 6 && (
            <button
              type="button"
              className="fs-category-view-button"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? 'Show less' : 'View all'}
            </button>
          )}
        </div>
      )}

      <div
        className="fs-category-main"
        style={{ minHeight: chartHeight }}
      >
        <div className="fs-category-donut">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <defs>
                {visibleData.map((item, index) => (
                  <linearGradient
                    key={item.category}
                    id={`fs-category-gradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={item.color}
                      stopOpacity={1}
                    />

                    <stop
                      offset="100%"
                      stopColor={item.color}
                      stopOpacity={0.65}
                    />
                  </linearGradient>
                ))}
              </defs>

              <Pie
                data={visibleData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius="56%"
                outerRadius="76%"
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                activeIndex={activeIndex}
                activeShape={ActiveShape}
                onMouseEnter={(_, index) =>
                  setActiveIndex(index)
                }
                isAnimationActive
                animationDuration={900}
                animationBegin={100}
              >
                {visibleData.map((item, index) => (
                  <Cell
                    key={`${item.category}-${index}`}
                    fill={`url(#fs-category-gradient-${index})`}
                    opacity={
                      activeItem &&
                      activeItem.category !== item.category
                        ? 0.76
                        : 1
                    }
                  />
                ))}
              </Pie>

              <Tooltip
                content={<CustomTooltip />}
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="fs-category-center">
            <span>Total</span>

            <strong>
              {formatCompactCurrency(totalSpending)}
            </strong>

            <small>
              {processedData.length} categor
              {processedData.length === 1 ? 'y' : 'ies'}
            </small>
          </div>
        </div>

        {showLegend && (
          <div className="fs-category-legend">
            {visibleData.map((item, index) => (
              <button
                type="button"
                className={`fs-category-row ${
                  activeIndex === index ? 'active' : ''
                }`}
                key={item.category}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                <div className="fs-category-row-left">
                  <span
                    className="fs-category-row-color"
                    style={{
                      background: item.color,
                      boxShadow: `0 0 9px ${item.color}55`,
                    }}
                  />

                  <span className="fs-category-row-name">
                    {item.category}
                  </span>
                </div>

                <div className="fs-category-row-right">
                  <strong>
                    {formatCompactCurrency(item.amount)}
                  </strong>

                  <span>{item.percentage.toFixed(1)}%</span>
                </div>

                <div className="fs-category-row-track">
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        item.percentage,
                      )}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showInsights && (
        <footer className="fs-category-footer">
          <div className="fs-category-insight">
            <div className="fs-category-insight-icon">
              {topCategoryShare > 40 ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
            </div>

            <div>
              <strong>
                {topCategory
                  ? `${topCategory.category} is your largest expense`
                  : 'No spending insight available'}
              </strong>

              <span>
                {topCategory
                  ? `${topCategoryShare.toFixed(
                      1,
                    )}% of your total spending is allocated here.`
                  : 'Add transaction data to generate insights.'}
              </span>
            </div>
          </div>

          <div className="fs-category-health">
            <span />
            Spending analyzed
          </div>
        </footer>
      )}

      <style>{`
        .fs-category-chart {
          --category-bg: var(--fs-bg-card, #10131a);
          --category-border: var(--fs-border, rgba(255,255,255,.08));
          --category-text: var(--fs-text-primary, #f8fafc);
          --category-muted: var(--fs-text-secondary, #94a3b8);

          position: relative;
          width: 100%;
          overflow: hidden;
          border: 1px solid var(--category-border);
          border-radius: 22px;
          background:
            radial-gradient(
              circle at 50% 25%,
              rgba(124,58,237,.055),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,.006)
            ),
            var(--category-bg);
          box-sizing: border-box;
        }

        .fs-category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 19px 20px 14px;
        }

        .fs-category-heading {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .fs-category-header-icon {
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

        .fs-category-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fs-category-title-row h3 {
          margin: 0;
          color: var(--category-text);
          font-size: 14px;
          font-weight: 760;
          letter-spacing: -.02em;
        }

        .fs-category-heading p {
          margin: 4px 0 0;
          color: var(--category-muted);
          font-size: 10px;
        }

        .fs-category-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          color: #22c55e;
          border: 1px solid rgba(34,197,94,.14);
          border-radius: 999px;
          background: rgba(34,197,94,.05);
          font-size: 7px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .fs-category-badge span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 7px rgba(34,197,94,.75);
          animation: fs-category-pulse 1.6s ease-in-out infinite;
        }

        .fs-category-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fs-category-action {
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
            transform .2s ease,
            color .2s ease,
            border-color .2s ease,
            background .2s ease;
        }

        .fs-category-action:hover {
          color: #fff;
          border-color: rgba(255,255,255,.13);
          background: rgba(255,255,255,.045);
          transform: translateY(-1px);
        }

        .fs-category-summary {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr;
          gap: 9px;
          padding: 0 20px 13px;
        }

        .fs-category-total,
        .fs-category-summary-item {
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 12px;
          background: rgba(255,255,255,.014);
        }

        .fs-category-total > span,
        .fs-category-summary-item > span {
          display: block;
          color: rgba(148,163,184,.6);
          font-size: 9px;
          font-weight: 650;
        }

        .fs-category-total strong {
          display: block;
          margin-top: 5px;
          color: #f8fafc;
          font-size: 17px;
          font-weight: 780;
          letter-spacing: -.03em;
        }

        .fs-category-total-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
          color: rgba(148,163,184,.45);
          font-size: 8px;
        }

        .fs-category-total-icon {
          width: 19px;
          height: 19px;
          display: grid !important;
          place-items: center;
          color: #a78bfa !important;
          border-radius: 6px;
          background: rgba(124,58,237,.08);
        }

        .fs-category-summary-item strong {
          display: block;
          overflow: hidden;
          margin-top: 5px;
          color: rgba(248,250,252,.88);
          font-size: 12px;
          font-weight: 720;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-category-summary-item small {
          display: block;
          overflow: hidden;
          margin-top: 4px;
          color: rgba(148,163,184,.43);
          font-size: 8px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-category-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 20px 8px;
        }

        .fs-category-sort {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(148,163,184,.42);
          font-size: 8px;
          font-weight: 650;
        }

        .fs-category-sort button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          color: rgba(148,163,184,.7);
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 7px;
          background: rgba(255,255,255,.018);
          font: inherit;
          font-size: 8px;
          cursor: pointer;
        }

        .fs-category-sort button:hover {
          color: #fff;
          border-color: rgba(255,255,255,.12);
        }

        .fs-category-view-button {
          padding: 5px 8px;
          color: #a78bfa;
          border: 0;
          border-radius: 7px;
          background: rgba(124,58,237,.06);
          font: inherit;
          font-size: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .fs-category-view-button:hover {
          background: rgba(124,58,237,.12);
        }

        .fs-category-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 10px;
          padding: 0 20px;
        }

        .fs-category-donut {
          position: relative;
          width: 100%;
          min-width: 0;
        }

        .fs-category-center {
          position: absolute;
          left: 50%;
          top: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 150px;
          height: 150px;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .fs-category-center span {
          color: rgba(148,163,184,.48);
          font-size: 9px;
          font-weight: 650;
        }

        .fs-category-center strong {
          margin-top: 4px;
          color: #f8fafc;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -.04em;
        }

        .fs-category-center small {
          margin-top: 3px;
          color: rgba(148,163,184,.38);
          font-size: 8px;
        }

        .fs-category-legend {
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-height: 330px;
          overflow-y: auto;
          padding: 7px 1px;
          scrollbar-width: thin;
          scrollbar-color: rgba(124,58,237,.3) transparent;
        }

        .fs-category-row {
          position: relative;
          width: 100%;
          min-width: 0;
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-rows: auto 3px;
          gap: 5px 8px;
          padding: 8px 9px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition:
            background .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .fs-category-row:hover,
        .fs-category-row.active {
          border-color: rgba(255,255,255,.055);
          background: rgba(255,255,255,.025);
        }

        .fs-category-row.active {
          transform: translateX(2px);
        }

        .fs-category-row-left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .fs-category-row-color {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 50%;
        }

        .fs-category-row-name {
          min-width: 0;
          overflow: hidden;
          color: rgba(226,232,240,.72);
          font-size: 9px;
          font-weight: 650;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-category-row-right {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .fs-category-row-right strong {
          color: rgba(248,250,252,.85);
          font-size: 9px;
          font-weight: 730;
        }

        .fs-category-row-right span {
          min-width: 30px;
          color: rgba(148,163,184,.45);
          font-size: 8px;
          text-align: right;
        }

        .fs-category-row-track {
          grid-column: 1 / -1;
          width: 100%;
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.035);
        }

        .fs-category-row-track span {
          display: block;
          height: 100%;
          min-width: 2px;
          border-radius: inherit;
          opacity: .72;
          transition: width .45s ease;
        }

        .fs-category-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 11px 20px 14px;
          border-top: 1px solid rgba(255,255,255,.045);
        }

        .fs-category-insight {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fs-category-insight-icon {
          width: 27px;
          height: 27px;
          flex: 0 0 27px;
          display: grid;
          place-items: center;
          color: #a78bfa;
          border-radius: 8px;
          background: rgba(124,58,237,.08);
        }

        .fs-category-insight > div:last-child {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .fs-category-insight strong {
          overflow: hidden;
          max-width: 100%;
          color: rgba(226,232,240,.72);
          font-size: 9px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-category-insight span {
          margin-top: 2px;
          overflow: hidden;
          max-width: 100%;
          color: rgba(148,163,184,.42);
          font-size: 8px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-category-health {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex: 0 0 auto;
          color: rgba(34,197,94,.62);
          font-size: 8px;
          font-weight: 700;
        }

        .fs-category-health > span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,.65);
        }

        .fs-category-tooltip {
          min-width: 170px;
          padding: 11px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 12px;
          background: rgba(13,16,24,.96);
          box-shadow:
            0 18px 45px rgba(0,0,0,.38),
            inset 0 1px 0 rgba(255,255,255,.05);
          backdrop-filter: blur(14px);
        }

        .fs-category-tooltip-title {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #e2e8f0;
          font-size: 9px;
          font-weight: 700;
        }

        .fs-category-tooltip-color {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .fs-category-tooltip > strong {
          display: block;
          margin-top: 6px;
          color: #fff;
          font-size: 14px;
          font-weight: 780;
        }

        .fs-category-tooltip-meta {
          margin-top: 3px;
          color: rgba(148,163,184,.5);
          font-size: 8px;
        }

        @keyframes fs-category-pulse {
          0%, 100% {
            opacity: .5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }

        @media (max-width: 780px) {
          .fs-category-summary {
            grid-template-columns: 1fr 1fr;
          }

          .fs-category-total {
            grid-column: 1 / -1;
          }

          .fs-category-main {
            grid-template-columns: 1fr;
          }

          .fs-category-legend {
            max-height: none;
            padding-bottom: 12px;
          }
        }

        @media (max-width: 520px) {
          .fs-category-header {
            padding: 16px;
          }

          .fs-category-summary {
            grid-template-columns: 1fr;
            padding: 0 16px 12px;
          }

          .fs-category-total {
            grid-column: auto;
          }

          .fs-category-toolbar {
            padding: 0 16px 8px;
          }

          .fs-category-main {
            padding: 0 12px;
          }

          .fs-category-footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 11px 16px 14px;
          }

          .fs-category-health {
            display: none;
          }

          .fs-category-center {
            width: 125px;
            height: 125px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-category-badge span {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

CategorySpendingChart.displayName = 'CategorySpendingChart';

export default CategorySpendingChart;