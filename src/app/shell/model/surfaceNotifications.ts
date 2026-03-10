/**
 * Surface Notification Dots — derived state for tab bar indicators.
 *
 * Returns a Map<SurfaceId, boolean> indicating which surfaces have
 * pending activity the user hasn't viewed yet.
 */

import { atom, useAtomValue } from "jotai";

import { impactAnalysisResultAtom } from "~features/impact-radar/model/atoms";
import { intentPlanAtom } from "~features/intent-engine/model/atoms";
import { rootCauseAnalysisAtom } from "~features/root-cause/model/atoms";
import { lensBadgeMapAtom } from "~features/system-lens/model/atoms";

import type { SurfaceId } from "../../../shared/protocol/types/ui";

// ─── Derived Atom ───────────────────────────────────────

export const surfaceNotificationsAtom = atom<Map<SurfaceId, boolean>>((get) => {
  const notifications = new Map<SurfaceId, boolean>();

  // "code" — true when system lens has badges for any file
  const badgeMap = get(lensBadgeMapAtom);
  const hasLensBadges = badgeMap.size > 0;
  if (hasLensBadges) {
    notifications.set("code", true);
  }

  // "reasoning" — true when root cause has results OR intent engine has a plan
  const rootCause = get(rootCauseAnalysisAtom);
  const intentPlan = get(intentPlanAtom);
  if (rootCause !== null || intentPlan !== null) {
    notifications.set("reasoning", true);
  }

  // "graph" — true when impact radar has results
  const impactResult = get(impactAnalysisResultAtom);
  if (impactResult !== null) {
    notifications.set("graph", true);
  }

  return notifications;
});

// ─── Hook ───────────────────────────────────────────────

export function useSurfaceNotifications(): Map<SurfaceId, boolean> {
  return useAtomValue(surfaceNotificationsAtom);
}
