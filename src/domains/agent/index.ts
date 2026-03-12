import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "agent",
  label: "Agent",
  icon: "hubot",
  persistence: "session",
  priority: 50,
  layout: { sidebar: false, agent: true, tray: true },
  component: lazy(() => import("./AgentSurface").then((m) => ({ default: m.AgentSurface }))),
});

export type { AgentViewMode } from "./agentAtoms";
export { agentViewModeAtom, selectedAgentIdAtom } from "./agentAtoms";
export { AgentBoard } from "./AgentBoard";
export { AgentSurface } from "./AgentSurface";
export { ContextInspector } from "./ContextInspector";
export { ExecutionControls } from "./ExecutionControls";
