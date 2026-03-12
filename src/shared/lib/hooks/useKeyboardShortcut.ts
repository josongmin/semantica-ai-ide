import { useEffect, useLayoutEffect, useRef } from "react";

import { IS_MAC } from "./usePlatform";

// ─── Types ───────────────────────────────────────────────

export interface KeyboardShortcutOptions {
  /** Whether the shortcut is active. Defaults to true. */
  enabled?: boolean;
  /** Scope element — listener attaches here instead of document. */
  scope?: HTMLElement | null;
}

// ─── Shortcut Parser ─────────────────────────────────────

interface ParsedShortcut {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

function parseShortcut(shortcut: string): ParsedShortcut | null {
  const parts = shortcut.toLowerCase().trim().split("+");
  const key = parts.pop()?.trim() ?? "";
  if (!key) return null;
  return {
    mod: parts.includes("mod"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    key,
  };
}

function matchesShortcut(e: KeyboardEvent, parsed: ParsedShortcut): boolean {
  const modKey = IS_MAC ? e.metaKey : e.ctrlKey;
  if (parsed.mod && !modKey) return false;
  if (!parsed.mod && modKey) return false;
  if (parsed.shift !== e.shiftKey) return false;
  if (parsed.alt !== e.altKey) return false;
  return e.key.toLowerCase() === parsed.key;
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Attach a keyboard shortcut listener.
 *
 * Shortcut format: `"mod+f"`, `"mod+k"`, `"Escape"`, `"mod+shift+p"`.
 * `"mod"` maps to Meta on macOS, Ctrl elsewhere.
 *
 * The handler receives `preventDefault()` and `stopPropagation()` automatically.
 * If a `scope` element is provided, the listener attaches to it; otherwise falls
 * back to `document`.
 */
export function useKeyboardShortcut(
  shortcut: string,
  handler: () => void,
  options: KeyboardShortcutOptions = {},
): void {
  const { enabled = true, scope } = options;

  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  const parsedRef = useRef<ParsedShortcut | null>(parseShortcut(shortcut));
  useLayoutEffect(() => {
    parsedRef.current = parseShortcut(shortcut);
  });

  useEffect(() => {
    if (!enabled) return;

    const target: EventTarget = scope ?? document;

    const onKeyDown = (e: Event) => {
      const parsed = parsedRef.current;
      if (!parsed) return;
      const ke = e as KeyboardEvent;
      if (!matchesShortcut(ke, parsed)) return;
      ke.preventDefault();
      ke.stopPropagation();
      handlerRef.current();
    };

    target.addEventListener("keydown", onKeyDown);
    return () => target.removeEventListener("keydown", onKeyDown);
  }, [enabled, scope]);
}
