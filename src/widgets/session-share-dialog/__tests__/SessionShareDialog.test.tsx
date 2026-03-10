import { act, screen } from "@testing-library/react";

import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setShareLinkAtom, shareDialogOpenAtom } from "../../../features/session-share";
import type * as SharedLib from "../../../shared/lib";
import { createSessionMeta, createShareLink } from "../../../shared/lib/mocks";
import type { SessionId } from "../../../shared/protocol";
import { SessionShareDialog } from "../SessionShareDialog";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

const mockWriteToClipboard = vi.fn().mockResolvedValue(undefined);
vi.mock("../../../shared/lib", async (importOriginal) => {
  const original = await importOriginal<typeof SharedLib>();
  return {
    ...original,
    writeToClipboard: (...args: unknown[]) => mockWriteToClipboard(...args),
  };
});

// ─── Tests ─────────────────────────────────────────────────
describe("SessionShareDialog", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    mockWriteToClipboard.mockClear();
  });

  it("renders nothing when dialog is closed", () => {
    renderWithAtoms(<SessionShareDialog />);
    expect(screen.queryByText("Share Session")).toBeNull();
  });

  it("renders dialog when open", () => {
    renderWithAtoms(<SessionShareDialog />, {
      initialValues: [[shareDialogOpenAtom, true]],
    });
    expect(screen.getByText("Share Session")).toBeTruthy();
    expect(screen.getByText("Link expiry")).toBeTruthy();
  });

  it("shows expiry options", () => {
    renderWithAtoms(<SessionShareDialog />, {
      initialValues: [[shareDialogOpenAtom, true]],
    });
    expect(screen.getByText("1 hour")).toBeTruthy();
    expect(screen.getByText("24 hours")).toBeTruthy();
    expect(screen.getByText("7 days")).toBeTruthy();
    expect(screen.getByText("30 days")).toBeTruthy();
    expect(screen.getByText("Never")).toBeTruthy();
  });

  it("shows mask secrets toggle checked by default", () => {
    renderWithAtoms(<SessionShareDialog />, {
      initialValues: [[shareDialogOpenAtom, true]],
    });
    const toggle = screen.getByTestId("mask-secrets-toggle");
    const checkbox = toggle.querySelector<HTMLInputElement>("input[type='checkbox']");
    expect(checkbox?.checked).toBe(true);
  });

  it("sends SHARE_SESSION message when Generate Link is clicked", async () => {
    const sessionId = "session_test" as SessionId;
    const { user } = renderWithAtoms(<SessionShareDialog />, {
      initialValues: [
        [shareDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    const generateBtn = screen.getByTestId("generate-link-btn");
    await user.click(generateBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SHARE_SESSION",
      session_id: sessionId,
      options: {
        expires_in_hours: 24,
        mask_secrets: true,
      },
    });
  });

  it("shows link display when share link exists", () => {
    const sessionId = "session_test" as SessionId;
    const link = createShareLink({ url: "https://share.example.com/test-link" });

    const { store } = renderWithAtoms(<SessionShareDialog />, {
      initialValues: [
        [shareDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setShareLinkAtom, { session_id: sessionId, link });
    });

    expect(screen.getByTestId("share-link-display")).toBeTruthy();
    expect(screen.getByText("https://share.example.com/test-link")).toBeTruthy();
  });

  it("shows preview section when link exists", () => {
    const sessionId = "session_test" as SessionId;
    const link = createShareLink({ masked: true, expires_at_ms: Date.now() + 86400000 });

    const { store } = renderWithAtoms(<SessionShareDialog />, {
      initialValues: [
        [shareDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setShareLinkAtom, { session_id: sessionId, link });
    });

    expect(screen.getByTestId("share-preview")).toBeTruthy();
    expect(screen.getByText("Secrets automatically masked")).toBeTruthy();
  });

  it("copies link to clipboard when Copy is clicked", async () => {
    const sessionId = "session_test" as SessionId;
    const link = createShareLink({ url: "https://share.example.com/copy-test" });

    const { store, user } = renderWithAtoms(<SessionShareDialog />, {
      initialValues: [
        [shareDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setShareLinkAtom, { session_id: sessionId, link });
    });

    const copyBtn = screen.getByTestId("copy-link-btn");
    await user.click(copyBtn);

    expect(mockWriteToClipboard).toHaveBeenCalledWith("https://share.example.com/copy-test");
  });

  it("switches to Regenerate Link button label after link is set", () => {
    const sessionId = "session_test" as SessionId;
    const link = createShareLink();

    const { store } = renderWithAtoms(<SessionShareDialog />, {
      initialValues: [
        [shareDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setShareLinkAtom, { session_id: sessionId, link });
    });

    expect(screen.getByText("Regenerate Link")).toBeTruthy();
  });
});
