import {
  getAccountsByUserId,
  getAccountById,
  getActiveAccountsByUserId,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../db/queries.js';

export async function listAccounts(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return getAccountsByUserId(userId);
}

export async function listActiveAccounts(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return getActiveAccountsByUserId(userId);
}

export async function findAccount(accountId, userId = null) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  return getAccountById(accountId, userId);
}

export async function requireAccount(accountId, userId = null) {
  const account = await findAccount(accountId, userId);

  if (!account) {
    const error = new Error('Account not found');
    error.statusCode = 404;
    throw error;
  }

  return account;
}

export async function getAccountSummary(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const accounts = await getAccountsByUserId(userId);

  const summary = accounts.reduce(
    (result, account) => {
      const balance = Number(account.balance) || 0;

      result.totalBalance += balance;
      result.accountCount += 1;

      if (account.is_active) {
        result.activeAccountCount += 1;
      }

      return result;
    },
    {
      totalBalance: 0,
      accountCount: 0,
      activeAccountCount: 0,
    },
  );

  return {
    ...summary,
    accounts,
  };
}

export async function addAccountForUser(userId, data) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return createAccount(userId, data);
}

export async function editAccountForUser(accountId, userId, data) {
  if (!accountId || !userId) {
    throw new Error('accountId and userId are required');
  }
  return updateAccount(accountId, userId, data);
}

export async function removeAccountForUser(accountId, userId) {
  if (!accountId || !userId) {
    throw new Error('accountId and userId are required');
  }
  return deleteAccount(accountId, userId);
}

export default {
  listAccounts,
  listActiveAccounts,
  findAccount,
  requireAccount,
  getAccountSummary,
  addAccountForUser,
  editAccountForUser,
  removeAccountForUser,
};