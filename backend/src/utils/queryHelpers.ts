/**
 * Utility functions to safely extract and handle query parameters
 * which are typed as string | string[] by Express
 */

/**
 * Extract the first value of a query parameter that might be a string or array
 */
export const getQueryString = (value: any): string | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return String(value[0]);
  }
  if (typeof value === 'string') return value;
  return String(value);
};

/**
 * Extract the first value and convert to a number
 */
export const getQueryNumber = (value: any): number | undefined => {
  const str = getQueryString(value);
  if (!str) return undefined;
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : num;
};

/**
 * Extract the first value and parse as boolean
 * Returns true for "true", false for "false", undefined for missing/invalid values
 */
export const getQueryBoolean = (value: any): boolean | undefined => {
  const str = getQueryString(value);
  if (str === undefined) return undefined;
  const lower = str.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  return undefined;
};

/**
 * Get all values as an array, even if it's a single string
 */
export const getQueryArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
};

/**
 * Cast a param/query value to string, handling arrays and null values
 * Returns empty string for null/undefined to prevent "null"/"undefined" string conversion
 */
export const ensureString = (value: any): string => {
  // Explicitly handle null/undefined so they don't become "null"/"undefined"
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (first === null || first === undefined) {
      return '';
    }
    return String(first);
  }
  return String(value);
};
