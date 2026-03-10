import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import {
  integrationPanelOpenAtom,
  setIntegrationsAtom,
} from "../../../features/integration-status";
import { createIntegrationConnection, resetIdCounter } from "../../../shared/lib/mocks";
import { IntegrationStatusPanel } from "../IntegrationStatusPanel";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("IntegrationStatusPanel", () => {
  it("renders nothing when panel is not open", () => {
    const { container } = renderWithAtoms(<IntegrationStatusPanel />);
    expect(container.querySelector("[data-testid='integration-status-panel']")).toBeNull();
  });

  it("renders empty state when open but no integrations", () => {
    renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });
    expect(screen.getByTestId("integration-status-panel")).toBeInTheDocument();
    expect(screen.getByText("No integrations")).toBeInTheDocument();
  });

  it("renders integration rows when integrations are present", () => {
    const { store } = renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setIntegrationsAtom, [
        createIntegrationConnection({
          id: "int-1",
          platform: "slack",
          channel: "#engineering",
          status: "connected",
        }),
        createIntegrationConnection({
          id: "int-2",
          platform: "teams",
          channel: "#design",
          status: "disconnected",
        }),
      ]);
    });

    expect(screen.getByTestId("integration-row-int-1")).toBeInTheDocument();
    expect(screen.getByTestId("integration-row-int-2")).toBeInTheDocument();
    expect(screen.getByText("#engineering")).toBeInTheDocument();
    expect(screen.getByText("#design")).toBeInTheDocument();
  });

  it("shows active integration count", () => {
    const { store } = renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setIntegrationsAtom, [
        createIntegrationConnection({ id: "i1", status: "connected" }),
        createIntegrationConnection({ id: "i2", status: "syncing" }),
        createIntegrationConnection({ id: "i3", status: "disconnected" }),
      ]);
    });

    expect(screen.getByText("2 active")).toBeInTheDocument();
  });

  it("closes panel when close button is clicked", async () => {
    const { store, user } = renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });

    const closeBtn = screen.getByLabelText("Close Integrations");
    await user.click(closeBtn);

    expect(store.get(integrationPanelOpenAtom)).toBe(false);
  });

  it("sends SEND_INTEGRATION_UPDATE on send button click", async () => {
    const { store, user } = renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setIntegrationsAtom, [
        createIntegrationConnection({
          id: "int-1",
          channel: "#dev",
          status: "connected",
        }),
      ]);
    });

    const sendBtn = screen.getByLabelText("Send Update");
    await user.click(sendBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SEND_INTEGRATION_UPDATE",
      connection_id: "int-1",
      message: "",
    });
  });

  it("sends DISCONNECT_INTEGRATION on disconnect button click", async () => {
    const { store, user } = renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setIntegrationsAtom, [
        createIntegrationConnection({
          id: "int-1",
          channel: "#dev",
          status: "connected",
        }),
      ]);
    });

    const disconnectBtn = screen.getByLabelText("Disconnect #dev");
    await user.click(disconnectBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DISCONNECT_INTEGRATION",
      connection_id: "int-1",
    });
  });

  it("shows platform badges", () => {
    const { store } = renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setIntegrationsAtom, [
        createIntegrationConnection({ id: "i1", platform: "slack", channel: "#a" }),
        createIntegrationConnection({ id: "i2", platform: "teams", channel: "#b" }),
      ]);
    });

    expect(screen.getByText("Slack")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
  });

  it("does not show send button for disconnected integrations", () => {
    const { store } = renderWithAtoms(<IntegrationStatusPanel />, {
      initialValues: [[integrationPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setIntegrationsAtom, [
        createIntegrationConnection({
          id: "int-1",
          channel: "#offline",
          status: "disconnected",
        }),
      ]);
    });

    expect(screen.queryByLabelText("Send Update")).not.toBeInTheDocument();
  });
});
