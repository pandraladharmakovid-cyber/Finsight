// src/pages/Categories.jsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Filter,
  Layers3,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USER_ID = import.meta.env.VITE_FINSIGHT_USER_ID || '1';

const FALLBACK_CATEGORIES = [
  {
    category_id: 1,
    category_name: 'Food & Dining',
    category_type: 'expense',
    description: 'Restaurants, groceries, food delivery and dining.',
    total_spent: 18450,
    transactions: 32,
  },
  {
    category_id: 2,
    category_name: 'Shopping',
    category_type: 'expense',
    description: 'Online shopping, clothing and household purchases.',
    total_spent: 12780,
    transactions: 14,
  },
  {
    category_id: 3,
    category_name: 'Transport',
    category_type: 'expense',
    description: 'Fuel, rides, public transport and travel.',
    total_spent: 8260,
    transactions: 21,
  },
  {
    category_id: 4,
    category_name: 'Utilities',
    category_type: 'expense',
    description: 'Electricity, internet, mobile and utility bills.',
    total_spent: 5940,
    transactions: 8,
  },
  {
    category_id: 5,
    category_name: 'Subscriptions',
    category_type: 'expense',
    description: 'Recurring digital and entertainment subscriptions.',
    total_spent: 3180,
    transactions: 7,
  },
  {
    category_id: 6,
    category_name: 'Health',
    category_type: 'expense',
    description: 'Healthcare, medicines and wellness.',
    total_spent: 2670,
    transactions: 6,
  },
  {
    category_id: 7,
    category_name: 'Salary',
    category_type: 'income',
    description: 'Primary salary and employment income.',
    total_spent: 85000,
    transactions: 1,
  },
  {
    category_id: 8,
    category_name: 'Freelance',
    category_type: 'income',
    description: 'Independent projects and freelance income.',
    total_spent: 18000,
    transactions: 3,
  },
];

const CATEGORY_COLORS = [
  'violet',
  'cyan',
  'emerald',
  'amber',
  'rose',
  'blue',
  'pink',
  'orange',
];

const ICONS = [
  WalletCards,
  Layers3,
  TrendingUp,
  Target,
  Sparkles,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
];

function currency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function normalizeCategory(item, index) {
  return {
    category_id:
      item.category_id ??
      item.id ??
      index + 1,

    category_name:
      item.category_name ??
      item.name ??
      'Unnamed category',

    category_type:
      String(
        item.category_type ??
          item.type ??
          'expense',
      ).toLowerCase(),

    description:
      item.description ??
      'Financial category',

    total_spent: Number(
      item.total_spent ??
        item.totalSpent ??
        item.amount ??
        0,
    ),

    transactions: Number(
      item.transactions ??
        item.transaction_count ??
        item.transactionCount ??
        0,
    ),
  };
}

function CategoryIcon({ index }) {
  const Icon = ICONS[index % ICONS.length];

  return (
    <div
      className={`category-page-icon category-page-icon-${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`}
    >
      <Icon size={21} />
    </div>
  );
}

