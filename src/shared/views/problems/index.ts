import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "problems",
  kind: "panel",
  title: "Problems",
  icon: "warning",
  frames: ["tray", "floating"],
  defaultFrame: "tray",
  shortcut: "Cmd+Shift+M",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 10,
  component: lazy(() =>
    import("./ui/ProblemsView").then((m) => ({
      default: m.ProblemsView,
    })),
  ),
});
