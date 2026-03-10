import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { promptPrefillAtom } from "../../../shared/lib/atoms/uiAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { PromptTemplateScope } from "../../../shared/protocol";
import {
  createTemplateDialogOpenAtom,
  filteredTemplatesAtom,
  promptTemplatesAtom,
  templateCategoriesAtom,
  templateLibraryOpenAtom,
  templateScopeFilterAtom,
  templateSearchQueryAtom,
} from "./promptTemplateAtoms";

/**
 * Hook for prompt template functionality.
 * Provides template browsing, searching, applying, creating, and deleting.
 */
export function usePromptTemplate() {
  const allTemplates = useAtomValue(promptTemplatesAtom);
  const filteredTemplates = useAtomValue(filteredTemplatesAtom);
  const categories = useAtomValue(templateCategoriesAtom);
  const [libraryOpen, setLibraryOpen] = useAtom(templateLibraryOpenAtom);
  const [createDialogOpen, setCreateDialogOpen] = useAtom(createTemplateDialogOpenAtom);
  const [scopeFilter, setScopeFilter] = useAtom(templateScopeFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(templateSearchQueryAtom);
  const setPromptPrefill = useSetAtom(promptPrefillAtom);

  const openLibrary = useCallback(() => {
    setLibraryOpen(true);
    // Request fresh templates when opening the library
    getVscodeApi().postMessage({ type: "LOAD_PROMPT_TEMPLATES" });
  }, [setLibraryOpen]);

  const closeLibrary = useCallback(() => setLibraryOpen(false), [setLibraryOpen]);

  const openCreateDialog = useCallback(() => setCreateDialogOpen(true), [setCreateDialogOpen]);
  const closeCreateDialog = useCallback(() => setCreateDialogOpen(false), [setCreateDialogOpen]);

  /** Apply a template by ID: fills the prompt box with the template text */
  const applyTemplate = useCallback(
    (id: string) => {
      const template = allTemplates.find((t) => t.id === id);
      if (template) {
        setPromptPrefill(template.template);
        setLibraryOpen(false);
      }
      getVscodeApi().postMessage({ type: "APPLY_PROMPT_TEMPLATE", template_id: id });
    },
    [allTemplates, setPromptPrefill, setLibraryOpen],
  );

  /** Save a new template */
  const saveTemplate = useCallback(
    (data: {
      name: string;
      description: string;
      template: string;
      scope: PromptTemplateScope;
      category?: string;
    }) => {
      getVscodeApi().postMessage({
        type: "SAVE_PROMPT_TEMPLATE",
        template: data,
      });
      setCreateDialogOpen(false);
    },
    [setCreateDialogOpen],
  );

  /** Delete a template by ID */
  const deleteTemplate = useCallback((id: string) => {
    getVscodeApi().postMessage({
      type: "DELETE_PROMPT_TEMPLATE",
      template_id: id,
    });
  }, []);

  return {
    // State
    allTemplates,
    filteredTemplates,
    categories,
    libraryOpen,
    createDialogOpen,
    scopeFilter,
    searchQuery,
    // Actions
    openLibrary,
    closeLibrary,
    openCreateDialog,
    closeCreateDialog,
    setScopeFilter,
    setSearchQuery,
    applyTemplate,
    saveTemplate,
    deleteTemplate,
  };
}
