import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "agents",
  label: "Agents",
  icon: "server-environment",
  persistence: "session",
  priority: 130,
  layout: { sidebar: false, agent: true, tray: true },
  component: lazy(() => import("./AgentsSurface").then((m) => ({ default: m.AgentsSurface }))),
});

export { AgentsSurface } from "./AgentsSurface";
export { agentsSubTabAtom } from "./AgentsSurface";
