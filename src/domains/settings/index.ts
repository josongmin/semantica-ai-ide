import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "settings",
  label: "Settings",
  icon: "gear",
  persistence: "session",
  priority: 90,
  layout: { sidebar: false, agent: false, tray: false },
  component: lazy(() => import("./SettingsSurface").then((m) => ({ default: m.SettingsSurface }))),
});

export { SettingsSurface } from "./SettingsSurface";
