import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  AlertOctagon,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Flag,
  Gauge,
  Info,
  Layers3,
  Maximize2,
  Minus,
  MoreHorizontal,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const COMPACT = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const STATUS_CONFIG = {
  healthy: {
    label: 'Healthy',
    color: '#34d399',
    soft: 'rgba(52,211,153,.09)',
    border: 'rgba(52,211,153,.17)',
    icon: CheckCircle2,
    description: 'Comfortable spending level',
  },

  watch: {
    label: 'Watch',
    color: '#fbbf24',
    soft: 'rgba(251,191,36,.09)',
    border: 'rgba(251,191,36,.17)',
    icon: AlertCircle,
    description: 'Approaching budget limit',
  },

  critical: {
    label: 'Critical',
    color: '#fb923c',
    soft: 'rgba(251,146,60,.09)',
    border: 'rgba(251,146,60,.17)',
    icon: AlertOctagon,
    description: 'Very close to budget limit',
  },

  over: {
    label: 'Over budget',
    color: '#fb7185',
    soft: 'rgba(251,113,133,.09)',
    border: 'rgba(251,113,133,.17)',
    icon: ShieldAlert,
    description: 'Budget has been exceeded',
  },
};

const SORT_OPTIONS = [
  {
    id: 'utilization',
    label: 'Utilization',
  },
  {
    id: 'spent',
    label: 'Amount spent',
  },
  {
    id: 'budget',
    label: 'Budget amount',
  },
  {
    id: 'remaining',
    label: 'Remaining',
  },
  {
    id: 'name',
    label: 'Category name',
  },
];

/* ==========================================================================
   FORMATTERS
   ========================================================================== */

const currency = (value) =>
  INR.format(Number(value) || 0);

const number = (value) =>
  NUMBER.format(Number(value) || 0);

const compactCurrency = (value) => {
  const amount = Number(value) || 0;
  const absolute = Math.abs(amount);

  if (absolute >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (absolute >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (absolute >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(amount)}`;
};

const percent = (value, digits = 1) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '0.0%';
  }

  return `${amount.toFixed(digits)}%`;
};

const clamp = (value, min, max) =>
  Math.min(
    max,
    Math.max(min, Number(value) || 0),
  );

const safeNumber = (...values) => {
  for (const value of values) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const safeString = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    ) {
      return String(value);
    }
  }

  return '';
};

const shortText = (
  value,
  max = 18,
) => {
  const text = String(value || '');

  return text.length > max
    ? `${text.slice(0, max - 1)}…`
    : text;
};

/* ==========================================================================
   NORMALIZATION
   ========================================================================== */

const getBudgetId = (
  item,
  index,
) =>
  item?.budget_id ??
  item?.budgetId ??
  item?.id ??
  `budget-${index}`;

const getBudgetName = (
  item,
  index,
) =>
  safeString(
    item?.category_name,
    item?.categoryName,
    item?.category,
    item?.budget_name,
    item?.budgetName,
    item?.name,
    `Budget ${index + 1}`,
  );

const getBudgetAmount = (item) =>
  safeNumber(
    item?.budget_amount,
    item?.budgetAmount,
    item?.budget,
    item?.amount,
    item?.allocated_amount,
    item?.allocatedAmount,
  );

const getSpentAmount = (item) =>
  safeNumber(
    item?.actual_spending,
    item?.actualSpending,
    item?.spent,
    item?.spending,
    item?.actual_amount,
    item?.actualAmount,
    item?.expense,
    item?.expenses,
  );

const getRemainingAmount = (
  item,
  budget,
  spent,
) => {
  if (
    item?.remaining_budget !==
      undefined &&
    item?.remaining_budget !== null
  ) {
    return safeNumber(
      item.remaining_budget,
    );
  }

  if (
    item?.remainingBudget !==
      undefined &&
    item?.remainingBudget !== null
  ) {
    return safeNumber(
      item.remainingBudget,
    );
  }

  return budget - spent;
};

const getDateValue = (
  item,
  field,
) =>
  safeString(
    item?.[field],
    item?.[
      field.replace(
        /_([a-z])/g,
        (_, letter) =>
          letter.toUpperCase(),
      )
    ],
  );

const calculateUtilization = (
  budget,
  spent,
) =>
  budget > 0
    ? (spent / budget) * 100
    : 0;

const calculateStatus = (
  utilization,
) => {
  if (utilization > 100) {
    return 'over';
  }

  if (utilization > 90) {
    return 'critical';
  }

  if (utilization > 75) {
    return 'watch';
  }

  return 'healthy';
};

const normalizeBudget = (
  item,
  index,
) => {
  const budget =
    getBudgetAmount(item);

  const spent =
    getSpentAmount(item);

  const remaining =
    getRemainingAmount(
      item,
      budget,
      spent,
    );

  const utilization =
    calculateUtilization(
      budget,
      spent,
    );

  const status =
    calculateStatus(
      utilization,
    );

  return {
    ...item,

    id: getBudgetId(
      item,
      index,
    ),

    name: getBudgetName(
      item,
      index,
    ),

    budget,

    spent,

    remaining,

    utilization,

    status,

    startDate:
      getDateValue(
        item,
        'start_date',
      ),

    endDate:
      getDateValue(
        item,
        'end_date',
      ),

    categoryId:
      item?.category_id ??
      item?.categoryId ??
      null,

    createdAt:
      item?.created_at ??
      item?.createdAt ??
      null,
  };
};

const normalizeBudgets = (
  data,
) =>
  Array.isArray(data)
    ? data.map(
        normalizeBudget,
      )
    : [];

/* ==========================================================================
   SMALL UTILITIES
   ========================================================================== */

function calculateChange(
  current,
  previous,
) {
  const currentValue =
    Number(current) || 0;

  const previousValue =
    Number(previous) || 0;

  if (
    previousValue === 0
  ) {
    return 0;
  }

  return (
    ((currentValue -
      previousValue) /
      Math.abs(previousValue)) *
    100
  );
}

function getStatusColor(
  status,
) {
  return (
    STATUS_CONFIG[
      status
    ]?.color ||
    '#60a5fa'
  );
}

function getStatusIcon(
  status,
) {
  return (
    STATUS_CONFIG[
      status
    ]?.icon ||
    Info
  );
}

function downloadBudgetCsv(
  budgets,
) {
  if (!budgets.length) {
    return;
  }

  const headers = [
    'Category',
    'Budget',
    'Spent',
    'Remaining',
    'Utilization',
    'Status',
    'Start Date',
    'End Date',
  ];

  const rows =
    budgets.map(
      (item) => [
        item.name,
        item.budget,
        item.spent,
        item.remaining,
        item.utilization.toFixed(2),
        STATUS_CONFIG[
          item.status
        ]?.label ||
          item.status,
        item.startDate,
        item.endDate,
      ],
    );

  const csv = [
    headers,
    ...rows,
  ]
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(
              value ?? '',
            ).replaceAll(
              '"',
              '""',
            )}"`,
        )
        .join(','),
    )
    .join('\n');

  const blob =
    new Blob(
      [csv],
      {
        type:
          'text/csv;charset=utf-8;',
      },
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      'a',
    );

  anchor.href = url;

  anchor.download =
    'finsight-budget-overview.csv';

  anchor.click();

  URL.revokeObjectURL(
    url,
  );
}

/* ==========================================================================
   ANIMATED NUMBER
   ========================================================================== */

