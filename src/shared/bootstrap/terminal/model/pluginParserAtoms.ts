/**
 * Plugin Parser Atoms — Jotai state for user-defined output parsers
 *
 * Manages the lifecycle of TOML-based plugin parser configs loaded
 * from `.semantica/parsers/*.toml` in the user's workspace.
 *
 * RFC-TERMINAL-013 §9 — User Plugin Parsers
 */

import { atom } from "jotai";

import type { PluginParserConfig } from "../lib/pluginParser";

// ─── Core State ─────────────────────────────────────────────

/** All loaded plugin parser configurations */
export const pluginParserConfigsAtom = atom<readonly PluginParserConfig[]>([]);

// ─── Write Atoms ────────────────────────────────────────────

/** Add or replace a plugin parser config (matched by name) */
export const upsertPluginParserAtom = atom(
  null,
  (get, set, config: PluginParserConfig) => {
    const prev = get(pluginParserConfigsAtom);
    const idx = prev.findIndex((p) => p.name === config.name);

    if (idx >= 0) {
      // Replace existing
      const next = [...prev];
      next[idx] = config;
      set(pluginParserConfigsAtom, next);
    } else {
      // Append new
      set(pluginParserConfigsAtom, [...prev, config]);
    }
  },
);

/** Remove a plugin parser by name */
export const removePluginParserAtom = atom(
  null,
  (get, set, name: string) => {
    const prev = get(pluginParserConfigsAtom);
    const next = prev.filter((p) => p.name !== name);
    set(pluginParserConfigsAtom, next);
  },
);

// ─── Derived Atoms ──────────────────────────────────────────

/** Plugin parser names for display in settings/UI */
export const pluginParserNamesAtom = atom((get) =>
  get(pluginParserConfigsAtom).map((p) => p.name),
);

/** Count of loaded plugin parsers */
export const pluginParserCountAtom = atom((get) =>
  get(pluginParserConfigsAtom).length,
);
