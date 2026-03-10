import { createStore } from "jotai";

import { turnOrderAtom } from "~entities/message/turns";
import { upsertTurnAtom } from "~entities/message/writers";
import {
  CONTEXT_THRESHOLDS,
  contextPressureLevelAtom,
  contextUsagePctAtom,
  sessionMetaAtom,
  updateSessionMetaAtom,
} from "~entities/session/state";

import { createSessionMeta, createTurn, resetIdCounter } from "../../../shared/lib/mocks";
import { estimatedRemainingTurnsAtom } from "../model/contextPressureAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("contextUsagePctAtom", () => {
  it("returns 0 when max_context_tokens is undefined", () => {
    const store = createStore();
    expect(store.get(contextUsagePctAtom)).toBe(0);
  });

  it("returns 0 when max_context_tokens is 0", () => {
    const store = createStore();
    store.set(updateSessionMetaAtom, createSessionMeta({ max_context_tokens: 0 }));
    expect(store.get(contextUsagePctAtom)).toBe(0);
  });

  it("computes correct percentage", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 3000,
        tokens_out: 2000,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(contextUsagePctAtom)).toBe(50);
  });

  it("caps at 100", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 8000,
        tokens_out: 5000,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(contextUsagePctAtom)).toBe(100);
  });
});

describe("contextPressureLevelAtom", () => {
  it("returns 'normal' below 70%", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 3000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(contextPressureLevelAtom)).toBe("normal");
  });

  it("returns 'elevated' at 70%", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 7000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(contextPressureLevelAtom)).toBe("elevated");
  });

  it("returns 'elevated' at 84%", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 8400,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(contextPressureLevelAtom)).toBe("elevated");
  });

  it("returns 'critical' at 85%", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 8500,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(contextPressureLevelAtom)).toBe("critical");
  });

  it("returns 'critical' at 100%", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 10000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(contextPressureLevelAtom)).toBe("critical");
  });
});

describe("estimatedRemainingTurnsAtom", () => {
  it("returns null when no turns exist", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 5000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );
    expect(store.get(estimatedRemainingTurnsAtom)).toBeNull();
  });

  it("returns null when no tokens used", () => {
    const store = createStore();
    store.set(upsertTurnAtom, createTurn());
    expect(store.get(estimatedRemainingTurnsAtom)).toBeNull();
  });

  it("computes reasonable estimate", () => {
    const store = createStore();
    // 5 turns used 5000 tokens → 1000 per turn, 5000 remaining → 5 more turns
    store.set(upsertTurnAtom, createTurn());
    store.set(upsertTurnAtom, createTurn());
    store.set(upsertTurnAtom, createTurn());
    store.set(upsertTurnAtom, createTurn());
    store.set(upsertTurnAtom, createTurn());

    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 3000,
        tokens_out: 2000,
        max_context_tokens: 10000,
      }),
    );

    expect(store.get(turnOrderAtom)).toHaveLength(5);
    expect(store.get(estimatedRemainingTurnsAtom)).toBe(5);
  });

  it("returns 0 when context is full", () => {
    const store = createStore();
    store.set(upsertTurnAtom, createTurn());

    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 10000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    expect(store.get(estimatedRemainingTurnsAtom)).toBe(0);
  });
});

describe("CONTEXT_THRESHOLDS", () => {
  it("has correct threshold values", () => {
    expect(CONTEXT_THRESHOLDS.elevated).toBe(70);
    expect(CONTEXT_THRESHOLDS.critical).toBe(85);
    expect(CONTEXT_THRESHOLDS.emergency).toBe(95);
  });
});
