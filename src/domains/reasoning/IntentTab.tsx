/**
 * IntentTab — displays intent header, analysis scope/targets/risks, plan steps, and impact
 */

import { memo } from "react";

import type { IntentPlanStep, IntentSession } from "~features/intent-engine";
import { Icon } from "~shared/ui/primitives/Icon";
import { Text } from "~shared/ui/primitives/Text";

// ─── Plan step status icons ─────────────────────────────

const stepStatusIcon: Record<IntentPlanStep["status"], { name: string; cls: string }> = {
  pending: { name: "circle", cls: "text-vsc-text-ghost" },
  running: { name: "loading", cls: "text-vsc-info animate-spin" },
  done: { name: "check-circle", cls: "text-vsc-success" },
  skipped: { name: "minus-circle", cls: "text-vsc-text-ghost/50" },
};

// ─── Step action labels ─────────────────────────────────

const stepActionLabel: Record<IntentPlanStep["action"], string> = {
  locate: "Locate",
  analyze: "Analyze",
  modify: "Modify",
  test: "Test",
  verify: "Verify",
};

export const IntentTab = memo(function IntentTab({ session }: { session: IntentSession | null }) {
  if (!session) return null;

  const { intent, analysis, plan, status } = session;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Intent header */}
      <div className="px-4 py-3 border-b border-vsc-border/20 backdrop-blur-md bg-vsc-surface-0/80">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="zap" size={14} className="text-vsc-accent shrink-0" />
          <Text as="h3" size="xs" weight="semibold" truncate>
            {intent.text}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Text size="3xs" className="px-1.5 py-0.5 rounded bg-vsc-accent/20 text-vsc-accent">
            {intent.category}
          </Text>
          <Text size="3xs" tone="ghost">
            {status}
          </Text>
        </div>
      </div>

      {/* Analysis results */}
      {analysis && (
        <div className="border-b border-vsc-border/20">
          <div className="px-4 pt-3 pb-1">
            <Text
              as="h3"
              size="3xs"
              weight="semibold"
              tone="ghost"
              className="uppercase tracking-wider"
            >
              Analysis
            </Text>
          </div>

          {/* Scope */}
          <div className="px-4 py-2 grid grid-cols-4 gap-2">
            {(
              [
                ["Files", analysis.affectedScope.files],
                ["Modules", analysis.affectedScope.modules],
                ["Tests", analysis.affectedScope.tests],
                ["APIs", analysis.affectedScope.apis],
              ] as const
            ).map(([label, count]) => (
              <div key={label} className="text-center">
                <Text as="div" size="sm" weight="semibold">
                  {count}
                </Text>
                <Text as="div" size="3xs" tone="ghost">
                  {label}
                </Text>
              </div>
            ))}
          </div>

          {/* Targets */}
          {analysis.targets.length > 0 && (
            <div className="px-4 py-2">
              <Text as="div" size="3xs" tone="ghost" className="mb-1">
                Targets
              </Text>
              {analysis.targets.map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-2xs">
                  <Text mono truncate>
                    {t.name}
                  </Text>
                  <Text tone="ghost">{t.kind}</Text>
                  <Text tone="ghost" truncate className="ml-auto max-w-32">
                    {t.filePath}:{t.line}
                  </Text>
                </div>
              ))}
            </div>
          )}

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <div className="px-4 py-2 border-t border-vsc-border/10">
              <Text as="div" size="3xs" tone="ghost" className="mb-1">
                Risks
              </Text>
              {analysis.risks.map((r, i) => {
                let sevColor: string;
                if (r.severity === "high") {
                  sevColor = "text-vsc-error";
                } else if (r.severity === "medium") {
                  sevColor = "text-vsc-warning";
                } else {
                  sevColor = "text-vsc-text-ghost";
                }
                return (
                  <div key={i} className="py-1">
                    <div className="flex items-center gap-2 text-2xs">
                      <Icon name="alert-triangle" size={10} className={sevColor} />
                      <Text tone="secondary">{r.description}</Text>
                    </div>
                    <Text as="p" size="3xs" tone="ghost" className="pl-4">
                      Mitigation: {r.mitigation}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Plan steps */}
      {plan && (
        <div>
          <div className="px-4 pt-3 pb-1">
            <Text
              as="h3"
              size="3xs"
              weight="semibold"
              tone="ghost"
              className="uppercase tracking-wider"
            >
              Plan ({plan.steps.length} steps)
            </Text>
          </div>
          {plan.steps.map((step) => {
            const si = stepStatusIcon[step.status];
            return (
              <div
                key={step.id}
                className="px-4 py-2 border-b border-vsc-border/10 hover:bg-vsc-surface-1/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon name={si.name} size={14} className={si.cls} />
                  <Text size="3xs" tone="ghost" className="px-1 py-0.5 rounded bg-vsc-surface-2">
                    {stepActionLabel[step.action]}
                  </Text>
                  <Text size="xs" truncate>
                    {step.description}
                  </Text>
                </div>
                {step.targetFile && (
                  <Text size="3xs" tone="ghost" className="pl-6">
                    {step.targetFile}
                    {step.targetLine !== undefined ? `:${step.targetLine}` : ""}
                  </Text>
                )}
              </div>
            );
          })}

          {/* Estimated impact */}
          <div className="px-4 py-2 grid grid-cols-4 gap-2 border-t border-vsc-border/20">
            {(
              [
                ["New", plan.estimatedImpact.newFiles],
                ["Modified", plan.estimatedImpact.modifiedFiles],
                ["Deleted", plan.estimatedImpact.deletedFiles],
                ["Tests", plan.estimatedImpact.testsNeeded],
              ] as const
            ).map(([label, count]) => (
              <div key={label} className="text-center">
                <Text as="div" size="sm" weight="semibold">
                  {count}
                </Text>
                <Text as="div" size="3xs" tone="ghost">
                  {label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state for analysis */}
      {!analysis && status === "analyzing" && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Icon name="loading" size={24} className="mx-auto text-vsc-text-ghost animate-spin" />
            <Text as="p" size="xs" tone="secondary">
              Analyzing intent...
            </Text>
          </div>
        </div>
      )}
    </div>
  );
});
