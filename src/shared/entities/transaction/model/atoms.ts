import { atom } from "jotai";

import type { TransactionStatus } from "~shared/protocol";

/** Currently active transaction (one at a time) */
export const activeTransactionAtom = atom<TransactionStatus | null>(null);

/** Transaction history for the session */
export const transactionHistoryAtom = atom<readonly TransactionStatus[]>([]);

/** Derived: file count in active transaction */
export const transactionFileCountAtom = atom((get) => {
  const tx = get(activeTransactionAtom);
  return tx?.files.length ?? 0;
});

/** Derived: aggregate stats */
export const transactionStatsAtom = atom((get) => {
  const tx = get(activeTransactionAtom);
  if (!tx) return { insertions: 0, deletions: 0, files: 0 };
  return {
    insertions: tx.files.reduce((s, f) => s + f.insertions, 0),
    deletions: tx.files.reduce((s, f) => s + f.deletions, 0),
    files: tx.files.length,
  };
});

/** Derived: has validation errors */
export const transactionHasErrorsAtom = atom((get) => {
  const tx = get(activeTransactionAtom);
  return (tx?.validationErrors.length ?? 0) > 0;
});
