import { Router } from 'express';
import {
  getAccounts,
  getActiveAccounts,
  getAccount,
  getRequiredAccount,
  getAccountSummaryData,
  createNewAccount,
  updateExistingAccount,
  deleteExistingAccount,
} from '../controllers/accountController.js';

const router = Router();

// Create account
router.post('/', createNewAccount);
router.post('/:userId', createNewAccount);

// Read accounts
router.get('/:userId', getAccounts);
router.get('/:userId/active', getActiveAccounts);
router.get('/:userId/summary', getAccountSummaryData);
router.get('/:userId/:accountId', getAccount);
router.get('/:userId/:accountId/required', getRequiredAccount);

// Update account
router.put('/:accountId', updateExistingAccount);
router.put('/:userId/:accountId', updateExistingAccount);

// Delete account
router.delete('/:accountId', deleteExistingAccount);
router.delete('/:userId/:accountId', deleteExistingAccount);

export default router;