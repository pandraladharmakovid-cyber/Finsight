import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getDebts,
  getDebt,
  getRequiredDebt,
  getDebtSummary,
  getDebtOverviewData,
  createNewDebt,
  updateExistingDebt,
  deleteExistingDebt,
} from '../controllers/debtController.js';

const router = Router();

router.post('/', asyncHandler(createNewDebt));
router.post('/:userId', asyncHandler(createNewDebt));
router.get('/:userId', asyncHandler(getDebts));
router.get('/:userId/summary', asyncHandler(getDebtSummary));
router.get('/:userId/overview', asyncHandler(getDebtOverviewData));
router.get('/:userId/:debtId', asyncHandler(getDebt));
router.get('/:userId/:debtId/required', asyncHandler(getRequiredDebt));
router.put('/:debtId', asyncHandler(updateExistingDebt));
router.put('/:userId/:debtId', asyncHandler(updateExistingDebt));
router.delete('/:debtId', asyncHandler(deleteExistingDebt));
router.delete('/:userId/:debtId', asyncHandler(deleteExistingDebt));

export default router;
