// src/utils/typeGuards.ts

/**
 * Safe value extractor with default fallback
 */
export function safeValue<T>(value: T | undefined | null, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Safe string extractor
 */
export function safeString(value: string | undefined | null, defaultValue: string = ''): string {
  return value ?? defaultValue;
}

/**
 * Safe number extractor
 */
export function safeNumber(value: number | undefined | null, defaultValue: number = 0): number {
  return value ?? defaultValue;
}

/**
 * Safe user ID extractor for queries
 */
export function safeUserId(userId: string | undefined | null): string {
  if (!userId) {
    console.warn('User ID is undefined or null, using empty string');
    return '';
  }
  return userId;
}

/**
 * Check if value is defined and not null
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Assert value is defined (throws error if not)
 */
export function assertDefined<T>(
  value: T | undefined | null,
  errorMessage: string = 'Value is required but was undefined or null'
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(errorMessage);
  }
}

/**
 * Safe array access
 */
export function safeArrayAccess<T>(
  array: T[] | undefined | null,
  index: number,
  defaultValue: T
): T {
  if (!array || index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index];
}

/**
 * Safe object property access
 */
export function safeProp<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (!obj) {
    return defaultValue;
  }
  return obj[key] ?? defaultValue;
}

/**
 * Format score with safety
 */
export function formatScore(score: number | undefined | null): string {
  const safeScore = safeNumber(score, 0);
  return safeScore.toFixed(1);
}

/**
 * Get score emoji with safety
 */
export function getScoreEmoji(score: number | undefined | null): string {
  const safeScore = safeNumber(score, 0);
  if (safeScore >= 80) return '😊';
  if (safeScore >= 60) return '😐';
  return '😟';
}

/**
 * Get score label with safety
 */
export function getScoreLabel(score: number | undefined | null): string {
  const safeScore = safeNumber(score, 0);
  if (safeScore >= 80) return 'Excellent';
  if (safeScore >= 60) return 'Good';
  return 'Needs Work';
}

/**
 * Safe date formatter
 */
export function safeFormatDate(
  date: Date | string | undefined | null,
  defaultValue: string = 'N/A'
): string {
  if (!date) return defaultValue;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return defaultValue;
    return dateObj.toLocaleDateString('id-ID');
  } catch {
    return defaultValue;
  }
}

/**
 * Type guard for checking if error is Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safe error message extractor
 */
export function getErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}