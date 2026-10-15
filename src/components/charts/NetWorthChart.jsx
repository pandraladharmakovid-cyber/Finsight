import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  MoreHorizontal,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DEFAULT_DATA = [
  { month: 'Jan', assets: 0, liabilities: 0, netWorth: 0 },
  { month: 'Feb', assets: 0, liabilities: 0, netWorth: 0 },
  { month: 'Mar', assets: 0, liabilities: 0, netWorth: 0 },
  { month: 'Apr', assets: 0, liabilities: 0, netWorth: 0 },
  { month: 'May', assets: 0, liabilities: 0, netWorth: 0 },
  { month: 'Jun', assets: 0, liabilities: 0, netWorth: 0 },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCompact = (value) => {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);

  if (absolute >= 10000000) {
    return `${sign}₹${(absolute / 10000000).toFixed(1)}Cr`;
  }

  if (absolute >= 100000) {
    return `${sign}₹${(absolute / 100000).toFixed(1)}L`;
  }

  if (absolute >= 1000) {
    return `${sign}₹${(absolute / 1000).toFixed(1)}K`;
  }

  return `${sign}₹${Math.round(absolute)}`;
};

const normalizeData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return DEFAULT_DATA;
  }

  return data.map((item, index) => {
    const assets = Number(
      item.assets ??
        item.totalAssets ??
        item.total_assets ??
        item.assetValue ??
        0,
    );

    const liabilities = Number(
      item.liabilities ??
        item.totalLiabilities ??
        item.total_liabilities ??
        item.debt ??
        0,
    );

    const suppliedNetWorth = item.netWorth ?? item.net_worth;

    const netWorth =
      suppliedNetWorth !== undefined &&
      suppliedNetWorth !== null
        ? Number(suppliedNetWorth)
        : assets - liabilities;

    return {
      month:
        item.month ||
        item.label ||
        item.period ||
        item.name ||
        `Period ${index + 1}`,
      assets,
      liabilities,
      netWorth,
    };
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="fs-networth-tooltip">
      <div className="fs-networth-tooltip-header">
        <span>{label}</span>
        <Wallet size={12} />
      </div>

      <div className="fs-networth-tooltip-row">
        <span>
          <i className="asset-dot" />
          Assets
        </span>
        <strong>{formatCurrency(point.assets)}</strong>
      </div>

      <div className="fs-networth-tooltip-row">
        <span>
          <i className="liability-dot" />
          Liabilities
        </span>
        <strong>{formatCurrency(point.liabilities)}</strong>
      </div>

      <div className="fs-networth-tooltip-divider" />

      <div className="fs-networth-tooltip-net">
        <span>Net worth</span>
        <strong
          className={
            point.netWorth >= 0 ? 'positive' : 'negative'
          }
        >
          {formatCurrency(point.netWorth)}
        </strong>
      </div>
    </div>
  );
};

