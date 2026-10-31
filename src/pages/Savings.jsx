import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Coins,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import SectionHead from '../components/ui/SectionHead.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';
import { ProgressRing } from '../components/charts/index.jsx';

import { api } from '../lib/api.js';
import { useResource, useToast } from '../lib/hooks.jsx';
import {
  asArray,
  clamp,
  daysUntil,
  money,
  normaliseGoal,
  prettyDate,
  titleCase,
  unwrap,
} from '../lib/format.js';

const emptyForm = {
  name: '',
  target: '',
  saved: '',
  targetDate: '',
  status: 'ACTIVE',
};

export default function Savings() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const overviewRes = useResource(() => api.savingsOverview(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [contributeTarget, setContributeTarget] = useState(null);
  const [contribution, setContribution] = useState('');
  const [contributing, setContributing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');

  const payload = unwrap(overviewRes.data) ?? {};
  const goals = useMemo(
    () => asArray(payload.goals).map(normaliseGoal),
    [payload.goals],
  );

  const visible = useMemo(
    () =>
      statusFilter === 'ALL'
        ? goals
        : goals.filter((goal) => goal.status === statusFilter),
    [goals, statusFilter],
  );

  const totals = useMemo(() => {
    const target = goals.reduce((total, goal) => total + goal.target, 0);
    const saved = goals.reduce((total, goal) => total + goal.saved, 0);
    const completed = goals.filter((goal) => goal.status === 'COMPLETED').length;

    return {
      target,
      saved,
      remaining: Math.max(target - saved, 0),
      progress: target > 0 ? (saved / target) * 100 : 0,
      completed,
      count: goals.length,
    };
  }, [goals]);

  useEffect(() => {
    if (params.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(goal) {
    setEditing(goal);
    setForm({
      name: goal.name,
      target: String(goal.target),
      saved: String(goal.saved),
      targetDate: goal.targetDate ? String(goal.targetDate).slice(0, 10) : '',
      status: goal.status,
    });
    setErrors({});
    setFormOpen(true);
  }

  async function submitForm(event) {
    event?.preventDefault();

    const next = {};

    if (!form.name.trim()) next.name = 'Give this goal a name.';

    const target = Number(form.target);
    if (!form.target || !Number.isFinite(target) || target <= 0) {
      next.target = 'Target must be greater than zero.';
    }

    const saved = form.saved === '' ? 0 : Number(form.saved);
    if (!Number.isFinite(saved) || saved < 0) {
      next.saved = 'Saved amount cannot be negative.';
    }

    if (!next.target && !next.saved && saved > target) {
      next.saved = 'Saved amount cannot exceed the target.';
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);

    const body = {
      goalName: form.name.trim(),
      targetAmount: target,
      currentAmount: saved,
      targetDate: form.targetDate || null,
      status: form.status,
    };

    try {
      if (editing) {
        await api.updateSavingsGoal(editing.id, body);
        toast.success('Goal updated', body.goalName);
      } else {
        await api.createSavingsGoal(body);
        toast.success('Goal created', `${body.goalName} is now tracked.`);
      }

      setFormOpen(false);
      await overviewRes.refresh();
    } catch (error) {
      toast.error('Could not save goal', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitContribution(event) {
    event?.preventDefault();

    const amount = Number(contribution);

    if (!contribution || !Number.isFinite(amount) || amount <= 0) {
      toast.warn('Invalid amount', 'Enter a contribution greater than zero.');
      return;
    }

    setContributing(true);

    const nextSaved = Math.min(contributeTarget.saved + amount, contributeTarget.target);

    try {
      await api.updateSavingsGoal(contributeTarget.id, {
        goalName: contributeTarget.name,
        targetAmount: contributeTarget.target,
        currentAmount: nextSaved,
        targetDate: contributeTarget.targetDate,
        status:
          nextSaved >= contributeTarget.target ? 'COMPLETED' : contributeTarget.status,
      });

      toast.success(
        'Contribution added',
        `${money(amount)} added to ${contributeTarget.name}.`,
      );

      setContributeTarget(null);
      setContribution('');
      await overviewRes.refresh();
    } catch (error) {
      toast.error('Contribution failed', error.message);
    } finally {
      setContributing(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteSavingsGoal(deleteTarget.id);
      toast.success('Goal deleted', deleteTarget.name);
      setDeleteTarget(null);
      await overviewRes.refresh();
    } catch (error) {
      toast.error('Delete failed', error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (overviewRes.error) {
    return (
      <ErrorState
        error={overviewRes.error}
        onRetry={overviewRes.reload}
        title="Savings goals could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Total saved"
          value={totals.saved}
          icon={PiggyBank}
          tone="mint"
          footnote={`across ${totals.count} goals`}
        />
        <StatCard
          label="Total target"
          value={totals.target}
          icon={Target}
          tone="violet"
          delay={1}
          footnote="combined ambition"
        />
        <StatCard
          label="Still needed"
          value={totals.remaining}
          icon={TrendingUp}
          tone="cyan"
          delay={2}
          footnote="to reach every goal"
        />
        <StatCard
          label="Completed"
          value={totals.completed}
          icon={CheckCircle2}
          tone="amber"
          delay={3}
          format={(n) => Math.round(n).toString()}
          footnote="goals fully funded"
        />
      </section>

      <Card glow className="fs-reveal">
        <div className="fs-row fs-gap-24 fs-wrap" style={{ alignItems: 'center' }}>
          <ProgressRing
            value={totals.progress}
            size={112}
            thickness={10}
            label="Funded"
          />

          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="fs-eyebrow">Overall funding</div>
            <h3 style={{ fontSize: 20, marginTop: 4 }}>
              {money(totals.saved)} of {money(totals.target)}
            </h3>
            <p className="fs-sm fs-dim fs-mt-4">
              {totals.remaining > 0
                ? `${money(totals.remaining)} remaining across all active goals.`
                : 'Every goal is fully funded. Outstanding work.'}
            </p>

            <div className="fs-row fs-gap-8 fs-mt-16">
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                New goal
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="fs-row-between fs-wrap">
        <div className="fs-tabs">
          {['ALL', 'ACTIVE', 'COMPLETED', 'PAUSED'].map((option) => (
            <button
              key={option}
              type="button"
              className={`fs-tab ${statusFilter === option ? 'is-on' : ''}`}
              onClick={() => setStatusFilter(option)}
            >
              {titleCase(option)}
            </button>
          ))}
        </div>
      </div>

      {overviewRes.loading ? (
        <div className="fs-grid fs-grid-3">
          {[0, 1, 2].map((index) => (
            <CardSkeleton key={index} rows={4} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={PiggyBank}
            title="No goals in this view"
            message="Create a savings goal and track real progress toward it."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                Create a goal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="fs-grid fs-grid-3">
          {visible.map((goal, index) => {
            const days = daysUntil(goal.targetDate);
            const done = goal.progress >= 100;

            return (
              <article
                key={goal.id}
                className="fs-card fs-card-pad is-interactive fs-reveal"
                style={{ '--i': index }}
              >
                <div className="fs-row-between fs-mb-16">
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="fs-sm fs-truncate"
                      style={{ color: 'var(--text-1)', fontWeight: 620 }}
                    >
                      {goal.name}
                    </div>

                    <div className="fs-xs fs-dim-2 fs-row fs-gap-4">
                      <CalendarClock size={11} />
                      {goal.targetDate
                        ? prettyDate(goal.targetDate, { year: undefined })
                        : 'No deadline'}
                    </div>
                  </div>

                  <ProgressRing
                    value={clamp(goal.progress, 0, 100)}
                    size={56}
                    thickness={6}
                    color={done ? 'var(--mint)' : 'var(--violet)'}
                    color2={done ? 'var(--cyan)' : 'var(--cyan)'}
                  />
                </div>

                <div className="fs-row-between" style={{ alignItems: 'baseline' }}>
                  <strong className="fs-num" style={{ fontSize: 19, color: 'var(--text-1)' }}>
                    {money(goal.saved)}
                  </strong>
                  <span className="fs-num fs-xs fs-dim">of {money(goal.target)}</span>
                </div>

                <div className="fs-meter fs-mt-10">
                  <span
                    style={{
                      width: `${clamp(goal.progress, 0, 100)}%`,
                      '--meter-fill': done
                        ? 'linear-gradient(90deg,#34d399,#6ee7b7)'
                        : undefined,
                    }}
                  />
                </div>

                <div className="fs-row-between fs-mt-12">
                  <span
                    className={`fs-badge ${
                      goal.status === 'COMPLETED'
                        ? 'fs-badge-pos'
                        : goal.status === 'PAUSED'
                          ? 'fs-badge-warn'
                          : 'fs-badge-info'
                    }`}
                  >
                    {titleCase(goal.status)}
                  </span>

                  <span className="fs-xs fs-dim-2">
                    {days !== null
                      ? days >= 0
                        ? `${days} days left`
                        : `${Math.abs(days)} days overdue`
                      : '—'}
                  </span>
                </div>

                <div className="fs-row fs-gap-6 fs-mt-16">
                  <Button
                    size="sm"
                    icon={Coins}
                    onClick={() => {
                      setContributeTarget(goal);
                      setContribution('');
                    }}
                    disabled={goal.progress >= 100}
                    style={{ flex: 1 }}
                  >
                    Add funds
                  </Button>

                  <button
                    type="button"
                    className="fs-btn fs-btn-ghost fs-btn-icon"
                    style={{ width: 30, height: 30 }}
                    onClick={() => openEdit(goal)}
                    aria-label={`Edit ${goal.name}`}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    type="button"
                    className="fs-btn fs-btn-ghost fs-btn-icon"
                    style={{ width: 30, height: 30, color: 'var(--rose)' }}
                    onClick={() => setDeleteTarget(goal)}
                    aria-label={`Delete ${goal.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit savings goal' : 'Create a savings goal'}
        subtitle="Progress is measured against the target amount."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} icon={Plus} onClick={submitForm}>
              {editing ? 'Save changes' : 'Create goal'}
            </Button>
          </>
        }
      >
        <form className="fs-col fs-gap-16" onSubmit={submitForm}>
          <Field
            label="Goal name"
            placeholder="e.g. Emergency fund"
            value={form.name}
            error={errors.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />

          <div className="fs-grid fs-grid-2">
            <Field
              label="Target amount"
              type="number"
              min="1"
              step="1"
              prefix="₹"
              placeholder="100000"
              value={form.target}
              error={errors.target}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, target: event.target.value }))
              }
            />

            <Field
              label="Already saved"
              type="number"
              min="0"
              step="1"
              prefix="₹"
              placeholder="0"
              value={form.saved}
              error={errors.saved}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, saved: event.target.value }))
              }
            />
          </div>

          <div className="fs-grid fs-grid-2">
            <Field
              label="Target date"
              type="date"
              value={form.targetDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetDate: event.target.value }))
              }
            />

            <Field
              as="select"
              label="Status"
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value }))
              }
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Contribute */}
      <Modal
        open={Boolean(contributeTarget)}
        onClose={() => setContributeTarget(null)}
        title="Add funds to this goal"
        subtitle={
          contributeTarget
            ? `${contributeTarget.name} · ${money(contributeTarget.saved)} of ${money(contributeTarget.target)}`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setContributeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={contributing}
              icon={Coins}
              onClick={submitContribution}
            >
              Add funds
            </Button>
          </>
        }
      >
        <form className="fs-col fs-gap-16" onSubmit={submitContribution}>
          <Field
            label="Contribution"
            type="number"
            min="1"
            step="1"
            prefix="₹"
            placeholder="5000"
            value={contribution}
            autoFocus
            hint={
              contributeTarget
                ? `${money(contributeTarget.remaining)} still needed to complete this goal.`
                : ''
            }
            onChange={(event) => setContribution(event.target.value)}
          />

          <div className="fs-row fs-gap-8 fs-wrap">
            {[1000, 5000, 10000, 25000].map((amount) => (
              <button
                key={amount}
                type="button"
                className="fs-chip"
                onClick={() => setContribution(String(amount))}
              >
                +{money(amount)}
              </button>
            ))}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete this goal?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” and its ${money(deleteTarget.saved)} of recorded progress will be removed.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
