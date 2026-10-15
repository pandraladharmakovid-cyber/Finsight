// src/pages/Analytics.jsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Gauge,
  LineChart,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';

import IncomeExpenseChart from '../components/charts/IncomeExpenseChart.jsx';
import CategorySpendingChart from '../components/charts/CategorySpendingChart.jsx';
import NetWorthChart from '../components/charts/NetWorthChart.jsx';
import BudgetChart from '../components/charts/BudgetChart.jsx';

const periods = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last 12 months' },
];

const metricCards = [
  {
    label: 'Net Worth',
    value: '₹8,42,680',
    change: '+12.8%',
    positive: true,
    icon: Wallet,
    tone: 'violet',
  },
  {
    label: 'Cash Flow',
    value: '₹74,320',
    change: '+18.4%',
    positive: true,
    icon: Activity,
    tone: 'cyan',
  },
  {
    label: 'Savings Rate',
    value: '31.6%',
    change: '+4.2%',
    positive: true,
    icon: Target,
    tone: 'emerald',
  },
  {
    label: 'Debt Load',
    value: '18.9%',
    change: '-6.7%',
    positive: true,
    icon: CreditCard,
    tone: 'amber',
  },
];

const insights = [
  {
    type: 'positive',
    icon: TrendingUp,
    title: 'Savings momentum is accelerating',
    text: 'Your average monthly savings increased compared with the previous period.',
  },
  {
    type: 'warning',
    icon: TrendingDown,
    title: 'Discretionary spending needs attention',
    text: 'Entertainment and dining are currently above your normal spending baseline.',
  },
  {
    type: 'positive',
    icon: ShieldCheck,
    title: 'Debt exposure is improving',
    text: 'Your debt-to-assets ratio has continued to move in the right direction.',
  },
];

