/**
 * Diff entity handlers.
 *
 * Covers: UPSERT_FILE_CHANGE
 */
import { upsertFileChangeAtom } from "~entities/diff";

import type { ServerEvent } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

// ── Self-registering handler (side-effect at import time) ──

registerHandler("UPSERT_FILE_CHANGE", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_FILE_CHANGE") return;
  s.set(upsertFileChangeAtom, e.file_change);
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupDiffHandlers(): void {
  // Handlers are now registered at module scope.
}
