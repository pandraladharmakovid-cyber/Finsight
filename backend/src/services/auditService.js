import {
  getAuditLogsByUserId,
  getAuditLogsForRecord,
} from '../db/queries.js';

/**
 * FinSight Audit Service
 *
 * Provides access to the financial audit trail.
 *
 * The database query layer remains the single source of truth.
 * This service adds validation and application-level structure.
 */

export async function listAuditLogs(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  return getAuditLogsByUserId(userId);
}

export async function getRecordAuditLogs(recordType, recordId) {
  if (!recordType) {
    throw new Error('recordType is required');
  }

  if (!recordId) {
    throw new Error('recordId is required');
  }

  return getAuditLogsForRecord(recordType, recordId);
}

export async function getAuditOverview(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const logs = await getAuditLogsByUserId(userId);

  const actionCounts = logs.reduce((counts, log) => {
    const action = log.action || 'UNKNOWN';

    counts[action] = (counts[action] || 0) + 1;

    return counts;
  }, {});

  const entityCounts = logs.reduce((counts, log) => {
    const entity =
      log.record_type ||
      log.entity_type ||
      'UNKNOWN';

    counts[entity] = (counts[entity] || 0) + 1;

    return counts;
  }, {});

  return {
    totalEntries: logs.length,
    actionCounts,
    entityCounts,
    recentActivity: logs.slice(0, 20),
  };
}

export default {
  listAuditLogs,
  getRecordAuditLogs,
  getAuditOverview,
};
