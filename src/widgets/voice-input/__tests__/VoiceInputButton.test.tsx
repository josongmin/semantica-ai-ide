import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setVoiceInputStateAtom, voiceInputStateAtom } from "../../../features/voice-input";
import type { VoiceInputState } from "../../../shared/protocol";
import { VoiceInputButton } from "../VoiceInputButton";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

function renderButton(initialState?: VoiceInputState) {
  return renderWithAtoms(<VoiceInputButton />, {
    initialValues: initialState ? [[voiceInputStateAtom, initialState]] : undefined,
  });
}

// ─── Tests ─────────────────────────────────────────────────
describe("VoiceInputButton", () => {
  describe("idle state", () => {
    it("renders microphone button", () => {
      renderButton();
      expect(screen.getByTestId("voice-input-button")).toBeInTheDocument();
      expect(screen.getByLabelText("Start voice input")).toBeInTheDocument();
    });

    it("clicking mic sends START_VOICE_INPUT", async () => {
      const { user } = renderButton();
      await user.click(screen.getByLabelText("Start voice input"));
      expect(mockPostMessage).toHaveBeenCalledWith({ type: "START_VOICE_INPUT" });
    });
  });

  describe("listening state", () => {
    it("renders listening UI with pulsing indicator", () => {
      renderButton({ status: "listening" });
      expect(screen.getByTestId("voice-input-listening")).toBeInTheDocument();
      expect(screen.getByText("Recording")).toBeInTheDocument();
    });

    it("clicking stop sends STOP_VOICE_INPUT", async () => {
      const { user } = renderButton({ status: "listening" });
      await user.click(screen.getByLabelText("Stop recording"));
      expect(mockPostMessage).toHaveBeenCalledWith({ type: "STOP_VOICE_INPUT" });
    });
  });

  describe("processing state", () => {
    it("renders processing UI", () => {
      renderButton({ status: "processing" });
      expect(screen.getByTestId("voice-input-processing")).toBeInTheDocument();
      expect(screen.getByText("Processing\u2026")).toBeInTheDocument();
    });
  });

  describe("done state", () => {
    it("renders transcript preview", () => {
      renderButton({
        status: "done",
        transcript: "create a react component",
        confidence: 0.92,
      });
      expect(screen.getByTestId("voice-input-preview")).toBeInTheDocument();
      expect(screen.getByTestId("voice-transcript-text")).toHaveTextContent(
        "create a react component",
      );
    });

    it("shows confidence percentage", () => {
      renderButton({
        status: "done",
        transcript: "hello",
        confidence: 0.87,
      });
      expect(screen.getByText("87%")).toBeInTheDocument();
    });

    it("confirm sends CONFIRM_VOICE_INPUT with transcript", async () => {
      const { user } = renderButton({
        status: "done",
        transcript: "fix the bug",
        confidence: 0.95,
      });

      await user.click(screen.getByLabelText("Confirm voice input"));
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "CONFIRM_VOICE_INPUT",
        transcript: "fix the bug",
      });
    });

    it("cancel sends STOP_VOICE_INPUT", async () => {
      const { user } = renderButton({
        status: "done",
        transcript: "some text",
      });

      await user.click(screen.getByLabelText("Cancel voice input"));
      expect(mockPostMessage).toHaveBeenCalledWith({ type: "STOP_VOICE_INPUT" });
    });

    it("confirm button is disabled when transcript is empty", () => {
      renderButton({ status: "done" });
      const confirmBtn = screen.getByLabelText("Confirm voice input");
      expect(confirmBtn).toBeDisabled();
    });

    it("shows (empty) when transcript is missing", () => {
      renderButton({ status: "done" });
      expect(screen.getByTestId("voice-transcript-text")).toHaveTextContent("(empty)");
    });
  });

  describe("state transitions via store", () => {
    it("transitions from idle to listening via store update", () => {
      const { store } = renderButton();

      expect(screen.getByTestId("voice-input-button")).toBeInTheDocument();

      act(() => {
        store.set(setVoiceInputStateAtom, { status: "listening" });
      });
      expect(screen.getByTestId("voice-input-listening")).toBeInTheDocument();
    });

    it("transitions from listening to done with transcript", () => {
      const { store } = renderButton({ status: "listening" });

      act(() => {
        store.set(setVoiceInputStateAtom, {
          status: "done",
          transcript: "build a modal",
          confidence: 0.9,
        });
      });

      expect(screen.getByTestId("voice-input-preview")).toBeInTheDocument();
      expect(screen.getByTestId("voice-transcript-text")).toHaveTextContent("build a modal");
    });
  });
});
