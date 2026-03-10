import { createStore } from "jotai";

import { turnAtomFamily } from "~entities/message/turns";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { createTurn, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";

function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("UPDATE_TURN_METRICS serverEvent", () => {
  it("updates all metrics on an existing turn", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({ id: "turn_1" as TurnId, status: "success" });

    dispatch({ t: "UPSERT_TURN", turn });
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      ttft_ms: 320,
      latency_ms: 2100,
      token_usage: { input_tokens: 5000, output_tokens: 3000 },
      estimated_cost_usd: 0.08,
    });

    const updated = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(updated?.ttft_ms).toBe(320);
    expect(updated?.latency_ms).toBe(2100);
    expect(updated?.token_usage).toEqual({ input_tokens: 5000, output_tokens: 3000 });
    expect(updated?.estimated_cost_usd).toBe(0.08);
  });

  it("partially updates only ttft_ms", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({ id: "turn_1" as TurnId, status: "running" });

    dispatch({ t: "UPSERT_TURN", turn });
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      ttft_ms: 450,
    });

    const updated = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(updated?.ttft_ms).toBe(450);
    expect(updated?.latency_ms).toBeUndefined();
    expect(updated?.token_usage).toBeUndefined();
    expect(updated?.estimated_cost_usd).toBeUndefined();
  });

  it("partially updates only token_usage", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({ id: "turn_1" as TurnId });

    dispatch({ t: "UPSERT_TURN", turn });
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      token_usage: { input_tokens: 1000, output_tokens: 500 },
    });

    const updated = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(updated?.token_usage).toEqual({ input_tokens: 1000, output_tokens: 500 });
    expect(updated?.ttft_ms).toBeUndefined();
  });

  it("preserves existing turn data when updating metrics", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({
      id: "turn_1" as TurnId,
      status: "success",
    });

    dispatch({ t: "UPSERT_TURN", turn });
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      ttft_ms: 200,
    });

    const updated = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(updated?.status).toBe("success");
    expect(updated?.phases).toEqual(turn.phases);
    expect(updated?.created_at_ms).toBe(turn.created_at_ms);
    expect(updated?.ttft_ms).toBe(200);
  });

  it("is a no-op when turn does not exist", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Should not throw when turn doesn't exist
    expect(() =>
      dispatch({
        t: "UPDATE_TURN_METRICS",
        turn_id: "nonexistent" as TurnId,
        ttft_ms: 100,
      }),
    ).not.toThrow();

    expect(store.get(turnAtomFamily("nonexistent" as TurnId))).toBeNull();
  });

  it("updates metrics incrementally across multiple dispatches", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({ id: "turn_1" as TurnId });

    dispatch({ t: "UPSERT_TURN", turn });

    // First update: TTFT arrives early
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      ttft_ms: 300,
    });

    // Second update: full metrics arrive
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      latency_ms: 5000,
      token_usage: { input_tokens: 2000, output_tokens: 1500 },
      estimated_cost_usd: 0.035,
    });

    const updated = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(updated?.ttft_ms).toBe(300);
    expect(updated?.latency_ms).toBe(5000);
    expect(updated?.token_usage).toEqual({ input_tokens: 2000, output_tokens: 1500 });
    expect(updated?.estimated_cost_usd).toBe(0.035);
  });

  it("supports cache token fields in token_usage", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const turn = createTurn({ id: "turn_1" as TurnId });

    dispatch({ t: "UPSERT_TURN", turn });
    dispatch({
      t: "UPDATE_TURN_METRICS",
      turn_id: "turn_1" as TurnId,
      token_usage: {
        input_tokens: 3000,
        output_tokens: 1000,
        cache_read_tokens: 2500,
        cache_write_tokens: 500,
      },
    });

    const updated = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(updated?.token_usage?.cache_read_tokens).toBe(2500);
    expect(updated?.token_usage?.cache_write_tokens).toBe(500);
  });
});
