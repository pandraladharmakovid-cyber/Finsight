import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getRecurringTransactions,
  getRecurringTransaction,
  getRequiredRecurringTransaction,
  getRecurringOverviewData,
  createNewRecurring,
  updateExistingRecurring,
  deleteExistingRecurring,
} from '../controllers/recurringController.js';

const router = Router();

router.post('/', asyncHandler(createNewRecurring));
router.post('/:userId', asyncHandler(createNewRecurring));
router.get('/:userId', asyncHandler(getRecurringTransactions));
router.get('/:userId/overview', asyncHandler(getRecurringOverviewData));
router.get('/:userId/:recurringTransactionId', asyncHandler(getRecurringTransaction));
router.get('/:userId/:recurringTransactionId/required', asyncHandler(getRequiredRecurringTransaction));
router.put('/:recurringTransactionId', asyncHandler(updateExistingRecurring));
router.put('/:userId/:recurringTransactionId', asyncHandler(updateExistingRecurring));
router.delete('/:recurringTransactionId', asyncHandler(deleteExistingRecurring));
router.delete('/:userId/:recurringTransactionId', asyncHandler(deleteExistingRecurring));

export default router;
