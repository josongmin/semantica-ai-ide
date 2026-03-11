import { lazy } from "react";

import { registerView } from "~app/shell/model/viewRegistry";

registerView({
  id: "tasks",
  kind: "panel",
  title: "Tasks",
  icon: "checklist",
  frames: ["tray", "floating"],
  defaultFrame: "tray",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 50,
  component: lazy(() =>
    import("./ui/TasksView").then((m) => ({
      default: m.TasksView,
    })),
  ),
});
