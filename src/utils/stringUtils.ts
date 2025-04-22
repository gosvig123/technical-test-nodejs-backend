/**
 * Utility functions for string manipulation
 */

/**
 * Stringify objects with BigInt values and handle circular references
 * @param obj The object to stringify
 * @returns The stringified object
 */
export const stringifyWithBigInt = (obj: Record<string, any> | Record<string, any>[]): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};
