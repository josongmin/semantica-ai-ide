import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setLinkedTicketAtom, ticketSearchDialogOpenAtom } from "../../../features/ticket-link";
import { ticketLinkPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { createLinkedTicket, resetIdCounter } from "../../../shared/lib/mocks";
import { TicketLinkPanel } from "../TicketLinkPanel";

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

describe("TicketLinkPanel", () => {
  it("renders the panel with no ticket linked message", () => {
    renderWithAtoms(<TicketLinkPanel />, { initialValues: [[ticketLinkPanelVisibleAtom, true]] });
    expect(screen.getByTestId("ticket-link-panel")).toBeInTheDocument();
    expect(screen.getByText("No ticket linked to this session.")).toBeInTheDocument();
  });

  it("renders linked ticket card when ticket is set", () => {
    const { store } = renderWithAtoms(<TicketLinkPanel />, { initialValues: [[ticketLinkPanelVisibleAtom, true]] });

    act(() => {
      store.set(
        setLinkedTicketAtom,
        createLinkedTicket({
          id: "t-1",
          key: "ENG-42",
          title: "Fix authentication flow",
          status: "In Progress",
          platform: "linear",
        }),
      );
    });

    expect(screen.getByTestId("linked-ticket-card")).toBeInTheDocument();
    expect(screen.getByText("ENG-42")).toBeInTheDocument();
    expect(screen.getByText("Fix authentication flow")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Linear")).toBeInTheDocument();
  });

  it("shows Link Ticket button when no ticket linked", () => {
    renderWithAtoms(<TicketLinkPanel />, { initialValues: [[ticketLinkPanelVisibleAtom, true]] });
    expect(screen.getByLabelText("Link Ticket")).toBeInTheDocument();
  });

  it("opens search dialog when Link Ticket button is clicked", async () => {
    const { user } = renderWithAtoms(<TicketLinkPanel />, { initialValues: [[ticketLinkPanelVisibleAtom, true]] });

    const linkBtn = screen.getByLabelText("Link Ticket");
    await user.click(linkBtn);

    expect(screen.getByTestId("ticket-search-dialog")).toBeInTheDocument();
  });

  it("sends LINK_TICKET message on search form submit", async () => {
    const { user } = renderWithAtoms(<TicketLinkPanel />, {
      initialValues: [[ticketSearchDialogOpenAtom, true], [ticketLinkPanelVisibleAtom, true]],
    });

    const keyInput = screen.getByLabelText("Ticket key");
    await user.type(keyInput, "ENG-99");

    const linkBtn = screen.getByText("Link");
    await user.click(linkBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "LINK_TICKET",
      ticket_key: "ENG-99",
      platform: "linear",
    });
  });

  it("sends UNLINK_TICKET when unlink button is clicked", async () => {
    const { store, user } = renderWithAtoms(<TicketLinkPanel />, { initialValues: [[ticketLinkPanelVisibleAtom, true]] });

    act(() => {
      store.set(setLinkedTicketAtom, createLinkedTicket({ id: "t-1", key: "ENG-42" }));
    });

    const unlinkBtn = screen.getByLabelText("Unlink ticket");
    await user.click(unlinkBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "UNLINK_TICKET",
      ticket_id: "t-1",
    });
  });

  it("sends SYNC_TICKET_STATUS when sync button is clicked", async () => {
    const { store, user } = renderWithAtoms(<TicketLinkPanel />, { initialValues: [[ticketLinkPanelVisibleAtom, true]] });

    act(() => {
      store.set(setLinkedTicketAtom, createLinkedTicket({ id: "t-1" }));
    });

    const syncBtn = screen.getByLabelText("Sync ticket status");
    await user.click(syncBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SYNC_TICKET_STATUS",
      ticket_id: "t-1",
    });
  });

  it("shows platform badge for different platforms", () => {
    const { store } = renderWithAtoms(<TicketLinkPanel />, { initialValues: [[ticketLinkPanelVisibleAtom, true]] });

    act(() => {
      store.set(
        setLinkedTicketAtom,
        createLinkedTicket({
          id: "t-1",
          platform: "jira",
          key: "PROJ-123",
        }),
      );
    });

    expect(screen.getByText("Jira")).toBeInTheDocument();
  });

  it("cancels search dialog", async () => {
    const { store, user } = renderWithAtoms(<TicketLinkPanel />, {
      initialValues: [[ticketSearchDialogOpenAtom, true], [ticketLinkPanelVisibleAtom, true]],
    });

    const cancelBtn = screen.getByText("Cancel");
    await user.click(cancelBtn);

    expect(store.get(ticketSearchDialogOpenAtom)).toBe(false);
  });
});