function CategoryModal({ category, onClose, onSave }) {
  const [name, setName] = useState(
    category?.category_name ?? '',
  );

  const [type, setType] = useState(
    category?.category_type ?? 'expense',
  );

  const [description, setDescription] = useState(
    category?.description ?? '',
  );

  const submit = (event) => {
    event.preventDefault();

    onSave({
      ...(category ?? {}),
      category_name: name.trim(),
      category_type: type,
      description: description.trim(),
      category_id:
        category?.category_id ??
        `local-${Date.now()}`,
      total_spent: category?.total_spent ?? 0,
      transactions: category?.transactions ?? 0,
    });
  };

  return (
    <div
      className="category-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="category-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="category-modal-header">
          <div>
            <span className="category-eyebrow">
              CATEGORY CONTROL
            </span>

            <h2>
              {category
                ? 'Edit category'
                : 'Create category'}
            </h2>

            <p>
              Organize your financial activity with
              structured categories.
            </p>
          </div>

          <button
            type="button"
            className="category-close-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="category-modal-form"
          onSubmit={submit}
        >
          <label>
            <span>Category name</span>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Investments"
              required
            />
          </label>

          <label>
            <span>Category type</span>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
            >
              <option value="expense">
                Expense
              </option>

              <option value="income">
                Income
              </option>
            </select>
          </label>

          <label>
            <span>Description</span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe what belongs in this category..."
              rows={4}
            />
          </label>

          <div className="category-modal-actions">
            <button
              type="button"
              className="category-secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="category-primary-button"
            >
              <Plus size={17} />
              {category
                ? 'Save category'
                : 'Create category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState(
    FALLBACK_CATEGORIES,
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('spending');

  const [showFilters, setShowFilters] =
    useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [showModal, setShowModal] =
    useState(false);

  const loadCategories = async (
    silent = false,
  ) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `${API_BASE}/categories?userId=${USER_ID}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Request failed: ${response.status}`,
        );
      }

      const payload = await response.json();

      const rows =
        payload?.data?.categories ??
        payload?.data ??
        payload?.categories ??
        [];

      if (!Array.isArray(rows)) {
        throw new Error(
          'Invalid category analytics response',
        );
      }

      setCategories(
        rows.map(normalizeCategory),
      );

      setConnected(true);
    } catch {
      setConnected(false);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = categories.filter(
      (category) => {
        const matchesSearch =
          !query ||
          [
            category.category_name,
            category.description,
            category.category_type,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query);

        const matchesType =
          type === 'all' ||
          category.category_type === type;

        return (
          matchesSearch &&
          matchesType
        );
      },
    );

    return [...result].sort((a, b) => {
      if (sort === 'name') {
        return a.category_name.localeCompare(
          b.category_name,
        );
      }

      if (sort === 'transactions') {
        return (
          b.transactions -
          a.transactions
        );
      }

      return (
        b.total_spent -
        a.total_spent
      );
    });
  }, [
    categories,
    search,
    type,
    sort,
  ]);

  const statistics = useMemo(() => {
    const expenses = categories.filter(
      (item) =>
        item.category_type === 'expense',
    );

    const income = categories.filter(
      (item) =>
        item.category_type === 'income',
    );

    const expenseTotal = expenses.reduce(
      (sum, item) =>
        sum + item.total_spent,
      0,
    );

    const incomeTotal = income.reduce(
      (sum, item) =>
        sum + item.total_spent,
      0,
    );

    const transactionTotal =
      categories.reduce(
        (sum, item) =>
          sum + item.transactions,
        0,
      );

    const largest =
      [...expenses].sort(
        (a, b) =>
          b.total_spent -
          a.total_spent,
      )[0];

    return {
      expenseCount: expenses.length,
      incomeCount: income.length,
      expenseTotal,
      incomeTotal,
      transactionTotal,
      largest,
    };
  }, [categories]);

  const handleSave = async (category) => {
    try {
      const isExisting = category.category_id && !String(category.category_id).startsWith('local-');
      const url = isExisting
        ? `${API_BASE}/categories/${category.category_id}`
        : `${API_BASE}/categories`;
      const res = await fetch(url, {
        method: isExisting ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: category.category_name,
          category_type: String(category.category_type || 'expense').toUpperCase(),
        }),
      });
      if (res.ok) {
        await loadCategories(true);
      }
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setShowModal(false);
      setSelectedCategory(null);
    }
  };

  const maxExpense =
    Math.max(
      ...categories
        .filter(
          (item) =>
            item.category_type ===
            'expense',
        )
        .map(
          (item) =>
            item.total_spent,
        ),
      1,
    );

  return (
    <div className="category-page">
      <div className="category-page-glow category-page-glow-one" />
      <div className="category-page-glow category-page-glow-two" />

      <section className="category-hero">
        <div>
          <div className="category-live-indicator">
            <span />
            {connected
              ? 'LIVE FINANCIAL DATA'
              : 'FINANCIAL DATA'}
          </div>

          <h1>
            Category
            <span> Intelligence</span>
          </h1>

          <p>
            Understand where your money flows,
            identify spending concentration and
            organize the financial system behind
            every transaction.
          </p>
        </div>

        <div className="category-hero-actions">
          <button
            type="button"
            className="category-refresh-button"
            onClick={() =>
              loadCategories(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? 'category-spin'
                  : ''
              }
            />
            Refresh
          </button>

          <button
            type="button"
            className="category-primary-button"
            onClick={() => {
              setSelectedCategory(null);
              setShowModal(true);
            }}
          >
            <Plus size={18} />
            New category
          </button>
        </div>
      </section>

      <section className="category-kpi-grid">
        <div className="category-kpi-card">
          <div className="category-kpi-icon violet">
            <Layers3 size={19} />
          </div>

          <div>
            <span>Total categories</span>
            <strong>
              {categories.length}
            </strong>
            <small>
              {statistics.expenseCount} expense ·{' '}
              {statistics.incomeCount} income
            </small>
          </div>
        </div>

        <div className="category-kpi-card">
          <div className="category-kpi-icon rose">
            <TrendingDown size={19} />
          </div>

          <div>
            <span>Total categorized spending</span>
            <strong>
              {currency(
                statistics.expenseTotal,
              )}
            </strong>
            <small>
              Across expense categories
            </small>
          </div>
        </div>

        <div className="category-kpi-card">
          <div className="category-kpi-icon emerald">
            <TrendingUp size={19} />
          </div>

          <div>
            <span>Categorized income</span>
            <strong>
              {currency(
                statistics.incomeTotal,
              )}
            </strong>
            <small>
              Across income categories
            </small>
          </div>
        </div>

        <div className="category-kpi-card">
          <div className="category-kpi-icon cyan">
            <BarChart3 size={19} />
          </div>

          <div>
            <span>Transactions analyzed</span>
            <strong>
              {statistics.transactionTotal}
            </strong>
            <small>
              Financial activity mapped
            </small>
          </div>
        </div>
      </section>

      <section className="category-intelligence-grid">
        <div className="category-command-card">
          <div className="category-section-heading">
            <div>
              <span>SPENDING CONCENTRATION</span>
              <h2>Where your money goes</h2>
            </div>

            <BarChart3 size={21} />
          </div>

          <div className="category-bars">
            {categories
              .filter(
                (item) =>
                  item.category_type ===
                  'expense',
              )
              .slice(0, 6)
              .map((category, index) => {
                const percentage =
                  (category.total_spent /
                    maxExpense) *
                  100;

                return (
                  <div
                    className="category-bar-row"
                    key={
                      category.category_id
                    }
                  >
                    <div className="category-bar-label">
                      <CategoryIcon
                        index={index}
                      />

                      <div>
                        <strong>
                          {
                            category.category_name
                          }
                        </strong>

                        <span>
                          {
                            category.transactions
                          }{' '}
                          transactions
                        </span>
                      </div>

                      <b>
                        {currency(
                          category.total_spent,
                        )}
                      </b>
                    </div>

                    <div className="category-bar-track">
                      <div
                        className={`category-bar-fill category-bar-${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`}
                        style={{
                          width: `${Math.max(
                            percentage,
                            4,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="category-focus-card">
          <div className="category-focus-orbit">
            <div className="category-focus-core">
              <Sparkles size={25} />
            </div>
          </div>

          <span className="category-focus-label">
            TOP EXPENSE CATEGORY
          </span>

          <h2>
            {statistics.largest
              ?.category_name ??
              'No data'}
          </h2>

          <strong>
            {currency(
              statistics.largest
                ?.total_spent ?? 0,
            )}
          </strong>

          <p>
            This category currently represents
            the largest concentration of your
            categorized spending.
          </p>

          <div className="category-focus-meta">
            <span>
              <BarChart3 size={14} />
              {statistics.largest
                ?.transactions ?? 0}{' '}
              transactions
            </span>

            <span>
              <Target size={14} />
              Monitor closely
            </span>
          </div>
        </div>
      </section>

      <section className="category-directory">
        <div className="category-directory-header">
          <div>
            <span>CATEGORY DIRECTORY</span>
            <h2>Financial classification system</h2>
          </div>

          <button
            type="button"
            className="category-filter-toggle"
            onClick={() =>
              setShowFilters(
                (current) => !current,
              )
            }
          >
            <Filter size={17} />
            Filters
            <ChevronDown
              size={15}
              className={
                showFilters
                  ? 'category-chevron-open'
                  : ''
              }
            />
          </button>
        </div>

        <div className="category-toolbar">
          <div className="category-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search categories..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="category-filter-group">
            <button
              type="button"
              className={
                type === 'all'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setType('all')
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                type === 'expense'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setType('expense')
              }
            >
              Expenses
            </button>

            <button
              type="button"
              className={
                type === 'income'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setType('income')
              }
            >
              Income
            </button>
          </div>

          {showFilters && (
            <select
              className="category-sort-select"
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value,
                )
              }
            >
              <option value="spending">
                Highest spending
              </option>

              <option value="transactions">
                Most transactions
              </option>

              <option value="name">
                Alphabetical
              </option>
            </select>
          )}
        </div>

        <div className="category-grid">
          {loading ? (
            Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                className="category-skeleton"
                key={index}
              >
                <div />
                <span />
                <span />
                <span />
              </div>
            ))
          ) : filteredCategories.length ===
            0 ? (
            <div className="category-empty">
              <Search size={30} />
              <h3>
                No categories found
              </h3>
              <p>
                Try changing your search or
                category filters.
              </p>
            </div>
          ) : (
            filteredCategories.map(
              (category, index) => {
                const percentage =
                  statistics.expenseTotal >
                  0 &&
                  category.category_type ===
                    'expense'
                    ? Math.round(
                        (category.total_spent /
                          statistics.expenseTotal) *
                          100,
                      )
                    : 0;

                return (
                  <article
                    className="category-card"
                    key={
                      category.category_id
                    }
                  >
                    <div className="category-card-top">
                      <CategoryIcon
                        index={index}
                      />

                      <button
                        type="button"
                        className="category-more"
                        onClick={() => {
                          setSelectedCategory(
                            category,
                          );
                          setShowModal(true);
                        }}
                      >
                        <MoreHorizontal
                          size={18}
                        />
                      </button>
                    </div>

                    <div className="category-card-title">
                      <h3>
                        {
                          category.category_name
                        }
                      </h3>

                      <span
                        className={`category-type-badge ${category.category_type}`}
                      >
                        {category.category_type ===
                        'income' ? (
                          <ArrowDownLeft
                            size={12}
                          />
                        ) : (
                          <ArrowUpRight
                            size={12}
                          />
                        )}

                        {
                          category.category_type
                        }
                      </span>
                    </div>

                    <p>
                      {category.description}
                    </p>

                    <div className="category-card-value">
                      <span>
                        {category.category_type ===
                        'income'
                          ? 'Income tracked'
                          : 'Total spending'}
                      </span>

                      <strong>
                        {currency(
                          category.total_spent,
                        )}
                      </strong>
                    </div>

                    <div className="category-card-footer">
                      <span>
                        <BarChart3 size={14} />
                        {
                          category.transactions
                        }{' '}
                        transactions
                      </span>

                      {category.category_type ===
                        'expense' && (
                        <span>
                          {percentage}% of expenses
                        </span>
                      )}
                    </div>

                    <div className="category-card-progress">
                      <div
                        style={{
                          width: `${Math.min(
                            Math.max(
                              percentage,
                              4,
                            ),
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </article>
                );
              },
            )
          )}
        </div>
      </section>

      {showModal && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => {
            setShowModal(false);
            setSelectedCategory(null);
          }}
          onSave={handleSave}
        />
      )}

      <style>{`
        .category-page {
          position: relative;
          min-height: 100%;
          padding: 30px;
          overflow: hidden;
          color: var(--text-primary, #f8fafc);
        }

        .category-page-glow {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: .12;
        }

        .category-page-glow-one {
          top: -180px;
          right: 8%;
          background: #8b5cf6;
        }

        .category-page-glow-two {
          bottom: 10%;
          left: -220px;
          background: #06b6d4;
        }

        .category-hero {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 28px;
        }

        .category-live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .16em;
        }

        .category-live-indicator span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 15px #34d399;
        }

        .category-hero h1 {
          margin: 0;
          font-size: clamp(36px, 5vw, 64px);
          line-height: .98;
          letter-spacing: -.055em;
          font-weight: 850;
        }

        .category-hero h1 span {
          color: #a78bfa;
        }

        .category-hero p {
          max-width: 720px;
          margin: 15px 0 0;
          color: #94a3b8;
          line-height: 1.7;
          font-size: 14px;
        }

        .category-hero-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .category-refresh-button,
        .category-primary-button,
        .category-filter-toggle,
        .category-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          border: 1px solid rgba(148,163,184,.16);
          border-radius: 12px;
          padding: 0 16px;
          color: #e2e8f0;
          background: rgba(15,23,42,.68);
          font-weight: 750;
          cursor: pointer;
          transition: .2s ease;
        }

        .category-refresh-button:hover,
        .category-filter-toggle:hover,
        .category-secondary-button:hover {
          border-color: rgba(167,139,250,.4);
          transform: translateY(-1px);
        }

        .category-primary-button {
          border-color: transparent;
          color: white;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          box-shadow: 0 12px 35px rgba(124,58,237,.28);
        }

        .category-primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(124,58,237,.38);
        }

        .category-kpi-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .category-kpi-card {
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 115px;
          padding: 18px;
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 18px;
          background: linear-gradient(
            145deg,
            rgba(15,23,42,.86),
            rgba(15,23,42,.54)
          );
          box-shadow: inset 0 1px rgba(255,255,255,.035);
        }

        .category-kpi-icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 13px;
          flex-shrink: 0;
        }

        .category-kpi-icon.violet {
          color: #c4b5fd;
          background: rgba(139,92,246,.14);
        }

        .category-kpi-icon.rose {
          color: #fda4af;
          background: rgba(244,63,94,.12);
        }

        .category-kpi-icon.emerald {
          color: #6ee7b7;
          background: rgba(16,185,129,.12);
        }

        .category-kpi-icon.cyan {
          color: #67e8f9;
          background: rgba(6,182,212,.12);
        }

        .category-kpi-card span,
        .category-kpi-card small {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .category-kpi-card strong {
          display: block;
          margin: 4px 0;
          color: #f8fafc;
          font-size: 22px;
          letter-spacing: -.035em;
        }

        .category-kpi-card small {
          color: #475569;
          font-size: 10px;
        }

        .category-intelligence-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(300px, .8fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .category-command-card,
        .category-focus-card,
        .category-directory {
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 22px;
          background: rgba(15,23,42,.65);
          box-shadow:
            inset 0 1px rgba(255,255,255,.035),
            0 20px 70px rgba(0,0,0,.14);
          backdrop-filter: blur(18px);
        }

        .category-command-card {
          padding: 22px;
        }

        .category-section-heading,
        .category-directory-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .category-section-heading > svg {
          color: #a78bfa;
        }

        .category-section-heading span,
        .category-directory-header > div > span {
          color: #64748b;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .16em;
        }

        .category-section-heading h2,
        .category-directory-header h2 {
          margin: 5px 0 0;
          font-size: 19px;
          letter-spacing: -.025em;
        }

        .category-bars {
          display: grid;
          gap: 17px;
          margin-top: 25px;
        }

        .category-bar-label {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 11px;
          margin-bottom: 8px;
        }

        .category-bar-label strong,
        .category-bar-label span {
          display: block;
        }

        .category-bar-label strong {
          color: #e2e8f0;
          font-size: 12px;
        }

        .category-bar-label span {
          margin-top: 2px;
          color: #64748b;
          font-size: 9px;
        }

        .category-bar-label b {
          color: #cbd5e1;
          font-size: 12px;
        }

        .transaction-category-icon,
        .category-page-icon {
          display: grid;
          place-items: center;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .category-page-icon {
          width: 45px;
          height: 45px;
        }

        .category-page-icon-violet {
          color: #c4b5fd;
          background: rgba(139,92,246,.14);
        }

        .category-page-icon-cyan {
          color: #67e8f9;
          background: rgba(6,182,212,.13);
        }

        .category-page-icon-emerald {
          color: #6ee7b7;
          background: rgba(16,185,129,.13);
        }

        .category-page-icon-amber {
          color: #fcd34d;
          background: rgba(245,158,11,.13);
        }

        .category-page-icon-rose {
          color: #fda4af;
          background: rgba(244,63,94,.13);
        }

        .category-page-icon-blue {
          color: #93c5fd;
          background: rgba(59,130,246,.13);
        }

        .category-page-icon-pink {
          color: #f9a8d4;
          background: rgba(236,72,153,.13);
        }

        .category-page-icon-orange {
          color: #fdba74;
          background: rgba(249,115,22,.13);
        }

        .category-bar-track {
          height: 7px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(30,41,59,.85);
        }

        .category-bar-fill {
          height: 100%;
          border-radius: inherit;
          box-shadow: 0 0 18px currentColor;
        }

        .category-bar-violet { background: #8b5cf6; }
        .category-bar-cyan { background: #06b6d4; }
        .category-bar-emerald { background: #10b981; }
        .category-bar-amber { background: #f59e0b; }
        .category-bar-rose { background: #f43f5e; }
        .category-bar-blue { background: #3b82f6; }

        .category-focus-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 330px;
          padding: 28px;
          text-align: center;
          overflow: hidden;
        }

        .category-focus-card::before {
          content: "";
          position: absolute;
          inset: 15%;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(139,92,246,.18),
            transparent 68%
          );
          pointer-events: none;
        }

        .category-focus-orbit {
          position: relative;
          display: grid;
          place-items: center;
          width: 82px;
          height: 82px;
          margin-bottom: 16px;
          border: 1px dashed rgba(167,139,250,.45);
          border-radius: 50%;
          animation: categoryOrbit 10s linear infinite;
        }

        .category-focus-core {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          color: #ddd6fe;
          background: linear-gradient(
            135deg,
            #6d28d9,
            #a855f7
          );
          box-shadow: 0 0 35px rgba(168,85,247,.4);
        }

        .category-focus-label {
          position: relative;
          color: #64748b;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .18em;
        }

        .category-focus-card h2 {
          position: relative;
          margin: 8px 0 3px;
          font-size: 22px;
        }

        .category-focus-card > strong {
          position: relative;
          color: #a78bfa;
          font-size: 27px;
        }

        .category-focus-card p {
          position: relative;
          max-width: 330px;
          margin: 9px 0 15px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
        }

        .category-focus-meta {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .category-focus-meta span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 9px;
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 8px;
          color: #94a3b8;
          background: rgba(15,23,42,.55);
          font-size: 9px;
          font-weight: 700;
        }

        .category-directory {
          position: relative;
          z-index: 1;
          padding: 23px;
        }

        .category-filter-toggle {
          min-height: 38px;
          padding: 0 12px;
        }

        .category-chevron-open {
          transform: rotate(180deg);
        }

        .category-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .category-search {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 220px;
          height: 43px;
          gap: 9px;
          padding: 0 12px;
          border: 1px solid rgba(148,163,184,.13);
          border-radius: 11px;
          color: #64748b;
          background: rgba(2,6,23,.35);
        }

        .category-search input {
          width: 100%;
          border: 0;
          outline: 0;
          color: #e2e8f0;
          background: transparent;
          font: inherit;
          font-size: 12px;
        }

        .category-search input::placeholder {
          color: #475569;
        }

        .category-search button {
          display: grid;
          place-items: center;
          border: 0;
          color: #64748b;
          background: transparent;
          cursor: pointer;
        }

        .category-filter-group {
          display: flex;
          padding: 3px;
          border: 1px solid rgba(148,163,184,.11);
          border-radius: 11px;
          background: rgba(2,6,23,.32);
        }

        .category-filter-group button {
          height: 35px;
          padding: 0 13px;
          border: 0;
          border-radius: 8px;
          color: #64748b;
          background: transparent;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .category-filter-group button.active {
          color: #f8fafc;
          background: rgba(139,92,246,.2);
        }

        .category-sort-select {
          height: 41px;
          padding: 0 12px;
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 10px;
          outline: 0;
          color: #cbd5e1;
          background: #0f172a;
          font-size: 11px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
        }

        .category-card {
          position: relative;
          min-width: 0;
          padding: 18px;
          border: 1px solid rgba(148,163,184,.1);
          border-radius: 17px;
          background: linear-gradient(
            145deg,
            rgba(15,23,42,.78),
            rgba(15,23,42,.48)
          );
          transition: .22s ease;
        }

        .category-card:hover {
          transform: translateY(-3px);
          border-color: rgba(167,139,250,.27);
          box-shadow: 0 18px 45px rgba(0,0,0,.18);
        }

        .category-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .category-more {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(148,163,184,.1);
          border-radius: 9px;
          color: #64748b;
          background: transparent;
          cursor: pointer;
        }

        .category-more:hover {
          color: #c4b5fd;
          background: rgba(139,92,246,.1);
        }

        .category-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 15px;
        }

        .category-card-title h3 {
          margin: 0;
          color: #f1f5f9;
          font-size: 15px;
        }

        .category-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 7px;
          border-radius: 99px;
          font-size: 8px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .category-type-badge.expense {
          color: #fda4af;
          background: rgba(244,63,94,.1);
        }

        .category-type-badge.income {
          color: #6ee7b7;
          background: rgba(16,185,129,.1);
        }

        .category-card > p {
          min-height: 34px;
          margin: 9px 0 17px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.55;
        }

        .category-card-value {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .category-card-value span {
          color: #475569;
          font-size: 9px;
          font-weight: 700;
        }

        .category-card-value strong {
          color: #e2e8f0;
          font-size: 17px;
          letter-spacing: -.03em;
        }

        .category-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
          color: #475569;
          font-size: 9px;
          font-weight: 700;
        }

        .category-card-footer span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .category-card-progress {
          height: 4px;
          margin-top: 12px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(30,41,59,.8);
        }

        .category-card-progress div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #7c3aed,
            #22d3ee
          );
        }

        .category-skeleton {
          height: 240px;
          padding: 18px;
          border: 1px solid rgba(148,163,184,.08);
          border-radius: 17px;
          background: rgba(15,23,42,.5);
          animation: categoryPulse 1.5s ease-in-out infinite;
        }

        .category-skeleton div,
        .category-skeleton span {
          display: block;
          border-radius: 8px;
          background: rgba(100,116,139,.12);
        }

        .category-skeleton div {
          width: 45px;
          height: 45px;
          border-radius: 12px;
        }

        .category-skeleton span:nth-child(2) {
          width: 65%;
          height: 16px;
          margin-top: 20px;
        }

        .category-skeleton span:nth-child(3) {
          width: 90%;
          height: 10px;
          margin-top: 15px;
        }

        .category-skeleton span:nth-child(4) {
          width: 55%;
          height: 18px;
          margin-top: 45px;
        }

        .category-empty {
          grid-column: 1 / -1;
          display: grid;
          place-items: center;
          min-height: 250px;
          color: #64748b;
          text-align: center;
        }

        .category-empty h3 {
          margin: 12px 0 5px;
          color: #cbd5e1;
        }

        .category-empty p {
          margin: 0;
          font-size: 12px;
        }

        .category-modal-overlay {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(2,6,23,.72);
          backdrop-filter: blur(14px);
        }

        .category-modal {
          width: min(560px, 100%);
          max-height: calc(100vh - 40px);
          overflow: auto;
          border: 1px solid rgba(167,139,250,.2);
          border-radius: 22px;
          background: #0b1120;
          box-shadow: 0 35px 100px rgba(0,0,0,.5);
        }

        .category-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 24px;
          border-bottom: 1px solid rgba(148,163,184,.09);
        }

        .category-eyebrow {
          color: #a78bfa;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .16em;
        }

        .category-modal-header h2 {
          margin: 6px 0 5px;
          font-size: 23px;
        }

        .category-modal-header p {
          margin: 0;
          color: #64748b;
          font-size: 11px;
        }

        .category-close-button {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 10px;
          color: #94a3b8;
          background: rgba(15,23,42,.8);
          cursor: pointer;
        }

        .category-modal-form {
          display: grid;
          gap: 17px;
          padding: 24px;
        }

        .category-modal-form label {
          display: grid;
          gap: 7px;
        }

        .category-modal-form label span {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
        }

        .category-modal-form input,
        .category-modal-form select,
        .category-modal-form textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(148,163,184,.13);
          border-radius: 11px;
          outline: 0;
          padding: 12px;
          color: #e2e8f0;
          background: rgba(15,23,42,.75);
          font: inherit;
          font-size: 12px;
          resize: vertical;
        }

        .category-modal-form input:focus,
        .category-modal-form select:focus,
        .category-modal-form textarea:focus {
          border-color: rgba(167,139,250,.55);
          box-shadow: 0 0 0 3px rgba(139,92,246,.08);
        }

        .category-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 5px;
        }

        .category-secondary-button {
          background: transparent;
        }

        .category-spin {
          animation: categorySpin 1s linear infinite;
        }

        @keyframes categorySpin {
          to { transform: rotate(360deg); }
        }

        @keyframes categoryOrbit {
          to { transform: rotate(360deg); }
        }

        @keyframes categoryPulse {
          0%, 100% { opacity: .55; }
          50% { opacity: 1; }
        }

        @media (max-width: 1100px) {
          .category-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {
          .category-page {
            padding: 20px 15px 100px;
          }

          .category-hero {
            align-items: flex-start;
            flex-direction: column;
          }

          .category-hero-actions {
            width: 100%;
          }

          .category-hero-actions button {
            flex: 1;
          }

          .category-intelligence-grid {
            grid-template-columns: 1fr;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .category-kpi-grid {
            grid-template-columns: 1fr;
          }

          .category-kpi-card {
            min-height: 95px;
          }

          .category-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .category-filter-group {
            width: 100%;
          }

          .category-filter-group button {
            flex: 1;
          }

          .category-sort-select {
            width: 100%;
          }

          .category-modal-actions {
            flex-direction: column-reverse;
          }

          .category-modal-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}