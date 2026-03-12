import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "chat",
  label: "Chat",
  icon: "comment-discussion",
  persistence: "session",
  priority: 10,
  layout: { sidebar: false, agent: false, tray: false },
  component: lazy(() => import("./ChatSurface").then((m) => ({ default: m.ChatSurface }))),
});

export { ChatSurface } from "./ChatSurface";
