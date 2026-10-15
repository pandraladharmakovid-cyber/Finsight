import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Goal,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateLabel = (value) => {
  if (!value) return 'No target date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const daysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const normalizeGoal = (goal) => {
  const target = Number(goal.target_amount ?? goal.targetAmount ?? goal.goal_amount ?? 0) || 0;
  const saved = Number(goal.current_amount ?? goal.currentAmount ?? goal.saved_amount ?? 0) || 0;
  const progress = target > 0 ? Math.min(100, Math.max(0, (saved / target) * 100)) : 0;

  return {
    ...goal,
    target,
    saved,
    remaining: Math.max(target - saved, 0),
    progress,
    title: goal.goal_name ?? goal.goalName ?? goal.name ?? `Savings Goal #${goal.goal_id}`,
    targetDate: goal.target_date ?? goal.targetDate ?? goal.deadline ?? null,
  };
};

function MetricCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <div className={`sg-metric sg-metric-${tone}`}>
      <div className="sg-metric-top">
        <div className="sg-metric-icon">
          <Icon size={18} />
        </div>
        <span className="sg-live"><span />LIVE</span>
      </div>
      <span className="sg-metric-label">{label}</span>
      <strong className="sg-metric-value">{value}</strong>
      <span className="sg-metric-helper">{helper}</span>
    </div>
  );
}

function ProgressRing({ progress, size = 94 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="sg-progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(117,139,190,.10)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#savingsGradient)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <defs>
          <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6c83ff" />
            <stop offset="100%" stopColor="#b46dff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="sg-ring-value">
        <strong>{Math.round(progress)}%</strong>
        <span>saved</span>
      </div>
    </div>
  );
}

function GoalCard({ goal, onSelect }) {
  const days = daysUntil(goal.targetDate);
  const completed = goal.progress >= 100;
  const urgent = !completed && days !== null && days >= 0 && days <= 30;

  return (
    <button type="button" className="sg-goal-card" onClick={() => onSelect(goal)}>
      <div className="sg-goal-glow" />
      <div className="sg-goal-header">
        <div className="sg-goal-icon">
          {completed ? <CheckCircle2 size={19} /> : <Target size={19} />}
        </div>
        <div className="sg-goal-title">
          <strong>{goal.title}</strong>
          <span>Goal #{goal.goal_id ?? goal.id}</span>
        </div>
        <MoreHorizontal size={17} className="sg-more" />
      </div>

      <div className="sg-goal-amounts">
        <div>
          <span>CURRENT</span>
          <strong>{money(goal.saved)}</strong>
        </div>
        <div>
          <span>TARGET</span>
          <strong>{money(goal.target)}</strong>
        </div>
      </div>

      <div className="sg-progress-track">
        <div className="sg-progress-fill" style={{ width: `${goal.progress}%` }} />
      </div>

      <div className="sg-goal-progress-row">
        <span>{goal.progress.toFixed(1)}% complete</span>
        <strong>{money(goal.remaining)} remaining</strong>
      </div>

      <div className="sg-goal-divider" />

      <div className="sg-goal-footer">
        <div>
          <Calendar size={13} />
          <span>{goal.targetDate ? dateLabel(goal.targetDate) : 'No target date'}</span>
        </div>
        {completed ? (
          <span className="sg-complete-pill"><CheckCircle2 size={11} /> Completed</span>
        ) : urgent ? (
          <span className="sg-urgent-pill"><Clock3 size={11} /> {days === 0 ? 'Due today' : `${days}d left`}</span>
        ) : (
          <ChevronRight size={15} className="sg-chevron" />
        )}
      </div>
    </button>
  );
}

