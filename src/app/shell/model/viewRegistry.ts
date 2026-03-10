import type { ComponentType, LazyExoticComponent } from "react";

// ─── View Registry (RFC-016 §4.1) ─────────────────────────────
//
// Empty Map + registerView() API.
// Each feature self-registers at module scope in its index.ts.
// Frame components query views via getViewsForFrame().

export type ViewKind = "panel" | "surface";

export type FrameSlot = "dock-left" | "dock-right" | "tray" | "floating";

export type PersistenceScope = "none" | "session" | "workspace" | "global";

export interface ViewCommand {
  readonly id: string;
  readonly label: string;
  readonly shortcut?: string;
}

export interface ViewDefinition {
  readonly id: string;
  readonly kind: ViewKind;
  readonly title: string;
  readonly icon: string;
  readonly frames: readonly FrameSlot[];
  readonly defaultFrame: FrameSlot;
  readonly shortcut?: string;
  readonly component: LazyExoticComponent<ComponentType>;
  readonly priority?: number;
  readonly availability?: () => boolean;
  readonly singleton?: boolean;
  readonly restorable?: boolean;
  readonly detachable?: boolean;
  readonly preload?: boolean;
  readonly persistence?: PersistenceScope;
  readonly commands?: readonly ViewCommand[];
}

// ─── Registry Store ──────────────────────────────────────────

const views = new Map<string, ViewDefinition>();

export function registerView(def: ViewDefinition): void {
  if (views.has(def.id)) {
    throw new Error(`[ViewRegistry] View "${def.id}" already registered`);
  }
  views.set(def.id, def);
}

export function getViewsForFrame(frame: FrameSlot): readonly ViewDefinition[] {
  return [...views.values()]
    .filter((v) => v.frames.includes(frame))
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

export function getViewById(id: string): ViewDefinition | undefined {
  return views.get(id);
}

export function getAllViews(): readonly ViewDefinition[] {
  return [...views.values()];
}
