import { createPushAtomSet, createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AgentRule, RuleViolation } from "../../../shared/protocol";

export const [agentRulesAtom, setAgentRulesAtom, resetAgentRulesAtom] =
  createStateAtomSet<readonly AgentRule[]>([]);

export const [ruleViolationsAtom, pushRuleViolationAtom, resetRuleViolationsAtom] =
  createPushAtomSet<RuleViolation>();

registerResetAtom(resetAgentRulesAtom);
registerResetAtom(resetRuleViolationsAtom);
