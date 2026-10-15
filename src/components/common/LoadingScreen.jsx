import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Database,
  LockKeyhole,
  PieChart,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';

const LoadingScreen = ({
  message = 'Initializing FinSight',
  subtitle = 'Preparing your financial intelligence workspace...',
  fullScreen = true,
}) => {
  const [progress, setProgress] = useState(8);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'Connecting secure data layer',
      icon: Database,
    },
    {
      label: 'Loading financial intelligence',
      icon: BarChart3,
    },
    {
      label: 'Preparing your dashboard',
      icon: PieChart,
    },
    {
      label: 'Workspace ready',
      icon: ShieldCheck,
    },
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((current) => {
        if (current >= 96) return current;
        return current + Math.floor(Math.random() * 7) + 1;
      });
    }, 450);

    const stepTimer = setInterval(() => {
      setActiveStep((current) => {
        if (current >= steps.length - 1) return current;
        return current + 1;
      });
    }, 1150);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, []);

  const CurrentIcon = steps[activeStep].icon;

  return (
    <div
      className={`fs-loading-screen ${
        fullScreen ? 'fs-loading-screen-full' : ''
      }`}
    >
      <div className="fs-loading-noise" />

      <div className="fs-loading-grid" />

      <div className="fs-loading-glow fs-loading-glow-one" />
      <div className="fs-loading-glow fs-loading-glow-two" />

      <div className="fs-loading-container">
        {/* Brand */}
        <div className="fs-loading-brand">
          <div className="fs-loading-brand-mark">
            <WalletCards size={25} strokeWidth={1.8} />

            <span className="fs-loading-brand-pulse" />
          </div>

          <div>
            <div className="fs-loading-brand-name">
              Fin<span>Sight</span>
            </div>

            <div className="fs-loading-brand-caption">
              FINANCIAL INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Main visual */}
        <div className="fs-loading-visual">
          <div className="fs-loading-orbit orbit-one" />
          <div className="fs-loading-orbit orbit-two" />
          <div className="fs-loading-orbit orbit-three" />

          <div className="fs-loading-core">
            <div className="fs-loading-core-inner">
              <CurrentIcon
                key={activeStep}
                size={38}
                strokeWidth={1.5}
                className="fs-loading-current-icon"
              />
            </div>
          </div>

          <span className="fs-data-node node-one">
            <Database size={14} />
          </span>

          <span className="fs-data-node node-two">
            <BarChart3 size={14} />
          </span>

          <span className="fs-data-node node-three">
            <Activity size={14} />
          </span>

          <span className="fs-data-node node-four">
            <PieChart size={14} />
          </span>
        </div>

        {/* Text */}
        <div className="fs-loading-heading">
          <div className="fs-loading-eyebrow">
            <Sparkles size={13} />
            SMART FINANCE PLATFORM
          </div>

          <h1>{message}</h1>

          <p>{subtitle}</p>
        </div>

        {/* Progress */}
        <div className="fs-loading-progress">
          <div className="fs-loading-progress-header">
            <span>{steps[activeStep].label}</span>

            <strong>{Math.min(progress, 99)}%</strong>
          </div>

          <div className="fs-loading-track">
            <div
              className="fs-loading-progress-bar"
              style={{
                width: `${Math.min(progress, 99)}%`,
              }}
            />

            <div className="fs-loading-progress-shine" />
          </div>
        </div>

        {/* Steps */}
        <div className="fs-loading-steps">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const completed = index < activeStep;
            const active = index === activeStep;

            return (
              <div
                className={`fs-loading-step ${
                  completed ? 'completed' : ''
                } ${active ? 'active' : ''}`}
                key={step.label}
              >
                <div className="fs-loading-step-icon">
                  <StepIcon size={13} strokeWidth={2} />
                </div>

                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Security footer */}
        <div className="fs-loading-security">
          <div className="fs-security-icon">
            <LockKeyhole size={13} />
          </div>

          <div>
            <strong>Secure workspace</strong>
            <span>Protected financial data pipeline</span>
          </div>

          <div className="fs-security-status">
            <span />
            SECURE
          </div>
        </div>
      </div>

      <style>{`
        .fs-loading-screen {
          --ls-primary: var(--fs-primary, #7c3aed);
          --ls-primary-light: #a78bfa;
          --ls-blue: #60a5fa;
          --ls-green: #22c55e;
          --ls-bg: #07090f;
          --ls-text: #f8fafc;
          --ls-muted: #94a3b8;

          position: relative;
          width: 100%;
          min-height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(124, 58, 237, .105),
              transparent 30%
            ),
            radial-gradient(
              circle at 15% 85%,
              rgba(59, 130, 246, .055),
              transparent 25%
            ),
            var(--ls-bg);
          color: var(--ls-text);
          box-sizing: border-box;
        }

        .fs-loading-screen-full {
          position: fixed;
          inset: 0;
          z-index: 9999;
        }

        .fs-loading-screen *,
        .fs-loading-screen *::before,
        .fs-loading-screen *::after {
          box-sizing: border-box;
        }

        .fs-loading-noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .025;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
        }

        .fs-loading-grid {
          position: absolute;
          inset: 0;
          opacity: .16;
          pointer-events: none;
          background-image:
            linear-gradient(
              rgba(255,255,255,.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,.025) 1px,
              transparent 1px
            );
          background-size: 54px 54px;
          mask-image: radial-gradient(
            ellipse at center,
            black 10%,
            transparent 75%
          );
        }

        .fs-loading-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
        }

        .fs-loading-glow-one {
          width: 360px;
          height: 360px;
          top: -220px;
          left: -160px;
          background: rgba(124,58,237,.12);
          animation: fs-loading-glow-one 8s ease-in-out infinite;
        }

        .fs-loading-glow-two {
          width: 300px;
          height: 300px;
          right: -130px;
          bottom: -180px;
          background: rgba(37,99,235,.09);
          animation: fs-loading-glow-two 9s ease-in-out infinite;
        }

        .fs-loading-container {
          position: relative;
          z-index: 2;
          width: min(100% - 40px, 620px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 38px 0;
        }

        .fs-loading-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 38px;
        }

        .fs-loading-brand-mark {
          position: relative;
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          color: var(--ls-primary-light);
          border: 1px solid rgba(124,58,237,.28);
          border-radius: 15px;
          background:
            linear-gradient(
              145deg,
              rgba(124,58,237,.18),
              rgba(124,58,237,.04)
            );
          box-shadow:
            0 12px 40px rgba(0,0,0,.25),
            inset 0 1px 0 rgba(255,255,255,.08);
        }

        .fs-loading-brand-pulse {
          position: absolute;
          right: -2px;
          top: -2px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--ls-green);
          border: 2px solid var(--ls-bg);
          box-shadow: 0 0 12px rgba(34,197,94,.65);
          animation: fs-loading-pulse 1.7s ease-in-out infinite;
        }

        .fs-loading-brand-name {
          font-size: 20px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -.04em;
        }

        .fs-loading-brand-name span {
          color: var(--ls-primary-light);
        }

        .fs-loading-brand-caption {
          margin-top: 5px;
          color: rgba(148,163,184,.58);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .18em;
        }

        .fs-loading-visual {
          position: relative;
          width: 210px;
          height: 210px;
          display: grid;
          place-items: center;
          margin-bottom: 30px;
        }

        .fs-loading-orbit {
          position: absolute;
          border: 1px solid rgba(124,58,237,.17);
          border-radius: 50%;
          transform: rotate(-18deg);
        }

        .orbit-one {
          width: 125px;
          height: 125px;
          border-top-color: rgba(124,58,237,.7);
          animation: fs-loading-orbit-one 5s linear infinite;
        }

        .orbit-two {
          width: 165px;
          height: 105px;
          border-right-color: rgba(96,165,250,.5);
          animation: fs-loading-orbit-two 7s linear infinite;
        }

        .orbit-three {
          width: 195px;
          height: 145px;
          border-bottom-color: rgba(167,139,250,.3);
          animation: fs-loading-orbit-three 10s linear infinite;
        }

        .fs-loading-core {
          position: relative;
          width: 94px;
          height: 94px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(124,58,237,.2),
              rgba(124,58,237,.045) 58%,
              transparent 70%
            );
          box-shadow:
            0 0 55px rgba(124,58,237,.16);
        }

        .fs-loading-core::before {
          content: '';
          position: absolute;
          inset: 9px;
          border: 1px solid rgba(124,58,237,.25);
          border-radius: 50%;
          animation: fs-loading-core-ring 2.5s ease-in-out infinite;
        }

        .fs-loading-core-inner {
          position: relative;
          z-index: 2;
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          color: var(--ls-primary-light);
          border: 1px solid rgba(167,139,250,.25);
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              rgba(124,58,237,.2),
              rgba(15,23,42,.65)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.08),
            0 14px 35px rgba(0,0,0,.28);
        }

        .fs-loading-current-icon {
          animation: fs-loading-icon-in .45s ease both;
        }

        .fs-data-node {
          position: absolute;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          color: rgba(148,163,184,.8);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: rgba(15,23,42,.82);
          box-shadow:
            0 8px 24px rgba(0,0,0,.3),
            inset 0 1px 0 rgba(255,255,255,.05);
        }

        .node-one {
          left: 8px;
          top: 35px;
          animation: fs-node-one 3.5s ease-in-out infinite;
        }

        .node-two {
          right: 7px;
          top: 25px;
          color: #60a5fa;
          animation: fs-node-two 4s ease-in-out infinite;
        }

        .node-three {
          left: 18px;
          bottom: 24px;
          color: #22c55e;
          animation: fs-node-three 4.5s ease-in-out infinite;
        }

        .node-four {
          right: 18px;
          bottom: 17px;
          color: #a78bfa;
          animation: fs-node-four 3.8s ease-in-out infinite;
        }

        .fs-loading-heading {
          text-align: center;
        }

        .fs-loading-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--ls-primary-light);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .16em;
          margin-bottom: 10px;
        }

        .fs-loading-heading h1 {
          margin: 0;
          font-size: clamp(25px, 5vw, 34px);
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -.045em;
        }

        .fs-loading-heading p {
          max-width: 440px;
          margin: 10px auto 0;
          color: var(--ls-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .fs-loading-progress {
          width: min(100%, 470px);
          margin-top: 28px;
        }

        .fs-loading-progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 9px;
          color: rgba(148,163,184,.75);
          font-size: 10px;
          font-weight: 650;
        }

        .fs-loading-progress-header strong {
          color: var(--ls-primary-light);
          font-variant-numeric: tabular-nums;
        }

        .fs-loading-track {
          position: relative;
          width: 100%;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .fs-loading-progress-bar {
          position: relative;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #6d28d9,
            #8b5cf6,
            #60a5fa
          );
          box-shadow: 0 0 16px rgba(124,58,237,.35);
          transition: width .45s ease;
        }

        .fs-loading-progress-shine {
          position: absolute;
          top: 0;
          left: -25%;
          width: 25%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.65),
            transparent
          );
          animation: fs-loading-shine 1.8s linear infinite;
        }

        .fs-loading-steps {
          width: min(100%, 470px);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 20px;
        }

        .fs-loading-step {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          color: rgba(148,163,184,.34);
          text-align: center;
          font-size: 8px;
          line-height: 1.35;
          transition:
            color .3s ease,
            transform .3s ease;
        }

        .fs-loading-step.active {
          color: rgba(167,139,250,.9);
          transform: translateY(-2px);
        }

        .fs-loading-step.completed {
          color: rgba(148,163,184,.7);
        }

        .fs-loading-step-icon {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 9px;
          background: rgba(255,255,255,.018);
        }

        .fs-loading-step.active .fs-loading-step-icon {
          color: var(--ls-primary-light);
          border-color: rgba(124,58,237,.3);
          background: rgba(124,58,237,.09);
          box-shadow: 0 0 18px rgba(124,58,237,.12);
        }

        .fs-loading-step.completed .fs-loading-step-icon {
          color: var(--ls-green);
          border-color: rgba(34,197,94,.16);
        }

        .fs-loading-security {
          width: min(100%, 470px);
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 26px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 12px;
          background: rgba(255,255,255,.015);
        }

        .fs-security-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: grid;
          place-items: center;
          color: #22c55e;
          border-radius: 8px;
          background: rgba(34,197,94,.08);
        }

        .fs-loading-security > div:nth-child(2) {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .fs-loading-security strong {
          color: rgba(248,250,252,.8);
          font-size: 9px;
          font-weight: 750;
        }

        .fs-loading-security span {
          color: rgba(148,163,184,.5);
          font-size: 8px;
        }

        .fs-security-status {
          display: inline-flex !important;
          flex-direction: row !important;
          align-items: center;
          gap: 5px;
          color: #22c55e !important;
          font-size: 8px !important;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .fs-security-status > span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,.7);
        }

        @keyframes fs-loading-orbit-one {
          to {
            transform: rotate(342deg);
          }
        }

        @keyframes fs-loading-orbit-two {
          to {
            transform: rotate(342deg);
          }
        }

        @keyframes fs-loading-orbit-three {
          to {
            transform: rotate(-378deg);
          }
        }

        @keyframes fs-loading-core-ring {
          0%, 100% {
            transform: scale(.92);
            opacity: .35;
          }
          50% {
            transform: scale(1.05);
            opacity: .75;
          }
        }

        @keyframes fs-loading-icon-in {
          from {
            opacity: 0;
            transform: scale(.65) rotate(-12deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        @keyframes fs-loading-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: .65;
          }
        }

        @keyframes fs-loading-shine {
          from {
            left: -25%;
          }
          to {
            left: 110%;
          }
        }

        @keyframes fs-loading-glow-one {
          0%, 100% {
            transform: translate3d(0,0,0);
          }
          50% {
            transform: translate3d(40px,25px,0);
          }
        }

        @keyframes fs-loading-glow-two {
          0%, 100% {
            transform: translate3d(0,0,0);
          }
          50% {
            transform: translate3d(-35px,-25px,0);
          }
        }

        @keyframes fs-node-one {
          0%,100% {
            transform: translate(0,0);
          }
          50% {
            transform: translate(-4px,7px);
          }
        }

        @keyframes fs-node-two {
          0%,100% {
            transform: translate(0,0);
          }
          50% {
            transform: translate(5px,-5px);
          }
        }

        @keyframes fs-node-three {
          0%,100% {
            transform: translate(0,0);
          }
          50% {
            transform: translate(-5px,-6px);
          }
        }

        @keyframes fs-node-four {
          0%,100% {
            transform: translate(0,0);
          }
          50% {
            transform: translate(5px,4px);
          }
        }

        @media (max-width: 600px) {
          .fs-loading-container {
            width: min(100% - 28px, 520px);
            padding: 25px 0;
          }

          .fs-loading-brand {
            margin-bottom: 24px;
          }

          .fs-loading-visual {
            transform: scale(.82);
            margin-top: -12px;
            margin-bottom: 8px;
          }

          .fs-loading-heading h1 {
            font-size: 25px;
          }

          .fs-loading-heading p {
            font-size: 12px;
          }

          .fs-loading-steps {
            gap: 4px;
          }

          .fs-loading-step {
            font-size: 7px;
          }

          .fs-loading-security {
            margin-top: 20px;
          }

          .fs-security-status {
            display: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-loading-screen *,
          .fs-loading-screen *::before,
          .fs-loading-screen *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;