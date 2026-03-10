import type { WorkspaceFileAction } from "../../shared/lib/atoms/workspaceAdapterAtoms";

export const WORKSPACE_ACTION_ICONS: Readonly<Record<WorkspaceFileAction, string>> = {
  created: "new-file",
  modified: "edit",
  deleted: "trash",
  read: "eye",
};

export const WORKSPACE_ACTION_LABELS: Readonly<Record<WorkspaceFileAction, string>> = {
  created: "Created",
  modified: "Modified",
  deleted: "Deleted",
  read: "Read",
};

export const WORKSPACE_ACTION_COLORS: Readonly<Record<WorkspaceFileAction, string>> = {
  created: "text-vsc-success",
  modified: "text-vsc-warning",
  deleted: "text-vsc-error",
  read: "text-vsc-info",
};
