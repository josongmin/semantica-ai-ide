import React from "react";

import { cn } from "../variants";

export interface WaveformBarProps {
  /** Array of amplitude levels 0..1 (typically 16 bars) */
  levels: number[];
  /** Whether actively recording */
  active?: boolean;
  className?: string;
}

/** Animated waveform visualizer for Voice Mode. */
export const WaveformBar = React.memo(function WaveformBar({
  levels,
  active = true,
  className,
}: WaveformBarProps) {
  return (
    <div
      className={cn("flex items-center gap-px h-4", className)}
      role="img"
      aria-label={active ? "Recording audio" : "Audio paused"}
    >
      {/* Static list — index key safe */}
      {levels.map((level, i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 rounded-full transition-transform duration-fast",
            active ? "bg-vsc-info" : "bg-vsc-fg/20",
          )}
          style={{
            height: `${Math.max(level * 100, 10)}%`,
            animationDelay: active ? `${i * 50}ms` : undefined,
            animation: active ? "waveform 600ms ease-in-out infinite" : undefined,
          }}
        />
      ))}
    </div>
  );
});
