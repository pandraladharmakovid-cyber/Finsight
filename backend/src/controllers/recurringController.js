import {
  listRecurringTransactions,
  findRecurringTransaction,
  requireRecurringTransaction,
  getRecurringOverview,
} from '../services/recurringService.js';
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '../db/queries.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

export async function getRecurringTransactions(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const recurringTransactions = await listRecurringTransactions(userId);
  return res.status(200).json({ success: true, data: recurringTransactions });
}

export async function getRecurringTransaction(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const recurringTransactionId = parsePositiveInteger(req.params.recurringTransactionId, 'recurringTransactionId');
  const recurringTransaction = await findRecurringTransaction(recurringTransactionId, userId);
  if (!recurringTransaction) {
    return res.status(404).json({ success: false, message: 'Recurring transaction not found.' });
  }
  return res.status(200).json({ success: true, data: recurringTransaction });
}

export async function getRequiredRecurringTransaction(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const recurringTransactionId = parsePositiveInteger(req.params.recurringTransactionId, 'recurringTransactionId');
  const recurringTransaction = await requireRecurringTransaction(recurringTransactionId, userId);
  return res.status(200).json({ success: true, data: recurringTransaction });
}

export async function getRecurringOverviewData(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const overview = await getRecurringOverview(userId);
  return res.status(200).json({ success: true, data: overview });
}

export async function createNewRecurring(req, res) {
  const userId = parsePositiveInteger(req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1, 'userId');
  const created = await createRecurringTransaction(userId, req.body);
  return res.status(201).json({ success: true, message: 'Recurring schedule created.', data: created });
}

export async function updateExistingRecurring(req, res) {
  const userId = parsePositiveInteger(req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1, 'userId');
  const recurringId = parsePositiveInteger(req.params.recurringTransactionId, 'recurringTransactionId');
  const updated = await updateRecurringTransaction(recurringId, userId, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Recurring transaction not found.' });
  }
  return res.status(200).json({ success: true, message: 'Recurring schedule updated.', data: updated });
}

export async function deleteExistingRecurring(req, res) {
  const userId = parsePositiveInteger(req.params.userId ?? req.body?.user_id ?? req.body?.userId ?? 1, 'userId');
  const recurringId = parsePositiveInteger(req.params.recurringTransactionId, 'recurringTransactionId');
  const deleted = await deleteRecurringTransaction(recurringId, userId);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Recurring transaction not found.' });
  }
  return res.status(200).json({ success: true, message: 'Recurring schedule deleted.', data: deleted });
}
