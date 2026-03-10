import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { browserActionsAtom, setBrowserActionsAtom } from "../../../features/browser-automation";
import { browserPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import type { BrowserAction } from "../../../shared/protocol";
import { BrowserAutomationPanel } from "../BrowserAutomationPanel";

function createAction(overrides: Partial<BrowserAction> = {}): BrowserAction {
  return {
    id: `action_${Math.random().toString(36).slice(2, 8)}`,
    type: "click",
    timestamp_ms: Date.now(),
    ...overrides,
  };
}

function renderPanel(actions: BrowserAction[] = []) {
   
  const initialValues: [any, any][] = [[browserPanelVisibleAtom, true]];
  if (actions.length > 0) initialValues.push([browserActionsAtom, actions]);
  return renderWithAtoms(<BrowserAutomationPanel />, { initialValues });
}

// ─── Tests ─────────────────────────────────────────────────
describe("BrowserAutomationPanel", () => {
  it("renders nothing when no actions", () => {
    const { container } = renderPanel();
    expect(container.querySelector("[data-testid='browser-automation-panel']")).toBeNull();
  });

  it("renders panel with actions", () => {
    renderPanel([
      createAction({ id: "a1", type: "click", target: "#btn" }),
      createAction({ id: "a2", type: "type", value: "hello" }),
    ]);

    expect(screen.getByTestId("browser-automation-panel")).toBeInTheDocument();
    expect(screen.getByText("Browser Automation")).toBeInTheDocument();
    expect(screen.getByText("2 actions")).toBeInTheDocument();
  });

  it("renders action items in timeline", () => {
    renderPanel([
      createAction({ id: "a1", type: "click", target: "#submit" }),
      createAction({ id: "a2", type: "navigate", value: "https://example.com" }),
    ]);

    expect(screen.getByTestId("browser-action-a1")).toBeInTheDocument();
    expect(screen.getByTestId("browser-action-a2")).toBeInTheDocument();
  });

  it("shows screenshot viewer when screenshot exists", () => {
    renderPanel([
      createAction({
        id: "a1",
        type: "screenshot",
        screenshot_url: "https://img.example.com/screen.png",
      }),
    ]);

    expect(screen.getByTestId("screenshot-viewer")).toBeInTheDocument();
    expect(screen.getByAltText("Browser screenshot")).toHaveAttribute(
      "src",
      "https://img.example.com/screen.png",
    );
  });

  it("does not show screenshot viewer when no screenshots", () => {
    renderPanel([createAction({ id: "a1", type: "click" })]);

    expect(screen.queryByTestId("screenshot-viewer")).not.toBeInTheDocument();
  });

  it("shows singular 'action' for single action", () => {
    renderPanel([createAction({ id: "a1" })]);
    expect(screen.getByText("1 action")).toBeInTheDocument();
  });

  it("collapse/expand toggles content visibility", async () => {
    const { user } = renderPanel([createAction({ id: "a1", type: "click" })]);

    expect(screen.getByTestId("action-timeline")).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByTestId("browser-automation-header"));
    expect(screen.queryByTestId("action-timeline")).not.toBeInTheDocument();

    // Expand
    await user.click(screen.getByTestId("browser-automation-header"));
    expect(screen.getByTestId("action-timeline")).toBeInTheDocument();
  });

  it("renders navigate actions in console log panel", () => {
    renderPanel([
      createAction({ id: "a1", type: "navigate", value: "https://example.com" }),
      createAction({ id: "a2", type: "navigate", value: "https://example.com/page" }),
    ]);

    expect(screen.getByTestId("console-log-panel")).toBeInTheDocument();
    expect(screen.getByText("Navigation Log")).toBeInTheDocument();
  });

  it("does not render console log panel when no navigate actions", () => {
    renderPanel([createAction({ id: "a1", type: "click" })]);

    expect(screen.queryByTestId("console-log-panel")).not.toBeInTheDocument();
  });

  it("updates when actions are set via store", () => {
    const { store } = renderPanel();

    expect(screen.queryByTestId("browser-automation-panel")).not.toBeInTheDocument();

    act(() => {
      store.set(setBrowserActionsAtom, [createAction({ id: "a1", type: "click", target: "#btn" })]);
    });

    expect(screen.getByTestId("browser-automation-panel")).toBeInTheDocument();
  });
});
