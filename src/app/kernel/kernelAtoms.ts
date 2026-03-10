import { atom } from "jotai";

import type { IntegrationKernel, KernelStatus } from "./types";

// ─── Kernel State Atoms ───────────────────────────────────

/** The kernel instance (set once during bootstrap) */
export const kernelAtom = atom<IntegrationKernel | null>(null);

/** Kernel initialization status */
export const kernelStatusAtom = atom<KernelStatus>("uninitialized");

/** Kernel error message (if any) */
export const kernelErrorAtom = atom<string | null>(null);
