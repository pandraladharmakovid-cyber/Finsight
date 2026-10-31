import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';
import { ProgressRing } from '../components/charts/index.jsx';

import { api } from '../lib/api.js';
import { useResource, useToast } from '../lib/hooks.jsx';
import {
  asArray,
  clamp,
  dateInput,
  money,
  normaliseBudget,
  normaliseCategory,
  prettyDate,
  unwrap,
} from '../lib/format.js';

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return { start: dateInput(start), end: dateInput(end) };
}

export default function Budgets() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const budgetsRes = useResource(
    async () => {
      const [budgets, performance] = await Promise.all([
        api.budgets(),
        api.budgetPerformance(),
      ]);
      return { budgets, performance };
    },
    [],
  );

  const categoriesRes = useResource(() => api.categories(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    categoryId: '',
    amount: '',
    startDate: monthBounds().start,
    endDate: monthBounds().end,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categories = useMemo(
    () => asArray(unwrap(categoriesRes.data)).map(normaliseCategory),
    [categoriesRes.data],
  );

  const budgets = useMemo(() => {
    const payload = unwrap(budgetsRes.data) ?? {};
    const performance = asArray(payload.performance);

    return asArray(payload.budgets).map((row) =>
      normaliseBudget(row, performance),
    );
  }, [budgetsRes.data]);

  const totals = useMemo(() => {
    const allocated = budgets.reduce((total, budget) => total + budget.amount, 0);
    const spent = budgets.reduce((total, budget) => total + budget.spent, 0);
    const over = budgets.filter(
      (budget) => budget.amount > 0 && budget.spent > budget.amount,
    ).length;

    return {
      allocated,
      spent,
      remaining: allocated - spent,
      over,
      utilisation: allocated > 0 ? (spent / allocated) * 100 : 0,
    };
  }, [budgets]);

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
    setForm({
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      amount: '',
      startDate: monthBounds().start,
      endDate: monthBounds().end,
    });
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(budget) {
    setEditing(budget);
    setForm({
      categoryId: String(budget.categoryId ?? ''),
      amount: String(budget.amount),
      startDate: dateInput(budget.startDate),
      endDate: dateInput(budget.endDate),
    });
    setErrors({});
    setFormOpen(true);
  }

  async function submitForm(event) {
    event?.preventDefault();

    const next = {};

    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      next.amount = 'Budget amount must be greater than zero.';
    }

    if (!form.categoryId) next.categoryId = 'Choose a category.';

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = 'End date must be on or after the start date.';
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);

    const payload = {
      categoryId: Number(form.categoryId),
      budgetAmount: Number(form.amount),
      startDate: form.startDate,
      endDate: form.endDate,
    };

    try {
      if (editing) {
        await api.updateBudget(editing.id, payload);
        toast.success('Budget updated', 'Allocation saved.');
      } else {
        await api.createBudget(payload);
        toast.success('Budget created', `${money(payload.budgetAmount)} allocated.`);
      }

      setFormOpen(false);
      await budgetsRes.refresh();
    } catch (error) {
      toast.error('Could not save budget', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteBudget(deleteTarget.id);
      toast.success('Budget deleted', deleteTarget.categoryName);
      setDeleteTarget(null);
      await budgetsRes.refresh();
    } catch (error) {
      toast.error('Delete failed', error.message);
    } finally {
      setDeleting(false);
    }
  }

  const refreshAll = useCallback(async () => {
    await Promise.all([budgetsRes.refresh(), categoriesRes.refresh()]);
  }, [budgetsRes, categoriesRes]);

  if (budgetsRes.error) {
    return (
      <ErrorState
        error={budgetsRes.error}
        onRetry={refreshAll}
        title="Budgets could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Allocated"
          value={totals.allocated}
          icon={Target}
          tone="violet"
          footnote={`${budgets.length} active budgets`}
        />
        <StatCard
          label="Spent"
          value={totals.spent}
          icon={Wallet}
          tone="rose"
          delay={1}
          footnote={`${Math.round(totals.utilisation)}% utilised`}
        />
        <StatCard
          label="Remaining"
          value={totals.remaining}
          icon={TrendingUp}
          tone={totals.remaining < 0 ? 'amber' : 'mint'}
          delay={2}
          footnote="available to spend"
        />
        <StatCard
          label="Over budget"
          value={totals.over}
          icon={AlertTriangle}
          tone="amber"
          delay={3}
          format={(n) => Math.round(n).toString()}
          footnote="categories exceeding limit"
        />
      </section>

      <div className="fs-row-between fs-wrap">
        <div className="fs-col">
          <h2 style={{ fontSize: 15 }}>Budget allocations</h2>
          <p className="fs-xs fs-dim">
            Progress compares real transactions against each limit.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={openCreate}>
          New budget
        </Button>
      </div>

      {budgetsRes.loading ? (
        <div className="fs-grid fs-grid-3">
          {[0, 1, 2].map((index) => (
            <CardSkeleton key={index} rows={4} />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No budgets yet"
            message="Set a category limit and FinSight will track spending against it automatically."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                Create your first budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="fs-grid fs-grid-3">
          {budgets.map((budget, index) => {
            const raw = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const used = clamp(raw, 0, 100);
            const over = raw > 100;
            const warn = raw > 85 && !over;

            return (
              <article
                key={budget.id}
                className="fs-card fs-card-pad is-interactive fs-reveal"
                style={{ '--i': index }}
              >
                <div className="fs-row-between fs-mb-16">
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="fs-sm fs-truncate"
                      style={{ color: 'var(--text-1)', fontWeight: 620 }}
                    >
                      {budget.categoryName}
                    </div>
                    <div className="fs-xs fs-dim-2">
                      {prettyDate(budget.startDate, { year: undefined })} →{' '}
                      {prettyDate(budget.endDate, { year: undefined })}
                    </div>
                  </div>

                  <ProgressRing
                    value={used}
                    size={56}
                    thickness={6}
                    color={over ? 'var(--rose)' : warn ? 'var(--amber)' : 'var(--violet)'}
                    color2={over ? 'var(--amber)' : 'var(--cyan)'}
                  />
                </div>

                <div className="fs-row-between" style={{ alignItems: 'baseline' }}>
                  <span className="fs-xs fs-dim">Spent</span>
                  <strong className="fs-num" style={{ fontSize: 19, color: 'var(--text-1)' }}>
                    {money(budget.spent)}
                  </strong>
                </div>

                <div className="fs-row-between fs-mt-4">
                  <span className="fs-xs fs-dim">Limit</span>
                  <span className="fs-num fs-sm fs-dim">{money(budget.amount)}</span>
                </div>

                <div className="fs-meter fs-mt-12">
                  <span
                    style={{
                      width: `${used}%`,
                      '--meter-fill': over
                        ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
                        : warn
                          ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                          : undefined,
                    }}
                  />
                </div>

                <div className="fs-row-between fs-mt-12">
                  <span
                    className={`fs-badge ${
                      over ? 'fs-badge-neg' : warn ? 'fs-badge-warn' : 'fs-badge-pos'
                    }`}
                  >
                    {over
                      ? `${Math.round(raw - 100)}% over`
                      : `${money(Math.max(budget.amount - budget.spent, 0))} left`}
                  </span>

                  <div className="fs-row fs-gap-4">
                    <button
                      type="button"
                      className="fs-btn fs-btn-ghost fs-btn-icon"
                      style={{ width: 30, height: 30 }}
                      onClick={() => openEdit(budget)}
                      aria-label={`Edit budget for ${budget.categoryName}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="fs-btn fs-btn-ghost fs-btn-icon"
                      style={{ width: 30, height: 30, color: 'var(--rose)' }}
                      onClick={() => setDeleteTarget(budget)}
                      aria-label={`Delete budget for ${budget.categoryName}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit budget' : 'Create a budget'}
        subtitle="Spending is measured from transactions inside the date window."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} icon={Plus} onClick={submitForm}>
              {editing ? 'Save changes' : 'Create budget'}
            </Button>
          </>
        }
      >
        <form className="fs-col fs-gap-16" onSubmit={submitForm}>
          <Field
            as="select"
            label="Category"
            value={form.categoryId}
            error={errors.categoryId}
            disabled={Boolean(editing)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, categoryId: event.target.value }))
            }
            options={[
              { value: '', label: 'Select category…' },
              ...categories.map((category) => ({
                value: String(category.id),
                label: category.name,
              })),
            ]}
          />

          <Field
            label="Budget amount"
            type="number"
            min="1"
            step="1"
            prefix="₹"
            placeholder="0"
            value={form.amount}
            error={errors.amount}
            icon={CalendarDays}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, amount: event.target.value }))
            }
          />

          <div className="fs-grid fs-grid-2">
            <Field
              label="Start date"
              type="date"
              value={form.startDate}
              error={errors.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />

            <Field
              label="End date"
              type="date"
              value={form.endDate}
              error={errors.endDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, endDate: event.target.value }))
              }
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete this budget?"
        message={
          deleteTarget
            ? `The budget for “${deleteTarget.categoryName}” will be removed. Transactions stay untouched.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
