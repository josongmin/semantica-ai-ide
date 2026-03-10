import React from "react";

import type { ProjectTodo } from "~shared/protocol";
import { Button, Dialog } from "~shared/ui";

interface DeleteTodoDialogProps {
  target: ProjectTodo | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteTodoDialog = React.memo(function DeleteTodoDialog({
  target,
  onConfirm,
  onCancel,
}: DeleteTodoDialogProps) {
  return (
    <Dialog
      open={target !== null}
      onClose={onCancel}
      title="Delete TODO"
      description={target ? `Delete "${target.label}"? This cannot be undone.` : undefined}
    >
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} data-testid="confirm-delete">
          Delete
        </Button>
      </div>
    </Dialog>
  );
});
