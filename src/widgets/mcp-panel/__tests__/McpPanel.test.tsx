import { screen, within } from "@testing-library/react";

import { mcpServerAtomFamily, mcpServerIdsAtom } from "~entities/mcp";

import { renderWithAtoms } from "../../../../tests/utils";
import { mcpPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { McpPanel } from "../McpPanel";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

const SERVER_ID = "server_1";
const connectedServer = {
  id: SERVER_ID,
  name: "My MCP Server",
  url: "wss://example.com/mcp",
  status: "connected" as const,
  enabled: true,
  tool_count: 5,
};

describe("McpPanel", () => {
  it("returns null when panel is not visible", () => {
    const { container } = renderWithAtoms(<McpPanel />, {
      initialValues: [[mcpPanelVisibleAtom, false]],
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders panel when visible", () => {
    renderWithAtoms(<McpPanel />, {
      initialValues: [[mcpPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("mcp-panel")).toBeInTheDocument();
  });

  it("shows empty state when no servers", () => {
    renderWithAtoms(<McpPanel />, {
      initialValues: [
        [mcpPanelVisibleAtom, true],
        [mcpServerIdsAtom, []],
      ],
    });

    expect(screen.getByText("No MCP servers configured")).toBeInTheDocument();
  });

  it("renders connected server row", () => {
    renderWithAtoms(<McpPanel />, {
      initialValues: [
        [mcpPanelVisibleAtom, true],
        [mcpServerIdsAtom, [SERVER_ID]],
        [mcpServerAtomFamily(SERVER_ID), connectedServer],
      ],
    });

    expect(screen.getByText("My MCP Server")).toBeInTheDocument();
    expect(screen.getByText("5 tools")).toBeInTheDocument();
  });

  it("remove button sends REMOVE_MCP_SERVER after confirmation", async () => {
    const { user } = renderWithAtoms(<McpPanel />, {
      initialValues: [
        [mcpPanelVisibleAtom, true],
        [mcpServerIdsAtom, [SERVER_ID]],
        [mcpServerAtomFamily(SERVER_ID), connectedServer],
      ],
    });

    // Click remove — opens ConfirmDialog
    await user.click(screen.getByTestId(`remove-server-${SERVER_ID}`));
    expect(mockPostMessage).not.toHaveBeenCalled();

    // Confirm the dialog (find the button inside the dialog)
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "REMOVE_MCP_SERVER",
      server_id: SERVER_ID,
    });
  });

  it("toggle button sends TOGGLE_MCP_SERVER to disable enabled server", async () => {
    const { user } = renderWithAtoms(<McpPanel />, {
      initialValues: [
        [mcpPanelVisibleAtom, true],
        [mcpServerIdsAtom, [SERVER_ID]],
        [mcpServerAtomFamily(SERVER_ID), connectedServer],
      ],
    });

    await user.click(screen.getByTestId(`toggle-server-${SERVER_ID}`));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "TOGGLE_MCP_SERVER",
      server_id: SERVER_ID,
      enabled: false,
    });
  });

  it("shows add server form", () => {
    renderWithAtoms(<McpPanel />, {
      initialValues: [[mcpPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("add-server-form")).toBeInTheDocument();
    expect(screen.getByTestId("server-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("server-url-input")).toBeInTheDocument();
  });

  it("add server button sends ADD_MCP_SERVER", async () => {
    const { user } = renderWithAtoms(<McpPanel />, {
      initialValues: [[mcpPanelVisibleAtom, true]],
    });

    await user.type(screen.getByTestId("server-name-input"), "Test Server");
    await user.type(screen.getByTestId("server-url-input"), "wss://test.com/mcp");
    await user.click(screen.getByTestId("add-server-button"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ADD_MCP_SERVER",
      name: "Test Server",
      url: "wss://test.com/mcp",
    });
  });
});
