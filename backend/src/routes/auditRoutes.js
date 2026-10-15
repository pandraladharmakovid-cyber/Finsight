import { Router } from 'express';
import {
  getAuditLogs,
  getRecordAuditLogsData,
  getAuditOverviewData,
} from '../controllers/auditController.js';

const router = Router();

/**
 * All audit logs for a user
 */
router.get('/:userId', getAuditLogs);

/**
 * Audit overview
 */
router.get('/:userId/overview', getAuditOverviewData);

/**
 * Audit history for a specific record
 */
router.get(
  '/:userId/record/:recordId',
  getRecordAuditLogsData,
);

export default router;