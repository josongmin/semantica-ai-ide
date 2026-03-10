/**
 * Feature bootstrap registry.
 *
 * Decouples App.tsx from concrete feature hook imports (DIP / OCP).
 * Features are described declaratively; the registry owns ordering.
 *
 * Each feature module calls `registerBootstrapFeature()` at module scope
 * (side-effect import).  The consumer calls `getBootstrapFeatures()` to
 * retrieve the sorted list without knowing which features exist.
 */

/** A hook that runs once at app-level bootstrap. Return value is ignored. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BootstrapHook = () => any;

export interface FeatureDescriptor {
  /** Human-readable identifier (used for logging / devtools). */
  readonly name: string;
  /** The React hook to call during bootstrap. */
  readonly hook: BootstrapHook;
  /** Higher priority runs first.  Default 0. */
  readonly priority?: number;
}

const registry: FeatureDescriptor[] = [];
let sorted = true;

/**
 * Register a feature to be bootstrapped at App mount.
 * Safe to call at module-level (top-level side-effect).
 */
export function registerBootstrapFeature(descriptor: FeatureDescriptor): void {
  registry.push(descriptor);
  sorted = false;
}

/**
 * Return the registered features sorted by descending priority.
 * The returned array is a snapshot -- mutations don't affect the registry.
 */
export function getBootstrapFeatures(): readonly FeatureDescriptor[] {
  if (!sorted) {
    registry.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    sorted = true;
  }
  return registry;
}