const NetWorthChart = ({
  data = DEFAULT_DATA,
  title = 'Net Worth',
  subtitle = 'Assets minus liabilities over time',
  height = 330,
  showHeader = true,
  showControls = true,
  showMetrics = true,
  showFooter = true,
  onExport,
  className = '',
}) => {
  const [range, setRange] = useState('6M');

  const chartData = useMemo(
    () => normalizeData(data),
    [data],
  );

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

  const metrics = useMemo(() => {
    const current =
      visibleData[visibleData.length - 1] || {
        assets: 0,
        liabilities: 0,
        netWorth: 0,
      };

    const previous =
      visibleData[visibleData.length - 2] || current;

    const change =
      Number(current.netWorth) - Number(previous.netWorth);

    const changePercent =
      Number(previous.netWorth) !== 0
        ? (change / Math.abs(Number(previous.netWorth))) * 100
        : 0;

    const assetChange =
      Number(current.assets) - Number(previous.assets);

    const liabilityChange =
      Number(current.liabilities) -
      Number(previous.liabilities);

    return {
      current,
      previous,
      change,
      changePercent,
      assetChange,
      liabilityChange,
    };
  }, [visibleData]);

  const minNetWorth = Math.min(
    ...visibleData.map((item) => item.netWorth),
    0,
  );

  const maxNetWorth = Math.max(
    ...visibleData.map((item) => item.netWorth),
    0,
  );

  const totalGrowth =
    chartData.length >= 2
      ? chartData[chartData.length - 1].netWorth -
        chartData[0].netWorth
      : 0;

  const handleExport = () => {
    if (typeof onExport === 'function') {
      onExport(visibleData);
      return;
    }

    const rows = [
      ['Period', 'Assets', 'Liabilities', 'Net Worth'],
      ...visibleData.map((item) => [
        item.month,
        item.assets,
        item.liabilities,
        item.netWorth,
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
    link.download = 'finsight-net-worth.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const chartHeight = Math.max(250, Number(height) || 330);

  return (
    <section className={`fs-networth-chart ${className}`}>
      {showHeader && (
        <header className="fs-networth-header">
          <div className="fs-networth-heading">
            <div className="fs-networth-icon">
              <TrendingUp size={17} strokeWidth={1.8} />
            </div>

            <div>
              <div className="fs-networth-title-row">
                <h3>{title}</h3>

                <span className="fs-networth-live">
                  <span />
                  TRACKING
                </span>
              </div>

              <p>{subtitle}</p>
            </div>
          </div>

          {showControls && (
            <div className="fs-networth-actions">
              <button
                type="button"
                className="fs-networth-action"
                onClick={handleExport}
                title="Export net worth data"
                aria-label="Export net worth data"
              >
                <Download size={14} />
              </button>

              <button
                type="button"
                className="fs-networth-action"
                title="More options"
                aria-label="More options"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          )}
        </header>
      )}

      {showMetrics && (
        <div className="fs-networth-metrics">
          <div className="fs-networth-primary-metric">
            <div className="fs-networth-label">
              <ShieldCheck size={12} />
              Current net worth
            </div>

            <strong
              className={
                metrics.current.netWorth >= 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {formatCurrency(metrics.current.netWorth)}
            </strong>

            <span
              className={`fs-networth-change ${
                metrics.change >= 0 ? 'positive' : 'negative'
              }`}
            >
              {metrics.change >= 0 ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}

              {Math.abs(metrics.changePercent).toFixed(1)}%
              <small>vs previous period</small>
            </span>
          </div>

          <div className="fs-networth-metric">
            <span className="metric-label">
              <i className="asset-dot" />
              Total assets
            </span>

            <strong>
              {formatCompact(metrics.current.assets)}
            </strong>

            <small
              className={
                metrics.assetChange >= 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {metrics.assetChange >= 0 ? '+' : ''}
              {formatCompact(metrics.assetChange)}
            </small>
          </div>

          <div className="fs-networth-metric">
            <span className="metric-label">
              <i className="liability-dot" />
              Liabilities
            </span>

            <strong>
              {formatCompact(metrics.current.liabilities)}
            </strong>

            <small
              className={
                metrics.liabilityChange <= 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {metrics.liabilityChange <= 0 ? '' : '+'}
              {formatCompact(metrics.liabilityChange)}
            </small>
          </div>
        </div>
      )}

      {showControls && (
        <div className="fs-networth-toolbar">
          <div className="fs-networth-range">
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

          <div className="fs-networth-legend">
            <span>
              <i className="asset-dot" />
              Assets
            </span>

            <span>
              <i className="liability-dot" />
              Liabilities
            </span>

            <span>
              <i className="net-dot" />
              Net worth
            </span>
          </div>
        </div>
      )}

      <div
        className="fs-networth-chart-area"
        style={{ height: chartHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visibleData}
            margin={{
              top: 16,
              right: 8,
              left: 4,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="fsNetWorthGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#8b5cf6"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="#8b5cf6"
                  stopOpacity={0}
                />
              </linearGradient>

              <linearGradient
                id="fsAssetsGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#22c55e"
                  stopOpacity={0.13}
                />
                <stop
                  offset="100%"
                  stopColor="#22c55e"
                  stopOpacity={0}
                />
              </linearGradient>

              <linearGradient
                id="fsLiabilityGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#f87171"
                  stopOpacity={0.1}
                />
                <stop
                  offset="100%"
                  stopColor="#f87171"
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
              width={50}
              tick={{
                fill: '#64748b',
                fontSize: 9,
              }}
              tickFormatter={formatCompact}
              domain={[
                Math.min(minNetWorth, 0),
                Math.max(maxNetWorth, 0),
              ]}
            />

            <Tooltip
              cursor={{
                stroke: 'rgba(139,92,246,.35)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={<CustomTooltip />}
            />

            <Area
              type="monotone"
              dataKey="assets"
              name="Assets"
              stroke="#22c55e"
              strokeWidth={1.6}
              fill="url(#fsAssetsGradient)"
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: '#0f1117',
                fill: '#4ade80',
              }}
            />

            <Area
              type="monotone"
              dataKey="liabilities"
              name="Liabilities"
              stroke="#f87171"
              strokeWidth={1.6}
              fill="url(#fsLiabilityGradient)"
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: '#0f1117',
                fill: '#fb7185',
              }}
            />

            <Area
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#a78bfa"
              strokeWidth={2.8}
              fill="url(#fsNetWorthGradient)"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: '#0f1117',
                fill: '#c4b5fd',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showFooter && (
        <footer className="fs-networth-footer">
          <div className="fs-networth-insight">
            <div className="fs-networth-insight-icon">
              {totalGrowth >= 0 ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
            </div>

            <div>
              <strong>
                {totalGrowth >= 0
                  ? 'Your net worth is trending upward'
                  : 'Your net worth is trending downward'}
              </strong>

              <span>
                {totalGrowth >= 0 ? '+' : ''}
                {formatCurrency(totalGrowth)} change across
                the selected history.
              </span>
            </div>
          </div>

          <div className="fs-networth-health">
            <span />
            Financial position tracked
          </div>
        </footer>
      )}

      <style>{`
        .fs-networth-chart {
          --nw-bg: var(--fs-bg-card, #10131a);
          --nw-border: var(--fs-border, rgba(255,255,255,.08));
          --nw-text: var(--fs-text-primary, #f8fafc);
          --nw-muted: var(--fs-text-secondary, #94a3b8);

          position: relative;
          width: 100%;
          overflow: hidden;
          border: 1px solid var(--nw-border);
          border-radius: 22px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(124,58,237,.065),
              transparent 34%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,.006)
            ),
            var(--nw-bg);
          box-sizing: border-box;
        }

        .fs-networth-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 19px 20px 14px;
        }

        .fs-networth-heading {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .fs-networth-icon {
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

        .fs-networth-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fs-networth-title-row h3 {
          margin: 0;
          color: var(--nw-text);
          font-size: 14px;
          font-weight: 760;
          letter-spacing: -.02em;
        }

        .fs-networth-heading p {
          margin: 4px 0 0;
          color: var(--nw-muted);
          font-size: 10px;
        }

        .fs-networth-live {
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

        .fs-networth-live span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 7px rgba(34,197,94,.8);
          animation: fs-nw-pulse 1.5s ease-in-out infinite;
        }

        .fs-networth-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fs-networth-action {
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

        .fs-networth-action:hover {
          color: #fff;
          border-color: rgba(255,255,255,.13);
          background: rgba(255,255,255,.045);
          transform: translateY(-1px);
        }

        .fs-networth-metrics {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 9px;
          padding: 0 20px 13px;
        }

        .fs-networth-primary-metric,
        .fs-networth-metric {
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 12px;
          background: rgba(255,255,255,.014);
        }

        .fs-networth-label,
        .metric-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(148,163,184,.62);
          font-size: 9px;
          font-weight: 650;
        }

        .fs-networth-label svg {
          color: #a78bfa;
        }

        .fs-networth-primary-metric > strong {
          display: block;
          margin-top: 5px;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -.03em;
        }

        .fs-networth-primary-metric > strong.positive {
          color: #a78bfa;
        }

        .fs-networth-primary-metric > strong.negative {
          color: #f87171;
        }

        .fs-networth-change {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          margin-top: 4px;
          font-size: 8px;
          font-weight: 700;
        }

        .fs-networth-change small {
          margin-left: 2px;
          color: rgba(148,163,184,.4);
          font-size: 7px;
          font-weight: 550;
        }

        .positive {
          color: #22c55e;
        }

        .negative {
          color: #f87171;
        }

        .metric-label i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .asset-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 7px rgba(34,197,94,.5);
        }

        .liability-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #f87171;
          box-shadow: 0 0 7px rgba(248,113,113,.45);
        }

        .net-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow: 0 0 7px rgba(167,139,250,.55);
        }

        .fs-networth-metric > strong {
          display: block;
          margin-top: 6px;
          color: rgba(248,250,252,.88);
          font-size: 14px;
          font-weight: 760;
        }

        .fs-networth-metric > small {
          display: block;
          margin-top: 4px;
          font-size: 8px;
          font-weight: 650;
        }

        .fs-networth-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 20px 8px;
        }

        .fs-networth-range {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 9px;
          background: rgba(255,255,255,.015);
        }

        .fs-networth-range button {
          min-width: 34px;
          height: 25px;
          padding: 0 7px;
          color: rgba(148,163,184,.5);
          border: 0;
          border-radius: 6px;
          background: transparent;
          font: inherit;
          font-size: 8px;
          font-weight: 750;
          cursor: pointer;
        }

        .fs-networth-range button:hover {
          color: rgba(226,232,240,.85);
        }

        .fs-networth-range button.active {
          color: #fff;
          background: rgba(124,58,237,.17);
          box-shadow: inset 0 0 0 1px rgba(124,58,237,.15);
        }

        .fs-networth-legend {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .fs-networth-legend span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(148,163,184,.52);
          font-size: 8px;
          font-weight: 650;
        }

        .fs-networth-chart-area {
          width: 100%;
          padding: 0 8px;
        }

        .fs-networth-tooltip {
          min-width: 185px;
          padding: 11px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 12px;
          background: rgba(13,16,24,.96);
          box-shadow:
            0 18px 45px rgba(0,0,0,.38),
            inset 0 1px 0 rgba(255,255,255,.05);
          backdrop-filter: blur(14px);
        }

        .fs-networth-tooltip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #f8fafc;
          font-size: 10px;
          font-weight: 750;
          margin-bottom: 8px;
        }

        .fs-networth-tooltip-header svg {
          color: #64748b;
        }

        .fs-networth-tooltip-row,
        .fs-networth-tooltip-net {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 4px 0;
          color: #94a3b8;
          font-size: 9px;
        }

        .fs-networth-tooltip-row span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fs-networth-tooltip-row strong {
          color: #e2e8f0;
          font-size: 9px;
        }

        .fs-networth-tooltip-divider {
          height: 1px;
          margin: 6px 0;
          background: rgba(255,255,255,.06);
        }

        .fs-networth-tooltip-net strong {
          font-size: 10px;
        }

        .fs-networth-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 11px 20px 14px;
          border-top: 1px solid rgba(255,255,255,.045);
        }

        .fs-networth-insight {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fs-networth-insight-icon {
          width: 27px;
          height: 27px;
          flex: 0 0 27px;
          display: grid;
          place-items: center;
          color: #a78bfa;
          border-radius: 8px;
          background: rgba(124,58,237,.08);
        }

        .fs-networth-insight > div:last-child {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .fs-networth-insight strong {
          overflow: hidden;
          color: rgba(226,232,240,.72);
          font-size: 9px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-networth-insight span {
          margin-top: 2px;
          overflow: hidden;
          color: rgba(148,163,184,.42);
          font-size: 8px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-networth-health {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(34,197,94,.62);
          font-size: 8px;
          font-weight: 700;
          white-space: nowrap;
        }

        .fs-networth-health > span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,.65);
        }

        @keyframes fs-nw-pulse {
          0%, 100% {
            opacity: .5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }

        @media (max-width: 760px) {
          .fs-networth-metrics {
            grid-template-columns: 1fr 1fr;
          }

          .fs-networth-primary-metric {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 560px) {
          .fs-networth-header {
            padding: 16px;
          }

          .fs-networth-metrics {
            grid-template-columns: 1fr;
            padding: 0 16px 12px;
          }

          .fs-networth-primary-metric {
            grid-column: auto;
          }

          .fs-networth-toolbar {
            padding: 0 16px 8px;
          }

          .fs-networth-legend {
            display: none;
          }

          .fs-networth-chart-area {
            padding: 0 2px;
          }

          .fs-networth-footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 11px 16px 14px;
          }

          .fs-networth-health {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-networth-live span {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

NetWorthChart.displayName = 'NetWorthChart';

export default NetWorthChart;