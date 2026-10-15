import React, {
  forwardRef,
  useState,
} from 'react';

import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Pin,
  Sparkles,
} from 'lucide-react';

const Card = forwardRef(
  function Card(
    {
      children,

      variant = 'default',

      padding = 'lg',

      radius = 'lg',

      hover = false,
      interactive = false,

      glow = false,
      shimmer = false,

      elevated = true,

      bordered = true,

      glass = false,

      compact = false,

      clickable = false,

      selected = false,

      disabled = false,

      onClick,

      onDoubleClick,

      onMouseEnter,
      onMouseLeave,

      header,
      footer,

      title,
      subtitle,

      icon,
      iconColor,

      badge,

      action,

      menu,

      pinned = false,

      expandable = false,
      expanded = true,
      onExpand,

      href,

      target,

      className = '',
      style = {},

      ...props
    },
    ref,
  ) {
    const [
      isHovered,
      setIsHovered,
    ] = useState(false);

    const [
      internalExpanded,
      setInternalExpanded,
    ] = useState(
      expanded,
    );

    const isExpanded =
      expandable
        ? onExpand
          ? expanded
          : internalExpanded
        : true;

    const isInteractive =
      interactive ||
      clickable ||
      typeof onClick ===
        'function';

    const handleEnter = (
      event,
    ) => {
      setIsHovered(true);
      onMouseEnter?.(event);
    };

    const handleLeave = (
      event,
    ) => {
      setIsHovered(false);
      onMouseLeave?.(event);
    };

    const handleExpand = (
      event,
    ) => {
      event.stopPropagation();

      if (onExpand) {
        onExpand(
          !isExpanded,
        );
      } else {
        setInternalExpanded(
          (value) => !value,
        );
      }
    };

    const cardContent =
      (
        <>
          {(header ||
            title ||
            subtitle ||
            icon ||
            badge ||
            action ||
            menu ||
            pinned) && (
            <div className="fs-card-header">
              <div className="fs-card-heading">
                {icon && (
                  <div
                    className="fs-card-icon"
                    style={{
                      color:
                        iconColor ||
                        undefined,
                    }}
                  >
                    {icon}
                  </div>
                )}

                <div className="fs-card-heading-copy">
                  {title && (
                    <div className="fs-card-title-row">
                      <h3 className="fs-card-title">
                        {title}
                      </h3>

                      {badge}
                    </div>
                  )}

                  {subtitle && (
                    <p className="fs-card-subtitle">
                      {subtitle}
                    </p>
                  )}

                  {header}
                </div>
              </div>

              {(action ||
                menu ||
                pinned ||
                expandable) && (
                <div className="fs-card-actions">
                  {pinned && (
                    <span className="fs-card-pin">
                      <Pin
                        size={14}
                        strokeWidth={2}
                        fill="currentColor"
                      />
                    </span>
                  )}

                  {action}

                  {menu && (
                    <button
                      type="button"
                      className="fs-card-menu"
                      aria-label="Card options"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      {menu === true ? (
                        <MoreHorizontal
                          size={18}
                        />
                      ) : (
                        menu
                      )}
                    </button>
                  )}

                  {expandable && (
                    <button
                      type="button"
                      className="fs-card-expand"
                      aria-label={
                        isExpanded
                          ? 'Collapse card'
                          : 'Expand card'
                      }
                      aria-expanded={
                        isExpanded
                      }
                      onClick={
                        handleExpand
                      }
                    >
                      <ChevronDown
                        size={17}
                        strokeWidth={2}
                      />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {isExpanded && (
            <div className="fs-card-body">
              {children}
            </div>
          )}

          {isExpanded &&
            footer && (
              <div className="fs-card-footer">
                {footer}
              </div>
            )}
        </>
      );

    const contentStyle = {
      ...style,
    };

    const commonProps = {
      ref,

      className: [
        'fs-card',
        `fs-card-${variant}`,
        `fs-card-padding-${padding}`,
        `fs-card-radius-${radius}`,

        hover ||
        isInteractive
          ? 'fs-card-hoverable'
          : '',

        isInteractive
          ? 'fs-card-interactive'
          : '',

        glow
          ? 'fs-card-glow'
          : '',

        shimmer
          ? 'fs-card-shimmer'
          : '',

        elevated
          ? 'fs-card-elevated'
          : '',

        bordered
          ? 'fs-card-bordered'
          : '',

        glass
          ? 'fs-card-glass'
          : '',

        compact
          ? 'fs-card-compact'
          : '',

        selected
          ? 'fs-card-selected'
          : '',

        disabled
          ? 'fs-card-disabled'
          : '',

        isHovered
          ? 'fs-card-is-hovered'
          : '',

        className,
      ]
        .filter(Boolean)
        .join(' '),

      style: contentStyle,

      onMouseEnter:
        handleEnter,

      onMouseLeave:
        handleLeave,

      onDoubleClick,

      'aria-disabled':
        disabled || undefined,

      ...props,
    };

    if (href && !disabled) {
      return (
        <>
          <a
            {...commonProps}
            href={href}
            target={target}
            rel={
              target === '_blank'
                ? 'noreferrer'
                : undefined
            }
            onClick={(event) => {
              onClick?.(event);
            }}
          >
            {cardContent}
          </a>

          <CardStyles />
        </>
      );
    }

    return (
      <>
        <div
          {...commonProps}
          role={
            isInteractive
              ? 'button'
              : undefined
          }
          tabIndex={
            isInteractive &&
            !disabled
              ? 0
              : undefined
          }
          onClick={(event) => {
            if (
              disabled
            ) {
              return;
            }

            onClick?.(event);
          }}
          onKeyDown={(event) => {
            if (
              !isInteractive ||
              disabled
            ) {
              return;
            }

            if (
              event.key ===
                'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault();
              onClick?.(event);
            }
          }}
        >
          {cardContent}
        </div>

        <CardStyles />
      </>
    );
  },
);

function CardStyles() {
  return (
    <style>{`
      .fs-card {
        --fs-card-bg:
          rgba(15, 23, 42, .72);

        --fs-card-border:
          rgba(148, 163, 184, .14);

        --fs-card-radius:
          18px;

        --fs-card-shadow:
          0 16px 50px
          rgba(0,0,0,.16);

        --fs-card-hover-shadow:
          0 24px 70px
          rgba(0,0,0,.25);

        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        background:
          var(--fs-card-bg);
        border-radius:
          var(--fs-card-radius);
        color: #e2e8f0;
        overflow: hidden;
        isolation: isolate;
        transition:
          transform .28s
            cubic-bezier(.22,1,.36,1),
          border-color .25s ease,
          box-shadow .3s ease,
          background .25s ease;
      }

      .fs-card::before {
        content: '';
        position: absolute;
        z-index: -2;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        background:
          radial-gradient(
            circle at 0% 0%,
            rgba(139,92,246,.075),
            transparent 34%
          ),
          radial-gradient(
            circle at 100% 100%,
            rgba(56,189,248,.035),
            transparent 32%
          );
      }

      .fs-card::after {
        content: '';
        position: absolute;
        z-index: -1;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        background:
          linear-gradient(
            135deg,
            rgba(255,255,255,.045),
            transparent 28%,
            transparent 70%,
            rgba(255,255,255,.018)
          );
        opacity: .8;
      }

      .fs-card-bordered {
        border:
          1px solid
          var(--fs-card-border);
      }

      .fs-card-elevated {
        box-shadow:
          var(--fs-card-shadow);
      }

      .fs-card-hoverable:hover,
      .fs-card-is-hovered {
        transform:
          translateY(-3px);
        border-color:
          rgba(167,139,250,.25);
        box-shadow:
          var(--fs-card-hover-shadow);
      }

      .fs-card-interactive {
        cursor: pointer;
      }

      .fs-card-interactive:active {
        transform:
          translateY(-1px)
          scale(.998);
      }

      .fs-card-interactive:focus-visible {
        outline: none;
        border-color:
          rgba(167,139,250,.55);
        box-shadow:
          0 0 0 3px
            rgba(139,92,246,.13),
          var(--fs-card-hover-shadow);
      }

      .fs-card-glass {
        background:
          linear-gradient(
            135deg,
            rgba(30,41,59,.62),
            rgba(15,23,42,.42)
          );
        backdrop-filter:
          blur(22px)
          saturate(135%);
        -webkit-backdrop-filter:
          blur(22px)
          saturate(135%);
      }

      .fs-card-selected {
        border-color:
          rgba(139,92,246,.48);
        box-shadow:
          0 0 0 1px
            rgba(139,92,246,.13),
          0 20px 60px
            rgba(76,29,149,.18);
      }

      .fs-card-disabled {
        opacity: .48;
        pointer-events: none;
        filter: grayscale(.25);
      }

      .fs-card-glow::before {
        background:
          radial-gradient(
            circle at 15% 0%,
            rgba(139,92,246,.14),
            transparent 34%
          ),
          radial-gradient(
            circle at 85% 100%,
            rgba(56,189,248,.07),
            transparent 34%
          );
      }

      .fs-card-shimmer::after {
        background:
          linear-gradient(
            110deg,
            transparent 20%,
            rgba(255,255,255,.08) 48%,
            transparent 72%
          );
        transform:
          translateX(-130%);
        animation:
          fs-card-shimmer
          5s ease-in-out infinite;
      }

      .fs-card-padding-none {
        padding: 0;
      }

      .fs-card-padding-sm {
        padding: 14px;
      }

      .fs-card-padding-md {
        padding: 18px;
      }

      .fs-card-padding-lg {
        padding: 22px;
      }

      .fs-card-padding-xl {
        padding: 28px;
      }

      .fs-card-padding-2xl {
        padding: 34px;
      }

      .fs-card-radius-sm {
        --fs-card-radius: 10px;
      }

      .fs-card-radius-md {
        --fs-card-radius: 14px;
      }

      .fs-card-radius-lg {
        --fs-card-radius: 18px;
      }

      .fs-card-radius-xl {
        --fs-card-radius: 24px;
      }

      .fs-card-radius-2xl {
        --fs-card-radius: 30px;
      }

      .fs-card-radius-full {
        --fs-card-radius: 999px;
      }

      .fs-card-header {
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        min-width: 0;
        margin-bottom: 20px;
      }

      .fs-card-heading {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        min-width: 0;
      }

      .fs-card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        border:
          1px solid
          rgba(139,92,246,.18);
        border-radius: 11px;
        background:
          linear-gradient(
            135deg,
            rgba(139,92,246,.14),
            rgba(139,92,246,.045)
          );
        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.05);
      }

      .fs-card-heading-copy {
        min-width: 0;
      }

      .fs-card-title-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 9px;
      }

      .fs-card-title {
        margin: 0;
        color: #f8fafc;
        font-size: 15px;
        font-weight: 720;
        line-height: 1.25;
        letter-spacing: -.018em;
      }

      .fs-card-subtitle {
        margin:
          5px 0 0;
        color: #64748b;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.5;
      }

      .fs-card-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        flex: 0 0 auto;
      }

      .fs-card-pin {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        color: #a78bfa;
        background:
          rgba(139,92,246,.09);
      }

      .fs-card-menu,
      .fs-card-expand {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 31px;
        height: 31px;
        padding: 0;
        border:
          1px solid
          rgba(148,163,184,.10);
        border-radius: 9px;
        background:
          rgba(255,255,255,.025);
        color: #94a3b8;
        cursor: pointer;
        transition:
          color .18s ease,
          background .18s ease,
          border-color .18s ease,
          transform .18s ease;
      }

      .fs-card-menu:hover,
      .fs-card-expand:hover {
        color: #f8fafc;
        background:
          rgba(255,255,255,.075);
        border-color:
          rgba(167,139,250,.24);
      }

      .fs-card-expand svg {
        transition:
          transform .25s
          cubic-bezier(.22,1,.36,1);
      }

      .fs-card-expand[aria-expanded="false"] svg {
        transform:
          rotate(-90deg);
      }

      .fs-card-body {
        position: relative;
        min-width: 0;
      }

      .fs-card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 22px;
        padding-top: 16px;
        border-top:
          1px solid
          rgba(148,163,184,.09);
      }

      .fs-card-compact {
        padding: 14px;
      }

      .fs-card-compact
      .fs-card-header {
        margin-bottom: 13px;
      }

      .fs-card-compact
      .fs-card-title {
        font-size: 13px;
      }

      .fs-card-compact
      .fs-card-subtitle {
        font-size: 10px;
      }

      .fs-card-compact
      .fs-card-icon {
        width: 32px;
        height: 32px;
        flex-basis: 32px;
        border-radius: 9px;
      }

      @keyframes fs-card-shimmer {
        0%,
        30% {
          transform:
            translateX(-130%);
        }

        70%,
        100% {
          transform:
            translateX(130%);
        }
      }

      @media (max-width: 640px) {
        .fs-card-padding-xl {
          padding: 22px;
        }

        .fs-card-padding-2xl {
          padding: 24px;
        }

        .fs-card-header {
          gap: 10px;
        }

        .fs-card-title {
          font-size: 14px;
        }

        .fs-card-actions {
          gap: 4px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .fs-card,
        .fs-card-shimmer::after,
        .fs-card-expand svg {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}

Card.displayName = 'Card';

export default Card;