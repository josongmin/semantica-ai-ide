/**
 * System Lens Atoms — RFC-SYSTEM-LENS-001 §2.2
 */

import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { LensKind } from "~shared/protocol/types";

import type { LensBadgeData, LensDetailData } from "./types";

// ─── Visibility ──────────────────────────────────────────
export const systemLensEnabledAtom = atom<boolean>(true);
export const activeLensKindsAtom = atom<Set<LensKind>>(
  new Set<LensKind>(["call", "impact"]),
);

// ─── Badge Data (per-file) ───────────────────────────────
export const lensBadgeMapAtom = atom<Map<string, readonly LensBadgeData[]>>(new Map());

// ─── Hover Detail ────────────────────────────────────────
export const lensHoverTargetAtom = atom<{
  readonly symbolId: string;
  readonly position: { readonly x: number; readonly y: number };
} | null>(null);

export const lensDetailDataAtom = atom<LensDetailData | null>(null);
export const lensDetailLoadingAtom = atom<boolean>(false);

// ─── Mini Graph ──────────────────────────────────────────
export const lensMiniGraphVisibleAtom = atom<boolean>(false);
export const lensMiniGraphCenterAtom = atom<string | null>(null);

// ─── Derived ─────────────────────────────────────────────

/** Badges for currently active file (convenience selector) */
export const activeLensBadgesAtom = atom<readonly LensBadgeData[]>((get) => {
  const target = get(lensHoverTargetAtom);
  if (!target) return [];
  const filePath = target.symbolId.split(":")[0] ?? "";
  return get(lensBadgeMapAtom).get(filePath) ?? [];
});

// ─── Write Atoms ─────────────────────────────────────────

export const loadLensBadgesAtom = atom(
  null,
  async (_get, set, filePath: string) => {
    const { generateMockBadges } = await import("./mockData");
    const badges = generateMockBadges(filePath);
    set(lensBadgeMapAtom, (prev) => {
      const next = new Map(prev);
      next.set(filePath, badges);
      return next;
    });
  },
);

export const loadLensDetailAtom = atom(
  null,
  async (_get, set, symbolId: string, position: { x: number; y: number }) => {
    set(lensHoverTargetAtom, { symbolId, position });
    set(lensDetailLoadingAtom, true);
    const { generateMockDetail } = await import("./mockData");
    await new Promise<void>((r) => setTimeout(r, 40));
    const detail = generateMockDetail(symbolId);
    set(lensDetailDataAtom, detail);
    set(lensDetailLoadingAtom, false);
  },
);

export const clearLensHoverAtom = atom(null, (_get, set) => {
  set(lensHoverTargetAtom, null);
  set(lensDetailDataAtom, null);
  set(lensDetailLoadingAtom, false);
});

export const toggleLensKindAtom = atom(null, (_get, set, kind: LensKind) => {
  set(activeLensKindsAtom, (prev) => {
    const next = new Set(prev);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    return next;
  });
});

export const openMiniGraphAtom = atom(null, (_get, set, symbolId: string) => {
  set(lensMiniGraphCenterAtom, symbolId);
  set(lensMiniGraphVisibleAtom, true);
});

export const closeMiniGraphAtom = atom(null, (_get, set) => {
  set(lensMiniGraphVisibleAtom, false);
  set(lensMiniGraphCenterAtom, null);
});

// ─── Reset ───────────────────────────────────────────────
const resetSystemLensAtom = atom(null, (_get, set) => {
  set(systemLensEnabledAtom, true);
  set(activeLensKindsAtom, new Set<LensKind>(["call", "impact"]));
  set(lensBadgeMapAtom, new Map());
  set(lensHoverTargetAtom, null);
  set(lensDetailDataAtom, null);
  set(lensDetailLoadingAtom, false);
  set(lensMiniGraphVisibleAtom, false);
  set(lensMiniGraphCenterAtom, null);
});
registerResetAtom(resetSystemLensAtom);
