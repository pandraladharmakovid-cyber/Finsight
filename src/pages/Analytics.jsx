import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CreditCard,
  PieChart,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import SectionHead from '../components/ui/SectionHead.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui/States.jsx';
import {
  AreaChart,
  BarChart,
  DonutChart,
  ProgressRing,
} from '../components/charts/index.jsx';

import { api } from '../lib/api.js';
import { useResource } from '../lib/hooks.jsx';
import {
  asArray,
  clamp,
  money,
  moneyShort,
  monthLabel,
  normaliseBudget,
  normaliseDebt,
  normaliseGoal,
  num,
  percent,
  titleCase,
  unwrap,
} from '../lib/format.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'spending', label: 'Spending', icon: PieChart },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'savings', label: 'Savings', icon: PiggyBank },
  { id: 'debts', label: 'Debts', icon: CreditCard },
];

export default function Analytics() {
  const [tab, setTab] = useState('overview');

  const financialRes = useResource(() => api.analyticsFinancial(), []);

  const data = useMemo(() => {
    const payload = unwrap(financialRes.data) ?? {};

    const spending = payload.spending ?? {};

    const categorySpending = asArray(spending.categorySpending).map((row) => ({
      label: row.category_name ?? 'Other',
      value: num(row.total_spent),
    }));

    const monthly = asArray(spending.monthlyExpenseAnalysis).map((row) => ({
      label: monthLabel(row.month),
      value: num(row.total_expenses),
    }));

    const budgets = asArray(payload.budgets).map((row) =>
      normaliseBudget(row, asArray(payload.budgets)),
    );

    const accounts = asArray(payload.accounts);
    const savings = asArray(payload.savings).map(normaliseGoal);
    const debts = asArray(payload.debts).map(normaliseDebt);

    const totalSpent = categorySpending.reduce((total, row) => total + row.value, 0);
    const totalBudget = budgets.reduce((total, budget) => total + budget.amount, 0);
    const budgetSpent = budgets.reduce((total, budget) => total + budget.spent, 0);
    const totalSaved = savings.reduce((total, goal) => total + goal.saved, 0);
    const totalTarget = savings.reduce((total, goal) => total + goal.target, 0);
    const totalDebt = debts
      .filter((debt) => debt.status !== 'PAID')
      .reduce((total, debt) => total + debt.remaining, 0);
    const liquid = accounts.reduce(
      (total, account) => total + num(account.balance),
      0,
    );

    return {
      categorySpending,
      monthly,
      budgets,
      accounts,
      savings,
      debts,
      totalSpent,
      totalBudget,
      budgetSpent,
      totalSaved,
      totalTarget,
      totalDebt,
      liquid,
      savingsProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      budgetUtilisation:
        totalBudget > 0 ? (budgetSpent / totalBudget) * 100 : 0,
    };
  }, [financialRes.data]);

  if (financialRes.error) {
    return (
      <ErrorState
        error={financialRes.error}
        onRetry={financialRes.reload}
        title="Analytics could not load"
      />
    );
  }

  if (financialRes.loading) {
    return (
      <div className="fs-grid fs-grid-2">
        {[0, 1, 2, 3].map((index) => (
          <CardSkeleton key={index} rows={5} />
        ))}
      </div>
    );
  }

  const hasData =
    data.categorySpending.length ||
    data.monthly.length ||
    data.budgets.length ||
    data.savings.length;

  if (!hasData) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          message="Record transactions, budgets and goals — analytics builds itself from the database views."
        />
      </Card>
    );
  }

  const topCategory = data.categorySpending
    .slice()
    .sort((a, b) => b.value - a.value)[0];

  return (
    <div className="fs-col fs-gap-20">
      {/* Tabs */}
      <div className="fs-row-between fs-wrap">
        <div className="fs-tabs" style={{ flexWrap: 'wrap' }}>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`fs-tab ${tab === item.id ? 'is-on' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="fs-row fs-gap-4">
                <item.icon size={12} />
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- OVERVIEW ---------------- */}
      {tab === 'overview' && (
        <>
          <section className="fs-grid fs-grid-4">
            <StatCard
              label="Liquid capital"
              value={data.liquid}
              icon={Wallet}
              tone="cyan"
              footnote="across all accounts"
            />
            <StatCard
              label="Total spending"
              value={data.totalSpent}
              icon={TrendingDown}
              tone="rose"
              delay={1}
              footnote={
                topCategory ? `top: ${topCategory.label}` : 'no spending yet'
              }
            />
            <StatCard
              label="Savings funded"
              value={data.totalSaved}
              icon={PiggyBank}
              tone="mint"
              delay={2}
              footnote={`${Math.round(data.savingsProgress)}% of targets`}
            />
            <StatCard
              label="Outstanding debt"
              value={data.totalDebt}
              icon={CreditCard}
              tone="amber"
              delay={3}
              footnote="active liabilities"
            />
          </section>

          <section className="fs-grid" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)' }}>
            <Card
              title="Monthly expense trend"
              subtitle="Derived from the monthly_expense_analysis view"
              icon={TrendingDown}
            >
              {data.monthly.length ? (
                <AreaChart data={data.monthly} height={250} />
              ) : (
                <EmptyState
                  icon={TrendingDown}
                  title="No monthly data"
                  message="Expense history appears once transactions span a month."
                />
              )}
            </Card>

            <Card title="Category mix" subtitle="Share of total spending" icon={PieChart}>
              <DonutChart data={data.categorySpending} size={180} centerLabel="SPENT" />
            </Card>
          </section>

          <section className="fs-grid fs-grid-2">
            <Card title="Budget utilisation" subtitle="Allocated vs consumed" icon={Target}>
              {data.budgets.length ? (
                <BarChart
                  horizontal
                  data={data.budgets.map((budget) => ({
                    label: budget.categoryName,
                    value: budget.spent,
                  }))}
                  height={230}
                />
              ) : (
                <EmptyState
                  icon={Target}
                  title="No budgets"
                  message="Create a budget to see utilisation analysis."
                />
              )}
            </Card>

            <Card title="Savings progress" subtitle="Each goal against its target" icon={PiggyBank}>
              {data.savings.length ? (
                <div className="fs-col fs-gap-14">
                  {data.savings.slice(0, 5).map((goal) => (
                    <div key={goal.id} className="fs-row fs-gap-12">
                      <ProgressRing
                        value={goal.progress}
                        size={46}
                        thickness={5}
                        color="var(--mint)"
                        color2="var(--cyan)"
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="fs-row-between">
                          <span
                            className="fs-sm fs-truncate"
                            style={{ color: 'var(--text-1)' }}
                          >
                            {goal.name}
                          </span>
                          <span className="fs-xs fs-dim fs-num">
                            {money(goal.saved)} / {money(goal.target)}
                          </span>
                        </div>
                        <div className="fs-meter fs-mt-4">
                          <span
                            style={{
                              width: `${clamp(goal.progress, 0, 100)}%`,
                              '--meter-fill': 'linear-gradient(90deg,#34d399,#6ee7b7)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={PiggyBank}
                  title="No savings goals"
                  message="Create a goal to track funding progress."
                />
              )}
            </Card>
          </section>
        </>
      )}

      {/* ---------------- SPENDING ---------------- */}
      {tab === 'spending' && (
        <>
          <section className="fs-grid fs-grid-3">
            <StatCard
              label="Tracked spend"
              value={data.totalSpent}
              icon={TrendingDown}
              tone="rose"
            />
            <StatCard
              label="Categories used"
              value={data.categorySpending.length}
              icon={PieChart}
              tone="violet"
              delay={1}
              format={(n) => Math.round(n).toString()}
            />
            <StatCard
              label="Top category"
              value={topCategory?.value ?? 0}
              icon={TrendingUp}
              tone="amber"
              delay={2}
              footnote={topCategory?.label ?? '—'}
            />
          </section>

          <Card title="Spend by category" subtitle="Ranked by total amount" icon={PieChart}>
            <BarChart
              horizontal
              data={[...data.categorySpending].sort((a, b) => b.value - a.value)}
              height={260}
            />
          </Card>

          <section className="fs-grid fs-grid-2">
            <Card title="Distribution" subtitle="Share of wallet" icon={PieChart}>
              <DonutChart data={data.categorySpending} size={200} />
            </Card>

            <Card title="Monthly comparison" subtitle="Total expenses per month" icon={TrendingDown}>
              {data.monthly.length ? (
                <BarChart data={data.monthly} height={220} />
              ) : (
                <EmptyState
                  icon={TrendingDown}
                  title="No monthly history"
                  message="Not enough dated transactions yet."
                />
              )}
            </Card>
          </section>
        </>
      )}

      {/* ---------------- BUDGETS ---------------- */}
      {tab === 'budgets' && (
        <>
          <section className="fs-grid fs-grid-3">
            <StatCard
              label="Allocated"
              value={data.totalBudget}
              icon={Target}
              tone="violet"
            />
            <StatCard
              label="Consumed"
              value={data.budgetSpent}
              icon={TrendingDown}
              tone="rose"
              delay={1}
              footnote={percent(data.budgetUtilisation)}
            />
            <StatCard
              label="Remaining"
              value={Math.max(data.totalBudget - data.budgetSpent, 0)}
              icon={TrendingUp}
              tone="mint"
              delay={2}
            />
          </section>

          <Card title="Performance per budget" subtitle="Spent against limit" icon={Target}>
            {data.budgets.length ? (
              <div className="fs-table-wrap">
                <table className="fs-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="fs-right">Limit</th>
                      <th className="fs-right">Spent</th>
                      <th className="fs-right">Remaining</th>
                      <th style={{ width: '30%' }}>Utilisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.budgets.map((budget) => {
                      const used =
                        budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                      const over = used > 100;

                      return (
                        <tr key={budget.id}>
                          <td style={{ color: 'var(--text-1)' }}>
                            {budget.categoryName}
                          </td>
                          <td className="is-amount">{money(budget.amount)}</td>
                          <td className="is-amount">{money(budget.spent)}</td>
                          <td
                            className="is-amount"
                            style={{ color: over ? 'var(--rose)' : 'var(--mint)' }}
                          >
                            {money(budget.amount - budget.spent)}
                          </td>
                          <td>
                            <div className="fs-row fs-gap-8">
                              <div className="fs-meter" style={{ flex: 1 }}>
                                <span
                                  style={{
                                    width: `${clamp(used, 0, 100)}%`,
                                    '--meter-fill': over
                                      ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
                                      : undefined,
                                  }}
                                />
                              </div>
                              <span className="fs-xs fs-dim fs-num" style={{ width: 42 }}>
                                {used.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No budgets"
                message="Budget performance will appear here once created."
              />
            )}
          </Card>
        </>
      )}

      {/* ---------------- SAVINGS ---------------- */}
      {tab === 'savings' && (
        <>
          <section className="fs-grid fs-grid-3">
            <StatCard
              label="Total saved"
              value={data.totalSaved}
              icon={PiggyBank}
              tone="mint"
            />
            <StatCard
              label="Targets"
              value={data.totalTarget}
              icon={Target}
              tone="violet"
              delay={1}
            />
            <StatCard
              label="Overall progress"
              value={data.savingsProgress}
              icon={TrendingUp}
              tone="cyan"
              delay={2}
              format={(n) => `${n.toFixed(1)}%`}
            />
          </section>

          <Card title="Goal funding" subtitle="Progress toward each target" icon={PiggyBank}>
            {data.savings.length ? (
              <div className="fs-grid fs-grid-2">
                {data.savings.map((goal) => (
                  <div
                    key={goal.id}
                    className="fs-row fs-gap-14"
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-stroke)',
                    }}
                  >
                    <ProgressRing
                      value={goal.progress}
                      size={58}
                      thickness={6}
                      color="var(--mint)"
                      color2="var(--cyan)"
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fs-row-between">
                        <span className="fs-sm fs-truncate" style={{ color: 'var(--text-1)' }}>
                          {goal.name}
                        </span>
                        <span className="fs-badge fs-badge-neutral">
                          {titleCase(goal.status)}
                        </span>
                      </div>

                      <div className="fs-xs fs-dim fs-mt-4">
                        {money(goal.saved)} of {money(goal.target)} ·{' '}
                        {money(goal.remaining)} to go
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={PiggyBank}
                title="No savings goals"
                message="Create a goal to see funding analysis."
              />
            )}
          </Card>
        </>
      )}

      {/* ---------------- DEBTS ---------------- */}
      {tab === 'debts' && (
        <>
          <section className="fs-grid fs-grid-3">
            <StatCard
              label="Outstanding"
              value={data.totalDebt}
              icon={CreditCard}
              tone="rose"
            />
            <StatCard
              label="Active debts"
              value={data.debts.filter((debt) => debt.status !== 'PAID').length}
              icon={CreditCard}
              tone="amber"
              delay={1}
              format={(n) => Math.round(n).toString()}
            />
            <StatCard
              label="Monthly minimums"
              value={data.debts.reduce(
                (total, debt) => total + debt.minimumPayment,
                0,
              )}
              icon={Wallet}
              tone="violet"
              delay={2}
            />
          </section>

          <Card title="Liability breakdown" subtitle="Balance remaining per debt" icon={CreditCard}>
            {data.debts.length ? (
              <div className="fs-table-wrap">
                <table className="fs-table">
                  <thead>
                    <tr>
                      <th>Debt</th>
                      <th>Lender</th>
                      <th className="fs-right">Principal</th>
                      <th className="fs-right">Remaining</th>
                      <th className="fs-right">APR</th>
                      <th className="fs-right">Repaid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.debts.map((debt) => (
                      <tr key={debt.id}>
                        <td style={{ color: 'var(--text-1)' }}>{debt.name}</td>
                        <td className="fs-dim">{debt.lender}</td>
                        <td className="is-amount">{money(debt.principal)}</td>
                        <td className="is-amount" style={{ color: 'var(--rose)' }}>
                          {money(debt.remaining)}
                        </td>
                        <td className="is-amount fs-dim">{debt.interestRate}%</td>
                        <td className="is-amount" style={{ color: 'var(--mint)' }}>
                          {debt.progress.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={CreditCard}
                title="No debts recorded"
                message="Add liabilities to see payoff analysis."
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
