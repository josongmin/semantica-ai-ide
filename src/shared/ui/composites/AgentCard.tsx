import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { StatusDot } from "../primitives/StatusDot";
import { cn } from "../variants";

const agentCardVariants = cva(
  "flex items-start gap-2 p-2 rounded-md border transition-colors duration-normal",
  {
    variants: {
      status: {
        idle: "border-vsc-border/40 bg-vsc-surface-2/50",
        working: "border-vsc-info/40 bg-vsc-info/5",
        done: "border-vsc-success/40 bg-vsc-success/5",
        error: "border-vsc-error/40 bg-vsc-error/5",
      },
    },
    defaultVariants: { status: "idle" },
  },
);

export type AgentCardProps = VariantProps<typeof agentCardVariants> & {
  name: string;
  role?: string;
  status: "idle" | "working" | "done" | "error";
  avatar?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

const STATUS_MAP: Record<string, "idle" | "running" | "success" | "info" | "error" | "paused"> = {
  idle: "idle",
  working: "info",
  done: "success",
  error: "error",
};

/** Agent identity card for Multi-Agent Review, Agent Mode display. */
export const AgentCard = React.memo(function AgentCard({
  name,
  role,
  status,
  avatar,
  children,
  className,
}: AgentCardProps) {
  return (
    <div className={cn(agentCardVariants({ status }), className)}>
      {/* Avatar or status dot */}
      <div className="shrink-0 mt-0.5">
        {avatar ?? <StatusDot status={STATUS_MAP[status] ?? "idle"} size="md" pulse={status === "working"} />}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-vsc-text-primary truncate" title={name}>
            {name}
          </span>
          {role !== undefined && role !== "" && (
            <span className="text-2xs text-vsc-text-ghost px-1 py-px rounded bg-vsc-surface-3">
              {role}
            </span>
          )}
        </div>
        {children !== undefined && children !== null && <div className="mt-1 text-2xs text-vsc-text-secondary">{children}</div>}
      </div>
    </div>
  );
});
