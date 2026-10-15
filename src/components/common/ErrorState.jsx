import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle2,
  ChevronDown,
  Copy,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'FinSight could not complete this request. Please try again.',
  error,
  onRetry,
  retryLabel = 'Try again',
  showDetails = true,
  compact = false,
  variant = 'error',
  className = '',
}) => {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const isWarning = variant === 'warning';
  const isNetwork = variant === 'network';

  const Icon = isNetwork
    ? ShieldAlert
    : isWarning
      ? AlertTriangle
      : Bug;

  const errorDetails =
    typeof error === 'string'
      ? error
      : error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        '';

  const copyDetails = async () => {
    const details = errorDetails || message;

    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      className={`fs-error-state ${
        compact ? 'fs-error-compact' : ''
      } ${isWarning ? 'fs-error-warning' : ''} ${className}`}
      role="alert"
    >
      <div className="fs-error-background">
        <span className="fs-error-glow glow-one" />
        <span className="fs-error-glow glow-two" />

        <span className="fs-error-grid-line line-one" />
        <span className="fs-error-grid-line line-two" />
      </div>

      <div className="fs-error-content">
        <div className="fs-error-visual">
          <div className="fs-error-ring ring-one" />
          <div className="fs-error-ring ring-two" />

          <div className="fs-error-icon">
            <Icon size={compact ? 25 : 31} strokeWidth={1.8} />
          </div>

          <span className="fs-error-signal signal-one" />
          <span className="fs-error-signal signal-two" />
          <span className="fs-error-signal signal-three" />
        </div>

        <div className="fs-error-eyebrow">
          <Sparkles size={12} />
          {isNetwork
            ? 'CONNECTION STATUS'
            : isWarning
              ? 'ATTENTION REQUIRED'
              : 'SYSTEM NOTICE'}
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        {onRetry && (
          <div className="fs-error-actions">
            <button
              type="button"
              className="fs-error-retry"
              onClick={onRetry}
            >
              <RefreshCw size={15} />
              <span>{retryLabel}</span>
            </button>

            <button
              type="button"
              className="fs-error-back"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={14} />
              <span>Go back</span>
            </button>
          </div>
        )}

        {showDetails && errorDetails && (
          <div className="fs-error-details">
            <button
              type="button"
              className="fs-error-details-toggle"
              onClick={() => setDetailsOpen((open) => !open)}
              aria-expanded={detailsOpen}
            >
              <span>
                <Bug size={13} />
                Technical details
              </span>

              <ChevronDown
                size={14}
                className={detailsOpen ? 'rotated' : ''}
              />
            </button>

            {detailsOpen && (
              <div className="fs-error-details-body">
                <div className="fs-error-code">
                  <code>{errorDetails}</code>

                  <button
                    type="button"
                    onClick={copyDetails}
                    aria-label="Copy error details"
                    title="Copy error details"
                  >
                    {copied ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                <div className="fs-error-meta">
                  <span>
                    Reference: {new Date().toISOString().slice(0, 19)}Z
                  </span>

                  <span>
                    {copied ? 'Copied to clipboard' : 'For troubleshooting'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="fs-error-status">
          <span className="status-dot" />
          <span>
            {isNetwork
              ? 'Waiting for connection'
              : isWarning
                ? 'Action may be required'
                : 'FinSight remains protected'}
          </span>
        </div>
      </div>

      <style>{`
        .fs-error-state {
          --error-primary: #ef4444;
          --error-primary-soft: rgba(239,68,68,.12);
          --error-bg: var(--fs-bg-card, #10131a);
          --error-border: var(--fs-border, rgba(255,255,255,.08));
          --error-text: var(--fs-text-primary, #f8fafc);
          --error-muted: var(--fs-text-secondary, #94a3b8);

          position: relative;
          isolation: isolate;
          width: 100%;
          min-height: 350px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 44px 25px;
          border: 1px solid var(--error-border);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 50% 18%,
              var(--error-primary-soft),
              transparent 38%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.022),
              rgba(255,255,255,.006)
            ),
            var(--error-bg);
          box-sizing: border-box;
        }

        .fs-error-warning {
          --error-primary: #f59e0b;
          --error-primary-soft: rgba(245,158,11,.1);
        }

        .fs-error-compact {
          min-height: 260px;
          padding: 30px 20px;
          border-radius: 20px;
        }

        .fs-error-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }

        .fs-error-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(65px);
          opacity: .25;
        }

        .glow-one {
          width: 200px;
          height: 200px;
          top: -120px;
          left: 12%;
          background: var(--error-primary);
          animation: fs-error-glow-one 8s ease-in-out infinite;
        }

        .glow-two {
          width: 180px;
          height: 180px;
          right: 8%;
          bottom: -120px;
          background: rgba(59,130,246,.16);
          animation: fs-error-glow-two 9s ease-in-out infinite;
        }

        .fs-error-grid-line {
          position: absolute;
          width: 100%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.035),
            transparent
          );
        }

        .line-one {
          top: 30%;
        }

        .line-two {
          bottom: 25%;
        }

        .fs-error-content {
          width: min(100%, 510px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .fs-error-visual {
          position: relative;
          width: 94px;
          height: 94px;
          display: grid;
          place-items: center;
          margin-bottom: 21px;
        }

        .fs-error-compact .fs-error-visual {
          width: 76px;
          height: 76px;
          margin-bottom: 16px;
        }

        .fs-error-ring {
          position: absolute;
          border: 1px solid color-mix(
            in srgb,
            var(--error-primary) 28%,
            transparent
          );
          border-radius: 50%;
        }

        .ring-one {
          inset: 3px;
          border-top-color: var(--error-primary);
          animation: fs-error-spin 6s linear infinite;
        }

        .ring-two {
          inset: 13px;
          border-bottom-color: rgba(96,165,250,.45);
          animation: fs-error-spin-reverse 4.5s linear infinite;
        }

        .fs-error-icon {
          position: relative;
          z-index: 3;
          width: 59px;
          height: 59px;
          display: grid;
          place-items: center;
          color: var(--error-primary);
          border: 1px solid color-mix(
            in srgb,
            var(--error-primary) 30%,
            transparent
          );
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              color-mix(
                in srgb,
                var(--error-primary) 15%,
                transparent
              ),
              rgba(15,23,42,.45)
            );
          box-shadow:
            0 14px 38px rgba(0,0,0,.25),
            0 0 35px color-mix(
              in srgb,
              var(--error-primary) 10%,
              transparent
            ),
            inset 0 1px 0 rgba(255,255,255,.07);
          animation: fs-error-breathe 2.4s ease-in-out infinite;
        }

        .fs-error-compact .fs-error-icon {
          width: 49px;
          height: 49px;
          border-radius: 15px;
        }

        .fs-error-signal {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--error-primary);
          box-shadow:
            0 0 0 4px color-mix(
              in srgb,
              var(--error-primary) 8%,
              transparent
            ),
            0 0 12px var(--error-primary);
        }

        .signal-one {
          top: 13px;
          left: 20px;
          animation: fs-error-signal-one 2s ease-in-out infinite;
        }

        .signal-two {
          top: 21px;
          right: 12px;
          animation: fs-error-signal-two 2.4s ease-in-out infinite;
        }

        .signal-three {
          bottom: 9px;
          left: 45px;
          animation: fs-error-signal-three 2.1s ease-in-out infinite;
        }

        .fs-error-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          color: var(--error-primary);
          font-size: 9px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: .16em;
        }

        .fs-error-content h2 {
          margin: 0;
          color: var(--error-text);
          font-size: 23px;
          line-height: 1.2;
          font-weight: 780;
          letter-spacing: -.035em;
        }

        .fs-error-compact .fs-error-content h2 {
          font-size: 19px;
        }

        .fs-error-content > p {
          max-width: 440px;
          margin: 10px 0 0;
          color: var(--error-muted);
          font-size: 13px;
          line-height: 1.65;
        }

        .fs-error-compact .fs-error-content > p {
          font-size: 12px;
          margin-top: 8px;
        }

        .fs-error-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 21px;
        }

        .fs-error-retry,
        .fs-error-back {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 13px;
          border-radius: 11px;
          font: inherit;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease,
            background .2s ease;
        }

        .fs-error-retry {
          color: #fff;
          border: 1px solid color-mix(
            in srgb,
            var(--error-primary) 38%,
            transparent
          );
          background:
            linear-gradient(
              135deg,
              color-mix(
                in srgb,
                var(--error-primary) 88%,
                #000
              ),
              color-mix(
                in srgb,
                var(--error-primary) 72%,
                #000
              )
            );
          box-shadow:
            0 8px 24px color-mix(
              in srgb,
              var(--error-primary) 16%,
              transparent
            ),
            inset 0 1px 0 rgba(255,255,255,.1);
        }

        .fs-error-retry:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 30px color-mix(
              in srgb,
              var(--error-primary) 24%,
              transparent
            );
        }

        .fs-error-back {
          color: rgba(226,232,240,.78);
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.025);
        }

        .fs-error-back:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,.14);
          background: rgba(255,255,255,.045);
        }

        .fs-error-details {
          width: min(100%, 440px);
          margin-top: 16px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          background: rgba(255,255,255,.018);
          overflow: hidden;
          text-align: left;
        }

        .fs-error-details-toggle {
          width: 100%;
          min-height: 37px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 12px;
          color: rgba(148,163,184,.72);
          border: 0;
          background: transparent;
          font: inherit;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .fs-error-details-toggle > span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .fs-error-details-toggle svg:last-child {
          transition: transform .2s ease;
        }

        .fs-error-details-toggle svg.rotated {
          transform: rotate(180deg);
        }

        .fs-error-details-body {
          padding: 0 11px 11px;
        }

        .fs-error-code {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          background: rgba(0,0,0,.2);
        }

        .fs-error-code code {
          min-width: 0;
          flex: 1;
          overflow-wrap: anywhere;
          color: rgba(248,250,252,.62);
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 9px;
          line-height: 1.55;
        }

        .fs-error-code button {
          flex: 0 0 auto;
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          color: rgba(148,163,184,.7);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 7px;
          background: rgba(255,255,255,.025);
          cursor: pointer;
        }

        .fs-error-code button:hover {
          color: #fff;
          border-color: rgba(255,255,255,.12);
        }

        .fs-error-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 7px;
          color: rgba(148,163,184,.4);
          font-size: 8px;
        }

        .fs-error-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 18px;
          color: rgba(148,163,184,.45);
          font-size: 9px;
          font-weight: 650;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--error-primary);
          box-shadow: 0 0 9px var(--error-primary);
        }

        @keyframes fs-error-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fs-error-spin-reverse {
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes fs-error-breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.045);
          }
        }

        @keyframes fs-error-signal-one {
          0%, 100% {
            transform: translate(0,0);
            opacity: .55;
          }
          50% {
            transform: translate(-4px,5px);
            opacity: 1;
          }
        }

        @keyframes fs-error-signal-two {
          0%, 100% {
            transform: translate(0,0);
            opacity: .5;
          }
          50% {
            transform: translate(4px,-4px);
            opacity: 1;
          }
        }

        @keyframes fs-error-signal-three {
          0%, 100% {
            transform: translate(0,0);
            opacity: .5;
          }
          50% {
            transform: translate(-3px,-5px);
            opacity: 1;
          }
        }

        @keyframes fs-error-glow-one {
          0%, 100% {
            transform: translate(0,0);
          }
          50% {
            transform: translate(30px,18px);
          }
        }

        @keyframes fs-error-glow-two {
          0%, 100% {
            transform: translate(0,0);
          }
          50% {
            transform: translate(-25px,-15px);
          }
        }

        @media (max-width: 600px) {
          .fs-error-state {
            min-height: 300px;
            padding: 35px 18px;
            border-radius: 18px;
          }

          .fs-error-content h2 {
            font-size: 20px;
          }

          .fs-error-content > p {
            font-size: 12px;
          }

          .fs-error-actions {
            width: 100%;
          }

          .fs-error-retry,
          .fs-error-back {
            width: 100%;
          }

          .fs-error-meta {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-error-ring,
          .fs-error-icon,
          .fs-error-signal,
          .fs-error-glow {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

ErrorState.displayName = 'ErrorState';

export default ErrorState;