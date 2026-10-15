import express from 'express';
import cors from 'cors';

import accountRoutes from './routes/accountRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import debtRoutes from './routes/debtRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

import {
  getDatabaseHealth,
  getCategories,
  getCategorySpending,
  createCategory,
  deleteCategory,
  queryOne,
} from './db/queries.js';
import asyncHandler from './utils/asyncHandler.js';
import requestLogger from './middleware/requestLogger.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);

const healthHandler = asyncHandler(async (_req, res) => {
  let dbInfo = null;
  try {
    dbInfo = await getDatabaseHealth();
  } catch {
    dbInfo = null;
  }
  res.status(200).json({
    success: true,
    service: 'FinSight API',
    status: 'healthy',
    message: dbInfo ? 'Backend and PostgreSQL connection healthy.' : 'API online, database check failed.',
    database: dbInfo,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

const API_PREFIX = '/api';

// Categories endpoints (merges finance.categories with category_spending view)
app.get(`${API_PREFIX}/categories`, asyncHandler(async (req, res) => {
  const userId = Number(req.query.userId || 1);
  const [categories, spending] = await Promise.all([
    getCategories(),
    getCategorySpending(userId).catch(() => []),
  ]);
  const spendMap = new Map(
    spending.map((s) => [String(s.category_name || '').toLowerCase(), s])
  );
  const merged = categories.map((cat) => {
    const sp = spendMap.get(String(cat.category_name || '').toLowerCase());
    return {
      ...cat,
      total_spent: Number(sp?.total_spent ?? sp?.amount ?? 0),
      transactions: Number(sp?.transaction_count ?? sp?.transactions ?? 0),
    };
  });
  res.json({ success: true, data: merged });
}));

app.post(`${API_PREFIX}/categories`, asyncHandler(async (req, res) => {
  const created = await createCategory(req.body);
  res.status(201).json({ success: true, data: created });
}));

app.put(`${API_PREFIX}/categories/:categoryId`, asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.categoryId);
  const name = req.body.category_name ?? req.body.categoryName;
  const type = String(req.body.category_type ?? req.body.categoryType ?? 'EXPENSE').toUpperCase();
  const updated = await queryOne(
    'UPDATE finance.categories SET category_name = COALESCE($1, category_name), category_type = COALESCE($2, category_type) WHERE category_id = $3 RETURNING *',
    [name, type, categoryId]
  );
  res.json({ success: true, data: updated });
}));

app.delete(`${API_PREFIX}/categories/:categoryId`, asyncHandler(async (req, res) => {
  const deleted = await deleteCategory(Number(req.params.categoryId));
  res.json({ success: true, data: deleted });
}));

app.use(`${API_PREFIX}/accounts`, accountRoutes);
app.use(`${API_PREFIX}/budgets`, budgetRoutes);
app.use(`${API_PREFIX}/transactions`, transactionRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/debts`, debtRoutes);
app.use(`${API_PREFIX}/savings`, savingsRoutes);
app.use(`${API_PREFIX}/recurring`, recurringRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/audit`, auditRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
