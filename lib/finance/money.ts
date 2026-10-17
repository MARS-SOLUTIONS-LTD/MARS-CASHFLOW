// Improved money helpers: safer rounding, locale-aware formatting, stricter parsing, and safe-integer checks.

export type Currency = 'UGX' | 'KES' | 'USD';

interface CurrencyMeta {
  code: Currency;
  symbol: string;
  decimals: number;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyMeta> = {
  UGX: { code: 'UGX', symbol: 'UGX', decimals: 0, locale: 'en-UG' },
  KES: { code: 'KES', symbol: 'KSh', decimals: 2, locale: 'en-KE' },
  USD: { code: 'USD', symbol: '$', decimals: 2, locale: 'en-US' },
};

/** A money value is always an integer in minor units. */
export type Minor = number;

const MAX_SAFE_MINOR = Number.MAX_SAFE_INTEGER;
const MIN_SAFE_MINOR = Number.MIN_SAFE_INTEGER;

/** Returns true if value is an integer and within JS safe integer range. */
export function isValidMinor(value: number): boolean {
  return Number.isInteger(value) && value <= MAX_SAFE_MINOR && value >= MIN_SAFE_MINOR;
}

/** Convert a major-unit amount (e.g., 12.34) to minor units (e.g., 1234).
 * Uses rounding to nearest minor unit. Throws on non-finite inputs or overflow.
 */
export function toMinor(major: number, currency: Currency): Minor {
  if (!Number.isFinite(major)) throw new TypeError('major must be a finite number');
  const { decimals } = CURRENCIES[currency];
  const factor = 10 ** decimals;

  // Improve rounding stability for typical cases by nudging toward correct direction
  // Avoid catastrophic rounding for very large numbers by validating afterwards.
  const raw = Math.round((major + (major >= 0 ? Number.EPSILON : -Number.EPSILON)) * factor);

  if (!Number.isFinite(raw) || !isValidMinor(raw)) {
    throw new RangeError('resulting minor units are outside safe integer range');
  }
  return raw;
}

/** Convert minor units (integer) to major units (floating point).
 * Caller should avoid relying on exact decimal equality for major values.
 */
export function toMajor(minor: Minor, currency: Currency): number {
  if (!isValidMinor(minor)) throw new TypeError('minor must be a safe integer');
  const { decimals } = CURRENCIES[currency];
  const factor = 10 ** decimals;
  return minor / factor;
}

/** Format a minor-unit amount for display. Uses currency-specific locale and fixed fraction digits. */
export function formatMoney(minor: Minor, currency: Currency = 'UGX'): string {
  if (!isValidMinor(minor)) throw new TypeError('minor must be a safe integer');
  const meta = CURRENCIES[currency];
  const major = toMajor(minor, currency);

  const formatter = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });

  // Keep symbol as provided in meta and place it to the left with a space for consistency.
  return `${meta.symbol} ${formatter.format(major)}`;
}

/** Parse user input like "100,000" or "100000.50" → minor units.
 * - Returns null for invalid input or negative values.
 * - For currencies with decimals === 0 (e.g., UGX) fractional input is rejected.
 * - Leading/trailing whitespace allowed. Thousands separators (commas, spaces) are allowed.
 */
export function parseMoney(
  input: string,
  currency: Currency = 'UGX',
  { allowNegative = false }: { allowNegative?: boolean } = {}
): Minor | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Allow parentheses for negative numbers: "(1,000.00)" -> -1000.00
  let negative = false;
  let working = trimmed;

  const parenMatch = working.match(/^\((.*)\)$/);
  if (parenMatch) {
    negative = true;
    working = parenMatch[1];
  }

  // Remove currency symbols, letters, and common thousands separators (commas, spaces, NBSP)
  // Keep digits, one leading '-', and the decimal point.
  working = working.replace(/[^\d.\-]/g, '');

  // Handle a leading '-' sign
  if (working.startsWith('-')) {
    negative = true;
    working = working.slice(1);
  }

  // Reject if multiple decimal points
  if ((working.match(/\./g) || []).length > 1) return null;

  const meta = CURRENCIES[currency];
  if (negative && !allowNegative) return null;

  // If currency has 0 decimals, reject input with a decimal separator to avoid silent rounding
  if (meta.decimals === 0 && working.includes('.')) return null;

  // Parse numeric value
  const n = Number(working === '' ? '0' : working);
  if (!Number.isFinite(n)) return null;

  const major = negative ? -n : n;

  try {
    return toMinor(major, currency);
  } catch {
    return null;
  }
}
