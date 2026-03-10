import React from "react";
import { useAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import { replayPlayingAtom, replaySpeedAtom } from "./replayAtoms";

const SPEEDS = [1, 2, 4, 8] as const;

export const TimelineScrubber = React.memo(function TimelineScrubber() {
  const [playing, setPlaying] = useAtom(replayPlayingAtom);
  const [speed, setSpeed] = useAtom(replaySpeedAtom);

  return (
    <div className="flex items-center gap-3 px-4 h-9 border-b border-vsc-border bg-vsc-surface-1 shrink-0">
      {/* Transport Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-sm",
            "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
            "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-list-hover",
          )}
          title="Previous"
          aria-label="Previous frame"
        >
          <Icon name="arrow-left" tokenSize="sm" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-sm",
            "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
            "text-vsc-fg hover:text-vsc-button hover:bg-vsc-list-hover",
          )}
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
        >
          <Icon name={playing ? "debug-pause" : "play"} tokenSize="base" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying(false)}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-sm",
            "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
            "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-list-hover",
          )}
          title="Stop"
          aria-label="Stop"
        >
          <Icon name="debug-stop" tokenSize="sm" />
        </button>
      </div>

      {/* Scrubber Bar */}
      <div
        className="flex-1 h-1 bg-vsc-surface-3 rounded-full relative"
        role="progressbar"
        aria-valuenow={0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="absolute left-0 top-0 h-full w-0 bg-vsc-button rounded-full transition-[width] duration-normal" />
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-0.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={cn(
              "px-1.5 py-0.5 text-2xs rounded-sm border-none",
              "cursor-pointer transition-colors duration-fast focus-ring tabular-nums",
              speed === s
                ? "bg-vsc-button text-vsc-button-fg font-medium"
                : "bg-transparent text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-list-hover",
            )}
            aria-label={`Playback speed ${s}x`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
});
