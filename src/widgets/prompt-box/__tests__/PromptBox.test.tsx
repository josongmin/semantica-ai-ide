import { fireEvent, screen, waitFor } from "@testing-library/react";

import { approvalModeAtom } from "~entities/session/settings";
import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { type SendMessageAdapter, sendMessageAdapterAtom } from "../../../shared/lib/atoms";
import { createSessionMeta } from "../../../shared/lib/mocks";
import { PromptBox } from "../PromptBox";

// ─── Mocks ─────────────────────────────────────────────────
let mockApprovalMode = "auto" as "auto" | "turbo";
vi.mock("../../../features/approval-gate", () => ({
  useApprovalGate: () => ({
    mode: mockApprovalMode,
    changeMode: vi.fn((m: string) => {
      mockApprovalMode = m as typeof mockApprovalMode;
    }),
  }),
}));

const mockSend = vi.fn();
const mockStopAgent = vi.fn();

const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// ─── Helpers ───────────────────────────────────────────────
function createMockAdapter(): SendMessageAdapter {
  return {
    send: mockSend,
    stopAgent: mockStopAgent,
    retryMessage: vi.fn(),
    enqueue: vi.fn(),
    removeQueued: vi.fn(),
    queue: [],
  };
}

function renderIdle() {
  const meta = createSessionMeta({ status: "idle" });
  return renderWithAtoms(<PromptBox />, {
    initialValues: [
      [sessionMetaAtom, meta],
      [approvalModeAtom, meta.approval_mode],
      [sendMessageAdapterAtom, createMockAdapter()],
    ],
  });
}

function renderRunning() {
  const meta = createSessionMeta({ status: "running" });
  return renderWithAtoms(<PromptBox />, {
    initialValues: [
      [sessionMetaAtom, meta],
      [approvalModeAtom, meta.approval_mode],
      [sendMessageAdapterAtom, createMockAdapter()],
    ],
  });
}

// ─── Lifecycle ─────────────────────────────────────────────
beforeEach(() => {
  mockApprovalMode = "auto";
  mockSend.mockClear();
  mockStopAgent.mockClear();
  mockPostMessage.mockClear();
});

// ─── Tests ─────────────────────────────────────────────────
describe("PromptBox", () => {
  // ── Idle State ─────────────────────────────────────────
  it("renders textarea with idle placeholder", () => {
    renderIdle();
    const textarea = screen.getByLabelText("Message input");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Esc to focus or unfocus input");
  });

  it("send button is disabled when textarea is empty", () => {
    renderIdle();
    const sendBtn = screen.getByLabelText("Send message");
    expect(sendBtn).toBeDisabled();
  });

  it("typing text enables the send button", async () => {
    const { user } = renderIdle();
    const textarea = screen.getByLabelText("Message input");
    await user.type(textarea, "hello");
    const sendBtn = screen.getByLabelText("Send message");
    expect(sendBtn).toBeEnabled();
  });

  it("clicking send button calls mockSend with the entered text", async () => {
    const { user } = renderIdle();
    const textarea = screen.getByLabelText("Message input");
    await user.type(textarea, "build me a feature");
    const sendBtn = screen.getByLabelText("Send message");
    await user.click(sendBtn);
    expect(mockSend).toHaveBeenCalledWith("build me a feature");
  });

  it("Enter key calls send and clears the textarea", async () => {
    const { user } = renderIdle();
    const textarea = screen.getByLabelText("Message input");
    await user.type(textarea, "hello world");
    await user.keyboard("{Enter}");
    expect(mockSend).toHaveBeenCalledWith("hello world");
    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("Shift+Enter does NOT call send (inserts newline)", async () => {
    const { user } = renderIdle();
    const textarea = screen.getByLabelText("Message input");
    await user.type(textarea, "line one");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(mockSend).not.toHaveBeenCalled();
  });

  // ── Running State ──────────────────────────────────────
  it("running state: textarea remains enabled for message queuing", () => {
    renderRunning();
    const textarea = screen.getByLabelText("Message input");
    expect(textarea).not.toBeDisabled();
  });

  it("running state: shows stop button", () => {
    renderRunning();
    expect(screen.getByLabelText("Stop agent")).toBeInTheDocument();
    expect(screen.queryByLabelText("Send message")).not.toBeInTheDocument();
  });

  it("running state: placeholder changes to working message", () => {
    renderRunning();
    const textarea = screen.getByLabelText("Message input");
    expect(textarea).toHaveAttribute(
      "placeholder",
      "Agent is working\u2026 (Enter to queue, Esc to stop)",
    );
  });

  it("clicking stop button calls stopAgent", async () => {
    const { user } = renderRunning();
    const stopBtn = screen.getByLabelText("Stop agent");
    await user.click(stopBtn);
    expect(mockStopAgent).toHaveBeenCalled();
  });

  it("Esc key in running state calls stopAgent", () => {
    renderRunning();
    const textarea = screen.getByLabelText("Message input");
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(mockStopAgent).toHaveBeenCalled();
  });

  // ── Approval Mode ──────────────────────────────────────
  it("renders without error when approval mode is turbo", () => {
    mockApprovalMode = "turbo";
    const meta = createSessionMeta({ approval_mode: "turbo" });
    const { container } = renderWithAtoms(<PromptBox />, {
      initialValues: [
        [sessionMetaAtom, meta],
        [approvalModeAtom, "turbo"],
      ],
    });
    expect(container.querySelector("textarea")).toBeInTheDocument();
  });
});
