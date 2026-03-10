import { createStore } from "jotai";

import { messageOrderAtom } from "~entities/message/core";
import { resetMessageStoreAtom, upsertMessageAtom } from "~entities/message/writers";
import {
  requestToolApprovalAtom,
  setToolOutputAtom,
  toolCallAtomFamily,
  upsertToolCallAtom,
} from "~entities/tool-call";

import {
  currentPageAtom,
  pushToastAtom,
  resetUiStoreAtom,
  sessionListAtom,
  setSessionListAtom,
  toastStackAtom,
  toolCategoryFilterAtom,
} from "../../../shared/lib";
import {
  createMessage,
  createSessionListEntry,
  createToolCall,
  createToolCallOutput,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { MessageId, ToolCategory } from "../../../shared/protocol";
beforeEach(() => {
  resetIdCounter();
});

describe("ServerEvent dispatcher — reinforcement", () => {
  it("REQUEST_TOOL_APPROVAL sets approval_action_id and risk_level on the tool call", () => {
    const store = createStore();

    const tc = createToolCall({ id: "tc_approve_1", turn_id: "turn_1", status: "running" });
    store.set(upsertToolCallAtom, tc);

    store.set(requestToolApprovalAtom, {
      tool_call_id: "tc_approve_1",
      action_id: "action_abc",
      risk_level: "dangerous",
      description: "Will delete files",
    });

    const updated = store.get(toolCallAtomFamily("tc_approve_1"));
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("awaiting_approval");
    expect(updated?.approval_action_id).toBe("action_abc");
    expect(updated?.risk_level).toBe("dangerous");
  });

  it("REQUEST_TOOL_APPROVAL with moderate risk_level persists correctly", () => {
    const store = createStore();

    const tc = createToolCall({ id: "tc_approve_2", turn_id: "turn_1", status: "pending" });
    store.set(upsertToolCallAtom, tc);

    store.set(requestToolApprovalAtom, {
      tool_call_id: "tc_approve_2",
      action_id: "action_xyz",
      risk_level: "moderate",
      description: "Will write to a file",
    });

    const updated = store.get(toolCallAtomFamily("tc_approve_2"));
    expect(updated?.risk_level).toBe("moderate");
    expect(updated?.approval_action_id).toBe("action_xyz");
  });

  it("REQUEST_TOOL_APPROVAL is a no-op when the tool call does not exist", () => {
    const store = createStore();

    // No upsert — tool call does not exist
    store.set(requestToolApprovalAtom, {
      tool_call_id: "tc_nonexistent",
      action_id: "action_noop",
      risk_level: "safe",
      description: "Harmless action",
    });

    // Should not throw and should not create an atom entry
    const result = store.get(toolCallAtomFamily("tc_nonexistent"));
    expect(result).toBeNull();
  });

  it("SET_TOOL_OUTPUT attaches the output field to the tool call", () => {
    const store = createStore();

    const tc = createToolCall({ id: "tc_output_1", turn_id: "turn_1", status: "running" });
    store.set(upsertToolCallAtom, tc);

    const output = createToolCallOutput({ stdout: "result text", exit_code: 0 });
    store.set(setToolOutputAtom, { id: "tc_output_1", output });

    const updated = store.get(toolCallAtomFamily("tc_output_1"));
    expect(updated?.output).toBeDefined();
    expect(updated?.output?.stdout).toBe("result text");
    expect(updated?.output?.exit_code).toBe(0);
  });

  it("SET_TOOL_OUTPUT with stderr sets the stderr field", () => {
    const store = createStore();

    const tc = createToolCall({ id: "tc_output_2", turn_id: "turn_1", status: "error" });
    store.set(upsertToolCallAtom, tc);

    const output = createToolCallOutput({
      stdout: "",
      stderr: "command not found",
      exit_code: 127,
    });
    store.set(setToolOutputAtom, { id: "tc_output_2", output });

    const updated = store.get(toolCallAtomFamily("tc_output_2"));
    expect(updated?.output?.stderr).toBe("command not found");
    expect(updated?.output?.exit_code).toBe(127);
  });

  it("SET_TOOL_OUTPUT is a no-op when the tool call does not exist", () => {
    const store = createStore();

    const output = createToolCallOutput({ stdout: "orphan output" });
    // Should not throw
    expect(() => store.set(setToolOutputAtom, { id: "tc_missing", output })).not.toThrow();

    const result = store.get(toolCallAtomFamily("tc_missing"));
    expect(result).toBeNull();
  });

  it("SET_SESSION_LIST populates sessionListAtom with provided entries", () => {
    const store = createStore();

    const entries = [
      createSessionListEntry({ title: "Session Alpha" }),
      createSessionListEntry({ title: "Session Beta" }),
    ];

    store.set(setSessionListAtom, entries);

    const list = store.get(sessionListAtom);
    expect(list).toHaveLength(2);
    expect(list[0]?.title).toBe("Session Alpha");
    expect(list[1]?.title).toBe("Session Beta");
  });

  it("SET_SESSION_LIST replaces the previous list on subsequent calls", () => {
    const store = createStore();

    const first = [createSessionListEntry({ title: "Old Session" })];
    store.set(setSessionListAtom, first);
    expect(store.get(sessionListAtom)).toHaveLength(1);

    const second = [
      createSessionListEntry({ title: "New Session A" }),
      createSessionListEntry({ title: "New Session B" }),
      createSessionListEntry({ title: "New Session C" }),
    ];
    store.set(setSessionListAtom, second);

    const list = store.get(sessionListAtom);
    expect(list).toHaveLength(3);
    expect(list[0]?.title).toBe("New Session A");
  });

  it("SET_SESSION_LIST with empty array clears the list", () => {
    const store = createStore();

    store.set(setSessionListAtom, [createSessionListEntry()]);
    store.set(setSessionListAtom, []);

    expect(store.get(sessionListAtom)).toHaveLength(0);
  });

  it('SET_CURRENT_PAGE updates currentPageAtom to "sessions"', () => {
    const store = createStore();

    // Default value should be "chat"
    expect(store.get(currentPageAtom)).toBe("chat");

    store.set(currentPageAtom, "sessions");

    expect(store.get(currentPageAtom)).toBe("sessions");
  });

  it('SET_CURRENT_PAGE can be switched back to "chat"', () => {
    const store = createStore();

    store.set(currentPageAtom, "sessions");
    expect(store.get(currentPageAtom)).toBe("sessions");

    store.set(currentPageAtom, "chat");
    expect(store.get(currentPageAtom)).toBe("chat");
  });

  it("RESET_STORES also resets UI atoms via resetUiStoreAtom", () => {
    const store = createStore();

    // Populate UI state
    store.set(pushToastAtom, { id: "toast_1", message: "Something happened", variant: "info" });
    store.set(pushToastAtom, { id: "toast_2", message: "Another event", variant: "success" });
    store.set(toolCategoryFilterAtom, new Set<ToolCategory>(["read", "write"]));

    // Populate message store
    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_r1" as MessageId, text: "Pre-reset message" }),
    );

    // Verify pre-conditions
    expect(store.get(toastStackAtom)).toHaveLength(2);
    expect(store.get(toolCategoryFilterAtom).size).toBe(2);
    expect(store.get(messageOrderAtom)).toHaveLength(1);

    // Simulate what RESET_STORES does in useServerEventDispatcher
    store.set(resetMessageStoreAtom);
    store.set(resetUiStoreAtom);

    // Verify UI atoms are cleared
    expect(store.get(toastStackAtom)).toHaveLength(0);
    expect(store.get(toolCategoryFilterAtom).size).toBe(0);

    // Verify message store is cleared
    expect(store.get(messageOrderAtom)).toHaveLength(0);
  });

  it("RESET_STORES via resetUiStoreAtom resets toolCategoryFilterAtom to empty Set", () => {
    const store = createStore();

    store.set(toolCategoryFilterAtom, new Set<ToolCategory>(["terminal", "git", "analysis"]));
    expect(store.get(toolCategoryFilterAtom).size).toBe(3);

    store.set(resetUiStoreAtom);

    const filter = store.get(toolCategoryFilterAtom);
    expect(filter).toBeInstanceOf(Set);
    expect(filter.size).toBe(0);
  });

  it("RESET_STORES via resetUiStoreAtom empties the toast stack", () => {
    const store = createStore();

    for (let i = 0; i < 3; i++) {
      store.set(pushToastAtom, { id: `toast_${i}`, message: `Toast ${i}`, variant: "warning" });
    }
    expect(store.get(toastStackAtom)).toHaveLength(3);

    store.set(resetUiStoreAtom);

    expect(store.get(toastStackAtom)).toHaveLength(0);
  });

  it("RESET_STORES via resetMessageStoreAtom empties messageOrderAtom", () => {
    const store = createStore();

    store.set(upsertMessageAtom, createMessage({ id: "msg_a" as MessageId }));
    store.set(upsertMessageAtom, createMessage({ id: "msg_b" as MessageId }));
    expect(store.get(messageOrderAtom)).toHaveLength(2);

    store.set(resetMessageStoreAtom);

    expect(store.get(messageOrderAtom)).toHaveLength(0);
  });

  it("full approval flow: upsert → request approval → set output", () => {
    const store = createStore();

    const tc = createToolCall({
      id: "tc_full_flow",
      turn_id: "turn_full",
      status: "running",
      tool_name: "bash",
      category: "terminal",
    });

    // 1. Upsert the tool call
    store.set(upsertToolCallAtom, tc);
    expect(store.get(toolCallAtomFamily("tc_full_flow"))?.status).toBe("running");

    // 2. Request approval
    store.set(requestToolApprovalAtom, {
      tool_call_id: "tc_full_flow",
      action_id: "action_full_001",
      risk_level: "dangerous",
      description: "rm -rf /tmp/test",
    });

    const afterApproval = store.get(toolCallAtomFamily("tc_full_flow"));
    expect(afterApproval?.status).toBe("awaiting_approval");
    expect(afterApproval?.approval_action_id).toBe("action_full_001");
    expect(afterApproval?.risk_level).toBe("dangerous");

    // 3. Set output after approval granted
    const output = createToolCallOutput({ stdout: "Removed.", exit_code: 0 });
    store.set(setToolOutputAtom, { id: "tc_full_flow", output });

    const afterOutput = store.get(toolCallAtomFamily("tc_full_flow"));
    expect(afterOutput?.output?.stdout).toBe("Removed.");
    expect(afterOutput?.output?.exit_code).toBe(0);
    // Approval fields should still be present
    expect(afterOutput?.approval_action_id).toBe("action_full_001");
  });
});
