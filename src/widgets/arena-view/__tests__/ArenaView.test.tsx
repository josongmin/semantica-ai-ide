import { screen } from "@testing-library/react";

import {
  arenaResponseAtomFamily,
  arenaResponseIdsAtom,
  arenaWinnerAtom,
} from "~entities/arena";

import { renderWithAtoms } from "../../../../tests/utils";
import { createArenaResponse } from "../../../shared/lib/mocks";
import type { ArenaResponseId } from "../../../shared/protocol";
import { ArenaView } from "../ArenaView";

describe("ArenaView", () => {
  it("renders two slot panels", () => {
    renderWithAtoms(<ArenaView />);
    expect(screen.getByRole("region", { name: /slot a response/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /slot b response/i })).toBeInTheDocument();
  });

  it("renders winner selection buttons", () => {
    renderWithAtoms(<ArenaView />);
    expect(screen.getByRole("button", { name: /a wins/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tie/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /b wins/i })).toBeInTheDocument();
  });

  it("disables winner buttons while streaming", () => {
    const respA = createArenaResponse({
      id: "a1" as ArenaResponseId,
      slot: "A",
      status: "streaming",
    });
    renderWithAtoms(<ArenaView />, {
      initialValues: [
        [arenaResponseIdsAtom, ["a1"]],
        [arenaResponseAtomFamily("a1"), respA],
      ],
    });
    expect(screen.getByRole("button", { name: /a wins/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /tie/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /b wins/i })).toBeDisabled();
  });

  it("enables winner buttons when not streaming", () => {
    const respA = createArenaResponse({ id: "a1" as ArenaResponseId, slot: "A", status: "final" });
    renderWithAtoms(<ArenaView />, {
      initialValues: [
        [arenaResponseIdsAtom, ["a1"]],
        [arenaResponseAtomFamily("a1"), respA],
      ],
    });
    expect(screen.getByRole("button", { name: /a wins/i })).not.toBeDisabled();
  });

  it("shows waiting state when no slot A response", () => {
    renderWithAtoms(<ArenaView />);
    const panel = screen.getByRole("region", { name: /slot a response/i });
    expect(panel).toHaveTextContent("Waiting for response");
  });

  it("renders slot A response text", () => {
    const response = createArenaResponse({
      id: "a1" as ArenaResponseId,
      slot: "A",
      text: "Hello from model A",
    });
    renderWithAtoms(<ArenaView />, {
      initialValues: [
        [arenaResponseIdsAtom, ["a1"]],
        [arenaResponseAtomFamily("a1"), response],
      ],
    });
    expect(screen.getByText("Hello from model A")).toBeInTheDocument();
  });

  it("renders slot B model label", () => {
    const response = createArenaResponse({
      id: "b1" as ArenaResponseId,
      slot: "B",
      model_label: "GPT-4o",
    });
    renderWithAtoms(<ArenaView />, {
      initialValues: [
        [arenaResponseIdsAtom, ["b1"]],
        [arenaResponseAtomFamily("b1"), response],
      ],
    });
    expect(screen.getByText("GPT-4o")).toBeInTheDocument();
  });

  it("shows winner when selected", () => {
    renderWithAtoms(<ArenaView />, {
      initialValues: [[arenaWinnerAtom, "A"]],
    });
    expect(screen.getByText(/winner/i)).toBeInTheDocument();
  });
});
