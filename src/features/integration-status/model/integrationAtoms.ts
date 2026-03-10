/**
 * Integration Status atoms (CS-08).
 *
 * Tracks connected integrations (Slack, Teams, Discord, etc.)
 * with their connection status and sync state.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { IntegrationConnection } from "../../../shared/protocol";

// ─── Integration Data ────────────────────────────────────────

/** All integrations keyed by id */
export const integrationsMapAtom = atom<ReadonlyMap<string, IntegrationConnection>>(new Map());

/** Write-only: replace all integrations */
export const setIntegrationsAtom = atom(
  null,
  (_get, set, connections: readonly IntegrationConnection[]) => {
    const map = new Map<string, IntegrationConnection>();
    for (const conn of connections) {
      map.set(conn.id, conn);
    }
    set(integrationsMapAtom, map);
  },
);

/** Derived: ordered list of integrations (sorted by platform then channel) */
export const integrationsListAtom = atom((get) => {
  const map = get(integrationsMapAtom);
  return [...map.values()].sort(
    (a, b) => {
      const platformCmp = a.platform.localeCompare(b.platform);
      return platformCmp !== 0 ? platformCmp : a.channel.localeCompare(b.channel);
    },
  );
});

/** Derived: only connected or syncing integrations */
export const activeIntegrationsAtom = atom((get) =>
  get(integrationsListAtom).filter((conn) => conn.status !== "disconnected"),
);

/** Derived: count of connected integrations */
export const connectedIntegrationsCountAtom = atom(
  (get) => get(integrationsListAtom).filter((conn) => conn.status === "connected").length,
);

/** Whether the integration panel is visible */
export const integrationPanelOpenAtom = atom(false);

/** Write-only: reset integrations store */
export const resetIntegrationsStoreAtom = atom(null, (_get, set) => {
  set(integrationsMapAtom, new Map());
  set(integrationPanelOpenAtom, false);
});

registerResetAtom(resetIntegrationsStoreAtom);
