/**
 * Type-safe debug label setter for Jotai atoms and atom families.
 * Eliminates `(atom as any).debugLabel = "..."` pattern.
 *
 * Jotai's AtomFamily type doesn't declare `debugLabel` in its public type,
 * but the property exists at runtime. We use a minimal type assertion internally
 * so callers don't need `as any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setDebugLabel(target: any, label: string): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- debugLabel is a runtime-only Jotai property
  target.debugLabel = label;
}
