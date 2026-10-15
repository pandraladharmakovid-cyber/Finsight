import React, {
  useEffect,
  useRef,
} from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';

const SIZE_MAP = {
  xs: '360px',
  sm: '460px',
  md: '620px',
  lg: '820px',
  xl: '1080px',
  '2xl': '1280px',
  full: 'calc(100vw - 40px)',
};

const VARIANT_MAP = {
  default: {
    accent: '#8b5cf6',
    glow: 'rgba(139,92,246,.18)',
  },

  success: {
    accent: '#10b981',
    glow: 'rgba(16,185,129,.18)',
  },

  danger: {
    accent: '#ef4444',
    glow: 'rgba(239,68,68,.18)',
  },

  warning: {
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,.18)',
  },

  info: {
    accent: '#0ea5e9',
    glow: 'rgba(14,165,233,.18)',
  },
};

const VARIANT_ICONS = {
  success: CheckCircle2,
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export default function Modal({
  open = false,
  onClose,

  title,
  subtitle,

  children,
  footer,

  icon,
  variant = 'default',

  size = 'md',

  closeOnBackdrop = true,
  closeOnEscape = true,

  showClose = true,

  preventScroll = true,

  centered = true,

  fullscreen = false,
  expandable = false,

  initialExpanded = false,

  loading = false,

  stickyHeader = false,
  stickyFooter = false,

  dangerAction = false,

  className = '',
  overlayClassName = '',
  contentClassName = '',

  ariaLabel,
}) {
  const modalRef =
    useRef(null);

  const previousFocusRef =
    useRef(null);

  const [
    expanded,
    setExpanded,
  ] = React.useState(
    initialExpanded,
  );

  const theme =
    VARIANT_MAP[
      variant
    ] || VARIANT_MAP.default;

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement;

    const originalOverflow =
      document.body.style.overflow;

    if (preventScroll) {
      document.body.style.overflow =
        'hidden';
    }

    const timer =
      window.setTimeout(() => {
        modalRef.current
          ?.querySelector(
            '[data-modal-autofocus="true"]',
          )
          ?.focus();
      }, 20);

    function handleKeyDown(
      event,
    ) {
      if (
        event.key ===
          'Escape' &&
        closeOnEscape &&
        !loading
      ) {
        onClose?.();
      }

      if (
        event.key !== 'Tab'
      ) {
        return;
      }

      const modal =
        modalRef.current;

      if (!modal) {
        return;
      }

      const focusable =
        modal.querySelectorAll(
          [
            'button:not([disabled])',
            'a[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(','),
        );

      if (!focusable.length) {
        return;
      }

      const first =
        focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement ===
          last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.clearTimeout(
        timer,
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      if (preventScroll) {
        document.body.style.overflow =
          originalOverflow;
      }

      previousFocusRef.current?.focus?.();
    };
  }, [
    open,
    closeOnEscape,
    loading,
    onClose,
    preventScroll,
  ]);

  useEffect(() => {
    if (!open) {
      setExpanded(
        initialExpanded,
      );
    }
  }, [
    open,
    initialExpanded,
  ]);

  if (!open) {
    return null;
  }

  const Icon =
    icon ||
    VARIANT_ICONS[
      variant
    ];

  const isExpanded =
    fullscreen || expanded;

  const maxWidth =
    isExpanded
      ? 'calc(100vw - 40px)'
      : SIZE_MAP[
          size
        ] || SIZE_MAP.md;

  function handleBackdropClick(
    event,
  ) {
    if (
      event.target !==
        event.currentTarget
    ) {
      return;
    }

    if (
      closeOnBackdrop &&
      !loading
    ) {
      onClose?.();
    }
  }

  return (
    <>
      <div
        className={[
          'fs-modal-overlay',
          centered
            ? 'fs-modal-centered'
            : '',
          fullscreen
            ? 'fs-modal-fullscreen'
            : '',
          overlayClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        role="presentation"
        onMouseDown={
          handleBackdropClick
        }
      >
        <div
          ref={modalRef}
          className={[
            'fs-modal',
            isExpanded
              ? 'fs-modal-expanded'
              : '',
            loading
              ? 'fs-modal-loading'
              : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          role="dialog"
          aria-modal="true"
          aria-label={
            ariaLabel ||
            title
          }
          aria-busy={loading}
          style={{
            '--modal-accent':
              theme.accent,
            '--modal-glow':
              theme.glow,
            '--modal-max-width':
              maxWidth,
          }}
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <div className="fs-modal-noise" />

          <div className="fs-modal-top-glow" />

          <div
            className={[
              'fs-modal-header',
              stickyHeader
                ? 'fs-modal-sticky'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="fs-modal-heading">
              {Icon && (
                <div
                  className="fs-modal-icon"
                  style={{
                    color:
                      theme.accent,
                    background:
                      `${theme.glow}`,
                  }}
                >
                  {React.isValidElement(
                    Icon,
                  )
                    ? Icon
                    : React.createElement(
                        Icon,
                        {
                          size: 20,
                          strokeWidth: 2,
                        },
                      )}
                </div>
              )}

              <div className="fs-modal-heading-copy">
                {title && (
                  <h2 className="fs-modal-title">
                    {title}
                  </h2>
                )}

                {subtitle && (
                  <p className="fs-modal-subtitle">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="fs-modal-header-actions">
              {expandable &&
                !fullscreen && (
                  <button
                    type="button"
                    className="fs-modal-control"
                    aria-label={
                      expanded
                        ? 'Minimize modal'
                        : 'Maximize modal'
                    }
                    onClick={() =>
                      setExpanded(
                        (value) =>
                          !value,
                      )
                    }
                  >
                    {expanded ? (
                      <Minimize2
                        size={16}
                      />
                    ) : (
                      <Maximize2
                        size={16}
                      />
                    )}
                  </button>
                )}

              {showClose && (
                <button
                  type="button"
                  className={[
                    'fs-modal-control',
                    dangerAction
                      ? 'fs-modal-close-danger'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label="Close dialog"
                  disabled={loading}
                  onClick={() =>
                    onClose?.()
                  }
                >
                  <X
                    size={18}
                    strokeWidth={2}
                  />
                </button>
              )}
            </div>
          </div>

          <div
            className={[
              'fs-modal-content',
              contentClassName,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {loading && (
              <div className="fs-modal-loading-bar">
                <span />
              </div>
            )}

            <div className="fs-modal-content-inner">
              {children}
            </div>
          </div>

          {footer && (
            <div
              className={[
                'fs-modal-footer',
                stickyFooter
                  ? 'fs-modal-sticky-footer'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {footer}
            </div>
          )}

          <div className="fs-modal-accent-line" />
        </div>
      </div>

      <style>{`
        .fs-modal-overlay {
          position: fixed;
          z-index: 9999;
          inset: 0;
          display: flex;
          padding: 20px;
          background:
            radial-gradient(
              circle at 50% 35%,
              rgba(76,29,149,.13),
              transparent 42%
            ),
            rgba(2,6,23,.76);
          backdrop-filter:
            blur(14px)
            saturate(120%);
          -webkit-backdrop-filter:
            blur(14px)
            saturate(120%);
          animation:
            fs-modal-overlay-in
            .22s ease-out;
        }

        .fs-modal-centered {
          align-items: center;
          justify-content: center;
        }

        .fs-modal-fullscreen {
          padding: 12px;
        }

        .fs-modal {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width:
            var(--modal-max-width);
          max-height:
            calc(100vh - 40px);
          min-height: 0;
          overflow: hidden;
          border:
            1px solid
            rgba(148,163,184,.18);
          border-radius: 24px;
          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,.98),
              rgba(10,15,30,.97)
            );
          color: #e2e8f0;
          box-shadow:
            0 40px 120px
              rgba(0,0,0,.52),
            0 0 0 1px
              rgba(255,255,255,.025),
            0 0 80px
              var(--modal-glow);
          isolation: isolate;
          animation:
            fs-modal-in
            .32s
            cubic-bezier(.22,1,.36,1);
        }

        .fs-modal-expanded {
          max-height:
            calc(100vh - 24px);
        }

        .fs-modal-fullscreen
        .fs-modal {
          max-width: none;
          max-height: none;
          height: calc(100vh - 24px);
        }

        .fs-modal::before {
          content: '';
          position: absolute;
          z-index: -3;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 0% 0%,
              rgba(139,92,246,.11),
              transparent 32%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(14,165,233,.045),
              transparent 30%
            );
        }

        .fs-modal::after {
          content: '';
          position: absolute;
          z-index: -2;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.045),
              transparent 18%,
              transparent 82%,
              rgba(255,255,255,.018)
            );
        }

        .fs-modal-noise {
          position: absolute;
          z-index: -1;
          inset: 0;
          pointer-events: none;
          opacity: .035;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
        }

        .fs-modal-top-glow {
          position: absolute;
          z-index: -1;
          top: -100px;
          left: 20%;
          width: 60%;
          height: 160px;
          border-radius: 50%;
          background:
            var(--modal-glow);
          filter: blur(55px);
          pointer-events: none;
        }

        .fs-modal-header {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex: 0 0 auto;
          padding:
            22px 24px 18px;
          border-bottom:
            1px solid
            rgba(148,163,184,.09);
          background:
            linear-gradient(
              180deg,
              rgba(15,23,42,.86),
              rgba(15,23,42,.58)
            );
          backdrop-filter:
            blur(20px);
          -webkit-backdrop-filter:
            blur(20px);
        }

        .fs-modal-sticky {
          position: sticky;
          top: 0;
        }

        .fs-modal-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .fs-modal-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border:
            1px solid
            color-mix(
              in srgb,
              var(--modal-accent) 25%,
              transparent
            );
          border-radius: 12px;
          box-shadow:
            inset 0 1px 0
              rgba(255,255,255,.06);
        }

        .fs-modal-heading-copy {
          min-width: 0;
        }

        .fs-modal-title {
          margin: 0;
          color: #f8fafc;
          font-size: 17px;
          font-weight: 740;
          line-height: 1.25;
          letter-spacing: -.025em;
        }

        .fs-modal-subtitle {
          margin:
            5px 0 0;
          color: #64748b;
          font-size: 11px;
          font-weight: 500;
          line-height: 1.5;
        }

        .fs-modal-header-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex: 0 0 auto;
        }

        .fs-modal-control {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          padding: 0;
          border:
            1px solid
            rgba(148,163,184,.12);
          border-radius: 10px;
          background:
            rgba(255,255,255,.035);
          color: #94a3b8;
          cursor: pointer;
          transition:
            color .18s ease,
            background .18s ease,
            border-color .18s ease,
            transform .18s ease;
        }

        .fs-modal-control:hover {
          color: #f8fafc;
          background:
            rgba(255,255,255,.08);
          border-color:
            rgba(167,139,250,.26);
          transform:
            translateY(-1px);
        }

        .fs-modal-close-danger:hover {
          color: #fca5a5;
          border-color:
            rgba(248,113,113,.32);
          background:
            rgba(239,68,68,.08);
        }

        .fs-modal-control:disabled {
          opacity: .4;
          cursor: not-allowed;
          transform: none;
        }

        .fs-modal-content {
          position: relative;
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color:
            rgba(148,163,184,.18)
            transparent;
        }

        .fs-modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .fs-modal-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .fs-modal-content::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background:
            rgba(148,163,184,.18);
        }

        .fs-modal-content-inner {
          position: relative;
          padding: 24px;
        }

        .fs-modal-loading-bar {
          position: absolute;
          z-index: 10;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          overflow: hidden;
          background:
            rgba(139,92,246,.08);
        }

        .fs-modal-loading-bar span {
          display: block;
          width: 35%;
          height: 100%;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              transparent,
              #a78bfa,
              #8b5cf6,
              transparent
            );
          box-shadow:
            0 0 14px
              rgba(139,92,246,.8);
          animation:
            fs-modal-loading
            1.25s
            ease-in-out
            infinite;
        }

        .fs-modal-footer {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          flex: 0 0 auto;
          padding:
            16px 24px 18px;
          border-top:
            1px solid
            rgba(148,163,184,.09);
          background:
            linear-gradient(
              0deg,
              rgba(15,23,42,.94),
              rgba(15,23,42,.68)
            );
          backdrop-filter:
            blur(20px);
          -webkit-backdrop-filter:
            blur(20px);
        }

        .fs-modal-sticky-footer {
          position: sticky;
          bottom: 0;
        }

        .fs-modal-accent-line {
          position: absolute;
          z-index: 20;
          left: 12%;
          right: 12%;
          bottom: 0;
          height: 1px;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              transparent,
              var(--modal-accent),
              transparent
            );
          opacity: .7;
          box-shadow:
            0 0 14px
              var(--modal-glow);
          pointer-events: none;
        }

        @keyframes fs-modal-overlay-in {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes fs-modal-in {
          from {
            opacity: 0;
            transform:
              translateY(18px)
              scale(.975);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes fs-modal-loading {
          0% {
            transform:
              translateX(-150%);
          }

          100% {
            transform:
              translateX(400%);
          }
        }

        @media (max-width: 640px) {
          .fs-modal-overlay {
            padding: 10px;
          }

          .fs-modal {
            max-height:
              calc(100vh - 20px);
            border-radius: 18px;
          }

          .fs-modal-header {
            padding:
              17px 17px 14px;
          }

          .fs-modal-content-inner {
            padding: 18px;
          }

          .fs-modal-footer {
            padding:
              13px 17px 15px;
          }

          .fs-modal-icon {
            width: 35px;
            height: 35px;
            flex-basis: 35px;
            border-radius: 10px;
          }

          .fs-modal-title {
            font-size: 15px;
          }

          .fs-modal-subtitle {
            font-size: 10px;
          }

          .fs-modal-footer > * {
            flex: 1 1 auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-modal-overlay,
          .fs-modal,
          .fs-modal-loading-bar span {
            animation: none !important;
          }

          .fs-modal-control {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}