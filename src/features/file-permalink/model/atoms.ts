/**
 * File Permalink Atoms
 *
 * Tracks which turns touched which files, enabling "Turn N" badges
 * next to file names that link back to the originating turn.
 */
import { atom } from "jotai";

import { fileChangeSummaryByTurnAtom } from "~entities/diff";
import { turnOrderAtom } from "~entities/message/turns";

import type { TurnId } from "../../../shared/protocol";

// ─── Types ────────────────────────────────────────────────

export interface FilePermalink {
  readonly turnId: string;
  readonly lineStart?: number;
  readonly lineEnd?: number;
}

// ─── Derived: file → permalink map ───────────────────────

/**
 * Derived atom: builds a Map<filePath, FilePermalink> from all turns.
 * Latest turn wins when multiple turns touch the same file.
 */
export const filePermalinkMapAtom = atom<ReadonlyMap<string, FilePermalink>>((get) => {
  const turnIds = get(turnOrderAtom);
  const map = new Map<string, FilePermalink>();

  // Process in order so latest turn overwrites earlier
  for (const turnId of turnIds) {
    const summary = get(fileChangeSummaryByTurnAtom(turnId));
    for (const fc of summary.files) {
      map.set(fc.file_path, {
        turnId: fc.turn_id,
      });
    }
  }

  return map;
});

/**
 * Derived atom: get the turn index (1-based) for display in badges.
 */
export const filePermalinkTurnIndexAtom = atom<ReadonlyMap<string, number>>((get) => {
  const turnIds = get(turnOrderAtom);
  const indexMap = new Map<string, number>();
  for (let i = 0; i < turnIds.length; i++) {
    const turnId = turnIds[i];
    if (turnId !== undefined) {
      indexMap.set(turnId, i + 1);
    }
  }
  return indexMap;
});

/**
 * Helper: resolve a file path to its turn display label ("Turn N").
 * Returns null if the file has no permalink.
 */
export const fileTurnLabelAtom = atom((get) => {
  const permalinks = get(filePermalinkMapAtom);
  const turnIndices = get(filePermalinkTurnIndexAtom);

  return (filePath: string): { label: string; turnId: TurnId } | null => {
    const link = permalinks.get(filePath);
    if (!link) return null;
    const index = turnIndices.get(link.turnId);
    if (index === undefined) return null;
    return {
      label: `Turn ${index}`,
      turnId: link.turnId as TurnId,
    };
  };
});
