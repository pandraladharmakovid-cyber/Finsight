// src/utils/calculations.js

import { roundMoney, toNumber } from "./formatCurrency";

/* -------------------------------------------------------------------------- */
/* BASIC FINANCIAL CALCULATIONS                                               */
/* -------------------------------------------------------------------------- */

export const calculateNetCashFlow = (
  income,
  expenses
) => {
  return roundMoney(
    toNumber(income) - toNumber(expenses)
  );
};

export const calculateSavingsRate = (
  income,
  savings
) => {
  const totalIncome = toNumber(income);

  if (totalIncome <= 0) return 0;

  return roundMoney(
    (toNumber(savings) / totalIncome) * 100,
    2
  );
};

export const calculateExpenseRate = (
  income,
  expenses
) => {
  const totalIncome = toNumber(income);

  if (totalIncome <= 0) return 0;

  return roundMoney(
    (toNumber(expenses) / totalIncome) * 100,
    2
  );
};

/* -------------------------------------------------------------------------- */
/* BUDGET CALCULATIONS                                                        */
/* -------------------------------------------------------------------------- */

export const calculateBudgetUsage = (
  spent,
  budget
) => {
  const budgetAmount = toNumber(budget);

  if (budgetAmount <= 0) return 0;

  return roundMoney(
    (toNumber(spent) / budgetAmount) * 100,
    2
  );
};

export const calculateBudgetRemaining = (
  budget,
  spent
) => {
  return roundMoney(
    toNumber(budget) - toNumber(spent)
  );
};

export const calculateBudgetVariance = (
  budget,
  spent
) => {
  return roundMoney(
    toNumber(budget) - toNumber(spent)
  );
};

export const getBudgetStatus = (
  spent,
  budget
) => {
  const usage = calculateBudgetUsage(
    spent,
    budget
  );

  if (usage >= 100) return "exceeded";
  if (usage >= 90) return "critical";
  if (usage >= 75) return "warning";
  if (usage >= 50) return "moderate";

  return "healthy";
};

/* -------------------------------------------------------------------------- */
/* SAVINGS CALCULATIONS                                                       */
/* -------------------------------------------------------------------------- */

export const calculateSavingsProgress = (
  current,
  target
) => {
  const targetAmount = toNumber(target);

  if (targetAmount <= 0) return 0;

  return roundMoney(
    (toNumber(current) / targetAmount) * 100,
    2
  );
};

export const calculateSavingsRemaining = (
  current,
  target
) => {
  return Math.max(
    0,
    roundMoney(
      toNumber(target) - toNumber(current)
    )
  );
};

export const calculateRequiredMonthlySavings = (
  current,
  target,
  monthsRemaining
) => {
  const remaining = calculateSavingsRemaining(
    current,
    target
  );

  const months = toNumber(monthsRemaining);

  if (remaining <= 0) return 0;
  if (months <= 0) return remaining;

  return roundMoney(
    remaining / months
  );
};

/* -------------------------------------------------------------------------- */
/* DEBT CALCULATIONS                                                          */
/* -------------------------------------------------------------------------- */

export const calculateDebtProgress = (
  originalAmount,
  currentBalance
) => {
  const original = toNumber(originalAmount);

  if (original <= 0) return 0;

  return roundMoney(
    ((original - toNumber(currentBalance)) /
      original) *
      100,
    2
  );
};

export const calculateDebtPaid = (
  originalAmount,
  currentBalance
) => {
  return Math.max(
    0,
    roundMoney(
      toNumber(originalAmount) -
        toNumber(currentBalance)
    )
  );
};

export const calculateDebtRemaining = (
  currentBalance
) => {
  return Math.max(
    0,
    roundMoney(currentBalance)
  );
};

/**
 * Approximate months required to repay a debt.
 *
 * This is intentionally conservative and handles
 * zero/invalid payment scenarios safely.
 */
export const calculateDebtPayoffMonths = (
  balance,
  monthlyPayment,
  annualInterestRate = 0
) => {
  const principal = toNumber(balance);
  const payment = toNumber(monthlyPayment);
  const annualRate = toNumber(
    annualInterestRate
  );

  if (principal <= 0) return 0;
  if (payment <= 0) return Infinity;

  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return Math.ceil(
      principal / payment
    );
  }

  if (payment <= principal * monthlyRate) {
    return Infinity;
  }

  const months =
    -Math.log(
      1 -
        (principal * monthlyRate) /
          payment
    ) /
    Math.log(1 + monthlyRate);

  return Math.ceil(months);
};

/* -------------------------------------------------------------------------- */
/* INTEREST CALCULATIONS                                                      */
/* -------------------------------------------------------------------------- */

export const calculateMonthlyInterest = (
  balance,
  annualRate
) => {
  return roundMoney(
    toNumber(balance) *
      (toNumber(annualRate) / 100 / 12)
  );
};

export const calculateAnnualInterest = (
  balance,
  annualRate
) => {
  return roundMoney(
    toNumber(balance) *
      (toNumber(annualRate) / 100)
  );
};

