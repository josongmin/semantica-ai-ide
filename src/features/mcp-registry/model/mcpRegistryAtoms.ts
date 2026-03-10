/**
 * MCP Registry atoms.
 *
 * Tracks the MCP server registry for browsing and installing MCP servers.
 * Provides search and category filtering for the registry browser widget.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { McpRegistryEntry } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** All registry entries keyed by id */
export const mcpRegistryAtom = atom<ReadonlyMap<string, McpRegistryEntry>>(new Map());

/** Write-only: replace/merge registry entries from a serverEvent payload */
export const setMcpRegistryAtom = atom(null, (get, set, entries: readonly McpRegistryEntry[]) => {
  const existing = new Map(get(mcpRegistryAtom));
  for (const entry of entries) {
    existing.set(entry.id, entry);
  }
  set(mcpRegistryAtom, existing);
});

// ─── Filter State ────────────────────────────────────────────

/** Search query for filtering the registry */
export const registrySearchQueryAtom = atom("");

/** Selected category filter (empty = all) */
export const registryCategoryFilterAtom = atom("");

// ─── Derived ─────────────────────────────────────────────────

/** Derived: all unique categories from registry entries */
export const registryCategoriesAtom = atom((get) => {
  const map = get(mcpRegistryAtom);
  const cats = new Set<string>();
  for (const entry of map.values()) {
    for (const cat of entry.categories) {
      cats.add(cat);
    }
  }
  return Array.from(cats).sort();
});

/** Derived: filtered registry entries based on search query and category */
export const filteredRegistryEntriesAtom = atom((get) => {
  const map = get(mcpRegistryAtom);
  const query = get(registrySearchQueryAtom).toLowerCase().trim();
  const category = get(registryCategoryFilterAtom);

  let entries = Array.from(map.values());

  if (category) {
    entries = entries.filter((e) => e.categories.includes(category));
  }

  if (query) {
    entries = entries.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.author.toLowerCase().includes(query),
    );
  }

  return entries.sort((a, b) => b.rating - a.rating);
});

/** Write-only: toggle installed status locally (optimistic update) */
export const toggleMcpInstallAtom = atom(null, (get, set, serverId: string) => {
  const map = new Map(get(mcpRegistryAtom));
  const entry = map.get(serverId);
  if (entry) {
    map.set(serverId, { ...entry, installed: !entry.installed });
    set(mcpRegistryAtom, map);
  }
});

/** Write-only: reset registry state */
export const resetMcpRegistryAtom = atom(null, (_get, set) => {
  set(mcpRegistryAtom, new Map());
  set(registrySearchQueryAtom, "");
  set(registryCategoryFilterAtom, "");
});

registerResetAtom(resetMcpRegistryAtom);
