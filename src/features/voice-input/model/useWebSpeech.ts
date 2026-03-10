/**
 * Client-side Web Speech API hook.
 * Uses browser SpeechRecognition + AudioContext for real-time transcript & waveform.
 * Falls back to postMessage when SpeechRecognition is unavailable (e.g. real extension host).
 */
import { useCallback, useEffect, useRef } from "react";
import { useSetAtom } from "jotai";

import { getVscodeApi } from "../../../shared/lib";
import {
  resetVoiceInputStoreAtom,
  setVoiceInputStateAtom,
  setVoiceOverlayRequestedAtom,
  voiceWaveformLevelsAtom,
} from "./voiceInputAtoms";

// Web Speech API type declarations (not yet in all TS DOM libs)
interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResults {
  readonly length: number;
  [index: number]: SpeechRecognitionResultList;
}

interface WebSpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResults;
}

interface WebSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: WebSpeechRecognitionConstructor;
  webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
}

// Vendor-prefixed SpeechRecognition
const SpeechRecognitionCtor: WebSpeechRecognitionConstructor | undefined =
  typeof window !== "undefined"
    ? ((window as SpeechRecognitionWindow).SpeechRecognition ??
      (window as SpeechRecognitionWindow).webkitSpeechRecognition)
    : undefined;

const WAVEFORM_BARS = 16;
const WAVEFORM_FPS = 30;

interface WebSpeechRefs {
  recognition: WebSpeechRecognition | null;
  audioCtx: AudioContext | null;
  analyser: AnalyserNode | null;
  stream: MediaStream | null;
  waveformRaf: number | null;
  stopTimer: ReturnType<typeof setTimeout> | null;
  lastTranscript: string;
}

export function useWebSpeech() {
  const setState = useSetAtom(setVoiceInputStateAtom);
  const resetState = useSetAtom(resetVoiceInputStoreAtom);
  const setOverlayRequested = useSetAtom(setVoiceOverlayRequestedAtom);
  const setWaveform = useSetAtom(voiceWaveformLevelsAtom);
  const refs = useRef<WebSpeechRefs>({
    recognition: null,
    audioCtx: null,
    analyser: null,
    stream: null,
    waveformRaf: null,
    stopTimer: null,
    lastTranscript: "",
  });

  const stopWaveform = useCallback(() => {
    if (refs.current.waveformRaf !== null) {
      cancelAnimationFrame(refs.current.waveformRaf);
      refs.current.waveformRaf = null;
    }
    refs.current.stream?.getTracks().forEach((t) => t.stop());
    refs.current.stream = null;
    refs.current.analyser = null;
    if (refs.current.audioCtx?.state !== "closed") {
      void refs.current.audioCtx?.close();
    }
    refs.current.audioCtx = null;
    setWaveform(new Array<number>(WAVEFORM_BARS).fill(0));
  }, [setWaveform]);

  const startWaveform = useCallback(
    (stream: MediaStream) => {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      refs.current.audioCtx = audioCtx;
      refs.current.analyser = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastTime = 0;
      const interval = 1000 / WAVEFORM_FPS;

      function tick(time: number) {
        if (!refs.current.analyser) return;
        refs.current.waveformRaf = requestAnimationFrame(tick);
        if (time - lastTime < interval) return;
        lastTime = time;
        refs.current.analyser.getByteFrequencyData(dataArray);
        const levels: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / WAVEFORM_BARS));
        for (let i = 0; i < WAVEFORM_BARS; i++) {
          levels.push((dataArray[i * step] ?? 0) / 255);
        }
        setWaveform(levels);
      }
      refs.current.waveformRaf = requestAnimationFrame(tick);
    },
    [setWaveform],
  );

  const start = useCallback(async () => {
    setOverlayRequested(true); // Show overlay immediately; prevents flash-close from batched state
    // No SpeechRecognition → fall back to extension host
    if (!SpeechRecognitionCtor) {
      getVscodeApi().postMessage({ type: "START_VOICE_INPUT" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      refs.current.stream = stream;

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      refs.current.recognition = recognition;

      recognition.onresult = (event: WebSpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) { // eslint-disable-line @typescript-eslint/prefer-for-of -- SpeechRecognitionResults is not iterable
          transcript += event.results[i]?.[0]?.transcript ?? "";
        }
        refs.current.lastTranscript = transcript;
        const confidence = event.results[event.results.length - 1]?.[0]?.confidence ?? 0;
        setState({ status: "listening", transcript, confidence });
      };

      recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
        if (event.error === "aborted") return; // intentional stop
        refs.current.recognition = null;
        stopWaveform();
        // Don't set idle — keep overlay open until user stops; state stays listening
      };

      recognition.onend = () => {
        // If still "listening" when recognition ends (e.g. silence timeout), stop gracefully
        stopWaveform();
      };

      recognition.start();
      setState({ status: "listening" });
      startWaveform(stream);
    } catch {
      // Mic permission denied or error — fall back
      getVscodeApi().postMessage({ type: "START_VOICE_INPUT" });
    }
  }, [setOverlayRequested, setState, startWaveform, stopWaveform]);

  const stop = useCallback(() => {
    if (SpeechRecognitionCtor) {
      if (refs.current.recognition) {
        refs.current.recognition.stop();
        refs.current.recognition = null;
      }
      stopWaveform();
      const transcript = refs.current.lastTranscript;
      setState({ status: "processing", transcript });
      if (refs.current.stopTimer !== null) clearTimeout(refs.current.stopTimer);
      refs.current.stopTimer = setTimeout(() => setState({ status: "done", transcript }), 300);
    } else {
      getVscodeApi().postMessage({ type: "STOP_VOICE_INPUT" });
    }
  }, [stopWaveform, setState]);

  const cancel = useCallback(() => {
    if (refs.current.recognition) {
      refs.current.recognition.abort();
      refs.current.recognition = null;
      stopWaveform();
      resetState();
    } else {
      // No active client-side recognition — delegate to extension host
      getVscodeApi().postMessage({ type: "STOP_VOICE_INPUT" });
    }
  }, [stopWaveform, resetState]);

  // Cleanup on unmount
  useEffect(() => {
    const r = refs;
    return () => {
      r.current.recognition?.abort();
      if (r.current.stopTimer !== null) clearTimeout(r.current.stopTimer);
      stopWaveform();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { start, stop, cancel };
}
