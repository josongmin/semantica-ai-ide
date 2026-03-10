import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils";
import { compactionEventsAtom } from "../../../entities/compaction-history";
import { compactionPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { createCompactionEvent, resetIdCounter } from "../../../shared/lib/mocks";
import { CompactionHistoryPanel } from "../CompactionHistoryPanel";

beforeEach(() => resetIdCounter());

describe("CompactionHistoryPanel", () => {
  it("renders nothing when no compaction events exist", () => {
    const { container } = renderWithAtoms(<CompactionHistoryPanel />, {
      initialValues: [[compactionEventsAtom, []], [compactionPanelVisibleAtom, true]],
    });
    expect(container.firstChild).toBeNull();
  });

  it("renders compaction events with summaries", () => {
    const events = [
      createCompactionEvent({
        id: "c_1",
        summary: "Compacted conversation history",
        tokens_before: 100_000,
        tokens_after: 60_000,
        timestamp_ms: 1700000000000,
      }),
      createCompactionEvent({
        id: "c_2",
        summary: "Removed stale tool outputs",
        tokens_before: 80_000,
        tokens_after: 50_000,
        timestamp_ms: 1700001000000,
      }),
    ];

    renderWithAtoms(<CompactionHistoryPanel />, {
      initialValues: [[compactionEventsAtom, events], [compactionPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("compaction-history-panel")).toBeInTheDocument();
    expect(screen.getByText("Compacted conversation history")).toBeInTheDocument();
    expect(screen.getByText("Removed stale tool outputs")).toBeInTheDocument();
  });

  it("displays the correct compaction count in the summary banner", () => {
    const events = [
      createCompactionEvent({ id: "c_1" }),
      createCompactionEvent({ id: "c_2" }),
      createCompactionEvent({ id: "c_3" }),
    ];

    renderWithAtoms(<CompactionHistoryPanel />, {
      initialValues: [[compactionEventsAtom, events], [compactionPanelVisibleAtom, true]],
    });

    expect(screen.getByText("3 compactions")).toBeInTheDocument();
  });

  it("displays singular label for a single compaction", () => {
    const events = [createCompactionEvent({ id: "c_1" })];

    renderWithAtoms(<CompactionHistoryPanel />, {
      initialValues: [[compactionEventsAtom, events], [compactionPanelVisibleAtom, true]],
    });

    expect(screen.getByText("1 compaction")).toBeInTheDocument();
  });

  it("shows total tokens saved in the summary", () => {
    const events = [
      createCompactionEvent({
        id: "c_1",
        tokens_before: 100_000,
        tokens_after: 60_000,
      }),
      createCompactionEvent({
        id: "c_2",
        tokens_before: 80_000,
        tokens_after: 50_000,
      }),
    ];

    renderWithAtoms(<CompactionHistoryPanel />, {
      initialValues: [[compactionEventsAtom, events], [compactionPanelVisibleAtom, true]],
    });

    // 40_000 + 30_000 = 70_000 → "70.0K tokens reclaimed"
    expect(screen.getByText("70.0K tokens reclaimed")).toBeInTheDocument();
  });

  it("shows token savings per compaction row", () => {
    const events = [
      createCompactionEvent({
        id: "c_1",
        tokens_before: 100_000,
        tokens_after: 60_000,
      }),
    ];

    renderWithAtoms(<CompactionHistoryPanel />, {
      initialValues: [[compactionEventsAtom, events], [compactionPanelVisibleAtom, true]],
    });

    expect(screen.getByText("100.0K → 60.0K")).toBeInTheDocument();
    expect(screen.getByText("-40.0K (40%)")).toBeInTheDocument();
  });

  it("sorts events in reverse chronological order (newest first)", () => {
    const events = [
      createCompactionEvent({
        id: "c_1",
        summary: "First compaction",
        timestamp_ms: 1700000000000,
      }),
      createCompactionEvent({
        id: "c_2",
        summary: "Second compaction",
        timestamp_ms: 1700001000000,
      }),
    ];

    renderWithAtoms(<CompactionHistoryPanel />, {
      initialValues: [[compactionEventsAtom, events], [compactionPanelVisibleAtom, true]],
    });

    const rows = screen.getAllByTestId(/^compaction-row-/);
    expect(rows).toHaveLength(2);
    // Newest first
    expect(rows[0]).toHaveAttribute("data-testid", "compaction-row-c_2");
    expect(rows[1]).toHaveAttribute("data-testid", "compaction-row-c_1");
  });
});
