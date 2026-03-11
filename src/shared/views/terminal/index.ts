import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "terminal",
  kind: "panel",
  title: "Terminal",
  icon: "terminal",
  frames: ["tray", "floating"],
  defaultFrame: "tray",
  shortcut: "Cmd+`",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 40,
  component: lazy(() =>
    import("./ui/TerminalView").then((m) => ({
      default: m.TerminalView,
    })),
  ),
});
