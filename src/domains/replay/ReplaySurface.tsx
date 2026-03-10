import { EventTimeline } from "./EventTimeline";
import { StateInspector } from "./StateInspector";
import { TimelineScrubber } from "./TimelineScrubber";

export function ReplaySurface() {
  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      {/* Timeline Scrubber */}
      <TimelineScrubber />

      {/* Event Timeline */}
      <EventTimeline />

      {/* State Inspector */}
      <StateInspector />
    </div>
  );
}