function AnimatedNumber({
  value,
  formatter = currency,
  duration = 650,
}) {
  const [
    display,
    setDisplay,
  ] = useState(0);

  const previous =
    useRef(0);

  useEffect(() => {
    const target =
      Number(value) || 0;

    const start =
      Number(
        previous.current,
      ) || 0;

    const started =
      performance.now();

    let frame;

    const animate = (
      now,
    ) => {
      const progress =
        clamp(
          (now - started) /
            duration,
          0,
          1,
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      const next =
        start +
        (target - start) *
          eased;

      setDisplay(next);

      if (
        progress <
        1
      ) {
        frame =
          requestAnimationFrame(
            animate,
          );
      } else {
        previous.current =
          target;
      }
    };

    frame =
      requestAnimationFrame(
        animate,
      );

    return () => {
      if (frame) {
        cancelAnimationFrame(
          frame,
        );
      }
    };
  }, [
    value,
    duration,
  ]);

  return (
    <>
      {formatter(display)}
    </>
  );
}

/* ==========================================================================
   UTILIZATION RING
   ========================================================================== */

function UtilizationRing({
  value,
  size = 92,
  stroke = 7,
  color,
  label = 'used',
  centerLabel = true,
}) {
  const radius =
    (size - stroke) /
    2;

  const circumference =
    2 *
    Math.PI *
    radius;

  const normalized =
    clamp(
      value,
      0,
      100,
    );

  const offset =
    circumference -
    (normalized /
      100) *
      circumference;

  return (
    <div
      className="bo-ring"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,.08)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            color ||
            '#60a5fa'
          }
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            offset
          }
          transform={`rotate(-90 ${
            size / 2
          } ${size / 2})`}
        />
      </svg>

      {centerLabel && (
        <div className="bo-ring-center">
          <strong>
            {Math.round(
              Number(value) || 0,
            )}
            %
          </strong>

          <span>
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   HEADER
   ========================================================================== */

function BudgetHeader({
  title,
  subtitle,
  selectedPeriod,
  onPeriodChange,
  onRefresh,
  onExport,
  onFullscreen,
  onToggleAmounts,
  hiddenAmounts,
  onCreate,
  menuOpen,
  setMenuOpen,
}) {
  return (
    <header className="bo-header">
      <div className="bo-heading">
        <div className="bo-heading-icon">
          <Target
            size={23}
            strokeWidth={1.8}
          />

          <span className="bo-heading-pulse" />
        </div>

        <div className="bo-heading-copy">
          <div className="bo-eyebrow">
            <span className="bo-live-dot" />
            Budget intelligence
          </div>

          <h2 className="bo-title">
            {title}
          </h2>

          <p className="bo-subtitle">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="bo-header-actions">

        <div className="bo-period">
          <CalendarDays
            size={13}
          />

          <select
            value={
              selectedPeriod
            }
            onChange={(event) =>
              onPeriodChange(
                event.target.value,
              )
            }
          >
            <option value="Monthly">
              Monthly
            </option>

            <option value="Quarterly">
              Quarterly
            </option>

            <option value="Yearly">
              Yearly
            </option>
          </select>

          <ChevronDown
            size={12}
          />
        </div>

        {onCreate && (
          <button
            type="button"
            className="bo-primary-button"
            onClick={onCreate}
          >
            <Plus size={14} />
            <span>
              New budget
            </span>
          </button>
        )}

        <button
          type="button"
          className="bo-icon-button"
          onClick={
            onToggleAmounts
          }
          title={
            hiddenAmounts
              ? 'Show amounts'
              : 'Hide amounts'
          }
        >
          {hiddenAmounts ? (
            <EyeOff size={15} />
          ) : (
            <Eye size={15} />
          )}
        </button>

        <button
          type="button"
          className="bo-icon-button"
          onClick={onRefresh}
          title="Refresh budgets"
        >
          <RefreshCw
            size={15}
          />
        </button>

        <div className="bo-menu-wrapper">
          <button
            type="button"
            className="bo-icon-button"
            onClick={() =>
              setMenuOpen(
                (current) =>
                  !current,
              )
            }
          >
            <MoreHorizontal
              size={16}
            />
          </button>

          {menuOpen && (
            <div className="bo-menu">

              <button
                type="button"
                onClick={() => {
                  onExport?.();
                  setMenuOpen(
                    false,
                  );
                }}
              >
                <Download
                  size={13}
                />
                Export budgets
              </button>

              <button
                type="button"
                onClick={() => {
                  onFullscreen?.();
                  setMenuOpen(
                    false,
                  );
                }}
              >
                <Maximize2
                  size={13}
                />
                Fullscreen
              </button>

              <button
                type="button"
                onClick={() =>
                  setMenuOpen(
                    false,
                  )
                }
              >
                <Settings2
                  size={13}
                />
                View settings
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ==========================================================================
   KPI CARD
   ========================================================================== */

function KpiCard({
  icon: Icon,
  label,
  value,
  secondary,
  trend,
  tone = 'blue',
  hidden = false,
}) {
  const positive =
    Number(trend) >= 0;

  return (
    <div
      className={`bo-kpi bo-kpi-${tone}`}
    >
      <div className="bo-kpi-top">
        <div className="bo-kpi-icon">
          <Icon size={16} />
        </div>

        <div className="bo-kpi-signal">
          {trend !== undefined &&
          Number.isFinite(
            Number(trend),
          ) ? (
            <>
              {positive ? (
                <ArrowUpRight
                  size={11}
                />
              ) : (
                <ArrowDownRight
                  size={11}
                />
              )}

              {Math.abs(
                Number(trend),
              ).toFixed(1)}
              %
            </>
          ) : (
            <Minus size={11} />
          )}
        </div>
      </div>

      <div className="bo-kpi-label">
        {label}
      </div>

      <div className="bo-kpi-value">
        {hidden ? (
          <span className="bo-hidden">
            •••••••
          </span>
        ) : (
          value
        )}
      </div>

      {secondary && (
        <div className="bo-kpi-secondary">
          {secondary}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   STATUS FILTER
   ========================================================================== */

function StatusFilter({
  value,
  onChange,
}) {
  const statuses = [
    {
      id: 'all',
      label: 'All',
    },
    {
      id: 'healthy',
      label: 'Healthy',
    },
    {
      id: 'watch',
      label: 'Watch',
    },
    {
      id: 'critical',
      label: 'Critical',
    },
    {
      id: 'over',
      label: 'Over',
    },
  ];

  return (
    <div className="bo-status-filter">
      {statuses.map(
        (status) => (
          <button
            type="button"
            key={status.id}
            className={
              value ===
              status.id
                ? 'bo-status-filter-active'
                : ''
            }
            onClick={() =>
              onChange(
                status.id,
              )
            }
          >
            {status.id !==
              'all' && (
              <span
                style={{
                  background:
                    STATUS_CONFIG[
                      status.id
                    ]?.color,
                }}
              />
            )}

            {status.label}
          </button>
        ),
      )}
    </div>
  );
}

/* ==========================================================================
   BUDGET CARD
   ========================================================================== */

function BudgetCard({
  budget,
  hiddenAmounts,
  selected,
  onSelect,
  onOpen,
}) {
  const config =
    STATUS_CONFIG[
      budget.status
    ] ||
    STATUS_CONFIG.healthy;

  const Icon =
    config.icon;

  const progress =
    clamp(
      budget.utilization,
      0,
      100,
    );

  return (
    <article
      className={`bo-budget-card ${
        selected
          ? 'bo-budget-selected'
          : ''
      }`}
      style={{
        '--budget-color':
          config.color,
        '--budget-soft':
          config.soft,
        '--budget-border':
          config.border,
      }}
    >
      <div className="bo-budget-glow" />

      <div className="bo-budget-card-header">

        <div className="bo-budget-name-wrap">

          <button
            type="button"
            className="bo-select-circle"
            onClick={() =>
              onSelect?.(
                budget,
              )
            }
            aria-label={`Select ${budget.name}`}
          >
            {selected && (
              <Check
                size={10}
              />
            )}
          </button>

          <div className="bo-budget-name-area">

            <div className="bo-budget-category">
              <span className="bo-budget-category-dot" />

              <span>
                {shortText(
                  budget.name,
                  24,
                )}
              </span>
            </div>

            <span className="bo-budget-status-line">
              {config.description}
            </span>

          </div>
        </div>

        <div
          className="bo-budget-status"
          style={{
            color:
              config.color,
            borderColor:
              config.border,
            background:
              config.soft,
          }}
        >
          <Icon size={11} />
          {config.label}
        </div>
      </div>

      <div className="bo-budget-main">

        <div className="bo-budget-numbers">

          <div>
            <span>
              Spent
            </span>

            <strong>
              {hiddenAmounts
                ? '••••••'
                : currency(
                    budget.spent,
                  )}
            </strong>
          </div>

          <div className="bo-budget-separator">
            /
          </div>

          <div>
            <span>
              Budget
            </span>

            <strong>
              {hiddenAmounts
                ? '••••••'
                : currency(
                    budget.budget,
                  )}
            </strong>
          </div>

        </div>

        <div className="bo-budget-percent">
          {percent(
            budget.utilization,
          )}
        </div>
      </div>

      <div className="bo-progress-wrapper">

        <div className="bo-progress-track">

          <div
            className="bo-progress-fill"
            style={{
              width: `${progress}%`,
              background:
                config.color,
            }}
          />

          {budget.utilization >
            75 && (
            <div
              className="bo-progress-marker"
              style={{
                left: '75%',
              }}
            />
          )}

          {budget.utilization >
            90 && (
            <div
              className="bo-progress-marker"
              style={{
                left: '90%',
              }}
            />
          )}

        </div>

        <div className="bo-progress-scale">
          <span>
            0
          </span>

          <span>
            75%
          </span>

          <span>
            90%
          </span>

          <span>
            100%
          </span>
        </div>
      </div>

      <div className="bo-budget-footer">

        <div className="bo-remaining">

          <div className="bo-remaining-icon">
            {budget.remaining >=
            0 ? (
              <TrendingUp
                size={11}
              />
            ) : (
              <TrendingDown
                size={11}
              />
            )}
          </div>

          <div>
            <span>
              {budget.remaining >=
              0
                ? 'Remaining'
                : 'Over by'}
            </span>

            <strong
              className={
                budget.remaining >=
                0
                  ? 'bo-green'
                  : 'bo-red'
              }
            >
              {hiddenAmounts
                ? '••••••'
                : currency(
                    Math.abs(
                      budget.remaining,
                    ),
                  )}
            </strong>
          </div>

        </div>

        <button
          type="button"
          className="bo-details-button"
          onClick={() =>
            onOpen?.(budget)
          }
        >
          Details
          <ArrowRight
            size={11}
          />
        </button>

      </div>
    </article>
  );
}

/* ==========================================================================
   LARGE PERFORMANCE CHART
   ========================================================================== */

function BudgetPerformanceChart({
  budgets,
  hiddenAmounts,
}) {
  const data = useMemo(
    () =>
      budgets
        .slice()
        .sort(
          (a, b) =>
            b.utilization -
            a.utilization,
        )
        .slice(0, 10)
        .map(
          (item) => ({
            name: shortText(
              item.name,
              12,
            ),
            budget:
              item.budget,
            spent:
              item.spent,
            remaining:
              item.remaining,
            utilization:
              Number(
                item.utilization.toFixed(
                  1,
                ),
              ),
          }),
        ),
    [budgets],
  );

  if (!data.length) {
    return (
      <div className="bo-chart-empty">
        <BarChart3 size={20} />
        <span>
          No budget performance data
        </span>
      </div>
    );
  }

  return (
    <div className="bo-performance-chart">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 18,
            left: 8,
            bottom: 5,
          }}
          barGap={5}
        >
          <CartesianGrid
            horizontal={false}
            stroke="rgba(148,163,184,.055)"
          />

          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{
              fill:'#475569',
              fontSize:8,
            }}
            tickFormatter={
              compactCurrency
            }
          />

          <YAxis
            type="category"
            dataKey="name"
            width={85}
            axisLine={false}
            tickLine={false}
            tick={{
              fill:'#64748b',
              fontSize:8,
            }}
          />

          <Tooltip
            cursor={{
              fill:
                'rgba(148,163,184,.025)',
            }}
            content={({
              active,
              payload,
              label,
            }) => {
              if (
                !active ||
                !payload?.length
              ) {
                return null;
              }

              const item =
                payload[0]
                  ?.payload;

              return (
                <div className="bo-chart-tooltip">
                  <strong>
                    {label}
                  </strong>

                  <div>
                    <span>
                      Budget
                    </span>

                    <b>
                      {hiddenAmounts
                        ? '••••••'
                        : currency(
                            item.budget,
                          )}
                    </b>
                  </div>

                  <div>
                    <span>
                      Spent
                    </span>

                    <b>
                      {hiddenAmounts
                        ? '••••••'
                        : currency(
                            item.spent,
                          )}
                    </b>
                  </div>

                  <div>
                    <span>
                      Utilization
                    </span>

                    <b>
                      {percent(
                        item.utilization,
                      )}
                    </b>
                  </div>
                </div>
              );
            }}
          />

          <Bar
            dataKey="budget"
            name="Budget"
            fill="rgba(96,165,250,.18)"
            radius={[
              0,
              5,
              5,
              0,
            ]}
            maxBarSize={13}
          />

          <Bar
            dataKey="spent"
            name="Spent"
            radius={[
              0,
              5,
              5,
              0,
            ]}
            maxBarSize={13}
          >
            {data.map(
              (entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.utilization >
                    100
                      ? '#fb7185'
                      : entry.utilization >
                        90
                      ? '#fb923c'
                      : entry.utilization >
                        75
                      ? '#fbbf24'
                      : '#34d399'
                  }
                />
              ),
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ==========================================================================
   ALLOCATION DONUT
   ========================================================================== */

function AllocationDonut({
  budgets,
  hiddenAmounts,
}) {
  const data =
    budgets
      .filter(
        (item) =>
          item.budget > 0,
      )
      .sort(
        (a, b) =>
          b.budget -
          a.budget,
      )
      .slice(0, 7)
      .map(
        (item) => ({
          name: item.name,
          value: item.budget,
        }),
      );

  const total =
    data.reduce(
      (sum, item) =>
        sum + item.value,
      0,
    );

  const colors = [
    '#60a5fa',
    '#34d399',
    '#a78bfa',
    '#fbbf24',
    '#fb7185',
    '#22d3ee',
    '#f97316',
  ];

  if (!data.length) {
    return (
      <div className="bo-chart-empty">
        <PieChartIcon
          size={20}
        />

        <span>
          No allocation data
        </span>
      </div>
    );
  }

  return (
    <div className="bo-allocation-layout">

      <div className="bo-donut">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map(
                (item, index) => (
                  <Cell
                    key={item.name}
                    fill={
                      colors[
                        index %
                          colors.length
                      ]
                    }
                  />
                ),
              )}
            </Pie>

            <Tooltip
              content={({
                active,
                payload,
              }) => {
                if (
                  !active ||
                  !payload?.length
                ) {
                  return null;
                }

                const item =
                  payload[0];

                return (
                  <div className="bo-chart-tooltip">
                    <strong>
                      {item.name}
                    </strong>

                    <div>
                      <span>
                        Allocation
                      </span>

                      <b>
                        {hiddenAmounts
                          ? '••••••'
                          : currency(
                              item.value,
                            )}
                      </b>
                    </div>

                    <div>
                      <span>
                        Share
                      </span>

                      <b>
                        {total >
                        0
                          ? percent(
                              (item.value /
                                total) *
                                100,
                            )
                          : '0%'}
                      </b>
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="bo-donut-center">
          <span>
            Total
          </span>

          <strong>
            {hiddenAmounts
              ? '••••'
              : compactCurrency(
                  total,
                )}
          </strong>
        </div>
      </div>

      <div className="bo-allocation-list">
        {data.map(
          (
            item,
            index,
          ) => (
            <div
              className="bo-allocation-item"
              key={item.name}
            >
              <div className="bo-allocation-label">
                <span
                  style={{
                    background:
                      colors[
                        index %
                          colors.length
                      ],
                  }}
                />

                <span>
                  {shortText(
                    item.name,
                    18,
                  )}
                </span>
              </div>

              <strong>
                {total >
                0
                  ? percent(
                      (item.value /
                        total) *
                        100,
                    )
                  : '0%'}
              </strong>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   RADAR HEALTH
   ========================================================================== */

function BudgetHealthRadar({
  totals,
}) {
  const utilization =
    clamp(
      totals.utilization,
      0,
      100,
    );

  const remainingRatio =
    totals.totalBudget >
    0
      ? clamp(
          (totals.totalRemaining /
            totals.totalBudget) *
            100,
          0,
          100,
        )
      : 0;

  const discipline =
    clamp(
      100 -
        Math.max(
          0,
          utilization -
            65,
        ) *
          2,
      0,
      100,
    );

  const coverage =
    clamp(
      totals.count *
        12.5,
      0,
      100,
    );

  const health =
    clamp(
      (discipline +
        remainingRatio +
        coverage) /
        3,
      0,
      100,
    );

  const data = [
    {
      subject:'Control',
      value:discipline,
      fullMark:100,
    },
    {
      subject:'Remaining',
      value:remainingRatio,
      fullMark:100,
    },
    {
      subject:'Coverage',
      value:coverage,
      fullMark:100,
    },
    {
      subject:'Efficiency',
      value:clamp(
        100 -
          Math.max(
            0,
            utilization -
              50,
          ),
        0,
        100,
      ),
      fullMark:100,
    },
    {
      subject:'Stability',
      value:clamp(
        100 -
          Math.max(
            0,
            utilization -
              70,
          ) *
            3,
        0,
        100,
      ),
      fullMark:100,
    },
  ];

  return (
    <div className="bo-health-layout">

      <div className="bo-health-radar">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <RadarChart
            data={data}
            cx="50%"
            cy="50%"
            outerRadius="68%"
          >
            <PolarGrid
              stroke="rgba(148,163,184,.09)"
            />

            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill:'#64748b',
                fontSize:7,
              }}
            />

            <PolarRadiusAxis
              angle={30}
              domain={[0,100]}
              tick={false}
              axisLine={false}
            />

            <Radar
              dataKey="value"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity=".13"
              strokeWidth={1.8}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="bo-health-score">

        <span>
          Budget health
        </span>

        <strong>
          {Math.round(
            health,
          )}
        </strong>

        <small>
          / 100
        </small>

        <div className="bo-health-meter">
          <span
            style={{
              width:`${health}%`,
              background:
                health >= 75
                  ? '#34d399'
                  : health >= 50
                  ? '#fbbf24'
                  : '#fb7185',
            }}
          />
        </div>

        <p>
          {health >= 75
            ? 'Your current allocation is under healthy control.'
            : health >= 50
            ? 'Some budget areas require closer attention.'
            : 'Several budget signals indicate elevated risk.'}
        </p>

      </div>

    </div>
  );
}

/* ==========================================================================
   DETAIL MODAL
   ========================================================================== */

function BudgetDetailsModal({
  budget,
  hiddenAmounts,
  onClose,
}) {
  if (!budget) {
    return null;
  }

  const config =
    STATUS_CONFIG[
      budget.status
    ] ||
    STATUS_CONFIG.healthy;

  const Icon =
    config.icon;

  const overspend =
    Math.max(
      0,
      -budget.remaining,
    );

  const dailyAllowance =
    budget.remaining >
    0
      ? budget.remaining /
        Math.max(
          1,
          30,
        )
      : 0;

  return (
    <div
      className="bo-modal-backdrop"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="bo-modal">

        <div className="bo-modal-header">

          <div>
            <div className="bo-modal-eyebrow">
              Budget intelligence
            </div>

            <h3>
              {budget.name}
            </h3>

            <p>
              Detailed performance
              and allocation analysis
            </p>
          </div>

          <button
            type="button"
            className="bo-icon-button"
            onClick={onClose}
          >
            <X size={16} />
          </button>

        </div>

        <div
          className="bo-modal-status"
          style={{
            color:config.color,
            background:config.soft,
            borderColor:config.border,
          }}
        >
          <Icon size={14} />

          <div>
            <strong>
              {config.label}
            </strong>

            <span>
              {config.description}
            </span>
          </div>
        </div>

        <div className="bo-modal-grid">

          <div className="bo-modal-card bo-modal-primary">

            <UtilizationRing
              value={
                budget.utilization
              }
              size={112}
              stroke={8}
              color={
                config.color
              }
            />

            <div>
              <span>
                Utilization
              </span>

              <strong>
                {percent(
                  budget.utilization,
                )}
              </strong>

              <small>
                of allocated budget
              </small>
            </div>

          </div>

          <div className="bo-modal-card">

            <span>
              Allocated
            </span>

            <strong>
              {hiddenAmounts
                ? '••••••'
                : currency(
                    budget.budget,
                  )}
            </strong>

            <small>
              Planned amount
            </small>

          </div>

          <div className="bo-modal-card">

            <span>
              Actual spending
            </span>

            <strong>
              {hiddenAmounts
                ? '••••••'
                : currency(
                    budget.spent,
                  )}
            </strong>

            <small>
              Recorded expenses
            </small>

          </div>

          <div className="bo-modal-card">

            <span>
              {budget.remaining >=
              0
                ? 'Remaining'
                : 'Overspent'}
            </span>

            <strong
              className={
                budget.remaining >=
                0
                  ? 'bo-green'
                  : 'bo-red'
              }
            >
              {hiddenAmounts
                ? '••••••'
                : currency(
                    Math.abs(
                      budget.remaining,
                    ),
                  )}
            </strong>

            <small>
              {budget.remaining >=
              0
                ? 'Available capacity'
                : 'Above allocation'}
            </small>

          </div>

        </div>

        <div className="bo-modal-section">

          <div className="bo-modal-section-title">
            <Gauge size={13} />
            Spending trajectory
          </div>

          <div className="bo-modal-progress">

            <div className="bo-modal-progress-track">

              <div
                className="bo-modal-progress-fill"
                style={{
                  width:`${clamp(
                    budget.utilization,
                    0,
                    100,
                  )}%`,
                  background:
                    config.color,
                }}
              />

            </div>

            <div className="bo-modal-progress-labels">
              <span>
                0%
              </span>

              <span>
                50%
              </span>

              <span>
                75%
              </span>

              <span>
                90%
              </span>

              <span>
                100%
              </span>
            </div>

          </div>

        </div>

        <div className="bo-modal-grid bo-modal-grid-small">

          <div className="bo-modal-info">
            <Calendar size={13} />

            <div>
              <span>
                Start date
              </span>

              <strong>
                {budget.startDate ||
                  'Not specified'}
              </strong>
            </div>
          </div>

          <div className="bo-modal-info">
            <Calendar size={13} />

            <div>
              <span>
                End date
              </span>

              <strong>
                {budget.endDate ||
                  'Not specified'}
              </strong>
            </div>
          </div>

          <div className="bo-modal-info">
            <Wallet size={13} />

            <div>
              <span>
                Daily capacity
              </span>

              <strong>
                {hiddenAmounts
                  ? '••••••'
                  : currency(
                      dailyAllowance,
                    )}
              </strong>
            </div>
          </div>

          <div className="bo-modal-info">
            <ShieldAlert size={13} />

            <div>
              <span>
                Risk level
              </span>

              <strong>
                {budget.status ===
                'healthy'
                  ? 'Low'
                  : budget.status ===
                    'watch'
                  ? 'Moderate'
                  : 'High'}
              </strong>
            </div>
          </div>

        </div>

        {overspend > 0 && (
          <div className="bo-modal-warning">
            <AlertOctagon size={15} />

            <div>
              <strong>
                Budget exceeded
              </strong>

              <span>
                This category is currently{' '}
                {hiddenAmounts
                  ? '••••••'
                  : currency(
                      overspend,
                    )}{' '}
                above its planned allocation.
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */

function EmptyBudgets({
  onCreate,
}) {
  return (
    <div className="bo-empty">

      <div className="bo-empty-orbit">
        <div className="bo-empty-orbit-inner">
          <Target
            size={28}
          />
        </div>
      </div>

      <h3>
        No budgets found
      </h3>

      <p>
        Create your first budget to
        start tracking category-level
        spending, utilization, and
        financial risk.
      </p>

      {onCreate && (
        <button
          type="button"
          className="bo-primary-button"
          onClick={onCreate}
        >
          <Plus size={14} />
          Create your first budget
        </button>
      )}

    </div>
  );
}

/* ==========================================================================
   LOADING STATE
   ========================================================================== */

function BudgetLoading() {
  return (
    <div className="bo-loading">

      <div className="bo-loading-kpis">
        {Array.from({
          length:4,
        }).map(
          (_, index) => (
            <div
              className="bo-skeleton-card"
              key={index}
            >
              <div className="bo-skeleton bo-skeleton-icon" />
              <div className="bo-skeleton bo-skeleton-small" />
              <div className="bo-skeleton bo-skeleton-large" />
              <div className="bo-skeleton bo-skeleton-line" />
            </div>
          ),
        )}
      </div>

      <div className="bo-loading-main">

        <div className="bo-skeleton bo-skeleton-header" />

        <div className="bo-skeleton bo-skeleton-chart" />

        <div className="bo-loading-cards">
          {Array.from({
            length:4,
          }).map(
            (_, index) => (
              <div
                className="bo-skeleton-budget"
                key={index}
              >
                <div className="bo-skeleton bo-skeleton-line" />
                <div className="bo-skeleton bo-skeleton-medium" />
                <div className="bo-skeleton bo-skeleton-progress" />
                <div className="bo-skeleton bo-skeleton-line" />
              </div>
            ),
          )}
        </div>

      </div>

    </div>
  );
}

/* ==========================================================================
   ERROR STATE
   ========================================================================== */

function BudgetError({
  onRetry,
  message,
}) {
  return (
    <div className="bo-error">

      <div className="bo-error-icon">
        <AlertOctagon
          size={22}
        />
      </div>

      <h3>
        Budget data unavailable
      </h3>

      <p>
        {message ||
          'FinSight could not load the budget intelligence data.'}
      </p>

      {onRetry && (
        <button
          type="button"
          className="bo-retry"
          onClick={onRetry}
        >
          <RefreshCw
            size={13}
          />
          Retry request
        </button>
      )}

    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function BudgetOverview({
  budgets = [],
  data,
  summary,
  loading = false,
  error = false,
  errorMessage,
  title = 'Budget Overview',
  subtitle =
    'Advanced allocation intelligence, utilization monitoring, and budget risk analysis',
  period = 'Monthly',
  onPeriodChange,
  onRefresh,
  onCreate,
  onBudgetClick,
  onViewAll,
  className = '',
}) {
  const [selectedPeriod, setSelectedPeriod] =
    useState(period);

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [search, setSearch] =
    useState('');

  const [sortBy, setSortBy] =
    useState('utilization');

  const [sortDirection, setSortDirection] =
    useState('desc');

  const [selectedBudgets, setSelectedBudgets] =
    useState([]);

  const [activeBudget, setActiveBudget] =
    useState(null);

  const [hiddenAmounts, setHiddenAmounts] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [fullscreen, setFullscreen] =
    useState(false);

  const [showAnalytics, setShowAnalytics] =
    useState(true);

  const [showBudgetCards, setShowBudgetCards] =
    useState(true);

  const [sortOpen, setSortOpen] =
    useState(false);

  const containerRef =
    useRef(null);

  const source =
    data || budgets;

  const normalized =
    useMemo(
      () =>
        normalizeBudgets(
          source,
        ),
      [source],
    );

  const totals =
    useMemo(() => {
      const totalBudget =
        normalized.reduce(
          (sum, item) =>
            sum + item.budget,
          0,
        );

      const totalSpent =
        normalized.reduce(
          (sum, item) =>
            sum + item.spent,
          0,
        );

      const totalRemaining =
        normalized.reduce(
          (sum, item) =>
            sum + item.remaining,
          0,
        );

      const utilization =
        totalBudget > 0
          ? (totalSpent /
              totalBudget) *
            100
          : 0;

      const healthy =
        normalized.filter(
          (item) =>
            item.status ===
            'healthy',
        ).length;

      const watch =
        normalized.filter(
          (item) =>
            item.status ===
            'watch',
        ).length;

      const critical =
        normalized.filter(
          (item) =>
            item.status ===
            'critical',
        ).length;

      const over =
        normalized.filter(
          (item) =>
            item.status ===
            'over',
        ).length;

      return {
        totalBudget,
        totalSpent,
        totalRemaining,
        utilization,
        healthy,
        watch,
        critical,
        over,
        count:
          normalized.length,
      };
    }, [normalized]);

  const filteredBudgets =
    useMemo(() => {
      let result =
        normalized.slice();

      if (
        statusFilter !==
        'all'
      ) {
        result =
          result.filter(
            (item) =>
              item.status ===
              statusFilter,
          );
      }

      const query =
        search
          .trim()
          .toLowerCase();

      if (query) {
        result =
          result.filter(
            (item) =>
              item.name
                .toLowerCase()
                .includes(query),
          );
      }

      result.sort(
        (a, b) => {
          let difference = 0;

          if (
            sortBy ===
            'utilization'
          ) {
            difference =
              a.utilization -
              b.utilization;
          }

          if (
            sortBy ===
            'spent'
          ) {
            difference =
              a.spent -
              b.spent;
          }

          if (
            sortBy ===
            'budget'
          ) {
            difference =
              a.budget -
              b.budget;
          }

          if (
            sortBy ===
            'remaining'
          ) {
            difference =
              a.remaining -
              b.remaining;
          }

          if (
            sortBy ===
            'name'
          ) {
            difference =
              a.name.localeCompare(
                b.name,
              );
          }

          return sortDirection ===
            'asc'
            ? difference
            : -difference;
        },
      );

      return result;
    }, [
      normalized,
      statusFilter,
      search,
      sortBy,
      sortDirection,
    ]);

  const selectedSet =
    useMemo(
      () =>
        new Set(
          selectedBudgets,
        ),
      [selectedBudgets],
    );

  const handlePeriod =
    useCallback(
      (value) => {
        setSelectedPeriod(
          value,
        );

        onPeriodChange?.(
          value,
        );
      },
      [onPeriodChange],
    );

  const handleSelectBudget =
    useCallback(
      (budget) => {
        setSelectedBudgets(
          (current) => {
            if (
              current.includes(
                budget.id,
              )
            ) {
              return current.filter(
                (id) =>
                  id !==
                  budget.id,
              );
            }

            return [
              ...current,
              budget.id,
            ];
          },
        );
      },
      [],
    );

  const handleSelectAll =
    useCallback(() => {
      if (
        selectedBudgets.length ===
        filteredBudgets.length
      ) {
        setSelectedBudgets(
          [],
        );

        return;
      }

      setSelectedBudgets(
        filteredBudgets.map(
          (item) =>
            item.id,
        ),
      );
    }, [
      selectedBudgets.length,
      filteredBudgets,
    ]);

  const handleFullscreen =
    useCallback(
      async () => {
        try {
          if (
            !document.fullscreenElement
          ) {
            await containerRef.current?.requestFullscreen?.();
          } else {
            await document.exitFullscreen?.();
          }
        } catch {
          // Browser may block fullscreen.
        }
      },
      [],
    );

  useEffect(() => {
    const listener =
      () => {
        setFullscreen(
          Boolean(
            document.fullscreenElement,
          ),
        );
      };

    document.addEventListener(
      'fullscreenchange',
      listener,
    );

    return () =>
      document.removeEventListener(
        'fullscreenchange',
        listener,
      );
  }, []);

  const handleExport =
    useCallback(() => {
      downloadBudgetCsv(
        filteredBudgets,
      );

      setMenuOpen(
        false,
      );
    }, [
      filteredBudgets,
    ]);

  const averageUtilization =
    totals.count > 0
      ? normalized.reduce(
          (sum, item) =>
            sum +
            item.utilization,
          0,
        ) / totals.count
      : 0;

  const highestRiskBudget =
    useMemo(
      () =>
        normalized.reduce(
          (best, item) =>
            item.utilization >
            best.utilization
              ? item
              : best,
          {
            utilization: 0,
            name: '—',
          },
        ),
      [normalized],
    );

  const largestBudget =
    useMemo(
      () =>
        normalized.reduce(
          (best, item) =>
            item.budget >
            best.budget
              ? item
              : best,
          {
            budget: 0,
            name: '—',
          },
        ),
      [normalized],
    );

  const largestSpend =
    useMemo(
      () =>
        normalized.reduce(
          (best, item) =>
            item.spent >
            best.spent
              ? item
              : best,
          {
            spent: 0,
            name: '—',
          },
        ),
      [normalized],
    );

  const healthScore =
    useMemo(() => {
      if (!normalized.length) {
        return 0;
      }

      const utilizationScore =
        clamp(
          100 -
            Math.max(
              0,
              totals.utilization -
                55,
            ) *
              2.2,
          0,
          100,
        );

      const riskScore =
        clamp(
          100 -
            (totals.over *
              25 +
              totals.critical *
                14 +
              totals.watch *
                6),
          0,
          100,
        );

      const healthyScore =
        (totals.healthy /
          totals.count) *
        100;

      return Math.round(
        utilizationScore *
          0.4 +
          riskScore *
            0.35 +
          healthyScore *
            0.25,
      );
    }, [
      normalized,
      totals,
    ]);

  return (
    <section
      ref={containerRef}
      className={[
        'bo-shell',
        fullscreen
          ? 'bo-fullscreen'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <style>{`

        /* ================================================================
           ROOT
        ================================================================ */

        .bo-shell {
          --bo-blue:#60a5fa;
          --bo-cyan:#22d3ee;
          --bo-green:#34d399;
          --bo-yellow:#fbbf24;
          --bo-orange:#fb923c;
          --bo-red:#fb7185;
          --bo-purple:#a78bfa;

          position:relative;
          overflow:hidden;

          border:1px solid rgba(148,163,184,.13);
          border-radius:30px;

          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(59,130,246,.09),
              transparent 31%
            ),
            radial-gradient(
              circle at 0% 100%,
              rgba(16,185,129,.045),
              transparent 27%
            ),
            radial-gradient(
              circle at 55% 50%,
              rgba(99,102,241,.025),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              rgba(15,23,42,.97),
              rgba(15,23,42,.78)
            );

          box-shadow:
            0 30px 100px rgba(0,0,0,.18),
            inset 0 1px 0 rgba(255,255,255,.035);

          color:#e2e8f0;
        }

        .bo-shell::before {
          content:"";
          position:absolute;
          z-index:0;
          top:0;
          left:8%;
          right:8%;
          height:1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(96,165,250,.7),
              rgba(34,211,238,.35),
              rgba(167,139,250,.4),
              transparent
            );

          pointer-events:none;
        }

        .bo-shell::after {
          content:"";
          position:absolute;
          z-index:0;
          width:360px;
          height:360px;
          top:-220px;
          right:-160px;

          border-radius:50%;

          background:
            radial-gradient(
              circle,
              rgba(96,165,250,.07),
              transparent 67%
            );

          filter:blur(10px);
          pointer-events:none;
        }

        .bo-fullscreen {
          min-height:100vh;
          border-radius:0;
          overflow:auto;
          background:#020617;
        }

        .bo-content {
          position:relative;
          z-index:1;
          padding:25px;
        }

        /* ================================================================
           HEADER
        ================================================================ */

        .bo-header {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:22px;
          margin-bottom:20px;
        }

        .bo-heading {
          display:flex;
          align-items:flex-start;
          gap:15px;
          min-width:0;
        }

        .bo-heading-icon {
          position:relative;

          width:51px;
          height:51px;
          flex:0 0 51px;

          display:grid;
          place-items:center;

          border:1px solid rgba(96,165,250,.18);
          border-radius:16px;

          color:var(--bo-blue);

          background:
            linear-gradient(
              145deg,
              rgba(96,165,250,.14),
              rgba(34,211,238,.045)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 10px 35px rgba(37,99,235,.08);
        }

        .bo-heading-icon::before {
          content:"";

          position:absolute;
          inset:-5px;

          border:1px solid rgba(96,165,250,.05);
          border-radius:20px;
        }

        .bo-heading-pulse {
          position:absolute;
          width:6px;
          height:6px;
          right:6px;
          top:6px;

          border-radius:50%;
          background:#34d399;

          box-shadow:
            0 0 0 4px rgba(52,211,153,.08);

          animation:bo-pulse 2.2s infinite;
        }

        .bo-heading-copy {
          min-width:0;
        }

        .bo-eyebrow {
          display:flex;
          align-items:center;
          gap:7px;

          margin-bottom:4px;

          color:#64748b;
          font-size:8px;
          font-weight:850;
          letter-spacing:.13em;
          text-transform:uppercase;
        }

        .bo-live-dot {
          width:5px;
          height:5px;
          border-radius:50%;
          background:#34d399;
        }

        .bo-title {
          margin:0;

          color:#f8fafc;

          font-size:clamp(
            19px,
            2vw,
            24px
          );

          line-height:1.15;
          font-weight:900;
          letter-spacing:-.045em;
        }

        .bo-subtitle {
          max-width:690px;
          margin:6px 0 0;

          color:#64748b;

          font-size:10px;
          line-height:1.55;
        }

        .bo-header-actions {
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:7px;
          flex-wrap:wrap;
        }

        .bo-period {
          height:37px;

          display:flex;
          align-items:center;
          gap:7px;

          padding:0 10px;

          border:1px solid rgba(148,163,184,.12);
          border-radius:10px;

          color:#64748b;
          background:rgba(15,23,42,.72);
        }

        .bo-period select {
          min-width:78px;

          border:0;
          outline:0;

          color:#cbd5e1;
          background:transparent;

          font-size:9px;
          font-weight:750;

          appearance:none;
          cursor:pointer;
        }

        .bo-period select option {
          background:#0f172a;
          color:#cbd5e1;
        }

        .bo-primary-button {
          height:37px;

          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:7px;

          padding:0 12px;

          border:1px solid rgba(96,165,250,.2);
          border-radius:10px;

          color:#eff6ff;

          background:
            linear-gradient(
              135deg,
              rgba(59,130,246,.22),
              rgba(37,99,235,.12)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.045),
            0 7px 22px rgba(37,99,235,.08);

          font-size:9px;
          font-weight:800;

          cursor:pointer;

          transition:
            transform .15s ease,
            border-color .15s ease,
            background .15s ease;
        }

        .bo-primary-button:hover {
          transform:translateY(-1px);
          border-color:rgba(96,165,250,.35);
          background:
            linear-gradient(
              135deg,
              rgba(59,130,246,.28),
              rgba(37,99,235,.16)
            );
        }

        .bo-icon-button {
          width:37px;
          height:37px;

          display:grid;
          place-items:center;

          border:1px solid rgba(148,163,184,.12);
          border-radius:10px;

          color:#94a3b8;
          background:rgba(148,163,184,.028);

          cursor:pointer;

          transition:
            color .15s ease,
            border-color .15s ease,
            background .15s ease,
            transform .15s ease;
        }

        .bo-icon-button:hover {
          color:#f8fafc;
          border-color:rgba(96,165,250,.22);
          background:rgba(96,165,250,.055);
        }

        .bo-icon-button:active {
          transform:scale(.96);
        }

        .bo-menu-wrapper {
          position:relative;
        }

        .bo-menu {
          position:absolute;
          z-index:80;

          top:44px;
          right:0;

          width:195px;

          padding:6px;

          border:1px solid rgba(148,163,184,.16);
          border-radius:13px;

          background:rgba(2,6,23,.98);

          box-shadow:
            0 25px 70px rgba(0,0,0,.4),
            inset 0 1px 0 rgba(255,255,255,.03);

          backdrop-filter:blur(16px);
        }

        .bo-menu button {
          width:100%;

          display:flex;
          align-items:center;
          gap:9px;

          padding:9px;

          border:0;
          border-radius:8px;

          color:#94a3b8;
          background:transparent;

          font-size:9px;
          font-weight:700;

          text-align:left;
          cursor:pointer;
        }

        .bo-menu button:hover {
          color:#f8fafc;
          background:rgba(148,163,184,.065);
        }

        /* ================================================================
           KPI GRID
        ================================================================ */

        .bo-kpis {
          display:grid;

          grid-template-columns:
            repeat(4,minmax(0,1fr));

          gap:10px;

          margin-bottom:12px;
        }

        .bo-kpi {
          position:relative;
          overflow:hidden;

          min-width:0;

          padding:15px;

          border:1px solid rgba(148,163,184,.09);
          border-radius:17px;

          background:
            linear-gradient(
              145deg,
              rgba(148,163,184,.038),
              rgba(15,23,42,.16)
            );
        }

        .bo-kpi::before {
          content:"";

          position:absolute;
          top:0;
          left:18px;
          right:18px;

          height:1px;

          background:currentColor;
          opacity:.2;
        }

        .bo-kpi-blue {
          color:var(--bo-blue);
        }

        .bo-kpi-green {
          color:var(--bo-green);
        }

        .bo-kpi-red {
          color:var(--bo-red);
        }

        .bo-kpi-purple {
          color:var(--bo-purple);
        }

        .bo-kpi-top {
          display:flex;
          align-items:center;
          justify-content:space-between;

          margin-bottom:9px;
        }

        .bo-kpi-icon {
          width:31px;
          height:31px;

          display:grid;
          place-items:center;

          border:1px solid currentColor;
          border-radius:9px;

          background:rgba(255,255,255,.02);
        }

        .bo-kpi-signal {
          display:flex;
          align-items:center;
          gap:2px;

          color:currentColor;

          font-size:8px;
          font-weight:800;
        }

        .bo-kpi-label {
          color:#64748b;

          font-size:8px;
          font-weight:800;

          letter-spacing:.075em;
          text-transform:uppercase;
        }

        .bo-kpi-value {
          overflow:hidden;

          margin-top:4px;

          color:#f8fafc;

          font-size:clamp(
            16px,
            2vw,
            22px
          );

          font-weight:900;
          letter-spacing:-.04em;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .bo-kpi-secondary {
          margin-top:5px;

          color:#475569;

          font-size:8px;
        }

        .bo-hidden {
          color:#475569;
          letter-spacing:.1em;
        }

        /* ================================================================
           ANALYTICS COMMAND CENTER
        ================================================================ */

        .bo-command-center {
          display:grid;

          grid-template-columns:
            minmax(0,1.7fr)
            minmax(280px,.8fr);

          gap:10px;

          margin-bottom:12px;
        }

        .bo-panel {
          position:relative;
          overflow:hidden;

          min-width:0;

          border:1px solid rgba(148,163,184,.09);
          border-radius:20px;

          background:
            linear-gradient(
              180deg,
              rgba(2,6,23,.22),
              rgba(15,23,42,.12)
            );
        }

        .bo-panel-header {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:12px;

          padding:14px 15px;

          border-bottom:1px solid rgba(148,163,184,.075);
        }

        .bo-panel-title {
          display:flex;
          align-items:center;
          gap:8px;

          color:#cbd5e1;

          font-size:9px;
          font-weight:850;
          letter-spacing:.025em;
        }

        .bo-panel-title-icon {
          color:var(--bo-blue);
        }

        .bo-panel-caption {
          color:#475569;
          font-size:7px;
        }

        .bo-performance-chart {
          width:100%;
          height:315px;

          padding:10px 8px 7px 0;
        }

        .bo-chart-empty {
          height:315px;

          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;

          gap:8px;

          color:#475569;

          font-size:9px;
        }

        .bo-chart-empty svg {
          color:#334155;
        }

        .bo-chart-tooltip {
          min-width:185px;

          padding:12px;

          border:1px solid rgba(148,163,184,.15);
          border-radius:12px;

          background:rgba(2,6,23,.98);

          box-shadow:
            0 20px 55px rgba(0,0,0,.35);
        }

        .bo-chart-tooltip > strong {
          display:block;

          padding-bottom:8px;
          margin-bottom:7px;

          color:#f8fafc;

          border-bottom:1px solid rgba(148,163,184,.08);

          font-size:9px;
        }

        .bo-chart-tooltip > div {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:20px;

          margin-top:7px;

          color:#64748b;

          font-size:8px;
        }

        .bo-chart-tooltip b {
          color:#cbd5e1;
        }

        /* ================================================================
           DONUT
        ================================================================ */

        .bo-allocation-layout {
          display:grid;

          grid-template-columns:
            150px
            minmax(0,1fr);

          align-items:center;

          min-height:315px;

          padding:14px;
        }

        .bo-donut {
          position:relative;

          width:150px;
          height:150px;
        }

        .bo-donut-center {
          position:absolute;

          inset:0;

          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;

          pointer-events:none;
        }

        .bo-donut-center span {
          color:#475569;
          font-size:7px;
          text-transform:uppercase;
          letter-spacing:.08em;
        }

        .bo-donut-center strong {
          margin-top:3px;

          color:#f8fafc;

          font-size:15px;
          font-weight:900;
          letter-spacing:-.03em;
        }

        .bo-allocation-list {
          display:flex;
          flex-direction:column;
          gap:7px;

          min-width:0;

          padding-left:8px;
        }

        .bo-allocation-item {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:10px;

          min-width:0;
        }

        .bo-allocation-label {
          display:flex;
          align-items:center;
          gap:7px;

          min-width:0;

          color:#64748b;

          font-size:8px;
        }

        .bo-allocation-label > span:first-child {
          width:6px;
          height:6px;
          flex:0 0 6px;

          border-radius:50%;
        }

        .bo-allocation-label > span:last-child {
          overflow:hidden;

          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .bo-allocation-item strong {
          color:#94a3b8;
          font-size:8px;
        }

        /* ================================================================
           HEALTH
        ================================================================ */

        .bo-health-layout {
          display:grid;

          grid-template-columns:
            minmax(0,1.1fr)
            minmax(130px,.9fr);

          align-items:center;

          min-height:300px;

          padding:13px;
        }

        .bo-health-radar {
          width:100%;
          height:255px;
        }

        .bo-health-score {
          display:flex;
          flex-direction:column;
          align-items:flex-start;

          padding:8px;
        }

        .bo-health-score > span {
          color:#64748b;

          font-size:8px;
          font-weight:750;

          text-transform:uppercase;
          letter-spacing:.08em;
        }

        .bo-health-score > strong {
          margin-top:3px;

          color:#f8fafc;

          font-size:34px;
          line-height:1;

          font-weight:900;
          letter-spacing:-.06em;
        }

        .bo-health-score > small {
          margin-top:2px;

          color:#475569;
          font-size:8px;
        }

        .bo-health-meter {
          width:100%;
          height:5px;

          overflow:hidden;

          margin-top:14px;

          border-radius:99px;

          background:rgba(148,163,184,.08);
        }

        .bo-health-meter span {
          display:block;

          height:100%;

          border-radius:inherit;
        }

        .bo-health-score p {
          margin:9px 0 0;

          color:#64748b;

          font-size:8px;
          line-height:1.5;
        }

        /* ================================================================
           BUDGET WORKSPACE
        ================================================================ */

        .bo-budget-workspace {
          overflow:hidden;

          border:1px solid rgba(148,163,184,.1);
          border-radius:21px;

          background:
            linear-gradient(
              180deg,
              rgba(15,23,42,.4),
              rgba(15,23,42,.17)
            );
        }

        .bo-workspace-header {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:15px;

          padding:14px 15px;

          border-bottom:1px solid rgba(148,163,184,.075);
        }

        .bo-workspace-heading {
          display:flex;
          align-items:center;
          gap:9px;
        }

        .bo-workspace-heading-icon {
          color:var(--bo-yellow);
        }

        .bo-workspace-title {
          color:#cbd5e1;

          font-size:10px;
          font-weight:850;
        }

        .bo-workspace-subtitle {
          margin-top:3px;

          color:#475569;

          font-size:7px;
        }

        .bo-workspace-actions {
          display:flex;
          align-items:center;
          gap:7px;
        }

        .bo-search {
          position:relative;
        }

        .bo-search svg {
          position:absolute;

          left:9px;
          top:50%;

          transform:translateY(-50%);

          color:#475569;

          pointer-events:none;
        }

        .bo-search input {
          width:170px;
          height:32px;

          padding:0 10px 0 29px;

          border:1px solid rgba(148,163,184,.1);
          border-radius:9px;

          outline:none;

          color:#cbd5e1;
          background:rgba(2,6,23,.2);

          font-size:8px;
        }

        .bo-search input::placeholder {
          color:#475569;
        }

        .bo-search input:focus {
          border-color:rgba(96,165,250,.25);
        }

        .bo-sort-wrapper {
          position:relative;
        }

        .bo-sort-button {
          height:32px;

          display:flex;
          align-items:center;
          gap:6px;

          padding:0 9px;

          border:1px solid rgba(148,163,184,.1);
          border-radius:9px;

          color:#64748b;
          background:rgba(2,6,23,.2);

          font-size:8px;
          font-weight:700;

          cursor:pointer;
        }

        .bo-sort-button:hover {
          color:#cbd5e1;
        }

        .bo-sort-menu {
          position:absolute;

          z-index:50;

          top:37px;
          right:0;

          width:160px;

          padding:5px;

          border:1px solid rgba(148,163,184,.14);
          border-radius:11px;

          background:rgba(2,6,23,.98);

          box-shadow:0 20px 55px rgba(0,0,0,.38);
        }

        .bo-sort-menu button {
          width:100%;

          display:flex;
          align-items:center;
          justify-content:space-between;

          padding:8px;

          border:0;
          border-radius:7px;

          color:#64748b;
          background:transparent;

          font-size:8px;

          text-align:left;

          cursor:pointer;
        }

        .bo-sort-menu button:hover {
          color:#f8fafc;
          background:rgba(148,163,184,.06);
        }

        .bo-status-filter {
          display:flex;
          align-items:center;

          gap:3px;

          padding:3px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:9px;

          background:rgba(148,163,184,.018);
        }

        .bo-status-filter button {
          height:25px;

          display:flex;
          align-items:center;
          gap:5px;

          padding:0 7px;

          border:0;
          border-radius:6px;

          color:#475569;
          background:transparent;

          font-size:7px;
          font-weight:750;

          cursor:pointer;
        }

        .bo-status-filter button:hover {
          color:#94a3b8;
        }

        .bo-status-filter button span {
          width:5px;
          height:5px;
          border-radius:50%;
        }

        .bo-status-filter-active {
          color:#e2e8f0 !important;
          background:rgba(96,165,250,.09) !important;
        }

        .bo-select-all {
          display:flex;
          align-items:center;
          gap:7px;

          padding:10px 15px;

          border-bottom:1px solid rgba(148,163,184,.055);

          color:#475569;

          font-size:7px;
        }

        .bo-select-all button {
          width:17px;
          height:17px;

          display:grid;
          place-items:center;

          border:1px solid rgba(148,163,184,.16);
          border-radius:5px;

          color:#60a5fa;
          background:transparent;

          cursor:pointer;
        }

        .bo-budget-grid {
          display:grid;

          grid-template-columns:
            repeat(2,minmax(0,1fr));

          gap:9px;

          padding:11px;
        }

        /* ================================================================
           BUDGET CARD
        ================================================================ */

        .bo-budget-card {
          position:relative;
          overflow:hidden;

          min-width:0;

          padding:14px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:15px;

          background:
            linear-gradient(
              145deg,
              rgba(148,163,184,.025),
              rgba(15,23,42,.2)
            );

          text-align:left;

          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease;
        }

        .bo-budget-card:hover {
          transform:translateY(-1px);

          border-color:var(--budget-border);

          background:
            linear-gradient(
              145deg,
              var(--budget-soft),
              rgba(15,23,42,.2)
            );

          box-shadow:
            0 14px 35px rgba(0,0,0,.12);
        }

        .bo-budget-selected {
          border-color:rgba(96,165,250,.28) !important;

          box-shadow:
            0 0 0 1px rgba(96,165,250,.08),
            0 14px 35px rgba(0,0,0,.12);
        }

        .bo-budget-glow {
          position:absolute;

          width:100px;
          height:100px;

          top:-65px;
          right:-45px;

          border-radius:50%;

          background:
            radial-gradient(
              circle,
              var(--budget-soft),
              transparent 68%
            );

          pointer-events:none;
        }

        .bo-budget-card-header {
          position:relative;

          display:flex;
          align-items:flex-start;
          justify-content:space-between;

          gap:10px;
        }

        .bo-budget-name-wrap {
          display:flex;
          align-items:flex-start;
          gap:8px;

          min-width:0;
        }

        .bo-select-circle {
          width:18px;
          height:18px;
          flex:0 0 18px;

          display:grid;
          place-items:center;

          margin-top:1px;

          border:1px solid rgba(148,163,184,.14);
          border-radius:6px;

          color:#60a5fa;
          background:rgba(148,163,184,.02);

          cursor:pointer;
        }

        .bo-budget-name-area {
          min-width:0;
        }

        .bo-budget-category {
          display:flex;
          align-items:center;
          gap:6px;

          min-width:0;

          color:#cbd5e1;

          font-size:10px;
          font-weight:800;
        }

        .bo-budget-category-dot {
          width:6px;
          height:6px;
          flex:0 0 6px;

          border-radius:50%;

          background:var(--budget-color);

          box-shadow:
            0 0 0 3px var(--budget-soft);
        }

        .bo-budget-category span:last-child {
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .bo-budget-status-line {
          display:block;

          margin-top:4px;

          color:#475569;

          font-size:7px;

          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .bo-budget-status {
          flex:0 0 auto;

          display:flex;
          align-items:center;
          gap:4px;

          padding:4px 6px;

          border:1px solid;

          border-radius:6px;

          font-size:6px;
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:.035em;
        }

        .bo-budget-main {
          display:flex;
          align-items:flex-end;
          justify-content:space-between;

          gap:10px;

          margin-top:17px;
        }

        .bo-budget-numbers {
          display:flex;
          align-items:flex-end;

          gap:7px;
        }

        .bo-budget-numbers > div:not(.bo-budget-separator) {
          display:flex;
          flex-direction:column;
        }

        .bo-budget-numbers span {
          color:#475569;
          font-size:7px;
        }

        .bo-budget-numbers strong {
          margin-top:3px;

          color:#e2e8f0;

          font-size:11px;
          font-weight:850;
        }

        .bo-budget-separator {
          padding-bottom:1px;

          color:#334155;
          font-size:10px;
        }

        .bo-budget-percent {
          color:var(--budget-color);

          font-size:17px;
          font-weight:900;

          letter-spacing:-.05em;
        }

        .bo-progress-wrapper {
          margin-top:12px;
        }

        .bo-progress-track {
          position:relative;

          height:6px;

          overflow:hidden;

          border-radius:99px;

          background:rgba(148,163,184,.07);
        }

        .bo-progress-fill {
          height:100%;

          border-radius:inherit;

          box-shadow:
            0 0 10px var(--budget-color);

          transition:
            width .65s ease;
        }

        .bo-progress-marker {
          position:absolute;

          top:0;

          width:1px;
          height:100%;

          background:rgba(255,255,255,.38);
        }

        .bo-progress-scale {
          display:flex;
          justify-content:space-between;

          margin-top:4px;

          color:#334155;

          font-size:5px;
        }

        .bo-budget-footer {
          display:flex;
          align-items:center;
          justify-content:space-between;

          gap:10px;

          margin-top:13px;
        }

        .bo-remaining {
          display:flex;
          align-items:center;
          gap:6px;
        }

        .bo-remaining-icon {
          width:24px;
          height:24px;

          display:grid;
          place-items:center;

          border-radius:7px;

          color:var(--budget-color);
          background:var(--budget-soft);
        }

        .bo-remaining > div:last-child {
          display:flex;
          flex-direction:column;
        }

        .bo-remaining span {
          color:#475569;
          font-size:6px;
        }

        .bo-remaining strong {
          margin-top:2px;

          font-size:9px;
          font-weight:800;
        }

        .bo-green {
          color:#4ade80 !important;
        }

        .bo-red {
          color:#fb7185 !important;
        }

        .bo-details-button {
          display:flex;
          align-items:center;
          gap:4px;

          padding:5px 7px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:7px;

          color:#64748b;
          background:rgba(148,163,184,.02);

          font-size:7px;
          font-weight:750;

          cursor:pointer;
        }

        .bo-details-button:hover {
          color:#cbd5e1;
          border-color:rgba(96,165,250,.18);
        }

        /* ================================================================
           EMPTY / LOADING / ERROR
        ================================================================ */

        .bo-empty {
          min-height:410px;

          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;

          padding:35px;

          text-align:center;
        }

        .bo-empty-orbit {
          width:82px;
          height:82px;

          display:grid;
          place-items:center;

          border:1px dashed rgba(96,165,250,.16);
          border-radius:50%;

          animation:bo-rotate 15s linear infinite;
        }

        .bo-empty-orbit-inner {
          width:54px;
          height:54px;

          display:grid;
          place-items:center;

          border:1px solid rgba(96,165,250,.16);
          border-radius:16px;

          color:#60a5fa;

          background:rgba(96,165,250,.05);

          animation:bo-counter-rotate 15s linear infinite;
        }

        .bo-empty h3 {
          margin:16px 0 0;

          color:#cbd5e1;

          font-size:13px;
          font-weight:850;
        }

        .bo-empty p {
          max-width:420px;

          margin:7px 0 16px;

          color:#475569;

          font-size:9px;
          line-height:1.6;
        }

        .bo-loading {
          padding:20px;
        }

        .bo-loading-kpis {
          display:grid;

          grid-template-columns:
            repeat(4,1fr);

          gap:10px;

          margin-bottom:12px;
        }

        .bo-skeleton-card,
        .bo-skeleton-budget {
          padding:14px;

          border:1px solid rgba(148,163,184,.07);
          border-radius:16px;

          background:rgba(148,163,184,.018);
        }

        .bo-skeleton {
          position:relative;
          overflow:hidden;

          background:rgba(148,163,184,.055);
        }

        .bo-skeleton::after {
          content:"";

          position:absolute;
          inset:0;

          transform:translateX(-100%);

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.055),
              transparent
            );

          animation:bo-shimmer 1.4s infinite;
        }

        .bo-skeleton-icon {
          width:30px;
          height:30px;
          border-radius:9px;
        }

        .bo-skeleton-small {
          width:50%;
          height:7px;

          margin-top:10px;

          border-radius:5px;
        }

        .bo-skeleton-large {
          width:75%;
          height:18px;

          margin-top:6px;

          border-radius:6px;
        }

        .bo-skeleton-line {
          width:60%;
          height:7px;

          margin-top:9px;

          border-radius:5px;
        }

        .bo-loading-main {
          padding:15px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:20px;

          background:rgba(148,163,184,.015);
        }

        .bo-skeleton-header {
          width:220px;
          height:12px;

          border-radius:6px;
        }

        .bo-skeleton-chart {
          width:100%;
          height:260px;

          margin-top:15px;

          border-radius:12px;
        }

        .bo-loading-cards {
          display:grid;

          grid-template-columns:
            repeat(2,1fr);

          gap:9px;

          margin-top:10px;
        }

        .bo-skeleton-budget {
          min-height:140px;
        }

        .bo-skeleton-medium {
          width:70%;
          height:18px;

          margin-top:14px;

          border-radius:6px;
        }

        .bo-skeleton-progress {
          width:100%;
          height:6px;

          margin-top:15px;

          border-radius:99px;
        }

        .bo-error {
          min-height:410px;

          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;

          padding:30px;

          text-align:center;
        }

        .bo-error-icon {
          width:54px;
          height:54px;

          display:grid;
          place-items:center;

          border-radius:16px;

          color:#fb7185;
          background:rgba(239,68,68,.08);

          border:1px solid rgba(239,68,68,.12);
        }

        .bo-error h3 {
          margin:13px 0 0;

          color:#cbd5e1;

          font-size:13px;
        }

        .bo-error p {
          max-width:390px;

          margin:6px 0 13px;

          color:#475569;

          font-size:9px;
          line-height:1.5;
        }

        .bo-retry {
          display:inline-flex;
          align-items:center;
          gap:6px;

          padding:8px 11px;

          border:1px solid rgba(148,163,184,.12);
          border-radius:9px;

          color:#94a3b8;
          background:rgba(148,163,184,.035);

          font-size:8px;
          font-weight:750;

          cursor:pointer;
        }

        .bo-retry:hover {
          color:#f8fafc;
        }

        /* ================================================================
           MODAL
        ================================================================ */

        .bo-modal-backdrop {
          position:fixed;

          z-index:999;

          inset:0;

          display:flex;
          align-items:center;
          justify-content:center;

          padding:20px;

          background:rgba(2,6,23,.72);

          backdrop-filter:blur(10px);
        }

        .bo-modal {
          width:min(
            700px,
            100%
          );

          max-height:90vh;

          overflow:auto;

          padding:20px;

          border:1px solid rgba(148,163,184,.16);
          border-radius:22px;

          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(96,165,250,.07),
              transparent 35%
            ),
            #0b1220;

          box-shadow:
            0 40px 120px rgba(0,0,0,.5),
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        .bo-modal-header {
          display:flex;
          justify-content:space-between;
          gap:20px;
        }

        .bo-modal-eyebrow {
          color:#60a5fa;

          font-size:7px;
          font-weight:850;

          text-transform:uppercase;
          letter-spacing:.12em;
        }

        .bo-modal-header h3 {
          margin:4px 0 0;

          color:#f8fafc;

          font-size:18px;
          font-weight:900;

          letter-spacing:-.035em;
        }

        .bo-modal-header p {
          margin:5px 0 0;

          color:#475569;

          font-size:8px;
        }

        .bo-modal-status {
          display:flex;
          align-items:center;
          gap:9px;

          margin-top:17px;
          padding:10px;

          border:1px solid;
          border-radius:11px;
        }

        .bo-modal-status div {
          display:flex;
          flex-direction:column;
        }

        .bo-modal-status strong {
          font-size:9px;
        }

        .bo-modal-status span {
          margin-top:2px;

          color:#64748b;

          font-size:7px;
        }

        .bo-modal-grid {
          display:grid;

          grid-template-columns:
            repeat(4,1fr);

          gap:8px;

          margin-top:10px;
        }

        .bo-modal-card {
          padding:12px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:12px;

          background:rgba(148,163,184,.018);
        }

        .bo-modal-card span {
          display:block;

          color:#475569;

          font-size:7px;
        }

        .bo-modal-card strong {
          display:block;

          margin-top:5px;

          color:#e2e8f0;

          font-size:12px;
          font-weight:850;
        }

        .bo-modal-card small {
          display:block;

          margin-top:3px;

          color:#334155;

          font-size:6px;
        }

        .bo-modal-primary {
          display:flex;
          align-items:center;
          gap:10px;

          grid-column:span 2;
        }

        .bo-ring {
          position:relative;

          flex:0 0 auto;
        }

        .bo-ring svg {
          display:block;
        }

        .bo-ring-center {
          position:absolute;

          inset:0;

          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
        }

        .bo-ring-center strong {
          color:#f8fafc;

          font-size:13px;
          font-weight:900;
        }

        .bo-ring-center span {
          margin-top:1px;

          color:#475569;

          font-size:6px;
        }

        .bo-modal-section {
          margin-top:12px;

          padding:13px;

          border:1px solid rgba(148,163,184,.08);
          border-radius:13px;

          background:rgba(148,163,184,.015);
        }

        .bo-modal-section-title {
          display:flex;
          align-items:center;
          gap:7px;

          color:#94a3b8;

          font-size:8px;
          font-weight:800;
        }

        .bo-modal-progress {
          margin-top:13px;
        }

        .bo-modal-progress-track {
          height:7px;

          overflow:hidden;

          border-radius:99px;

          background:rgba(148,163,184,.08);
        }

        .bo-modal-progress-fill {
          height:100%;

          border-radius:inherit;
        }

        .bo-modal-progress-labels {
          display:flex;
          justify-content:space-between;

          margin-top:5px;

          color:#334155;

          font-size:6px;
        }

        .bo-modal-grid-small {
          grid-template-columns:
            repeat(2,1fr);
        }

        .bo-modal-info {
          display:flex;
          align-items:center;
          gap:9px;

          padding:11px;

          border:1px solid rgba(148,163,184,.07);
          border-radius:11px;

          color:#64748b;
          background:rgba(148,163,184,.015);
        }

        .bo-modal-info > div {
          display:flex;
          flex-direction:column;
        }

        .bo-modal-info span {
          color:#475569;
          font-size:7px;
        }

        .bo-modal-info strong {
          margin-top:3px;

          color:#cbd5e1;

          font-size:8px;
        }

        .bo-modal-warning {
          display:flex;
          align-items:flex-start;
          gap:9px;

          margin-top:10px;
          padding:11px;

          border:1px solid rgba(251,113,133,.15);
          border-radius:11px;

          color:#fb7185;
          background:rgba(251,113,133,.045);
        }

        .bo-modal-warning div {
          display:flex;
          flex-direction:column;
        }

        .bo-modal-warning strong {
          font-size:8px;
        }

        .bo-modal-warning span {
          margin-top:3px;

          color:#64748b;

          font-size:7px;
          line-height:1.4;
        }

        /* ================================================================
           ANIMATIONS
        ================================================================ */

        @keyframes bo-pulse {
          0%,100% {
            box-shadow:
              0 0 0 0 rgba(52,211,153,.2);
          }

          50% {
            box-shadow:
              0 0 0 5px rgba(52,211,153,0);
          }
        }

        @keyframes bo-shimmer {
          100% {
            transform:translateX(100%);
          }
        }

        @keyframes bo-rotate {
          from {
            transform:rotate(0deg);
          }

          to {
            transform:rotate(360deg);
          }
        }

        @keyframes bo-counter-rotate {
          from {
            transform:rotate(0deg);
          }

          to {
            transform:rotate(-360deg);
          }
        }

        /* ================================================================
           RESPONSIVE
        ================================================================ */

        @media(max-width:1200px) {
          .bo-command-center {
            grid-template-columns:1fr;
          }

          .bo-health-layout {
            min-height:270px;
          }

          .bo-kpis {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }
        }

        @media(max-width:900px) {
          .bo-header {
            flex-direction:column;
          }

          .bo-header-actions {
            width:100%;
            justify-content:flex-start;
          }

          .bo-budget-grid {
            grid-template-columns:1fr;
          }

          .bo-modal-grid {
            grid-template-columns:
              repeat(2,1fr);
          }

          .bo-modal-primary {
            grid-column:span 2;
          }
        }

        @media(max-width:720px) {
          .bo-content {
            padding:16px;
          }

          .bo-workspace-header {
            align-items:flex-start;
            flex-direction:column;
          }

          .bo-workspace-actions {
            width:100%;
            align-items:stretch;
            flex-direction:column;
          }

          .bo-search input {
            width:100%;
          }

          .bo-status-filter {
            overflow:auto;
          }

          .bo-status-filter button {
            flex:0 0 auto;
          }

          .bo-allocation-layout {
            grid-template-columns:1fr;
            justify-items:center;
          }

          .bo-allocation-list {
            width:100%;
            padding-left:0;
            margin-top:10px;
          }
        }

        @media(max-width:540px) {
          .bo-content {
            padding:12px;
          }

          .bo-kpis {
            grid-template-columns:
              1fr 1fr;
          }

          .bo-kpi {
            padding:11px;
          }

          .bo-heading-icon {
            width:44px;
            height:44px;
            flex-basis:44px;
          }

          .bo-header-actions {
            display:grid;

            grid-template-columns:
              1fr auto auto auto;

            width:100%;
          }

          .bo-period {
            width:100%;
          }

          .bo-primary-button {
            grid-column:1/-1;
          }

          .bo-modal {
            padding:15px;
          }

          .bo-modal-grid,
          .bo-modal-grid-small {
            grid-template-columns:1fr 1fr;
          }

          .bo-modal-primary {
            grid-column:1/-1;
          }

          .bo-health-layout {
            grid-template-columns:1fr;
          }

          .bo-health-score {
            padding:0 15px 15px;
          }
        }

        @media(prefers-reduced-motion:reduce) {
          .bo-heading-pulse,
          .bo-empty-orbit,
          .bo-empty-orbit-inner,
          .bo-skeleton::after {
            animation:none !important;
          }
        }
      `}</style>

      <div className="bo-content">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <BudgetHeader
          title={title}
          subtitle={subtitle}
          selectedPeriod={
            selectedPeriod
          }
          onPeriodChange={
            handlePeriod
          }
          onRefresh={
            onRefresh
          }
          onExport={
            handleExport
          }
          onFullscreen={
            handleFullscreen
          }
          onToggleAmounts={() =>
            setHiddenAmounts(
              (current) =>
                !current,
            )
          }
          hiddenAmounts={
            hiddenAmounts
          }
          onCreate={
            onCreate
          }
          menuOpen={
            menuOpen
          }
          setMenuOpen={
            setMenuOpen
          }
        />

        {/* ================================================================
            CONTENT STATES
        ================================================================ */}

        {loading ? (
          <BudgetLoading />
        ) : error ? (
          <BudgetError
            onRetry={
              onRefresh
            }
            message={
              errorMessage
            }
          />
        ) : normalized.length ===
          0 ? (
          <EmptyBudgets
            onCreate={
              onCreate
            }
          />
        ) : (
          <>

            {/* ============================================================
                KPI MATRIX
            ============================================================ */}

            <div className="bo-kpis">

              <KpiCard
                icon={
                  CircleDollarSign
                }
                label="Total budget"
                tone="blue"
                value={
                  hiddenAmounts ? (
                    <span className="bo-hidden">
                      •••••••
                    </span>
                  ) : (
                    <AnimatedNumber
                      value={
                        totals.totalBudget
                      }
                    />
                  )
                }
                secondary={`${number(
                  totals.count,
                )} active budget${
                  totals.count ===
                  1
                    ? ''
                    : 's'
                }`}
              />

              <KpiCard
                icon={
                  CreditCard
                }
                label="Total spent"
                tone="red"
                value={
                  hiddenAmounts ? (
                    <span className="bo-hidden">
                      •••••••
                    </span>
                  ) : (
                    <AnimatedNumber
                      value={
                        totals.totalSpent
                      }
                    />
                  )
                }
                secondary={`${percent(
                  totals.utilization,
                )} overall utilization`}
              />

              <KpiCard
                icon={
                  Wallet
                }
                label="Remaining"
                tone="green"
                value={
                  hiddenAmounts ? (
                    <span className="bo-hidden">
                      •••••••
                    </span>
                  ) : (
                    <AnimatedNumber
                      value={
                        totals.totalRemaining
                      }
                    />
                  )
                }
                secondary={
                  totals.totalRemaining >=
                  0
                    ? 'Available budget capacity'
                    : 'Budget deficit'
                }
              />

              <KpiCard
                icon={
                  Gauge
                }
                label="Budget health"
                tone="purple"
                value={
                  `${healthScore}/100`
                }
                secondary={
                  healthScore >=
                  75
                    ? 'Strong control'
                    : healthScore >=
                      50
                    ? 'Needs attention'
                    : 'High risk'
                }
              />

            </div>

            {/* ============================================================
                COMMAND CENTER
            ============================================================ */}

            {showAnalytics && (
              <div className="bo-command-center">

                {/* PERFORMANCE */}
                <div className="bo-panel">

                  <div className="bo-panel-header">

                    <div className="bo-panel-title">
                      <BarChart3
                        size={14}
                        className="bo-panel-title-icon"
                      />

                      Budget vs actual spending
                    </div>

                    <span className="bo-panel-caption">
                      Top 10 by utilization
                    </span>

                  </div>

                  <BudgetPerformanceChart
                    budgets={
                      normalized
                    }
                    hiddenAmounts={
                      hiddenAmounts
                    }
                  />

                </div>

                {/* ALLOCATION */}
                <div className="bo-panel">

                  <div className="bo-panel-header">

                    <div className="bo-panel-title">
                      <PieChartIcon
                        size={14}
                        className="bo-panel-title-icon"
                      />

                      Budget allocation
                    </div>

                    <span className="bo-panel-caption">
                      Allocation mix
                    </span>

                  </div>

                  <AllocationDonut
                    budgets={
                      normalized
                    }
                    hiddenAmounts={
                      hiddenAmounts
                    }
                  />

                </div>

              </div>
            )}

            {/* ============================================================
                HEALTH PANEL
            ============================================================ */}

            {showAnalytics && (
              <div
                className="bo-panel"
                style={{
                  marginBottom:12,
                }}
              >

                <div className="bo-panel-header">

                  <div className="bo-panel-title">
                    <ShieldAlert
                      size={14}
                      className="bo-panel-title-icon"
                    />

                    Budget risk intelligence
                  </div>

                  <span className="bo-panel-caption">
                    Multi-dimensional health analysis
                  </span>

                </div>

                <BudgetHealthRadar
                  totals={
                    totals
                  }
                />

              </div>
            )}

            {/* ============================================================
                BUDGET WORKSPACE
            ============================================================ */}

            {showBudgetCards && (
              <div className="bo-budget-workspace">

                <div className="bo-workspace-header">

                  <div className="bo-workspace-heading">

                    <Target
                      size={15}
                      className="bo-workspace-heading-icon"
                    />

                    <div>
                      <div className="bo-workspace-title">
                        Budget command center
                      </div>

                      <div className="bo-workspace-subtitle">
                        Monitor, filter, compare and inspect every allocation
                      </div>
                    </div>

                  </div>

                  <div className="bo-workspace-actions">

                    <div className="bo-search">
                      <Search
                        size={12}
                      />

                      <input
                        type="search"
                        value={
                          search
                        }
                        onChange={(
                          event,
                        ) =>
                          setSearch(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Search budgets..."
                      />
                    </div>

                    <div className="bo-sort-wrapper">

                      <button
                        type="button"
                        className="bo-sort-button"
                        onClick={() =>
                          setSortOpen(
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
                      >
                        <Filter
                          size={11}
                        />

                        Sort

                        <ChevronDown
                          size={10}
                        />
                      </button>

                      {sortOpen && (
                        <div className="bo-sort-menu">

                          {SORT_OPTIONS.map(
                            (
                              option,
                            ) => (
                              <button
                                type="button"
                                key={
                                  option.id
                                }
                                onClick={() => {
                                  if (
                                    sortBy ===
                                    option.id
                                  ) {
                                    setSortDirection(
                                      (
                                        current,
                                      ) =>
                                        current ===
                                        'asc'
                                          ? 'desc'
                                          : 'asc',
                                    );
                                  } else {
                                    setSortBy(
                                      option.id,
                                    );

                                    setSortDirection(
                                      'desc',
                                    );
                                  }

                                  setSortOpen(
                                    false,
                                  );
                                }}
                              >
                                <span>
                                  {
                                    option.label
                                  }
                                </span>

                                {sortBy ===
                                  option.id && (
                                  <span>
                                    {sortDirection ===
                                    'asc'
                                      ? '↑'
                                      : '↓'}
                                  </span>
                                )}
                              </button>
                            ),
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                </div>

                <div className="bo-select-all">

                  <button
                    type="button"
                    onClick={
                      handleSelectAll
                    }
                  >
                    {selectedBudgets.length ===
                      filteredBudgets.length &&
                    filteredBudgets.length >
                      0 ? (
                      <Check
                        size={10}
                      />
                    ) : null}
                  </button>

                  <span>
                    {selectedBudgets.length
                      ? `${selectedBudgets.length} selected`
                      : 'Select budgets for comparison'}
                  </span>

                  <div
                    style={{
                      marginLeft:'auto',
                      display:'flex',
                      alignItems:'center',
                      gap:7,
                    }}
                  >
                    <span>
                      {totals.healthy}{' '}
                      healthy
                    </span>

                    <span>
                      •
                    </span>

                    <span
                      style={{
                        color:'#fbbf24',
                      }}
                    >
                      {totals.watch}{' '}
                      watch
                    </span>

                    <span>
                      •
                    </span>

                    <span
                      style={{
                        color:'#fb7185',
                      }}
                    >
                      {totals.over}{' '}
                      over
                    </span>
                  </div>

                </div>

                <div
                  style={{
                    padding:'8px 11px 0',
                  }}
                >
                  <StatusFilter
                    value={
                      statusFilter
                    }
                    onChange={
                      setStatusFilter
                    }
                  />
                </div>

                {filteredBudgets.length >
                0 ? (
                  <div className="bo-budget-grid">

                    {filteredBudgets.map(
                      (
                        budget,
                      ) => (
                        <BudgetCard
                          key={
                            budget.id
                          }
                          budget={
                            budget
                          }
                          hiddenAmounts={
                            hiddenAmounts
                          }
                          selected={selectedSet.has(
                            budget.id,
                          )}
                          onSelect={
                            handleSelectBudget
                          }
                          onOpen={(
                            item,
                          ) => {
                            setActiveBudget(
                              item,
                            );

                            onBudgetClick?.(
                              item,
                            );
                          }}
                        />
                      ),
                    )}

                  </div>
                ) : (
                  <div
                    style={{
                      minHeight:220,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      flexDirection:'column',
                      color:'#475569',
                      gap:8,
                      padding:25,
                    }}
                  >
                    <Search
                      size={22}
                    />

                    <strong
                      style={{
                        color:'#64748b',
                        fontSize:10,
                      }}
                    >
                      No matching budgets
                    </strong>

                    <span
                      style={{
                        fontSize:8,
                      }}
                    >
                      Try changing the search
                      or status filter.
                    </span>
                  </div>
                )}

                {/* ========================================================
                    SELECTED COMPARISON STRIP
                ======================================================== */}

                {selectedBudgets.length >
                  0 && (
                  <div
                    style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      gap:12,
                      padding:'10px 14px',
                      borderTop:'1px solid rgba(148,163,184,.07)',
                      background:'rgba(96,165,250,.025)',
                    }}
                  >

                    <div
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:8,
                        color:'#64748b',
                        fontSize:8,
                      }}
                    >
                      <Layers3
                        size={12}
                      />

                      {selectedBudgets.length}{' '}
                      budgets selected for
                      comparison
                    </div>

                    <button
                      type="button"
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:5,
                        padding:'6px 8px',
                        border:'1px solid rgba(96,165,250,.13)',
                        borderRadius:7,
                        color:'#60a5fa',
                        background:'rgba(96,165,250,.05)',
                        fontSize:7,
                        fontWeight:750,
                        cursor:'pointer',
                      }}
                      onClick={() =>
                        setSelectedBudgets(
                          [],
                        )
                      }
                    >
                      Clear selection
                      <X
                        size={10}
                      />
                    </button>

                  </div>
                )}

              </div>
            )}

            {/* ============================================================
                FOOTER SIGNALS
            ============================================================ */}

            <div
              style={{
                display:'grid',
                gridTemplateColumns:
                  'repeat(4,minmax(0,1fr))',
                gap:8,
                marginTop:10,
              }}
            >

              <div
                style={{
                  padding:11,
                  border:'1px solid rgba(148,163,184,.07)',
                  borderRadius:12,
                  background:'rgba(148,163,184,.015)',
                }}
              >
                <span
                  style={{
                    display:'block',
                    color:'#475569',
                    fontSize:7,
                  }}
                >
                  Highest utilization
                </span>

                <strong
                  style={{
                    display:'block',
                    marginTop:4,
                    color:'#fb7185',
                    fontSize:10,
                  }}
                >
                  {percent(
                    highestRiskBudget.utilization,
                  )}
                </strong>

                <span
                  style={{
                    display:'block',
                    marginTop:2,
                    overflow:'hidden',
                    color:'#334155',
                    fontSize:6,
                    textOverflow:'ellipsis',
                    whiteSpace:'nowrap',
                  }}
                >
                  {
                    highestRiskBudget.name
                  }
                </span>
              </div>

              <div
                style={{
                  padding:11,
                  border:'1px solid rgba(148,163,184,.07)',
                  borderRadius:12,
                  background:'rgba(148,163,184,.015)',
                }}
              >
                <span
                  style={{
                    display:'block',
                    color:'#475569',
                    fontSize:7,
                  }}
                >
                  Largest allocation
                </span>

                <strong
                  style={{
                    display:'block',
                    marginTop:4,
                    color:'#60a5fa',
                    fontSize:10,
                  }}
                >
                  {hiddenAmounts
                    ? '••••••'
                    : compactCurrency(
                        largestBudget.budget,
                      )}
                </strong>

                <span
                  style={{
                    display:'block',
                    marginTop:2,
                    overflow:'hidden',
                    color:'#334155',
                    fontSize:6,
                    textOverflow:'ellipsis',
                    whiteSpace:'nowrap',
                  }}
                >
                  {
                    largestBudget.name
                  }
                </span>
              </div>

              <div
                style={{
                  padding:11,
                  border:'1px solid rgba(148,163,184,.07)',
                  borderRadius:12,
                  background:'rgba(148,163,184,.015)',
                }}
              >
                <span
                  style={{
                    display:'block',
                    color:'#475569',
                    fontSize:7,
                  }}
                >
                  Largest spending
                </span>

                <strong
                  style={{
                    display:'block',
                    marginTop:4,
                    color:'#fbbf24',
                    fontSize:10,
                  }}
                >
                  {hiddenAmounts
                    ? '••••••'
                    : compactCurrency(
                        largestSpend.spent,
                      )}
                </strong>

                <span
                  style={{
                    display:'block',
                    marginTop:2,
                    overflow:'hidden',
                    color:'#334155',
                    fontSize:6,
                    textOverflow:'ellipsis',
                    whiteSpace:'nowrap',
                  }}
                >
                  {
                    largestSpend.name
                  }
                </span>
              </div>

              <div
                style={{
                  padding:11,
                  border:'1px solid rgba(148,163,184,.07)',
                  borderRadius:12,
                  background:'rgba(148,163,184,.015)',
                }}
              >
                <span
                  style={{
                    display:'block',
                    color:'#475569',
                    fontSize:7,
                  }}
                >
                  Average utilization
                </span>

                <strong
                  style={{
                    display:'block',
                    marginTop:4,
                    color:
                      averageUtilization >
                      90
                        ? '#fb7185'
                        : averageUtilization >
                          75
                        ? '#fbbf24'
                        : '#34d399',
                    fontSize:10,
                  }}
                >
                  {percent(
                    averageUtilization,
                  )}
                </strong>

                <span
                  style={{
                    display:'block',
                    marginTop:2,
                    color:'#334155',
                    fontSize:6,
                  }}
                >
                  Across all budgets
                </span>
              </div>

            </div>

            {/* ============================================================
                FOOTER
            ============================================================ */}

            <div
              style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between',
                gap:15,
                marginTop:11,
                padding:'2px 2px 0',
                color:'#334155',
                fontSize:7,
              }}
            >

              <div
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:6,
                }}
              >
                <Clock3
                  size={9}
                />

                <span>
                  {selectedPeriod}{' '}
                  budget intelligence
                </span>
              </div>

              <div
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:7,
                }}
              >
                <span>
                  {totals.count}{' '}
                  budgets analyzed
                </span>

                <span>
                  •
                </span>

                <span>
                  {totals.healthy}{' '}
                  healthy
                </span>

                <span>
                  •
                </span>

                <span>
                  {totals.over}{' '}
                  over budget
                </span>
              </div>

            </div>

          </>
        )}

      </div>

      {/* ================================================================
          DETAIL MODAL
      ================================================================ */}

      {activeBudget && (
        <BudgetDetailsModal
          budget={
            activeBudget
          }
          hiddenAmounts={
            hiddenAmounts
          }
          onClose={() =>
            setActiveBudget(
              null,
            )
          }
        />
      )}

    </section>
  );
}