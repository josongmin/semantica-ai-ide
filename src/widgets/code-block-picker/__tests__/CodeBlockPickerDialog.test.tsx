import { fireEvent, screen } from "@testing-library/react";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";

import { renderWithAtoms } from "../../../../tests/utils";
import { codeBlockPickerOpenAtom } from "../../../features/code-block-picker";
import type * as SharedLib from "../../../shared/lib";
import type { MessageId } from "../../../shared/protocol";
import { CodeBlockPickerDialog } from "../CodeBlockPickerDialog";

// Mock clipboard
const mockWriteToClipboard = vi.fn().mockResolvedValue(undefined);
vi.mock("../../../shared/lib/clipboard", () => ({
  writeToClipboard: (...args: unknown[]) => mockWriteToClipboard(...args),
}));

// Mock getVscodeApi
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedLib>()),
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// Mock overlay behavior for Dialog
vi.mock("../../../shared/lib/hooks/useOverlayBehavior", () => ({
  useOverlayBehavior: ({ open }: { open: boolean }) => ({
    mounted: open,
    exiting: false,
    handleTabKeyDown: () => {},
  }),
}));

beforeEach(() => {
  mockWriteToClipboard.mockClear();
  mockPostMessage.mockClear();
});

const MSG_WITH_CODE = {
  id: "msg_1" as MessageId,
  role: "assistant" as const,
  created_at_ms: Date.now(),
  text: 'Here is code:\n\n```typescript\nconst x = 1;\nconsole.log(x);\n```\n\nAnd more:\n\n```python\ndef hello():\n    print("hi")\n```',
  status: "final" as const,
};

const MSG_NO_CODE = {
  id: "msg_2" as MessageId,
  role: "assistant" as const,
  created_at_ms: Date.now(),
  text: "No code here, just text.",
  status: "final" as const,
};

function renderPicker(messages = [MSG_WITH_CODE, MSG_NO_CODE], open = true) {
  const msgOrder = messages.map((m) => m.id);
   
  const initialValues: [any, unknown][] = [
    [codeBlockPickerOpenAtom, open],
    [messageOrderAtom, msgOrder],
     
    ...messages.map((m) => [messageAtomFamily(m.id), m] as [any, unknown]),
  ];

  return renderWithAtoms(<CodeBlockPickerDialog />, { initialValues });
}

describe("CodeBlockPickerDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = renderPicker([MSG_WITH_CODE], false);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog with extracted code blocks", () => {
    renderPicker();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Should find typescript and python blocks
    expect(screen.getByText("typescript")).toBeInTheDocument();
    expect(screen.getByText("python")).toBeInTheDocument();
  });

  it("shows block count in description", () => {
    renderPicker();
    expect(screen.getByText("2 blocks in conversation")).toBeInTheDocument();
  });

  it("shows empty state when no code blocks", () => {
    renderPicker([MSG_NO_CODE]);
    expect(screen.getByText("No code blocks in conversation")).toBeInTheDocument();
  });

  it("filters blocks by search query", () => {
    renderPicker();

    const input = screen.getByLabelText("Filter code blocks");
    fireEvent.change(input, { target: { value: "python" } });

    expect(screen.getByText("python")).toBeInTheDocument();
    expect(screen.queryByText("typescript")).not.toBeInTheDocument();
  });

  it("shows line count for each block", () => {
    renderPicker();

    // Both blocks have 2 lines each
    const lineLabels = screen.getAllByText("2 lines");
    expect(lineLabels.length).toBe(2);
  });

  it("copies code on Enter key after navigating", async () => {
    renderPicker();

    const input = screen.getByLabelText("Filter code blocks");
    // First block is already focused (index 0), press Enter to copy
    fireEvent.keyDown(input, { key: "Enter" });

    // writeToClipboard is async — wait for the promise
    await vi.waitFor(() => {
      expect(mockWriteToClipboard).toHaveBeenCalled();
    });
  });
});
