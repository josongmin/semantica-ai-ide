/**
 * Workboard lane-based splitting tests.
 *
 * Validates that query categories are correctly mapped to lanes,
 * and that workboard state management (add, retrieve, summarize) works.
 */

import { describe, it, expect } from "vitest";

import type { QueryIntent, QueryJob } from "../types.js";
import type { WorkboardLane } from "../workboard.js";
import {
  CATEGORY_LANE_MAP,
  getLane,
  createWorkboard,
  addToWorkboard,
  getLaneEntries,
  getLaneSummary,
} from "../workboard.js";

// ── Helpers ─────────────────────────────────────────────────

function makeJob(overrides: Partial<QueryJob> = {}): QueryJob {
  return {
    id: `qj-${Math.random().toString(36).slice(2, 8)}`,
    status: "running",
    progress: 0,
    ...overrides,
  };
}

// ── Category → Lane mapping ─────────────────────────────────

describe("CATEGORY_LANE_MAP", () => {
  it("every QueryIntent category maps to exactly one lane", () => {
    const allCategories: QueryIntent["category"][] = [
      "impact", "slice", "callGraph", "typeHierarchy", "symbolGraph",
      "taintFindings", "sourceSinkPaths", "securitySummary", "securityDelta",
      "cloneResults", "metrics", "deadCode", "complexityDelta",
      "reviewEvidence", "impactDelta",
      "serviceGraph", "dependencyGraph", "architectureViolations",
      "replayTimeline", "checkpointDiff", "executionTrace",
    ];

    for (const category of allCategories) {
      expect(CATEGORY_LANE_MAP.has(category)).toBe(true);
      expect(typeof CATEGORY_LANE_MAP.get(category)).toBe("string");
    }

    expect(CATEGORY_LANE_MAP.size).toBe(allCategories.length);
  });

  it('"analysis" lane contains impact, slice, callGraph, typeHierarchy, symbolGraph', () => {
    const expected: QueryIntent["category"][] = ["impact", "slice", "callGraph", "typeHierarchy", "symbolGraph"];
    for (const cat of expected) {
      expect(CATEGORY_LANE_MAP.get(cat)).toBe("analysis");
    }
  });

  it('"security" lane contains taintFindings, sourceSinkPaths, securitySummary, securityDelta', () => {
    const expected: QueryIntent["category"][] = ["taintFindings", "sourceSinkPaths", "securitySummary", "securityDelta"];
    for (const cat of expected) {
      expect(CATEGORY_LANE_MAP.get(cat)).toBe("security");
    }
  });

  it('"quality" lane contains cloneResults, metrics, deadCode, complexityDelta', () => {
    const expected: QueryIntent["category"][] = ["cloneResults", "metrics", "deadCode", "complexityDelta"];
    for (const cat of expected) {
      expect(CATEGORY_LANE_MAP.get(cat)).toBe("quality");
    }
  });

  it('"review" lane contains reviewEvidence, impactDelta', () => {
    const expected: QueryIntent["category"][] = ["reviewEvidence", "impactDelta"];
    for (const cat of expected) {
      expect(CATEGORY_LANE_MAP.get(cat)).toBe("review");
    }
  });

  it('"architecture" lane contains serviceGraph, dependencyGraph, architectureViolations', () => {
    const expected: QueryIntent["category"][] = ["serviceGraph", "dependencyGraph", "architectureViolations"];
    for (const cat of expected) {
      expect(CATEGORY_LANE_MAP.get(cat)).toBe("architecture");
    }
  });

  it('"replay" lane contains replayTimeline, checkpointDiff, executionTrace', () => {
    const expected: QueryIntent["category"][] = ["replayTimeline", "checkpointDiff", "executionTrace"];
    for (const cat of expected) {
      expect(CATEGORY_LANE_MAP.get(cat)).toBe("replay");
    }
  });
});

// ── getLane ──────────────────────────────────────────────────

describe("getLane", () => {
  it("returns the correct lane for a known category", () => {
    expect(getLane("impact")).toBe("analysis");
    expect(getLane("taintFindings")).toBe("security");
    expect(getLane("metrics")).toBe("quality");
    expect(getLane("reviewEvidence")).toBe("review");
    expect(getLane("serviceGraph")).toBe("architecture");
    expect(getLane("replayTimeline")).toBe("replay");
  });

  it("throws for unknown category", () => {
    expect(() => getLane("bogus" as QueryIntent["category"])).toThrow("Unknown category: bogus");
  });
});

// ── createWorkboard ─────────────────────────────────────────

describe("createWorkboard", () => {
  it("starts with 6 empty lanes", () => {
    const wb = createWorkboard();
    const expectedLanes: WorkboardLane[] = ["analysis", "security", "quality", "review", "architecture", "replay"];

    expect(wb.lanes.size).toBe(6);
    for (const lane of expectedLanes) {
      expect(wb.lanes.get(lane)).toEqual([]);
    }
  });

  it("starts with totalJobs = 0", () => {
    const wb = createWorkboard();
    expect(wb.totalJobs).toBe(0);
  });

  it("starts with all running counts at 0", () => {
    const wb = createWorkboard();
    for (const [, count] of wb.runningByLane) {
      expect(count).toBe(0);
    }
  });
});

// ── addToWorkboard ──────────────────────────────────────────

