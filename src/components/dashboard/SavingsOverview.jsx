import React, { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import Card from '../ui/Card.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import Badge from '../ui/Badge.jsx';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function money(value) {
  return currency.format(
    Math.abs(Number(value) || 0),
  );
}

function normalizeGoal(goal, index) {
  const target = Number(
    goal?.targetAmount ??
      goal?.target_amount ??
      goal?.goalAmount ??
      goal?.goal_amount ??
      goal?.amount ??
      0,
  );

  const saved = Number(
    goal?.currentAmount ??
      goal?.current_amount ??
      goal?.savedAmount ??
      goal?.saved_amount ??
      goal?.balance ??
      goal?.amountSaved ??
      0,
  );

  const percentage =
    target > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (saved / target) * 100,
          ),
        )
      : Number(
          goal?.percentage ??
            goal?.progress ??
            0,
        );

  return {
    id:
      goal?.id ??
      goal?.goalId ??
      goal?.goal_id ??
      `goal-${index}`,

    name:
      goal?.name ??
      goal?.goalName ??
      goal?.goal_name ??
      goal?.title ??
      'Savings goal',

    target,
    saved,
    percentage,

    deadline:
      goal?.deadline ??
      goal?.targetDate ??
      goal?.target_date ??
      null,

    category:
      goal?.category ??
      goal?.categoryName ??
      goal?.category_name ??
      'Goal',

    raw: goal,
  };
}

function formatDeadline(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
    },
  ).format(date);
}

