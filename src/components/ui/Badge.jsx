import React from 'react';

import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Circle,
  Clock3,
  Info,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

const VARIANTS = {
  default: {
    color: '#cbd5e1',
    background: 'rgba(148,163,184,.10)',
    border: 'rgba(148,163,184,.20)',
    glow: 'rgba(148,163,184,.16)',
  },

  primary: {
    color: '#c4b5fd',
    background: 'rgba(139,92,246,.12)',
    border: 'rgba(139,92,246,.28)',
    glow: 'rgba(139,92,246,.22)',
  },

  success: {
    color: '#6ee7b7',
    background: 'rgba(16,185,129,.11)',
    border: 'rgba(52,211,153,.28)',
    glow: 'rgba(16,185,129,.20)',
  },

  danger: {
    color: '#fca5a5',
    background: 'rgba(239,68,68,.11)',
    border: 'rgba(248,113,113,.28)',
    glow: 'rgba(239,68,68,.20)',
  },

  warning: {
    color: '#fcd34d',
    background: 'rgba(245,158,11,.11)',
    border: 'rgba(251,191,36,.28)',
    glow: 'rgba(245,158,11,.20)',
  },

  info: {
    color: '#7dd3fc',
    background: 'rgba(14,165,233,.11)',
    border: 'rgba(56,189,248,.28)',
    glow: 'rgba(14,165,233,.20)',
  },

  cyan: {
    color: '#67e8f9',
    background: 'rgba(6,182,212,.11)',
    border: 'rgba(34,211,238,.28)',
    glow: 'rgba(6,182,212,.20)',
  },

  pink: {
    color: '#f9a8d4',
    background: 'rgba(236,72,153,.11)',
    border: 'rgba(244,114,182,.28)',
    glow: 'rgba(236,72,153,.20)',
  },

  orange: {
    color: '#fdba74',
    background: 'rgba(249,115,22,.11)',
    border: 'rgba(251,146,60,.28)',
    glow: 'rgba(249,115,22,.20)',
  },

  premium: {
    color: '#ede9fe',
    background:
      'linear-gradient(135deg, rgba(139,92,246,.20), rgba(79,70,229,.12))',
    border: 'rgba(167,139,250,.38)',
    glow: 'rgba(124,58,237,.26)',
  },

  glass: {
    color: '#e2e8f0',
    background:
      'linear-gradient(135deg, rgba(255,255,255,.085), rgba(255,255,255,.025))',
    border: 'rgba(255,255,255,.14)',
    glow: 'rgba(255,255,255,.08)',
  },
};

const SIZES = {
  xs: {
    height: 21,
    padding: '0 7px',
    fontSize: 9,
    radius: 6,
    icon: 10,
    gap: 4,
  },

  sm: {
    height: 25,
    padding: '0 9px',
    fontSize: 10,
    radius: 7,
    icon: 11,
    gap: 5,
  },

  md: {
    height: 29,
    padding: '0 10px',
    fontSize: 11,
    radius: 8,
    icon: 13,
    gap: 5,
  },

  lg: {
    height: 34,
    padding: '0 13px',
    fontSize: 12,
    radius: 10,
    icon: 15,
    gap: 6,
  },

  xl: {
    height: 40,
    padding: '0 16px',
    fontSize: 13,
    radius: 12,
    icon: 17,
    gap: 7,
  },
};

const ICONS = {
  success: Check,
  danger: X,
  warning: AlertTriangle,
  info: Info,
  error: AlertCircle,
  pending: Clock3,
  active: Zap,
  positive: TrendingUp,
  negative: TrendingDown,
  increase: ArrowUp,
  decrease: ArrowDown,
  neutral: Minus,
  premium: Sparkles,
};

function resolveIcon(
  icon,
  variant,
  status,
) {
  if (icon === false) {
    return null;
  }

  if (React.isValidElement(icon)) {
    return icon;
  }

  if (typeof icon === 'function') {
    return React.createElement(
      icon,
    );
  }

  if (
    typeof icon === 'string' &&
    ICONS[icon]
  ) {
    return React.createElement(
      ICONS[icon],
    );
  }

  if (
    status &&
    ICONS[status]
  ) {
    return React.createElement(
      ICONS[status],
    );
  }

  if (
    variant &&
    ICONS[variant]
  ) {
    return React.createElement(
      ICONS[variant],
    );
  }

  return null;
}

function normalizeVariant(
  variant,
  status,
) {
  const statusMap = {
    success: 'success',
    completed: 'success',
    paid: 'success',
    active: 'success',

    danger: 'danger',
    failed: 'danger',
    overdue: 'danger',
    error: 'danger',

    warning: 'warning',
    pending: 'warning',
    watch: 'warning',

    info: 'info',
    processing: 'info',

    positive: 'success',
    negative: 'danger',
    neutral: 'default',

    premium: 'premium',
  };

  if (
    variant &&
    VARIANTS[variant]
  ) {
    return variant;
  }

  if (
    status &&
    statusMap[status]
  ) {
    return statusMap[status];
  }

  return 'default';
}

