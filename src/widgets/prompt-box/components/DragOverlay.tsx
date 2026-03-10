import React from "react";

import { Icon, Text } from "../../../shared/ui";

/**
 * Overlay displayed when files are being dragged over the prompt box.
 */
export const DragOverlay = React.memo(function DragOverlay() {
  return (
    <div className="absolute inset-0 z-[--z-overlay] flex items-center justify-center bg-vsc-surface-1/80 backdrop-blur-sm pointer-events-none rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vsc-focus/10 border border-vsc-focus/30">
        <Icon name="cloud-upload" tokenSize="sm" className="text-vsc-focus" />
        <Text size="sm" weight="medium" tone="primary">
          Drop files to attach
        </Text>
      </div>
    </div>
  );
});
