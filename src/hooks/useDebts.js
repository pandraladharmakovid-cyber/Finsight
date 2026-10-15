import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getDebts,
  getDebt,
  getDebtSummary,
  getDebtOverview,
} from '../services/debtService.js';

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

function normalizeDebt(debt, index) {
  if (!debt || typeof debt !== 'object') {
    return {
      debtId: `debt-${index}`,
      name: 'Unnamed Debt',
      principal: 0,
      outstanding: 0,
      interestRate: 0,
      minimumPayment: 0,
      status: 'unknown',
      raw: debt,
    };
  }

  const debtId =
    debt.debtId ??
    debt.debt_id ??
    debt.id ??
    `debt-${index}`;

  const principal = number(
    debt.principal ??
      debt.originalAmount ??
      debt.original_amount ??
      debt.amount,
  );

  const outstanding = number(
    debt.outstandingBalance ??
      debt.outstanding_balance ??
      debt.remainingBalance ??
      debt.remaining_balance ??
      debt.balance ??
      debt.currentBalance ??
      debt.current_balance,
  );

  const interestRate = number(
    debt.interestRate ??
      debt.interest_rate ??
      debt.apr,
  );

  const minimumPayment = number(
    debt.minimumPayment ??
      debt.minimum_payment ??
      debt.minPayment ??
      debt.min_payment,
  );

  return {
    ...debt,

    debtId,
    name:
      debt.name ??
      debt.debtName ??
      debt.debt_name ??
      debt.lender ??
      `Debt ${index + 1}`,

    principal,
    outstanding,

    interestRate,
    minimumPayment,

    progress:
      principal > 0
        ? Math.min(
            100,
            Math.max(
              0,
              ((principal - outstanding) /
                principal) *
                100,
            ),
          )
        : 0,

    raw: debt,
  };
}

