import {
  listAuditLogs,
  getRecordAuditLogs,
  getAuditOverview,
} from '../services/auditService.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

export async function getAuditLogs(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const logs = await listAuditLogs(userId);

  return res.status(200).json({
    success: true,
    data: logs,
  });
}

export async function getRecordAuditLogsData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const recordId = parsePositiveInteger(
    req.params.recordId,
    'recordId',
  );

  const logs = await getRecordAuditLogs(
    userId,
    recordId,
  );

  return res.status(200).json({
    success: true,
    data: logs,
  });
}

export async function getAuditOverviewData(req, res) {
  const userId = parsePositiveInteger(
    req.params.userId,
    'userId',
  );

  const overview = await getAuditOverview(userId);

  return res.status(200).json({
    success: true,
    data: overview,
  });
}