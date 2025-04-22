/**
 * Utility functions for string manipulation
 */

/**
 * Safely stringify objects with BigInt values
 * @param obj The object to stringify
 * @returns The stringified object
 */
export const safeStringify = (obj: Record<string, any> | Record<string, any>[]): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};
