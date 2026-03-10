import { createStore } from "jotai";

import { createToolCall, resetIdCounter } from "~shared/lib/mocks";

import {
  toolCallAtomFamily,
  toolCallGroupsByTurnAtom,
  toolCallIdsByTurnAtom,
  updateToolCallStatusAtom,
  upsertToolCallAtom,
} from "../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("upsertToolCallAtom", () => {
  it("saves tool call to family and indexes by turn", () => {
    const store = createStore();
    const tc = createToolCall({ id: "tc_1", turn_id: "turn_1", tool_name: "read_file" });

    store.set(upsertToolCallAtom, tc);

    // Verify the tool call is stored in the atom family
    expect(store.get(toolCallAtomFamily("tc_1"))).toEqual(tc);

    // Verify it is indexed by turn_id
    const byTurn = store.get(toolCallIdsByTurnAtom);
    expect(byTurn.turn_1).toEqual(["tc_1"]);
  });

  it("indexes multiple tool calls under the same turn", () => {
    const store = createStore();
    const tc1 = createToolCall({ id: "tc_1", turn_id: "turn_1" });
    const tc2 = createToolCall({ id: "tc_2", turn_id: "turn_1" });

    store.set(upsertToolCallAtom, tc1);
    store.set(upsertToolCallAtom, tc2);

    const byTurn = store.get(toolCallIdsByTurnAtom);
    expect(byTurn.turn_1).toEqual(["tc_1", "tc_2"]);
  });

  it("indexes tool calls under separate turns independently", () => {
    const store = createStore();
    const tc1 = createToolCall({ id: "tc_1", turn_id: "turn_1" });
    const tc2 = createToolCall({ id: "tc_2", turn_id: "turn_2" });

    store.set(upsertToolCallAtom, tc1);
    store.set(upsertToolCallAtom, tc2);

    const byTurn = store.get(toolCallIdsByTurnAtom);
    expect(byTurn.turn_1).toEqual(["tc_1"]);
    expect(byTurn.turn_2).toEqual(["tc_2"]);
  });

  it("updates existing tool call without creating duplicate in index", () => {
    const store = createStore();
    const tc = createToolCall({ id: "tc_1", turn_id: "turn_1", tool_name: "read_file" });

    store.set(upsertToolCallAtom, tc);

    // Upsert the same tool call with updated fields
    const updated = createToolCall({
      id: "tc_1",
      turn_id: "turn_1",
      tool_name: "read_file",
      result_summary: "500 lines read",
    });
    store.set(upsertToolCallAtom, updated);

    // The family atom should hold the updated value
    expect(store.get(toolCallAtomFamily("tc_1"))).toEqual(updated);

    // The index should NOT have a duplicate entry
    const byTurn = store.get(toolCallIdsByTurnAtom);
    expect(byTurn.turn_1).toEqual(["tc_1"]);
    expect(byTurn.turn_1).toHaveLength(1);
  });
});

describe("updateToolCallStatusAtom", () => {
  it("changes status and result fields on an existing tool call", () => {
    const store = createStore();
    const tc = createToolCall({
      id: "tc_1",
      turn_id: "turn_1",
      status: "running",
      result_summary: undefined,
      duration_ms: undefined,
    });
    store.set(upsertToolCallAtom, tc);

    store.set(updateToolCallStatusAtom, {
      id: "tc_1",
      status: "success",
      result_summary: "Read 200 lines",
      duration_ms: 150,
    });

    const updated = store.get(toolCallAtomFamily("tc_1"));
    expect(updated?.status).toBe("success");
    expect(updated?.result_summary).toBe("Read 200 lines");
    expect(updated?.duration_ms).toBe(150);
  });

  it("preserves existing result_summary when not provided in update", () => {
    const store = createStore();
    const tc = createToolCall({
      id: "tc_1",
      turn_id: "turn_1",
      status: "running",
      result_summary: "initial summary",
      duration_ms: 50,
    });
    store.set(upsertToolCallAtom, tc);

    store.set(updateToolCallStatusAtom, {
      id: "tc_1",
      status: "success",
    });

    const updated = store.get(toolCallAtomFamily("tc_1"));
    expect(updated?.status).toBe("success");
    expect(updated?.result_summary).toBe("initial summary");
    expect(updated?.duration_ms).toBe(50);
  });

  it("does nothing when tool call id does not exist", () => {
    const store = createStore();

    // Attempt to update a non-existent tool call — should not throw
    store.set(updateToolCallStatusAtom, {
      id: "nonexistent",
      status: "error",
    });

    expect(store.get(toolCallAtomFamily("nonexistent"))).toBeNull();
  });
});

