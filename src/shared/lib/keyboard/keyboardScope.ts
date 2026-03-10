/**
 * Centralized keyboard scope dispatcher.
 *
 * Replaces per-hook addEventListener calls with a single capture-phase
 * listener that routes events through priority-ordered scopes:
 *
 *   overlay (highest) → panel (active zone) → global (fallback)
 *
 * Active panel gets first crack at the event. If the panel doesn't
 * claim it, the event falls through to global shell shortcuts.
 * Overlays (dialogs, palettes) trump everything when active.
 *
 * When a handler "claims" an event (returns true), lower-priority
 * scopes never see it — fixing the "simultaneous shortcut" problem.
 */

// ── Types ──────────────────────────────────────────────────

export type KeyboardScopeLevel = "global" | "overlay" | "panel";

export type KeyboardClaimHandler = (e: KeyboardEvent) => boolean | undefined;

export interface KeyboardBinding {
  readonly id: string;
  readonly scope: KeyboardScopeLevel;
  /** For panel scope: only fires when this zone is active (matches data-keyboard-zone) */
  readonly panelId?: string;
  readonly handler: KeyboardClaimHandler;
  /** Higher number = higher priority within same scope (default 0) */
  readonly priority: number;
}

// ── Internal state ─────────────────────────────────────────

const bindings = new Map<string, KeyboardBinding>();
let _overlayActive = false;
let _installed = false;

// Dispatch order: overlay first → panel (context-aware) → global (fallback)
const SCOPE_ORDER: Record<KeyboardScopeLevel, number> = {
  overlay: 0,
  panel: 1,
  global: 2,
};

// ── Zone detection ─────────────────────────────────────────

/**
 * Walk up from document.activeElement to find the closest
 * ancestor with `data-keyboard-zone="..."`. Returns null if
 * no zone wrapper is found (e.g., body focus).
 */
function getActiveZone(): string | null {
  let el = document.activeElement as HTMLElement | null;
  while (el && el !== document.body) {
    const zone = el.dataset.keyboardZone;
    if (zone) return zone;
    el = el.parentElement;
  }
  return null;
}

// ── Dispatcher ─────────────────────────────────────────────

function dispatch(e: KeyboardEvent) {
  // Sort bindings: overlay first, then panel (active zone), then global.
  // Within same scope, higher priority first.
  const sorted = [...bindings.values()].sort((a, b) => {
    const scopeDiff = SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope];
    return scopeDiff !== 0 ? scopeDiff : b.priority - a.priority;
  });

  const activeZone = getActiveZone();

  for (const binding of sorted) {
    // Skip overlay handlers when no overlay is active
    if (binding.scope === "overlay" && !_overlayActive) continue;

    // Skip panel handlers when overlay is active (overlay blocks panels)
    if (binding.scope === "panel" && _overlayActive) continue;

    // Skip panel handlers whose zone doesn't match
    if (binding.scope === "panel" && binding.panelId && binding.panelId !== activeZone) continue;

    const claimed = binding.handler(e);
    if (claimed) {
      // Handler claimed the event — stop all further processing
      return;
    }
  }
}

function install() {
  if (_installed) return;
  _installed = true;
  window.addEventListener("keydown", dispatch, true); // capture phase
}

// ── Public API ─────────────────────────────────────────────

/**
 * Register a keyboard binding. Returns an unregister function.
 */
export function registerBinding(
  binding: Omit<KeyboardBinding, "priority"> & { priority?: number },
): () => void {
  const full: KeyboardBinding = { ...binding, priority: binding.priority ?? 0 };
  bindings.set(binding.id, full);
  install();
  return () => {
    bindings.delete(binding.id);
  };
}

/** Tell the dispatcher whether an overlay (dialog/dropdown/palette) is active. */
export function setOverlayActive(active: boolean): void {
  _overlayActive = active;
}

/** Read current overlay state (for testing). */
export function getOverlayActive(): boolean {
  return _overlayActive;
}

/** Number of registered bindings (for testing). */
export function getBindingCount(): number {
  return bindings.size;
}

/** Reset all state (for testing only). */
export function resetKeyboardScope(): void {
  bindings.clear();
  _overlayActive = false;
  if (_installed) {
    window.removeEventListener("keydown", dispatch, true);
    _installed = false;
  }
}
