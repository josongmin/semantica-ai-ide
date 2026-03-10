import { createStore } from "jotai";

import { createLinkedTicket, resetIdCounter } from "../../../shared/lib/mocks";
import {
  hasLinkedTicketAtom,
  linkedTicketAtom,
  resetTicketLinkStoreAtom,
  setLinkedTicketAtom,
  ticketSearchDialogOpenAtom,
} from "../model/ticketLinkAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("ticketLinkAtoms", () => {
  it("starts with no linked ticket and closed dialog", () => {
    const store = createStore();
    expect(store.get(linkedTicketAtom)).toBeNull();
    expect(store.get(ticketSearchDialogOpenAtom)).toBe(false);
    expect(store.get(hasLinkedTicketAtom)).toBe(false);
  });

  it("setLinkedTicketAtom sets the ticket", () => {
    const store = createStore();
    const ticket = createLinkedTicket({ id: "t-1", key: "ENG-42", title: "Fix auth" });

    store.set(setLinkedTicketAtom, ticket);

    expect(store.get(linkedTicketAtom)).toEqual(ticket);
    expect(store.get(hasLinkedTicketAtom)).toBe(true);
  });

  it("setLinkedTicketAtom can clear the ticket with null", () => {
    const store = createStore();
    store.set(setLinkedTicketAtom, createLinkedTicket({ id: "t-1" }));
    expect(store.get(hasLinkedTicketAtom)).toBe(true);

    store.set(setLinkedTicketAtom, null);
    expect(store.get(linkedTicketAtom)).toBeNull();
    expect(store.get(hasLinkedTicketAtom)).toBe(false);
  });

  it("resetTicketLinkStoreAtom clears all state", () => {
    const store = createStore();
    store.set(setLinkedTicketAtom, createLinkedTicket({ id: "t-1" }));
    store.set(ticketSearchDialogOpenAtom, true);

    store.set(resetTicketLinkStoreAtom);

    expect(store.get(linkedTicketAtom)).toBeNull();
    expect(store.get(ticketSearchDialogOpenAtom)).toBe(false);
  });

  it("replacing ticket replaces the value entirely", () => {
    const store = createStore();
    const ticket1 = createLinkedTicket({ id: "t-1", key: "ENG-1" });
    const ticket2 = createLinkedTicket({ id: "t-2", key: "ENG-2" });

    store.set(setLinkedTicketAtom, ticket1);
    expect(store.get(linkedTicketAtom)!.key).toBe("ENG-1");

    store.set(setLinkedTicketAtom, ticket2);
    expect(store.get(linkedTicketAtom)!.key).toBe("ENG-2");
    expect(store.get(linkedTicketAtom)!.id).toBe("t-2");
  });

  it("supports different ticket platforms", () => {
    const store = createStore();

    store.set(setLinkedTicketAtom, createLinkedTicket({ platform: "jira" }));
    expect(store.get(linkedTicketAtom)!.platform).toBe("jira");

    store.set(setLinkedTicketAtom, createLinkedTicket({ platform: "github" }));
    expect(store.get(linkedTicketAtom)!.platform).toBe("github");

    store.set(setLinkedTicketAtom, createLinkedTicket({ platform: "linear" }));
    expect(store.get(linkedTicketAtom)!.platform).toBe("linear");
  });
});
