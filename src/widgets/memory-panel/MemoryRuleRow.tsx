import React, { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import { memoryRuleAtomFamily } from "../../entities/memory-rule";
import { Badge, Button, cn, ConfirmDialog, Icon, Input, Text } from "../../shared/ui";

interface MemoryRuleRowProps {
  id: string;
  onToggle: (ruleId: string, active: boolean) => void;
  onDelete: (ruleId: string) => void;
  /** Inline editing */
  isEditing?: boolean;
  onEdit?: (ruleId: string) => void;
  onCancelEdit?: () => void;
  onSave?: (title: string, content: string) => void;
  /** Drag sort */
  draggable?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export const MemoryRuleRow = React.memo(function MemoryRuleRow({
  id,
  onToggle,
  onDelete,
  isEditing = false,
  onEdit,
  onCancelEdit,
  onSave,
  draggable: isDraggable,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: MemoryRuleRowProps) {
  const rule = useAtomValue(memoryRuleAtomFamily(id));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleToggle = useCallback(() => {
    if (!rule) return;
    onToggle(id, !rule.active);
  }, [id, rule, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(id);
    setConfirmDelete(false);
  }, [id, onDelete]);

  const handleStartEdit = useCallback(() => {
    if (!rule) return;
    setEditTitle(rule.title);
    setEditContent(rule.content);
    onEdit?.(id);
  }, [id, rule, onEdit]);

  const handleSave = useCallback(() => {
    onSave?.(editTitle, editContent);
  }, [onSave, editTitle, editContent]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDragOver?.();
    },
    [onDragOver],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDrop?.();
    },
    [onDrop],
  );

  // New rule form (no rule data yet)
  if (id === "__new__" && isEditing) {
    return (
      <div className="px-3 py-2 space-y-1.5" role="listitem" data-testid="new-rule-form">
        <Input
          type="text"
          size="sm"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Rule title"
          autoFocus
          data-testid="edit-title"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Rule content"
          rows={2}
          className="w-full bg-vsc-input-bg text-vsc-input-fg border border-vsc-input-border rounded px-2 py-1 text-xs resize-none focus:outline-none focus:border-vsc-focus"
          data-testid="edit-content"
        />
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave} disabled={!editTitle.trim()}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  if (!rule) return null;

  // Inline edit mode
  if (isEditing) {
    return (
      <div
        className="px-3 py-2 space-y-1.5"
        role="listitem"
        aria-label={rule.title}
        data-testid="edit-rule-form"
      >
        <Input
          type="text"
          size="sm"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Rule title"
          autoFocus
          data-testid="edit-title"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Rule content"
          rows={3}
          className="w-full bg-vsc-input-bg text-vsc-input-fg border border-vsc-input-border rounded px-2 py-1 text-xs resize-none focus:outline-none focus:border-vsc-focus"
          data-testid="edit-content"
        />
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave} disabled={!editTitle.trim()}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-sm transition-colors duration-fast",
        "hover:bg-vsc-list-hover/30",
        isDragOver && "border-t-2 border-vsc-focus",
      )}
      role="listitem"
      aria-label={rule.title}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
    >
      {isDraggable && (
        <span
          className="cursor-grab text-vsc-text-ghost shrink-0"
          aria-hidden="true"
          data-testid="drag-handle"
        >
          <Icon name="gripper" tokenSize="xs" />
        </span>
      )}
      <Badge text={rule.source ?? "custom"} variant="default" className="shrink-0" />
      <Text size="xs" tone="primary" className="flex-1 min-w-0 truncate">
        {rule.title}
      </Text>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleStartEdit}
        aria-label="Edit rule"
        data-testid="edit-rule"
      >
        Edit
      </Button>
      <Button
        size="sm"
        variant={rule.active ? "primary" : "ghost"}
        onClick={handleToggle}
        aria-label={rule.active ? "Deactivate rule" : "Activate rule"}
        aria-pressed={rule.active}
      >
        {rule.active ? "Active" : "Off"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setConfirmDelete(true)}
        aria-label="Delete rule"
      >
        Delete
      </Button>
      <ConfirmDialog
        open={confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        title="Delete memory rule"
        description={`Delete "${rule.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
});
