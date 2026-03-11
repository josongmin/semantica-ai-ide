import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "log",
  kind: "panel",
  title: "Log",
  icon: "list-ordered",
  frames: ["tray", "floating"],
  defaultFrame: "tray",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 60,
  component: lazy(() =>
    import("./ui/LogView").then((m) => ({
      default: m.LogView,
    })),
  ),
});