function MetricCard({ card }) {
  const Icon = card.icon;

  return (
    <div className={`analytics-metric-card analytics-tone-${card.tone}`}>
      <div className="analytics-metric-top">
        <div className="analytics-metric-icon">
          <Icon size={19} strokeWidth={2} />
        </div>

        <span
          className={`analytics-change ${
            card.positive ? 'analytics-change-positive' : 'analytics-change-negative'
          }`}
        >
          {card.positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {card.change}
        </span>
      </div>

      <div className="analytics-metric-value">{card.value}</div>
      <div className="analytics-metric-label">{card.label}</div>

      <div className="analytics-metric-line">
        <span />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <div className="analytics-section-header">
      <div>
        {eyebrow && <div className="analytics-eyebrow">{eyebrow}</div>}

        <div className="analytics-title-row">
          {Icon && (
            <div className="analytics-section-icon">
              <Icon size={18} />
            </div>
          )}

          <h2>{title}</h2>
        </div>

        {description && <p>{description}</p>}
      </div>

      {action}
    </div>
  );
}

function ChartShell({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <section className={`analytics-chart-shell ${className}`}>
      <div className="analytics-chart-heading">
        <div>
          <div className="analytics-chart-title-row">
            {Icon && <Icon size={17} />}
            <h3>{title}</h3>
          </div>

          {subtitle && <p>{subtitle}</p>}
        </div>

        <button
          type="button"
          className="analytics-chart-menu"
          aria-label={`${title} options`}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className="analytics-chart-content">{children}</div>
    </section>
  );
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

export default function Analytics() {
  const [period, setPeriod] = useState('90d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeInsight, setActiveInsight] = useState(0);
  const [liveCards, setLiveCards] = useState(metricCards);

  const selectedPeriod = useMemo(
    () => periods.find((item) => item.value === period) ?? periods[1],
    [period],
  );

  const loadAnalytics = useCallback(async () => {
    setRefreshing(true);
    try {
      const [finRes, txSumRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/${USER_ID}/financial`),
        fetch(`${API_BASE_URL}/transactions/${USER_ID}/summary`),
      ]);
      const finJson = finRes.ok ? await finRes.json() : {};
      const txJson = txSumRes.ok ? await txSumRes.json() : {};

      const accounts = finJson?.data?.accounts || [];
      const debts = finJson?.data?.debts || [];
      const txSum = txJson?.data || {};

      const totalAssets = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
      const totalDebt = debts.reduce((s, d) => s + (Number(d.remaining_amount ?? d.total_overdue ?? 0) || 0), 0);
      const netWorth = totalAssets - totalDebt;
      const netCashFlow = Number(txSum.netCashFlow ?? 0);
      const income = Number(txSum.totalIncome ?? 0);
      const savingsRate = income > 0 ? Math.max(0, (netCashFlow / income) * 100) : 0;
      const debtLoad = totalAssets > 0 ? Math.min(100, (totalDebt / totalAssets) * 100) : 0;

      const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

      setLiveCards([
        {
          label: 'Net Worth',
          value: fmt(netWorth),
          change: 'Live DB',
          positive: netWorth >= 0,
          icon: Wallet,
          tone: 'violet',
        },
        {
          label: 'Cash Flow',
          value: fmt(netCashFlow),
          change: 'Net flow',
          positive: netCashFlow >= 0,
          icon: Activity,
          tone: 'cyan',
        },
        {
          label: 'Savings Rate',
          value: `${savingsRate.toFixed(1)}%`,
          change: 'Retention',
          positive: savingsRate >= 20,
          icon: Target,
          tone: 'emerald',
        },
        {
          label: 'Debt Load',
          value: `${debtLoad.toFixed(1)}%`,
          change: 'Exposure',
          positive: debtLoad < 35,
          icon: CreditCard,
          tone: 'amber',
        },
      ]);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, period]);

  const handleRefresh = () => {
    loadAnalytics();
  };

  return (
    <main className="analytics-page">
      <style>{`
        .analytics-page {
          position: relative;
          min-height: 100%;
          padding: 28px;
          color: var(--text-primary, #f8fafc);
          overflow: hidden;
        }

        .analytics-page::before {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          top: -220px;
          right: -180px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.12);
          filter: blur(80px);
          pointer-events: none;
        }

        .analytics-page::after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          left: -250px;
          top: 460px;
          border-radius: 50%;
          background: rgba(6, 182, 212, 0.08);
          filter: blur(90px);
          pointer-events: none;
        }

        .analytics-content {
          position: relative;
          z-index: 1;
          max-width: 1800px;
          margin: 0 auto;
        }

        .analytics-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: end;
          margin-bottom: 24px;
        }

        .analytics-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          color: #a78bfa;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .analytics-eyebrow::before {
          content: "";
          width: 22px;
          height: 2px;
          border-radius: 999px;
          background: #8b5cf6;
        }

        .analytics-hero h1 {
          margin: 0;
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 850;
        }

        .analytics-hero-description {
          max-width: 720px;
          margin: 13px 0 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.7;
        }

        .analytics-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .analytics-select-wrap {
          position: relative;
        }

        .analytics-select {
          appearance: none;
          min-width: 160px;
          height: 42px;
          padding: 0 38px 0 14px;
          border: 1px solid rgba(148, 163, 184, 0.17);
          border-radius: 12px;
          outline: none;
          background: rgba(15, 23, 42, 0.78);
          color: #e2e8f0;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .analytics-select-wrap svg {
          position: absolute;
          right: 13px;
          top: 13px;
          pointer-events: none;
          color: #64748b;
        }

        .analytics-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 42px;
          padding: 0 14px;
          border: 1px solid rgba(148, 163, 184, 0.17);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.78);
          color: #cbd5e1;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 180ms ease;
        }

        .analytics-refresh:hover {
          border-color: rgba(139, 92, 246, 0.45);
          background: rgba(30, 41, 59, 0.9);
          color: #fff;
        }

        .analytics-refresh.spinning svg {
          animation: analytics-spin 700ms linear infinite;
        }

        @keyframes analytics-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .analytics-signal {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 42px;
          padding: 0 13px;
          border: 1px solid rgba(16, 185, 129, 0.16);
          border-radius: 12px;
          background: rgba(6, 78, 59, 0.14);
          color: #a7f3d0;
          font-size: 11px;
          font-weight: 750;
        }

        .analytics-signal-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 0 5px rgba(52, 211, 153, 0.08), 0 0 18px rgba(52, 211, 153, 0.6);
        }

        .analytics-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .analytics-metric-card {
          position: relative;
          overflow: hidden;
          min-height: 150px;
          padding: 18px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          border-radius: 18px;
          background:
            linear-gradient(145deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.64));
          box-shadow: 0 16px 45px rgba(0, 0, 0, 0.14);
        }

        .analytics-metric-card::after {
          content: "";
          position: absolute;
          width: 120px;
          height: 120px;
          right: -55px;
          top: -55px;
          border-radius: 50%;
          opacity: 0.11;
          background: currentColor;
          filter: blur(5px);
        }

        .analytics-metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .analytics-metric-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: rgba(139, 92, 246, 0.12);
          color: #a78bfa;
        }

        .analytics-change {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .analytics-change-positive {
          color: #6ee7b7;
          background: rgba(16, 185, 129, 0.09);
        }

        .analytics-change-negative {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.09);
        }

        .analytics-metric-value {
          margin-top: 20px;
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -0.035em;
        }

        .analytics-metric-label {
          margin-top: 5px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .analytics-metric-line {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 0;
          height: 2px;
          overflow: hidden;
          background: rgba(148, 163, 184, 0.08);
        }

        .analytics-metric-line span {
          display: block;
          width: 62%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, transparent);
        }

        .analytics-tone-cyan .analytics-metric-icon {
          color: #67e8f9;
          background: rgba(6, 182, 212, 0.11);
        }

        .analytics-tone-cyan .analytics-metric-line span {
          background: linear-gradient(90deg, #06b6d4, transparent);
        }

        .analytics-tone-emerald .analytics-metric-icon {
          color: #6ee7b7;
          background: rgba(16, 185, 129, 0.11);
        }

        .analytics-tone-emerald .analytics-metric-line span {
          background: linear-gradient(90deg, #10b981, transparent);
        }

        .analytics-tone-amber .analytics-metric-icon {
          color: #fcd34d;
          background: rgba(245, 158, 11, 0.11);
        }

        .analytics-tone-amber .analytics-metric-line span {
          background: linear-gradient(90deg, #f59e0b, transparent);
        }

        .analytics-command-center {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 16px;
          margin-bottom: 22px;
        }

        .analytics-command-card,
        .analytics-health-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.13);
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.64);
        }

        .analytics-command-card {
          padding: 21px;
          background:
            radial-gradient(circle at 90% 10%, rgba(139, 92, 246, 0.16), transparent 28%),
            linear-gradient(145deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.68));
        }

        .analytics-command-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .analytics-command-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .analytics-command-title-icon {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          border-radius: 10px;
          color: #c4b5fd;
          background: rgba(139, 92, 246, 0.12);
        }

        .analytics-command-title h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .analytics-command-title p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 11px;
        }

        .analytics-score {
          text-align: right;
        }

        .analytics-score-value {
          color: #a78bfa;
          font-size: 30px;
          line-height: 1;
          font-weight: 900;
        }

        .analytics-score-label {
          margin-top: 4px;
          color: #64748b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .analytics-progress-track {
          height: 8px;
          margin-top: 21px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.09);
        }

        .analytics-progress-value {
          width: 84%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #7c3aed, #06b6d4);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
        }

        .analytics-command-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .analytics-mini-stat {
          padding: 12px;
          border: 1px solid rgba(148, 163, 184, 0.09);
          border-radius: 12px;
          background: rgba(2, 6, 23, 0.24);
        }

        .analytics-mini-stat span {
          display: block;
          color: #64748b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .analytics-mini-stat strong {
          display: block;
          margin-top: 5px;
          color: #e2e8f0;
          font-size: 13px;
        }

        .analytics-health-card {
          padding: 20px;
        }

        .analytics-health-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 800;
        }

        .analytics-health-heading svg {
          color: #34d399;
        }

        .analytics-health-list {
          display: grid;
          gap: 13px;
          margin-top: 18px;
        }

        .analytics-health-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #94a3b8;
          font-size: 11px;
        }

        .analytics-health-row strong {
          color: #6ee7b7;
          font-size: 10px;
        }

        .analytics-health-bar {
          flex: 1;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.08);
        }

        .analytics-health-bar span {
          display: block;
          width: 92%;
          height: 100%;
          border-radius: inherit;
          background: #10b981;
        }

        .analytics-health-row:nth-child(2) .analytics-health-bar span {
          width: 86%;
        }

        .analytics-health-row:nth-child(3) .analytics-health-bar span {
          width: 97%;
        }

        .analytics-section {
          margin-top: 26px;
        }

        .analytics-section-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
        }

        .analytics-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .analytics-title-row h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.025em;
        }

        .analytics-section-header p {
          max-width: 650px;
          margin: 6px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .analytics-section-icon {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          color: #a78bfa;
          background: rgba(139, 92, 246, 0.1);
        }

        .analytics-period-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 9px;
          color: #94a3b8;
          background: rgba(15, 23, 42, 0.5);
          font-size: 10px;
          font-weight: 700;
        }

        .analytics-period-label svg {
          color: #8b5cf6;
        }

        .analytics-charts-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.9fr);
          gap: 16px;
        }

        .analytics-chart-shell {
          min-height: 340px;
          padding: 18px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 19px;
          background: rgba(15, 23, 42, 0.58);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
        }

        .analytics-chart-heading {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 10px;
        }

        .analytics-chart-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a78bfa;
        }

        .analytics-chart-title-row h3 {
          margin: 0;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 800;
        }

        .analytics-chart-heading p {
          margin: 4px 0 0 25px;
          color: #64748b;
          font-size: 10px;
        }

        .analytics-chart-menu {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 28px;
          padding: 0 7px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          cursor: pointer;
        }

        .analytics-chart-menu span {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #64748b;
        }

        .analytics-chart-content {
          min-height: 270px;
          height: 270px;
        }

        .analytics-chart-content > * {
          width: 100%;
          height: 100%;
        }

        .analytics-full-chart {
          grid-column: 1 / -1;
        }

        .analytics-insights-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .analytics-insight {
          position: relative;
          overflow: hidden;
          min-height: 145px;
          padding: 17px;
          border: 1px solid rgba(148, 163, 184, 0.11);
          border-radius: 17px;
          background: rgba(15, 23, 42, 0.58);
          cursor: pointer;
          transition: 180ms ease;
        }

        .analytics-insight:hover,
        .analytics-insight.active {
          transform: translateY(-2px);
          border-color: rgba(139, 92, 246, 0.28);
          background: rgba(30, 41, 59, 0.7);
        }

        .analytics-insight-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          color: #6ee7b7;
          background: rgba(16, 185, 129, 0.1);
        }

        .analytics-insight:nth-child(2) .analytics-insight-icon {
          color: #fbbf24;
          background: rgba(245, 158, 11, 0.1);
        }

        .analytics-insight:nth-child(3) .analytics-insight-icon {
          color: #67e8f9;
          background: rgba(6, 182, 212, 0.1);
        }

        .analytics-insight h3 {
          margin: 13px 0 6px;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 800;
        }

        .analytics-insight p {
          margin: 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.65;
        }

        .analytics-ai-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 22px;
          padding: 18px 20px;
          border: 1px solid rgba(139, 92, 246, 0.18);
          border-radius: 17px;
          background:
            linear-gradient(90deg, rgba(124, 58, 237, 0.1), rgba(6, 182, 212, 0.06)),
            rgba(15, 23, 42, 0.62);
        }

        .analytics-ai-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .analytics-ai-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          color: #ddd6fe;
          background: rgba(139, 92, 246, 0.14);
        }

        .analytics-ai-brand strong {
          display: block;
          color: #e2e8f0;
          font-size: 12px;
        }

        .analytics-ai-brand span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 10px;
        }

        .analytics-ai-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #a7f3d0;
          font-size: 10px;
          font-weight: 800;
        }

        .analytics-ai-status::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
        }

        @media (max-width: 1150px) {
          .analytics-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .analytics-command-center {
            grid-template-columns: 1fr;
          }

          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }

          .analytics-full-chart {
            grid-column: auto;
          }
        }

        @media (max-width: 760px) {
          .analytics-page {
            padding: 18px 14px 100px;
          }

          .analytics-hero {
            grid-template-columns: 1fr;
            align-items: start;
          }

          .analytics-controls {
            justify-content: flex-start;
          }

          .analytics-metrics {
            grid-template-columns: 1fr;
          }

          .analytics-command-meta {
            grid-template-columns: 1fr;
          }

          .analytics-section-header {
            align-items: start;
            flex-direction: column;
          }

          .analytics-insights-grid {
            grid-template-columns: 1fr;
          }

          .analytics-ai-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .analytics-score {
            display: none;
          }
        }
      `}</style>

      <div className="analytics-content">
        <header className="analytics-hero">
          <div>
            <div className="analytics-eyebrow">
              Financial Intelligence Engine
            </div>

            <h1>Analytics Command Center</h1>

            <p className="analytics-hero-description">
              Deep financial intelligence across cash flow, spending behavior,
              net worth, debt exposure, savings performance, and budget
              efficiency.
            </p>
          </div>

          <div className="analytics-controls">
            <div className="analytics-signal">
              <span className="analytics-signal-dot" />
              Intelligence engine online
            </div>

            <div className="analytics-select-wrap">
              <select
                className="analytics-select"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                aria-label="Analytics period"
              >
                {periods.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <ChevronDown size={15} />
            </div>

            <button
              type="button"
              className={`analytics-refresh ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </header>

        <section className="analytics-metrics">
          {liveCards.map((card) => (
            <MetricCard key={card.label} card={card} />
          ))}
        </section>

        <section className="analytics-command-center">
          <div className="analytics-command-card">
            <div className="analytics-command-top">
              <div className="analytics-command-title">
                <div className="analytics-command-title-icon">
                  <Gauge size={19} />
                </div>

                <div>
                  <h2>Financial Health Score</h2>
                  <p>Composite analysis of your financial position</p>
                </div>
              </div>

              <div className="analytics-score">
                <div className="analytics-score-value">84</div>
                <div className="analytics-score-label">Excellent</div>
              </div>
            </div>

            <div className="analytics-progress-track">
              <div className="analytics-progress-value" />
            </div>

            <div className="analytics-command-meta">
              <div className="analytics-mini-stat">
                <span>Cash resilience</span>
                <strong>Strong</strong>
              </div>

              <div className="analytics-mini-stat">
                <span>Debt pressure</span>
                <strong>Low</strong>
              </div>

              <div className="analytics-mini-stat">
                <span>Savings velocity</span>
                <strong>Accelerating</strong>
              </div>
            </div>
          </div>

          <div className="analytics-health-card">
            <div className="analytics-health-heading">
              <ShieldCheck size={17} />
              System intelligence
            </div>

            <div className="analytics-health-list">
              <div className="analytics-health-row">
                <span>Data integrity</span>
                <div className="analytics-health-bar">
                  <span />
                </div>
                <strong>92%</strong>
              </div>

              <div className="analytics-health-row">
                <span>Budget control</span>
                <div className="analytics-health-bar">
                  <span />
                </div>
                <strong>86%</strong>
              </div>

              <div className="analytics-health-row">
                <span>Goal progress</span>
                <div className="analytics-health-bar">
                  <span />
                </div>
                <strong>97%</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="analytics-section">
          <SectionHeader
            icon={LineChart}
            eyebrow="Performance telemetry"
            title="Financial performance"
            description="Track the movement of income, expenses, liquidity, and overall wealth."
            action={
              <div className="analytics-period-label">
                <CalendarDays size={13} />
                {selectedPeriod.label}
              </div>
            }
          />

          <div className="analytics-charts-grid">
            <ChartShell
              title="Income vs Expenses"
              subtitle="Monthly cash-flow trajectory"
              icon={BarChart3}
              className="analytics-full-chart"
            >
              <IncomeExpenseChart />
            </ChartShell>

            <ChartShell
              title="Category Spending"
              subtitle="Where your money is going"
              icon={PieChart}
            >
              <CategorySpendingChart />
            </ChartShell>

            <ChartShell
              title="Net Worth"
              subtitle="Long-term wealth trajectory"
              icon={TrendingUp}
            >
              <NetWorthChart />
            </ChartShell>

            <ChartShell
              title="Budget Performance"
              subtitle="Actual vs planned spending"
              icon={Target}
              className="analytics-full-chart"
            >
              <BudgetChart />
            </ChartShell>
          </div>
        </section>

        <section className="analytics-section">
          <SectionHeader
            icon={BrainCircuit}
            eyebrow="AI financial intelligence"
            title="Detected insights"
            description="Patterns identified from your current financial activity."
          />

          <div className="analytics-insights-grid">
            {insights.map((insight, index) => {
              const Icon = insight.icon;

              return (
                <article
                  key={insight.title}
                  className={`analytics-insight ${
                    activeInsight === index ? 'active' : ''
                  }`}
                  onClick={() => setActiveInsight(index)}
                >
                  <div className="analytics-insight-icon">
                    <Icon size={17} />
                  </div>

                  <h3>{insight.title}</h3>
                  <p>{insight.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <div className="analytics-ai-footer">
          <div className="analytics-ai-brand">
            <div className="analytics-ai-icon">
              <Sparkles size={18} />
            </div>

            <div>
              <strong>FinSight Intelligence</strong>
              <span>
                Analytics layer ready for deeper financial recommendations.
              </span>
            </div>
          </div>

          <div className="analytics-ai-status">Analysis engine ready</div>
        </div>
      </div>
    </main>
  );
}