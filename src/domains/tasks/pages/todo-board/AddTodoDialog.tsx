import React, { useCallback, useState } from "react";

import type { ProjectTodoPriority } from "~shared/protocol";
import { Button, cn, Dialog, Input, Text } from "~shared/ui";

const priorityOptions: readonly ProjectTodoPriority[] = ["high", "medium", "low"];

const priorityLabels: Record<ProjectTodoPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface AddTodoDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string, priority: ProjectTodoPriority) => void;
}

export const AddTodoDialog = React.memo(function AddTodoDialog({
  open,
  onClose,
  onAdd,
}: AddTodoDialogProps) {
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState<ProjectTodoPriority>("medium");

  const handleAdd = useCallback(() => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority);
    setLabel("");
    setPriority("medium");
  }, [label, priority, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  const handleClose = useCallback(() => {
    setLabel("");
    setPriority("medium");
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="New TODO"
      description="Add a project-level task to track across sessions."
    >
      <div className="space-y-3 mt-2">
        <Input
          type="text"
          placeholder="What needs to be done?"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="New TODO label"
          className="text-sm"
          data-testid="new-todo-input"
          autoFocus
        />

        {/* Priority selector */}
        <div className="flex items-center gap-2">
          <Text size="xs" tone="secondary">
            Priority:
          </Text>
          <div className="flex items-center gap-1">
            {priorityOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                aria-pressed={priority === p}
                className={cn(
                  "px-2 py-0.5 text-xs rounded transition-colors duration-fast cursor-pointer focus-ring",
                  priority !== p && "text-vsc-text-tertiary hover:bg-vsc-toolbar",
                  priority === p && p === "high" && "bg-vsc-error/20 text-vsc-error ring-1 ring-vsc-error/40",
                  priority === p && p === "medium" && "bg-vsc-warning/20 text-vsc-warning ring-1 ring-vsc-warning/40",
                  priority === p && p === "low" && "bg-vsc-toolbar text-vsc-text-primary ring-1 ring-vsc-border",
                )}
                data-testid={`priority-${p}`}
              >
                {priorityLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!label.trim()}
            data-testid="confirm-add"
          >
            Add
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
