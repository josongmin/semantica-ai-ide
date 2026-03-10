import { createStore } from "jotai";

import { resetIdCounter } from "~shared/lib/mocks";
import type { ArenaResponse, ArenaResponseId } from "~shared/protocol";

import {
  appendArenaTextAtom,
  arenaIsStreamingAtom,
  arenaModelAAtom,
  arenaModelBAtom,
  arenaResponseAtomFamily,
  arenaResponseIdsAtom,
  arenaWinnerAtom,
  resetArenaStoreAtom,
  setArenaWinnerAtom,
  slotAResponseAtom,
  slotBResponseAtom,
  upsertArenaResponseAtom,
} from "../model/atoms";

function createArenaResponse(overrides: Partial<ArenaResponse> = {}): ArenaResponse {
  return {
    id: "resp_1" as ArenaResponseId,
    slot: "A",
    model_id: "claude-opus-4-6",
    model_label: "Claude Opus 4.6",
    text: "",
    status: "streaming",
    created_at_ms: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  resetIdCounter();
});

describe("upsertArenaResponseAtom", () => {
  it("new response: updates arenaResponseIdsAtom and stores response in atomFamily", () => {
    const store = createStore();
    const response = createArenaResponse({ id: "resp_1" as ArenaResponseId });

    store.set(upsertArenaResponseAtom, response);

    expect(store.get(arenaResponseIdsAtom)).toEqual(["resp_1"]);
    expect(store.get(arenaResponseAtomFamily("resp_1"))).toEqual(response);
  });

  it("existing ID: updates response without duplicating in index", () => {
    const store = createStore();
    const resp1 = createArenaResponse({ id: "resp_1" as ArenaResponseId, text: "Hello" });
    const resp1Updated = createArenaResponse({
      id: "resp_1" as ArenaResponseId,
      text: "Hello world",
    });

    store.set(upsertArenaResponseAtom, resp1);
    store.set(upsertArenaResponseAtom, resp1Updated);

    expect(store.get(arenaResponseIdsAtom)).toEqual(["resp_1"]);
    expect(store.get(arenaResponseAtomFamily("resp_1"))?.text).toBe("Hello world");
  });

  it("stores responses for both slots", () => {
    const store = createStore();
    const respA = createArenaResponse({ id: "resp_1" as ArenaResponseId, slot: "A" });
    const respB = createArenaResponse({ id: "resp_2" as ArenaResponseId, slot: "B" });

    store.set(upsertArenaResponseAtom, respA);
    store.set(upsertArenaResponseAtom, respB);

    expect(store.get(arenaResponseIdsAtom)).toEqual(["resp_1", "resp_2"]);
  });
});

describe("appendArenaTextAtom", () => {
  it("concatenates chunk to existing response text", () => {
    const store = createStore();
    const response = createArenaResponse({ id: "resp_1" as ArenaResponseId, text: "Hello" });
    store.set(upsertArenaResponseAtom, response);

    store.set(appendArenaTextAtom, { id: "resp_1" as ArenaResponseId, chunk: " world" });

    expect(store.get(arenaResponseAtomFamily("resp_1"))?.text).toBe("Hello world");
  });

  it("no-op for empty chunk", () => {
    const store = createStore();
    const response = createArenaResponse({ id: "resp_1" as ArenaResponseId, text: "Hello" });
    store.set(upsertArenaResponseAtom, response);

    store.set(appendArenaTextAtom, { id: "resp_1" as ArenaResponseId, chunk: "" });

    expect(store.get(arenaResponseAtomFamily("resp_1"))?.text).toBe("Hello");
  });

  it("no-op for non-existent response (no throw)", () => {
    const store = createStore();

    expect(() => {
      store.set(appendArenaTextAtom, { id: "nonexistent" as ArenaResponseId, chunk: "data" });
    }).not.toThrow();
  });
});

describe("setArenaWinnerAtom", () => {
  it("sets winner to slot A", () => {
    const store = createStore();
    store.set(setArenaWinnerAtom, "A");
    expect(store.get(arenaWinnerAtom)).toBe("A");
  });

  it("sets winner to tie", () => {
    const store = createStore();
    store.set(setArenaWinnerAtom, "tie");
    expect(store.get(arenaWinnerAtom)).toBe("tie");
  });

  it("sets winner to null", () => {
    const store = createStore();
    store.set(setArenaWinnerAtom, "B");
    store.set(setArenaWinnerAtom, null);
    expect(store.get(arenaWinnerAtom)).toBeNull();
  });
});

