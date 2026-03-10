import { createElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { timelineFilterAtom } from "~entities/timeline-event";

import { TimelineFilterBar } from "../TimelineFilterBar";

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

describe("TimelineFilterBar", () => {
  it("renders all 5 category pills", () => {
    const store = createStore();
    render(<TimelineFilterBar />, { wrapper: createWrapper(store) });

    expect(screen.getByTestId("filter-pill-files")).toBeInTheDocument();
    expect(screen.getByTestId("filter-pill-tools")).toBeInTheDocument();
    expect(screen.getByTestId("filter-pill-errors")).toBeInTheDocument();
    expect(screen.getByTestId("filter-pill-approvals")).toBeInTheDocument();
    expect(screen.getByTestId("filter-pill-phases")).toBeInTheDocument();
  });

  it("pills are not active by default", () => {
    const store = createStore();
    render(<TimelineFilterBar />, { wrapper: createWrapper(store) });

    const pill = screen.getByTestId("filter-pill-files");
    expect(pill.getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking a pill toggles the filter types", async () => {
    const store = createStore();
    render(<TimelineFilterBar />, { wrapper: createWrapper(store) });

    await userEvent.click(screen.getByTestId("filter-pill-files"));

    const filter = store.get(timelineFilterAtom);
    expect(filter.has("file_created")).toBe(true);
    expect(filter.has("file_modified")).toBe(true);
    expect(filter.has("file_deleted")).toBe(true);
  });

  it("clicking same pill twice clears the filter", async () => {
    const store = createStore();
    render(<TimelineFilterBar />, { wrapper: createWrapper(store) });

    await userEvent.click(screen.getByTestId("filter-pill-errors"));
    await userEvent.click(screen.getByTestId("filter-pill-errors"));

    const filter = store.get(timelineFilterAtom);
    expect(filter.has("error_raised")).toBe(false);
    expect(filter.has("error_recovered")).toBe(false);
  });

  it("multiple pills can be active simultaneously", async () => {
    const store = createStore();
    render(<TimelineFilterBar />, { wrapper: createWrapper(store) });

    await userEvent.click(screen.getByTestId("filter-pill-files"));
    await userEvent.click(screen.getByTestId("filter-pill-errors"));

    const filter = store.get(timelineFilterAtom);
    expect(filter.has("file_created")).toBe(true);
    expect(filter.has("error_raised")).toBe(true);
  });
});
