import React from 'react';
import {
  Check,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

const VARIANTS = {
  default: {
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,.45)',
  },
  success: {
    color: '#10b981',
    glow: 'rgba(16,185,129,.45)',
  },
  warning: {
    color: '#f59e0b',
    glow: 'rgba(245,158,11,.45)',
  },
  danger: {
    color: '#ef4444',
    glow: 'rgba(239,68,68,.45)',
  },
  info: {
    color: '#0ea5e9',
    glow: 'rgba(14,165,233,.45)',
  },
};

export default function ProgressBar({
  value = 0,
  max = 100,

  label,
  description,

  variant = 'default',
  size = 'md',

  showValue = false,
  showPercentage = true,

  animated = true,
  striped = false,
  glow = true,

  status,
  statusLabel,

  icon,
  prefix,
  suffix = '%',

  segments = false,
  segmentCount = 20,

  indeterminate = false,

  className = '',
  style = {},

  height,
}) {
  const safeMax =
    Number(max) > 0
      ? Number(max)
      : 100;

  const numericValue =
    Number(value) || 0;

  const percentage = Math.min(
    100,
    Math.max(
      0,
      (numericValue / safeMax) * 100,
    ),
  );

  const roundedPercentage =
    Math.round(percentage);

  const theme =
    VARIANTS[variant] ||
    VARIANTS.default;

  const sizeMap = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 11,
    xl: 15,
  };

  const barHeight =
    height ||
    sizeMap[size] ||
    sizeMap.md;

  let resolvedStatus =
    status;

  if (!resolvedStatus) {
    if (percentage >= 100) {
      resolvedStatus = 'danger';
    } else if (percentage >= 85) {
      resolvedStatus = 'warning';
    } else if (percentage >= 60) {
      resolvedStatus = 'success';
    } else {
      resolvedStatus = 'default';
    }
  }

  const statusTheme =
    VARIANTS[
      resolvedStatus
    ] || theme;

  const StatusIcon =
    resolvedStatus === 'success'
      ? Check
      : resolvedStatus === 'warning' ||
          resolvedStatus === 'danger'
        ? AlertTriangle
        : TrendingUp;

  const displayValue =
    showValue
      ? `${prefix ?? ''}${numericValue.toLocaleString()}${suffix ?? ''}`
      : null;

  return (
    <div
      className={[
        'fs-progress',
        `fs-progress-${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {(label ||
        description ||
        showPercentage ||
        showValue ||
        statusLabel) && (
        <div className="fs-progress-header">
          <div className="fs-progress-heading">
            {icon && (
              <span className="fs-progress-icon">
                {React.isValidElement(
                  icon,
                )
                  ? icon
                  : React.createElement(
                      icon,
                      {
                        size: 14,
                      },
                    )}
              </span>
            )}

            <div>
              {label && (
                <div className="fs-progress-label">
                  {label}
                </div>
              )}

              {description && (
                <div className="fs-progress-description">
                  {description}
                </div>
              )}
            </div>
          </div>

          <div className="fs-progress-meta">
            {statusLabel && (
              <span
                className="fs-progress-status"
                style={{
                  color:
                    statusTheme.color,
                  background:
                    statusTheme.glow,
                }}
              >
                <StatusIcon
                  size={11}
                  strokeWidth={2.5}
                />
                {statusLabel}
              </span>
            )}

            {showValue && (
              <span className="fs-progress-value">
                {displayValue}
              </span>
            )}

            {showPercentage && (
              <span
                className="fs-progress-percent"
                style={{
                  color:
                    statusTheme.color,
                }}
              >
                {roundedPercentage}%
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={[
          'fs-progress-track',
          segments
            ? 'fs-progress-segmented'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          '--progress-height':
            `${barHeight}px`,
          '--progress-color':
            statusTheme.color,
          '--progress-glow':
            statusTheme.glow,
          '--segment-count':
            segmentCount,
        }}
        role="progressbar"
        aria-valuenow={
          indeterminate
            ? undefined
            : numericValue
        }
        aria-valuemin="0"
        aria-valuemax={safeMax}
        aria-label={
          label ||
          'Progress'
        }
      >
        {segments ? (
          <div className="fs-progress-segments">
            {Array.from({
              length: Math.max(
                1,
                segmentCount,
              ),
            }).map(
              (_, index) => {
                const segmentProgress =
                  ((index + 1) /
                    Math.max(
                      1,
                      segmentCount,
                    )) *
                  100;

                const active =
                  percentage >=
                  segmentProgress;

                return (
                  <span
                    key={index}
                    className={[
                      'fs-progress-segment',
                      active
                        ? 'is-active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={
                      active
                        ? {
                            background:
                              statusTheme.color,
                            boxShadow:
                              glow
                                ? `0 0 12px ${statusTheme.glow}`
                                : undefined,
                          }
                        : undefined
                    }
                  />
                );
              },
            )}
          </div>
        ) : (
          <>
            <div className="fs-progress-track-inner" />

            <div
              className={[
                'fs-progress-fill',
                animated
                  ? 'fs-progress-animated'
                  : '',
                striped
                  ? 'fs-progress-striped'
                  : '',
                indeterminate
                  ? 'fs-progress-indeterminate'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                width: indeterminate
                  ? '42%'
                  : `${percentage}%`,
                background:
                  `linear-gradient(
                    90deg,
                    ${statusTheme.color},
                    color-mix(
                      in srgb,
                      ${statusTheme.color} 72%,
                      white
                    )
                  )`,
                boxShadow: glow
                  ? `0 0 16px ${statusTheme.glow}`
                  : 'none',
              }}
            >
              {animated &&
                !indeterminate && (
                  <span className="fs-progress-shimmer" />
                )}
            </div>

            <div className="fs-progress-marker">
              <span />
            </div>
          </>
        )}
      </div>

      {!segments &&
        !indeterminate &&
        percentage >= 100 && (
          <div
            className="fs-progress-complete"
            style={{
              color:
                statusTheme.color,
            }}
          >
            <Check
              size={12}
              strokeWidth={2.5}
            />
            Target reached
          </div>
        )}

      <style>{`
        .fs-progress {
          width: 100%;
          min-width: 0;
        }

        .fs-progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
        }

        .fs-progress-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .fs-progress-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          color: #94a3b8;
        }

        .fs-progress-label {
          overflow: hidden;
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 650;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-progress-description {
          margin-top: 2px;
          overflow: hidden;
          color: #475569;
          font-size: 9px;
          font-weight: 500;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fs-progress-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex: 0 0 auto;
        }

        .fs-progress-value {
          color: #64748b;
          font-size: 10px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .fs-progress-percent {
          min-width: 32px;
          font-size: 11px;
          font-weight: 750;
          font-variant-numeric: tabular-nums;
          text-align: right;
        }

        .fs-progress-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 7px;
          border: 1px solid
            rgba(255,255,255,.06);
          border-radius: 999px;
          font-size: 8px;
          font-weight: 700;
          line-height: 1;
        }

        .fs-progress-track {
          position: relative;
          width: 100%;
          height: var(--progress-height);
          min-height: 4px;
          overflow: hidden;
          border-radius: 999px;
          background:
            linear-gradient(
              180deg,
              rgba(30,41,59,.82),
              rgba(15,23,42,.92)
            );
          border: 1px solid
            rgba(148,163,184,.07);
          box-shadow:
            inset 0 1px 2px
              rgba(0,0,0,.24);
        }

        .fs-progress-track-inner {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            repeating-linear-gradient(
              90deg,
              transparent 0,
              transparent 9.9%,
              rgba(255,255,255,.025) 10%,
              transparent 10.2%
            );
        }

        .fs-progress-fill {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          min-width: 0;
          border-radius: inherit;
          transition:
            width .7s
            cubic-bezier(.22,1,.36,1);
          overflow: hidden;
        }

        .fs-progress-animated {
          will-change: width;
        }

        .fs-progress-shimmer {
          position: absolute;
          inset: 0;
          width: 38%;
          transform: translateX(-130%);
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.28),
              transparent
            );
          animation:
            fs-progress-shimmer
            2.2s
            ease-in-out
            infinite;
        }

        .fs-progress-striped {
          background-image:
            linear-gradient(
              135deg,
              rgba(255,255,255,.14) 25%,
              transparent 25%,
              transparent 50%,
              rgba(255,255,255,.14) 50%,
              rgba(255,255,255,.14) 75%,
              transparent 75%
            ) !important;
          background-size:
            18px 18px !important;
          animation:
            fs-progress-stripes
            1s
            linear
            infinite;
        }

        .fs-progress-indeterminate {
          animation:
            fs-progress-indeterminate
            1.25s
            cubic-bezier(.65,0,.35,1)
            infinite;
        }

        .fs-progress-marker {
          position: absolute;
          top: 50%;
          right: 0;
          width: 1px;
          height: 65%;
          transform:
            translateY(-50%);
          background:
            rgba(255,255,255,.12);
          pointer-events: none;
        }

        .fs-progress-marker span {
          display: block;
          width: 2px;
          height: 2px;
          margin:
            0 auto;
          border-radius: 50%;
          background:
            rgba(255,255,255,.5);
        }

        .fs-progress-segments {
          display: grid;
          grid-template-columns:
            repeat(
              var(--segment-count),
              minmax(0, 1fr)
            );
          gap: 3px;
          width: 100%;
          height: 100%;
        }

        .fs-progress-segment {
          min-width: 0;
          border-radius: 3px;
          background:
            rgba(51,65,85,.62);
          transition:
            background .25s ease,
            box-shadow .25s ease,
            transform .25s ease;
        }

        .fs-progress-segment.is-active {
          transform:
            scaleY(.94);
        }

        .fs-progress-complete {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          font-size: 9px;
          font-weight: 650;
        }

        .fs-progress-xs
        .fs-progress-header {
          margin-bottom: 5px;
        }

        .fs-progress-xs
        .fs-progress-label {
          font-size: 9px;
        }

        .fs-progress-xl
        .fs-progress-label {
          font-size: 13px;
        }

        @keyframes fs-progress-shimmer {
          0% {
            transform:
              translateX(-130%);
          }

          55%,
          100% {
            transform:
              translateX(330%);
          }
        }

        @keyframes fs-progress-stripes {
          from {
            background-position:
              0 0;
          }

          to {
            background-position:
              18px 0;
          }
        }

        @keyframes fs-progress-indeterminate {
          0% {
            left: -42%;
            width: 28%;
          }

          50% {
            left: 36%;
            width: 48%;
          }

          100% {
            left: 110%;
            width: 28%;
          }
        }

        @media (max-width: 520px) {
          .fs-progress-header {
            gap: 8px;
          }

          .fs-progress-description {
            display: none;
          }

          .fs-progress-meta {
            gap: 5px;
          }

          .fs-progress-status {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-progress-fill,
          .fs-progress-shimmer,
          .fs-progress-striped,
          .fs-progress-indeterminate,
          .fs-progress-segment {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}