import type { ComponentType, LazyExoticComponent } from "react";

import type { SurfaceId } from "../shared/protocol/types/ui";
import type { PersistenceScope } from "./shell/model/viewRegistry";

// ─── Surface Layout Config ──────────────────────────────────
//
// Declares which shell frames a surface *allows*.
// `true` = frame can be shown; `false` = frame is always hidden on this surface.
// Omitted fields default to `true` (all frames allowed).

export interface SurfaceLayout {
  readonly sidebar?: boolean;
  readonly agent?: boolean;
  readonly tray?: boolean;
}

const DEFAULT_LAYOUT: Readonly<Required<SurfaceLayout>> = {
  sidebar: true,
  agent: true,
  tray: true,
};

/** Resolves partial layout to full layout with defaults. */
export function resolveSurfaceLayout(layout?: SurfaceLayout): Readonly<Required<SurfaceLayout>> {
  if (!layout) return DEFAULT_LAYOUT;
  return { ...DEFAULT_LAYOUT, ...layout };
}

// ─── Surface Registry (RFC-016 §4.2) ──────────────────────────
//
// Empty Map + registerSurface() API.
// Each surface self-registers at module scope in its index.ts.
// SurfaceRouter and TitleBar query surfaces via getAllSurfaces().

export interface SurfaceDefinition {
  readonly id: SurfaceId;
  readonly label: string;
  readonly icon: string;
  readonly component: LazyExoticComponent<ComponentType>;
  readonly priority?: number;
  readonly persistence?: PersistenceScope;
  /** Per-surface frame visibility constraints. Omitted = all frames allowed. */
  readonly layout?: SurfaceLayout;
}

// ─── Registry Store ──────────────────────────────────────────

const surfaces = new Map<SurfaceId, SurfaceDefinition>();

export function registerSurface(def: SurfaceDefinition): void {
  if (surfaces.has(def.id)) {
    throw new Error(`[SurfaceRegistry] Surface "${def.id}" already registered`);
  }
  surfaces.set(def.id, def);
}

export function getSurface(id: SurfaceId): SurfaceDefinition | undefined {
  return surfaces.get(id);
}

export function getAllSurfaces(): readonly SurfaceDefinition[] {
  return [...surfaces.values()].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

/** Get resolved layout for a surface. Returns all-true default if surface not found. */
export function getSurfaceLayout(id: SurfaceId): Readonly<Required<SurfaceLayout>> {
  const def = surfaces.get(id);
  return resolveSurfaceLayout(def?.layout);
}
