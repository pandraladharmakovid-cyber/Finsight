import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import SectionHead from '../components/ui/SectionHead.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';

import { api } from '../lib/api.js';
import { useResource, useToast } from '../lib/hooks.jsx';
import {
  asArray,
  dateInput,
  money,
  normaliseAccount,
  normaliseCategory,
  normaliseTransaction,
  prettyDate,
  titleCase,
  unwrap,
} from '../lib/format.js';

const PAGE_SIZE = 12;

const emptyForm = {
  amount: '',
  type: 'EXPENSE',
  description: '',
  accountId: '',
  categoryId: '',
  date: dateInput(new Date()),
};

export default function Transactions() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const transactions = useResource(() => api.transactions('limit=500'), []);
  const accountsRes = useResource(() => api.accounts(), []);
  const categoriesRes = useResource(() => api.categories(), []);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const accounts = useMemo(
    () => asArray(unwrap(accountsRes.data)).map(normaliseAccount),
    [accountsRes.data],
  );

  const categories = useMemo(
    () => asArray(unwrap(categoriesRes.data)).map(normaliseCategory),
    [categoriesRes.data],
  );

  const rows = useMemo(
    () => asArray(unwrap(transactions.data)).map(normaliseTransaction),
    [transactions.data],
  );

  /* Deep-link: open the create dialog from the palette or top bar */
  useEffect(() => {
    if (params.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, accountFilter, fromDate, toDate]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return rows.filter((tx) => {
      if (needle) {
        const haystack =
          `${tx.description} ${tx.categoryName} ${tx.accountName}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      if (accountFilter !== 'ALL' && String(tx.accountId) !== accountFilter) {
        return false;
      }

      const iso = dateInput(tx.date);
      if (fromDate && iso < fromDate) return false;
      if (toDate && iso > toDate) return false;

      return true;
    });
  }, [rows, search, typeFilter, accountFilter, fromDate, toDate]);

  const totals = useMemo(() => {
    const income = filtered
      .filter((tx) => tx.type === 'INCOME')
      .reduce((total, tx) => total + tx.amount, 0);

    const expense = filtered
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((total, tx) => total + tx.amount, 0);

    return { income, expense, net: income - expense, count: filtered.length };
  }, [filtered]);

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilters =
    (typeFilter !== 'ALL' ? 1 : 0) +
    (accountFilter !== 'ALL' ? 1 : 0) +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0);

  /* ------------------------------ form ------------------------------ */

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      accountId: accounts[0]?.id ?? '',
      categoryId: categories[0]?.id ?? '',
    });
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(tx) {
    setEditing(tx);
    setForm({
      amount: String(tx.amount),
      type: tx.type,
      description: tx.description,
      accountId: String(tx.accountId ?? ''),
      categoryId: String(tx.categoryId ?? ''),
      date: dateInput(tx.date),
    });
    setErrors({});
    setFormOpen(true);
  }

  function validate() {
    const next = {};

    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      next.amount = 'Enter an amount greater than zero.';
    }

    if (!form.description.trim()) {
      next.description = 'A short description is required.';
    }

    if (!form.accountId) {
      next.accountId = 'Choose an account.';
    }

    if (!form.categoryId) {
      next.categoryId = 'Choose a category.';
    }

    if (!form.date) {
      next.date = 'Pick a date.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);

    const payload = {
      amount: Number(form.amount),
      transactionType: form.type,
      description: form.description.trim(),
      accountId: Number(form.accountId),
      categoryId: Number(form.categoryId),
      transactionDate: form.date,
    };

    try {
      if (editing) {
        await api.updateTransaction(editing.id, payload);
        toast.success('Transaction updated', 'Balances have been recalculated.');
      } else {
        await api.createTransaction(payload);
        toast.success('Transaction recorded', `${money(payload.amount)} saved.`);
      }

      setFormOpen(false);
      await transactions.refresh();
      await accountsRes.refresh();
    } catch (error) {
      toast.error('Could not save transaction', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.deleteTransaction(deleteTarget.id);
      toast.success('Transaction deleted', 'The balance has been restored.');
      setDeleteTarget(null);
      await transactions.refresh();
      await accountsRes.refresh();
    } catch (error) {
      toast.error('Delete failed', error.message);
    } finally {
      setDeleting(false);
    }
  }

  const exportCsv = useCallback(() => {
    const header = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount'];
    const lines = filtered.map((tx) =>
      [
        dateInput(tx.date),
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${tx.categoryName}"`,
        `"${tx.accountName}"`,
        tx.type,
        tx.amount,
      ].join(','),
    );

    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `finsight-transactions-${dateInput(new Date())}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast.success('Export ready', `${filtered.length} transactions downloaded.`);
  }, [filtered, toast]);

  function resetFilters() {
    setTypeFilter('ALL');
    setAccountFilter('ALL');
    setFromDate('');
    setToDate('');
    setSearch('');
  }

  if (transactions.error) {
    return (
      <ErrorState
        error={transactions.error}
        onRetry={transactions.reload}
        title="Transactions could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      {/* KPIs */}
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Visible records"
          value={totals.count}
          icon={Filter}
          tone="violet"
          format={(n) => Math.round(n).toString()}
          footnote="matching current filters"
        />
        <StatCard
          label="Income"
          value={totals.income}
          icon={ArrowDownLeft}
          tone="mint"
          delay={1}
          footnote="money in"
        />
        <StatCard
          label="Expenses"
          value={totals.expense}
          icon={ArrowUpRight}
          tone="rose"
          delay={2}
          footnote="money out"
        />
        <StatCard
          label="Net flow"
          value={totals.net}
          icon={ArrowUpRight}
          tone={totals.net >= 0 ? 'cyan' : 'amber'}
          delay={3}
          footnote="income − expenses"
        />
      </section>

      {/* Toolbar */}
      <Card padded={false}>
        <div
          className="fs-row fs-gap-10 fs-wrap"
          style={{ padding: '16px 18px', borderBottom: '1px solid var(--glass-stroke)' }}
        >
          <div className="fs-input-affix" style={{ flex: '1 1 240px', minWidth: 200 }}>
            <Search size={15} />
            <input
              className="fs-input"
              placeholder="Search description, category or account…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search transactions"
            />
          </div>

          <Button
            icon={Filter}
            onClick={() => setShowFilters((open) => !open)}
            className={activeFilters ? 'fs-btn-primary' : ''}
          >
            Filters{activeFilters ? ` (${activeFilters})` : ''}
          </Button>

          <Button icon={Download} onClick={exportCsv}>
            Export
          </Button>

          <Button variant="primary" icon={Plus} onClick={openCreate}>
            New
          </Button>
        </div>

        {showFilters && (
          <div
            className="fs-grid fs-grid-4"
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid var(--glass-stroke)',
              background: 'rgba(255,255,255,0.02)',
              animation: 'reveal-up 260ms var(--ease-out)',
            }}
          >
            <Field
              as="select"
              label="Type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              options={[
                { value: 'ALL', label: 'All types' },
                { value: 'INCOME', label: 'Income' },
                { value: 'EXPENSE', label: 'Expense' },
              ]}
            />

            <Field
              as="select"
              label="Account"
              value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)}
              options={[
                { value: 'ALL', label: 'All accounts' },
                ...accounts.map((account) => ({
                  value: String(account.id),
                  label: account.name,
                })),
              ]}
            />

            <Field
              label="From"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />

            <Field
              label="To"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <Button size="sm" variant="ghost" icon={X} onClick={resetFilters}>
                Clear all filters
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {transactions.loading ? (
          <div style={{ padding: 18 }}>
            <CardSkeleton rows={6} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ArrowUpRight}
            title={rows.length ? 'No matches' : 'No transactions yet'}
            message={
              rows.length
                ? 'Try clearing a filter or searching for something else.'
                : 'Record your first transaction to bring this workspace to life.'
            }
            action={
              <Button variant="primary" icon={Plus} onClick={openCreate}>
                Add transaction
              </Button>
            }
          />
        ) : (
          <div className="fs-table-wrap">
            <table className="fs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th className="fs-right">Amount</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {visible.map((tx) => (
                  <tr key={tx.id}>
                    <td className="fs-nowrap fs-dim">
                      {prettyDate(tx.date, { year: undefined })}
                    </td>

                    <td>
                      <div className="fs-row fs-gap-8">
                        <span
                          className="fs-avatar fs-avatar-soft"
                          style={{
                            width: 26,
                            height: 26,
                            flex: '0 0 26px',
                            borderRadius: 8,
                            color:
                              tx.type === 'INCOME' ? 'var(--mint)' : 'var(--rose)',
                            background:
                              tx.type === 'INCOME'
                                ? 'rgba(52,211,153,0.12)'
                                : 'rgba(244,63,94,0.12)',
                            borderColor:
                              tx.type === 'INCOME'
                                ? 'rgba(52,211,153,0.28)'
                                : 'rgba(244,63,94,0.28)',
                          }}
                        >
                          {tx.type === 'INCOME' ? (
                            <ArrowDownLeft size={12} />
                          ) : (
                            <ArrowUpRight size={12} />
                          )}
                        </span>
                        <span className="fs-truncate" style={{ color: 'var(--text-1)' }}>
                          {tx.description}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="fs-badge fs-badge-neutral">
                        {tx.categoryName}
                      </span>
                    </td>

                    <td className="fs-dim fs-truncate">{tx.accountName}</td>

                    <td
                      className="is-amount"
                      style={{
                        color:
                          tx.type === 'INCOME' ? 'var(--mint)' : 'var(--text-1)',
                      }}
                    >
                      {tx.type === 'INCOME' ? '+' : '−'}
                      {money(tx.amount, { precise: true })}
                    </td>

                    <td>
                      <div className="fs-row-actions">
                        <button
                          type="button"
                          className="fs-btn fs-btn-ghost fs-btn-icon"
                          style={{ width: 30, height: 30 }}
                          onClick={() => openEdit(tx)}
                          aria-label={`Edit ${tx.description}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="fs-btn fs-btn-ghost fs-btn-icon"
                          style={{ width: 30, height: 30, color: 'var(--rose)' }}
                          onClick={() => setDeleteTarget(tx)}
                          aria-label={`Delete ${tx.description}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div
            className="fs-row-between"
            style={{ padding: '12px 18px', borderTop: '1px solid var(--glass-stroke)' }}
          >
            <span className="fs-xs fs-dim">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>

            <div className="fs-row fs-gap-6">
              <Button
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <span className="fs-xs fs-dim fs-num" style={{ padding: '0 6px' }}>
                {page} / {pageCount}
              </span>
              <Button
                size="sm"
                disabled={page === pageCount}
                onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit transaction' : 'Record a transaction'}
        subtitle={
          editing
            ? 'Changes automatically recalculate the account balance.'
            : 'Income and expenses update balances instantly.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={submitForm}
              icon={editing ? Pencil : Plus}
            >
              {editing ? 'Save changes' : 'Record transaction'}
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
                {type === 'INCOME' ? (
                  <ArrowDownLeft size={14} />
                ) : (
                  <ArrowUpRight size={14} />
                )}
                {titleCase(type)}
              </button>
            ))}
          </div>

          <Field
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            prefix="₹"
            placeholder="0.00"
            value={form.amount}
            error={errors.amount}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, amount: event.target.value }))
            }
          />

          <Field
            label="Description"
            placeholder="e.g. Grocery run at DMart"
            value={form.description}
            error={errors.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />

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
                  label: `${account.name} · ${money(account.balance)}`,
                })),
              ]}
            />

            <Field
              as="select"
              label="Category"
              value={form.categoryId}
              error={errors.categoryId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
              options={[
                { value: '', label: 'Select category…' },
                ...categories.map((category) => ({
                  value: String(category.id),
                  label: `${category.name} (${titleCase(category.type)})`,
                })),
              ]}
            />
          </div>

          <Field
            label="Date"
            type="date"
            value={form.date}
            error={errors.date}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, date: event.target.value }))
            }
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete this transaction?"
        message={
          deleteTarget
            ? `“${deleteTarget.description}” for ${money(deleteTarget.amount)} will be removed and the account balance restored. This cannot be undone.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
