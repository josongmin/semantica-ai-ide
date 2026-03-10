import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PromptTemplate, PromptTemplateScope } from "../../../shared/protocol";

/** Whether the template library dialog is open */
export const templateLibraryOpenAtom = atom(false);

/** Whether the create template dialog is open */
export const createTemplateDialogOpenAtom = atom(false);

/** All prompt templates (personal + team) */
export const promptTemplatesAtom = atom<readonly PromptTemplate[]>([]);

/** Current search query for filtering templates */
export const templateSearchQueryAtom = atom("");

/** Current active tab scope filter */
export const templateScopeFilterAtom = atom<PromptTemplateScope>("personal");

/** Write-only: set prompt templates from a serverEvent */
export const setPromptTemplatesAtom = atom(
  null,
  (_get, set, templates: readonly PromptTemplate[]) => {
    set(promptTemplatesAtom, templates);
  },
);

/** Derived: templates filtered by scope and search query */
export const filteredTemplatesAtom = atom((get) => {
  const templates = get(promptTemplatesAtom);
  const scope = get(templateScopeFilterAtom);
  const query = get(templateSearchQueryAtom).toLowerCase().trim();

  let filtered = templates.filter((t) => t.scope === scope);

  if (query) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.category?.toLowerCase().includes(query) ?? false),
    );
  }

  return filtered;
});

/** Derived: unique categories from all templates */
export const templateCategoriesAtom = atom((get) => {
  const templates = get(promptTemplatesAtom);
  const categories = new Set<string>();
  for (const t of templates) {
    if (t.category) categories.add(t.category);
  }
  return Array.from(categories).sort();
});

/** Write-only: reset the prompt templates store */
export const resetPromptTemplatesStoreAtom = atom(null, (_get, set) => {
  set(templateLibraryOpenAtom, false);
  set(createTemplateDialogOpenAtom, false);
  set(promptTemplatesAtom, []);
  set(templateSearchQueryAtom, "");
  set(templateScopeFilterAtom, "personal");
});

registerResetAtom(resetPromptTemplatesStoreAtom);
