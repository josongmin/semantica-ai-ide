import type { RiskLevel, ToolCategory } from "~shared/protocol";
import { RISK_TEXT_COLOR } from "~shared/ui";

export const categoryIcons: Record<ToolCategory, string> = {
  read: "file",
  search: "search",
  write: "edit",
  delete: "trash",
  terminal: "terminal",
  git: "git-commit",
  analysis: "lightbulb",
  other: "extensions",
};

export const categoryLabels: Record<ToolCategory, string> = {
  read: "Read Files",
  search: "Search",
  write: "Write Files",
  delete: "Delete",
  terminal: "Terminal",
  git: "Git",
  analysis: "Analysis",
  other: "Other",
};

export const riskLevelIcons: Record<RiskLevel, string> = {
  safe: "pass",
  moderate: "warning",
  dangerous: "error",
};

/** @deprecated Use RISK_TEXT_COLOR from shared/ui instead */
export const riskLevelColors = RISK_TEXT_COLOR;
