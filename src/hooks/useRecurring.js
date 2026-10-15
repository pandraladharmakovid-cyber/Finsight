import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getRecurringTransactions,
  getRecurringTransaction,
  getRecurringOverview,
} from '../services/recurringService.js';

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

function normalizeRecurring(item, index) {
  if (!item || typeof item !== 'object') {
    return {
      recurringId: `recurring-${index}`,
      name: 'Unnamed Recurring Transaction',
      amount: 0,
      frequency: 'Unknown',
      status: 'unknown',
      raw: item,
    };
  }

  const recurringId =
    item.recurringTransactionId ??
    item.recurring_transaction_id ??
    item.recurringId ??
    item.recurring_id ??
    item.id ??
    `recurring-${index}`;

  const amount = number(
    item.amount ??
      item.transactionAmount ??
      item.transaction_amount ??
      item.recurringAmount ??
      item.recurring_amount,
  );

  const frequency =
    item.frequency ??
    item.recurrence ??
    item.interval ??
    item.recurringFrequency ??
    item.recurring_frequency ??
    'Unknown';

  const status =
    item.status ??
    item.recurringStatus ??
    item.recurring_status ??
    'active';

  return {
    ...item,

    recurringId,

    name:
      item.name ??
      item.description ??
      item.merchant ??
      item.title ??
      `Recurring ${index + 1}`,

    amount,
    frequency,
    status,

    nextDate:
      item.nextDate ??
      item.next_date ??
      item.nextOccurrence ??
      item.next_occurrence ??
      null,

    category:
      item.categoryName ??
      item.category_name ??
      item.category ??
      null,

    raw: item,
  };
}

export default function useRecurring(
  options = {},
) {
  const {
    autoFetch = true,
  } = options;

  const mountedRef = useRef(true);

  const [recurring, setRecurring] =
    useState([]);

  const [overview, setOverview] =
    useState(null);

  const [
    selectedRecurring,
    setSelectedRecurring,
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

  const loadRecurring = useCallback(
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
          recurringResponse,
          overviewResponse,
        ] = await Promise.all([
          getRecurringTransactions(),
          getRecurringOverview(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        const recurringData =
          unwrap(recurringResponse);

        const overviewData =
          unwrap(overviewResponse);

        const items =
          recurringData?.recurringTransactions ??
          recurringData?.recurring_transactions ??
          recurringData?.transactions ??
          recurringData?.items ??
          recurringData;

        setRecurring(
          toArray(items).map(
            normalizeRecurring,
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
                'Unable to load recurring transactions.',
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

  const loadRecurringTransaction =
    useCallback(
      async (recurringId) => {
        if (
          recurringId === null ||
          recurringId === undefined ||
          recurringId === ''
        ) {
          setSelectedRecurring(null);
          return null;
        }

        setSelectedLoading(true);
        setSelectedError(null);

        try {
          const response =
            await getRecurringTransaction(
              recurringId,
            );

          if (!mountedRef.current) {
            return null;
          }

          const data = unwrap(response);

          const item =
            data?.recurringTransaction ??
            data?.recurring_transaction ??
            data;

          const normalized =
            normalizeRecurring(
              item,
              0,
            );

          setSelectedRecurring(
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
                  'Unable to load the recurring transaction.',
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
      loadRecurring({
        silent: true,
      }),
    [loadRecurring],
  );

  const clearSelectedRecurring =
    useCallback(() => {
      setSelectedRecurring(null);
      setSelectedError(null);
    }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    loadRecurring();
  }, [
    autoFetch,
    loadRecurring,
  ]);

  const recurringMap = useMemo(
    () =>
      new Map(
        recurring.map((item) => [
          String(item.recurringId),
          item,
        ]),
      ),
    [recurring],
  );

  const metrics = useMemo(() => {
    const source =
      overview?.summary ??
      overview ??
      {};

    const activeItems =
      recurring.filter((item) => {
        const status = String(
          item.status ?? '',
        ).toLowerCase();

        return ![
          'inactive',
          'disabled',
          'cancelled',
          'canceled',
          'ended',
        ].includes(status);
      });

    const calculatedMonthly =
      activeItems.reduce(
        (total, item) => {
          const amount =
            item.amount;

          const frequency =
            String(
              item.frequency ?? '',
            ).toLowerCase();

          let monthlyAmount =
            amount;

          if (
            frequency.includes(
              'week',
            )
          ) {
            monthlyAmount =
              amount * 52 / 12;
          } else if (
            frequency.includes(
              'year',
            ) ||
            frequency.includes(
              'annual',
            )
          ) {
            monthlyAmount =
              amount / 12;
          } else if (
            frequency.includes(
              'quarter',
            )
          ) {
            monthlyAmount =
              amount / 3;
          }

          return (
            total +
            monthlyAmount
          );
        },
        0,
      );

    const totalAmount = number(
      source.totalAmount ??
        source.total_amount ??
        source.totalRecurringAmount ??
        source.total_recurring_amount ??
        activeItems.reduce(
          (total, item) =>
            total + item.amount,
          0,
        ),
    );

    const monthlyAmount = number(
      source.monthlyAmount ??
        source.monthly_amount ??
        source.monthlyRecurringAmount ??
        source.monthly_recurring_amount ??
        calculatedMonthly,
    );

    const activeCount =
      number(
        source.activeCount ??
          source.active_count,
      ) ||
      activeItems.length;

    const recurringCount =
      number(
        source.recurringCount ??
          source.recurring_count,
      ) ||
      recurring.length;

    return {
      totalAmount,
      monthlyAmount,
      activeCount,
      recurringCount,
    };
  }, [
    recurring,
    overview,
  ]);

  const activeRecurring =
    useMemo(
      () =>
        recurring.filter(
          (item) => {
            const status =
              String(
                item.status ?? '',
              ).toLowerCase();

            return ![
              'inactive',
              'disabled',
              'cancelled',
              'canceled',
              'ended',
            ].includes(status);
          },
        ),
      [recurring],
    );

  const upcomingRecurring =
    useMemo(
      () =>
        [...activeRecurring]
          .filter(
            (item) =>
              item.nextDate,
          )
          .sort((a, b) => {
            const first =
              new Date(
                a.nextDate,
              ).getTime();

            const second =
              new Date(
                b.nextDate,
              ).getTime();

            return (
              first - second
            );
          }),
      [activeRecurring],
    );

  return {
    recurring,
    activeRecurring,
    upcomingRecurring,

    overview,
    selectedRecurring,

    metrics,
    recurringMap,

    loading,
    refreshing,
    selectedLoading,

    error,
    selectedError,

    loadRecurring,
    loadRecurringTransaction,
    refresh,
    clearSelectedRecurring,
  };
}