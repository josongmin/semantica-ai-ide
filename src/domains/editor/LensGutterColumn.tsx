import { memo } from "react";

import { type LensBadgeData,LensGutterBadge } from "~features/system-lens";

interface LensGutterColumnProps {
  badges: readonly LensBadgeData[];
  onBadgeHover: (symbolId: string, rect: DOMRect) => void;
  onBadgeHoverEnd: () => void;
  onBadgeClick: (symbolId: string) => void;
  lineHeight: number;
  scrollTop: number;
}

export const LensGutterColumn = memo(function LensGutterColumn({
  badges,
  onBadgeHover,
  onBadgeHoverEnd,
  onBadgeClick,
  lineHeight,
  scrollTop,
}: LensGutterColumnProps) {
  return (
    <div className="shrink-0 w-[120px] overflow-hidden relative border-r border-vsc-border/15 bg-vsc-surface-1/30">
      <div style={{ transform: `translateY(-${scrollTop}px)` }}>
        {badges.map((badge) => (
          <div
            key={badge.symbolId}
            className="absolute left-0 right-0"
            style={{ top: (badge.line - 1) * lineHeight }}
          >
            <LensGutterBadge
              badge={badge}
              onHover={onBadgeHover}
              onHoverEnd={onBadgeHoverEnd}
              onClick={onBadgeClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
