import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "replay",
  label: "Replay",
  icon: "history",
  persistence: "session",
  priority: 40,
  component: lazy(() =>
    import("./ReplaySurface").then((m) => ({ default: m.ReplaySurface })),
  ),
});

export { EventTimeline } from "./EventTimeline";
export {
  replayFilterDomainAtom,
  replayPlayingAtom,
  replayPositionAtom,
  replaySpeedAtom,
} from "./replayAtoms";
export { ReplaySurface } from "./ReplaySurface";
export { StateInspector } from "./StateInspector";
export { TimelineScrubber } from "./TimelineScrubber";
