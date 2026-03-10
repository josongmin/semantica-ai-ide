import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "symbols",
  kind: "panel",
  title: "Symbols",
  icon: "symbol-class",
  frames: ["dock-left", "floating"],
  defaultFrame: "dock-left",
  shortcut: "Cmd+Shift+O",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 30,
  component: lazy(() =>
    import("./ui/SymbolsView").then((m) => ({
      default: m.SymbolsView,
    })),
  ),
});
