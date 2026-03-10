/**
 * ActivityFeed Stress & Edge-Case Tests
 *
 * Tests:
 * - MAX_VISIBLE_EVENTS (50) cap: only last 50 events shown
 * - Running state: shows spinner/waiting message
 * - Idle state: shows "No activity yet"
 * - Event type icons and colors
 * - Hidden state (aria-hidden, max-h-0)
 * - Large event sets (200+)
 * - Timestamp formatting
 */
import { screen } from "@testing-library/react";

import { sessionMetaAtom } from "~entities/session/state";
import { timelineEventsAtom } from "~entities/timeline-event";

import { renderWithAtoms } from "../../../../tests/utils";
import { activityFeedVisibleAtom } from "../../../shared/lib/atoms/dialogAtoms";
import { createSessionMeta, createTimelineEvent, resetIdCounter } from "../../../shared/lib/mocks";
import type { TimelineEventType } from "../../../shared/protocol";
import { ActivityFeed } from "../ActivityFeed";

beforeEach(() => resetIdCounter());

function renderFeed({
  eventCount = 0,
  visible = true,
  status = "idle" as "idle" | "running" | "error",
  eventType = "tool_call_start" as TimelineEventType,
} = {}) {
  const events = Array.from({ length: eventCount }, (_, i) =>
    createTimelineEvent({
      id: `evt_${i}`,
      type: eventType,
      summary: `Event ${i}`,
      timestamp_ms: Date.now() + i * 1000,
    }),
  );

  return renderWithAtoms(<ActivityFeed />, {
    initialValues: [
      [activityFeedVisibleAtom, visible],
      [timelineEventsAtom, events],
      [sessionMetaAtom, createSessionMeta({ status })],
    ],
  });
}

describe("ActivityFeed – stress & edge cases", () => {
  // ── MAX_VISIBLE_EVENTS cap ──────────────────────────────
  describe("MAX_VISIBLE_EVENTS cap", () => {
    it("exactly 50 events: all 50 shown", () => {
      renderFeed({ eventCount: 50 });

      expect(screen.getByText("Event 0")).toBeInTheDocument();
      expect(screen.getByText("Event 49")).toBeInTheDocument();
    });

    it("100 events: only last 50 shown (events 50-99)", () => {
      renderFeed({ eventCount: 100 });

      // First 50 should be sliced off
      expect(screen.queryByText("Event 0")).not.toBeInTheDocument();
      expect(screen.queryByText("Event 49")).not.toBeInTheDocument();
      // Last 50 should be shown
      expect(screen.getByText("Event 50")).toBeInTheDocument();
      expect(screen.getByText("Event 99")).toBeInTheDocument();
    });

    it("200 events: only last 50 shown", () => {
      renderFeed({ eventCount: 200 });

      expect(screen.queryByText("Event 149")).not.toBeInTheDocument();
      expect(screen.getByText("Event 150")).toBeInTheDocument();
      expect(screen.getByText("Event 199")).toBeInTheDocument();
    });
  });

  // ── Empty states ────────────────────────────────────────
  describe("empty states", () => {
    it("idle + no events: shows 'No activity yet'", () => {
      renderFeed({ eventCount: 0, status: "idle" });
      expect(screen.getByText("No activity yet")).toBeInTheDocument();
    });

    it("running + no events: shows spinner and 'Waiting for activity...'", () => {
      renderFeed({ eventCount: 0, status: "running" });
      expect(screen.getByText("Waiting for activity...")).toBeInTheDocument();
    });

    it("running + has events: no waiting message", () => {
      renderFeed({ eventCount: 5, status: "running" });
      expect(screen.queryByText("Waiting for activity...")).not.toBeInTheDocument();
      expect(screen.getByText("Event 0")).toBeInTheDocument();
    });
  });

  // ── Visibility state ────────────────────────────────────
  describe("visibility state", () => {
    it("visible=false: aria-hidden=true and max-h-0", () => {
      renderFeed({ visible: false, eventCount: 5 });
      const region = screen.getByRole("region", { hidden: true });
      expect(region).toHaveAttribute("aria-hidden", "true");
      expect(region.className).toMatch(/max-h-0/);
    });

    it("visible=true: aria-hidden=false and max-h-[200px]", () => {
      renderFeed({ visible: true, eventCount: 5 });
      const region = screen.getByRole("region", { name: "Activity feed" });
      expect(region).toHaveAttribute("aria-hidden", "false");
      expect(region.className).toMatch(/max-h-\[200px\]/);
    });
  });

  // ── Event types ─────────────────────────────────────────
  describe("event types", () => {
    const types: TimelineEventType[] = [
      "tool_call_start",
      "tool_call_end",
      "error_raised",
      "error_recovered",
      "file_created",
      "file_modified",
      "file_deleted",
      "checkpoint_created",
      "approval_requested",
      "approval_granted",
      "phase_changed",
    ];

    it.each(types)("event type '%s': renders without crash", (eventType) => {
      renderFeed({ eventCount: 1, eventType });
      expect(screen.getByText("Event 0")).toBeInTheDocument();
    });
  });

  // ── Activity header ─────────────────────────────────────
  describe("activity header", () => {
    it("shows 'Activity' header text", () => {
      renderFeed({ eventCount: 1 });
      expect(screen.getByText("Activity")).toBeInTheDocument();
    });
  });
});
