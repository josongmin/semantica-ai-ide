import { useEffect, useLayoutEffect, useRef } from "react";

import {
  type KeyboardClaimHandler,
  type KeyboardScopeLevel,
  registerBinding,
} from "./keyboardScope";

/**
 * Register a keyboard handler within a specific scope.
 *
 * The handler should return `true` to claim the event (prevent lower
 * scopes from seeing it) or `false`/`void` to let it pass through.
 *
 * @example
 * ```ts
 * // Global shortcut — always fires first
 * useKeyboardScope("shell", "global", (e) => {
 *   if (meta && key === "b") { toggleSidebar(); return true; }
 * });
 *
 * // Panel shortcut — only fires when agent-panel zone is focused
 * useKeyboardScope("chat-nav", "panel", handler, { panelId: "agent-panel" });
 * ```
 */
export function useKeyboardScope(
  id: string,
  scope: KeyboardScopeLevel,
  handler: KeyboardClaimHandler,
  options?: {
    panelId?: string;
    priority?: number;
    enabled?: boolean;
  },
): void {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  const panelId = options?.panelId;
  const priority = options?.priority ?? 0;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    return registerBinding({
      id,
      scope,
      panelId,
      handler: (e) => handlerRef.current(e),
      priority,
    });
  }, [id, scope, panelId, priority, enabled]);
}
