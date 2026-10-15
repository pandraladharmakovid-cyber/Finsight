import {
  listDebts,
  findDebt,
  requireDebt,
  getDebtOverview,
  getDebtSummaryData,
} from '../services/debtService.js';
import { createDebt, updateDebt, deleteDebt } from '../db/queries.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

export async function getDebts(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const debts = await listDebts(userId);
  return res.status(200).json({ success: true, data: debts });
}

export async function getDebt(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const debtId = parsePositiveInteger(req.params.debtId, 'debtId');
  const debt = await findDebt(debtId, userId);
  if (!debt) {
    return res.status(404).json({ success: false, message: 'Debt not found.' });
  }
  return res.status(200).json({ success: true, data: debt });
}

export async function getRequiredDebt(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const debtId = parsePositiveInteger(req.params.debtId, 'debtId');
  const debt = await requireDebt(debtId, userId);
  return res.status(200).json({ success: true, data: debt });
}

export async function getDebtOverviewData(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const overview = await getDebtOverview(userId);
  return res.status(200).json({ success: true, data: overview });
}

export async function getDebtSummary(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const summary = await getDebtSummaryData(userId);
  return res.status(200).json({ success: true, data: summary });
}

export async function createNewDebt(req, res) {
  const userId = parsePositiveInteger(req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1, 'userId');
  const created = await createDebt(userId, req.body);
  return res.status(201).json({ success: true, message: 'Debt created successfully.', data: created });
}

export async function updateExistingDebt(req, res) {
  const userId = parsePositiveInteger(req.params.userId ?? req.body.user_id ?? req.body.userId ?? 1, 'userId');
  const debtId = parsePositiveInteger(req.params.debtId, 'debtId');
  const updated = await updateDebt(debtId, userId, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Debt not found.' });
  }
  return res.status(200).json({ success: true, message: 'Debt updated successfully.', data: updated });
}

export async function deleteExistingDebt(req, res) {
  const userId = parsePositiveInteger(req.params.userId ?? req.body?.user_id ?? req.body?.userId ?? 1, 'userId');
  const debtId = parsePositiveInteger(req.params.debtId, 'debtId');
  const deleted = await deleteDebt(debtId, userId);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Debt not found.' });
  }
  return res.status(200).json({ success: true, message: 'Debt deleted successfully.', data: deleted });
}
