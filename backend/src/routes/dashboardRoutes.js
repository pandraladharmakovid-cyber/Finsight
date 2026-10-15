import { Router } from 'express';
import {
  getDashboard,
  getDashboardActivityData,
  getDashboardAnalyticsData,
} from '../controllers/dashboardController.js';

const router = Router();

/**
 * Complete dashboard payload
 */
router.get('/:userId', getDashboard);

/**
 * Dashboard activity
 */
router.get('/:userId/activity', getDashboardActivityData);

/**
 * Dashboard analytics
 */
router.get('/:userId/analytics', getDashboardAnalyticsData);

export default router;