import React from "react";

import { SurfaceSkeleton } from "~surfaces/SurfaceSkeleton";

const ChatPage = React.lazy(() =>
  import("./pages").then((m) => ({ default: m.ChatPage })),
);

export function ChatSurface() {
  return (
    <React.Suspense fallback={<SurfaceSkeleton label="Chat" />}>
      <ChatPage />
    </React.Suspense>
  );
}
