import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getSavingsGoals,
  getSavingsGoal,
  getSavingsOverview,
} from '../services/savingsService.js';

function unwrap(response) {
  if (
    response &&
    typeof response === 'object' &&
    Object.prototype.hasOwnProperty.call(
      response,
      'data',
    )
  ) {
    return response.data;
  }

  return response;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function number(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function normalizeGoal(
  goal,
  index,
) {
  if (
    !goal ||
    typeof goal !== 'object'
  ) {
    return {
      goalId: `goal-${index}`,
      name: `Savings Goal ${index + 1}`,
      targetAmount: 0,
      currentAmount: 0,
      remainingAmount: 0,
      progress: 0,
      raw: goal,
    };
  }

  const goalId =
    goal.goalId ??
    goal.goal_id ??
    goal.savingsGoalId ??
    goal.savings_goal_id ??
    goal.id ??
    `goal-${index}`;

  const targetAmount = number(
    goal.targetAmount ??
      goal.target_amount ??
      goal.goalAmount ??
      goal.goal_amount ??
      goal.amount,
  );

  const currentAmount = number(
    goal.currentAmount ??
      goal.current_amount ??
      goal.savedAmount ??
      goal.saved_amount ??
      goal.currentSavings ??
      goal.current_savings ??
      goal.progressAmount ??
      goal.progress_amount,
  );

  const remainingAmount = Math.max(
    0,
    number(
      goal.remainingAmount ??
        goal.remaining_amount ??
        goal.remaining ??
        targetAmount -
          currentAmount,
    ),
  );

  const progress =
    targetAmount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (currentAmount /
              targetAmount) *
              100,
          ),
        )
      : 0;

  return {
    ...goal,

    goalId,

    name:
      goal.name ??
      goal.goalName ??
      goal.goal_name ??
      goal.title ??
      `Savings Goal ${index + 1}`,

    description:
      goal.description ??
      null,

    targetAmount,
    currentAmount,
    remainingAmount,
    progress,

    targetDate:
      goal.targetDate ??
      goal.target_date ??
      goal.deadline ??
      null,

    status:
      goal.status ??
      goal.goalStatus ??
      goal.goal_status ??
      'active',

    raw: goal,
  };
}

