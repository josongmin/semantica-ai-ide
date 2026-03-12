import { atom } from "jotai";

// ─── Constants ────────────────────────────────────────────

export const MAX_OUTPUT_LINES = 5000;
export const RETAINED_LINES = 4000;

// ─── Output Channel Model ────────────────────────────────

export interface OutputLine {
  readonly text: string;
  readonly level: "info" | "warn" | "error" | "debug";
  readonly channel: string;
  readonly timestamp: number;
}

/** Global output lines atom — append from anywhere via useSetAtom */

export const outputLinesAtom = atom<OutputLine[]>([]);

export const appendOutputLineAtom = atom(null, (get, set, line: OutputLine) => {
  const prev = get(outputLinesAtom);
  const next =
    prev.length >= MAX_OUTPUT_LINES ? [...prev.slice(-RETAINED_LINES), line] : [...prev, line];
  set(outputLinesAtom, next);
});
