import {
  listAccounts,
  listActiveAccounts,
  findAccount,
  requireAccount,
  getAccountSummary,
  addAccountForUser,
  editAccountForUser,
  removeAccountForUser,
} from '../services/accountService.js';

export async function getAccounts(req, res) {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid userId is required.',
    });
  }

  const accounts = await listAccounts(userId);

  return res.status(200).json({
    success: true,
    data: accounts,
  });
}

export async function getActiveAccounts(req, res) {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid userId is required.',
    });
  }

  const accounts = await listActiveAccounts(userId);

  return res.status(200).json({
    success: true,
    data: accounts,
  });
}

export async function getAccount(req, res) {
  const accountId = Number(req.params.accountId);
  const userId = Number(req.params.userId);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid accountId is required.',
    });
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid userId is required.',
    });
  }

  const account = await findAccount(accountId, userId);

  if (!account) {
    return res.status(404).json({
      success: false,
      message: 'Account not found.',
    });
  }

  return res.status(200).json({
    success: true,
    data: account,
  });
}

export async function getRequiredAccount(req, res) {
  const accountId = Number(req.params.accountId);
  const userId = Number(req.params.userId);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid accountId is required.',
    });
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid userId is required.',
    });
  }

  const account = await requireAccount(accountId, userId);

  return res.status(200).json({
    success: true,
    data: account,
  });
}

export async function getAccountSummaryData(req, res) {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid userId is required.',
    });
  }

  const summary = await getAccountSummary(userId);

  return res.status(200).json({
    success: true,
    data: summary,
  });
}

export async function createNewAccount(req, res) {
  const userId = Number(req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid userId is required.',
    });
  }

  const created = await addAccountForUser(userId, req.body);

  return res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: created,
  });
}

export async function updateExistingAccount(req, res) {
  const userId = Number(req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1);
  const accountId = Number(req.params.accountId);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid accountId is required.',
    });
  }

  const updated = await editAccountForUser(accountId, userId, req.body);

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Account not found.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Account updated successfully.',
    data: updated,
  });
}

export async function deleteExistingAccount(req, res) {
  const userId = Number(req.params.userId ?? req.body?.user_id ?? req.body?.userId ?? 1);
  const accountId = Number(req.params.accountId);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'A valid accountId is required.',
    });
  }

  const deleted = await removeAccountForUser(accountId, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Account not found.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Account deleted successfully.',
    data: deleted,
  });
}