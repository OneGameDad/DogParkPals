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
 */
export const getQueryBoolean = (value: any): boolean | undefined => {
  const str = getQueryString(value);
  if (!str) return undefined;
  return str.toLowerCase() === 'true';
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
 */
export const ensureString = (value: any): string => {
  if (Array.isArray(value)) {
    return String(value[0]);
  }
  return String(value);
};
