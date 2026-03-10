import type { TimelineEvent, Checkpoint } from "../models/timeline.js";

export interface ReplayTimelineViewModel {
  readonly events: TimelineEvent[];
  readonly checkpoints: Checkpoint[];
  readonly totalDuration: number;
  readonly currentPosition?: number;
}
