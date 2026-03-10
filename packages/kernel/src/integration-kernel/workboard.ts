import type { QueryIntent, QueryJob } from "./types.js";

/** Lane classification for workboard organization */
export type WorkboardLane =
  | "analysis"      // impact, slice, callGraph, typeHierarchy, symbolGraph
  | "security"      // taintFindings, sourceSinkPaths, securitySummary, securityDelta
  | "quality"       // cloneResults, metrics, deadCode, complexityDelta
  | "review"        // reviewEvidence, impactDelta
  | "architecture"  // serviceGraph, dependencyGraph, architectureViolations
  | "replay";       // replayTimeline, checkpointDiff, executionTrace

/** Map query categories to lanes */
export const CATEGORY_LANE_MAP: ReadonlyMap<QueryIntent["category"], WorkboardLane> = new Map([
  ["impact", "analysis"],
  ["slice", "analysis"],
  ["callGraph", "analysis"],
  ["typeHierarchy", "analysis"],
  ["symbolGraph", "analysis"],
  ["taintFindings", "security"],
  ["sourceSinkPaths", "security"],
  ["securitySummary", "security"],
  ["securityDelta", "security"],
  ["cloneResults", "quality"],
  ["metrics", "quality"],
  ["deadCode", "quality"],
  ["complexityDelta", "quality"],
  ["reviewEvidence", "review"],
  ["impactDelta", "review"],
  ["serviceGraph", "architecture"],
  ["dependencyGraph", "architecture"],
  ["architectureViolations", "architecture"],
  ["replayTimeline", "replay"],
  ["checkpointDiff", "replay"],
  ["executionTrace", "replay"],
]);

/** Get lane for a query category */
export function getLane(category: QueryIntent["category"]): WorkboardLane {
  const lane = CATEGORY_LANE_MAP.get(category);
  if (!lane) {
    throw new Error(`Unknown category: ${category}`);
  }
  return lane;
}

/** Job entry with lane classification */
export interface WorkboardEntry {
  readonly job: QueryJob;
  readonly category: QueryIntent["category"];
  readonly lane: WorkboardLane;
  readonly enqueuedAt: number;
}

/** Workboard state — jobs organized by lane */
export interface WorkboardState {
  readonly lanes: ReadonlyMap<WorkboardLane, readonly WorkboardEntry[]>;
  readonly totalJobs: number;
  readonly runningByLane: ReadonlyMap<WorkboardLane, number>;
}

/** All lane names */
const ALL_LANES: WorkboardLane[] = ["analysis", "security", "quality", "review", "architecture", "replay"];

/** Create an empty workboard */
export function createWorkboard(): WorkboardState {
  const lanes = new Map<WorkboardLane, readonly WorkboardEntry[]>();
  const runningByLane = new Map<WorkboardLane, number>();
  for (const lane of ALL_LANES) {
    lanes.set(lane, []);
    runningByLane.set(lane, 0);
  }
  return { lanes, totalJobs: 0, runningByLane };
}

/** Add a job to the workboard */
export function addToWorkboard(
  state: WorkboardState,
  job: QueryJob,
  category: QueryIntent["category"],
): WorkboardState {
  const lane = getLane(category);
  const entry: WorkboardEntry = { job, category, lane, enqueuedAt: Date.now() };

  const existingEntries = state.lanes.get(lane) ?? [];
  const newLanes = new Map(state.lanes);
  newLanes.set(lane, [...existingEntries, entry]);

  const newRunning = new Map(state.runningByLane);
  if (job.status === "running") {
    newRunning.set(lane, (newRunning.get(lane) ?? 0) + 1);
  }

  return {
    lanes: newLanes,
    totalJobs: state.totalJobs + 1,
    runningByLane: newRunning,
  };
}

/** Get all entries for a specific lane */
export function getLaneEntries(state: WorkboardState, lane: WorkboardLane): readonly WorkboardEntry[] {
  return state.lanes.get(lane) ?? [];
}

/** Get summary stats per lane */
export function getLaneSummary(state: WorkboardState): ReadonlyMap<WorkboardLane, { total: number; running: number; completed: number; failed: number }> {
  const summary = new Map<WorkboardLane, { total: number; running: number; completed: number; failed: number }>();
  for (const [lane, entries] of state.lanes) {
    summary.set(lane, {
      total: entries.length,
      running: entries.filter(e => e.job.status === "running").length,
      completed: entries.filter(e => e.job.status === "completed").length,
      failed: entries.filter(e => e.job.status === "failed").length,
    });
  }
  return summary;
}
