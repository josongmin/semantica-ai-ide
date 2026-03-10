import { memo } from "react";

import { cn } from "~shared/ui";

import { useTaskSurfaceState } from "./hooks/useTaskSurfaceState";
import { TaskBoardView } from "./TaskBoardView";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { TaskListView } from "./TaskListView";
import { TaskToolbar } from "./TaskToolbar";

// ─── TasksSurface ───────────────────────────────────────

export const TasksSurface = memo(function TasksSurface() {
  const { viewMode, selectedTask } = useTaskSurfaceState();

  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      <TaskToolbar />
      <div className="flex flex-1 min-h-0">
        <div className={cn("flex-1 min-h-0 min-w-0 transition-all duration-normal", selectedTask !== null && "mr-0")}>
          {viewMode === "list" ? <TaskListView /> : <TaskBoardView />}
        </div>
        {selectedTask !== null && <TaskDetailPanel task={selectedTask} />}
      </div>
    </div>
  );
});
