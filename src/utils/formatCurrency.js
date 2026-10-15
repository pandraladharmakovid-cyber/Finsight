// src/utils/formatCurrency.js

const DEFAULT_LOCALE = "en-IN";
const DEFAULT_CURRENCY = "INR";

/**
 * Safely converts any numeric-like value into a number.
 */
export const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Format currency in Indian Rupees.
 *
 * Example:
 * formatCurrency(125000)
 * => ₹1,25,000.00
 */
export const formatCurrency = (
  value,
  {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false,
    showSign = false,
  } = {}
) => {
  const amount = toNumber(value);

  if (compact) {
    return formatCompactCurrency(amount, {
      locale,
      currency,
      showSign,
    });
  }

  const sign = showSign && amount > 0 ? "+" : "";

  return `${sign}${new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)}`;
};

/**
 * Compact financial display.
 *
 * Examples:
 * ₹1.25L
 * ₹12.50L
 * ₹1.25Cr
 */
export const formatCompactCurrency = (
  value,
  {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    showSign = false,
    decimals = 2,
  } = {}
) => {
  const amount = toNumber(value);
  const absolute = Math.abs(amount);

  let divisor = 1;
  let suffix = "";

  if (absolute >= 10_000_000) {
    divisor = 10_000_000;
    suffix = "Cr";
  } else if (absolute >= 100_000) {
    divisor = 100_000;
    suffix = "L";
  } else if (absolute >= 1_000) {
    divisor = 1_000;
    suffix = "K";
  }

  const compactValue = amount / divisor;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: suffix ? 0 : 0,
    maximumFractionDigits: suffix ? decimals : 0,
  }).format(compactValue);

  const sign = showSign && amount > 0 ? "+" : "";

  if (!suffix) {
    return `${sign}${new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  }

  return `${sign}${currency === "INR" ? "₹" : currency} ${formatted}${suffix}`;
};

/**
 * Format a number without currency.
 */
export const formatNumber = (
  value,
  {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = {}
) => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(toNumber(value));
};

/**
 * Format percentage.
 *
 * Example:
 * formatPercentage(42.5)
 * => 42.5%
 */
export const formatPercentage = (
  value,
  {
    decimals = 1,
    showSign = false,
    clamp = false,
  } = {}
) => {
  let percentage = toNumber(value);

  if (clamp) {
    percentage = Math.min(100, Math.max(0, percentage));
  }

  const sign = showSign && percentage > 0 ? "+" : "";

  return `${sign}${percentage.toFixed(decimals)}%`;
};

/**
 * Format a percentage represented as decimal.
 *
 * Example:
 * formatRatioAsPercentage(0.425)
 * => 42.5%
 */
export const formatRatioAsPercentage = (
  ratio,
  options = {}
) => {
  return formatPercentage(toNumber(ratio) * 100, options);
};

/**
 * Format positive/negative financial movement.
 */
export const formatSignedCurrency = (value, options = {}) => {
  const amount = toNumber(value);

  if (amount === 0) {
    return formatCurrency(0, options);
  }

  return formatCurrency(amount, {
    ...options,
    showSign: true,
  });
};

/**
 * Parse formatted currency-like strings back to numbers.
 *
 * Example:
 * parseCurrency("₹1,25,000") => 125000
 */
export const parseCurrency = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const cleaned = value
    .replace(/[₹$€£,\s]/g, "")
    .replace(/[A-Za-z]+$/g, "");

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Prevents floating point accumulation errors.
 */
export const roundMoney = (value, decimals = 2) => {
  const amount = toNumber(value);
  const factor = 10 ** decimals;

  return Math.round((amount + Number.EPSILON) * factor) / factor;
};

export default formatCurrency;