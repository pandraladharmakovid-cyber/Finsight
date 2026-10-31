import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Landmark,
  Pencil,
  Percent,
  Plus,
  Trash2,
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
  daysUntil,
  money,
  normaliseDebt,
  prettyDate,
  titleCase,
  unwrap,
} from '../lib/format.js';

const emptyForm = {
  name: '',
  lender: '',
  principal: '',
  remaining: '',
  interestRate: '',
  minimumPayment: '',
  dueDate: '',
  status: 'ACTIVE',
};

export default function Debts() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const debtsRes = useResource(() => api.debts(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [payTarget, setPayTarget] = useState(null);
  const [payment, setPayment] = useState('');
  const [paying, setPaying] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');

  const debts = useMemo(
    () => asArray(unwrap(debtsRes.data)).map(normaliseDebt),
    [debtsRes.data],
  );

  const visible = useMemo(
    () =>
      statusFilter === 'ALL'
        ? debts
        : debts.filter((debt) => debt.status === statusFilter),
    [debts, statusFilter],
  );

  const totals = useMemo(() => {
    const active = debts.filter((debt) => debt.status !== 'PAID');
    const outstanding = active.reduce((total, debt) => total + debt.remaining, 0);
    const principal = debts.reduce((total, debt) => total + debt.principal, 0);
    const repaid = debts.reduce((total, debt) => total + debt.repaid, 0);
    const monthly = active.reduce(
      (total, debt) => total + debt.minimumPayment,
      0,
    );
    const weightedRate =
      outstanding > 0
        ? active.reduce(
            (total, debt) => total + debt.interestRate * debt.remaining,
            0,
          ) / outstanding
        : 0;

    return {
      outstanding,
      principal,
      repaid,
      monthly,
      weightedRate,
      active: active.length,
      progress: principal > 0 ? (repaid / principal) * 100 : 0,
    };
  }, [debts]);

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

  function openEdit(debt) {
    setEditing(debt);
    setForm({
      name: debt.name,
      lender: debt.lender === '—' ? '' : debt.lender,
      principal: String(debt.principal),
      remaining: String(debt.remaining),
      interestRate: String(debt.interestRate),
      minimumPayment: String(debt.minimumPayment),
      dueDate: debt.dueDate ? String(debt.dueDate).slice(0, 10) : '',
      status: debt.status,
    });
    setErrors({});
    setFormOpen(true);
  }

  async function submitForm(event) {
    event?.preventDefault();

    const next = {};

    if (!form.name.trim()) next.name = 'Give this debt a name.';

    const principal = Number(form.principal);
    if (!form.principal || !Number.isFinite(principal) || principal <= 0) {
      next.principal = 'Principal must be greater than zero.';
    }

    const remaining = form.remaining === '' ? principal : Number(form.remaining);
    if (!Number.isFinite(remaining) || remaining < 0) {
      next.remaining = 'Remaining amount cannot be negative.';
    } else if (!next.principal && remaining > principal) {
      next.remaining = 'Remaining cannot exceed the principal amount.';
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);

    const body = {
      debtName: form.name.trim(),
      lender: form.lender.trim() || 'Unknown Lender',
      principalAmount: principal,
      remainingAmount: remaining,
      interestRate: Number(form.interestRate) || 0,
      minimumPayment: Number(form.minimumPayment) || 0,
      dueDate: form.dueDate || null,
      debtStatus: form.status,
    };

    try {
      if (editing) {
        await api.updateDebt(editing.id, body);
        toast.success('Debt updated', body.debtName);
      } else {
        await api.createDebt(body);
        toast.success('Debt tracked', `${body.debtName} added.`);
      }

      setFormOpen(false);
      await debtsRes.refresh();
    } catch (error) {
      toast.error('Could not save debt', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitPayment(event) {
    event?.preventDefault();

    const amount = Number(payment);

    if (!payment || !Number.isFinite(amount) || amount <= 0) {
      toast.warn('Invalid amount', 'Enter a payment greater than zero.');
      return;
    }

    setPaying(true);

    const nextRemaining = Math.max(payTarget.remaining - amount, 0);

    try {
      await api.updateDebt(payTarget.id, {
        debtName: payTarget.name,
        lender: payTarget.lender === '—' ? 'Unknown Lender' : payTarget.lender,
        principalAmount: payTarget.principal,
        remainingAmount: nextRemaining,
        interestRate: payTarget.interestRate,
        minimumPayment: payTarget.minimumPayment,
        dueDate: payTarget.dueDate,
        debtStatus: nextRemaining === 0 ? 'PAID' : payTarget.status,
      });

      toast.success(
        nextRemaining === 0 ? 'Debt cleared' : 'Payment recorded',
        nextRemaining === 0
          ? `${payTarget.name} is fully paid off.`
          : `${money(amount)} paid toward ${payTarget.name}.`,
      );

      setPayTarget(null);
      setPayment('');
      await debtsRes.refresh();
    } catch (error) {
      toast.error('Payment failed', error.message);
    } finally {
      setPaying(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteDebt(deleteTarget.id);
      toast.success('Debt removed', deleteTarget.name);
      setDeleteTarget(null);
      await debtsRes.refresh();
    } catch (error) {
      toast.error('Delete failed', error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (debtsRes.error) {
    return (
      <ErrorState
        error={debtsRes.error}
        onRetry={debtsRes.reload}
        title="Debts could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Outstanding"
          value={totals.outstanding}
          icon={CreditCard}
          tone="rose"
          footnote={`${totals.active} active debts`}
        />
        <StatCard
          label="Repaid so far"
          value={totals.repaid}
          icon={CheckCircle2}
          tone="mint"
          delay={1}
          footnote="principal returned"
        />
        <StatCard
          label="Monthly minimum"
          value={totals.monthly}
          icon={Wallet}
          tone="amber"
          delay={2}
          footnote="total required per month"
        />
        <StatCard
          label="Avg. interest"
          value={totals.weightedRate}
          icon={Percent}
          tone="violet"
          delay={3}
          format={(n) => `${n.toFixed(1)}%`}
          footnote="weighted by balance"
        />
      </section>

      <Card glow className="fs-reveal">
        <div className="fs-row fs-gap-24 fs-wrap" style={{ alignItems: 'center' }}>
          <ProgressRing
            value={totals.progress}
            size={112}
            thickness={10}
            color="var(--mint)"
            color2="var(--cyan)"
            label="Repaid"
          />

          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="fs-eyebrow">Liability reduction</div>
            <h3 style={{ fontSize: 20, marginTop: 4 }}>
              {money(totals.repaid)} of {money(totals.principal)} repaid
            </h3>
            <p className="fs-sm fs-dim fs-mt-4">
              {totals.outstanding > 0
                ? `${money(totals.outstanding)} still outstanding across your debts.`
                : 'Every debt is cleared. Your balance sheet is clean.'}
            </p>

            <div className="fs-row fs-gap-8 fs-mt-16">
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                Track a debt
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="fs-row-between fs-wrap">
        <div className="fs-tabs">
          {['ALL', 'ACTIVE', 'OVERDUE', 'PAID'].map((option) => (
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

      {debtsRes.loading ? (
        <div className="fs-grid fs-grid-3">
          {[0, 1, 2].map((index) => (
            <CardSkeleton key={index} rows={4} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="No debts in this view"
            message="Track a loan or credit card to see payoff progress here."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                Track a debt
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="fs-grid fs-grid-3">
          {visible.map((debt, index) => {
            const days = daysUntil(debt.dueDate);
            const overdue = days !== null && days < 0 && debt.status !== 'PAID';

            return (
              <article
                key={debt.id}
                className="fs-card fs-card-pad is-interactive fs-reveal"
                style={{ '--i': index }}
              >
                <div className="fs-row-between fs-mb-16">
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="fs-sm fs-truncate"
                      style={{ color: 'var(--text-1)', fontWeight: 620 }}
                    >
                      {debt.name}
                    </div>
                    <div className="fs-xs fs-dim-2 fs-row fs-gap-4">
                      <Landmark size={11} />
                      {debt.lender}
                    </div>
                  </div>

                  <ProgressRing
                    value={clamp(debt.progress, 0, 100)}
                    size={56}
                    thickness={6}
                    color="var(--rose)"
                    color2="var(--amber)"
                  />
                </div>

                <div className="fs-row-between" style={{ alignItems: 'baseline' }}>
                  <strong className="fs-num" style={{ fontSize: 19, color: 'var(--rose)' }}>
                    {money(debt.remaining)}
                  </strong>
                  <span className="fs-num fs-xs fs-dim">of {money(debt.principal)}</span>
                </div>

                <div className="fs-meter fs-mt-10">
                  <span
                    style={{
                      width: `${clamp(debt.progress, 0, 100)}%`,
                      '--meter-fill': 'linear-gradient(90deg,#f43f5e,#fbbf24)',
                    }}
                  />
                </div>

                <div className="fs-row-between fs-mt-12 fs-xs fs-dim">
                  <span>{debt.interestRate}% APR</span>
                  <span>min {money(debt.minimumPayment)}</span>
                </div>

                <div className="fs-row-between fs-mt-10">
                  <span
                    className={`fs-badge ${
                      debt.status === 'PAID'
                        ? 'fs-badge-pos'
                        : overdue
                          ? 'fs-badge-neg'
                          : 'fs-badge-info'
                    }`}
                  >
                    {overdue ? 'Overdue' : titleCase(debt.status)}
                  </span>

                  <span className="fs-xs fs-dim-2">
                    {debt.dueDate
                      ? days !== null && days >= 0
                        ? `due in ${days}d`
                        : prettyDate(debt.dueDate, { year: undefined })
                      : 'No due date'}
                  </span>
                </div>

                {overdue && (
                  <div
                    className="fs-row fs-gap-6 fs-mt-10"
                    style={{ color: 'var(--amber)', fontSize: 11.5 }}
                  >
                    <AlertTriangle size={12} />
                    Past due — consider a payment.
                  </div>
                )}

                <div className="fs-row fs-gap-6 fs-mt-16">
                  <Button
                    size="sm"
                    icon={Wallet}
                    style={{ flex: 1 }}
                    disabled={debt.remaining <= 0}
                    onClick={() => {
                      setPayTarget(debt);
                      setPayment(String(debt.minimumPayment || ''));
                    }}
                  >
                    Log payment
                  </Button>

                  <button
                    type="button"
                    className="fs-btn fs-btn-ghost fs-btn-icon"
                    style={{ width: 30, height: 30 }}
                    onClick={() => openEdit(debt)}
                    aria-label={`Edit ${debt.name}`}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    type="button"
                    className="fs-btn fs-btn-ghost fs-btn-icon"
                    style={{ width: 30, height: 30, color: 'var(--rose)' }}
                    onClick={() => setDeleteTarget(debt)}
                    aria-label={`Delete ${debt.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit debt' : 'Track a debt'}
        subtitle="Remaining balance can never exceed the principal."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} icon={Plus} onClick={submitForm}>
              {editing ? 'Save changes' : 'Add debt'}
            </Button>
          </>
        }
      >
        <form className="fs-col fs-gap-16" onSubmit={submitForm}>
          <div className="fs-grid fs-grid-2">
            <Field
              label="Debt name"
              placeholder="e.g. Car loan"
              value={form.name}
              error={errors.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />

            <Field
              label="Lender"
              placeholder="e.g. ICICI Bank"
              value={form.lender}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lender: event.target.value }))
              }
            />
          </div>

          <div className="fs-grid fs-grid-2">
            <Field
              label="Principal amount"
              type="number"
              min="1"
              prefix="₹"
              placeholder="200000"
              value={form.principal}
              error={errors.principal}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, principal: event.target.value }))
              }
            />

            <Field
              label="Remaining balance"
              type="number"
              min="0"
              prefix="₹"
              placeholder="200000"
              value={form.remaining}
              error={errors.remaining}
              hint="Leave blank to start at the full principal."
              onChange={(event) =>
                setForm((prev) => ({ ...prev, remaining: event.target.value }))
              }
            />
          </div>

          <div className="fs-grid fs-grid-2">
            <Field
              label="Interest rate (APR %) "
              type="number"
              min="0"
              step="0.01"
              placeholder="11.5"
              value={form.interestRate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, interestRate: event.target.value }))
              }
            />

            <Field
              label="Minimum payment"
              type="number"
              min="0"
              step="1"
              prefix="₹"
              placeholder="5000"
              value={form.minimumPayment}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, minimumPayment: event.target.value }))
              }
            />
          </div>

          <div className="fs-grid fs-grid-2">
            <Field
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dueDate: event.target.value }))
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
                { value: 'OVERDUE', label: 'Overdue' },
                { value: 'PAID', label: 'Paid' },
              ]}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title="Log a debt payment"
        subtitle={
          payTarget
            ? `${payTarget.name} · ${money(payTarget.remaining)} outstanding`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" loading={paying} icon={Wallet} onClick={submitPayment}>
              Record payment
            </Button>
          </>
        }
      >
        <form className="fs-col fs-gap-16" onSubmit={submitPayment}>
          <Field
            label="Payment amount"
            type="number"
            min="1"
            step="1"
            prefix="₹"
            placeholder="5000"
            value={payment}
            autoFocus
            hint={
              payTarget
                ? `Paying the full ${money(payTarget.remaining)} marks this debt as paid.`
                : ''
            }
            onChange={(event) => setPayment(event.target.value)}
          />

          {payTarget && (
            <div className="fs-row fs-gap-8 fs-wrap">
              {[
                payTarget.minimumPayment,
                Math.round(payTarget.remaining / 2),
                payTarget.remaining,
              ]
                .filter((amount) => amount > 0)
                .map((amount, index) => (
                  <button
                    key={index}
                    type="button"
                    className="fs-chip"
                    onClick={() => setPayment(String(amount))}
                  >
                    {index === 2 ? 'Pay in full' : money(amount)}
                  </button>
                ))}
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete this debt?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed from your liabilities.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