export default function useSavings(
  options = {},
) {
  const {
    autoFetch = true,
  } = options;

  const mountedRef = useRef(true);

  const [goals, setGoals] =
    useState([]);

  const [overview, setOverview] =
    useState(null);

  const [
    selectedGoal,
    setSelectedGoal,
  ] = useState(null);

  const [loading, setLoading] =
    useState(autoFetch);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    selectedLoading,
    setSelectedLoading,
  ] = useState(false);

  const [error, setError] =
    useState(null);

  const [
    selectedError,
    setSelectedError,
  ] = useState(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadSavings = useCallback(
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
          goalsResponse,
          overviewResponse,
        ] = await Promise.all([
          getSavingsGoals(),
          getSavingsOverview(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        const goalsData =
          unwrap(goalsResponse);

        const overviewData =
          unwrap(overviewResponse);

        const goalList =
          goalsData?.goals ??
          goalsData?.savingsGoals ??
          goalsData?.savings_goals ??
          goalsData?.items ??
          goalsData;

        setGoals(
          toArray(goalList).map(
            normalizeGoal,
          ),
        );

        setOverview(
          overviewData?.overview ??
            overviewData ??
            null,
        );
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }

        setError(
          err instanceof Error
            ? err
            : new Error(
                'Unable to load savings data.',
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

  const loadGoal = useCallback(
    async (goalId) => {
      if (
        goalId === null ||
        goalId === undefined ||
        goalId === ''
      ) {
        setSelectedGoal(null);
        return null;
      }

      setSelectedLoading(true);
      setSelectedError(null);

      try {
        const response =
          await getSavingsGoal(
            goalId,
          );

        if (!mountedRef.current) {
          return null;
        }

        const data =
          unwrap(response);

        const goal =
          data?.goal ??
          data?.savingsGoal ??
          data?.savings_goal ??
          data;

        const normalized =
          normalizeGoal(
            goal,
            0,
          );

        setSelectedGoal(
          normalized,
        );

        return normalized;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        const normalizedError =
          err instanceof Error
            ? err
            : new Error(
                'Unable to load the selected savings goal.',
              );

        setSelectedError(
          normalizedError,
        );

        return null;
      } finally {
        if (mountedRef.current) {
          setSelectedLoading(false);
        }
      }
    },
    [],
  );

  const refresh = useCallback(
    () =>
      loadSavings({
        silent: true,
      }),
    [loadSavings],
  );

  const clearSelectedGoal =
    useCallback(() => {
      setSelectedGoal(null);
      setSelectedError(null);
    }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    loadSavings();
  }, [
    autoFetch,
    loadSavings,
  ]);

  const goalMap = useMemo(
    () =>
      new Map(
        goals.map((goal) => [
          String(goal.goalId),
          goal,
        ]),
      ),
    [goals],
  );

  const metrics = useMemo(() => {
    const source =
      overview?.summary ??
      overview ??
      {};

    const calculatedTarget =
      goals.reduce(
        (total, goal) =>
          total +
          goal.targetAmount,
        0,
      );

    const calculatedCurrent =
      goals.reduce(
        (total, goal) =>
          total +
          goal.currentAmount,
        0,
      );

    const calculatedRemaining =
      goals.reduce(
        (total, goal) =>
          total +
          goal.remainingAmount,
        0,
      );

    const totalTarget = number(
      source.totalTarget ??
        source.total_target ??
        source.totalGoalAmount ??
        source.total_goal_amount ??
        calculatedTarget,
    );

    const totalSaved = number(
      source.totalSaved ??
        source.total_saved ??
        source.totalCurrentAmount ??
        source.total_current_amount ??
        calculatedCurrent,
    );

    const totalRemaining = number(
      source.totalRemaining ??
        source.total_remaining ??
        source.remainingAmount ??
        source.remaining_amount ??
        calculatedRemaining,
    );

    const goalCount =
      number(
        source.goalCount ??
          source.goal_count,
      ) || goals.length;

    const completedCount =
      goals.filter(
        (goal) =>
          goal.progress >= 100 ||
          String(
            goal.status ?? '',
          ).toLowerCase() ===
            'completed',
      ).length;

    const activeCount =
      goals.filter(
        (goal) => {
          const status =
            String(
              goal.status ?? '',
            ).toLowerCase();

          return ![
            'completed',
            'cancelled',
            'canceled',
            'inactive',
          ].includes(status);
        },
      ).length;

    const progress =
      totalTarget > 0
        ? Math.min(
            100,
            Math.max(
              0,
              (totalSaved /
                totalTarget) *
                100,
            ),
          )
        : 0;

    return {
      totalTarget,
      totalSaved,
      totalRemaining,
      goalCount,
      completedCount,
      activeCount,
      progress,
    };
  }, [
    goals,
    overview,
  ]);

  const bestProgressGoal =
    useMemo(() => {
      if (!goals.length) {
        return null;
      }

      return [...goals].sort(
        (a, b) =>
          b.progress -
          a.progress,
      )[0];
    }, [goals]);

  const largestGoal =
    useMemo(() => {
      if (!goals.length) {
        return null;
      }

      return [...goals].sort(
        (a, b) =>
          b.targetAmount -
          a.targetAmount,
      )[0];
    }, [goals]);

  const upcomingGoals =
    useMemo(() => {
      return [...goals]
        .filter(
          (goal) =>
            goal.targetDate,
        )
        .sort((a, b) => {
          const first =
            new Date(
              a.targetDate,
            ).getTime();

          const second =
            new Date(
              b.targetDate,
            ).getTime();

          return (
            first - second
          );
        });
    }, [goals]);

  return {
    goals,
    overview,
    selectedGoal,

    metrics,

    goalMap,

    bestProgressGoal,
    largestGoal,
    upcomingGoals,

    loading,
    refreshing,
    selectedLoading,

    error,
    selectedError,

    loadSavings,
    loadGoal,
    refresh,

    clearSelectedGoal,
  };
}