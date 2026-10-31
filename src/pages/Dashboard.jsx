import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarClock,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import SectionHead from '../components/ui/SectionHead.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';
import { AreaChart, BarChart, DonutChart, ProgressRing } from '../components/charts/index.jsx';

import { api } from '../lib/api.js';
import { useResource } from '../lib/hooks.jsx';
import {
  asArray,
  clamp,
  dateInput,
  daysUntil,
  money,
  moneyShort,
  monthLabel,
  monthlyEquivalent,
  normaliseAccount,
  normaliseBudget,
  normaliseDebt,
  normaliseGoal,
  normaliseRecurring,
  normaliseTransaction,
  num,
  prettyDate,
  relativeTime,
  titleCase,
  unwrap,
} from '../lib/format.js';

export default function Dashboard() {
  const navigate = useNavigate();

  const dashboard = useResource(() => api.dashboard(), []);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dashboard.refresh();
    setRefreshing(false);
  }, [dashboard]);

  /* ------------------------------------------------------------------
     Derive everything from the single dashboard payload
     ------------------------------------------------------------------ */

  const model = useMemo(() => {
    const payload = unwrap(dashboard.data) ?? {};

    const summary = payload.summary ?? {};

    const accounts = asArray(payload.accounts).map(normaliseAccount);
    const budgets = asArray(payload.budgets).map((row) =>
      normaliseBudget(row, asArray(payload.budgets)),
    );
    const goals = asArray(payload.savings).map(normaliseGoal);
    const debts = asArray(payload.debts).map(normaliseDebt);
    const transactions = asArray(payload.recentTransactions).map(
      normaliseTransaction,
    );
    const recurring = asArray(payload.upcomingRecurring).map(normaliseRecurring);
    /* The dashboard endpoint names these differently from the analytics
       endpoint, so accept both shapes. */
    const categorySpending = asArray(
      payload.spendingByCategory ?? payload.categorySpending,
    );

    const monthly = asArray(
      payload.monthlyExpenses ?? payload.monthlyExpenseAnalysis,
    );

    const totalBalance = accounts
      .filter((account) => account.active)
      .reduce((total, account) => total + account.balance, 0);

    const totalBudget = budgets.reduce((total, budget) => total + budget.amount, 0);
    const totalSpent = budgets.reduce((total, budget) => total + budget.spent, 0);

    const totalSaved = goals.reduce((total, goal) => total + goal.saved, 0);
    const totalTarget = goals.reduce((total, goal) => total + goal.target, 0);

    const totalDebt = debts
      .filter((debt) => debt.status !== 'PAID')
      .reduce((total, debt) => total + debt.remaining, 0);

    const monthlyRecurring = recurring
      .filter((entry) => entry.active && entry.type === 'EXPENSE')
      .reduce(
        (total, entry) => total + monthlyEquivalent(entry.amount, entry.frequency),
        0,
      );

    const income = transactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((total, tx) => total + tx.amount, 0);

    const spending = transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((total, tx) => total + tx.amount, 0);

    return {
      summary,
      accounts,
      budgets,
      goals,
      debts,
      transactions,
      recurring,
      categorySpending,
      monthly,
      totalBalance,
      totalBudget,
      totalSpent,
      totalSaved,
      totalTarget,
      totalDebt,
      monthlyRecurring,
      income,
      spending,
      netWorth: totalBalance - totalDebt,
      savingsProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    };
  }, [dashboard.data]);

  const trendSeries = useMemo(() => {
    if (model.monthly.length) {
      return model.monthly.map((row) => ({
        label: monthLabel(row.month),
        value: num(row.total_expenses),
      }));
    }

    /* Fallback: bucket recent transactions by day */
    const buckets = new Map();

    model.transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .forEach((tx) => {
        const key = dateInput(tx.date).slice(0, 10);
        buckets.set(key, (buckets.get(key) ?? 0) + tx.amount);
      });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ label: key.slice(5), value }));
  }, [model.monthly, model.transactions]);

  const categorySeries = useMemo(
    () =>
      model.categorySpending
        .map((row) => ({
          label: row.category_name ?? 'Other',
          value: num(row.total_spent),
        }))
        .filter((row) => row.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 7),
    [model.categorySpending],
  );

  const budgetSignals = useMemo(
    () =>
      [...model.budgets]
        .map((budget) => ({
          ...budget,
          used: budget.amount > 0 ? clamp((budget.spent / budget.amount) * 100, 0, 999) : 0,
        }))
        .sort((a, b) => b.used - a.used)
        .slice(0, 4),
    [model.budgets],
  );

  const upcoming = useMemo(
    () =>
      [...model.recurring]
        .filter((entry) => entry.active)
        .sort(
          (a, b) =>
            new Date(a.nextRunDate ?? 0) - new Date(b.nextRunDate ?? 0),
        )
        .slice(0, 4),
    [model.recurring],
  );

  const topDebts = useMemo(
    () =>
      [...model.debts]
        .filter((debt) => debt.status !== 'PAID')
        .sort((a, b) => b.remaining - a.remaining)
        .slice(0, 3),
    [model.debts],
  );

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */

  if (dashboard.error) {
    return (
      <ErrorState
        error={dashboard.error}
        onRetry={dashboard.reload}
        title="The dashboard could not load"
      />
    );
  }

  const loading = dashboard.loading;

  return (
    <div className="fs-col fs-gap-24">
      {/* ---------------- HERO ---------------- */}
      <section
        className="fs-card fs-card-glow fs-reveal"
        style={{ padding: '26px 26px 22px' }}
      >
        <div className="fs-row-between fs-wrap" style={{ gap: 24 }}>
          <div style={{ minWidth: 260 }}>
            <div className="fs-eyebrow">Net worth</div>

            <div
              style={{
                fontSize: 40,
                fontWeight: 750,
                letterSpacing: '-0.035em',
                color: 'var(--text-1)',
                lineHeight: 1.1,
                marginTop: 6,
              }}
            >
              {loading ? '—' : money(model.netWorth)}
            </div>

            <div className="fs-row fs-gap-10 fs-wrap fs-mt-12">
              <span className="fs-badge fs-badge-pos">
                <TrendingUp size={10} /> {moneyShort(model.totalBalance)} liquid
              </span>
              <span className="fs-badge fs-badge-neg">
                <TrendingDown size={10} /> {moneyShort(model.totalDebt)} owed
              </span>
              <span className="fs-badge fs-badge-info">
                {model.accounts.length} accounts
              </span>
            </div>

            <div className="fs-row fs-gap-8 fs-mt-20">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate('/transactions?new=1')}
              >
                Record a transaction
              </Button>
              <Button
                icon={RefreshCw}
                loading={refreshing}
                onClick={handleRefresh}
              >
                Sync
              </Button>
            </div>
          </div>

          <div className="fs-row fs-gap-24 fs-wrap" style={{ alignItems: 'center' }}>
            <div className="fs-col fs-center fs-gap-6" style={{ alignItems: 'center' }}>
              <ProgressRing
                value={model.savingsProgress}
                size={104}
                thickness={9}
                label="Saved"
              />
              <span className="fs-xs fs-dim">Goal progress</span>
            </div>

            <div className="fs-col fs-gap-10" style={{ minWidth: 180 }}>
              {[
                {
                  label: 'Monthly income',
                  value: money(model.summary.totalIncome ?? model.income),
                  tone: 'var(--mint)',
                },
                {
                  label: 'Total expenses',
                  value: money(model.summary.totalExpenses ?? model.spending),
                  tone: 'var(--rose)',
                },
                {
                  label: 'Recurring / mo',
                  value: money(model.monthlyRecurring),
                  tone: 'var(--cyan-soft)',
                },
              ].map((row) => (
                <div key={row.label} className="fs-row-between" style={{ gap: 22 }}>
                  <span className="fs-xs fs-dim">{row.label}</span>
                  <strong
                    className="fs-num"
                    style={{ color: row.tone, fontSize: 14 }}
                  >
                    {loading ? '—' : row.value}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- KPI ROW ---------------- */}
      <section className="fs-grid fs-grid-4">
        <StatCard
          label="Liquid balance"
          value={model.totalBalance}
          icon={Wallet}
          tone="cyan"
          delay={0}
          footnote={`${model.accounts.filter((a) => a.active).length} active accounts`}
        />
        <StatCard
          label="Budget used"
          value={model.totalSpent}
          icon={Target}
          tone="violet"
          delay={1}
          footnote={`of ${money(model.totalBudget)} allocated`}
          trend={
            model.totalBudget > 0
              ? {
                  value: `${Math.round((model.totalSpent / model.totalBudget) * 100)}%`,
                  dir: model.totalSpent > model.totalBudget ? 'down' : 'up',
                }
              : null
          }
        />
        <StatCard
          label="Total saved"
          value={model.totalSaved}
          icon={PiggyBank}
          tone="mint"
          delay={2}
          footnote={`${model.goals.length} goals · ${Math.round(model.savingsProgress)}% to target`}
        />
        <StatCard
          label="Outstanding debt"
          value={model.totalDebt}
          icon={CreditCard}
          tone="rose"
          delay={3}
          footnote={`${model.debts.filter((d) => d.status !== 'PAID').length} active debts`}
        />
      </section>

      {/* ---------------- CHART + DONUT ---------------- */}
      <section className="fs-grid" style={{ gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)' }}>
        {loading ? (
          <CardSkeleton rows={6} />
        ) : (
          <Card
            title="Spending trend"
            subtitle="Monthly expenses recorded against accounts"
            icon={TrendingDown}
            className="fs-reveal"
            style={{ '--i': 4 }}
            action={
              <Button
                size="sm"
                variant="ghost"
                iconRight={ArrowRight}
                onClick={() => navigate('/analytics')}
              >
                Analytics
              </Button>
            }
          >
            {trendSeries.length ? (
              <AreaChart
                data={trendSeries}
                height={230}
                valueKey="value"
                labelKey="label"
              />
            ) : (
              <EmptyState
                icon={TrendingDown}
                title="No expense history yet"
                message="Add a transaction and your trend line will appear here."
                action={
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/transactions?new=1')}
                  >
                    Add transaction
                  </Button>
                }
              />
            )}
          </Card>
        )}

        {loading ? (
          <CardSkeleton rows={5} />
        ) : (
          <Card
            title="Where money goes"
            subtitle="Spending by category"
            icon={ArrowRightLeft}
            className="fs-reveal"
            style={{ '--i': 5 }}
          >
            <DonutChart
              data={categorySeries}
              centerLabel="SPENT"
              size={176}
            />
          </Card>
        )}
      </section>

      {/* ---------------- BUDGETS + RECENT ---------------- */}
      <section className="fs-grid fs-grid-2" style={{ alignItems: 'start' }}>
        <Card
          title="Budget health"
          subtitle="Top allocations by utilisation"
          icon={Target}
          className="fs-reveal"
          style={{ '--i': 6 }}
          action={
            <Button
              size="sm"
              variant="ghost"
              iconRight={ArrowRight}
              onClick={() => navigate('/budgets')}
            >
              All
            </Button>
          }
        >
          {budgetSignals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No budgets set"
              message="Create a budget to track category-level spending."
              action={
                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={() => navigate('/budgets?new=1')}
                >
                  Create budget
                </Button>
              }
            />
          ) : (
            <div className="fs-col fs-gap-16">
              {budgetSignals.map((budget) => {
                const over = budget.used > 100;

                return (
                  <div key={budget.id} className="fs-col fs-gap-6">
                    <div className="fs-row-between">
                      <span className="fs-sm fs-truncate" style={{ color: 'var(--text-1)' }}>
                        {budget.categoryName}
                      </span>
                      <span className="fs-xs fs-dim fs-num">
                        {money(budget.spent)} / {money(budget.amount)}
                      </span>
                    </div>

                    <div className="fs-meter">
                      <span
                        style={{
                          width: `${Math.min(budget.used, 100)}%`,
                          background: over
                            ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
                            : undefined,
                          '--meter-fill': over
                            ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
                            : undefined,
                        }}
                      />
                    </div>

                    <span
                      className="fs-xs"
                      style={{ color: over ? 'var(--rose)' : 'var(--text-4)' }}
                    >
                      {over
                        ? `${Math.round(budget.used - 100)}% over budget`
                        : `${money(Math.max(budget.amount - budget.spent, 0))} left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="Recent activity"
          subtitle="Latest transactions across all accounts"
          icon={ArrowRightLeft}
          className="fs-reveal"
          style={{ '--i': 7 }}
          action={
            <Button
              size="sm"
              variant="ghost"
              iconRight={ArrowRight}
              onClick={() => navigate('/transactions')}
            >
              All
            </Button>
          }
        >
          {model.transactions.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="No transactions yet"
              message="Your most recent money movements will show up here."
            />
          ) : (
            <ul className="fs-list">
              {model.transactions.slice(0, 6).map((tx) => (
                <li key={tx.id} className="fs-list-row">
                  <span
                    className="fs-avatar fs-avatar-soft"
                    style={{
                      color: tx.type === 'INCOME' ? 'var(--mint)' : 'var(--rose)',
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
                      <TrendingUp size={15} />
                    ) : (
                      <TrendingDown size={15} />
                    )}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fs-sm fs-truncate" style={{ color: 'var(--text-1)' }}>
                      {tx.description}
                    </div>
                    <div className="fs-xs fs-dim-2 fs-truncate">
                      {tx.categoryName} · {prettyDate(tx.date, { year: undefined })}
                    </div>
                  </div>

                  <strong
                    className="fs-num fs-nowrap"
                    style={{
                      fontSize: 13,
                      color: tx.type === 'INCOME' ? 'var(--mint)' : 'var(--text-1)',
                    }}
                  >
                    {tx.type === 'INCOME' ? '+' : '−'}
                    {money(tx.amount)}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ---------------- DEBTS + UPCOMING ---------------- */}
      <section className="fs-grid fs-grid-2" style={{ alignItems: 'start' }}>
        <Card
          title="Debt pressure"
          subtitle="Largest outstanding balances"
          icon={CreditCard}
          className="fs-reveal"
          style={{ '--i': 8 }}
          action={
            <Button
              size="sm"
              variant="ghost"
              iconRight={ArrowRight}
              onClick={() => navigate('/debts')}
            >
              Manage
            </Button>
          }
        >
          {topDebts.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Debt free"
              message="No active debts are recorded — excellent."
            />
          ) : (
            <div className="fs-col fs-gap-16">
              {topDebts.map((debt) => {
                const days = daysUntil(debt.dueDate);

                return (
                  <div key={debt.id} className="fs-row fs-gap-14">
                    <ProgressRing
                      value={debt.progress}
                      size={54}
                      thickness={6}
                      color="var(--rose)"
                      color2="var(--amber)"
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fs-row-between">
                        <span className="fs-sm fs-truncate" style={{ color: 'var(--text-1)' }}>
                          {debt.name}
                        </span>
                        <strong className="fs-num fs-sm" style={{ color: 'var(--rose)' }}>
                          {money(debt.remaining)}
                        </strong>
                      </div>

                      <div className="fs-xs fs-dim-2 fs-truncate">
                        {debt.lender} · {debt.interestRate}% APR ·{' '}
                        {days !== null && days >= 0
                          ? `due in ${days}d`
                          : 'no due date'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="Upcoming commitments"
          subtitle="Recurring payments scheduled next"
          icon={CalendarClock}
          className="fs-reveal"
          style={{ '--i': 9 }}
          action={
            <Button
              size="sm"
              variant="ghost"
              iconRight={ArrowRight}
              onClick={() => navigate('/recurring')}
            >
              All
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing scheduled"
              message="Recurring bills and subscriptions will appear here."
              action={
                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={() => navigate('/recurring?new=1')}
                >
                  Add schedule
                </Button>
              }
            />
          ) : (
            <ul className="fs-list">
              {upcoming.map((entry) => (
                <li key={entry.id} className="fs-list-row">
                  <span className="fs-avatar fs-avatar-soft">
                    <CalendarClock size={15} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fs-sm fs-truncate" style={{ color: 'var(--text-1)' }}>
                      {entry.description}
                    </div>
                    <div className="fs-xs fs-dim-2">
                      {titleCase(entry.frequency)} · next{' '}
                      {prettyDate(entry.nextRunDate, { year: undefined })}
                    </div>
                  </div>

                  <strong className="fs-num fs-sm">{money(entry.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ---------------- ACCOUNTS STRIP ---------------- */}
      <section>
        <SectionHead
          title="Accounts"
          description="Live balances maintained by database triggers"
          action={
            <Button
              size="sm"
              icon={Landmark}
              onClick={() => navigate('/accounts')}
            >
              Manage accounts
            </Button>
          }
        />

        {model.accounts.length === 0 ? (
          <Card>
            <EmptyState
              icon={Landmark}
              title="No accounts"
              message="Add a bank, wallet or card account to begin tracking."
              action={
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => navigate('/accounts?new=1')}
                >
                  Add account
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="fs-grid fs-grid-4">
            {model.accounts.slice(0, 8).map((account, index) => (
              <div
                key={account.id}
                className="fs-card fs-card-pad is-interactive fs-reveal"
                style={{ '--i': index }}
              >
                <div className="fs-row-between fs-mb-8">
                  <span className="fs-badge fs-badge-neutral">
                    {titleCase(account.type)}
                  </span>
                  <span
                    className="fs-live-dot"
                    style={{
                      background: account.active ? 'var(--mint)' : 'var(--text-4)',
                      boxShadow: 'none',
                    }}
                  />
                </div>

                <div className="fs-sm fs-truncate" style={{ color: 'var(--text-1)' }}>
                  {account.name}
                </div>

                <div
                  className="fs-num"
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    marginTop: 4,
                    color: account.balance < 0 ? 'var(--rose)' : 'var(--text-1)',
                  }}
                >
                  {money(account.balance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- MONTHLY BARS ---------------- */}
      {model.monthly.length > 1 && (
        <Card
          title="Expense distribution"
          subtitle="Compare each recorded month"
          icon={TrendingDown}
        >
          <BarChart
            data={model.monthly.slice(-8).map((row) => ({
              label: monthLabel(row.month),
              value: num(row.total_expenses),
            }))}
            height={190}
          />
        </Card>
      )}
    </div>
  );
}
