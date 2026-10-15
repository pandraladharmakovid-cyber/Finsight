import React, { useMemo } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Flag,
  MoreHorizontal,
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import Card from '../ui/Card.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import Badge from '../ui/Badge.jsx';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function money(value) {
  return INR.format(Math.abs(Number(value) || 0));
}

function normalizeGoal(goal = {}) {
  const target = Number(
    goal.targetAmount ??
      goal.target_amount ??
      goal.goalAmount ??
      goal.goal_amount ??
      goal.target ??
      goal.amount ??
      0,
  );

  const saved = Number(
    goal.currentAmount ??
      goal.current_amount ??
      goal.savedAmount ??
      goal.saved_amount ??
      goal.saved ??
      goal.balance ??
      goal.amountSaved ??
      0,
  );

  const percentage =
    target > 0
      ? Math.min(100, Math.max(0, (saved / target) * 100))
      : Number(goal.progress ?? goal.percentage ?? 0);

  return {
    id: goal.id ?? goal.goalId ?? goal.goal_id,
    name:
      goal.name ??
      goal.goalName ??
      goal.goal_name ??
      goal.title ??
      'Savings goal',
    category:
      goal.category ??
      goal.categoryName ??
      goal.category_name ??
      'General',
    target,
    saved,
    percentage,
    deadline:
      goal.deadline ??
      goal.targetDate ??
      goal.target_date ??
      null,
    monthlyContribution:
      Number(
        goal.monthlyContribution ??
          goal.monthly_contribution ??
          goal.contribution ??
          0,
      ),
    raw: goal,
  };
}

function deadlineInfo(value) {
  if (!value) {
    return {
      label: 'No deadline',
      days: null,
    };
  }

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return {
      label: String(value),
      days: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (target.getTime() - today.getTime()) /
      86400000,
  );

  if (days < 0) {
    return {
      label: `${Math.abs(days)}d overdue`,
      days,
    };
  }

  if (days === 0) {
    return {
      label: 'Due today',
      days,
    };
  }

  if (days === 1) {
    return {
      label: 'Due tomorrow',
      days,
    };
  }

  return {
    label: `${days} days left`,
    days,
  };
}

export default function SavingsGoalCard({
  goal,
  onClick,
  onMenu,
  compact = false,
}) {
  const data = useMemo(
    () => normalizeGoal(goal),
    [goal],
  );

  const deadline = deadlineInfo(data.deadline);
  const completed = data.percentage >= 100;
  const overdue =
    deadline.days !== null && deadline.days < 0;

  const remaining = Math.max(
    0,
    data.target - data.saved,
  );

  const color = completed
    ? '#34d399'
    : overdue
      ? '#fb7185'
      : '#a78bfa';

  return (
    <article
      onClick={() => onClick?.(data.raw)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: compact ? 14 : 17,
        borderRadius: 21,
        border: `1px solid ${color}18`,
        background:
          'linear-gradient(145deg, rgba(15,23,42,.9), rgba(2,6,23,.96))',
        boxShadow:
          '0 18px 55px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.025)',
        cursor: onClick ? 'pointer' : 'default',
        transition:
          'transform .22s ease, border-color .22s ease, box-shadow .22s ease',
      }}
      onMouseEnter={(event) => {
        if (!onClick) return;

        event.currentTarget.style.transform =
          'translateY(-3px)';
        event.currentTarget.style.borderColor =
          `${color}38`;
        event.currentTarget.style.boxShadow =
          `0 25px 60px ${color}10`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          'translateY(0)';
        event.currentTarget.style.borderColor =
          `${color}18`;
        event.currentTarget.style.boxShadow =
          '0 18px 55px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.025)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          top: -90,
          right: -75,
          borderRadius: '50%',
          background: `${color}0d`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              flex: '0 0 40px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 13,
              color,
              background: `${color}10`,
              border: `1px solid ${color}1c`,
            }}
          >
            {completed ? (
              <CheckCircle2 size={18} />
            ) : (
              <PiggyBank size={18} />
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#e2e8f0',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {data.name}
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
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#64748b',
                fontSize: 9,
              }}
            >
              <span>{data.category}</span>
              <span>•</span>
              <span>
                {completed
                  ? 'Goal reached'
                  : deadline.label}
              </span>
            </div>
          </div>
        </div>

        {onMenu && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMenu(data.raw);
            }}
            style={{
              width: 29,
              height: 29,
              display: 'grid',
              placeItems: 'center',
              border: 0,
              borderRadius: 9,
              background:
                'rgba(255,255,255,.025)',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={15} />
          </button>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 15,
        }}
      >
        <div>
          <div
            style={{
              color: '#f8fafc',
              fontSize: compact ? 19 : 23,
              lineHeight: 1,
              fontWeight: 850,
              letterSpacing: '-.04em',
            }}
          >
            {money(data.saved)}
          </div>

          <div
            style={{
              marginTop: 5,
              color: '#475569',
              fontSize: 9,
            }}
          >
            of {money(data.target)}
          </div>
        </div>

        <div
          style={{
            width: 58,
            height: 58,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            border: `1px solid ${color}25`,
            background: `${color}08`,
            color,
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {Math.round(data.percentage)}%
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ProgressBar
          value={data.percentage}
          max={100}
          variant={
            completed
              ? 'success'
              : overdue
                ? 'danger'
                : 'default'
          }
          height={8}
          showPercentage={false}
          animated
          glow
        />
      </div>

      {!compact && (
        <>
          <div
            style={{
              marginTop: 13,
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0,1fr))',
              gap: 8,
            }}
          >
            <MiniMetric
              icon={Target}
              label="Remaining"
              value={
                completed
                  ? 'Goal reached'
                  : money(remaining)
              }
              color={color}
            />

            <MiniMetric
              icon={CalendarDays}
              label="Timeline"
              value={deadline.label}
              color={
                overdue
                  ? '#fb7185'
                  : '#64748b'
              }
            />
          </div>

          {data.monthlyContribution > 0 && (
            <div
              style={{
                marginTop: 9,
                padding: '9px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 11,
                background:
                  'rgba(255,255,255,.018)',
                color: '#64748b',
                fontSize: 9,
              }}
            >
              <TrendingUp
                size={12}
                color="#34d399"
              />
              Planned contribution:{' '}
              <strong
                style={{ color: '#94a3b8' }}
              >
                {money(
                  data.monthlyContribution,
                )}
              </strong>
            </div>
          )}
        </>
      )}

      {onClick && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
            color: '#475569',
            fontSize: 9,
          }}
        >
          Open goal
          <ArrowRight size={12} />
        </div>
      )}
    </article>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  color,
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: 9,
        borderRadius: 11,
        background:
          'rgba(255,255,255,.018)',
        border:
          '1px solid rgba(148,163,184,.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          color: '#475569',
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        <Icon size={10} />
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color,
          fontSize: 10,
          fontWeight: 750,
        }}
      >
        {value}
      </div>
    </div>
  );
}