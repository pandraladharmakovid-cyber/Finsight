// src/utils/formatDate.js

const DEFAULT_LOCALE = "en-IN";

/**
 * Convert different date inputs into a valid Date.
 */
export const toDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Format a date.
 *
 * Example:
 * formatDate("2026-10-07")
 * => 07 Oct 2026
 */
export const formatDate = (
  value,
  {
    locale = DEFAULT_LOCALE,
    year = "numeric",
    month = "short",
    day = "2-digit",
  } = {}
) => {
  const date = toDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat(locale, {
    year,
    month,
    day,
  }).format(date);
};

/**
 * Long human-readable date.
 */
export const formatLongDate = (value) => {
  const date = toDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

/**
 * Short date.
 *
 * Example:
 * 07/10/2026
 */
export const formatShortDate = (value) => {
  const date = toDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

/**
 * Format date and time.
 */
export const formatDateTime = (
  value,
  {
    includeSeconds = false,
  } = {}
) => {
  const date = toDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds
      ? { second: "2-digit" }
      : {}),
  }).format(date);
};

/**
 * Relative time.
 *
 * Examples:
 * Today
 * Yesterday
 * 3 days ago
 * In 2 days
 */
export const formatRelativeDate = (value) => {
  const date = toDate(value);

  if (!date) return "—";

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const difference =
    Math.round(
      (startOfTarget - startOfToday) /
        (1000 * 60 * 60 * 24)
    );

  if (difference === 0) return "Today";
  if (difference === -1) return "Yesterday";
  if (difference === 1) return "Tomorrow";

  if (Math.abs(difference) < 7) {
    return difference < 0
      ? `${Math.abs(difference)} days ago`
      : `In ${difference} days`;
  }

  return formatDate(value);
};

/**
 * Get days between two dates.
 */
export const daysBetween = (start, end) => {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) return 0;

  const startUTC = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const endUTC = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  return Math.round(
    (endUTC - startUTC) /
      (1000 * 60 * 60 * 24)
  );
};

/**
 * Days remaining until a date.
 */
export const daysUntil = (value) => {
  return daysBetween(new Date(), value);
};

/**
 * Check whether a date has passed.
 */
export const isPastDate = (value) => {
  const date = toDate(value);

  if (!date) return false;

  return daysUntil(date) < 0;
};

/**
 * Check whether date is today.
 */
export const isToday = (value) => {
  const date = toDate(value);

  if (!date) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

/**
 * ISO date useful for HTML date inputs.
 */
export const toInputDate = (value) => {
  const date = toDate(value);

  if (!date) return "";

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Get month label.
 */
export const formatMonth = (value) => {
  const date = toDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: "long",
    year: "numeric",
  }).format(date);
};

/**
 * Get YYYY-MM key.
 */
export const getMonthKey = (value) => {
  const date = toDate(value);

  if (!date) return "";

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

export default formatDate;