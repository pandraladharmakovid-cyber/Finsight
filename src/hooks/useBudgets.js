import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getBudgets,
  getBudget,
  getBudgetSummary,
  getBudgetPerformance,
} from '../services/budgetService.js';

function extractData(response) {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response
  ) {
    return response.data;
  }

  return response;
}

function normalizeBudgets(response) {
  const data = extractData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.budgets)) {
    return data.budgets;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  return [];
}

function normalizePerformance(response) {
  const data = extractData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.performance)) {
    return data.performance;
  }

  if (Array.isArray(data?.budgets)) {
    return data.budgets;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  return [];
}

function normalizeSummary(response) {
  const data = extractData(response);

  if (!data || typeof data !== 'object') {
    return {};
  }

  if (
    data.summary &&
    typeof data.summary === 'object'
  ) {
    return data.summary;
  }

  return data;
}

function getBudgetId(budget) {
  return (
    budget?.budget_id ??
    budget?.budgetId ??
    budget?.id
  );
}

function getBudgetAmount(budget) {
  return Number(
    budget?.budget_amount ??
      budget?.budgetAmount ??
      budget?.amount ??
      0,
  ) || 0;
}

function getSpentAmount(budget) {
  return Number(
    budget?.actual_spending ??
      budget?.actualSpending ??
      budget?.spent ??
      budget?.spent_amount ??
      0,
  ) || 0;
}

function enrichBudget(budget, performanceMap) {
  const id = getBudgetId(budget);

  const performance =
    id != null
      ? performanceMap.get(String(id))
      : null;

  const source = performance
    ? {
        ...budget,
        ...performance,
      }
    : budget;

  const budgetAmount =
    getBudgetAmount(source);

  const spentAmount =
    getSpentAmount(source);

  const remaining =
    Number(
      source?.remaining_budget ??
        source?.remainingBudget ??
        budgetAmount - spentAmount,
    ) || 0;

  const utilization =
    budgetAmount > 0
      ? (spentAmount / budgetAmount) * 100
      : 0;

  let status = 'healthy';

  if (utilization >= 100) {
    status = 'over';
  } else if (utilization >= 85) {
    status = 'critical';
  } else if (utilization >= 65) {
    status = 'watch';
  }

  return {
    ...source,
    budgetId: id,
    budgetAmount,
    spentAmount,
    remaining,
    utilization,
    status,
  };
}

