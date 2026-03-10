import { EvidenceSidebar } from "./EvidenceSidebar";
import { ReviewControls } from "./ReviewControls";

import { SurfacePlaceholder } from "~surfaces/SurfacePlaceholder";

export function ReviewSurface() {
  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      {/* Main Content: Diff Viewer + Evidence Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Diff Viewer (center) */}
        <div className="flex-1 min-w-0">
          <SurfacePlaceholder
            title="Diff Viewer"
            description="Select a patch from the review queue to view changes and evidence."
            icon="diff"
          />
        </div>

        {/* Evidence Sidebar (right) */}
        <div className="w-[280px] shrink-0">
          <EvidenceSidebar />
        </div>
      </div>

      {/* Review Controls (bottom) */}
      <ReviewControls />
    </div>
  );
}