describe("toolCallGroupsByTurnAtom", () => {
  it("groups tool calls by category with correct counts", () => {
    const store = createStore();

    store.set(
      upsertToolCallAtom,
      createToolCall({ id: "tc_1", turn_id: "turn_1", category: "read", tool_name: "read_file" }),
    );
    store.set(
      upsertToolCallAtom,
      createToolCall({ id: "tc_2", turn_id: "turn_1", category: "read", tool_name: "read_file" }),
    );
    store.set(
      upsertToolCallAtom,
      createToolCall({
        id: "tc_3",
        turn_id: "turn_1",
        category: "write",
        tool_name: "write_file",
      }),
    );

    const groups = store.get(toolCallGroupsByTurnAtom("turn_1"));

    expect(groups).toHaveLength(2);

    const readGroup = groups.find((g) => g.category === "read");
    expect(readGroup).toBeDefined();
    expect(readGroup!.count).toBe(2);
    expect(readGroup!.calls).toHaveLength(2);

    const writeGroup = groups.find((g) => g.category === "write");
    expect(writeGroup).toBeDefined();
    expect(writeGroup!.count).toBe(1);
    expect(writeGroup!.calls).toHaveLength(1);
  });

  it("returns empty array for a turn with no tool calls", () => {
    const store = createStore();

    const groups = store.get(toolCallGroupsByTurnAtom("turn_nonexistent"));
    expect(groups).toEqual([]);
  });

  it("preserves insertion order within each category group", () => {
    const store = createStore();

    store.set(
      upsertToolCallAtom,
      createToolCall({ id: "tc_a", turn_id: "turn_1", category: "search", tool_name: "grep" }),
    );
    store.set(
      upsertToolCallAtom,
      createToolCall({ id: "tc_b", turn_id: "turn_1", category: "search", tool_name: "find" }),
    );
    store.set(
      upsertToolCallAtom,
      createToolCall({ id: "tc_c", turn_id: "turn_1", category: "search", tool_name: "rg" }),
    );

    const groups = store.get(toolCallGroupsByTurnAtom("turn_1"));
    expect(groups).toHaveLength(1);

    const searchGroup = groups[0];
    expect(searchGroup?.category).toBe("search");
    expect(searchGroup?.calls[0]?.id).toBe("tc_a");
    expect(searchGroup?.calls[1]?.id).toBe("tc_b");
    expect(searchGroup?.calls[2]?.id).toBe("tc_c");
  });

  it("does not mix tool calls from different turns", () => {
    const store = createStore();

    store.set(
      upsertToolCallAtom,
      createToolCall({ id: "tc_1", turn_id: "turn_1", category: "read" }),
    );
    store.set(
      upsertToolCallAtom,
      createToolCall({ id: "tc_2", turn_id: "turn_2", category: "read" }),
    );

    const groups1 = store.get(toolCallGroupsByTurnAtom("turn_1"));
    const groups2 = store.get(toolCallGroupsByTurnAtom("turn_2"));

    expect(groups1).toHaveLength(1);
    expect(groups1[0]?.count).toBe(1);
    expect(groups1[0]?.calls[0]?.id).toBe("tc_1");

    expect(groups2).toHaveLength(1);
    expect(groups2[0]?.count).toBe(1);
    expect(groups2[0]?.calls[0]?.id).toBe("tc_2");
  });
});
