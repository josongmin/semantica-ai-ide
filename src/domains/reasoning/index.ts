import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "reasoning",
  label: "Reasoning",
  icon: "lightbulb",
  persistence: "session",
  priority: 100,
  component: lazy(() =>
    import("./ReasoningSurface").then((m) => ({
      default: m.ReasoningSurface,
    })),
  ),
});

export { ReasoningSurface } from "./ReasoningSurface";
