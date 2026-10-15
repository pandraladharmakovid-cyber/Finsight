import api from './api.js';

const USER_ID =
  import.meta.env.VITE_FINSIGHT_USER_ID;

function requireUserId() {
  if (!USER_ID) {
    throw new Error(
      'VITE_FINSIGHT_USER_ID is not configured.',
    );
  }

  return USER_ID;
}

export async function getAuditLogs(
  options = {},
) {
  const userId = requireUserId();

  const {
    limit = 100,
    offset = 0,
  } = options;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return api.get(
    `/audit/${userId}?${params.toString()}`,
  );
}

export async function getAuditLog(
  auditLogId,
) {
  const userId = requireUserId();

  if (!auditLogId) {
    throw new Error(
      'auditLogId is required.',
    );
  }

  return api.get(
    `/audit/${userId}/${auditLogId}`,
  );
}

export async function getAuditOverview() {
  const userId = requireUserId();

  return api.get(
    `/audit/${userId}/overview`,
  );
}

export default {
  getAuditLogs,
  getAuditLog,
  getAuditOverview,
};