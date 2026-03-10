import React, { useMemo, useState } from "react";
import { useAtomValue } from "jotai";

import { Badge, type BadgeProps, Button, cn } from "~shared/ui";

import { type AuditAction, auditLogAtom } from "../../../../../entities/audit-log";

const ACTION_COLORS: Record<AuditAction, BadgeProps["variant"]> = {
  create: "success",
  modify: "info",
  delete: "error",
  execute: "warning",
  approve: "success",
  reject: "error",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-vsc-success",
  medium: "text-vsc-warning",
  high: "text-vsc-error",
};

export const AuditSection = React.memo(function AuditSection() {
  const log = useAtomValue(auditLogAtom);
  const [filter, setFilter] = useState<AuditAction | "all">("all");

  const filtered = useMemo(() => {
    const base = filter === "all" ? log : log.filter((e) => e.action === filter);
    return base.slice().reverse();
  }, [log, filter]);

  const actions: (AuditAction | "all")[] = [
    "all",
    "create",
    "modify",
    "delete",
    "execute",
    "approve",
    "reject",
  ];

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a}
            variant={filter === a ? "primary" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full text-2xs",
              filter !== a &&
                "bg-vsc-surface-2 text-vsc-text-secondary hover:bg-vsc-toolbar transition-colors duration-fast",
            )}
            onClick={() => setFilter(a)}
          >
            {a === "all" ? "All" : a}
          </Button>
        ))}
      </div>

      {/* Log table */}
      {filtered.length === 0 ? (
        <p className="text-2xs text-vsc-text-ghost">No audit entries.</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-[--panel-max-h-md] overflow-y-auto rounded-xl border border-vsc-border p-2 scroll-shadow">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 px-2.5 py-2 text-2xs rounded-lg hover:bg-vsc-list-hover transition-colors duration-fast"
            >
              <span className="text-vsc-text-ghost tabular-nums shrink-0">{entry.timestamp}</span>
              <Badge text={entry.action} variant={ACTION_COLORS[entry.action]} />
              {entry.risk && (
                <span className={cn("text-2xs font-medium", RISK_COLORS[entry.risk])}>
                  {entry.risk}
                </span>
              )}
              <span className="text-vsc-text-secondary truncate flex-1 min-w-0">
                {entry.target}
              </span>
              <span className="text-vsc-text-ghost truncate max-w-[200px]">{entry.summary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
