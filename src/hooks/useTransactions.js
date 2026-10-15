import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getTransactions,
  getTransaction,
  getRecentTransactions,
  getTransactionSummary,
  getTransactionCount,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
} from '../services/transactionService.js';

function unwrap(response) {
  if (
    response &&
    typeof response === 'object' &&
    Object.prototype.hasOwnProperty.call(response, 'data')
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
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTransaction(transaction, index) {
  if (!transaction || typeof transaction !== 'object') {
    return {
      transactionId: `transaction-${index}`,
      description: 'Unknown transaction',
      amount: 0,
      type: 'unknown',
      raw: transaction,
    };
  }

  const transactionId =
    transaction.transactionId ??
    transaction.transaction_id ??
    transaction.id ??
    `transaction-${index}`;

  const amount = number(
    transaction.amount ??
      transaction.transactionAmount ??
      transaction.transaction_amount ??
      transaction.value,
  );

  const rawType =
    transaction.type ??
    transaction.transactionType ??
    transaction.transaction_type ??
    transaction.kind ??
    '';

  const normalizedType = String(rawType).toLowerCase();
  let type = normalizedType;

  if (
    normalizedType === 'credit' ||
    normalizedType === 'income' ||
    normalizedType === 'deposit'
  ) {
    type = 'income';
  } else if (
    normalizedType === 'debit' ||
    normalizedType === 'expense' ||
    normalizedType === 'withdrawal'
  ) {
    type = 'expense';
  }

  return {
    ...transaction,
    transactionId,
    description:
      transaction.description ??
      transaction.merchantName ??
      transaction.merchant_name ??
      transaction.merchant ??
      transaction.title ??
      'Untitled transaction',
    amount,
    type,
    category:
      transaction.categoryName ??
      transaction.category_name ??
      transaction.category ??
      null,
    account:
      transaction.accountName ??
      transaction.account_name ??
      transaction.account ??
      null,
    accountId:
      transaction.accountId ??
      transaction.account_id ??
      null,
    categoryId:
      transaction.categoryId ??
      transaction.category_id ??
      null,
    transactionDate:
      transaction.transactionDate ??
      transaction.transaction_date ??
      transaction.date ??
      transaction.createdAt ??
      transaction.created_at ??
      null,
    raw: transaction,
  };
}

export default function useTransactions(options = {}) {
  const { autoFetch = true, limit = null } = options;
  const mountedRef = useRef(true);

  const [transactions, setTransactions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [summary, setSummary] = useState(null);
  const [count, setCount] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [loading, setLoading] = useState(autoFetch);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [selectedError, setSelectedError] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadTransactions = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [
          transactionsResponse,
          recentResponse,
          summaryResponse,
          countResponse,
        ] = await Promise.all([
          getTransactions(limit ? { limit } : undefined),
          getRecentTransactions(),
          getTransactionSummary(),
          getTransactionCount(),
        ]);

        if (!mountedRef.current) return;

        const transactionsData = unwrap(transactionsResponse);
        const recentData = unwrap(recentResponse);
        const summaryData = unwrap(summaryResponse);
        const countData = unwrap(countResponse);

        const transactionList =
          transactionsData?.transactions ??
          transactionsData?.items ??
          transactionsData;

        const recentList =
          recentData?.transactions ??
          recentData?.items ??
          recentData;

        setTransactions(toArray(transactionList).map(normalizeTransaction));
        setRecent(toArray(recentList).map(normalizeTransaction));
        setSummary(summaryData?.summary ?? summaryData ?? null);

        const numericCount = number(
          countData?.count ??
            countData?.transactionCount ??
            countData?.transaction_count ??
            countData,
        );

        setCount(Number.isFinite(numericCount) ? numericCount : null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(
          err instanceof Error
            ? err
            : new Error('Unable to load transaction data.'),
        );
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [limit],
  );

  const loadTransaction = useCallback(async (transactionId) => {
    if (transactionId === null || transactionId === undefined || transactionId === '') {
      setSelectedTransaction(null);
      return null;
    }

    setSelectedLoading(true);
    setSelectedError(null);

    try {
      const response = await getTransaction(transactionId);
      if (!mountedRef.current) return null;

      const data = unwrap(response);
      const transaction = data?.transaction ?? data;
      const normalized = normalizeTransaction(transaction, 0);

      setSelectedTransaction(normalized);
      return normalized;
    } catch (err) {
      if (!mountedRef.current) return null;
      setSelectedError(
        err instanceof Error
          ? err
          : new Error('Unable to load the selected transaction.'),
      );
      return null;
    } finally {
      if (mountedRef.current) {
        setSelectedLoading(false);
      }
    }
  }, []);

  const addTransaction = useCallback(
    async (payload) => {
      setSubmitting(true);
      try {
        const res = await apiCreateTransaction(payload);
        await loadTransactions({ silent: true });
        return unwrap(res);
      } finally {
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [loadTransactions],
  );

  const editTransaction = useCallback(
    async (transactionId, payload) => {
      setSubmitting(true);
      try {
        const res = await apiUpdateTransaction(transactionId, payload);
        await loadTransactions({ silent: true });
        return unwrap(res);
      } finally {
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [loadTransactions],
  );

  const removeTransaction = useCallback(
    async (transactionId) => {
      setSubmitting(true);
      try {
        const res = await apiDeleteTransaction(transactionId);
        await loadTransactions({ silent: true });
        return unwrap(res);
      } finally {
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [loadTransactions],
  );

  const refresh = useCallback(
    () => loadTransactions({ silent: true }),
    [loadTransactions],
  );

  const clearSelectedTransaction = useCallback(() => {
    setSelectedTransaction(null);
    setSelectedError(null);
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    loadTransactions();
  }, [autoFetch, loadTransactions]);

  const transactionMap = useMemo(
    () =>
      new Map(
        transactions.map((transaction) => [
          String(transaction.transactionId),
          transaction,
        ]),
      ),
    [transactions],
  );

  const metrics = useMemo(() => {
    const source = summary?.summary ?? summary ?? {};

    const calculatedIncome = transactions.reduce(
      (total, transaction) =>
        transaction.type === 'income'
          ? total + Math.abs(transaction.amount)
          : total,
      0,
    );

    const calculatedExpenses = transactions.reduce(
      (total, transaction) =>
        transaction.type === 'expense'
          ? total + Math.abs(transaction.amount)
          : total,
      0,
    );

    const totalIncome = number(
      source.totalIncome ??
        source.total_income ??
        source.income ??
        calculatedIncome,
    );

    const totalExpenses = number(
      source.totalExpenses ??
        source.total_expenses ??
        source.expenses ??
        calculatedExpenses,
    );

    const transactionCount =
      number(source.transactionCount ?? source.transaction_count) ||
      number(count) ||
      transactions.length;

    const netCashFlow = number(
      source.netCashFlow ??
        source.net_cash_flow ??
        source.netIncome ??
        source.net_income ??
        totalIncome - totalExpenses,
    );

    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      transactionCount,
      averageTransaction:
        transactionCount > 0
          ? (totalIncome + totalExpenses) / transactionCount
          : 0,
    };
  }, [summary, transactions, count]);

  const incomeTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'income'),
    [transactions],
  );

  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'expense'),
    [transactions],
  );

  const categoryBreakdown = useMemo(() => {
    const map = new Map();

    expenseTransactions.forEach((transaction) => {
      const key = transaction.category || 'Uncategorized';
      const existing = map.get(key) || {
        category: key,
        amount: 0,
        count: 0,
      };
      existing.amount += Math.abs(transaction.amount);
      existing.count += 1;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [expenseTransactions]);

  const largestExpense = useMemo(() => {
    if (!expenseTransactions.length) return null;
    return [...expenseTransactions].sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
    )[0];
  }, [expenseTransactions]);

  const largestIncome = useMemo(() => {
    if (!incomeTransactions.length) return null;
    return [...incomeTransactions].sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
    )[0];
  }, [incomeTransactions]);

  return {
    transactions,
    recent,
    summary,
    count,
    selectedTransaction,
    metrics,
    transactionMap,
    incomeTransactions,
    expenseTransactions,
    categoryBreakdown,
    largestExpense,
    largestIncome,
    loading,
    refreshing,
    selectedLoading,
    submitting,
    error,
    selectedError,
    loadTransactions,
    loadTransaction,
    addTransaction,
    editTransaction,
    removeTransaction,
    refresh,
    clearSelectedTransaction,
  };
}