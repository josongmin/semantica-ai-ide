import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "overview",
  label: "Overview",
  icon: "dashboard",
  persistence: "session",
  priority: 90,
  layout: { sidebar: false, agent: false, tray: false },
  component: lazy(() => import("./OverviewSurface").then((m) => ({ default: m.OverviewSurface }))),
});

export { OverviewSurface } from "./OverviewSurface";