describe("addToWorkboard", () => {
  it("places job in correct lane", () => {
    let wb = createWorkboard();
    const job = makeJob();
    wb = addToWorkboard(wb, job, "taintFindings");

    const entries = wb.lanes.get("security")!;
    expect(entries).toHaveLength(1);
    expect(entries[0].job).toBe(job);
    expect(entries[0].category).toBe("taintFindings");
    expect(entries[0].lane).toBe("security");
  });

  it("increments totalJobs", () => {
    let wb = createWorkboard();
    wb = addToWorkboard(wb, makeJob(), "impact");
    expect(wb.totalJobs).toBe(1);
    wb = addToWorkboard(wb, makeJob(), "slice");
    expect(wb.totalJobs).toBe(2);
  });

  it("tracks running count per lane", () => {
    let wb = createWorkboard();
    wb = addToWorkboard(wb, makeJob({ status: "running" }), "impact");
    wb = addToWorkboard(wb, makeJob({ status: "running" }), "callGraph");
    wb = addToWorkboard(wb, makeJob({ status: "completed" }), "slice");

    expect(wb.runningByLane.get("analysis")).toBe(2);
  });

  it("does not increment running count for completed jobs", () => {
    let wb = createWorkboard();
    wb = addToWorkboard(wb, makeJob({ status: "completed" }), "metrics");
    expect(wb.runningByLane.get("quality")).toBe(0);
  });

  it("does not increment running count for failed jobs", () => {
    let wb = createWorkboard();
    wb = addToWorkboard(wb, makeJob({ status: "failed" }), "deadCode");
    expect(wb.runningByLane.get("quality")).toBe(0);
  });

  it("jobs in different categories but same lane appear together", () => {
    let wb = createWorkboard();
    const j1 = makeJob();
    const j2 = makeJob();
    const j3 = makeJob();
    wb = addToWorkboard(wb, j1, "impact");
    wb = addToWorkboard(wb, j2, "callGraph");
    wb = addToWorkboard(wb, j3, "symbolGraph");

    const entries = wb.lanes.get("analysis")!;
    expect(entries).toHaveLength(3);
    expect(entries[0].category).toBe("impact");
    expect(entries[1].category).toBe("callGraph");
    expect(entries[2].category).toBe("symbolGraph");
  });

  it("does not mutate original state (immutable update)", () => {
    const wb1 = createWorkboard();
    const wb2 = addToWorkboard(wb1, makeJob(), "impact");

    expect(wb1.totalJobs).toBe(0);
    expect(wb1.lanes.get("analysis")).toEqual([]);
    expect(wb2.totalJobs).toBe(1);
  });
});

// ── getLaneEntries ───────────────────────────────────────────

describe("getLaneEntries", () => {
  it("returns empty array for lane with no jobs", () => {
    const wb = createWorkboard();
    expect(getLaneEntries(wb, "replay")).toEqual([]);
  });

  it("returns correct entries after adding multiple jobs", () => {
    let wb = createWorkboard();
    const j1 = makeJob();
    const j2 = makeJob();
    wb = addToWorkboard(wb, j1, "taintFindings");
    wb = addToWorkboard(wb, j2, "securitySummary");

    const entries = getLaneEntries(wb, "security");
    expect(entries).toHaveLength(2);
    expect(entries[0].job).toBe(j1);
    expect(entries[0].category).toBe("taintFindings");
    expect(entries[1].job).toBe(j2);
    expect(entries[1].category).toBe("securitySummary");
  });

  it("does not return entries from other lanes", () => {
    let wb = createWorkboard();
    wb = addToWorkboard(wb, makeJob(), "impact");
    wb = addToWorkboard(wb, makeJob(), "taintFindings");

    expect(getLaneEntries(wb, "analysis")).toHaveLength(1);
    expect(getLaneEntries(wb, "security")).toHaveLength(1);
    expect(getLaneEntries(wb, "quality")).toHaveLength(0);
  });
});

// ── getLaneSummary ───────────────────────────────────────────

describe("getLaneSummary", () => {
  it("counts running/completed/failed correctly", () => {
    let wb = createWorkboard();
    wb = addToWorkboard(wb, makeJob({ status: "running" }), "impact");
    wb = addToWorkboard(wb, makeJob({ status: "running" }), "slice");
    wb = addToWorkboard(wb, makeJob({ status: "completed" }), "callGraph");
    wb = addToWorkboard(wb, makeJob({ status: "failed" }), "typeHierarchy");

    const summary = getLaneSummary(wb);
    const analysis = summary.get("analysis")!;

    expect(analysis.total).toBe(4);
    expect(analysis.running).toBe(2);
    expect(analysis.completed).toBe(1);
    expect(analysis.failed).toBe(1);
  });

  it("returns zeroes for empty lanes", () => {
    const wb = createWorkboard();
    const summary = getLaneSummary(wb);

    for (const [, stats] of summary) {
      expect(stats.total).toBe(0);
      expect(stats.running).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    }
  });

  it("summarizes multiple lanes independently", () => {
    let wb = createWorkboard();
    wb = addToWorkboard(wb, makeJob({ status: "completed" }), "metrics");
    wb = addToWorkboard(wb, makeJob({ status: "running" }), "taintFindings");
    wb = addToWorkboard(wb, makeJob({ status: "failed" }), "taintFindings");

    const summary = getLaneSummary(wb);

    const quality = summary.get("quality")!;
    expect(quality.total).toBe(1);
    expect(quality.completed).toBe(1);

    const security = summary.get("security")!;
    expect(security.total).toBe(2);
    expect(security.running).toBe(1);
    expect(security.failed).toBe(1);
  });
});
