import React from "react";
import { useAtomValue } from "jotai";

import { Badge, cn } from "~shared/ui";

import { hookConfigsAtom, hookExecutionLogAtom } from "../../../../../entities/hook-config";

export const HooksSection = React.memo(function HooksSection() {
  const configs = useAtomValue(hookConfigsAtom);
  const log = useAtomValue(hookExecutionLogAtom);

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      {/* Hook configs */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-vsc-text-primary tracking-wide mb-2">
          Configured Hooks
        </h3>
        {configs.length === 0 ? (
          <p className="text-2xs text-vsc-text-ghost">
            No hooks configured. Add hooks in .claude/settings.json
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {configs.map((hook) => (
              <div
                key={hook.id}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-2xs",
                  "bg-vsc-surface-2 border border-vsc-border/30",
                  !hook.enabled && "opacity-50",
                )}
              >
                <Badge text={hook.event} variant={hook.enabled ? "info" : "default"} />
                {hook.matcher && <span className="text-vsc-text-ghost">{hook.matcher}</span>}
                <span className="flex-1 min-w-0 truncate text-vsc-text-secondary font-mono">
                  {hook.command}
                </span>
                <span
                  className={cn(
                    "text-2xs",
                    hook.enabled ? "text-vsc-success" : "text-vsc-text-ghost",
                  )}
                >
                  {hook.enabled ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Execution log */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-vsc-text-primary tracking-wide mb-2">
          Execution Log
        </h3>
        {log.length === 0 ? (
          <p className="text-2xs text-vsc-text-ghost">No hook executions yet.</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[--panel-max-h-sm] overflow-y-auto rounded-xl border border-vsc-border p-2 scroll-shadow">
            {log
              .slice(-20)
              .reverse()
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 text-2xs px-2.5 py-1.5 rounded-md hover:bg-vsc-list-hover/50 transition-colors duration-fast"
                >
                  <span className="text-vsc-text-ghost tabular-nums">{entry.timestamp}</span>
                  <Badge text={entry.event} variant="default" />
                  <span
                    className={cn(
                      "tabular-nums",
                      entry.exitCode === 0 ? "text-vsc-success" : "text-vsc-error",
                    )}
                  >
                    exit {entry.exitCode}
                  </span>
                  <span className="text-vsc-text-ghost tabular-nums">{entry.durationMs}ms</span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
});
