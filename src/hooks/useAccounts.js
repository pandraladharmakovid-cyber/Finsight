import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getAccounts,
  getActiveAccounts,
  getAccountSummary,
  getAccount,
} from '../services/accountService.js';

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

function normalizeAccounts(response) {
  const data = extractData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.accounts)) {
    return data.accounts;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
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

export default function useAccounts(options = {}) {
  const {
    autoFetch = true,
    includeInactive = false,
  } = options;

  const mountedRef = useRef(true);

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({});

  const [loading, setLoading] =
    useState(autoFetch);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [selectedAccount, setSelectedAccount] =
    useState(null);

  const [selectedAccountLoading, setSelectedAccountLoading] =
    useState(false);

  const [selectedAccountError, setSelectedAccountError] =
    useState(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAccounts = useCallback(
    async ({
      silent = false,
      signal,
    } = {}) => {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const [
          accountsResponse,
          summaryResponse,
        ] = await Promise.all([
          includeInactive
            ? getAccounts()
            : getActiveAccounts(),
          getAccountSummary(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        setAccounts(
          normalizeAccounts(
            accountsResponse,
          ),
        );

        setSummary(
          normalizeSummary(
            summaryResponse,
          ),
        );
      } catch (err) {
        if (
          !mountedRef.current ||
          err?.name === 'AbortError'
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err
            : new Error(
                'Unable to load accounts.',
              ),
        );
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [includeInactive],
  );

  const refresh = useCallback(
    () =>
      loadAccounts({
        silent: true,
      }),
    [loadAccounts],
  );

  const loadAccount = useCallback(
    async (accountId) => {
      if (!accountId) {
        throw new Error(
          'accountId is required.',
        );
      }

      setSelectedAccountLoading(
        true,
      );

      setSelectedAccountError(null);

      try {
        const response =
          await getAccount(
            accountId,
          );

        if (!mountedRef.current) {
          return null;
        }

        const account =
          extractData(response);

        setSelectedAccount(
          account,
        );

        return account;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        const normalizedError =
          err instanceof Error
            ? err
            : new Error(
                'Unable to load the account.',
              );

        setSelectedAccountError(
          normalizedError,
        );

        throw normalizedError;
      } finally {
        if (mountedRef.current) {
          setSelectedAccountLoading(
            false,
          );
        }
      }
    },
    [],
  );

  const clearSelectedAccount =
    useCallback(() => {
      setSelectedAccount(null);
      setSelectedAccountError(null);
    }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    loadAccounts();
  }, [autoFetch, loadAccounts]);

  const metrics = useMemo(() => {
    const totalBalance =
      Number(
        summary?.totalBalance ??
          summary?.total_balance ??
          summary?.balance ??
          0,
      ) || 0;

    const accountCount =
      Number(
        summary?.accountCount ??
          summary?.account_count ??
          accounts.length,
      ) || 0;

    const activeAccountCount =
      Number(
        summary?.activeAccountCount ??
          summary?.active_account_count ??
          accounts.filter(
            (account) =>
              account?.is_active !== false &&
              account?.isActive !== false,
          ).length,
      ) || 0;

    const assetCount =
      accounts.filter(
        (account) => {
          const type =
            String(
              account?.account_type ??
                account?.accountType ??
                account?.type ??
                '',
            ).toLowerCase();

          return (
            type.includes('saving') ||
            type.includes('checking') ||
            type.includes('cash') ||
            type.includes('investment') ||
            type.includes('asset')
          );
        },
      ).length;

    const liabilityCount =
      accounts.filter(
        (account) => {
          const type =
            String(
              account?.account_type ??
                account?.accountType ??
                account?.type ??
                '',
            ).toLowerCase();

          return (
            type.includes('credit') ||
            type.includes('loan') ||
            type.includes('debt') ||
            type.includes('liabil')
          );
        },
      ).length;

    return {
      totalBalance,
      accountCount,
      activeAccountCount,
      assetCount,
      liabilityCount,
    };
  }, [accounts, summary]);

  const accountMap = useMemo(
    () =>
      new Map(
        accounts
          .map((account) => {
            const id =
              account?.account_id ??
              account?.accountId ??
              account?.id;

            return id != null
              ? [String(id), account]
              : null;
          })
          .filter(Boolean),
      ),
    [accounts],
  );

  const getAccountFromCache =
    useCallback(
      (accountId) =>
        accountMap.get(
          String(accountId),
        ) ?? null,
      [accountMap],
    );

  return {
    accounts,
    summary,

    loading,
    refreshing,
    error,

    selectedAccount,
    selectedAccountLoading,
    selectedAccountError,

    metrics,

    accountMap,
    getAccountFromCache,

    loadAccounts,
    refresh,
    loadAccount,
    clearSelectedAccount,
  };
}