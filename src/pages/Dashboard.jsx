import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import TransactionForm from '../components/transactions/TransactionForm.jsx';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactMoney = (value) => {
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  if (abs >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return money(num);
};

function StatCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  description,
  accent,
}) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 178,
        padding: 22,
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))',
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 130,
          height: 130,
          borderRadius: '50%',
          right: -45,
          top: -45,
          background: accent,
          filter: 'blur(45px)',
          opacity: 0.2,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 14,
            background: `${accent}18`,
            border: `1px solid ${accent}35`,
            color: accent,
          }}
        >
          <Icon size={21} />
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 9px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            color: positive ? '#4ade80' : '#fb7185',
            background: positive
              ? 'rgba(74,222,128,0.09)'
              : 'rgba(251,113,133,0.09)',
          }}
        >
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
      </div>
      <div style={{ marginTop: 20, position: 'relative' }}>
        <div
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 7,
            color: '#fff',
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: '-0.04em',
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 9,
            color: 'rgba(255,255,255,0.38)',
            fontSize: 11,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: 18,
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              color: '#a78bfa',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            margin: 0,
            color: '#fff',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.025em',
          }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('This month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [pulseVisible, setPulseVisible] = useState(true);

  const [dashboard, setDashboard] = useState({
    accounts: [],
    budgets: [],
    recentTransactions: [],
    debts: [],
    savings: [],
    spendingByCategory: [],
    monthlyExpenses: [],
  });

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [dashRes, accRes, debtRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/${USER_ID}`),
        fetch(`${API_BASE_URL}/accounts/${USER_ID}`),
        fetch(`${API_BASE_URL}/debts/${USER_ID}/overview`).catch(() => null),
      ]);

      if (!dashRes.ok) {
        throw new Error(`Dashboard API failed with HTTP ${dashRes.status}`);
      }

      const dashJson = await dashRes.json();
      const accJson = accRes.ok ? await accRes.json() : { data: [] };
      const debtJson = debtRes && debtRes.ok ? await debtRes.json() : { data: {} };

      const data = dashJson?.data || {};
      const rawAccounts = Array.isArray(accJson?.data)
        ? accJson.data
        : Array.isArray(data.accounts)
          ? data.accounts
          : [];

      setDashboard({
        accounts: rawAccounts,
        budgets: Array.isArray(data.budgets) ? data.budgets : [],
        recentTransactions: Array.isArray(data.recentTransactions)
          ? data.recentTransactions
          : [],
        debts: Array.isArray(debtJson?.data?.debts)
          ? debtJson.data.debts
          : Array.isArray(data.debts)
            ? data.debts
            : [],
        savings: Array.isArray(data.savings) ? data.savings : [],
        spendingByCategory: Array.isArray(data.spendingByCategory)
          ? data.spendingByCategory
          : [],
        monthlyExpenses: Array.isArray(data.monthlyExpenses)
          ? data.monthlyExpenses
          : [],
      });
    } catch (err) {
      setError(err?.message || 'Unable to load live dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const accounts = dashboard.accounts || [];
    const transactions = dashboard.recentTransactions || [];
    const debts = dashboard.debts || [];

    const liquidAssets = accounts.reduce((sum, a) => {
      const type = String(a.account_type || '').toLowerCase();
      const bal = Number(a.balance) || 0;
      if (type.includes('credit') || type.includes('loan')) return sum;
      return sum + bal;
    }, 0);

    const investments = accounts.reduce((sum, a) => {
      const type = String(a.account_type || '').toLowerCase();
      return type.includes('invest') ? sum + (Number(a.balance) || 0) : sum;
    }, 0);

    const totalDebt = debts.reduce(
      (sum, d) =>
        sum +
        (Number(
          d.remaining_amount ??
            d.outstanding_balance ??
            d.remaining_balance ??
            d.total_overdue ??
            0,
        ) || 0),
      0,
    );

    const netWorth = liquidAssets - totalDebt;

    const monthlyIncome = transactions
      .filter((t) => String(t.transaction_type || t.type || '').toUpperCase() === 'INCOME')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const monthlyExpense = transactions
      .filter((t) => String(t.transaction_type || t.type || '').toUpperCase() === 'EXPENSE')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const savingsRate =
      monthlyIncome > 0
        ? Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
        : 0;

    const debtRatio =
      liquidAssets > 0 ? Math.min(100, (totalDebt / liquidAssets) * 100) : 0;

    const healthScore = Math.min(
      100,
      Math.max(
        35,
        Math.round(60 + savingsRate * 0.4 - debtRatio * 0.25),
      ),
    );

    return {
      netWorth,
      liquidAssets,
      investments,
      totalDebt,
      monthlyIncome,
      monthlyExpense,
      savingsRate,
      debtRatio,
      healthScore,
    };
  }, [dashboard]);

  const chartBars = useMemo(() => {
    if (dashboard.spendingByCategory.length > 0) {
      return dashboard.spendingByCategory.slice(0, 7).map((item) => ({
        label: String(item.category_name || item.category || 'Other').slice(0, 8),
        value: Number(item.total_spent ?? item.amount ?? 0) || 0,
      }));
    }
    return [
      { label: 'Mon', value: 0 },
      { label: 'Tue', value: 0 },
      { label: 'Wed', value: 0 },
      { label: 'Thu', value: 0 },
      { label: 'Fri', value: 0 },
    ];
  }, [dashboard.spendingByCategory]);

  const handleCreateTransaction = async (formData) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          transaction_type: formData.type.toUpperCase(),
          amount: Number(formData.amount),
          description: formData.description,
          category: formData.category,
          account: formData.account,
          transaction_date: formData.transactionDate,
          notes: formData.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to create transaction');
      setIsTxModalOpen(false);
      await loadDashboard({ silent: true });
    } catch (err) {
      setError(err.message || 'Could not save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const rows = dashboard.recentTransactions.map((t) => [
      t.transaction_date || '',
      t.description || '',
      t.category_name || '',
      t.account_name || '',
      t.transaction_type || '',
      t.amount || 0,
    ]);
    const csv = [
      ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount'],
      ...rows,
    ]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finsight-dashboard-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxChartVal = Math.max(...chartBars.map((b) => b.value), 1);

  return (
    <main style={{ minHeight: '100%', color: '#fff', padding: '28px 28px 100px' }}>
      <section
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 26,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#a78bfa',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            <Zap size={12} />
            Financial Command Center · Live PostgreSQL
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 850,
              letterSpacing: '-0.05em',
              lineHeight: 1,
            }}
          >
            Financial Overview.
          </h1>
          <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.42)', fontSize: 12 }}>
            Real-time telemetry from your connected PostgreSQL accounts and ledger.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => loadDashboard({ silent: true })}
            style={{
              width: 38,
              height: 38,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.035)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
            title="Refresh live data"
          >
            <RefreshCw
              size={15}
              style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
            />
          </button>

          <button
            type="button"
            onClick={() => navigate('/audit')}
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.035)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
            title="View system audit logs"
          >
            <Bell size={16} />
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#34d399',
              }}
            />
          </button>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              height: 38,
              padding: '0 11px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#121926',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <option value="This month">This month</option>
            <option value="Last 90 days">Last 90 days</option>
            <option value="This year">This year</option>
          </select>
        </div>
      </section>

      {error && (
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 16,
            border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.08)',
            color: '#fca5a5',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Net worth hero */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 20,
          padding: 28,
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.09)',
          background:
            'radial-gradient(circle at 80% 0%, rgba(139,92,246,0.24), transparent 34%), radial-gradient(circle at 20% 100%, rgba(59,130,246,0.1), transparent 35%), linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))',
          boxShadow: '0 30px 90px rgba(0,0,0,0.24)',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 30,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'rgba(255,255,255,0.42)',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              <Wallet size={13} />
              TOTAL NET WORTH (ASSETS MINUS DEBT)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 10 }}>
              <span
                style={{
                  fontSize: 'clamp(36px, 6vw, 58px)',
                  lineHeight: 0.95,
                  fontWeight: 900,
                  letterSpacing: '-0.06em',
                }}
              >
                {loading ? '...' : money(metrics.netWorth)}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  color: metrics.netWorth >= 0 ? '#4ade80' : '#fb7185',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                <ArrowUpRight size={13} />
                Live
              </span>
            </div>
            <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
              Across {dashboard.accounts.length} active PostgreSQL accounts
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 11,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Download size={14} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => setIsTxModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 11,
                border: '1px solid rgba(139,92,246,0.4)',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Plus size={14} />
              Add transaction
            </button>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
            marginTop: 28,
          }}
        >
          {[
            ['Liquid assets', compactMoney(metrics.liquidAssets), 'Connected accounts'],
            ['Recent income', compactMoney(metrics.monthlyIncome), 'Recorded inflows'],
            ['Recent spending', compactMoney(metrics.monthlyExpense), 'Recorded outflows'],
            ['Investments', compactMoney(metrics.investments), 'Investment accounts'],
          ].map(([label, value, sub]) => (
            <div
              key={label}
              style={{
                padding: 14,
                borderRadius: 15,
                background: 'rgba(0,0,0,0.18)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{label}</div>
              <div style={{ color: '#fff', fontSize: 17, fontWeight: 800, marginTop: 5 }}>
                {value}
              </div>
              <div style={{ color: '#a78bfa', fontSize: 10, fontWeight: 600, marginTop: 3 }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Intelligence Pulse */}
      <div
        style={{
          marginBottom: 20,
          padding: 24,
          borderRadius: 28,
          border: '1px solid rgba(167,139,250,0.18)',
          background:
            'radial-gradient(circle at 90% 10%, rgba(139,92,246,0.2), transparent 35%), linear-gradient(145deg, rgba(139,92,246,0.12), rgba(255,255,255,0.025))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 13,
                background: 'rgba(139,92,246,0.14)',
                color: '#c4b5fd',
              }}
            >
              <Sparkles size={19} />
            </div>
            <div>
              <div style={{ color: '#c4b5fd', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                FinSight Intelligence
              </div>
              <div style={{ color: '#fff', fontSize: 17, fontWeight: 800, marginTop: 3 }}>
                Your live financial pulse
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPulseVisible((v) => !v)}
            style={{ border: 0, background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
          >
            {pulseVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {pulseVisible && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              marginTop: 20,
            }}
          >
            {[
              ['Savings rate', `${metrics.savingsRate.toFixed(1)}%`, 'Cash retention'],
              ['Debt ratio', `${metrics.debtRatio.toFixed(1)}%`, 'Liability load'],
              ['Financial score', `${metrics.healthScore}/100`, metrics.healthScore >= 75 ? 'Healthy' : 'Monitor'],
            ].map(([label, value, trend]) => (
              <div
                key={label}
                style={{
                  padding: 13,
                  borderRadius: 15,
                  background: 'rgba(0,0,0,0.16)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{label}</div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginTop: 5 }}>{value}</div>
                <div style={{ color: '#86efac', fontSize: 10, marginTop: 4 }}>{trend}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard
          title="Available balance"
          value={money(metrics.liquidAssets)}
          change={`${dashboard.accounts.length} accounts`}
          positive
          description="Across active bank & cash accounts"
          icon={Wallet}
          accent="#8b5cf6"
        />
        <StatCard
          title="Recorded income"
          value={money(metrics.monthlyIncome)}
          change="Inflows"
          positive
          description="From recent ledger activity"
          icon={ArrowUpRight}
          accent="#4ade80"
        />
        <StatCard
          title="Recorded expenses"
          value={money(metrics.monthlyExpense)}
          change="Outflows"
          positive={metrics.monthlyExpense <= metrics.monthlyIncome}
          description="From recent ledger activity"
          icon={TrendingDown}
          accent="#60a5fa"
        />
        <StatCard
          title="Debt outstanding"
          value={money(metrics.totalDebt)}
          change={`${dashboard.debts.length} active`}
          positive={metrics.totalDebt === 0}
          description="Total remaining liabilities"
          icon={ShieldCheck}
          accent="#f472b6"
        />
      </section>

      {/* Main Analytics Row */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {/* Spending by Category Bar Chart */}
        <div
          style={{
            padding: 24,
            borderRadius: 26,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))',
          }}
        >
          <SectionHeader
            eyebrow="Cash flow"
            title="Spending by category"
            action={
              <button
                type="button"
                onClick={() => navigate('/analytics')}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#a78bfa',
                  padding: '6px 10px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Full analytics →
              </button>
            }
          />
          <div
            style={{
              height: 220,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              padding: '0 5px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {chartBars.map((item) => {
              const height = Math.max(18, (item.value / maxChartVal) * 175);
              return (
                <div
                  key={item.label}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 9,
                  }}
                >
                  <div
                    title={money(item.value)}
                    style={{
                      width: '100%',
                      maxWidth: 42,
                      height,
                      borderRadius: '10px 10px 4px 4px',
                      background: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)',
                    }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Health Panel */}
        <div
          style={{
            padding: 24,
            borderRadius: 26,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))',
          }}
        >
          <SectionHeader
            eyebrow="Control center"
            title="Budget health"
            action={
              <button
                type="button"
                onClick={() => navigate('/budgets')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  border: 0,
                  background: 'transparent',
                  color: '#a78bfa',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Manage <ArrowUpRight size={13} />
              </button>
            }
          />
          <div style={{ display: 'grid', gap: 16 }}>
            {dashboard.budgets.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, padding: '20px 0' }}>
                No budgets configured yet. Click Manage to create a budget.
              </div>
            ) : (
              dashboard.budgets.slice(0, 4).map((b, idx) => {
                const limit = Number(b.budget_amount ?? b.amount_limit ?? b.amount ?? 1) || 1;
                const spent = Number(b.actual_spending ?? b.spent_amount ?? b.spent ?? 0) || 0;
                const pct = Math.min(100, Math.round((spent / limit) * 100));
                const danger = pct >= 85;
                return (
                  <div key={b.budget_id ?? idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                        {b.category_name || `Budget #${b.budget_id}`}
                      </span>
                      <strong style={{ color: danger ? '#fb7185' : '#a78bfa', fontSize: 12 }}>
                        {money(spent)} / {money(limit)} ({pct}%)
                      </strong>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: danger
                            ? 'linear-gradient(90deg,#fb7185,#f43f5e)'
                            : 'linear-gradient(90deg,#8b5cf6,#a78bfa)',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Bottom Panels: Recent Transactions & Connected Accounts */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 14,
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 26,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))',
          }}
        >
          <SectionHeader
            eyebrow="Ledger"
            title="Recent transactions"
            action={
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#a78bfa',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                View all →
              </button>
            }
          />
          <div style={{ display: 'grid' }}>
            {dashboard.recentTransactions.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, padding: '20px 0' }}>
                No transactions recorded yet.
              </div>
            ) : (
              dashboard.recentTransactions.slice(0, 5).map((tx, idx) => {
                const isIncome =
                  String(tx.transaction_type || tx.type || '').toUpperCase() === 'INCOME';
                return (
                  <div
                    key={tx.transaction_id ?? idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr auto',
                      alignItems: 'center',
                      gap: 12,
                      padding: '13px 0',
                      borderBottom:
                        idx === Math.min(dashboard.recentTransactions.length, 5) - 1
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 12,
                        background: isIncome ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                        color: isIncome ? '#4ade80' : '#a78bfa',
                      }}
                    >
                      {isIncome ? <Landmark size={16} /> : <CreditCard size={16} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                        {tx.description || 'Transaction'}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3 }}>
                        {tx.category_name || 'General'} ·{' '}
                        {tx.transaction_date
                          ? new Date(tx.transaction_date).toLocaleDateString('en-IN')
                          : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          color: isIncome ? '#4ade80' : '#fff',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {isIncome ? '+' : '-'}
                        {money(tx.amount)}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>
                        {tx.account_name || ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          style={{
            padding: 24,
            borderRadius: 26,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))',
          }}
        >
          <SectionHeader
            eyebrow="Connected capital"
            title="Accounts & assets"
            action={
              <button
                type="button"
                onClick={() => navigate('/accounts')}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#a78bfa',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Manage →
              </button>
            }
          />
          <div style={{ display: 'grid', gap: 11 }}>
            {dashboard.accounts.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, padding: '20px 0' }}>
                No accounts connected yet.
              </div>
            ) : (
              dashboard.accounts.map((acc) => {
                const bal = Number(acc.balance) || 0;
                return (
                  <div
                    key={acc.account_id ?? acc.account_name}
                    style={{
                      padding: 14,
                      borderRadius: 17,
                      background: 'rgba(255,255,255,0.035)',
                      border: '1px solid rgba(255,255,255,0.055)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 11,
                          background: 'rgba(139,92,246,0.09)',
                          color: '#a78bfa',
                        }}
                      >
                        <Landmark size={16} />
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                          {acc.account_name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>
                          {acc.account_type}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        color: bal < 0 ? '#fb7185' : '#4ade80',
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {money(bal)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {isTxModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <TransactionForm
            mode="create"
            categories={[
              'Groceries',
              'Dining Out',
              'Rent & Housing',
              'Utilities',
              'Transportation',
              'Entertainment',
              'Shopping',
              'Healthcare',
              'Salary',
              'Freelance',
              'Investments',
            ]}
            accounts={
              dashboard.accounts.length > 0
                ? dashboard.accounts.map((a) => a.account_name)
                : ['Primary Checking', 'Savings Account']
            }
            submitting={submitting}
            onSubmit={handleCreateTransaction}
            onCancel={() => setIsTxModalOpen(false)}
          />
        </div>
      )}
    </main>
  );
}
