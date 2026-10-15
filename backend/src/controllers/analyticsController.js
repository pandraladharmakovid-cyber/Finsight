import {
  getFinancialAnalytics,
  getSpendingAnalytics,
  getAccountAnalytics,
  getBudgetAnalytics,
  getDebtAnalytics,
  getSavingsAnalytics,
} from '../services/analyticsService.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

export async function getFinancialAnalyticsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const analytics = await getFinancialAnalytics(userId);

  return res.status(200).json({
    success: true,
    data: analytics,
  });
}

export async function getSpendingAnalyticsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const analytics = await getSpendingAnalytics(userId);

  return res.status(200).json({
    success: true,
    data: analytics,
  });
}

export async function getAccountAnalyticsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const analytics = await getAccountAnalytics(userId);

  return res.status(200).json({
    success: true,
    data: analytics,
  });
}

export async function getBudgetAnalyticsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const analytics = await getBudgetAnalytics(userId);

  return res.status(200).json({
    success: true,
    data: analytics,
  });
}

export async function getDebtAnalyticsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const analytics = await getDebtAnalytics(userId);

  return res.status(200).json({
    success: true,
    data: analytics,
  });
}

export async function getSavingsAnalyticsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const analytics = await getSavingsAnalytics(userId);

  return res.status(200).json({
    success: true,
    data: analytics,
  });
}