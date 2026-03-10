import React, { useCallback, useState } from "react";
import { useAtom, useAtomValue } from "jotai";

import {
  activeContextSpacesAtom,
  contextSpacePanelOpenAtom,
  contextSpacesListAtom,
} from "../../features/context-spaces";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { ContextSpace } from "../../shared/protocol";
import { Badge, Button, cn, EmptyState, Icon, Text } from "../../shared/ui";

// ─── Create Space Form ───────────────────────────────────────

interface CreateSpaceFormProps {
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
}

const CreateSpaceForm = React.memo(function CreateSpaceForm({
  onSubmit,
  onCancel,
}: CreateSpaceFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onSubmit(name.trim(), description.trim());
      }
    },
    [name, description, onSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-2 border border-vsc-border rounded bg-vsc-bg-secondary"
      data-testid="create-space-form"
    >
      <input
        type="text"
        placeholder="Space name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-2 py-1 text-sm rounded border border-vsc-border bg-vsc-bg text-vsc-text placeholder:text-vsc-text-tertiary focus:outline-none focus:border-vsc-focus"
        aria-label="Space name"
        autoFocus
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="px-2 py-1 text-sm rounded border border-vsc-border bg-vsc-bg text-vsc-text placeholder:text-vsc-text-tertiary focus:outline-none focus:border-vsc-focus"
        aria-label="Space description"
      />
      <div className="flex items-center gap-1 justify-end">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={!name.trim()}>
          Create
        </Button>
      </div>
    </form>
  );
});

// ─── Space Row ───────────────────────────────────────────────

interface SpaceRowProps {
  space: ContextSpace;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const SpaceRow = React.memo(function SpaceRow({ space, onToggle, onDelete }: SpaceRowProps) {
  const handleToggle = useCallback(() => onToggle(space.id), [space.id, onToggle]);
  const handleDelete = useCallback(() => onDelete(space.id), [space.id, onDelete]);

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded border border-vsc-border",
        "bg-vsc-bg-secondary hover:bg-vsc-bg-tertiary transition-colors duration-fast",
        space.active && "border-l-2 border-l-vsc-success",
      )}
      data-testid={`context-space-row-${space.id}`}
      role="listitem"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Text size="sm" weight="medium" className="truncate min-w-0">
            {space.name}
          </Text>
          <Badge
            text={space.active ? "Active" : "Inactive"}
            variant={space.active ? "success" : "default"}
          />
        </div>
        {space.description && (
          <Text size="xs" tone="secondary" className="mt-0.5 truncate min-w-0">
            {space.description}
          </Text>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Text size="2xs" tone="tertiary">
            {space.files.length} {space.files.length === 1 ? "file" : "files"}
          </Text>
          {space.rules.length > 0 && (
            <Text size="2xs" tone="tertiary">
              {space.rules.length} {space.rules.length === 1 ? "rule" : "rules"}
            </Text>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          aria-label={space.active ? `Deactivate ${space.name}` : `Activate ${space.name}`}
        >
          <Icon name={space.active ? "eye" : "eye-closed"} tokenSize="2xs" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          aria-label={`Delete ${space.name}`}
        >
          <Icon name="trash" tokenSize="2xs" />
        </Button>
      </div>
    </div>
  );
});

// ─── Context Space Panel ─────────────────────────────────────

/**
 * Context Space Panel: Manage shared context bundles.
 * Lists context spaces with toggle, create, and delete controls.
 */
export const ContextSpacePanel = React.memo(function ContextSpacePanel() {
  const [panelOpen, setPanelOpen] = useAtom(contextSpacePanelOpenAtom);
  const spaces = useAtomValue(contextSpacesListAtom);
  const activeSpaces = useAtomValue(activeContextSpacesAtom);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  const handleCreateSpace = useCallback((name: string, description: string) => {
    getVscodeApi().postMessage({ type: "CREATE_CONTEXT_SPACE", name, description });
    setShowCreateForm(false);
  }, []);

  const handleToggle = useCallback((id: string) => {
    getVscodeApi().postMessage({
      type: "UPDATE_CONTEXT_SPACE",
      space_id: id,
      updates: { toggle_active: true },
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    getVscodeApi().postMessage({ type: "DELETE_CONTEXT_SPACE", space_id: id });
  }, []);

  if (!panelOpen) return null;

  return (
    <div
      className="flex flex-col gap-2 p-3 border-b border-vsc-border bg-vsc-bg"
      data-testid="context-space-panel"
      role="region"
      aria-label="Context Spaces"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="library" tokenSize="sm" className="text-vsc-text-secondary" />
          <Text size="sm" weight="semibold">
            Context Spaces
          </Text>
          {activeSpaces.length > 0 && (
            <Badge text={`${activeSpaces.length} active`} variant="success" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            aria-label="Create Space"
          >
            <Icon name="add" tokenSize="2xs" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close Context Spaces">
            <Icon name="close" tokenSize="2xs" />
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <CreateSpaceForm onSubmit={handleCreateSpace} onCancel={() => setShowCreateForm(false)} />
      )}

      {/* Space list */}
      {spaces.length === 0 ? (
        <EmptyState
          icon="library"
          title="No context spaces"
          description="Create a context space to bundle files and rules."
        />
      ) : (
        <div className="flex flex-col gap-1.5" role="list" aria-label="Context spaces list">
          {spaces.map((space) => (
            <SpaceRow
              key={space.id}
              space={space}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});
