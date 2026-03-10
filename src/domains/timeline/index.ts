import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "timeline",
  label: "Timeline",
  icon: "timeline-open",
  persistence: "session",
  priority: 120,
  component: lazy(() =>
    import("./TimelineSurface").then((m) => ({ default: m.TimelineSurface })),
  ),
});

export { TimelineSurface } from "./TimelineSurface";
