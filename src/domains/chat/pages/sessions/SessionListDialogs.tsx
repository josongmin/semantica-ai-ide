import React, { useCallback, useState } from "react";

import { getVscodeApi } from "~shared/lib";
import type { SessionListEntry } from "~shared/protocol";
import { Button, Dialog } from "~shared/ui";

interface SessionListDialogsProps {
  deleteTarget: SessionListEntry | null;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  exportOpen: boolean;
  onExportClose: () => void;
}

/** Dialogs extracted from SessionListPage: delete confirmation + export format picker. */
export const SessionListDialogs = React.memo(function SessionListDialogs({
  deleteTarget,
  onDeleteConfirm,
  onDeleteCancel,
  exportOpen,
  onExportClose,
}: SessionListDialogsProps) {
  const [exportFormat, setExportFormat] = useState<"markdown" | "json">("markdown");

  const handleExport = useCallback(() => {
    getVscodeApi().postMessage({ type: "EXPORT_SESSION", format: exportFormat });
    onExportClose();
  }, [exportFormat, onExportClose]);

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onClose={onDeleteCancel}
        title="Delete Session"
        description={
          deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : undefined
        }
      >
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={onDeleteCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onDeleteConfirm} data-testid="confirm-delete">
            Delete
          </Button>
        </div>
      </Dialog>

      {/* Export Format Dialog */}
      <Dialog
        open={exportOpen}
        onClose={onExportClose}
        title="Export Sessions"
        description="Choose the export format for your session history."
      >
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex gap-2">
            <Button
              variant={exportFormat === "markdown" ? "primary" : "ghost"}
              size="sm"
              icon="markdown"
              onClick={() => setExportFormat("markdown")}
              className="flex-1"
              data-testid="export-format-md"
            >
              Markdown
            </Button>
            <Button
              variant={exportFormat === "json" ? "primary" : "ghost"}
              size="sm"
              icon="json"
              onClick={() => setExportFormat("json")}
              className="flex-1"
              data-testid="export-format-json"
            >
              JSON
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onExportClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              data-testid="confirm-export"
            >
              Export
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
});
