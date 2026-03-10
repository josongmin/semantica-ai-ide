import { createStore } from "jotai";

import { createShareLink, resetIdCounter } from "../../../shared/lib/mocks";
import type { SessionId } from "../../../shared/protocol";
import {
  resetSessionShareStoreAtom,
  setShareLinkAtom,
  shareDialogOpenAtom,
  shareLinksAtom,
} from "../model/sessionShareAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("sessionShareAtoms", () => {
  it("shareDialogOpenAtom defaults to false", () => {
    const store = createStore();
    expect(store.get(shareDialogOpenAtom)).toBe(false);
  });

  it("shareLinksAtom defaults to empty map", () => {
    const store = createStore();
    expect(store.get(shareLinksAtom).size).toBe(0);
  });

  it("setShareLinkAtom adds a link for a session", () => {
    const store = createStore();
    const sessionId = "session_1" as SessionId;
    const link = createShareLink();

    store.set(setShareLinkAtom, { session_id: sessionId, link });

    const links = store.get(shareLinksAtom);
    expect(links.size).toBe(1);
    expect(links.get(sessionId)).toEqual(link);
  });

  it("setShareLinkAtom replaces existing link for the same session", () => {
    const store = createStore();
    const sessionId = "session_1" as SessionId;
    const link1 = createShareLink({ url: "https://share.example.com/first" });
    const link2 = createShareLink({ url: "https://share.example.com/second" });

    store.set(setShareLinkAtom, { session_id: sessionId, link: link1 });
    store.set(setShareLinkAtom, { session_id: sessionId, link: link2 });

    const links = store.get(shareLinksAtom);
    expect(links.size).toBe(1);
    expect(links.get(sessionId)?.url).toBe("https://share.example.com/second");
  });

  it("setShareLinkAtom supports multiple sessions", () => {
    const store = createStore();
    const session1 = "session_1" as SessionId;
    const session2 = "session_2" as SessionId;
    const link1 = createShareLink({ url: "https://share.example.com/s1" });
    const link2 = createShareLink({ url: "https://share.example.com/s2" });

    store.set(setShareLinkAtom, { session_id: session1, link: link1 });
    store.set(setShareLinkAtom, { session_id: session2, link: link2 });

    const links = store.get(shareLinksAtom);
    expect(links.size).toBe(2);
    expect(links.get(session1)?.url).toBe("https://share.example.com/s1");
    expect(links.get(session2)?.url).toBe("https://share.example.com/s2");
  });

  it("resetSessionShareStoreAtom clears all state", () => {
    const store = createStore();
    const sessionId = "session_1" as SessionId;
    const link = createShareLink();

    store.set(shareDialogOpenAtom, true);
    store.set(setShareLinkAtom, { session_id: sessionId, link });

    expect(store.get(shareDialogOpenAtom)).toBe(true);
    expect(store.get(shareLinksAtom).size).toBe(1);

    store.set(resetSessionShareStoreAtom);

    expect(store.get(shareDialogOpenAtom)).toBe(false);
    expect(store.get(shareLinksAtom).size).toBe(0);
  });

  it("shareLinksAtom preserves immutability — old reference unchanged after set", () => {
    const store = createStore();
    const sessionId = "session_1" as SessionId;
    const link = createShareLink();

    const before = store.get(shareLinksAtom);
    store.set(setShareLinkAtom, { session_id: sessionId, link });
    const after = store.get(shareLinksAtom);

    expect(before).not.toBe(after);
    expect(before.size).toBe(0);
    expect(after.size).toBe(1);
  });
});
