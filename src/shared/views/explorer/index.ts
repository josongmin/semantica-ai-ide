import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "file-tree",
  kind: "panel",
  title: "Explorer",
  icon: "files",
  frames: ["dock-left", "floating"],
  defaultFrame: "dock-left",
  shortcut: "Cmd+Shift+E",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 10,
  component: lazy(() =>
    import("./ui/ExplorerView").then((m) => ({
      default: m.ExplorerView,
    })),
  ),
});
