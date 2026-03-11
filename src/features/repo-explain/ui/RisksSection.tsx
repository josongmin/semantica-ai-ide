import { memo } from "react";

/**
 * RisksSection — displays risk indicators and code health warnings.
 */
import type { RiskItem as BaseRiskItem } from "../model/repoExplainAtoms";

// ─── Types ─────────────────────────────────────────────────

export type RiskSeverity = BaseRiskItem["severity"] | "low" | "medium" | "high" | "critical";

/** Extended risk item with optional metadata for richer UI display */
export interface RiskItem extends Omit<BaseRiskItem, "severity"> {
  readonly id?: string;
  readonly severity: RiskSeverity;
  readonly category?: string;
  readonly affectedFiles?: readonly string[];
  readonly suggestion?: string;
}

interface RisksSectionProps {
  readonly risks: readonly RiskItem[];
  readonly className?: string;
}

// ─── Helpers ───────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  RiskSeverity,
  { label: string; color: string; bg: string; icon: string }
> = {
  critical: {
    label: "Critical",
    color: "text-vsc-error",
    bg: "bg-vsc-error/10 border-vsc-error/30",
    icon: "\u26A0",
  },
  high: {
    label: "High",
    color: "text-vsc-warning",
    bg: "bg-vsc-warning/10 border-vsc-warning/30",
    icon: "\u26A0",
  },
  warning: {
    label: "Warning",
    color: "text-vsc-warning",
    bg: "bg-vsc-warning/10 border-vsc-warning/30",
    icon: "\u26A0",
  },
  medium: {
    label: "Medium",
    color: "text-vsc-warning",
    bg: "bg-vsc-warning/10 border-vsc-warning/30",
    icon: "\u25CF",
  },
  low: {
    label: "Low",
    color: "text-vsc-text-tertiary",
    bg: "bg-vsc-surface-2/50 border-vsc-border/30",
    icon: "\u25CB",
  },
  info: {
    label: "Info",
    color: "text-vsc-info",
    bg: "bg-vsc-info/10 border-vsc-info/30",
    icon: "\u2139",
  },
};

function sortBySeverity(risks: readonly RiskItem[]): readonly RiskItem[] {
  const order: Record<RiskSeverity, number> = {
    critical: 0,
    high: 1,
    warning: 2,
    medium: 3,
    low: 4,
    info: 5,
  };
  return [...risks].sort((a, b) => order[a.severity] - order[b.severity]);
}

// ─── Sub-components ────────────────────────────────────────

const RiskCard = memo(function RiskCard({ risk }: { risk: RiskItem }) {
  const config = SEVERITY_CONFIG[risk.severity];

  return (
    <div className={`rounded-md border p-3 ${config.bg}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className={config.color} aria-hidden="true">
          {config.icon}
        </span>
        <span className="text-sm font-medium text-vsc-text-primary">{risk.title}</span>
        <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>

      <p className="mb-2 text-xs text-vsc-text-secondary">{risk.description}</p>

      {risk.suggestion && (
        <p className="mb-2 text-xs text-vsc-accent">Suggestion: {risk.suggestion}</p>
      )}

      {risk.affectedFiles && risk.affectedFiles.length > 0 && (
        <div className="text-xs">
          <span className="text-vsc-text-ghost">Affected: </span>
          <span className="font-mono text-vsc-text-tertiary">
            {risk.affectedFiles.length <= 3
              ? risk.affectedFiles.join(", ")
              : `${risk.affectedFiles.slice(0, 3).join(", ")} +${risk.affectedFiles.length - 3} more`}
          </span>
        </div>
      )}
    </div>
  );
});

// ─── Summary Bar ───────────────────────────────────────────

const RiskSummaryBar = memo(function RiskSummaryBar({ risks }: { risks: readonly RiskItem[] }) {
  const counts: Record<RiskSeverity, number> = {
    critical: 0,
    high: 0,
    warning: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const r of risks) counts[r.severity]++;

  return (
    <div className="mb-3 flex items-center gap-4 text-xs">
      {(["critical", "high", "warning", "medium", "low", "info"] as const).map((sev) =>
        counts[sev] > 0 ? (
          <span key={sev} className={`flex items-center gap-1 ${SEVERITY_CONFIG[sev].color}`}>
            <span>{SEVERITY_CONFIG[sev].icon}</span>
            <span>
              {counts[sev]} {SEVERITY_CONFIG[sev].label.toLowerCase()}
            </span>
          </span>
        ) : null,
      )}
    </div>
  );
});

// ─── Component ─────────────────────────────────────────────

export const RisksSection = memo(function RisksSection({ risks, className }: RisksSectionProps) {
  if (risks.length === 0) {
    return (
      <section className={className} aria-label="Risks">
        <p className="text-sm text-vsc-success">No risks detected. The codebase looks healthy.</p>
      </section>
    );
  }

  const sorted = sortBySeverity(risks);

  return (
    <section className={`space-y-2 ${className ?? ""}`} aria-label="Risks">
      <RiskSummaryBar risks={risks} />
      {sorted.map((risk) => (
        <RiskCard key={risk.id ?? risk.title} risk={risk} />
      ))}
    </section>
  );
});
