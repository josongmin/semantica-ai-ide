import { atom } from "jotai";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

export type McpAppType = "chart" | "diagram" | "whiteboard" | "form" | "table";

export interface McpInteractiveApp {
  id: string;
  type: McpAppType;
  title: string;
  /** Serialized data payload for rendering */
  data: string;
  /** Optional server name that provided the app */
  serverName?: string;
}

/** Per-turn MCP interactive apps */
export const mcpAppsAtomFamily = createBoundedAtomFamily(
  (_turnId: string) => atom<McpInteractiveApp[]>([]),
  { maxSize: 200 },
  (a: string, b: string) => a === b,
);
setDebugLabel(mcpAppsAtomFamily, "mcpAppsAtomFamily");

/** Reset all per-turn MCP app state */
export const resetMcpAppStoreAtom = atom(null, (_get, _set) => {
  mcpAppsAtomFamily.setShouldRemove(() => true);
  mcpAppsAtomFamily.setShouldRemove(null);
});
registerResetAtom(resetMcpAppStoreAtom);
