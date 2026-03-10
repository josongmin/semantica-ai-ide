import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { setGanttEntriesAtom } from "../../../features/gantt-timeline";
import { createGanttEntry, resetIdCounter } from "../../../shared/lib/mocks";
import { GanttTimeline } from "../GanttTimeline";

beforeEach(() => {
  resetIdCounter();
});

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("GanttTimeline", () => {
  it("returns null when no entries", () => {
    const { container } = renderWithStore(<GanttTimeline />);

    expect(container.firstChild).toBeNull();
  });

  it("renders header with tool count", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [
        createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100 }),
        createGanttEntry({ id: "g2", start_ms: 50, end_ms: 200 }),
      ]);
    });

    expect(screen.getByText("Tool Execution Timeline")).toBeInTheDocument();
    expect(screen.getByText("(2 tools)")).toBeInTheDocument();
  });

  it("renders singular tool count", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100 })]);
    });

    expect(screen.getByText("(1 tool)")).toBeInTheDocument();
  });

  it("renders Gantt bars for each entry", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [
        createGanttEntry({
          id: "g1",
          tool_name: "read_file",
          start_ms: 0,
          end_ms: 100,
          tool_type: "read",
        }),
        createGanttEntry({
          id: "g2",
          tool_name: "write_file",
          start_ms: 50,
          end_ms: 200,
          tool_type: "write",
        }),
        createGanttEntry({
          id: "g3",
          tool_name: "bash",
          start_ms: 200,
          end_ms: 500,
          tool_type: "bash",
        }),
      ]);
    });

    expect(screen.getByTestId("gantt-bar-g1")).toBeInTheDocument();
    expect(screen.getByTestId("gantt-bar-g2")).toBeInTheDocument();
    expect(screen.getByTestId("gantt-bar-g3")).toBeInTheDocument();
  });

  it("renders the chart container", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [createGanttEntry({ id: "g1", start_ms: 0, end_ms: 1000 })]);
    });

    expect(screen.getByTestId("gantt-chart")).toBeInTheDocument();
  });

  it("renders lane containers for parallel executions", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      // Two overlapping entries should get separate lanes
      store.set(setGanttEntriesAtom, [
        createGanttEntry({ id: "g1", start_ms: 0, end_ms: 200 }),
        createGanttEntry({ id: "g2", start_ms: 50, end_ms: 150 }),
      ]);
    });

    expect(screen.getByTestId("gantt-lane-0")).toBeInTheDocument();
    expect(screen.getByTestId("gantt-lane-1")).toBeInTheDocument();
  });

  it("non-overlapping entries share a lane", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [
        createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100 }),
        createGanttEntry({ id: "g2", start_ms: 100, end_ms: 200 }),
      ]);
    });

    // Both should be in lane 0 since they don't overlap
    expect(screen.getByTestId("gantt-lane-0")).toBeInTheDocument();
    expect(screen.queryByTestId("gantt-lane-1")).not.toBeInTheDocument();
  });

  it("bars have aria-labels with tool name, duration, and status", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [
        createGanttEntry({
          id: "g1",
          tool_name: "read_file",
          start_ms: 0,
          end_ms: 500,
          status: "success",
        }),
      ]);
    });

    expect(screen.getByLabelText("read_file: 500ms, success")).toBeInTheDocument();
  });

  it("renders legend with all tool type colors", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100 })]);
    });

    expect(screen.getByTestId("gantt-legend")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByText("Write")).toBeInTheDocument();
    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("displays total duration", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [
        createGanttEntry({ id: "g1", start_ms: 0, end_ms: 500 }),
        createGanttEntry({ id: "g2", start_ms: 200, end_ms: 2500 }),
      ]);
    });

    expect(screen.getByText("Total: 2.5s")).toBeInTheDocument();
  });

  it("hover on bar adds highlight", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100 })]);
    });

    const bar = screen.getByTestId("gantt-bar-g1");
    fireEvent.mouseEnter(bar);
    // Hovered bar should have the focus ring class
    expect(bar.className).toContain("ring-1");

    fireEvent.mouseLeave(bar);
    // After leaving, the focus ring should be removed
    expect(bar.className).not.toContain("ring-vsc-focus");
  });

  it("renders error bars with error styling", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      store.set(setGanttEntriesAtom, [
        createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100, status: "error" }),
      ]);
    });

    const bar = screen.getByTestId("gantt-bar-g1");
    expect(bar.className).toContain("ring-vsc-error");
  });

  it("applies className prop", () => {
    renderWithStore(<GanttTimeline className="my-class" />, (store) => {
      store.set(setGanttEntriesAtom, [createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100 })]);
    });

    expect(screen.getByTestId("gantt-timeline").className).toContain("my-class");
  });

  it("handles many entries (stress test with 50 entries)", () => {
    renderWithStore(<GanttTimeline />, (store) => {
      const entries = Array.from({ length: 50 }, (_, i) =>
        createGanttEntry({
          id: `g${i}`,
          start_ms: i * 100,
          end_ms: i * 100 + 150,
          tool_type: (["read", "write", "bash", "search", "other"] as const)[i % 5],
        }),
      );
      store.set(setGanttEntriesAtom, entries);
    });

    expect(screen.getByTestId("gantt-bar-g0")).toBeInTheDocument();
    expect(screen.getByTestId("gantt-bar-g49")).toBeInTheDocument();
    expect(screen.getByText("(50 tools)")).toBeInTheDocument();
  });
});
