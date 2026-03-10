import { screen } from "@testing-library/react";

import { timelineEventsAtom } from "~entities/timeline-event";

import { renderWithAtoms } from "../../../../tests/utils";
import { focusedTurnIdAtom } from "../../../shared/lib";
import { createTimelineEvent, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { TimelineReplayBar } from "../TimelineReplayBar";

beforeEach(() => resetIdCounter());

describe("TimelineReplayBar", () => {
  it("returns null when no timeline events exist", () => {
    const { container } = renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [[timelineEventsAtom, []]],
    });

    expect(container.querySelector("[role='toolbar']")).toBeNull();
  });

  it("renders a toolbar with timeline events as dots", () => {
    const events = [
      createTimelineEvent({ id: "evt_1", type: "tool_call_start", summary: "Read file" }),
      createTimelineEvent({ id: "evt_2", type: "file_created", summary: "Created app.tsx" }),
    ];

    renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [[timelineEventsAtom, events]],
    });

    const toolbar = screen.getByRole("toolbar", { name: "Timeline replay bar" });
    expect(toolbar).toBeInTheDocument();
    expect(screen.getByTestId("timeline-replay-bar")).toBeInTheDocument();
  });

  it("renders clickable dot buttons for each event", () => {
    const events = [
      createTimelineEvent({ id: "evt_1", type: "tool_call_start", summary: "Read file" }),
      createTimelineEvent({ id: "evt_2", type: "file_created", summary: "Created app.tsx" }),
      createTimelineEvent({ id: "evt_3", type: "error_raised", summary: "Parse error" }),
    ];

    renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [[timelineEventsAtom, events]],
    });

    expect(screen.getByLabelText("Jump to: Read file")).toBeInTheDocument();
    expect(screen.getByLabelText("Jump to: Created app.tsx")).toBeInTheDocument();
    expect(screen.getByLabelText("Jump to: Parse error")).toBeInTheDocument();
  });

  it("shows event count label", () => {
    const events = [
      createTimelineEvent({ id: "evt_1" }),
      createTimelineEvent({ id: "evt_2" }),
      createTimelineEvent({ id: "evt_3" }),
    ];

    renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [[timelineEventsAtom, events]],
    });

    expect(screen.getByText("3 events")).toBeInTheDocument();
  });

  it("shows singular label for a single event", () => {
    const events = [createTimelineEvent({ id: "evt_1" })];

    renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [[timelineEventsAtom, events]],
    });

    expect(screen.getByText("1 event")).toBeInTheDocument();
  });

  it("clicking a dot sets the focused turn ID", async () => {
    const events = [
      createTimelineEvent({
        id: "evt_1",
        turn_id: "turn_42",
        type: "tool_call_start",
        summary: "Read file",
      }),
    ];

    const { store, user } = renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [[timelineEventsAtom, events]],
    });

    await user.click(screen.getByLabelText("Jump to: Read file"));

    expect(store.get(focusedTurnIdAtom)).toBe("turn_42");
  });

  it("clicking a different dot changes the focused turn ID", async () => {
    const events = [
      createTimelineEvent({
        id: "evt_1",
        turn_id: "turn_1",
        summary: "First event",
      }),
      createTimelineEvent({
        id: "evt_2",
        turn_id: "turn_2",
        summary: "Second event",
      }),
    ];

    const { store, user } = renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [[timelineEventsAtom, events]],
    });

    await user.click(screen.getByLabelText("Jump to: First event"));
    expect(store.get(focusedTurnIdAtom)).toBe("turn_1");

    await user.click(screen.getByLabelText("Jump to: Second event"));
    expect(store.get(focusedTurnIdAtom)).toBe("turn_2");
  });

  it("highlights the active dot when its turn is focused", () => {
    const events = [
      createTimelineEvent({
        id: "evt_1",
        turn_id: "turn_42",
        summary: "Active event",
      }),
      createTimelineEvent({
        id: "evt_2",
        turn_id: "turn_99",
        summary: "Inactive event",
      }),
    ];

    renderWithAtoms(<TimelineReplayBar />, {
      initialValues: [
        [timelineEventsAtom, events],
        [focusedTurnIdAtom, "turn_42" as TurnId],
      ],
    });

    const activeButton = screen.getByLabelText("Jump to: Active event");
    // Active dot should have the ring-2 ring-vsc-focus class
    expect(activeButton.className).toContain("ring-2");
    expect(activeButton.className).toContain("ring-vsc-focus");
  });
});
