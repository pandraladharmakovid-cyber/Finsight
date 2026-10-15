import { Router } from 'express';
import {
  getTransactions,
  getTransaction,
  getRequiredTransaction,
  getRecentTransactions,
  getTransactionCountData,
  getTransactionSummaryData,
  createNewTransaction,
  updateExistingTransaction,
  deleteExistingTransaction,
} from '../controllers/transactionController.js';

const router = Router();

// Create transaction (supports both POST /api/transactions and POST /api/transactions/:userId)
router.post('/', createNewTransaction);
router.post('/:userId', createNewTransaction);

// Read transactions
router.get('/:userId', getTransactions);
router.get('/:userId/recent', getRecentTransactions);
router.get('/:userId/count', getTransactionCountData);
router.get('/:userId/summary', getTransactionSummaryData);
router.get('/:userId/:transactionId', getTransaction);
router.get('/:userId/:transactionId/required', getRequiredTransaction);

// Update transaction (supports both PUT /api/transactions/:transactionId and PUT /api/transactions/:userId/:transactionId)
router.put('/:transactionId', updateExistingTransaction);
router.put('/:userId/:transactionId', updateExistingTransaction);

// Delete transaction (supports both DELETE /api/transactions/:transactionId and DELETE /api/transactions/:userId/:transactionId)
router.delete('/:transactionId', deleteExistingTransaction);
router.delete('/:userId/:transactionId', deleteExistingTransaction);

export default router;