import { createStore } from "jotai";

import type { VoiceInputState } from "../../../shared/protocol";
import {
  isVoiceActiveAtom,
  resetVoiceInputStoreAtom,
  setVoiceInputStateAtom,
  voiceInputStateAtom,
  voiceTranscriptAtom,
} from "../model/voiceInputAtoms";

describe("voiceInputAtoms", () => {
  it("starts with idle state", () => {
    const store = createStore();
    const state = store.get(voiceInputStateAtom);
    expect(state.status).toBe("idle");
    expect(state.transcript).toBeUndefined();
    expect(state.confidence).toBeUndefined();
  });

  it("setVoiceInputStateAtom updates the state", () => {
    const store = createStore();
    const newState: VoiceInputState = {
      status: "listening",
    };
    store.set(setVoiceInputStateAtom, newState);

    const state = store.get(voiceInputStateAtom);
    expect(state.status).toBe("listening");
  });

  it("setVoiceInputStateAtom sets transcript and confidence", () => {
    const store = createStore();
    const newState: VoiceInputState = {
      status: "done",
      transcript: "create a new component",
      confidence: 0.95,
    };
    store.set(setVoiceInputStateAtom, newState);

    const state = store.get(voiceInputStateAtom);
    expect(state.status).toBe("done");
    expect(state.transcript).toBe("create a new component");
    expect(state.confidence).toBe(0.95);
  });

  it("isVoiceActiveAtom returns true when listening", () => {
    const store = createStore();
    store.set(setVoiceInputStateAtom, { status: "listening" });
    expect(store.get(isVoiceActiveAtom)).toBe(true);
  });

  it("isVoiceActiveAtom returns true when processing", () => {
    const store = createStore();
    store.set(setVoiceInputStateAtom, { status: "processing" });
    expect(store.get(isVoiceActiveAtom)).toBe(true);
  });

  it("isVoiceActiveAtom returns false when idle", () => {
    const store = createStore();
    expect(store.get(isVoiceActiveAtom)).toBe(false);
  });

  it("isVoiceActiveAtom returns false when done", () => {
    const store = createStore();
    store.set(setVoiceInputStateAtom, { status: "done", transcript: "hello" });
    expect(store.get(isVoiceActiveAtom)).toBe(false);
  });

  it("voiceTranscriptAtom returns transcript or empty string", () => {
    const store = createStore();
    expect(store.get(voiceTranscriptAtom)).toBe("");

    store.set(setVoiceInputStateAtom, { status: "done", transcript: "test transcript" });
    expect(store.get(voiceTranscriptAtom)).toBe("test transcript");
  });

  it("voiceTranscriptAtom returns empty string when no transcript", () => {
    const store = createStore();
    store.set(setVoiceInputStateAtom, { status: "listening" });
    expect(store.get(voiceTranscriptAtom)).toBe("");
  });

  it("resetVoiceInputStoreAtom resets to idle", () => {
    const store = createStore();
    store.set(setVoiceInputStateAtom, {
      status: "done",
      transcript: "some text",
      confidence: 0.9,
    });

    store.set(resetVoiceInputStoreAtom);

    const state = store.get(voiceInputStateAtom);
    expect(state.status).toBe("idle");
    expect(state.transcript).toBeUndefined();
    expect(state.confidence).toBeUndefined();
  });

  it("state transitions: idle -> listening -> processing -> done", () => {
    const store = createStore();

    expect(store.get(voiceInputStateAtom).status).toBe("idle");

    store.set(setVoiceInputStateAtom, { status: "listening" });
    expect(store.get(voiceInputStateAtom).status).toBe("listening");

    store.set(setVoiceInputStateAtom, { status: "processing" });
    expect(store.get(voiceInputStateAtom).status).toBe("processing");

    store.set(setVoiceInputStateAtom, {
      status: "done",
      transcript: "final text",
      confidence: 0.88,
    });
    expect(store.get(voiceInputStateAtom).status).toBe("done");
    expect(store.get(voiceTranscriptAtom)).toBe("final text");
  });
});
