import { screen } from "@testing-library/react";

import { agentInstanceAtomFamily, agentInstanceIdsAtom } from "~entities/agent-instance";
import { gitCommitsAtom } from "~entities/git-history";

import { renderWithAtoms } from "../../../../tests/utils";
import { activeFeatureSheetAtom } from "../../../shared/lib";
import { FeatureBar } from "../FeatureBar";

/** Only writable (non-derived) atoms — safe for initialValues */
 
const defaults = (): [any, any][] => [
  [agentInstanceIdsAtom, []],
  [gitCommitsAtom, []],
];

const AGENT = {
  id: "a1",
  label: "T",
  status: "running" as const,
  progress: 0,
  model_id: "m",
  created_at_ms: 0,
};

const COMMIT = { hash: "abc", message: "init", timestamp_ms: 0, author: "me" };

describe("FeatureBar", () => {
  it("renders toolbar when no feature has data (always visible)", () => {
    renderWithAtoms(<FeatureBar />, {
      initialValues: defaults(),
    });
    expect(screen.getByTestId("feature-bar")).toBeInTheDocument();
  });

  it("renders toolbar when agents exist", () => {
    renderWithAtoms(<FeatureBar />, {
      initialValues: [
        ...defaults(),
        [agentInstanceIdsAtom, ["a1"]],
        [agentInstanceAtomFamily("a1"), AGENT],
      ],
    });
    expect(screen.getByTestId("feature-bar")).toBeInTheDocument();
  });

  it("renders all 8 sheet feature buttons", () => {
    renderWithAtoms(<FeatureBar />, {
      initialValues: defaults(),
    });
    expect(screen.getByTestId("feature-btn-agents")).toBeInTheDocument();
    expect(screen.getByTestId("feature-btn-search")).toBeInTheDocument();
    expect(screen.getByTestId("feature-btn-git")).toBeInTheDocument();
    expect(screen.getByTestId("feature-btn-compact")).toBeInTheDocument();
    expect(screen.getByTestId("feature-btn-wiki")).toBeInTheDocument();
    expect(screen.getByTestId("feature-btn-preview")).toBeInTheDocument();
    expect(screen.getByTestId("feature-btn-snapshots")).toBeInTheDocument();
    expect(screen.getByTestId("feature-btn-notes")).toBeInTheDocument();
  });

  it("toggles agents sheet on click", async () => {
    const { user, store } = renderWithAtoms(<FeatureBar />, {
      initialValues: [...defaults(), [activeFeatureSheetAtom, null]],
    });
    await user.click(screen.getByTestId("feature-btn-agents"));
    expect(store.get(activeFeatureSheetAtom)).toBe("agents");
  });

  it("toggles search sheet on click", async () => {
    const { user, store } = renderWithAtoms(<FeatureBar />, {
      initialValues: [...defaults(), [activeFeatureSheetAtom, null]],
    });
    await user.click(screen.getByTestId("feature-btn-search"));
    expect(store.get(activeFeatureSheetAtom)).toBe("search");
  });

  it("toggles git sheet on click", async () => {
    const { user, store } = renderWithAtoms(<FeatureBar />, {
      initialValues: [...defaults(), [activeFeatureSheetAtom, null]],
    });
    await user.click(screen.getByTestId("feature-btn-git"));
    expect(store.get(activeFeatureSheetAtom)).toBe("git");
  });

  it("clicking active sheet closes it (toggles off)", async () => {
    const { user, store } = renderWithAtoms(<FeatureBar />, {
      initialValues: [...defaults(), [activeFeatureSheetAtom, "agents"]],
    });
    await user.click(screen.getByTestId("feature-btn-agents"));
    expect(store.get(activeFeatureSheetAtom)).toBeNull();
  });

  it("shows badge indicator for running agents", () => {
    renderWithAtoms(<FeatureBar />, {
      initialValues: [
        ...defaults(),
        [agentInstanceIdsAtom, ["a1"]],
        [agentInstanceAtomFamily("a1"), AGENT],
      ],
    });
    const agentBtn = screen.getByTestId("feature-btn-agents");
    const badge = agentBtn.querySelector("[data-testid='feature-badge']");
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe("1");
  });

  it("shows dot indicator for git commits", () => {
    renderWithAtoms(<FeatureBar />, {
      initialValues: [...defaults(), [gitCommitsAtom, [COMMIT]]],
    });
    const gitBtn = screen.getByTestId("feature-btn-git");
    expect(gitBtn.querySelector("[data-testid='feature-dot']")).toBeInTheDocument();
  });

  it("applies active styling to toggled-on sheet", () => {
    renderWithAtoms(<FeatureBar />, {
      initialValues: [...defaults(), [activeFeatureSheetAtom, "agents"]],
    });
    const agentsBtn = screen.getByTestId("feature-btn-agents");
    expect(agentsBtn.className).toContain("bg-vsc-list-active");
  });
});
