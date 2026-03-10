/**
 * Test-only helpers for creating branded ID values without `as any`.
 *
 * Usage:
 *   import { brandId } from "../../../tests/utils/branded";
 *   const id = brandId<AgentInstanceId>("agent-1");
 */

/**
 * Cast a plain string to a branded ID type.
 * Only for use in tests — production code should use factory functions.
 */
export function brandId<T extends string>(value: string): T {
  return value as unknown as T;
}
