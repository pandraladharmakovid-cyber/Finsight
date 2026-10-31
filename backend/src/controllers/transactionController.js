import {
  listTransactions,
  listRecentTransactions,
  findTransaction,
  requireTransaction,
  getTransactionCount,
  getTransactionSummary,
  addTransactionForUser,
  editTransactionForUser,
  removeTransactionForUser,
} from '../services/transactionService.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

export async function getTransactions(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const transactions = await listTransactions(userId, req.query);

  return res.status(200).json({
    success: true,
    data: transactions,
  });
}

export async function getRecentTransactions(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const transactions = await listRecentTransactions(userId);

  return res.status(200).json({
    success: true,
    data: transactions,
  });
}

export async function getTransaction(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const transactionId = parsePositiveInteger(req.params.transactionId, 'transactionId');

  const transaction = await findTransaction(transactionId, userId);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found.',
    });
  }

  return res.status(200).json({
    success: true,
    data: transaction,
  });
}

export async function getRequiredTransaction(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const transactionId = parsePositiveInteger(req.params.transactionId, 'transactionId');

  const transaction = await requireTransaction(transactionId, userId);

  return res.status(200).json({
    success: true,
    data: transaction,
  });
}

export async function getTransactionCountData(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const count = await getTransactionCount(userId);

  return res.status(200).json({
    success: true,
    data: { count },
  });
}

export async function getTransactionSummaryData(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const summary = await getTransactionSummary(userId);

  return res.status(200).json({
    success: true,
    data: summary,
  });
}

export async function createNewTransaction(req, res) {
  const rawUserId = req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1;
  const userId = parsePositiveInteger(rawUserId, 'userId');

  const created = await addTransactionForUser(userId, req.body);

  return res.status(201).json({
    success: true,
    message: 'Transaction created successfully.',
    data: created,
  });
}

export async function updateExistingTransaction(req, res) {
  const rawUserId = req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1;
  const userId = parsePositiveInteger(rawUserId, 'userId');
  const transactionId = parsePositiveInteger(req.params.transactionId, 'transactionId');

  const updated = await editTransactionForUser(transactionId, userId, req.body);

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Transaction updated successfully.',
    data: updated,
  });
}

export async function deleteExistingTransaction(req, res) {
  const rawUserId = req.params.userId ?? req.body?.user_id ?? req.body?.userId ?? 1;
  const userId = parsePositiveInteger(rawUserId, 'userId');
  const transactionId = parsePositiveInteger(req.params.transactionId, 'transactionId');

  const deleted = await removeTransactionForUser(transactionId, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Transaction deleted successfully.',
    data: deleted,
  });
}
