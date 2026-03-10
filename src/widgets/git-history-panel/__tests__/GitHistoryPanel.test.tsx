import { screen } from "@testing-library/react";

import { autoCommitEnabledAtom, gitCommitsAtom } from "~entities/git-history";

import { renderWithAtoms } from "../../../../tests/utils";
import { gitPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { createGitCommit } from "../../../shared/lib/mocks";
import { GitHistoryPanel } from "../GitHistoryPanel";

describe("GitHistoryPanel", () => {
  it("renders nothing when not visible", () => {
    const { container } = renderWithAtoms(<GitHistoryPanel />);
    expect(container.children).toHaveLength(0);
  });

  it("renders panel when visible", () => {
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [[gitPanelVisibleAtom, true]],
    });
    expect(screen.getByRole("region", { name: /git history panel/i })).toBeInTheDocument();
  });

  it("shows empty state when no commits", () => {
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [[gitPanelVisibleAtom, true]],
    });
    expect(screen.getByText("No commits yet")).toBeInTheDocument();
  });

  it("renders commit rows", () => {
    const commit1 = createGitCommit({ sha: "abc1234", message: "feat: add button" });
    const commit2 = createGitCommit({ sha: "def5678", message: "fix: typo" });
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [
        [gitPanelVisibleAtom, true],
        [gitCommitsAtom, [commit1, commit2]],
      ],
    });
    expect(screen.getByText("feat: add button")).toBeInTheDocument();
    expect(screen.getByText("fix: typo")).toBeInTheDocument();
  });

  it("shows truncated sha for each commit", () => {
    const commit = createGitCommit({ sha: "abcdef1234567890", message: "initial commit" });
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [
        [gitPanelVisibleAtom, true],
        [gitCommitsAtom, [commit]],
      ],
    });
    expect(screen.getByText("abcdef1")).toBeInTheDocument();
  });

  it("shows auto badge on auto commits", () => {
    const commit = createGitCommit({ sha: "abc1234", message: "auto commit", auto: true });
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [
        [gitPanelVisibleAtom, true],
        [gitCommitsAtom, [commit]],
      ],
    });
    expect(screen.getByText("auto")).toBeInTheDocument();
  });

  it("disables undo button when commits is empty", () => {
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [
        [gitPanelVisibleAtom, true],
        [gitCommitsAtom, []],
      ],
    });
    expect(screen.getByRole("button", { name: /undo/i })).toBeDisabled();
  });

  it("disables undo when first commit is not auto", () => {
    const commit = createGitCommit({ sha: "abc1234", message: "manual commit", auto: false });
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [
        [gitPanelVisibleAtom, true],
        [gitCommitsAtom, [commit]],
      ],
    });
    expect(screen.getByRole("button", { name: /undo/i })).toBeDisabled();
  });

  it("enables undo when first commit is auto", () => {
    const commit = createGitCommit({ sha: "abc1234", message: "auto commit", auto: true });
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [
        [gitPanelVisibleAtom, true],
        [gitCommitsAtom, [commit]],
      ],
    });
    expect(screen.getByRole("button", { name: /undo/i })).not.toBeDisabled();
  });

  it("shows auto-commit toggle button", () => {
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [[gitPanelVisibleAtom, true]],
    });
    expect(screen.getByRole("button", { name: /toggle auto-commit/i })).toBeInTheDocument();
  });

  it("shows auto-commit as On when enabled", () => {
    renderWithAtoms(<GitHistoryPanel />, {
      initialValues: [
        [gitPanelVisibleAtom, true],
        [autoCommitEnabledAtom, true],
      ],
    });
    expect(screen.getByText("Auto-commit On")).toBeInTheDocument();
  });
});
