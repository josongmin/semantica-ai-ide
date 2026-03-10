/**
 * Design Tokens (Tier 0)
 *
 * JS-accessible token maps derived from the CSS custom properties in index.css.
 * Consumed by components that need token values for logic (not just styling).
 */

/** Typography scale — maps token name to Tailwind class */
export const fontSize = {
  "3xs": "text-2xs",
  "2xs": "text-2xs",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
  lg: "text-lg",
} as const;

/** Transition durations — maps token name to Tailwind class */
export const duration = {
  instant: "duration-instant",
  fast: "duration-fast",
  normal: "duration-normal",
  slow: "duration-slow",
  glacial: "duration-glacial",
} as const;

/** Z-index layers — maps token name to CSS variable reference */
export const zIndex = {
  base: "z-[--z-base]",
  sticky: "z-[--z-sticky]",
  overlay: "z-[--z-overlay]",
  modal: "z-[--z-modal]",
  tooltip: "z-[--z-tooltip]",
  toast: "z-[--z-toast]",
} as const;

/** Semantic status text colors — canonical base mapping */
export const statusColor = {
  success: "text-vsc-success",
  warning: "text-vsc-warning",
  error: "text-vsc-error",
  info: "text-vsc-info",
} as const;

/** Semantic status background colors */
export const statusBg = {
  success: "bg-vsc-success",
  warning: "bg-vsc-warning",
  error: "bg-vsc-error",
  info: "bg-vsc-info",
} as const;

/** Semantic status subtle backgrounds (standardized /10 opacity) */
export const statusBgSubtle = {
  success: "bg-vsc-success/10",
  warning: "bg-vsc-warning/10",
  error: "bg-vsc-error/10",
  info: "bg-vsc-info/10",
} as const;

/**
 * Animation duration tokens for animate-[] shorthand.
 * Use these instead of hardcoding ms values in Tailwind animate-[..._Xms_...].
 */
export const animDuration = {
  instant: "var(--duration-instant)",
  fast: "var(--duration-fast)",
  normal: "var(--duration-normal)",
  slow: "var(--duration-slow)",
  glacial: "var(--duration-glacial)",
} as const;

/** Easing function tokens */
export const easing = {
  default: "var(--ease-default)",
  spring: "var(--ease-spring)",
  snappy: "cubic-bezier(0.2, 0, 0, 1)",
  gentle: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.34, 1.8, 0.64, 1)",
} as const;

/** Spacing constraint tokens */
export const spacing = {
  xs: "var(--space-xs)",
  sm: "var(--space-sm)",
  md: "var(--space-md)",
  lg: "var(--space-lg)",
  xl: "var(--space-xl)",
  "2xl": "var(--space-2xl)",
  "3xl": "var(--space-3xl)",
} as const;

/** Feedback duration for copy-to-clipboard (ms) */
export const COPY_FEEDBACK_MS = 2000;
