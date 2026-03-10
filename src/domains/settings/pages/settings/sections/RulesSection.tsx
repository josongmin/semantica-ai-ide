import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { agentRulesAtom, ruleViolationsAtom } from "~features/agent-rules";
import { getVscodeApi } from "~shared/lib";
import type { AgentRule, AgentRuleSource } from "~shared/protocol";
import { Badge, Button, cn, EmptyState, Icon, Text, Tooltip } from "~shared/ui";

const SOURCE_ICON: Record<AgentRuleSource, string> = {
  file: "file-code",
  user: "person",
  team: "organization",
  auto_detected: "lightbulb",
};

const STATUS_COLOR: Record<string, string> = {
  active: "text-vsc-success",
  disabled: "text-vsc-text-tertiary",
  violated: "text-vsc-error",
};

function RuleRow({ rule, isLast }: { rule: AgentRule; isLast: boolean }) {
  const handleToggle = useCallback(() => {
    getVscodeApi().postMessage({
      type: "TOGGLE_AGENT_RULE",
      rule_id: rule.id,
      status: rule.status === "active" ? "disabled" : "active",
    });
  }, [rule.id, rule.status]);

  const handleDelete = useCallback(() => {
    getVscodeApi().postMessage({ type: "DELETE_AGENT_RULE", rule_id: rule.id });
  }, [rule.id]);

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-4 py-2 hover:bg-vsc-list-hover transition-colors duration-fast group",
        !isLast && "border-b border-vsc-border/50",
      )}
    >
      <Icon
        name={SOURCE_ICON[rule.source]}
        tokenSize="xs"
        className={STATUS_COLOR[rule.status] ?? "text-vsc-text-secondary"}
      />
      <Text
        size="xs"
        tone={rule.status === "disabled" ? "ghost" : "primary"}
        truncate
        className="flex-1 min-w-0"
      >
        {rule.title}
      </Text>
      {rule.violation_count > 0 && <Badge variant="error" text={rule.violation_count} />}

      {/* Actions — always visible for better affordance */}
      <div className="flex gap-1 shrink-0">
        <Tooltip content={rule.status === "active" ? "Disable" : "Enable"}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            title={rule.status === "active" ? "Disable" : "Enable"}
          >
            <Icon
              name={rule.status === "active" ? "eye" : "eye-closed"}
              tokenSize="2xs"
              className="text-vsc-text-tertiary hover:text-vsc-text-secondary transition-colors duration-fast"
            />
          </Button>
        </Tooltip>
        <Tooltip content="Delete">
          <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete">
            <Icon
              name="trash"
              tokenSize="2xs"
              className="text-vsc-text-tertiary hover:text-vsc-error transition-colors duration-fast"
            />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

export const RulesSection = React.memo(function RulesSection() {
  const rules = useAtomValue(agentRulesAtom);
  const violations = useAtomValue(ruleViolationsAtom);

  const activeCount = rules.filter((r) => r.status === "active").length;

  return (
    <div className="px-6 py-6 space-y-4">
      {/* ── Rules List ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider">
            Agent rules
          </Text>
          {rules.length > 0 && <Badge variant="default" text={`${activeCount}/${rules.length}`} />}
        </div>

        <div className="rounded-xl border border-vsc-border overflow-hidden">
          {rules.length === 0 ? (
            <EmptyState icon="law" title="No agent rules configured" />
          ) : (
            rules.map((rule, idx) => (
              <RuleRow key={rule.id} rule={rule} isLast={idx === rules.length - 1} />
            ))
          )}
        </div>
      </div>

      {/* ── Recent Violations ── */}
      {violations.length > 0 && (
        <div className="space-y-3">
          <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
            Recent violations
          </Text>
          <div className="rounded-xl border border-vsc-border overflow-hidden">
            {violations.slice(-5).map((v, idx) => (
              <div
                key={v.id}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2",
                  idx < Math.min(violations.length, 5) - 1 && "border-b border-vsc-border/50",
                )}
              >
                <Icon
                  name={v.severity === "error" ? "error" : "warning"}
                  tokenSize="xs"
                  className={v.severity === "error" ? "text-vsc-error" : "text-vsc-warning"}
                />
                <Text size="xs" tone="secondary" truncate className="flex-1 min-w-0">
                  {v.description}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
