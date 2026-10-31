import {
  getDashboardActivity,
  getDashboardAnalytics,
  getDashboardData,
} from '../services/dashboardService.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

export async function getDashboard(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const dashboard = await getDashboardData(userId);

  return res.status(200).json({
    success: true,
    data: dashboard,
  });
}

export async function getDashboardAnalyticsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const analytics = await getDashboardAnalytics(userId);

  return res.status(200).json({
    success: true,
    data: analytics,
  });
}

export async function getDashboardActivityData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const activity = await getDashboardActivity(userId);

  return res.status(200).json({
    success: true,
    data: activity,
  });
}