export default function useDebts(
  options = {},
) {
  const {
    autoFetch = true,
    selectedDebtId = null,
  } = options;

  const mountedRef = useRef(true);

  const [debts, setDebts] = useState([]);
  const [summary, setSummary] =
    useState(null);
  const [overview, setOverview] =
    useState(null);
  const [selectedDebt, setSelectedDebt] =
    useState(null);

  const [loading, setLoading] =
    useState(autoFetch);

  const [refreshing, setRefreshing] =
    useState(false);

  const [selectedDebtLoading, setSelectedDebtLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [selectedDebtError, setSelectedDebtError] =
    useState(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadDebts = useCallback(
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
          debtsResponse,
          summaryResponse,
          overviewResponse,
        ] = await Promise.all([
          getDebts(),
          getDebtSummary(),
          getDebtOverview(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        const debtsData =
          unwrap(debtsResponse);

        const summaryData =
          unwrap(summaryResponse);

        const overviewData =
          unwrap(overviewResponse);

        setDebts(
          toArray(
            debtsData?.debts ??
              debtsData?.items ??
              debtsData,
          ).map(normalizeDebt),
        );

        setSummary(
          summaryData?.summary ??
            summaryData ??
            null,
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
                'Unable to load debt data.',
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

  const loadDebt = useCallback(
    async (debtId) => {
      if (
        debtId === null ||
        debtId === undefined ||
        debtId === ''
      ) {
        setSelectedDebt(null);
        return null;
      }

      setSelectedDebtLoading(true);
      setSelectedDebtError(null);

      try {
        const response =
          await getDebt(debtId);

        if (!mountedRef.current) {
          return null;
        }

        const data = unwrap(response);

        const debt = normalizeDebt(
          data?.debt ??
            data,
          0,
        );

        setSelectedDebt(debt);

        return debt;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        const normalizedError =
          err instanceof Error
            ? err
            : new Error(
                'Unable to load the selected debt.',
              );

        setSelectedDebtError(
          normalizedError,
        );

        return null;
      } finally {
        if (mountedRef.current) {
          setSelectedDebtLoading(false);
        }
      }
    },
    [],
  );

  const refresh = useCallback(
    () =>
      loadDebts({
        silent: true,
      }),
    [loadDebts],
  );

  const clearSelectedDebt = useCallback(() => {
    setSelectedDebt(null);
    setSelectedDebtError(null);
  }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    loadDebts();
  }, [
    autoFetch,
    loadDebts,
  ]);

  useEffect(() => {
    if (
      selectedDebtId === null ||
      selectedDebtId === undefined
    ) {
      return;
    }

    loadDebt(selectedDebtId);
  }, [
    selectedDebtId,
    loadDebt,
  ]);

  const metrics = useMemo(() => {
    const source =
      summary?.summary ??
      summary ??
      overview?.summary ??
      overview ??
      {};

    const totalDebt = number(
      source.totalDebt ??
        source.total_debt ??
        source.totalOutstanding ??
        source.total_outstanding ??
        source.outstandingDebt ??
        source.outstanding_debt,
    );

    const totalPrincipal = number(
      source.totalPrincipal ??
        source.total_principal ??
        source.originalDebt ??
        source.original_debt,
    );

    const totalPaid = number(
      source.totalPaid ??
        source.total_paid ??
        source.paidAmount ??
        source.paid_amount ??
        Math.max(
          0,
          totalPrincipal - totalDebt,
        ),
    );

    const totalMinimumPayment =
      number(
        source.totalMinimumPayment ??
          source.total_minimum_payment ??
          source.minimumPayments ??
          source.minimum_payments,
      );

    const averageInterestRate =
      number(
        source.averageInterestRate ??
          source.average_interest_rate ??
          source.avgInterestRate ??
          source.avg_interest_rate,
      );

    const debtCount =
      number(
        source.debtCount ??
          source.debt_count,
      ) ||
      debts.length;

    return {
      totalDebt,
      totalPrincipal,
      totalPaid,
      totalMinimumPayment,
      averageInterestRate,
      debtCount,

      payoffProgress:
        totalPrincipal > 0
          ? Math.min(
              100,
              Math.max(
                0,
                (totalPaid /
                  totalPrincipal) *
                  100,
              ),
            )
          : 0,
    };
  }, [
    summary,
    overview,
    debts.length,
  ]);

  const debtMap = useMemo(
    () =>
      new Map(
        debts.map((debt) => [
          String(debt.debtId),
          debt,
        ]),
      ),
    [debts],
  );

  const highestInterestDebt =
    useMemo(() => {
      if (!debts.length) {
        return null;
      }

      return [...debts].sort(
        (a, b) =>
          b.interestRate -
          a.interestRate,
      )[0];
    }, [debts]);

  const largestDebt = useMemo(() => {
    if (!debts.length) {
      return null;
    }

    return [...debts].sort(
      (a, b) =>
        b.outstanding -
        a.outstanding,
    )[0];
  }, [debts]);

  const debtHealth = useMemo(() => {
    if (!debts.length) {
      return 'clear';
    }

    const overdueCount =
      debts.filter((debt) => {
        const status = String(
          debt.status ??
            debt.paymentStatus ??
            debt.payment_status ??
            '',
        ).toLowerCase();

        return (
          status.includes('overdue') ||
          status.includes('late') ||
          status.includes('default')
        );
      }).length;

    if (overdueCount > 0) {
      return 'critical';
    }

    if (
      metrics.averageInterestRate >=
      15
    ) {
      return 'attention';
    }

    return 'healthy';
  }, [
    debts,
    metrics.averageInterestRate,
  ]);

  return {
    debts,
    summary,
    overview,
    selectedDebt,

    metrics,

    debtMap,

    highestInterestDebt,
    largestDebt,
    debtHealth,

    loading,
    refreshing,
    selectedDebtLoading,

    error,
    selectedDebtError,

    loadDebts,
    loadDebt,
    refresh,

    clearSelectedDebt,
  };
}