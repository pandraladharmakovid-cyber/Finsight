import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
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
  money,
  normaliseCategory,
  titleCase,
  unwrap,
} from '../lib/format.js';

const emptyForm = { name: '', type: 'EXPENSE', description: '' };

export default function Categories() {
  const toast = useToast();

  const categoriesRes = useResource(() => api.categories(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const categories = useMemo(
    () => asArray(unwrap(categoriesRes.data)).map(normaliseCategory),
    [categoriesRes.data],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return categories.filter((category) => {
      if (tab !== 'ALL' && category.type !== tab) return false;
      if (needle && !category.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [categories, tab, search]);

  const totals = useMemo(
    () => ({
      all: categories.length,
      expense: categories.filter((category) => category.type === 'EXPENSE').length,
      income: categories.filter((category) => category.type === 'INCOME').length,
      tracked: categories.reduce((total, category) => total + category.spent, 0),
    }),
    [categories],
  );

  function openCreate(type = 'EXPENSE') {
    setEditing(null);
    setForm({ ...emptyForm, type });
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
    setForm({
      name: category.name,
      type: category.type,
      description: category.description || '',
    });
    setErrors({});
    setFormOpen(true);
  }

  async function submitForm(event) {
    event?.preventDefault();

    if (!form.name.trim()) {
      setErrors({ name: 'Category name is required.' });
      return;
    }

    setSaving(true);

    const payload = {
      categoryName: form.name.trim(),
      categoryType: form.type,
      description: form.description.trim() || null,
    };

    try {
      if (editing) {
        await api.updateCategory(editing.id, payload);
        toast.success('Category updated', payload.categoryName);
      } else {
        await api.createCategory(payload);
        toast.success('Category created', payload.categoryName);
      }

      setFormOpen(false);
      await categoriesRes.refresh();
    } catch (error) {
      toast.error('Could not save category', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteCategory(deleteTarget.id);
      toast.success('Category deleted', deleteTarget.name);
      setDeleteTarget(null);
      await categoriesRes.refresh();
    } catch (error) {
      toast.error(
        'Delete failed',
        `${error.message} — categories used by transactions or budgets cannot be removed.`,
      );
    } finally {
      setDeleting(false);
    }
  }

  if (categoriesRes.error) {
    return (
      <ErrorState
        error={categoriesRes.error}
        onRetry={categoriesRes.reload}
        title="Categories could not load"
      />
    );
  }

  return (
    <div className="fs-col fs-gap-20">
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Total categories"
          value={totals.all}
          icon={FolderTree}
          tone="violet"
          format={(n) => Math.round(n).toString()}
          footnote="classification groups"
        />
        <StatCard
          label="Expense groups"
          value={totals.expense}
          icon={ArrowUpRight}
          tone="rose"
          delay={1}
          format={(n) => Math.round(n).toString()}
        />
        <StatCard
          label="Income groups"
          value={totals.income}
          icon={ArrowDownLeft}
          tone="mint"
          delay={2}
          format={(n) => Math.round(n).toString()}
        />
        <StatCard
          label="Tracked spend"
          value={totals.tracked}
          icon={FolderTree}
          tone="cyan"
          delay={3}
          footnote="across all categories"
        />
      </section>

      <Card padded={false}>
        <div
          className="fs-row-between fs-wrap fs-gap-10"
          style={{ padding: '16px 18px', borderBottom: '1px solid var(--glass-stroke)' }}
        >
          <div className="fs-tabs">
            {['ALL', 'EXPENSE', 'INCOME'].map((option) => (
              <button
                key={option}
                type="button"
                className={`fs-tab ${tab === option ? 'is-on' : ''}`}
                onClick={() => setTab(option)}
              >
                {titleCase(option)}
              </button>
            ))}
          </div>

          <div className="fs-row fs-gap-10" style={{ flex: '1 1 260px', justifyContent: 'flex-end' }}>
            <input
              className="fs-input"
              placeholder="Search categories…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ maxWidth: 240 }}
              aria-label="Search categories"
            />

            <Button variant="primary" icon={Plus} onClick={() => openCreate()}>
              New category
            </Button>
          </div>
        </div>

        {categoriesRes.loading ? (
          <div style={{ padding: 18 }}>
            <CardSkeleton rows={5} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories here"
            message="Create a category to classify income and expenses."
            action={
              <Button variant="primary" icon={Plus} onClick={() => openCreate()}>
                Create category
              </Button>
            }
          />
        ) : (
          <div className="fs-table-wrap">
            <table className="fs-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="fs-right">Spent</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {visible.map((category) => (
                  <tr key={category.id}>
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
                              category.type === 'INCOME'
                                ? 'var(--mint)'
                                : 'var(--rose)',
                            background:
                              category.type === 'INCOME'
                                ? 'rgba(52,211,153,0.12)'
                                : 'rgba(244,63,94,0.12)',
                            borderColor:
                              category.type === 'INCOME'
                                ? 'rgba(52,211,153,0.28)'
                                : 'rgba(244,63,94,0.28)',
                          }}
                        >
                          {category.name.slice(0, 2).toUpperCase()}
                        </span>

                        <span style={{ color: 'var(--text-1)', fontWeight: 550 }}>
                          {category.name}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`fs-badge ${
                          category.type === 'INCOME' ? 'fs-badge-pos' : 'fs-badge-neg'
                        }`}
                      >
                        {titleCase(category.type)}
                      </span>
                    </td>

                    <td className="is-amount">
                      {category.spent > 0 ? money(category.spent) : '—'}
                    </td>

                    <td className="fs-dim fs-truncate" style={{ maxWidth: 220 }}>
                      {category.description || '—'}
                    </td>

                    <td>
                      <div className="fs-row-actions">
                        <button
                          type="button"
                          className="fs-btn fs-btn-ghost fs-btn-icon"
                          style={{ width: 30, height: 30 }}
                          onClick={() => openEdit(category)}
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="fs-btn fs-btn-ghost fs-btn-icon"
                          style={{ width: 30, height: 30, color: 'var(--rose)' }}
                          onClick={() => setDeleteTarget(category)}
                          aria-label={`Delete ${category.name}`}
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
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        subtitle="Categories power budgets, analytics and spending breakdowns."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} icon={Plus} onClick={submitForm}>
              {editing ? 'Save changes' : 'Create category'}
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
            label="Name"
            placeholder="e.g. Groceries"
            value={form.name}
            error={errors.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />

          <Field
            as="textarea"
            label="Description"
            placeholder="Optional note about how this category is used"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Delete this category?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed. Categories referenced by transactions or budgets are protected and cannot be deleted.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
