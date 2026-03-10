import { screen } from "@testing-library/react";

import { toolCallAtomFamily, upsertToolCallAtom } from "~entities/tool-call";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { dangerousApprovalToolCallIdAtom } from "../../../shared/lib";
import { approvalGateAdapterAtom, type ApprovalGateAdapter } from "../../../shared/lib/atoms";
import { toastStackAtom } from "../../../shared/lib/atoms/toastAtoms";
import { DangerousApprovalGate } from "../DangerousApprovalGate";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

function createMockApprovalAdapter(): ApprovalGateAdapter {
  return {
    mode: "auto",
    changeMode: vi.fn(),
    grantApproval: (actionId: string) => mockPostMessage({ type: "GRANT_APPROVAL", action_id: actionId }),
    grantApprovalInSandbox: (actionId: string) => mockPostMessage({ type: "GRANT_APPROVAL", action_id: actionId, sandbox: true }),
    denyApproval: (actionId: string) => mockPostMessage({ type: "DENY_APPROVAL", action_id: actionId }),
    stopTool: vi.fn(),
    retryTool: vi.fn(),
  };
}

const makeDangerousToolCall = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  turn_id: "turn-1",
  tool_name: `dangerous_tool_${id}`,
  category: "delete" as const,
  args_summary: `delete ${id}`,
  status: "awaiting_approval" as const,
  approval_action_id: `action-${id}`,
  risk_level: "dangerous" as const,
  ...overrides,
});

// ─── Tests ─────────────────────────────────────────────────
describe("DangerousApprovalGate", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders nothing when dangerousApprovalToolCallIdAtom is null", () => {
    const { container } = renderWithAtoms(<DangerousApprovalGate />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when toolCallId is set but tool call does not exist", () => {
    const { container } = renderWithAtoms(<DangerousApprovalGate />, {
      initialValues: [[dangerousApprovalToolCallIdAtom, "nonexistent-id"]],
    });
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog when tool call exists and is dangerous", async () => {
    const tc = makeDangerousToolCall("tc-dangerous");
    const { store } = renderWithAtoms(<DangerousApprovalGate />, {
      initialValues: [[dangerousApprovalToolCallIdAtom, "tc-dangerous"]],
    });
    store.set(upsertToolCallAtom, tc);

    expect(await screen.findByText("Dangerous Operation")).toBeTruthy();
  });

  it("approve sends GRANT_APPROVAL, pushes toast, and resets atom", async () => {
    const tc = makeDangerousToolCall("tc-1");
    const { store, user } = renderWithAtoms(<DangerousApprovalGate />, {
      initialValues: [[dangerousApprovalToolCallIdAtom, "tc-1"], [approvalGateAdapterAtom, createMockApprovalAdapter()]],
    });
    store.set(upsertToolCallAtom, tc);

    const approveBtn = await screen.findByText("Approve Anyway");
    await user.click(approveBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GRANT_APPROVAL",
      action_id: "action-tc-1",
    });
    expect(store.get(dangerousApprovalToolCallIdAtom)).toBeNull();

    const toasts = store.get(toastStackAtom);
    expect(toasts.some((t) => t.variant === "success" && t.message.includes("Approved"))).toBe(
      true,
    );
  });

  it("deny sends DENY_APPROVAL, pushes toast, and resets atom", async () => {
    const tc = makeDangerousToolCall("tc-2");
    const { store, user } = renderWithAtoms(<DangerousApprovalGate />, {
      initialValues: [[dangerousApprovalToolCallIdAtom, "tc-2"], [approvalGateAdapterAtom, createMockApprovalAdapter()]],
    });
    store.set(upsertToolCallAtom, tc);

    const denyBtn = await screen.findByText("Deny");
    await user.click(denyBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DENY_APPROVAL",
      action_id: "action-tc-2",
    });
    expect(store.get(dangerousApprovalToolCallIdAtom)).toBeNull();

    const toasts = store.get(toastStackAtom);
    expect(toasts.some((t) => t.variant === "info" && t.message.includes("Denied"))).toBe(true);
  });

  it("does nothing if tool call has no approval_action_id", () => {
    const tc = makeDangerousToolCall("tc-no-action", { approval_action_id: undefined });
    const { store } = renderWithAtoms(<DangerousApprovalGate />, {
      initialValues: [[dangerousApprovalToolCallIdAtom, "tc-no-action"]],
    });
    store.set(upsertToolCallAtom, tc);

    // toolCall exists but approval_action_id is missing → dialog renders but actions are no-ops
    const toolCall = store.get(toolCallAtomFamily("tc-no-action"));
    expect(toolCall).toBeTruthy();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});
