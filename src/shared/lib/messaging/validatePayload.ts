/**
 * Lightweight runtime payload validators for sync hook messages.
 * Prevents untrusted data from being blindly cast via `as Type`.
 */

/** Check that value is a non-null object */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Check that value is a non-null object with specific required string fields */
export function hasStringFields<K extends string>(
  value: unknown,
  ...fields: K[]
): value is Record<K, string> & Record<string, unknown> {
  if (!isObject(value)) return false;
  return fields.every((f) => typeof (value)[f] === "string");
}

/** Check that value is a non-null object with at least one key */
export function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && Object.keys(value).length > 0;
}

/** Check that value is an array where every element passes a predicate */
export function isArrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}
