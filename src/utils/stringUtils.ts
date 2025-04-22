/**
 * Stringify objects with BigInt values
 */
export const stringifyWithBigInt = (obj: Record<string, any> | Record<string, any>[]): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};
