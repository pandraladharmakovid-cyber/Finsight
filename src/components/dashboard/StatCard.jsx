import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';

const DEFAULT_ICONS = {
  wallet: Wallet,
  income: ArrowUpRight,
  expense: ArrowDownRight,
  trend: TrendingUp,
  activity: Activity,
};

const formatValue = (value, format, currency) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const numericValue = Number(value);

  if (format === 'currency') {
    if (!Number.isFinite(numericValue)) return String(value);

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(numericValue);
  }

  if (format === 'number') {
    if (!Number.isFinite(numericValue)) return String(value);

    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(numericValue);
  }

  if (format === 'compactCurrency') {
    if (!Number.isFinite(numericValue)) return String(value);

    const absolute = Math.abs(numericValue);

    if (absolute >= 10000000) {
      return `₹${(numericValue / 10000000).toFixed(1)}Cr`;
    }

    if (absolute >= 100000) {
      return `₹${(numericValue / 100000).toFixed(1)}L`;
    }

    if (absolute >= 1000) {
      return `₹${(numericValue / 1000).toFixed(1)}K`;
    }

    return `₹${Math.round(numericValue)}`;
  }

  if (format === 'percent') {
    if (!Number.isFinite(numericValue)) return String(value);

    return `${numericValue.toFixed(1)}%`;
  }

  return String(value);
};

const getTrendState = (trend, inverse = false) => {
  const numericTrend = Number(trend);

  if (!Number.isFinite(numericTrend) || numericTrend === 0) {
    return {
      direction: 'neutral',
      value: 0,
    };
  }

  const positive =
    inverse ? numericTrend < 0 : numericTrend > 0;

  return {
    direction: positive ? 'positive' : 'negative',
    value: Math.abs(numericTrend),
  };
};

