import React from 'react';
import {
  ArrowRight,
  Database,
  FileSearch,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';

const EmptyState = ({
  title = 'Nothing here yet',
  description = 'There is no financial data available to display.',
  icon: Icon = Database,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  compact = false,
  className = '',
}) => {
  const isSearch = variant === 'search';
  const isError = variant === 'error';
  const isFinancial = variant === 'financial';

  const MainIcon =
    isSearch
      ? Search
      : isError
        ? RefreshCw
        : isFinancial
          ? Sparkles
          : Icon;

  return (
    <section
      className={`fs-empty-state ${compact ? 'fs-empty-compact' : ''} ${className}`}
    >
      <div className="fs-empty-bg">
        <span className="fs-empty-glow glow-one" />
        <span className="fs-empty-glow glow-two" />
        <span className="fs-empty-grid grid-a" />
        <span className="fs-empty-grid grid-b" />
      </div>

      <div className="fs-empty-content">
        <div className="fs-empty-visual">
          <div className="fs-empty-ring ring-a" />
          <div className="fs-empty-ring ring-b" />

          <div className="fs-empty-icon">
            <MainIcon size={compact ? 25 : 31} strokeWidth={1.7} />
          </div>

          <span className="fs-empty-floating float-one">
            <FileSearch size={13} />
          </span>

          <span className="fs-empty-floating float-two">
            <Database size={12} />
          </span>
        </div>

        <div className="fs-empty-eyebrow">
          <Sparkles size={12} />
          FINANCIAL WORKSPACE
        </div>

        <h2>{title}</h2>

        <p>{description}</p>

        {(actionLabel || secondaryActionLabel) && (
          <div className="fs-empty-actions">
            {actionLabel && (
              <button
                type="button"
                className="fs-empty-primary"
                onClick={onAction}
                disabled={!onAction}
              >
                {isError ? (
                  <RefreshCw size={15} />
                ) : (
                  <Plus size={15} />
                )}

                <span>{actionLabel}</span>

                <ArrowRight size={14} />
              </button>
            )}

            {secondaryActionLabel && (
              <button
                type="button"
                className="fs-empty-secondary"
                onClick={onSecondaryAction}
                disabled={!onSecondaryAction}
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}

        <div className="fs-empty-status">
          <span className="fs-empty-status-dot" />
          <span>Ready for your financial data</span>
        </div>
      </div>

      <style>{`
        .fs-empty-state {
          --empty-primary: var(--fs-primary, #7c3aed);
          --empty-bg: var(--fs-bg-card, #10131a);
          --empty-border: var(--fs-border, rgba(255,255,255,.08));
          --empty-text: var(--fs-text-primary, #f8fafc);
          --empty-muted: var(--fs-text-secondary, #94a3b8);

          position: relative;
          isolation: isolate;
          width: 100%;
          min-height: 330px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 42px 25px;
          border: 1px solid var(--empty-border);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 50% 20%,
              rgba(124,58,237,.07),
              transparent 38%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.022),
              rgba(255,255,255,.006)
            ),
            var(--empty-bg);
          box-sizing: border-box;
        }

        .fs-empty-compact {
          min-height: 250px;
          padding: 30px 20px;
          border-radius: 20px;
        }

        .fs-empty-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }

        .fs-empty-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(60px);
          opacity: .22;
        }

        .glow-one {
          width: 190px;
          height: 190px;
          top: -100px;
          left: 15%;
          background: rgba(124,58,237,.2);
          animation: fs-empty-glow-one 8s ease-in-out infinite;
        }

        .glow-two {
          width: 160px;
          height: 160px;
          right: 10%;
          bottom: -100px;
          background: rgba(59,130,246,.13);
          animation: fs-empty-glow-two 9s ease-in-out infinite;
        }

        .fs-empty-grid {
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

        .grid-a {
          top: 31%;
        }

        .grid-b {
          bottom: 25%;
        }

        .fs-empty-content {
          width: min(100%, 490px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .fs-empty-visual {
          position: relative;
          width: 94px;
          height: 94px;
          display: grid;
          place-items: center;
          margin-bottom: 21px;
        }

        .fs-empty-compact .fs-empty-visual {
          width: 76px;
          height: 76px;
          margin-bottom: 17px;
        }

        .fs-empty-ring {
          position: absolute;
          border: 1px solid rgba(124,58,237,.18);
          border-radius: 50%;
        }

        .ring-a {
          inset: 3px;
          border-top-color: rgba(124,58,237,.65);
          animation: fs-empty-spin 7s linear infinite;
        }

        .ring-b {
          inset: 13px;
          border-bottom-color: rgba(96,165,250,.45);
          animation: fs-empty-spin-reverse 5s linear infinite;
        }

        .fs-empty-icon {
          position: relative;
          z-index: 3;
          width: 59px;
          height: 59px;
          display: grid;
          place-items: center;
          color: #a78bfa;
          border: 1px solid rgba(124,58,237,.25);
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              rgba(124,58,237,.16),
              rgba(124,58,237,.035)
            );
          box-shadow:
            0 14px 38px rgba(0,0,0,.25),
            0 0 35px rgba(124,58,237,.08),
            inset 0 1px 0 rgba(255,255,255,.08);
          animation: fs-empty-breathe 2.7s ease-in-out infinite;
        }

        .fs-empty-compact .fs-empty-icon {
          width: 49px;
          height: 49px;
          border-radius: 15px;
        }

        .fs-empty-floating {
          position: absolute;
          z-index: 4;
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          color: rgba(148,163,184,.72);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 8px;
          background: rgba(15,23,42,.9);
          box-shadow: 0 8px 20px rgba(0,0,0,.28);
        }

        .float-one {
          left: 1px;
          top: 16px;
          animation: fs-empty-float-one 3.5s ease-in-out infinite;
        }

        .float-two {
          right: 0;
          bottom: 11px;
          color: #60a5fa;
          animation: fs-empty-float-two 4s ease-in-out infinite;
        }

        .fs-empty-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          color: var(--empty-primary);
          font-size: 9px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: .16em;
        }

        .fs-empty-content h2 {
          margin: 0;
          color: var(--empty-text);
          font-size: 23px;
          line-height: 1.2;
          font-weight: 780;
          letter-spacing: -.035em;
        }

        .fs-empty-compact .fs-empty-content h2 {
          font-size: 19px;
        }

        .fs-empty-content p {
          max-width: 430px;
          margin: 10px 0 0;
          color: var(--empty-muted);
          font-size: 13px;
          line-height: 1.65;
        }

        .fs-empty-compact .fs-empty-content p {
          font-size: 12px;
          margin-top: 8px;
        }

        .fs-empty-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 21px;
        }

        .fs-empty-primary,
        .fs-empty-secondary {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 11px;
          font: inherit;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform .2s ease,
            border-color .2s ease,
            background .2s ease,
            box-shadow .2s ease;
        }

        .fs-empty-primary {
          padding: 0 13px;
          color: #fff;
          border: 1px solid rgba(167,139,250,.28);
          background:
            linear-gradient(
              135deg,
              rgba(124,58,237,.95),
              rgba(109,40,217,.88)
            );
          box-shadow:
            0 8px 24px rgba(124,58,237,.2),
            inset 0 1px 0 rgba(255,255,255,.12);
        }

        .fs-empty-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 12px 30px rgba(124,58,237,.28),
            inset 0 1px 0 rgba(255,255,255,.14);
        }

        .fs-empty-secondary {
          padding: 0 14px;
          color: rgba(226,232,240,.75);
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.025);
        }

        .fs-empty-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,.14);
          background: rgba(255,255,255,.045);
        }

        .fs-empty-primary:disabled,
        .fs-empty-secondary:disabled {
          opacity: .55;
          cursor: default;
        }

        .fs-empty-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 19px;
          color: rgba(148,163,184,.48);
          font-size: 9px;
          font-weight: 650;
        }

        .fs-empty-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 9px rgba(34,197,94,.55);
        }

        @keyframes fs-empty-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fs-empty-spin-reverse {
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes fs-empty-breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.045);
          }
        }

        @keyframes fs-empty-float-one {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-4px, 6px);
          }
        }

        @keyframes fs-empty-float-two {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(5px, -5px);
          }
        }

        @keyframes fs-empty-glow-one {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(28px, 18px);
          }
        }

        @keyframes fs-empty-glow-two {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-25px, -15px);
          }
        }

        @media (max-width: 600px) {
          .fs-empty-state {
            min-height: 290px;
            padding: 35px 18px;
            border-radius: 18px;
          }

          .fs-empty-content h2 {
            font-size: 20px;
          }

          .fs-empty-content p {
            font-size: 12px;
          }

          .fs-empty-actions {
            width: 100%;
          }

          .fs-empty-primary,
          .fs-empty-secondary {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-empty-ring,
          .fs-empty-icon,
          .fs-empty-floating,
          .fs-empty-glow {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

EmptyState.displayName = 'EmptyState';

export default EmptyState;