function GoalModal({ goal, onClose, onDelete }) {
  if (!goal) return null;
  const days = daysUntil(goal.targetDate);
  const monthlyRequired = days !== null && days > 0 ? goal.remaining / Math.max(1, days / 30.4375) : 0;

  return (
    <div className="sg-modal-layer">
      <button type="button" className="sg-modal-backdrop" onClick={onClose} aria-label="Close goal details" />
      <section className="sg-modal" role="dialog" aria-modal="true">
        <div className="sg-modal-header">
          <div>
            <span>SAVINGS GOAL</span>
            <h2>{goal.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="sg-close"><X size={18} /></button>
        </div>

        <div className="sg-modal-hero">
          <ProgressRing progress={goal.progress} size={116} />
          <div className="sg-modal-hero-copy">
            <span>CURRENT SAVINGS</span>
            <strong>{money(goal.saved)}</strong>
            <small>of {money(goal.target)}</small>
          </div>
        </div>

        <div className="sg-detail-grid">
          <div><span>Goal ID</span><strong>#{goal.goal_id ?? goal.id}</strong></div>
          <div><span>Progress</span><strong>{goal.progress.toFixed(1)}%</strong></div>
          <div><span>Remaining</span><strong>{money(goal.remaining)}</strong></div>
          <div><span>Target date</span><strong>{dateLabel(goal.targetDate)}</strong></div>
          <div><span>Days remaining</span><strong>{days === null ? '—' : days < 0 ? 'Past target' : days}</strong></div>
          <div><span>Required / month</span><strong>{monthlyRequired ? money(monthlyRequired) : '—'}</strong></div>
        </div>

        <div className="sg-modal-actions">
          <button type="button" onClick={onClose}>Close</button>
          <button
            type="button"
            onClick={() => onDelete(goal.goal_id ?? goal.id)}
            style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            Delete Goal
          </button>
        </div>
      </section>
    </div>
  );
}

function CreateGoalModal({ isOpen, onClose, onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      goal_name: name,
      target_amount: Number(targetAmount) || 0,
      current_amount: Number(currentAmount) || 0,
      target_date: targetDate || null,
    });
  };

  return (
    <div className="sg-modal-layer">
      <button type="button" className="sg-modal-backdrop" onClick={onClose} />
      <form onSubmit={handleSubmit} className="sg-modal p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-black text-white">Create Savings Goal</h2>
          <button type="button" onClick={onClose} className="sg-close"><X size={18} /></button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Goal Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Laptop / Emergency Fund"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Target Amount (₹) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="50000"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Already Saved (₹)</label>
              <input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="5000"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Target Deadline</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-400"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300">Cancel</button>
          <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold">
            {submitting ? 'Saving...' : 'Save Goal'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Savings() {
  const [goals, setGoals] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('progress');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchSavings = useCallback(async ({ silent = false } = {}) => {
    if (!USER_ID) {
      setError('VITE_FINSIGHT_USER_ID is not configured.');
      setLoading(false);
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [goalsRes, overviewRes] = await Promise.all([
        fetch(`${API_BASE_URL}/savings/${USER_ID}`),
        fetch(`${API_BASE_URL}/savings/${USER_ID}/overview`),
      ]);

      if (!goalsRes.ok || !overviewRes.ok) {
        throw new Error('Failed to load savings records.');
      }

      const goalsJson = await goalsRes.json();
      const overviewJson = await overviewRes.json();

      setGoals((goalsJson.data || []).map(normalizeGoal));
      setOverview(overviewJson.data || {});
    } catch (err) {
      setError(err?.message || 'Unable to load savings data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  const handleCreateGoal = async (payload) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/savings/${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create goal');
      setIsCreateOpen(false);
      await fetchSavings({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/savings/${USER_ID}/${goalId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete goal');
      setSelectedGoal(null);
      await fetchSavings({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const metrics = useMemo(() => {
    const backend = overview?.metrics || {};
    const totalTarget = Number(backend.totalTarget) || goals.reduce((s, g) => s + g.target, 0);
    const totalSaved = Number(backend.totalSaved) || goals.reduce((s, g) => s + g.saved, 0);
    const remaining = Math.max(totalTarget - totalSaved, 0);
    const overallProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
    const completed = goals.filter((g) => g.progress >= 100).length;

    return {
      goalCount: Number(backend.goalCount) || goals.length,
      totalTarget,
      totalSaved,
      remaining,
      overallProgress,
      completed,
    };
  }, [goals, overview]);

  const filteredGoals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return goals
      .filter((goal) => {
        const matchesSearch = !query || goal.title.toLowerCase().includes(query);
        const completed = goal.progress >= 100;
        const matchesFilter =
          filter === 'all' ||
          (filter === 'active' && !completed) ||
          (filter === 'completed' && completed) ||
          (filter === 'near' && !completed && daysUntil(goal.targetDate) <= 30);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === 'amount') return b.saved - a.saved;
        if (sort === 'target') return b.target - a.target;
        if (sort === 'name') return a.title.localeCompare(b.title);
        return b.progress - a.progress;
      });
  }, [goals, search, filter, sort]);

  return (
    <main className="sg-page px-4 sm:px-6 lg:px-8 max-w-[1800px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Savings Goals</h1>
          <p className="text-sm text-slate-400">Track and manage your real PostgreSQL savings objectives.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-lg"
        >
          <Plus size={17} />
          Add Savings Goal
        </button>
      </div>

      <section className="sg-metrics mb-6">
        <MetricCard label="SAVINGS GOALS" value={metrics.goalCount} helper="Active records" icon={Target} tone="blue" />
        <MetricCard label="TOTAL SAVED" value={money(metrics.totalSaved)} helper="Current saved amount" icon={Wallet} tone="green" />
        <MetricCard label="TOTAL TARGET" value={money(metrics.totalTarget)} helper="Combined goals target" icon={CircleDollarSign} tone="purple" />
        <MetricCard label="REMAINING" value={money(metrics.remaining)} helper="Amount still required" icon={TrendingUp} tone="orange" />
      </section>

      <section className="sg-goals-section">
        <div className="sg-toolbar mb-4">
          <div className="sg-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search savings goals..."
            />
          </div>
          <div className="sg-select">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All goals</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="near">Near target</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading savings goals...</div>
        ) : filteredGoals.length ? (
          <div className="sg-goal-grid">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.goal_id ?? goal.id} goal={goal} onSelect={setSelectedGoal} />
            ))}
          </div>
        ) : (
          <div className="sg-empty p-12 text-center text-slate-500">No savings goals found.</div>
        )}
      </section>

      <GoalModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} onDelete={handleDeleteGoal} />
      <CreateGoalModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateGoal} submitting={submitting} />
    </main>
  );
}