/* -------------------------------------------------------------------------- */
/* TRANSACTION ANALYTICS                                                      */
/* -------------------------------------------------------------------------- */

export const calculateTransactionTotals = (
  transactions = []
) => {
  return transactions.reduce(
    (totals, transaction) => {
      const amount = Math.abs(
        toNumber(transaction.amount)
      );

      const type = String(
        transaction.type ||
          transaction.transaction_type ||
          ""
      ).toLowerCase();

      if (
        type === "income" ||
        type === "credit"
      ) {
        totals.income += amount;
      } else {
        totals.expenses += amount;
      }

      return totals;
    },
    {
      income: 0,
      expenses: 0,
    }
  );
};

export const calculateCategoryTotals = (
  transactions = []
) => {
  const categories = {};

  transactions.forEach((transaction) => {
    const category =
      transaction.category_name ||
      transaction.category ||
      "Uncategorized";

    const amount = Math.abs(
      toNumber(transaction.amount)
    );

    if (!categories[category]) {
      categories[category] = 0;
    }

    categories[category] += amount;
  });

  return Object.fromEntries(
    Object.entries(categories).map(
      ([category, amount]) => [
        category,
        roundMoney(amount),
      ]
    )
  );
};

export const calculateAverageTransaction = (
  transactions = []
) => {
  if (!transactions.length) return 0;

  const total = transactions.reduce(
    (sum, transaction) =>
      sum +
      Math.abs(
        toNumber(transaction.amount)
      ),
    0
  );

  return roundMoney(
    total / transactions.length
  );
};

/* -------------------------------------------------------------------------- */
/* DASHBOARD ANALYTICS                                                        */
/* -------------------------------------------------------------------------- */

export const calculateFinancialHealthScore = ({
  income = 0,
  expenses = 0,
  savings = 0,
  debt = 0,
  budgetUsage = 0,
} = {}) => {
  const incomeValue = toNumber(income);
  const expenseValue = toNumber(expenses);
  const savingsValue = toNumber(savings);
  const debtValue = toNumber(debt);
  const budgetValue = toNumber(
    budgetUsage
  );

  if (incomeValue <= 0) {
    return 0;
  }

  const savingsRate =
    calculateSavingsRate(
      incomeValue,
      savingsValue
    );

  const expenseRate =
    calculateExpenseRate(
      incomeValue,
      expenseValue
    );

  let score = 50;

  // Savings contribution.
  score += Math.min(
    25,
    savingsRate * 0.5
  );

  // Expense discipline.
  if (expenseRate <= 50) {
    score += 15;
  } else if (expenseRate <= 70) {
    score += 8;
  } else if (expenseRate >= 100) {
    score -= 20;
  } else {
    score -= 5;
  }

  // Budget discipline.
  if (budgetValue <= 75) {
    score += 10;
  } else if (budgetValue >= 100) {
    score -= 15;
  }

  // Debt pressure.
  const debtRatio =
    debtValue / incomeValue;

  if (debtRatio > 2) {
    score -= 15;
  } else if (debtRatio > 1) {
    score -= 8;
  } else if (debtRatio < 0.5) {
    score += 5;
  }

  return Math.round(
    Math.min(100, Math.max(0, score))
  );
};

export const getHealthLabel = (score) => {
  const value = toNumber(score);

  if (value >= 85) return "Excellent";
  if (value >= 70) return "Healthy";
  if (value >= 55) return "Fair";
  if (value >= 40) return "Needs Attention";

  return "Critical";
};

/* -------------------------------------------------------------------------- */
/* TREND CALCULATIONS                                                         */
/* -------------------------------------------------------------------------- */

export const calculateGrowthRate = (
  current,
  previous
) => {
  const currentValue = toNumber(current);
  const previousValue = toNumber(previous);

  if (previousValue === 0) {
    if (currentValue === 0) return 0;
    return 100;
  }

  return roundMoney(
    ((currentValue - previousValue) /
      Math.abs(previousValue)) *
      100,
    2
  );
};

export const calculateTrend = (
  current,
  previous
) => {
  const growth = calculateGrowthRate(
    current,
    previous
  );

  if (growth > 1) return "up";
  if (growth < -1) return "down";

  return "stable";
};

export const clamp = (
  value,
  min = 0,
  max = 100
) => {
  return Math.min(
    max,
    Math.max(min, toNumber(value))
  );
};

export default {
  calculateNetCashFlow,
  calculateSavingsRate,
  calculateExpenseRate,
  calculateBudgetUsage,
  calculateBudgetRemaining,
  calculateBudgetVariance,
  getBudgetStatus,
  calculateSavingsProgress,
  calculateSavingsRemaining,
  calculateRequiredMonthlySavings,
  calculateDebtProgress,
  calculateDebtPaid,
  calculateDebtRemaining,
  calculateDebtPayoffMonths,
  calculateMonthlyInterest,
  calculateAnnualInterest,
  calculateTransactionTotals,
  calculateCategoryTotals,
  calculateAverageTransaction,
  calculateFinancialHealthScore,
  getHealthLabel,
  calculateGrowthRate,
  calculateTrend,
  clamp,
};