const Sparkline = ({
  data = [],
  positive = true,
}) => {
  const points = useMemo(() => {
    const values = data
      .map(Number)
      .filter(Number.isFinite);

    if (values.length < 2) {
      return '';
    }

    const width = 150;
    const height = 42;
    const padding = 3;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x =
          padding +
          (index / (values.length - 1)) *
            (width - padding * 2);

        const y =
          height -
          padding -
          ((value - min) / range) *
            (height - padding * 2);

        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  if (!points) {
    return (
      <div className="fs-stat-spark-empty">
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
      className={`fs-stat-sparkline ${
        positive
          ? 'fs-stat-spark-positive'
          : 'fs-stat-spark-negative'
      }`}
      viewBox="0 0 150 42"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`spark-gradient-${positive ? 'positive' : 'negative'}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopOpacity="0.28"
          />
          <stop
            offset="100%"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

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
};

const ProgressRing = ({
  value = 0,
  size = 46,
  stroke = 4,
}) => {
  const normalized = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference -
    (normalized / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="fs-stat-ring"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.10"
        strokeWidth={stroke}
      />

      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${
          size / 2
        })`}
      />
    </svg>
  );
};

export default function StatCard({
  title,
  label,
  value,
  subtitle,
  description,
  trend,
  trendLabel = 'vs previous period',
  trendDirection,
  inverseTrend = false,
  icon,
  iconName = 'wallet',
  format = 'currency',
  currency = 'INR',
  sparkline = [],
  progress,
  progressLabel,
  loading = false,
  error = false,
  variant = 'default',
  accent,
  badge,
  menu = false,
  onMenuClick,
  onClick,
  footer,
  className = '',
  animated = true,
}) {
  const [displayValue, setDisplayValue] = useState(
    value
  );

  useEffect(() => {
    if (!animated || loading) {
      setDisplayValue(value);
      return;
    }

    const numericTarget = Number(value);

    if (!Number.isFinite(numericTarget)) {
      setDisplayValue(value);
      return;
    }

    const numericStart = Number(displayValue);

    if (!Number.isFinite(numericStart)) {
      setDisplayValue(value);
      return;
    }

    const duration = 650;
    const startTime = performance.now();

    let frameId;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progressValue = Math.min(
        elapsed / duration,
        1
      );

      const eased =
        1 -
        Math.pow(1 - progressValue, 3);

      setDisplayValue(
        numericStart +
          (numericTarget - numericStart) * eased
      );

      if (progressValue < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value, loading, animated]);

  const resolvedTitle = title || label || 'Metric';

  const Icon =
    typeof icon === 'function'
      ? icon
      : icon ||
        DEFAULT_ICONS[iconName] ||
        DEFAULT_ICONS.wallet;

  const trendState =
    trendDirection &&
    trendDirection !== 'neutral'
      ? {
          direction: trendDirection,
          value: Math.abs(Number(trend) || 0),
        }
      : getTrendState(trend, inverseTrend);

  const formattedValue = formatValue(
    displayValue,
    format,
    currency
  );

  const numericProgress = Number(progress);

  const progressAvailable = Number.isFinite(
    numericProgress
  );

  const cardClass = [
    'fs-stat-card',
    `fs-stat-card-${variant}`,
    trendState.direction === 'positive'
      ? 'fs-stat-card-trend-positive'
      : '',
    trendState.direction === 'negative'
      ? 'fs-stat-card-trend-negative'
      : '',
    loading ? 'fs-stat-card-loading' : '',
    error ? 'fs-stat-card-error' : '',
    onClick ? 'fs-stat-card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={cardClass}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          onClick(event);
        }
      }}
    >
      <style>{`
        .fs-stat-card {
          --fs-stat-accent: #60a5fa;
          position: relative;
          min-width: 0;
          overflow: hidden;
          padding: 19px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 100% 0%,
              color-mix(
                in srgb,
                var(--fs-stat-accent) 8%,
                transparent
              ),
              transparent 34%
            ),
            linear-gradient(
              145deg,
              rgba(30, 41, 59, 0.78),
              rgba(15, 23, 42, 0.70)
            );
          box-shadow:
            0 16px 40px rgba(0, 0, 0, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .fs-stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 18px;
          right: 18px;
          height: 1px;
          background:
            linear-gradient(
              90deg,
              transparent,
              color-mix(
                in srgb,
                var(--fs-stat-accent) 45%,
                transparent
              ),
              transparent
            );
          opacity: 0.8;
        }

        .fs-stat-card::after {
          content: "";
          position: absolute;
          width: 130px;
          height: 130px;
          right: -75px;
          top: -75px;
          border-radius: 50%;
          background: var(--fs-stat-accent);
          opacity: 0.035;
          filter: blur(8px);
          pointer-events: none;
        }

        .fs-stat-card-clickable {
          cursor: pointer;
        }

        .fs-stat-card-clickable:hover {
          transform: translateY(-2px);
          border-color: color-mix(
            in srgb,
            var(--fs-stat-accent) 30%,
            rgba(148,163,184,.13)
          );
          box-shadow:
            0 22px 50px rgba(0, 0, 0, 0.17),
            inset 0 1px 0 rgba(255, 255, 255, 0.045);
        }

        .fs-stat-card-clickable:focus-visible {
          outline: 2px solid
            color-mix(
              in srgb,
              var(--fs-stat-accent) 70%,
              transparent
            );
          outline-offset: 3px;
        }

        .fs-stat-card-positive {
          --fs-stat-accent: #22c55e;
        }

        .fs-stat-card-success {
          --fs-stat-accent: #22c55e;
        }

        .fs-stat-card-income {
          --fs-stat-accent: #34d399;
        }

        .fs-stat-card-expense {
          --fs-stat-accent: #fb7185;
        }

        .fs-stat-card-danger {
          --fs-stat-accent: #ef4444;
        }

        .fs-stat-card-warning {
          --fs-stat-accent: #f59e0b;
        }

        .fs-stat-card-purple {
          --fs-stat-accent: #a78bfa;
        }

        .fs-stat-card-cyan {
          --fs-stat-accent: #22d3ee;
        }

        .fs-stat-card-loading {
          pointer-events: none;
        }

        .fs-stat-card-error {
          --fs-stat-accent: #ef4444;
        }

        .fs-stat-top {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 17px;
        }

        .fs-stat-icon {
          position: relative;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid
            color-mix(
              in srgb,
              var(--fs-stat-accent) 17%,
              transparent
            );
          border-radius: 13px;
          color: var(--fs-stat-accent);
          background:
            linear-gradient(
              145deg,
              color-mix(
                in srgb,
                var(--fs-stat-accent) 13%,
                transparent
              ),
              color-mix(
                in srgb,
                var(--fs-stat-accent) 5%,
                transparent
              )
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        .fs-stat-icon::after {
          content: "";
          position: absolute;
          inset: 5px;
          border-radius: 9px;
          background: color-mix(
            in srgb,
            var(--fs-stat-accent) 5%,
            transparent
          );
        }

        .fs-stat-icon svg {
          position: relative;
          z-index: 1;
        }

        .fs-stat-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .fs-stat-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 25px;
          padding: 0 8px;
          border: 1px solid
            color-mix(
              in srgb,
              var(--fs-stat-accent) 15%,
              transparent
            );
          border-radius: 8px;
          color: color-mix(
            in srgb,
            var(--fs-stat-accent) 75%,
            #cbd5e1
          );
          background: color-mix(
            in srgb,
            var(--fs-stat-accent) 7%,
            transparent
          );
          font-size: 9px;
          font-weight: 750;
          letter-spacing: .04em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .fs-stat-menu {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(148,163,184,.10);
          border-radius: 8px;
          color: #64748b;
          background: rgba(148,163,184,.035);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .fs-stat-menu:hover {
          color: #cbd5e1;
          border-color: rgba(148,163,184,.22);
          background: rgba(148,163,184,.08);
        }

        .fs-stat-body {
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .fs-stat-label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .075em;
          text-transform: uppercase;
        }

        .fs-stat-label-dot {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;
          border-radius: 50%;
          background: var(--fs-stat-accent);
          box-shadow:
            0 0 0 3px
            color-mix(
              in srgb,
              var(--fs-stat-accent) 8%,
              transparent
            );
        }

        .fs-stat-value-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
        }

        .fs-stat-value {
          min-width: 0;
          overflow: hidden;
          color: #f8fafc;
          font-size: clamp(21px, 2vw, 28px);
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -0.04em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-stat-spark-wrap {
          width: 105px;
          height: 38px;
          flex: 0 0 105px;
          opacity: .85;
        }

        .fs-stat-sparkline {
          width: 100%;
          height: 100%;
          overflow: visible;
          color: var(--fs-stat-accent);
        }

        .fs-stat-spark-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 4px;
          padding: 8px 2px;
          opacity: .35;
        }

        .fs-stat-spark-empty span {
          width: 4px;
          border-radius: 99px;
          background: var(--fs-stat-accent);
        }

        .fs-stat-spark-empty span:nth-child(1) {
          height: 25%;
        }

        .fs-stat-spark-empty span:nth-child(2) {
          height: 48%;
        }

        .fs-stat-spark-empty span:nth-child(3) {
          height: 35%;
        }

        .fs-stat-spark-empty span:nth-child(4) {
          height: 68%;
        }

        .fs-stat-spark-empty span:nth-child(5) {
          height: 54%;
        }

        .fs-stat-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 10px;
        }

        .fs-stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 650;
          white-space: nowrap;
        }

        .fs-stat-trend-icon {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
        }

        .fs-stat-trend-positive
          .fs-stat-trend-icon {
          color: #4ade80;
          background: rgba(34,197,94,.09);
        }

        .fs-stat-trend-negative
          .fs-stat-trend-icon {
          color: #fb7185;
          background: rgba(239,68,68,.09);
        }

        .fs-stat-trend-neutral
          .fs-stat-trend-icon {
          color: #94a3b8;
          background: rgba(148,163,184,.07);
        }

        .fs-stat-trend-value {
          color: #cbd5e1;
          font-weight: 750;
        }

        .fs-stat-trend-positive
          .fs-stat-trend-value {
          color: #4ade80;
        }

        .fs-stat-trend-negative
          .fs-stat-trend-value {
          color: #fb7185;
        }

        .fs-stat-description {
          overflow: hidden;
          color: #64748b;
          font-size: 10px;
          line-height: 1.45;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-stat-progress {
          margin-top: 13px;
        }

        .fs-stat-progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 9px;
          font-weight: 650;
        }

        .fs-stat-progress-value {
          color: #cbd5e1;
          font-weight: 750;
        }

        .fs-stat-progress-track {
          height: 5px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(148,163,184,.09);
        }

        .fs-stat-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: var(--fs-stat-accent);
          box-shadow:
            0 0 12px
            color-mix(
              in srgb,
              var(--fs-stat-accent) 30%,
              transparent
            );
          transition: width 600ms cubic-bezier(.22,1,.36,1);
        }

        .fs-stat-footer {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px solid rgba(148,163,184,.07);
          color: #64748b;
          font-size: 9px;
          line-height: 1.4;
        }

        .fs-stat-ring {
          color: var(--fs-stat-accent);
          flex: 0 0 auto;
        }

        .fs-stat-loading-line {
          overflow: hidden;
          position: relative;
          height: 10px;
          width: 100%;
          border-radius: 5px;
          background: rgba(148,163,184,.08);
        }

        .fs-stat-loading-line::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.08),
              transparent
            );
          animation: fs-stat-shimmer 1.4s infinite;
        }

        .fs-stat-loading-value {
          width: 62%;
          height: 29px;
          margin-top: 7px;
        }

        @keyframes fs-stat-shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @media (max-width: 760px) {
          .fs-stat-card {
            padding: 16px;
          }

          .fs-stat-spark-wrap {
            width: 80px;
            flex-basis: 80px;
          }
        }

        @media (max-width: 460px) {
          .fs-stat-spark-wrap {
            display: none;
          }

          .fs-stat-value {
            font-size: 23px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-stat-card,
          .fs-stat-progress-fill {
            transition: none !important;
          }

          .fs-stat-loading-line::after {
            animation: none !important;
          }
        }
      `}</style>

      <div className="fs-stat-top">
        <div className="fs-stat-icon">
          <Icon size={19} strokeWidth={1.9} />
        </div>

        <div className="fs-stat-actions">
          {badge && (
            <span className="fs-stat-badge">
              {badge}
            </span>
          )}

          {menu && (
            <button
              type="button"
              className="fs-stat-menu"
              aria-label={`More options for ${resolvedTitle}`}
              onClick={(event) => {
                event.stopPropagation();
                onMenuClick?.(event);
              }}
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="fs-stat-body">
        <div className="fs-stat-label">
          <span className="fs-stat-label-dot" />
          {resolvedTitle}
        </div>

        {loading ? (
          <>
            <div className="fs-stat-loading-line fs-stat-loading-value" />
            <div
              className="fs-stat-loading-line"
              style={{ marginTop: 10, width: '42%' }}
            />
          </>
        ) : error ? (
          <>
            <div className="fs-stat-value">—</div>

            <div className="fs-stat-description">
              Unable to load this metric
            </div>
          </>
        ) : (
          <>
            <div className="fs-stat-value-row">
              <div className="fs-stat-value">
                {formattedValue}
              </div>

              {sparkline?.length > 1 && (
                <div className="fs-stat-spark-wrap">
                  <Sparkline
                    data={sparkline}
                    positive={
                      trendState.direction !==
                      'negative'
                    }
                  />
                </div>
              )}
            </div>

            <div className="fs-stat-meta">
              {trend !== undefined &&
              trend !== null ? (
                <div
                  className={`fs-stat-trend fs-stat-trend-${trendState.direction}`}
                >
                  <span className="fs-stat-trend-icon">
                    {trendState.direction ===
                    'positive' ? (
                      <ArrowUpRight size={13} />
                    ) : trendState.direction ===
                      'negative' ? (
                      <ArrowDownRight size={13} />
                    ) : (
                      <Minus size={12} />
                    )}
                  </span>

                  <span className="fs-stat-trend-value">
                    {trendState.value.toFixed(1)}%
                  </span>

                  <span>{trendLabel}</span>
                </div>
              ) : (
                <span className="fs-stat-description">
                  {subtitle ||
                    description ||
                    'Current financial position'}
                </span>
              )}

              {progressAvailable && (
                <ProgressRing
                  value={numericProgress}
                  size={38}
                  stroke={3}
                />
              )}
            </div>

            {description && trend !== undefined && (
              <div className="fs-stat-description">
                {description}
              </div>
            )}

            {progressAvailable && (
              <div className="fs-stat-progress">
                <div className="fs-stat-progress-header">
                  <span>
                    {progressLabel || 'Progress'}
                  </span>

                  <span className="fs-stat-progress-value">
                    {numericProgress.toFixed(0)}%
                  </span>
                </div>

                <div className="fs-stat-progress-track">
                  <div
                    className="fs-stat-progress-fill"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          numericProgress
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {footer && !loading && (
        <div className="fs-stat-footer">
          <Zap size={11} />
          <span>{footer}</span>
        </div>
      )}
    </article>
  );
}