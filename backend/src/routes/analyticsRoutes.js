import { Router } from 'express';
import {
  getFinancialAnalyticsData,
  getSpendingAnalyticsData,
  getAccountAnalyticsData,
  getBudgetAnalyticsData,
  getDebtAnalyticsData,
  getSavingsAnalyticsData,
} from '../controllers/analyticsController.js';

const router = Router();

/**
 * Complete financial analytics
 */
router.get('/:userId/financial', getFinancialAnalyticsData);

/**
 * Spending analytics
 */
router.get('/:userId/spending', getSpendingAnalyticsData);

/**
 * Account analytics
 */
router.get('/:userId/accounts', getAccountAnalyticsData);

/**
 * Budget analytics
 */
router.get('/:userId/budgets', getBudgetAnalyticsData);

/**
 * Debt analytics
 */
router.get('/:userId/debts', getDebtAnalyticsData);

/**
 * Savings analytics
 */
router.get('/:userId/savings', getSavingsAnalyticsData);

export default router;