describe("slotAResponseAtom / slotBResponseAtom", () => {
  it("slotAResponseAtom returns the response with slot === A", () => {
    const store = createStore();
    const respA = createArenaResponse({
      id: "resp_1" as ArenaResponseId,
      slot: "A",
      text: "Slot A answer",
    });
    const respB = createArenaResponse({
      id: "resp_2" as ArenaResponseId,
      slot: "B",
      text: "Slot B answer",
    });
    store.set(upsertArenaResponseAtom, respA);
    store.set(upsertArenaResponseAtom, respB);

    expect(store.get(slotAResponseAtom)?.text).toBe("Slot A answer");
  });

  it("slotBResponseAtom returns the response with slot === B", () => {
    const store = createStore();
    const respA = createArenaResponse({
      id: "resp_1" as ArenaResponseId,
      slot: "A",
      text: "Slot A answer",
    });
    const respB = createArenaResponse({
      id: "resp_2" as ArenaResponseId,
      slot: "B",
      text: "Slot B answer",
    });
    store.set(upsertArenaResponseAtom, respA);
    store.set(upsertArenaResponseAtom, respB);

    expect(store.get(slotBResponseAtom)?.text).toBe("Slot B answer");
  });

  it("returns null when no response exists for that slot", () => {
    const store = createStore();
    expect(store.get(slotAResponseAtom)).toBeNull();
    expect(store.get(slotBResponseAtom)).toBeNull();
  });
});

describe("arenaIsStreamingAtom", () => {
  it("returns true if any response has status streaming", () => {
    const store = createStore();
    store.set(
      upsertArenaResponseAtom,
      createArenaResponse({ id: "resp_1" as ArenaResponseId, slot: "A", status: "streaming" }),
    );
    store.set(
      upsertArenaResponseAtom,
      createArenaResponse({ id: "resp_2" as ArenaResponseId, slot: "B", status: "final" }),
    );

    expect(store.get(arenaIsStreamingAtom)).toBe(true);
  });

  it("returns false when all responses are final", () => {
    const store = createStore();
    store.set(
      upsertArenaResponseAtom,
      createArenaResponse({ id: "resp_1" as ArenaResponseId, slot: "A", status: "final" }),
    );
    store.set(
      upsertArenaResponseAtom,
      createArenaResponse({ id: "resp_2" as ArenaResponseId, slot: "B", status: "final" }),
    );

    expect(store.get(arenaIsStreamingAtom)).toBe(false);
  });

  it("returns false when store is empty", () => {
    const store = createStore();
    expect(store.get(arenaIsStreamingAtom)).toBe(false);
  });
});

describe("arenaModelAAtom / arenaModelBAtom", () => {
  it("default to empty string", () => {
    const store = createStore();
    expect(store.get(arenaModelAAtom)).toBe("");
    expect(store.get(arenaModelBAtom)).toBe("");
  });

  it("can be set independently", () => {
    const store = createStore();
    store.set(arenaModelAAtom, "claude-opus-4-6");
    store.set(arenaModelBAtom, "gpt-4o");

    expect(store.get(arenaModelAAtom)).toBe("claude-opus-4-6");
    expect(store.get(arenaModelBAtom)).toBe("gpt-4o");
  });
});

describe("resetArenaStoreAtom", () => {
  it("clears all arena state", () => {
    const store = createStore();
    store.set(upsertArenaResponseAtom, createArenaResponse({ id: "resp_1" as ArenaResponseId }));
    store.set(setArenaWinnerAtom, "A");
    store.set(arenaModelAAtom, "claude-opus-4-6");
    store.set(arenaModelBAtom, "gpt-4o");

    store.set(resetArenaStoreAtom);

    expect(store.get(arenaResponseIdsAtom)).toEqual([]);
    expect(store.get(arenaWinnerAtom)).toBeNull();
    expect(store.get(arenaModelAAtom)).toBe("");
    expect(store.get(arenaModelBAtom)).toBe("");
  });

  it("after reset, fresh store returns null from atomFamily", () => {
    const store = createStore();
    store.set(upsertArenaResponseAtom, createArenaResponse({ id: "resp_1" as ArenaResponseId }));
    store.set(resetArenaStoreAtom);

    const store2 = createStore();
    expect(store2.get(arenaResponseAtomFamily("resp_1"))).toBeNull();
  });
});
