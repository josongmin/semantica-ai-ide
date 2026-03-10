import React from "react";
import { useAtomValue } from "jotai";

import { jitTestResultAtomFamily } from "../../entities/test-results";
import { cn, Collapsible, Icon, ProgressBar } from "../../shared/ui";

interface JitTestCardProps { turnId: string }

export const JitTestCard = React.memo(function JitTestCard({ turnId }: JitTestCardProps) {
  const suite = useAtomValue(jitTestResultAtomFamily(turnId));
  if (!suite || suite.tests.length === 0) return null;

  const passed = suite.tests.filter((t) => t.status === "pass").length;
  const failed = suite.tests.filter((t) => t.status === "fail").length;
  const total = suite.tests.length;

  return (
    <Collapsible
      title="JIT Tests"
      icon="beaker"
      badge={`${passed}/${total}`}
      defaultCollapsed={failed === 0}
    >
      <div className="px-2 py-1.5 space-y-1.5">
        {suite.coverage != null && (
          <ProgressBar
            value={suite.coverage}
            max={100}
            label={`${suite.coverage}%`}
            barClassName={(() => { if (suite.coverage >= 80) return "bg-vsc-success"; if (suite.coverage >= 50) return "bg-vsc-warning"; return "bg-vsc-error"; })()}
          />
        )}
        <div className="flex flex-col gap-1">
          {suite.tests.map((test) => (
            <div key={test.name} className="flex items-center gap-1.5 text-2xs">
              <Icon
                name={(() => { if (test.status === "pass") return "pass"; if (test.status === "fail") return "error"; return "circle-slash"; })()}
                tokenSize="2xs"
                className={cn(
                  test.status === "pass" && "text-vsc-success",
                  test.status === "fail" && "text-vsc-error animate-pulse",
                  test.status !== "pass" && test.status !== "fail" && "text-vsc-text-ghost",
                )}
              />
              <span
                className={cn(
                  "flex-1 truncate min-w-0",
                  test.status === "fail" ? "text-vsc-error" : "text-vsc-text-secondary",
                )}
              >
                {test.name}
              </span>
              {test.durationMs != null && (
                <span className="text-vsc-text-ghost tabular-nums">{test.durationMs}ms</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Collapsible>
  );
});