export default function useBudgets(
  options = {},
) {
  const {
    autoFetch = true,
  } = options;

  const mountedRef = useRef(true);

  const [budgets, setBudgets] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [performance, setPerformance] =
    useState([]);

  const [loading, setLoading] =
    useState(autoFetch);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [
    selectedBudget,
    setSelectedBudget,
  ] = useState(null);

  const [
    selectedBudgetLoading,
    setSelectedBudgetLoading,
  ] = useState(false);

  const [
    selectedBudgetError,
    setSelectedBudgetError,
  ] = useState(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadBudgets = useCallback(
    async ({
      silent = false,
    } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [
          budgetsResponse,
          summaryResponse,
          performanceResponse,
        ] = await Promise.all([
          getBudgets(),
          getBudgetSummary(),
          getBudgetPerformance(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        setBudgets(
          normalizeBudgets(
            budgetsResponse,
          ),
        );

        setSummary(
          normalizeSummary(
            summaryResponse,
          ),
        );

        setPerformance(
          normalizePerformance(
            performanceResponse,
          ),
        );
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }

        setError(
          err instanceof Error
            ? err
            : new Error(
                'Unable to load budgets.',
              ),
        );
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  const refresh = useCallback(
    () =>
      loadBudgets({
        silent: true,
      }),
    [loadBudgets],
  );

  const loadBudget = useCallback(
    async (budgetId) => {
      if (!budgetId) {
        throw new Error(
          'budgetId is required.',
        );
      }

      setSelectedBudgetLoading(
        true,
      );

      setSelectedBudgetError(null);

      try {
        const response =
          await getBudget(
            budgetId,
          );

        if (!mountedRef.current) {
          return null;
        }

        const budget =
          extractData(response);

        setSelectedBudget(
          budget,
        );

        return budget;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        const normalizedError =
          err instanceof Error
            ? err
            : new Error(
                'Unable to load the budget.',
              );

        setSelectedBudgetError(
          normalizedError,
        );

        throw normalizedError;
      } finally {
        if (mountedRef.current) {
          setSelectedBudgetLoading(
            false,
          );
        }
      }
    },
    [],
  );

  const clearSelectedBudget =
    useCallback(() => {
      setSelectedBudget(null);
      setSelectedBudgetError(null);
    }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    loadBudgets();
  }, [
    autoFetch,
    loadBudgets,
  ]);

  const performanceMap =
    useMemo(
      () =>
        new Map(
          performance
            .map((item) => {
              const id =
                getBudgetId(item);

              return id != null
                ? [
                    String(id),
                    item,
                  ]
                : null;
            })
            .filter(Boolean),
        ),
      [performance],
    );

  const enrichedBudgets =
    useMemo(
      () =>
        budgets.map((budget) =>
          enrichBudget(
            budget,
            performanceMap,
          ),
        ),
      [
        budgets,
        performanceMap,
      ],
    );

  const metrics = useMemo(() => {
    const calculatedBudget =
      enrichedBudgets.reduce(
        (total, budget) =>
          total +
          budget.budgetAmount,
        0,
      );

    const calculatedSpent =
      enrichedBudgets.reduce(
        (total, budget) =>
          total +
          budget.spentAmount,
        0,
      );

    const calculatedRemaining =
      enrichedBudgets.reduce(
        (total, budget) =>
          total +
          budget.remaining,
        0,
      );

    const totalBudget =
      Number(
        summary?.totalBudget ??
          summary?.total_budget ??
          calculatedBudget,
      ) || 0;

    const totalSpent =
      Number(
        summary?.totalSpent ??
          summary?.total_spent ??
          calculatedSpent,
      ) || 0;

    const remaining =
      Number(
        summary?.remaining ??
          summary?.remainingBudget ??
          summary?.remaining_budget ??
          totalBudget - totalSpent ??
          calculatedRemaining,
      ) || 0;

    const budgetCount =
      Number(
        summary?.budgetCount ??
          summary?.budget_count ??
          enrichedBudgets.length,
      ) || 0;

    const utilization =
      totalBudget > 0
        ? (totalSpent / totalBudget) *
          100
        : 0;

    const healthyCount =
      enrichedBudgets.filter(
        (budget) =>
          budget.status ===
          'healthy',
      ).length;

    const watchCount =
      enrichedBudgets.filter(
        (budget) =>
          budget.status ===
          'watch',
      ).length;

    const criticalCount =
      enrichedBudgets.filter(
        (budget) =>
          budget.status ===
          'critical',
      ).length;

    const overCount =
      enrichedBudgets.filter(
        (budget) =>
          budget.status === 'over',
      ).length;

    return {
      totalBudget,
      totalSpent,
      remaining,
      budgetCount,
      utilization,
      healthyCount,
      watchCount,
      criticalCount,
      overCount,
    };
  }, [
    enrichedBudgets,
    summary,
  ]);

  const budgetMap = useMemo(
    () =>
      new Map(
        enrichedBudgets
          .map((budget) => {
            const id =
              getBudgetId(budget);

            return id != null
              ? [
                  String(id),
                  budget,
                ]
              : null;
          })
          .filter(Boolean),
      ),
    [enrichedBudgets],
  );

  const getBudgetFromCache =
    useCallback(
      (budgetId) =>
        budgetMap.get(
          String(budgetId),
        ) ?? null,
      [budgetMap],
    );

  return {
    budgets: enrichedBudgets,
    rawBudgets: budgets,
    summary,
    performance,

    loading,
    refreshing,
    error,

    selectedBudget,
    selectedBudgetLoading,
    selectedBudgetError,

    metrics,

    budgetMap,
    performanceMap,
    getBudgetFromCache,

    loadBudgets,
    refresh,
    loadBudget,
    clearSelectedBudget,
  };
}