export default function Badge({
  children,

  variant = 'default',
  status,

  size = 'md',

  icon,
  iconPosition = 'left',

  dot = false,
  pulse = false,

  removable = false,
  onRemove,

  interactive = false,
  selected = false,

  outline = false,
  soft = true,

  glow = false,
  shimmer = false,

  uppercase = false,
  truncate = false,

  maxWidth,

  className = '',
  style = {},

  title,

  ...props
}) {
  const resolvedVariant =
    normalizeVariant(
      variant,
      status,
    );

  const theme =
    VARIANTS[
      resolvedVariant
    ] ?? VARIANTS.default;

  const sizeConfig =
    SIZES[size] ?? SIZES.md;

  const resolvedIcon =
    resolveIcon(
      icon,
      resolvedVariant,
      status,
    );

  const iconElement =
    resolvedIcon
      ? React.cloneElement(
          resolvedIcon,
          {
            size:
              resolvedIcon.props?.size ??
              sizeConfig.icon,

            strokeWidth:
              resolvedIcon.props?.strokeWidth ??
              2.2,

            'aria-hidden':
              true,
          },
        )
      : null;

  const isClickable =
    interactive ||
    typeof props.onClick ===
      'function';

  const computedBackground =
    outline
      ? 'transparent'
      : soft
        ? theme.background
        : theme.color;

  const computedColor =
    outline
      ? theme.color
      : soft
        ? theme.color
        : '#0f172a';

  return (
    <>
      <span
        className={[
          'fs-badge',
          `fs-badge-${resolvedVariant}`,
          `fs-badge-${size}`,
          isClickable
            ? 'fs-badge-interactive'
            : '',
          selected
            ? 'fs-badge-selected'
            : '',
          pulse
            ? 'fs-badge-pulse'
            : '',
          shimmer
            ? 'fs-badge-shimmer'
            : '',
          glow
            ? 'fs-badge-glow'
            : '',
          uppercase
            ? 'fs-badge-uppercase'
            : '',
          truncate
            ? 'fs-badge-truncate'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        title={title}
        role={
          isClickable
            ? 'button'
            : undefined
        }
        tabIndex={
          isClickable
            ? 0
            : undefined
        }
        style={{
          '--badge-color':
            theme.color,

          '--badge-bg':
            computedBackground,

          '--badge-border':
            theme.border,

          '--badge-glow':
            theme.glow,

          '--badge-height':
            `${sizeConfig.height}px`,

          '--badge-padding':
            sizeConfig.padding,

          '--badge-font-size':
            `${sizeConfig.fontSize}px`,

          '--badge-radius':
            `${sizeConfig.radius}px`,

          '--badge-icon-size':
            `${sizeConfig.icon}px`,

          '--badge-gap':
            `${sizeConfig.gap}px`,

          '--badge-max-width':
            maxWidth
              ? typeof maxWidth ===
                'number'
                ? `${maxWidth}px`
                : maxWidth
              : undefined,

          color:
            computedColor,

          ...style,
        }}
        onKeyDown={(event) => {
          if (
            !isClickable
          ) {
            return;
          }

          if (
            event.key ===
              'Enter' ||
            event.key ===
              ' '
          ) {
            event.preventDefault();
            props.onClick?.(event);
          }
        }}
        {...props}
      >
        <span className="fs-badge-inner">
          {dot && (
            <span
              className={[
                'fs-badge-dot',
                pulse
                  ? 'fs-badge-dot-pulse'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span />
            </span>
          )}

          {iconPosition ===
            'left' &&
            iconElement}

          <span className="fs-badge-content">
            {children}
          </span>

          {iconPosition ===
            'right' &&
            iconElement}

          {removable && (
            <button
              type="button"
              className="fs-badge-remove"
              aria-label="Remove"
              onClick={(event) => {
                event.stopPropagation();
                onRemove?.(event);
              }}
            >
              <X
                size={
                  Math.max(
                    10,
                    sizeConfig.icon -
                      2,
                  )
                }
                strokeWidth={2.5}
              />
            </button>
          )}
        </span>

        {selected && (
          <span className="fs-badge-selection-mark">
            <Check
              size={9}
              strokeWidth={3}
            />
          </span>
        )}

        {shimmer && (
          <span className="fs-badge-shimmer-layer" />
        )}
      </span>

      <style>{`
        .fs-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          height: var(--badge-height);
          max-width: var(--badge-max-width);
          padding: 0 var(--badge-padding);
          border: 1px solid var(--badge-border);
          border-radius: var(--badge-radius);
          background: var(--badge-bg);
          color: var(--badge-color);
          font-family: inherit;
          font-size: var(--badge-font-size);
          font-weight: 650;
          line-height: 1;
          letter-spacing: -.005em;
          vertical-align: middle;
          overflow: hidden;
          white-space: nowrap;
          box-sizing: border-box;
          transition:
            transform .2s cubic-bezier(.22,1,.36,1),
            border-color .2s ease,
            background .2s ease,
            box-shadow .25s ease,
            filter .2s ease;
        }

        .fs-badge-inner {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--badge-gap);
          min-width: 0;
          max-width: 100%;
        }

        .fs-badge-content {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fs-badge-truncate {
          max-width:
            var(--badge-max-width, 180px);
        }

        .fs-badge-uppercase {
          text-transform: uppercase;
          letter-spacing: .055em;
          font-size:
            calc(var(--badge-font-size) - 1px);
          font-weight: 750;
        }

        .fs-badge-interactive {
          cursor: pointer;
        }

        .fs-badge-interactive:hover {
          transform: translateY(-1px);
          filter: brightness(1.12);
          box-shadow:
            0 7px 22px var(--badge-glow);
        }

        .fs-badge-interactive:active {
          transform: translateY(0) scale(.97);
        }

        .fs-badge-interactive:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px
              rgba(139,92,246,.16),
            0 0 0 1px
              var(--badge-color);
        }

        .fs-badge-selected {
          border-color:
            color-mix(
              in srgb,
              var(--badge-color) 55%,
              transparent
            );
          box-shadow:
            inset 0 0 0 1px
              rgba(255,255,255,.035),
            0 0 20px
              var(--badge-glow);
        }

        .fs-badge-dot {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--badge-icon-size);
          height: var(--badge-icon-size);
          flex: 0 0 auto;
        }

        .fs-badge-dot > span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background:
            currentColor;
          box-shadow:
            0 0 8px
              currentColor;
        }

        .fs-badge-dot-pulse::before {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          border: 1px solid currentColor;
          opacity: .55;
          animation:
            fs-badge-pulse
            1.8s ease-out infinite;
        }

        .fs-badge-remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: calc(
            var(--badge-icon-size) + 4px
          );
          height: calc(
            var(--badge-icon-size) + 4px
          );
          margin-right: -3px;
          margin-left: 1px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: currentColor;
          cursor: pointer;
          opacity: .62;
          transition:
            opacity .15s ease,
            background .15s ease,
            transform .15s ease;
        }

        .fs-badge-remove:hover {
          opacity: 1;
          background:
            rgba(255,255,255,.10);
          transform: scale(1.08);
        }

        .fs-badge-selection-mark {
          position: absolute;
          right: 3px;
          top: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background:
            var(--badge-color);
          color: #0f172a;
          box-shadow:
            0 2px 7px
              var(--badge-glow);
        }

        .fs-badge-glow {
          box-shadow:
            0 0 18px
              var(--badge-glow);
        }

        .fs-badge-pulse {
          animation:
            fs-badge-breathe
            2.2s ease-in-out infinite;
        }

        .fs-badge-shimmer-layer {
          position: absolute;
          z-index: 1;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              110deg,
              transparent 20%,
              rgba(255,255,255,.18) 45%,
              transparent 70%
            );
          transform:
            translateX(-130%);
          animation:
            fs-badge-shimmer
            3.4s ease-in-out infinite;
        }

        .fs-badge-primary {
          text-shadow:
            0 0 14px
              rgba(139,92,246,.22);
        }

        .fs-badge-premium {
          box-shadow:
            inset 0 1px 0
              rgba(255,255,255,.08),
            0 7px 24px
              rgba(124,58,237,.14);
        }

        .fs-badge-glass {
          backdrop-filter:
            blur(14px);
          -webkit-backdrop-filter:
            blur(14px);
        }

        .fs-badge-success .fs-badge-dot > span {
          box-shadow:
            0 0 9px
              rgba(52,211,153,.9);
        }

        .fs-badge-danger .fs-badge-dot > span {
          box-shadow:
            0 0 9px
              rgba(248,113,113,.9);
        }

        .fs-badge-warning .fs-badge-dot > span {
          box-shadow:
            0 0 9px
              rgba(251,191,36,.9);
        }

        .fs-badge-info .fs-badge-dot > span {
          box-shadow:
            0 0 9px
              rgba(56,189,248,.9);
        }

        @keyframes fs-badge-pulse {
          0% {
            opacity: .7;
            transform: scale(.65);
          }

          70% {
            opacity: 0;
            transform: scale(1.65);
          }

          100% {
            opacity: 0;
            transform: scale(1.65);
          }
        }

        @keyframes fs-badge-breathe {
          0%,
          100% {
            box-shadow:
              0 0 0 transparent;
          }

          50% {
            box-shadow:
              0 0 18px
                var(--badge-glow);
          }
        }

        @keyframes fs-badge-shimmer {
          0%,
          35% {
            transform:
              translateX(-130%);
          }

          65%,
          100% {
            transform:
              translateX(130%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-badge,
          .fs-badge-dot-pulse::before,
          .fs-badge-pulse,
          .fs-badge-shimmer-layer {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}