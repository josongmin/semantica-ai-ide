import { atom } from "jotai";

// ─── Toast Types ─────────────────────────────────────────

export type ToastVariant = "info" | "success" | "error" | "warning";

export interface ToastData {
  readonly id: string;
  readonly message: string;
  readonly variant?: ToastVariant;
  readonly duration?: number;
}

// ─── Toast Stack ──────────────────────────────────────────

const MAX_TOASTS = 5;

/** Reactive toast stack (read-only externally) */
export const toastStackAtom = atom<readonly ToastData[]>([]);

/** Push a new toast. Keeps at most MAX_TOASTS in the stack. */
export const pushToastAtom = atom(null, (get, set, toast: ToastData) => {
  const current = get(toastStackAtom);
  const next = [...current, toast].slice(-MAX_TOASTS);
  set(toastStackAtom, next);
});

/** Dismiss a toast by id */
export const dismissToastAtom = atom(null, (get, set, id: string) => {
  const current = get(toastStackAtom);
  set(
    toastStackAtom,
    current.filter((t) => t.id !== id),
  );
});

/** Reset all toast atoms to their defaults */
export const resetToastAtomsAtom = atom(null, (_get, set) => {
  set(toastStackAtom, []);
});
