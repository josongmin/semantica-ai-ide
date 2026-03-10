import React from "react";
import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { setUsageStatsAtom } from "../../../features/usage-dashboard";
import { usageDashboardPanelVisibleAtom } from "../../../shared/lib/atoms/bottomSheetAtoms";
import {
  createUsageModelBreakdown,
  createUsageStats,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import { UsageDashboard } from "../UsageDashboard";
beforeEach(() => {
  resetIdCounter();
});

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  store.set(usageDashboardPanelVisibleAtom, true);
  setup?.(store);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("UsageDashboard", () => {
  it("renders nothing when no usage data and panel is visible", () => {
    renderWithStore(<UsageDashboard />);
    expect(screen.queryByTestId("usage-dashboard")).not.toBeInTheDocument();
  });

  it("renders header with Usage Dashboard title", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(setUsageStatsAtom, createUsageStats());
    });

    expect(screen.getByText("Usage Dashboard")).toBeInTheDocument();
  });

  it("renders all 4 summary cards", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(
        setUsageStatsAtom,
        createUsageStats({
          total_sessions: 10,
          total_cost_usd: 5.0,
          total_tokens: 500_000,
        }),
      );
    });

    expect(screen.getByTestId("summary-card-total-sessions")).toBeInTheDocument();
    expect(screen.getByTestId("summary-card-total-cost")).toBeInTheDocument();
    expect(screen.getByTestId("summary-card-total-tokens")).toBeInTheDocument();
    expect(screen.getByTestId("summary-card-avg-cost/session")).toBeInTheDocument();
  });

  it("displays correct session count", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(setUsageStatsAtom, createUsageStats({ total_sessions: 42 }));
    });

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("displays formatted cost", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(setUsageStatsAtom, createUsageStats({ total_cost_usd: 12.345 }));
    });

    expect(screen.getByText("$12.35")).toBeInTheDocument();
  });

  it("displays formatted tokens with K suffix", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(setUsageStatsAtom, createUsageStats({ total_tokens: 250_000 }));
    });

    expect(screen.getByText("250.0K")).toBeInTheDocument();
  });

  it("displays formatted tokens with M suffix for millions", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(setUsageStatsAtom, createUsageStats({ total_tokens: 2_500_000 }));
    });

    expect(screen.getByText("2.5M")).toBeInTheDocument();
  });

  it("displays average cost per session", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(
        setUsageStatsAtom,
        createUsageStats({
          total_sessions: 4,
          total_cost_usd: 2.0,
          per_model: [],
        }),
      );
    });

    // With empty per_model, no model bars show $0.50, so no ambiguity
    const avgCard = screen.getByTestId("summary-card-avg-cost/session");
    expect(avgCard).toHaveTextContent("$0.50");
  });

  it("renders per-model breakdown section", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(
        setUsageStatsAtom,
        createUsageStats({
          per_model: [
            createUsageModelBreakdown({ model: "claude-opus-4-6", tokens: 150_000, cost_usd: 1.0 }),
            createUsageModelBreakdown({ model: "claude-sonnet-4", tokens: 100_000, cost_usd: 0.5 }),
          ],
        }),
      );
    });

    expect(screen.getByTestId("model-breakdown")).toBeInTheDocument();
    expect(screen.getByText("Per-Model Breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("model-bar-claude-opus-4-6")).toBeInTheDocument();
    expect(screen.getByTestId("model-bar-claude-sonnet-4")).toBeInTheDocument();
  });

  it("models are sorted by tokens descending", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(
        setUsageStatsAtom,
        createUsageStats({
          per_model: [
            createUsageModelBreakdown({ model: "low-usage", tokens: 10_000 }),
            createUsageModelBreakdown({ model: "high-usage", tokens: 500_000 }),
            createUsageModelBreakdown({ model: "mid-usage", tokens: 100_000 }),
          ],
        }),
      );
    });

    const bars = screen.getAllByTestId(/^model-bar-/);
    expect(bars[0]?.getAttribute("data-testid")).toBe("model-bar-high-usage");
    expect(bars[1]?.getAttribute("data-testid")).toBe("model-bar-mid-usage");
    expect(bars[2]?.getAttribute("data-testid")).toBe("model-bar-low-usage");
  });

  it("hides per-model breakdown when no models", () => {
    renderWithStore(<UsageDashboard />, (store) => {
      store.set(setUsageStatsAtom, createUsageStats({ per_model: [] }));
    });

    expect(screen.queryByTestId("model-breakdown")).not.toBeInTheDocument();
  });

  it("applies className prop", () => {
    renderWithStore(<UsageDashboard className="my-custom-class" />, (store) => {
      store.set(setUsageStatsAtom, createUsageStats());
    });

    expect(screen.getByTestId("usage-dashboard").className).toContain("my-custom-class");
  });
});
