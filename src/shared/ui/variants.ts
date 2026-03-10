/**
 * Shared CVA Base Utilities (Tier 0)
 *
 * Common class strings, variant fragments, and utilities
 * reused across multiple components.
 */

import { type ClassValue, clsx } from "clsx";

/** Merge class names — shadcn cn() pattern */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Focus ring classes — replaced by the `focus-ring` @utility in index.css */
export const focusRing = "focus-ring";

/** Standard interactive element base */
export const interactiveBase = "cursor-pointer transition-colors duration-fast";

/** Disabled state classes */
export const disabledStyles = "disabled:opacity-50 disabled:cursor-not-allowed";
