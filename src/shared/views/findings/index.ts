import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "findings",
  kind: "panel",
  title: "Findings",
  icon: "warning",
  frames: ["dock-left", "floating"],
  defaultFrame: "dock-left",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 40,
  component: lazy(() =>
    import("./ui/FindingsView").then((m) => ({
      default: m.FindingsView,
    })),
  ),
});
