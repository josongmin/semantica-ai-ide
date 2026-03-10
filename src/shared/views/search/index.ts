import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "search",
  kind: "panel",
  title: "Search",
  icon: "search",
  frames: ["dock-left", "floating"],
  defaultFrame: "dock-left",
  shortcut: "Cmd+Shift+F",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 20,
  component: lazy(() =>
    import("./ui/SearchView").then((m) => ({
      default: m.SearchView,
    })),
  ),
});
