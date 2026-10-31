import { Router } from 'express';
import {
  getBudgets,
  getBudget,
  getRequiredBudget,
  getBudgetSummaryData,
  getBudgetPerformance,
  createNewBudget,
  updateExistingBudget,
  deleteExistingBudget,
} from '../controllers/budgetController.js';

const router = Router();

router.post('/', createNewBudget);
router.post('/:userId', createNewBudget);
router.get('/:userId', getBudgets);
router.get('/:userId/summary', getBudgetSummaryData);
router.get('/:userId/performance', getBudgetPerformance);
router.get('/:userId/:budgetId', getBudget);
router.get('/:userId/:budgetId/required', getRequiredBudget);
router.put('/:budgetId', updateExistingBudget);
router.put('/:userId/:budgetId', updateExistingBudget);
router.delete('/:budgetId', deleteExistingBudget);
router.delete('/:userId/:budgetId', deleteExistingBudget);

export default router;
