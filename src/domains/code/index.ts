import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "code",
  label: "Code",
  icon: "code",
  persistence: "session",
  priority: 80,
  component: lazy(() =>
    import("./CodeSurface").then((m) => ({ default: m.CodeSurface })),
  ),
});

export { CodeSurface } from "./CodeSurface";
