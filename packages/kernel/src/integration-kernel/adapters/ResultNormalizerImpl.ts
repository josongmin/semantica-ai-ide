import type { QueryIntent, ResultNormalizer } from "../types.js";

export class ResultNormalizerImpl implements ResultNormalizer {
  private readonly normalizers = new Map<
    QueryIntent["category"],
    (raw: unknown) => unknown
  >();

  /**
   * Register a custom normalizer for a specific query category.
   * If none is registered, the raw result is returned wrapped in a standard envelope.
   */
  registerNormalizer(
    category: QueryIntent["category"],
    fn: (raw: unknown) => unknown,
  ): void {
    this.normalizers.set(category, fn);
  }

  normalize(category: QueryIntent["category"], raw: unknown): unknown {
    const fn = this.normalizers.get(category);
    if (fn) {
      return fn(raw);
    }
    // Pass-through: return raw result wrapped in a standard envelope
    return {
      category,
      timestamp: Date.now(),
      data: raw,
    };
  }
}
