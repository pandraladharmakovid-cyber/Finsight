import React, {
  forwardRef,
  useMemo,
  useState,
} from 'react';

import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const VARIANTS = {
  primary: {
    background:
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    color: '#ffffff',
    border: '1px solid rgba(167,139,250,.55)',
    shadow:
      '0 12px 30px rgba(109,40,217,.28)',
  },

  secondary: {
    background:
      'rgba(255,255,255,.055)',
    color: '#f8fafc',
    border:
      '1px solid rgba(148,163,184,.18)',
    shadow:
      '0 8px 24px rgba(0,0,0,.16)',
  },

  ghost: {
    background: 'transparent',
    color: '#cbd5e1',
    border:
      '1px solid transparent',
    shadow: 'none',
  },

  success: {
    background:
      'linear-gradient(135deg, #10b981, #047857)',
    color: '#ffffff',
    border:
      '1px solid rgba(52,211,153,.45)',
    shadow:
      '0 12px 28px rgba(5,150,105,.24)',
  },

  danger: {
    background:
      'linear-gradient(135deg, #ef4444, #b91c1c)',
    color: '#ffffff',
    border:
      '1px solid rgba(248,113,113,.42)',
    shadow:
      '0 12px 28px rgba(185,28,28,.22)',
  },

  warning: {
    background:
      'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    border:
      '1px solid rgba(251,191,36,.42)',
    shadow:
      '0 12px 28px rgba(217,119,6,.22)',
  },

  glass: {
    background:
      'linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.035))',
    color: '#f8fafc',
    border:
      '1px solid rgba(255,255,255,.14)',
    shadow:
      '0 14px 40px rgba(0,0,0,.18)',
  },

  premium: {
    background:
      'linear-gradient(135deg, #a78bfa, #7c3aed 48%, #4f46e5)',
    color: '#ffffff',
    border:
      '1px solid rgba(196,181,253,.65)',
    shadow:
      '0 14px 38px rgba(124,58,237,.32)',
  },
};

const SIZES = {
  xs: {
    height: 32,
    padding: '0 11px',
    fontSize: 11,
    radius: 9,
    icon: 14,
    gap: 6,
  },

  sm: {
    height: 38,
    padding: '0 14px',
    fontSize: 12,
    radius: 10,
    icon: 15,
    gap: 7,
  },

  md: {
    height: 44,
    padding: '0 17px',
    fontSize: 13,
    radius: 12,
    icon: 17,
    gap: 8,
  },

  lg: {
    height: 50,
    padding: '0 21px',
    fontSize: 14,
    radius: 14,
    icon: 19,
    gap: 9,
  },

  xl: {
    height: 58,
    padding: '0 25px',
    fontSize: 15,
    radius: 16,
    icon: 21,
    gap: 10,
  },
};

function getIconSize(
  icon,
  size,
) {
  if (!icon) {
    return null;
  }

  const iconSize =
    SIZES[size]?.icon ?? 17;

  return React.cloneElement(
    icon,
    {
      size:
        icon.props?.size ??
        iconSize,
      strokeWidth:
        icon.props?.strokeWidth ??
        2,
      'aria-hidden': true,
    },
  );
}

