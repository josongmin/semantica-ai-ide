import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "output",
  kind: "panel",
  title: "Output",
  icon: "output",
  frames: ["tray", "floating"],
  defaultFrame: "tray",
  shortcut: "Cmd+Shift+U",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 20,
  component: lazy(() =>
    import("./ui/OutputView").then((m) => ({
      default: m.OutputView,
    })),
  ),
});
