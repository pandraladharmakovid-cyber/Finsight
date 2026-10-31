import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';

import { api } from '../lib/api.js';
import { useResource, useToast } from '../lib/hooks.jsx';
import {
  asArray,
  daysUntil,
  dateInput,
  money,
  monthlyEquivalent,
  normaliseAccount,
  normaliseCategory,
  normaliseRecurring,
  prettyDate,
  titleCase,
  unwrap,
} from '../lib/format.js';

const emptyForm = {
  description: '',
  amount: '',
  type: 'EXPENSE',
  frequency: 'MONTHLY',
  accountId: '',
  categoryId: '',
  startDate: dateInput(new Date()),
  nextRunDate: dateInput(new Date()),
  active: true,
};

export default function Recurring() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const recurringRes = useResource(() => api.recurring(), []);
  const accountsRes = useResource(() => api.accounts(), []);
  const categoriesRes = useResource(() => api.categories(), []);
  const metaRes = useResource(() => api.meta(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const frequencies =
    unwrap(metaRes.data)?.frequencies ?? ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

  const accounts = useMemo(
    () => asArray(unwrap(accountsRes.data)).map(normaliseAccount),
    [accountsRes.data],
  );

  const categories = useMemo(
    () => asArray(unwrap(categoriesRes.data)).map(normaliseCategory),
    [categoriesRes.data],
  );

  const entries = useMemo(
    () => asArray(unwrap(recurringRes.data)).map(normaliseRecurring),
    [recurringRes.data],
  );

  const visible = useMemo(
    () =>
      filter === 'ALL'
        ? entries
        : filter === 'ACTIVE'
          ? entries.filter((entry) => entry.active)
          : entries.filter((entry) => !entry.active),
    [entries, filter],
  );

  const totals = useMemo(() => {
    const active = entries.filter((entry) => entry.active);
    const expense = active
      .filter((entry) => entry.type === 'EXPENSE')
      .reduce(
        (total, entry) => total + monthlyEquivalent(entry.amount, entry.frequency),
        0,
      );
    const income = active
      .filter((entry) => entry.type === 'INCOME')
      .reduce(
        (total, entry) => total + monthlyEquivalent(entry.amount, entry.frequency),
        0,
      );

    return { expense, income, net: income - expense, active: active.length, count: entries.length };
  }, [entries]);

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
      ...emptyForm,
      accountId: accounts[0]?.id ? String(accounts[0].id) : '',
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
    });
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(entry) {
    setEditing(entry);
    setForm({
      description: entry.description,
      amount: String(entry.amount),
      type: entry.type,
      frequency: entry.frequency,
      accountId: String(entry.accountId ?? ''),
      categoryId: String(entry.categoryId ?? ''),
      startDate: String(entry.startDate ?? '').slice(0, 10),
      nextRunDate: String(entry.nextRunDate ?? '').slice(0, 10),
      active: entry.active,
    });
    setErrors({});
    setFormOpen(true);
  }

  async function submitForm(event) {
    event?.preventDefault();

    const next = {};

    if (!form.description.trim()) next.description = 'Describe this commitment.';

    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      next.amount = 'Amount must be greater than zero.';
    }

    if (!form.accountId) next.accountId = 'Choose an account.';

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);

    const body = {
      description: form.description.trim(),
      amount,
      transactionType: form.type,
      frequency: form.frequency,
      accountId: Number(form.accountId),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      startDate: form.startDate,
      nextRunDate: form.nextRunDate || form.startDate,
      isActive: form.active,
    };

    try {
      if (editing) {
        await api.updateRecurring(editing.id, body);
        toast.success('Schedule updated', body.description);
      } else {
        await api.createRecurring(body);
        toast.success('Schedule created', `${body.description} will repeat ${body.frequency.toLowerCase()}.`);
      }

      setFormOpen(false);
      await recurringRes.refresh();
    } catch (error) {
      toast.error('Could not save schedule', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(entry) {
    try {
      await api.updateRecurring(entry.id, {
        description: entry.description,
        amount: entry.amount,
        transactionType: entry.type,
        frequency: entry.frequency,
        accountId: entry.accountId,
        categoryId: entry.categoryId,
        startDate: String(entry.startDate ?? '').slice(0, 10),
        nextRunDate: String(entry.nextRunDate ?? '').slice(0, 10),
        isActive: !entry.active,
      });

      toast.success(entry.active ? 'Schedule paused' : 'Schedule resumed', entry.description);
      await recurringRes.refresh();
    } catch (error) {
      toast.error('Update failed', error.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteRecurring(deleteTarget.id);
      toast.success('Schedule deleted', deleteTarget.description);
      setDeleteTarget(null);
      await recurringRes.refresh();
    } catch (error) {
      toast.error('Delete failed', error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (recurringRes.error) {
    return (
      <ErrorState
        error={recurringRes.error}
        onRetry={recurringRes.reload}
        title="Recurring schedules could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Monthly outflow"
          value={totals.expense}
          icon={TrendingDown}
          tone="rose"
          footnote="normalised to 30 days"
        />
        <StatCard
          label="Monthly inflow"
          value={totals.income}
          icon={TrendingUp}
          tone="mint"
          delay={1}
          footnote="recurring income"
        />
        <StatCard
          label="Net recurring"
          value={totals.net}
          icon={Repeat2}
          tone={totals.net >= 0 ? 'cyan' : 'amber'}
          delay={2}
          footnote="inflow − outflow"
        />
        <StatCard
          label="Active schedules"
          value={totals.active}
          icon={CalendarClock}
          tone="violet"
          delay={3}
          format={(n) => Math.round(n).toString()}
          footnote={`of ${totals.count} total`}
        />
      </section>

      <div className="fs-row-between fs-wrap">
        <div className="fs-tabs">
          {['ALL', 'ACTIVE', 'PAUSED'].map((option) => (
            <button
              key={option}
              type="button"
              className={`fs-tab ${filter === option ? 'is-on' : ''}`}
              onClick={() => setFilter(option)}
            >
              {titleCase(option)}
            </button>
          ))}
        </div>

        <Button variant="primary" icon={Plus} onClick={openCreate}>
          New schedule
        </Button>
      </div>

      {recurringRes.loading ? (
        <CardSkeleton rows={6} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Repeat2}
            title="No recurring schedules"
            message="Track subscriptions, rent and salary so nothing sneaks up on you."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                Add a schedule
              </Button>
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="fs-table-wrap">
            <table className="fs-table">
              <thead>
                <tr>
                  <th>Commitment</th>
                  <th>Frequency</th>
                  <th>Next run</th>
                  <th className="fs-right">Amount</th>
                  <th className="fs-right">Monthly</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {visible.map((entry) => {
                  const days = daysUntil(entry.nextRunDate);

                  return (
                    <tr key={entry.id} style={{ opacity: entry.active ? 1 : 0.55 }}>
                      <td>
                        <div className="fs-row fs-gap-10">
                          <span
                            className="fs-avatar fs-avatar-soft"
                            style={{
                              width: 30,
                              height: 30,
                              flex: '0 0 30px',
                              borderRadius: 9,
                              color:
                                entry.type === 'INCOME'
                                  ? 'var(--mint)'
                                  : 'var(--cyan-soft)',
                            }}
                          >
                            <Repeat2 size={13} />
                          </span>

                          <div style={{ minWidth: 0 }}>
                            <div
                              className="fs-truncate"
                              style={{ color: 'var(--text-1)', fontWeight: 550 }}
                            >
                              {entry.description}
                            </div>
                            <div className="fs-xs fs-dim-2">
                              {entry.active ? 'Active' : 'Paused'} ·{' '}
                              {titleCase(entry.type)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="fs-badge fs-badge-brand">
                          {titleCase(entry.frequency)}
                        </span>
                      </td>

                      <td className="fs-dim fs-nowrap">
                        {prettyDate(entry.nextRunDate, { year: undefined })}
                        {days !== null && (
                          <span className="fs-xs fs-dim-2"> · {days >= 0 ? `${days}d` : 'due'}</span>
                        )}
                      </td>

                      <td
                        className="is-amount"
                        style={{
                          color:
                            entry.type === 'INCOME' ? 'var(--mint)' : 'var(--text-1)',
                        }}
                      >
                        {entry.type === 'INCOME' ? '+' : '−'}
                        {money(entry.amount)}
                      </td>

                      <td className="is-amount fs-dim">
                        {money(monthlyEquivalent(entry.amount, entry.frequency))}
                      </td>

                      <td>
                        <div className="fs-row-actions">
                          <button
                            type="button"
                            className="fs-btn fs-btn-ghost fs-btn-icon"
                            style={{ width: 30, height: 30 }}
                            onClick={() => toggleActive(entry)}
                            aria-label={entry.active ? 'Pause' : 'Resume'}
                          >
                            {entry.active ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                          <button
                            type="button"
                            className="fs-btn fs-btn-ghost fs-btn-icon"
                            style={{ width: 30, height: 30 }}
                            onClick={() => openEdit(entry)}
                            aria-label={`Edit ${entry.description}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="fs-btn fs-btn-ghost fs-btn-icon"
                            style={{ width: 30, height: 30, color: 'var(--rose)' }}
                            onClick={() => setDeleteTarget(entry)}
                            aria-label={`Delete ${entry.description}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit schedule' : 'New recurring schedule'}
        subtitle="Schedules describe repeating commitments — they do not move money on their own."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} icon={Plus} onClick={submitForm}>
              {editing ? 'Save changes' : 'Create schedule'}
            </Button>
          </>
        }
      >
        <form className="fs-col fs-gap-16" onSubmit={submitForm}>
          <div className="fs-row fs-gap-8">
            {['EXPENSE', 'INCOME'].map((type) => (
              <button
                key={type}
                type="button"
                className={`fs-chip ${form.type === type ? 'is-on' : ''}`}
                style={{ flex: 1, justifyContent: 'center', height: 40 }}
                onClick={() => setForm((prev) => ({ ...prev, type }))}
              >
                {titleCase(type)}
              </button>
            ))}
          </div>

          <Field
            label="Description"
            placeholder="e.g. Netflix subscription"
            value={form.description}
            error={errors.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />

          <div className="fs-grid fs-grid-2">
            <Field
              label="Amount"
              type="number"
              min="1"
              step="0.01"
              prefix="₹"
              placeholder="499"
              value={form.amount}
              error={errors.amount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, amount: event.target.value }))
              }
            />

            <Field
              as="select"
              label="Frequency"
              value={form.frequency}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, frequency: event.target.value }))
              }
              options={frequencies.map((frequency) => ({
                value: frequency,
                label: titleCase(frequency),
              }))}
            />
          </div>

          <div className="fs-grid fs-grid-2">
            <Field
              as="select"
              label="Account"
              value={form.accountId}
              error={errors.accountId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, accountId: event.target.value }))
              }
              options={[
                { value: '', label: 'Select account…' },
                ...accounts.map((account) => ({
                  value: String(account.id),
                  label: account.name,
                })),
              ]}
            />

            <Field
              as="select"
              label="Category"
              value={form.categoryId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
              options={[
                { value: '', label: 'No category' },
                ...categories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                })),
              ]}
            />
          </div>

          <div className="fs-grid fs-grid-2">
            <Field
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />

            <Field
              label="Next run"
              type="date"
              value={form.nextRunDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nextRunDate: event.target.value }))
              }
            />
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-stroke)',
            }}
          >
            <div className="fs-row-between">
              <div>
                <div className="fs-sm" style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                  Schedule active
                </div>
                <div className="fs-xs fs-dim">
                  Paused schedules stay visible but are excluded from totals.
                </div>
              </div>
              <button
                type="button"
                className={`fs-switch ${form.active ? 'is-on' : ''}`}
                role="switch"
                aria-checked={form.active}
                aria-label="Schedule active"
                onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
              />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete this schedule?"
        message={
          deleteTarget
            ? `“${deleteTarget.description}” will stop being tracked as a recurring commitment.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