export default function SavingsOverview({
  goals = [],
  loading = false,
  error = null,
  onViewAll,
  onGoalClick,
  title = 'Savings intelligence',
  subtitle = 'Track progress toward your financial goals',
  limit = 4,
}) {
  const normalizedGoals = useMemo(
    () =>
      Array.isArray(goals)
        ? goals
            .map(normalizeGoal)
            .slice(0, limit)
        : [],
    [goals, limit],
  );

  const totals = useMemo(() => {
    const target = normalizedGoals.reduce(
      (sum, goal) => sum + goal.target,
      0,
    );

    const saved = normalizedGoals.reduce(
      (sum, goal) => sum + goal.saved,
      0,
    );

    return {
      target,
      saved,
      percentage:
        target > 0
          ? Math.min(
              100,
              (saved / target) * 100,
            )
          : 0,
    };
  }, [normalizedGoals]);

  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={PiggyBank}
      iconColor="#34d399"
      actions={
        onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              border: 0,
              background: 'transparent',
              color: '#6ee7b7',
              fontSize: 10,
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            All goals
            <ArrowRight size={13} />
          </button>
        )
      }
      padding="lg"
      radius="xl"
      glow
    >
      {loading ? (
        <div
          style={{
            display: 'grid',
            gap: 11,
          }}
        >
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <div
                key={index}
                style={{
                  height: 78,
                  borderRadius: 15,
                  background:
                    'linear-gradient(110deg, rgba(255,255,255,.025), rgba(255,255,255,.065), rgba(255,255,255,.025))',
                  backgroundSize: '200% 100%',
                  animation:
                    'fs-savings-skeleton 1.7s ease-in-out infinite',
                  animationDelay: `${index * 100}ms`,
                }}
              />
            ),
          )}

          <style>{`
            @keyframes fs-savings-skeleton {
              0% { background-position: 100% 0; }
              50% { background-position: 0% 0; }
              100% { background-position: -100% 0; }
            }
          `}</style>
        </div>
      ) : error ? (
        <div
          style={{
            minHeight: 170,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
          }}
        >
          <div>
            <div
              style={{
                width: 48,
                height: 48,
                margin: '0 auto 11px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 15,
                color: '#fda4af',
                background:
                  'rgba(244,63,94,.08)',
                border:
                  '1px solid rgba(244,63,94,.14)',
              }}
            >
              <PiggyBank size={20} />
            </div>

            <div
              style={{
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Savings data unavailable
            </div>

            <div
              style={{
                marginTop: 4,
                color: '#64748b',
                fontSize: 10,
              }}
            >
              {error.message ||
                'Unable to load savings goals.'}
            </div>
          </div>
        </div>
      ) : normalizedGoals.length === 0 ? (
        <div
          style={{
            minHeight: 170,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: 18,
          }}
        >
          <div>
            <div
              style={{
                width: 54,
                height: 54,
                margin: '0 auto 12px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 17,
                color: '#34d399',
                background:
                  'linear-gradient(135deg, rgba(16,185,129,.14), rgba(6,182,212,.05))',
                border:
                  '1px solid rgba(52,211,153,.18)',
              }}
            >
              <Target size={22} />
            </div>

            <div
              style={{
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 750,
              }}
            >
              No savings goals yet
            </div>

            <div
              style={{
                maxWidth: 240,
                margin:
                  '5px auto 0',
                color: '#64748b',
                fontSize: 10,
                lineHeight: 1.5,
              }}
            >
              Create a goal and turn your future plans
              into measurable financial progress.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: 15,
              marginBottom: 12,
              borderRadius: 17,
              border:
                '1px solid rgba(52,211,153,.12)',
              background:
                'linear-gradient(135deg, rgba(16,185,129,.075), rgba(6,182,212,.025))',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                right: -55,
                top: -65,
                borderRadius: '50%',
                background:
                  'rgba(52,211,153,.10)',
                filter: 'blur(30px)',
              }}
            />

            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#6ee7b7',
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '.08em',
                    textTransform:
                      'uppercase',
                  }}
                >
                  <Sparkles size={11} />
                  Goal progress
                </div>

                <div
                  style={{
                    marginTop: 6,
                    color: '#f8fafc',
                    fontSize: 21,
                    fontWeight: 850,
                    letterSpacing: '-.035em',
                  }}
                >
                  {money(totals.saved)}
                </div>

                <div
                  style={{
                    marginTop: 3,
                    color: '#64748b',
                    fontSize: 9,
                  }}
                >
                  of {money(totals.target)} target
                </div>
              </div>

              <div
                style={{
                  minWidth: 54,
                  height: 54,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  border:
                    '1px solid rgba(52,211,153,.22)',
                  background:
                    'rgba(16,185,129,.08)',
                  color: '#6ee7b7',
                  fontSize: 12,
                  fontWeight: 850,
                }}
              >
                {Math.round(
                  totals.percentage,
                )}
                %
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                marginTop: 12,
              }}
            >
              <ProgressBar
                value={totals.saved}
                max={
                  totals.target || 100
                }
                variant="success"
                showPercentage={false}
                height={7}
                animated
                glow
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 8,
            }}
          >
            {normalizedGoals.map(
              (goal) => {
                const completed =
                  goal.percentage >=
                  100;

                const remaining =
                  Math.max(
                    0,
                    goal.target -
                      goal.saved,
                  );

                const deadline =
                  formatDeadline(
                    goal.deadline,
                  );

                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() =>
                      onGoalClick?.(
                        goal.raw,
                      )
                    }
                    style={{
                      width: '100%',
                      padding: 11,
                      borderRadius: 14,
                      border:
                        '1px solid rgba(148,163,184,.08)',
                      background:
                        'rgba(255,255,255,.018)',
                      color: 'inherit',
                      textAlign: 'left',
                      cursor:
                        onGoalClick
                          ? 'pointer'
                          : 'default',
                      transition:
                        'transform .2s ease, background .2s ease, border-color .2s ease',
                    }}
                    onMouseEnter={(
                      event,
                    ) => {
                      event.currentTarget.style.transform =
                        'translateY(-2px)';
                      event.currentTarget.style.background =
                        'rgba(255,255,255,.04)';
                      event.currentTarget.style.borderColor =
                        'rgba(52,211,153,.18)';
                    }}
                    onMouseLeave={(
                      event,
                    ) => {
                      event.currentTarget.style.transform =
                        'translateY(0)';
                      event.currentTarget.style.background =
                        'rgba(255,255,255,.018)';
                      event.currentTarget.style.borderColor =
                        'rgba(148,163,184,.08)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          flex: '0 0 32px',
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 10,
                          color:
                            completed
                              ? '#6ee7b7'
                              : '#a7f3d0',
                          background:
                            completed
                              ? 'rgba(16,185,129,.11)'
                              : 'rgba(52,211,153,.06)',
                        }}
                      >
                        {completed ? (
                          <CheckCircle2
                            size={16}
                          />
                        ) : (
                          <Flag
                            size={15}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: 7,
                          }}
                        >
                          <span
                            style={{
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              whiteSpace:
                                'nowrap',
                              color:
                                '#e2e8f0',
                              fontSize: 11,
                              fontWeight: 750,
                            }}
                          >
                            {goal.name}
                          </span>

                          {completed && (
                            <Badge
                              size="xs"
                              variant="success"
                            >
                              Complete
                            </Badge>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: 3,
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: 6,
                            color:
                              '#64748b',
                            fontSize: 9,
                          }}
                        >
                          <span>
                            {money(
                              goal.saved,
                            )}{' '}
                            /{' '}
                            {money(
                              goal.target,
                            )}
                          </span>

                          {remaining >
                            0 && (
                            <>
                              <span>
                                •
                              </span>
                              <span>
                                {money(
                                  remaining,
                                )}{' '}
                                left
                              </span>
                            </>
                          )}

                          {deadline && (
                            <>
                              <span>
                                •
                              </span>
                              <span>
                                {deadline}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          color:
                            completed
                              ? '#6ee7b7'
                              : '#94a3b8',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {Math.round(
                          goal.percentage,
                        )}
                        %
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 9,
                      }}
                    >
                      <ProgressBar
                        value={
                          goal.percentage
                        }
                        max={100}
                        variant={
                          completed
                            ? 'success'
                            : goal.percentage >=
                                75
                              ? 'info'
                              : 'default'
                        }
                        showPercentage={
                          false
                        }
                        height={5}
                        animated
                        glow
                      />
                    </div>
                  </button>
                );
              },
            )}
          </div>

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              color: '#475569',
              fontSize: 9,
            }}
          >
            <TrendingUp size={12} />
            Savings progress is calculated from the
            current goal balances.
          </div>
        </>
      )}
    </Card>
  );
}