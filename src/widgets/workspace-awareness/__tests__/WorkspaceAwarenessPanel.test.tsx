import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertFileChangeAtom } from "~entities/diff";
import { turnOrderAtom } from "~entities/message/turns";
import { toolCallAtomFamily, toolCallIdsByTurnAtom } from "~entities/tool-call";

import { workspaceAwarenessPanelVisibleAtom } from "../../../shared/lib/atoms/inspectionPanelAtoms";
import { createFileChange, createToolCall } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { WorkspaceAwarenessPanel } from "../WorkspaceAwarenessPanel";

function renderPanel(setup?: (store: ReturnType<typeof createStore>) => void) {
  const store = createStore();
  setup?.(store);
  const result = render(
    <Provider store={store}>
      <WorkspaceAwarenessPanel />
    </Provider>,
  );
  return { ...result, store };
}

describe("WorkspaceAwarenessPanel", () => {
  it("renders nothing when not visible", () => {
    const { container } = renderPanel();
    // Default is not visible
    expect(container.children).toHaveLength(0);
  });

  it("renders panel when visible", () => {
    renderPanel((store) => {
      store.set(workspaceAwarenessPanelVisibleAtom, true);
    });
    expect(screen.getByRole("region", { name: /workspace/i })).toBeInTheDocument();
  });

  it("shows empty state when no files", () => {
    renderPanel((store) => {
      store.set(workspaceAwarenessPanelVisibleAtom, true);
    });
    expect(screen.getByText("No files touched yet")).toBeInTheDocument();
  });

  it("shows Workspace label", () => {
    renderPanel((store) => {
      store.set(workspaceAwarenessPanelVisibleAtom, true);
    });
    expect(screen.getByText("Workspace")).toBeInTheDocument();
  });

  it("shows total count badge when files exist", () => {
    const turnId = "turn_1" as TurnId;
    renderPanel((store) => {
      store.set(workspaceAwarenessPanelVisibleAtom, true);
      store.set(turnOrderAtom, [turnId]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/a.ts", turn_id: turnId, status: "modified" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/b.ts", turn_id: turnId, status: "added" }),
      );
    });
    // Badge shows total count "2" and each group shows its own count "1"
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders file groups with action labels", () => {
    const turnId = "turn_1" as TurnId;
    renderPanel((store) => {
      store.set(workspaceAwarenessPanelVisibleAtom, true);
      store.set(turnOrderAtom, [turnId]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/new.ts", turn_id: turnId, status: "added" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turnId, status: "modified" }),
      );
    });

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Modified")).toBeInTheDocument();
  });

  it("renders file rows with file names", () => {
    const turnId = "turn_1" as TurnId;
    renderPanel((store) => {
      store.set(workspaceAwarenessPanelVisibleAtom, true);
      store.set(turnOrderAtom, [turnId]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/components/Button.tsx",
          turn_id: turnId,
          status: "modified",
        }),
      );
    });

    expect(screen.getByText("Button.tsx")).toBeInTheDocument();
  });

  it("renders read files from tool calls", () => {
    const turnId = "turn_1" as TurnId;
    renderPanel((store) => {
      store.set(workspaceAwarenessPanelVisibleAtom, true);
      store.set(turnOrderAtom, [turnId]);

      const tc1 = createToolCall({
        id: "tc_1",
        turn_id: turnId,
        tool_name: "read_file",
        category: "read",
        args_summary: "src/a.ts",
      });
      const tc2 = createToolCall({
        id: "tc_2",
        turn_id: turnId,
        tool_name: "read_file",
        category: "read",
        args_summary: "src/b.py",
      });
      store.set(toolCallAtomFamily("tc_1"), tc1);
      store.set(toolCallAtomFamily("tc_2"), tc2);
      store.set(toolCallIdsByTurnAtom, { [turnId]: ["tc_1", "tc_2"] });
    });

    expect(screen.getByText("a.ts")).toBeInTheDocument();
    expect(screen.getByText("b.py")).toBeInTheDocument();
  });
});
