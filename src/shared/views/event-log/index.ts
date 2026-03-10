import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "agent-log",
  kind: "panel",
  title: "Event Log",
  icon: "pulse",
  frames: ["tray", "floating"],
  defaultFrame: "tray",
  shortcut: "Cmd+Shift+L",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 40,
  component: lazy(() =>
    import("./ui/EventLogView").then((m) => ({
      default: m.EventLogView,
    })),
  ),
});
