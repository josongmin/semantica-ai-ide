import React from "react";

import { Badge, cn, Icon } from "~shared/ui";

interface TaskItem {
  readonly id: string;
  readonly label: string;
  readonly status: "done" | "running" | "queued";
}

const SAMPLE_TASKS: TaskItem[] = [
  { id: "t1", label: "T1 Search", status: "done" },
  { id: "t2", label: "T2 Impact", status: "done" },
  { id: "t3", label: "T3 Patch", status: "running" },
  { id: "t4", label: "T4 Test", status: "queued" },
  { id: "t5", label: "T5 Converge", status: "queued" },
];

const STATUS_CONFIG = {
  done: { icon: "check", color: "text-vsc-success", badge: "success" as const, label: "done" },
  running: { icon: "sync~spin", color: "text-vsc-info", badge: "info" as const, label: "running" },
  queued: { icon: "circle-outline", color: "text-vsc-text-ghost", badge: "default" as const, label: "queued" },
};

export const TaskDagPane = React.memo(function TaskDagPane() {
  return (
    <div className="flex-1 min-w-0 p-3">
      <h3 className="text-2xs font-semibold text-vsc-text-tertiary uppercase tracking-wider mb-2">
        Task DAG
      </h3>
      <div className="space-y-0.5">
        {SAMPLE_TASKS.map((task) => {
          const cfg = STATUS_CONFIG[task.status];
          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-sm",
                "cursor-pointer transition-colors duration-fast",
                "hover:bg-vsc-list-hover",
              )}
            >
              <Icon name={cfg.icon} tokenSize="2xs" className={cn(cfg.color, "shrink-0")} />
              <span className="text-xs text-vsc-fg flex-1">{task.label}</span>
              <Badge variant={cfg.badge} text={cfg.label} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
