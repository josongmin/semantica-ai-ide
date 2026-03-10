import React from "react";

import { SurfaceSkeleton } from "~surfaces/SurfaceSkeleton";

const EditorSurface = React.lazy(() => import("../editor").then((m) => ({ default: m.EditorSurface })));

// ─── Component ───────────────────────────────────────────

export const CodeSurface = React.memo(function CodeSurface() {
  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      <div className="flex-1 min-h-0 relative">
        <React.Suspense fallback={<SurfaceSkeleton label="editor" />}>
          <EditorSurface />
        </React.Suspense>
      </div>
    </div>
  );
});
