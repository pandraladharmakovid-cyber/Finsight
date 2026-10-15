import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getDashboard,
  getDashboardActivity,
  getDashboardAnalytics,
} from '../services/dashboardService.js';

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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function useDashboard(
  options = {},
) {
  const {
    autoFetch = true,
  } = options;

  const mountedRef = useRef(true);

  const [dashboard, setDashboard] =
    useState(null);

  const [activity, setActivity] =
    useState([]);

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(autoFetch);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadDashboard = useCallback(
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
          dashboardResponse,
          activityResponse,
          analyticsResponse,
        ] = await Promise.all([
          getDashboard(),
          getDashboardActivity(),
          getDashboardAnalytics(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        setDashboard(
          extractData(
            dashboardResponse,
          ),
        );

        const activityData =
          extractData(
            activityResponse,
          );

        setActivity(
          asArray(activityData) ||
            asArray(
              activityData?.activity,
            ) ||
            asArray(
              activityData?.transactions,
            ),
        );

        setAnalytics(
          extractData(
            analyticsResponse,
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
                'Unable to load dashboard data.',
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
      loadDashboard({
        silent: true,
      }),
    [loadDashboard],
  );

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    loadDashboard();
  }, [
    autoFetch,
    loadDashboard,
  ]);

  const metrics = useMemo(() => {
    const source =
      dashboard?.summary ??
      dashboard?.financialSummary ??
      dashboard ??
      {};

    return {
      totalBalance:
        Number(
          source?.totalBalance ??
            source?.total_balance ??
            0,
        ) || 0,

      totalIncome:
        Number(
          source?.totalIncome ??
            source?.total_income ??
            0,
        ) || 0,

      totalExpenses:
        Number(
          source?.totalExpenses ??
            source?.total_expenses ??
            0,
        ) || 0,

      netCashFlow:
        Number(
          source?.netCashFlow ??
            source?.net_cash_flow ??
            0,
        ) || 0,

      accountCount:
        Number(
          source?.accountCount ??
            source?.account_count ??
            0,
        ) || 0,

      transactionCount:
        Number(
          source?.transactionCount ??
            source?.transaction_count ??
            0,
        ) || 0,
    };
  }, [dashboard]);

  const dashboardData = useMemo(
    () => ({
      ...dashboard,
      metrics,
      activity,
      analytics,
    }),
    [
      dashboard,
      metrics,
      activity,
      analytics,
    ],
  );

  return {
    dashboard,
    dashboardData,
    activity,
    analytics,

    metrics,

    loading,
    refreshing,
    error,

    loadDashboard,
    refresh,
  };
}