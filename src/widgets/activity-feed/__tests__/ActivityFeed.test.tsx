import { screen } from "@testing-library/react";

import { sessionMetaAtom } from "~entities/session/state";
import { timelineEventsAtom } from "~entities/timeline-event";

import { renderWithAtoms } from "../../../../tests/utils";
import { activityFeedVisibleAtom } from "../../../shared/lib/atoms/dialogAtoms";
import { createSessionMeta, createTimelineEvent, resetIdCounter } from "../../../shared/lib/mocks";
import { ActivityFeed } from "../ActivityFeed";

beforeEach(() => resetIdCounter());

describe("ActivityFeed", () => {
  it("hidden when not visible (aria-hidden)", () => {
    renderWithAtoms(<ActivityFeed />, {
      initialValues: [
        [activityFeedVisibleAtom, false],
        [sessionMetaAtom, createSessionMeta({ status: "idle" })],
      ],
    });

    const region = screen.getByRole("region", { hidden: true });
    expect(region).toHaveAttribute("aria-hidden", "true");
  });

  it("shows events when visible", () => {
    const events = [
      createTimelineEvent({
        id: "evt_1",
        type: "tool_call_start",
        summary: "Started read_file",
        timestamp_ms: new Date("2025-01-15T10:30:00").getTime(),
      }),
      createTimelineEvent({
        id: "evt_2",
        type: "file_modified",
        summary: "Modified src/app.tsx",
        timestamp_ms: new Date("2025-01-15T10:30:05").getTime(),
      }),
    ];

    renderWithAtoms(<ActivityFeed />, {
      initialValues: [
        [activityFeedVisibleAtom, true],
        [timelineEventsAtom, events],
        [sessionMetaAtom, createSessionMeta({ status: "running" })],
      ],
    });

    expect(screen.getByText("Started read_file")).toBeInTheDocument();
    expect(screen.getByText("Modified src/app.tsx")).toBeInTheDocument();
  });

  it('empty state shows "No activity yet" when idle', () => {
    renderWithAtoms(<ActivityFeed />, {
      initialValues: [
        [activityFeedVisibleAtom, true],
        [sessionMetaAtom, createSessionMeta({ status: "idle" })],
      ],
    });

    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("running + empty shows spinner with waiting text", () => {
    renderWithAtoms(<ActivityFeed />, {
      initialValues: [
        [activityFeedVisibleAtom, true],
        [sessionMetaAtom, createSessionMeta({ status: "running" })],
      ],
    });

    expect(screen.getByText("Waiting for activity...")).toBeInTheDocument();
  });

  it("renders Activity header text", () => {
    renderWithAtoms(<ActivityFeed />, {
      initialValues: [
        [activityFeedVisibleAtom, true],
        [sessionMetaAtom, createSessionMeta({ status: "idle" })],
      ],
    });

    expect(screen.getByText("Activity")).toBeInTheDocument();
  });
});
