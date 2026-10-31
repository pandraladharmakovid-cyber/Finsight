import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Banknote,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Field, { Switch } from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';

import { api } from '../lib/api.js';
import { useResource, useToast } from '../lib/hooks.jsx';
import {
  asArray,
  money,
  normaliseAccount,
  titleCase,
  unwrap,
} from '../lib/format.js';

const TYPE_ICONS = {
  BANK: Landmark,
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  WALLET: Smartphone,
  INVESTMENT: TrendingUp,
};

const emptyForm = {
  name: '',
  type: 'BANK',
  balance: '',
  currency: 'INR',
  active: true,
};

export default function Accounts() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const accountsRes = useResource(() => api.accounts(), []);
  const metaRes = useResource(() => api.meta(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const accountTypes =
    unwrap(metaRes.data)?.accountTypes ??
    ['BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'INVESTMENT'];

  const accounts = useMemo(
    () => asArray(unwrap(accountsRes.data)).map(normaliseAccount),
    [accountsRes.data],
  );

  const visible = useMemo(
    () =>
      filter === 'ALL'
        ? accounts
        : filter === 'ACTIVE'
          ? accounts.filter((account) => account.active)
          : accounts.filter((account) => !account.active),
    [accounts, filter],
  );

  const totals = useMemo(() => {
    const liquid = accounts
      .filter((account) => account.active && account.type !== 'CREDIT_CARD')
      .reduce((total, account) => total + account.balance, 0);

    const credit = accounts
      .filter((account) => account.type === 'CREDIT_CARD')
      .reduce((total, account) => total + account.balance, 0);

    return {
      liquid,
      credit,
      net: accounts.reduce((total, account) => total + account.balance, 0),
      count: accounts.length,
    };
  }, [accounts]);

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

  function openEdit(account) {
    setEditing(account);
    setForm({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      currency: account.currency,
      active: account.active,
    });
    setErrors({});
    setFormOpen(true);
  }

  async function submitForm(event) {
    event?.preventDefault();

    const next = {};

    if (!form.name.trim()) next.name = 'Give this account a name.';

    const balance = Number(form.balance);
    if (form.balance !== '' && !Number.isFinite(balance)) {
      next.balance = 'Balance must be a number.';
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);

    const payload = {
      accountName: form.name.trim(),
      accountType: form.type,
      balance: form.balance === '' ? 0 : Number(form.balance),
      currency: form.currency || 'INR',
      isActive: form.active,
    };

    try {
      if (editing) {
        await api.updateAccount(editing.id, payload);
        toast.success('Account updated', `${payload.accountName} saved.`);
      } else {
        await api.createAccount(payload);
        toast.success('Account created', `${payload.accountName} is ready.`);
      }

      setFormOpen(false);
      await accountsRes.refresh();
    } catch (error) {
      toast.error('Could not save account', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(account) {
    try {
      await api.updateAccount(account.id, {
        accountName: account.name,
        accountType: account.type,
        balance: account.balance,
        isActive: !account.active,
      });

      toast.success(
        account.active ? 'Account deactivated' : 'Account reactivated',
        account.name,
      );

      await accountsRes.refresh();
    } catch (error) {
      toast.error('Update failed', error.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteAccount(deleteTarget.id);
      toast.success('Account deleted', deleteTarget.name);
      setDeleteTarget(null);
      await accountsRes.refresh();
    } catch (error) {
      toast.error(
        'Delete failed',
        `${error.message} — accounts with transactions cannot be removed.`,
      );
    } finally {
      setDeleting(false);
    }
  }

  if (accountsRes.error) {
    return (
      <ErrorState
        error={accountsRes.error}
        onRetry={accountsRes.reload}
        title="Accounts could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Liquid assets"
          value={totals.liquid}
          icon={Wallet}
          tone="cyan"
          footnote="bank · cash · wallet"
        />
        <StatCard
          label="Credit balance"
          value={totals.credit}
          icon={CreditCard}
          tone="rose"
          delay={1}
          footnote="card accounts"
        />
        <StatCard
          label="Combined"
          value={totals.net}
          icon={Landmark}
          tone="violet"
          delay={2}
          footnote="all accounts"
        />
        <StatCard
          label="Accounts"
          value={totals.count}
          icon={Banknote}
          tone="mint"
          delay={3}
          format={(n) => Math.round(n).toString()}
          footnote={`${accounts.filter((a) => a.active).length} active`}
        />
      </section>

      <div className="fs-row-between fs-wrap">
        <div className="fs-tabs">
          {['ALL', 'ACTIVE', 'INACTIVE'].map((option) => (
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
          Add account
        </Button>
      </div>

      {accountsRes.loading ? (
        <div className="fs-grid fs-grid-3">
          {[0, 1, 2].map((index) => (
            <CardSkeleton key={index} rows={4} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Landmark}
            title="No accounts in this view"
            message="Add a bank account, wallet or credit card to start tracking balances."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                Add account
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="fs-grid fs-grid-3">
          {visible.map((account, index) => {
            const Icon = TYPE_ICONS[account.type] ?? Landmark;
            const negative = account.balance < 0;

            return (
              <article
                key={account.id}
                className="fs-card fs-card-pad is-interactive fs-reveal"
                style={{ '--i': index }}
              >
                <div className="fs-row-between fs-mb-16">
                  <div className="fs-row fs-gap-10">
                    <span
                      className="fs-stat-icon"
                      style={{
                        '--icon-color': negative ? 'var(--rose)' : 'var(--cyan-soft)',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <Icon size={18} />
                    </span>

                    <div>
                      <div className="fs-sm" style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                        {account.name}
                      </div>
                      <div className="fs-xs fs-dim-2">
                        {titleCase(account.type)} · {account.currency}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`fs-switch ${account.active ? 'is-on' : ''}`}
                    style={{ transform: 'scale(0.82)' }}
                    onClick={() => toggleActive(account)}
                    aria-label={`${account.active ? 'Deactivate' : 'Activate'} ${account.name}`}
                    aria-checked={account.active}
                    role="switch"
                  />
                </div>

                <div
                  className="fs-num"
                  style={{
                    fontSize: 26,
                    fontWeight: 720,
                    letterSpacing: '-0.03em',
                    color: negative ? 'var(--rose)' : 'var(--text-1)',
                  }}
                >
                  {money(account.balance, { precise: true })}
                </div>

                <div className="fs-row-between fs-mt-16">
                  <span
                    className={`fs-badge ${account.active ? 'fs-badge-pos' : 'fs-badge-neutral'}`}
                  >
                    {account.active ? 'Active' : 'Inactive'}
                  </span>

                  <div className="fs-row fs-gap-6">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Pencil}
                      onClick={() => openEdit(account)}
                    >
                      Edit
                    </Button>
                    <button
                      type="button"
                      className="fs-btn fs-btn-ghost fs-btn-icon"
                      style={{ width: 30, height: 30, color: 'var(--rose)' }}
                      onClick={() => setDeleteTarget(account)}
                      aria-label={`Delete ${account.name}`}
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
        title={editing ? 'Edit account' : 'Add an account'}
        subtitle="Account types map directly to the database constraint."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={submitForm} icon={Plus}>
              {editing ? 'Save changes' : 'Create account'}
            </Button>
          </>
        }
      >
        <form className="fs-col fs-gap-16" onSubmit={submitForm}>
          <Field
            label="Account name"
            placeholder="e.g. HDFC Savings"
            value={form.name}
            error={errors.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />

          <div className="fs-grid fs-grid-2">
            <Field
              as="select"
              label="Account type"
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value }))
              }
              options={accountTypes.map((type) => ({
                value: type,
                label: titleCase(type),
              }))}
            />

            <Field
              label="Opening balance"
              type="number"
              step="0.01"
              prefix="₹"
              placeholder="0.00"
              value={form.balance}
              error={errors.balance}
              hint="Negative values are allowed for credit cards."
              onChange={(event) =>
                setForm((prev) => ({ ...prev, balance: event.target.value }))
              }
            />
          </div>

          <Field
            label="Currency"
            value={form.currency}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, currency: event.target.value }))
            }
            maxLength={3}
            hint="Three-letter ISO code."
          />

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-stroke)',
            }}
          >
            <Switch
              label="Account is active"
              hint="Inactive accounts stay in history but are excluded from liquid totals."
              checked={form.active}
              onChange={(value) => setForm((prev) => ({ ...prev, active: value }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete this account?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed. Accounts that already have transactions are protected by the database.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
