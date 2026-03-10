import React, { useCallback } from "react";

import { usePromptTemplate } from "../../features/prompt-templates";
import type { PromptTemplateScope } from "../../shared/protocol";
import { Button, Dialog, Icon, Tabs, Text } from "../../shared/ui";
import { CreateTemplateForm } from "./CreateTemplateForm";
import { TemplateCard } from "./TemplateCard";

// ─── Main Library Widget ──────────────────────────────────────

/**
 * Prompt Template Library widget.
 * Tab layout with Personal/Team tabs, search, template list, and create form.
 */
export const PromptTemplateLibrary = React.memo(function PromptTemplateLibrary() {
  const {
    filteredTemplates,
    libraryOpen,
    createDialogOpen,
    scopeFilter,
    searchQuery,
    closeLibrary,
    openCreateDialog,
    closeCreateDialog,
    setScopeFilter,
    setSearchQuery,
    applyTemplate,
    saveTemplate,
    deleteTemplate,
  } = usePromptTemplate();

  const handleTabChange = useCallback(
    (id: string) => {
      setScopeFilter(id as PromptTemplateScope);
    },
    [setScopeFilter],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );

  if (!libraryOpen) return null;

  const tabs = [
    { id: "personal", label: "Personal" },
    { id: "team", label: "Team" },
  ];

  return (
    <Dialog
      open={libraryOpen}
      onClose={closeLibrary}
      title="Prompt Templates"
      data-testid="prompt-template-library"
    >
      <div className="flex flex-col gap-3 p-4 min-w-[min(400px,calc(100vw-2rem))] max-h-[60vh]">
        {createDialogOpen ? (
          <CreateTemplateForm onSave={saveTemplate} onCancel={closeCreateDialog} />
        ) : (
          <>
            {/* Tabs */}
            <Tabs tabs={tabs} activeId={scopeFilter} onTabChange={handleTabChange} />

            {/* Search + Create */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Icon
                  name="search"
                  tokenSize="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-vsc-text-tertiary"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-7 pr-2 py-1.5 text-xs rounded border border-vsc-panel-border bg-vsc-input-bg text-vsc-input-fg focus:border-vsc-focusBorder outline-none"
                  placeholder="Search templates..."
                  data-testid="template-search-input"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateDialog}
                data-testid="create-template-button"
              >
                <Icon name="add" tokenSize="sm" />
                Create
              </Button>
            </div>

            {/* Template list */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[40vh]">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Icon name="notebook" tokenSize="sm" className="text-vsc-text-tertiary" />
                  <Text size="xs" tone="tertiary">
                    {searchQuery
                      ? "No templates match your search"
                      : `No ${scopeFilter} templates yet`}
                  </Text>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onApply={applyTemplate}
                    onDelete={deleteTemplate}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Footer */}
        {!createDialogOpen && (
          <div className="flex justify-end pt-2 border-t border-vsc-panel-border">
            <Button variant="ghost" size="sm" onClick={closeLibrary}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
});
