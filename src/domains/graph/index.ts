import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "graph",
  label: "Graph",
  icon: "type-hierarchy",
  persistence: "session",
  priority: 60,
  layout: { sidebar: false, agent: false, tray: false },
  component: lazy(() => import("./GraphSurface").then((m) => ({ default: m.GraphSurface }))),
});

export type { GraphFilter, GraphLayout } from "./graphAtoms";
export {
  graphFilterAtom,
  graphLayoutAtom,
  graphSearchAtom,
  graphZoomAtom,
  selectedNodeIdAtom,
} from "./graphAtoms";
export { GraphCanvas } from "./GraphCanvas";
export { GraphSurface } from "./GraphSurface";
export { GraphToolbar } from "./GraphToolbar";
export { NodeDetail } from "./NodeDetail";
