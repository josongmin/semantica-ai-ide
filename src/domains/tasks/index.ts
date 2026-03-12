import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "tasks",
  label: "Tasks",
  icon: "tasklist",
  persistence: "session",
  priority: 110,
  layout: { sidebar: false, agent: true, tray: false },
  component: lazy(() => import("./TasksSurface").then((m) => ({ default: m.TasksSurface }))),
});

export { TasksSurface } from "./TasksSurface";
