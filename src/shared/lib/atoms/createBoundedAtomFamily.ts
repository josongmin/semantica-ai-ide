/**
 * Bounded atomFamily wrapper.
 *
 * Wraps Jotai's `atomFamily` with automatic eviction to prevent unbounded
 * memory growth between explicit reset cycles. Two eviction strategies
 * are applied lazily (on the next cache access after the threshold is hit):
 *
 *   1. **Max-size cap** — when the internal cache exceeds `maxSize`, the
 *      oldest entries (by creation timestamp) are removed until the cache
 *      is back at `maxSize`.
 *   2. **Max-age TTL** — entries older than `maxAgeMs` are removed on the
 *      next access.
 *
 * The returned object satisfies the same `AtomFamily` interface so it's a
 * drop-in replacement.
 *
 * Usage:
 * ```ts
 * export const messageAtomFamily = createBoundedAtomFamily(
 *   (_id: MessageId) => atom<UiMessage | null>(null),
 *   { maxSize: 2000 },
 * );
 * ```
 */
 
import { atomFamily } from "jotai/utils";
import type { Atom } from "jotai/vanilla";

export interface BoundedAtomFamilyOptions {
  /**
   * Maximum number of entries before oldest-first eviction kicks in.
   * @default 1000
   */
  maxSize?: number;

  /**
   * Maximum age in milliseconds. Entries older than this are evicted on next access.
   * Set to 0 or omit to disable age-based eviction (size-only).
   * @default 0 (disabled)
   */
  maxAgeMs?: number;
}

/**
 * Create a bounded atomFamily that auto-evicts stale/overflow entries.
 *
 * @param initializeAtom  Factory passed to Jotai's `atomFamily`.
 * @param options         Eviction policy knobs.
 * @param areEqual        Optional equality function for params (defaults to `===`).
 */
export function createBoundedAtomFamily<Param, AtomType extends Atom<unknown>>(
  initializeAtom: (param: Param) => AtomType,
  options: BoundedAtomFamilyOptions = {},
  areEqual?: (a: Param, b: Param) => boolean,
) {
  const { maxSize = 1000, maxAgeMs = 0 } = options;

  // eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
  const family = atomFamily(initializeAtom, areEqual);

  // Track entry count so we know when to trigger eviction.
  let entryCount = 0;

  // Listen for CREATE / REMOVE events to maintain an accurate count.
  family.unstable_listen((event) => {
    if (event.type === "CREATE") {
      entryCount++;
    } else {
      entryCount--;
    }
  });

  /**
   * Run eviction via `setShouldRemove`.
   *
   * `setShouldRemove` is called with a predicate `(createdAt, param) => boolean`.
   * Jotai iterates every cached entry and removes those for which the predicate
   * returns `true`, then we clear the predicate by passing `null`.
   *
   * For size-based eviction we compute a cutoff timestamp: any entry created
   * before the cutoff is removed. The cutoff is the creation time of the
   * (entryCount - maxSize)th oldest entry — but since we don't have direct
   * access to creation times, we approximate by using `Date.now() - maxAgeMs`
   * for age-based, and for size-based we let the oldest entries self-select
   * by using a two-pass approach: first collect timestamps, then evict.
   *
   * Jotai's `setShouldRemove` iterates all entries synchronously, so we can
   * collect in the first call and evict in the second.
   */
  function evict(): void {
    if (entryCount <= maxSize && maxAgeMs <= 0) return;

    const now = Date.now();

    if (entryCount > maxSize) {
      // Collect all creation timestamps to find the cutoff.
      const timestamps: number[] = [];
      family.setShouldRemove((createdAt: number) => {
        timestamps.push(createdAt);
        return false; // don't remove yet
      });
      family.setShouldRemove(null);

      // Sort ascending; entries with the smallest timestamps are oldest.
      timestamps.sort((a, b) => a - b);
      const overflow = timestamps.length - maxSize;
      if (overflow > 0) {
        // Use strict-less-than on the boundary timestamp to avoid over-evicting
        // when multiple entries share the same millisecond.
        const cutoff = timestamps[overflow] ?? 0; // first entry to *keep*
        family.setShouldRemove((createdAt: number) => createdAt < cutoff);
        family.setShouldRemove(null);
      }
    } else if (maxAgeMs > 0) {
      // Age-only eviction.
      const cutoff = now - maxAgeMs;
      family.setShouldRemove((createdAt: number) => createdAt < cutoff);
      family.setShouldRemove(null);
    }
  }

  // Wrap the call signature so eviction runs lazily on access.
  const bounded = ((param: Param): AtomType => {
    const result = family(param);
    // Schedule eviction asynchronously to avoid blocking the current render.
    if (entryCount > maxSize || (maxAgeMs > 0 && entryCount > 0)) {
      queueMicrotask(evict);
    }
    return result;
  }) as typeof family;

  // Forward all AtomFamily interface methods.
  bounded.getParams = family.getParams.bind(family);
  bounded.remove = family.remove.bind(family);
  bounded.setShouldRemove = family.setShouldRemove.bind(family);
  bounded.unstable_listen = family.unstable_listen.bind(family);

  return bounded;
}
