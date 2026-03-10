import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  FOCUS_PROMPT_EVENT,
  OPEN_COMMAND_PALETTE_EVENT,
} from "~shared/bootstrap/keyboard-navigation";

import { promptPrefillAtom } from "../../../shared/lib";

/** Max textarea auto-grow height in pixels */
const MAX_TEXTAREA_HEIGHT = 200;

/**
 * Manages textarea text state, refs, auto-resize logic,
 * prompt prefill, and global focus / command-palette events.
 */
export function useTextareaResize(handleOpenCommandsFn?: () => void) {
  const [text, setText] = useState("");
  const textRef = useRef(text);
  useLayoutEffect(() => {
    textRef.current = text;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /** Recalculate textarea height based on content. */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)  }px`;
  }, []);

  /** Reset textarea height to auto (after send / clear). */
  const resetTextareaHeight = useCallback(() => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, []);

  // ─── Prefill side-effect ───────────────────────────────
  const prefill = useAtomValue(promptPrefillAtom);
  const setPrefill = useSetAtom(promptPrefillAtom);
  useEffect(() => {
    if (prefill) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing external atom → local state
      setText(prefill);
      setPrefill(null);
      textareaRef.current?.focus();
    }
  }, [prefill, setPrefill]);

  // ─── Global DOM events ────────────────────────────────
  const cmdRef = useRef(handleOpenCommandsFn);
  useLayoutEffect(() => {
    cmdRef.current = handleOpenCommandsFn;
  });

  useEffect(() => {
    const onCmd = () => cmdRef.current?.();
    const onFocus = () => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    };
    document.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onCmd);
    document.addEventListener(FOCUS_PROMPT_EVENT, onFocus);
    return () => {
      document.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onCmd);
      document.removeEventListener(FOCUS_PROMPT_EVENT, onFocus);
    };
  }, []);

  return { text, setText, textRef, textareaRef, containerRef, resizeTextarea, resetTextareaHeight };
}
