import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

import { MOCK_DOC_STATUSES,MOCK_DRIFT_ITEMS } from "./mockDocDriftData";

// ─── Types ──────────────────────────────────────────────────

export type DriftSeverity = "mismatch" | "outdated" | "missing-link";

export type DriftStatus = "synced" | "drifted" | "new" | "unlinked";

export interface DriftItem {
  id: string;
  docPath: string;
  docLine: number;
  docAssertion: string;
  codePath: string;
  codeLine: number;
  codeValue: string;
  severity: DriftSeverity;
  confidence: number;
  autoFixable: boolean;
}

export interface DocStatus {
  path: string;
  fileName: string;
  status: DriftStatus;
  driftCount: number;
  lastScanned: number;
}

export interface DocDriftSummary {
  totalDocs: number;
  syncedDocs: number;
  driftedDocs: number;
  newDocs: number;
  lastScanTime: number;
}

// ─── Atoms ──────────────────────────────────────────────────

/** All detected drift items. */
export const docDriftItemsAtom = atom<DriftItem[]>([]);

/** Map of doc path → DocStatus. */
export const docStatusMapAtom = atom<Map<string, DocStatus>>(new Map());

/** Whether a scan is in progress. */
export const docDriftScanningAtom = atom<boolean>(false);

/** Bottom panel visibility. */
export const docDriftPanelVisibleAtom = atom<boolean>(false);

// ─── Derived Atoms ──────────────────────────────────────────

/** Computed summary from docStatusMapAtom. */
export const docDriftSummaryAtom = atom<DocDriftSummary>((get) => {
  const statusMap = get(docStatusMapAtom);
  let totalDocs = 0;
  let syncedDocs = 0;
  let driftedDocs = 0;
  let newDocs = 0;
  let lastScanTime = 0;

  for (const doc of statusMap.values()) {
    totalDocs++;
    if (doc.status === "synced") syncedDocs++;
    else if (doc.status === "drifted") driftedDocs++;
    else if (doc.status === "new") newDocs++;
    if (doc.lastScanned > lastScanTime) lastScanTime = doc.lastScanned;
  }

  return { totalDocs, syncedDocs, driftedDocs, newDocs, lastScanTime };
});

/** Get status for a specific doc path. */
export const getDocStatusAtom = (docPath: string) =>
  atom((get) => get(docStatusMapAtom).get(docPath) ?? null);

// ─── Write Atoms ────────────────────────────────────────────

/** Simulates a drift scan with delay, populates mock data. */
export const scanDocDriftAtom = atom(null, async (_get, set) => {
  set(docDriftScanningAtom, true);

  // Simulate scanning delay
  await new Promise((resolve) => setTimeout(resolve, 1800));

  // Populate mock data
  const statusMap = new Map<string, DocStatus>();
  for (const doc of MOCK_DOC_STATUSES) {
    statusMap.set(doc.path, { ...doc, lastScanned: Date.now() });
  }

  set(docStatusMapAtom, statusMap);
  set(docDriftItemsAtom, [...MOCK_DRIFT_ITEMS]);
  set(docDriftScanningAtom, false);
});

/** Dismiss a single drift item by id. */
export const dismissDriftAtom = atom(null, (get, set, driftId: string) => {
  const items = get(docDriftItemsAtom);
  const updated = items.filter((i) => i.id !== driftId);
  set(docDriftItemsAtom, updated);

  // Update the associated doc's drift count
  const dismissed = items.find((i) => i.id === driftId);
  if (dismissed) {
    const statusMap = new Map(get(docStatusMapAtom));
    const docStatus = statusMap.get(dismissed.docPath);
    if (docStatus) {
      const newCount = Math.max(0, docStatus.driftCount - 1);
      statusMap.set(dismissed.docPath, {
        ...docStatus,
        driftCount: newCount,
        status: newCount === 0 ? "synced" : "drifted",
      });
      set(docStatusMapAtom, statusMap);
    }
  }
});

// ─── Reset ──────────────────────────────────────────────────

const resetDocDriftAtom = atom(null, (_get, set) => {
  set(docDriftItemsAtom, []);
  set(docStatusMapAtom, new Map());
  set(docDriftScanningAtom, false);
  set(docDriftPanelVisibleAtom, false);
});

registerResetAtom(resetDocDriftAtom);
