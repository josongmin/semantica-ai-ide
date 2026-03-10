import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setArchitectStateAtom } from "../../../features/architect-mode";
import { createArchitectState, resetIdCounter } from "../../../shared/lib/mocks";
import { ArchitectModeIndicator } from "../ArchitectModeIndicator";

beforeEach(() => {
  resetIdCounter();
});

describe("ArchitectModeIndicator", () => {
  it("renders nothing when no architect state is set", () => {
    const { container } = renderWithAtoms(<ArchitectModeIndicator />);
    expect(container.querySelector("[data-testid='architect-mode-indicator']")).toBeNull();
  });

  it("renders indicator when architect state is set", () => {
    const { store } = renderWithAtoms(<ArchitectModeIndicator />);

    act(() => {
      store.set(
        setArchitectStateAtom,
        createArchitectState({ active_role: "planner", model_name: "Claude Opus 4.6" }),
      );
    });

    expect(screen.getByTestId("architect-mode-indicator")).toBeInTheDocument();
    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByText("Claude Opus 4.6")).toBeInTheDocument();
  });

  it("shows Coder role badge", () => {
    const { store } = renderWithAtoms(<ArchitectModeIndicator />);

    act(() => {
      store.set(
        setArchitectStateAtom,
        createArchitectState({ active_role: "coder", model_name: "Sonnet" }),
      );
    });

    expect(screen.getByText("Coder")).toBeInTheDocument();
    expect(screen.getByText("Sonnet")).toBeInTheDocument();
  });

  it("shows Critic role badge", () => {
    const { store } = renderWithAtoms(<ArchitectModeIndicator />);

    act(() => {
      store.set(
        setArchitectStateAtom,
        createArchitectState({ active_role: "critic", model_name: "Opus" }),
      );
    });

    expect(screen.getByText("Critic")).toBeInTheDocument();
  });

  it("has correct aria label", () => {
    const { store } = renderWithAtoms(<ArchitectModeIndicator />);

    act(() => {
      store.set(
        setArchitectStateAtom,
        createArchitectState({ active_role: "planner", model_name: "Opus" }),
      );
    });

    expect(screen.getByLabelText("Architect mode: Planner using Opus")).toBeInTheDocument();
  });

  it("updates when role changes", () => {
    const { store } = renderWithAtoms(<ArchitectModeIndicator />);

    act(() => {
      store.set(
        setArchitectStateAtom,
        createArchitectState({ active_role: "planner", model_name: "Opus" }),
      );
    });

    expect(screen.getByText("Planner")).toBeInTheDocument();

    act(() => {
      store.set(
        setArchitectStateAtom,
        createArchitectState({ active_role: "coder", model_name: "Sonnet" }),
      );
    });

    expect(screen.getByText("Coder")).toBeInTheDocument();
    expect(screen.getByText("Sonnet")).toBeInTheDocument();
  });
});