const Button = forwardRef(
  function Button(
    {
      children,

      variant = 'primary',
      size = 'md',

      type = 'button',

      icon,
      iconRight,

      loading = false,
      loadingText = 'Processing...',

      success = false,
      successText = 'Completed',

      disabled = false,

      fullWidth = false,

      rounded = false,

      elevated = true,

      shimmer = false,
      glow = false,

      active = false,

      tooltip,

      ariaLabel,

      className = '',
      style = {},

      onClick,

      ...props
    },
    ref,
  ) {
    const [
      hovered,
      setHovered,
    ] = useState(false);

    const [
      pressed,
      setPressed,
    ] = useState(false);

    const sizeConfig =
      SIZES[size] ?? SIZES.md;

    const variantConfig =
      VARIANTS[variant] ??
      VARIANTS.primary;

    const isDisabled =
      disabled || loading;

    const content = useMemo(() => {
      if (loading) {
        return (
          <>
            <Loader2
              size={sizeConfig.icon}
              strokeWidth={2.2}
              className="fs-button-spin"
            />

            <span>
              {loadingText}
            </span>
          </>
        );
      }

      if (success) {
        return (
          <>
            <Check
              size={sizeConfig.icon}
              strokeWidth={2.5}
            />

            <span>
              {successText}
            </span>
          </>
        );
      }

      return (
        <>
          {icon &&
            getIconSize(
              icon,
              size,
            )}

          {children != null && (
            <span className="fs-button-label">
              {children}
            </span>
          )}

          {iconRight &&
            getIconSize(
              iconRight,
              size,
            )}
        </>
      );
    }, [
      children,
      icon,
      iconRight,
      loading,
      loadingText,
      size,
      sizeConfig.icon,
      success,
      successText,
    ]);

    const computedStyle = {
      '--fs-button-height':
        `${sizeConfig.height}px`,

      '--fs-button-radius':
        rounded
          ? '999px'
          : `${sizeConfig.radius}px`,

      '--fs-button-padding':
        sizeConfig.padding,

      '--fs-button-font-size':
        `${sizeConfig.fontSize}px`,

      '--fs-button-gap':
        `${sizeConfig.gap}px`,

      '--fs-button-bg':
        variantConfig.background,

      '--fs-button-color':
        variantConfig.color,

      '--fs-button-border':
        variantConfig.border,

      '--fs-button-shadow':
        elevated
          ? variantConfig.shadow
          : 'none',

      '--fs-button-hover-shadow':
        elevated
          ? `0 18px 45px rgba(0,0,0,.28)`
          : 'none',

      width: fullWidth
        ? '100%'
        : undefined,

      opacity: isDisabled
        ? 0.55
        : 1,

      transform:
        pressed && !isDisabled
          ? 'translateY(1px) scale(.985)'
          : hovered && !isDisabled
            ? 'translateY(-1px)'
            : 'translateY(0)',

      filter:
        hovered && !isDisabled
          ? 'brightness(1.08)'
          : 'brightness(1)',

      boxShadow:
        glow && hovered
          ? `${variantConfig.shadow}, 0 0 32px rgba(139,92,246,.28)`
          : undefined,

      ...style,
    };

    function handleClick(event) {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      onClick?.(event);
    }

    return (
      <>
        <button
          ref={ref}
          type={type}
          disabled={isDisabled}
          aria-label={
            ariaLabel ??
            tooltip
          }
          aria-busy={loading}
          aria-pressed={
            active
              ? true
              : undefined
          }
          title={tooltip}
          className={[
            'fs-button',
            `fs-button-${variant}`,
            `fs-button-${size}`,
            active
              ? 'fs-button-active'
              : '',
            shimmer
              ? 'fs-button-shimmer'
              : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={computedStyle}
          onClick={handleClick}
          onMouseEnter={() =>
            setHovered(true)
          }
          onMouseLeave={() => {
            setHovered(false);
            setPressed(false);
          }}
          onMouseDown={() =>
            setPressed(true)
          }
          onMouseUp={() =>
            setPressed(false)
          }
          {...props}
        >
          <span className="fs-button-background" />

          {variant ===
            'premium' && (
            <span className="fs-button-premium-icon">
              <Sparkles
                size={11}
                strokeWidth={2.5}
              />
            </span>
          )}

          <span className="fs-button-content">
            {content}
          </span>

          {hovered &&
            !isDisabled && (
              <span className="fs-button-hover-orb" />
            )}
        </button>

        <style>{`
          .fs-button {
            position: relative;
            isolation: isolate;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            height: var(--fs-button-height);
            min-width: max-content;
            padding: 0 var(--fs-button-padding);
            gap: var(--fs-button-gap);
            border: var(--fs-button-border);
            border-radius: var(--fs-button-radius);
            background: var(--fs-button-bg);
            color: var(--fs-button-color);
            box-shadow: var(--fs-button-shadow);
            font-family: inherit;
            font-size: var(--fs-button-font-size);
            font-weight: 650;
            line-height: 1;
            letter-spacing: -.01em;
            cursor: pointer;
            overflow: hidden;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            transition:
              transform .2s cubic-bezier(.22,1,.36,1),
              filter .2s ease,
              box-shadow .25s ease,
              opacity .2s ease,
              border-color .2s ease;
          }

          .fs-button:not(:disabled):hover {
            box-shadow: var(--fs-button-hover-shadow);
          }

          .fs-button:focus-visible {
            outline: none;
            box-shadow:
              0 0 0 3px rgba(139,92,246,.20),
              0 0 0 5px rgba(139,92,246,.08),
              var(--fs-button-shadow);
          }

          .fs-button:disabled {
            cursor: not-allowed;
          }

          .fs-button-background {
            position: absolute;
            inset: 0;
            z-index: -2;
            pointer-events: none;
            background:
              linear-gradient(
                110deg,
                transparent 20%,
                rgba(255,255,255,.07) 45%,
                transparent 70%
              );
            opacity: 0;
            transform: translateX(-120%);
          }

          .fs-button:hover
          .fs-button-background {
            opacity: 1;
            transform: translateX(120%);
            transition:
              transform .8s cubic-bezier(.22,1,.36,1),
              opacity .2s ease;
          }

          .fs-button-content {
            position: relative;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--fs-button-gap);
            white-space: nowrap;
          }

          .fs-button-label {
            display: inline-flex;
            align-items: center;
          }

          .fs-button-hover-orb {
            position: absolute;
            z-index: -1;
            width: 80px;
            height: 80px;
            right: -35px;
            top: -35px;
            border-radius: 50%;
            background:
              radial-gradient(
                circle,
                rgba(255,255,255,.16),
                transparent 68%
              );
            pointer-events: none;
            animation:
              fs-button-orb .7s
              cubic-bezier(.22,1,.36,1)
              forwards;
          }

          .fs-button-premium-icon {
            position: absolute;
            top: 5px;
            right: 7px;
            z-index: 3;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 17px;
            height: 17px;
            border-radius: 50%;
            background: rgba(255,255,255,.18);
            backdrop-filter: blur(8px);
            color: #fff;
            pointer-events: none;
          }

          .fs-button-shimmer::after {
            content: '';
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background:
              linear-gradient(
                115deg,
                transparent 25%,
                rgba(255,255,255,.20) 50%,
                transparent 75%
              );
            transform: translateX(-130%);
            animation:
              fs-button-shimmer 3.2s
              ease-in-out infinite;
          }

          .fs-button-active {
            border-color:
              rgba(167,139,250,.7);
            box-shadow:
              0 0 0 2px
                rgba(139,92,246,.12),
              var(--fs-button-shadow);
          }

          .fs-button-ghost:hover {
            background:
              rgba(255,255,255,.055);
            border-color:
              rgba(148,163,184,.12);
          }

          .fs-button-secondary:hover,
          .fs-button-glass:hover {
            border-color:
              rgba(167,139,250,.32);
          }

          .fs-button-danger:hover {
            border-color:
              rgba(248,113,113,.65);
          }

          .fs-button-success:hover {
            border-color:
              rgba(52,211,153,.65);
          }

          .fs-button-warning:hover {
            border-color:
              rgba(251,191,36,.65);
          }

          .fs-button-spin {
            animation:
              fs-button-spin
              .85s linear infinite;
          }

          @keyframes fs-button-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes fs-button-shimmer {
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

          @keyframes fs-button-orb {
            from {
              opacity: 0;
              transform: scale(.6);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .fs-button,
            .fs-button-background,
            .fs-button-hover-orb {
              transition: none !important;
              animation: none !important;
            }
          }

          @media (max-width: 520px) {
            .fs-button {
              max-width: 100%;
            }

            .fs-button-label {
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        `}</style>
      </>
    );
  },
);

Button.displayName = 'Button';

export default Button;