import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { agentRulesAtom, ruleViolationsAtom } from "../../features/agent-rules";
import { getVscodeApi } from "../../shared/lib";
import type { AgentRule, AgentRuleSource } from "../../shared/protocol";
import { Badge, cn, Icon, Text } from "../../shared/ui";

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

function RuleRow({ rule }: { rule: AgentRule }) {
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
    <div className="flex items-center gap-1.5 group">
      <Icon
        name={SOURCE_ICON[rule.source]}
        tokenSize="2xs"
        className={STATUS_COLOR[rule.status] ?? "text-vsc-text-secondary"}
      />
      <Text
        size="2xs"
        tone={rule.status === "disabled" ? "ghost" : "secondary"}
        truncate
        className="flex-1 min-w-0"
      >
        {rule.title}
      </Text>
      {rule.violation_count > 0 && (
        <Badge variant="error" text={rule.violation_count} />
      )}
      {rule.file_path && (
        <Text size="2xs" tone="ghost" mono>
          {rule.file_path}
        </Text>
      )}
      <button
        onClick={handleToggle}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-fast focus-ring"
        title={rule.status === "active" ? "Disable" : "Enable"}
      >
        <Icon
          name={rule.status === "active" ? "eye" : "eye-closed"}
          tokenSize="2xs"
          className="text-vsc-text-tertiary hover:text-vsc-text-secondary transition-colors duration-fast"
        />
      </button>
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-fast focus-ring"
        title="Delete"
      >
        <Icon
          name="trash"
          tokenSize="2xs"
          className="text-vsc-text-tertiary hover:text-vsc-error transition-colors duration-fast"
        />
      </button>
    </div>
  );
}

export const AgentRulesPanel = React.memo(function AgentRulesPanel() {
  const rules = useAtomValue(agentRulesAtom);
  const violations = useAtomValue(ruleViolationsAtom);

  if (rules.length === 0) return null;

  const activeCount = rules.filter((r) => r.status === "active").length;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="agent-rules-panel">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="law" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">
          Agent Rules
        </Text>
        <Badge variant="default" text={`${activeCount}/${rules.length}`} className="ml-auto" />
      </div>

      <div className="pl-5 space-y-1">
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} />
        ))}
      </div>

      {violations.length > 0 && (
        <div className="pl-5 mt-2 pt-1.5 border-t border-vsc-border/20">
          <Text size="2xs" tone="ghost" className="mb-0.5">
            Recent Violations
          </Text>
          <div className="space-y-0.5">
            {violations.slice(-5).map((v) => (
              <div key={v.id} className="flex items-center gap-1.5">
                <Icon
                  name={v.severity === "error" ? "error" : "warning"}
                  tokenSize="2xs"
                  className={cn(
                    v.severity === "error" ? "text-vsc-error" : "text-vsc-warning",
                  )}
                />
                <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">
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
