/**
 * Barrel that re-exports and merges all language family packs into the
 * unified LANGUAGES and EXTENSION_MAP registries.
 */

import type { LanguageSpec } from "../languageSpecs";
import { dataExtensions,dataLanguages } from "./data";
import { functionalExtensions,functionalLanguages } from "./functional";
import { miscExtensions,miscLanguages } from "./misc";
import { scriptingExtensions,scriptingLanguages } from "./scripting";
import { systemsExtensions,systemsLanguages } from "./systems";
import {
  systemsModernExtensions,
  systemsModernLanguages,
} from "./systems-modern";
import { webExtensions,webLanguages } from "./web";

// ---------------------------------------------------------------------------
// Merged language registry
// ---------------------------------------------------------------------------

export const LANGUAGES: Record<string, LanguageSpec> = {
  ...systemsLanguages,
  ...systemsModernLanguages,
  ...scriptingLanguages,
  ...functionalLanguages,
  ...webLanguages,
  ...dataLanguages,
  ...miscLanguages,
};

// ---------------------------------------------------------------------------
// Merged extension map (includes both extended and core language mappings)
// ---------------------------------------------------------------------------

export const EXTENSION_MAP: Record<string, string> = {
  // Core languages (from syntaxHighlight.ts)
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  py: "py",
  rs: "rs",
  go: "go",

  // Extended languages
  ...systemsExtensions,
  ...systemsModernExtensions,
  ...scriptingExtensions,
  ...functionalExtensions,
  ...webExtensions,
  ...dataExtensions,
  ...miscExtensions,
};

// Re-export family packs for selective imports
export { dataExtensions,dataLanguages } from "./data";
export { functionalExtensions,functionalLanguages } from "./functional";
export { miscExtensions,miscLanguages } from "./misc";
export { scriptingExtensions,scriptingLanguages } from "./scripting";
export { systemsExtensions,systemsLanguages } from "./systems";
export {
  systemsModernExtensions,
  systemsModernLanguages,
} from "./systems-modern";
export { webExtensions,webLanguages } from "./web";
