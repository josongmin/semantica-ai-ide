import { screen } from "@testing-library/react";

import { pendingApprovalCountAtom, upsertToolCallAtom } from "~entities/tool-call";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { dangerousApprovalToolCallIdAtom } from "../../../shared/lib";
import { approvalGateAdapterAtom, type ApprovalGateAdapter } from "../../../shared/lib/atoms";
import { toastStackAtom } from "../../../shared/lib/atoms/toastAtoms";
import { ApprovalBanner } from "../ApprovalBanner";

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
    grantApprovalInSandbox: vi.fn(),
    denyApproval: (actionId: string) => mockPostMessage({ type: "DENY_APPROVAL", action_id: actionId }),
    stopTool: vi.fn(),
    retryTool: vi.fn(),
  };
}

const makeToolCall = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  turn_id: "turn-1",
  tool_name: `tool_${id}`,
  category: "write" as const,
  args_summary: `args for ${id}`,
  status: "awaiting_approval" as const,
  approval_action_id: `action-${id}`,
  risk_level: "moderate" as const,
  ...overrides,
});

// ─── Tests ─────────────────────────────────────────────────
describe("ApprovalBanner", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders nothing when no pending approvals", () => {
    const { container } = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });
    expect(container.querySelector("[data-testid='approval-banner']")).toBeNull();
  });

  it("shows banner with count when approvals are pending", () => {
    const {store} = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });

    // Insert tool calls that are awaiting approval
    store.set(upsertToolCallAtom, makeToolCall("tc-1"));
    store.set(upsertToolCallAtom, makeToolCall("tc-2"));

    // The banner checks pendingApprovalCountAtom which derives from the store
    const count = store.get(pendingApprovalCountAtom);
    expect(count).toBe(2);
  });

  it("Approve All sends GRANT_APPROVAL for non-dangerous tool calls", async () => {
    const { store, user } = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });

    store.set(upsertToolCallAtom, makeToolCall("tc-1", { risk_level: "moderate" }));
    store.set(upsertToolCallAtom, makeToolCall("tc-2", { risk_level: "safe" }));

    // Need to re-render since atoms updated
    // The banner should appear
    const approveBtn = await screen.findByText("Approve All");
    await user.click(approveBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GRANT_APPROVAL",
      action_id: "action-tc-1",
    });
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GRANT_APPROVAL",
      action_id: "action-tc-2",
    });
  });

  it("Deny All sends DENY_APPROVAL for all tool calls", async () => {
    const { store, user } = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });

    store.set(upsertToolCallAtom, makeToolCall("tc-1"));
    store.set(upsertToolCallAtom, makeToolCall("tc-2"));

    const denyBtn = await screen.findByText("Deny All");
    await user.click(denyBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DENY_APPROVAL",
      action_id: "action-tc-1",
    });
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DENY_APPROVAL",
      action_id: "action-tc-2",
    });
  });

  // ── Edge cases: all-dangerous ──────────────────────────
  it("all-dangerous: Approve sets first dangerous for dialog review", async () => {
    const { store, user } = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });

    store.set(upsertToolCallAtom, makeToolCall("d-1", { risk_level: "dangerous" }));
    store.set(upsertToolCallAtom, makeToolCall("d-2", { risk_level: "dangerous" }));

    const approveBtn = await screen.findByText("Approve All");
    await user.click(approveBtn);

    // No GRANT_APPROVAL sent (all dangerous require individual review)
    expect(mockPostMessage).not.toHaveBeenCalled();
    // First dangerous tool should be set for dialog
    expect(store.get(dangerousApprovalToolCallIdAtom)).toBe("d-1");
  });

  it("mixed: shows 'Approve Safe' label when dangerous are present", async () => {
    const { store } = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });

    store.set(upsertToolCallAtom, makeToolCall("safe-1", { risk_level: "moderate" }));
    store.set(upsertToolCallAtom, makeToolCall("d-1", { risk_level: "dangerous" }));

    const approveBtn = await screen.findByText("Approve Safe");
    expect(approveBtn).toBeInTheDocument();
  });

  it("mixed: Approve Safe approves non-dangerous and opens dialog for dangerous", async () => {
    const { store, user } = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });

    store.set(upsertToolCallAtom, makeToolCall("safe-1", { risk_level: "safe" }));
    store.set(upsertToolCallAtom, makeToolCall("d-1", { risk_level: "dangerous" }));

    const approveBtn = await screen.findByText("Approve Safe");
    await user.click(approveBtn);

    // Safe tool approved
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GRANT_APPROVAL",
      action_id: "action-safe-1",
    });
    // Dangerous opens dialog
    expect(store.get(dangerousApprovalToolCallIdAtom)).toBe("d-1");

    // Toast with warning
    const toasts = store.get(toastStackAtom);
    expect(toasts.some((t) => t.variant === "warning")).toBe(true);
  });

  it("shows dangerous count indicator", async () => {
    const { store } = renderWithAtoms(<ApprovalBanner />, { initialValues: [[approvalGateAdapterAtom, createMockApprovalAdapter()]] });

    store.set(upsertToolCallAtom, makeToolCall("d-1", { risk_level: "dangerous" }));

    const indicator = await screen.findByText(/dangerous/);
    expect(indicator).toBeInTheDocument();
  });
});
