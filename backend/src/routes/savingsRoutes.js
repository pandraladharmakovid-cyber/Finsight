import { Router } from 'express';
import {
  getSavingsGoals,
  getSavingsGoal,
  getRequiredSavingsGoal,
  getSavingsOverviewData,
  getSavingsProgress,
  createNewGoal,
  updateExistingGoal,
  deleteExistingGoal,
} from '../controllers/savingsController.js';

const router = Router();

router.post('/', createNewGoal);
router.post('/:userId', createNewGoal);
router.get('/:userId', getSavingsGoals);
router.get('/:userId/overview', getSavingsOverviewData);
router.get('/:userId/progress', getSavingsProgress);
router.get('/:userId/:goalId', getSavingsGoal);
router.get('/:userId/:goalId/required', getRequiredSavingsGoal);
router.put('/:goalId', updateExistingGoal);
router.put('/:userId/:goalId', updateExistingGoal);
router.delete('/:goalId', deleteExistingGoal);
router.delete('/:userId/:goalId', deleteExistingGoal);

export default router;
