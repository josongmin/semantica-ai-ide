import { memo, useState } from "react";

/**
 * ModulesSection — displays the module list with dependency counts and descriptions.
 */
import type { ModuleInfo as BaseModuleInfo } from "../model/repoExplainAtoms";

// ─── Types ─────────────────────────────────────────────────

/** Extended module info with optional dependency metadata for richer UI display */
export interface ModuleInfo extends BaseModuleInfo {
  readonly dependencyCount?: number;
  readonly dependents?: readonly string[];
  readonly entryPoints?: readonly string[];
}

interface ModulesSectionProps {
  readonly modules: readonly ModuleInfo[];
  readonly className?: string;
}

// ─── Sub-components ────────────────────────────────────────

const ModuleCard = memo(function ModuleCard({ module }: { module: ModuleInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-vsc-border/30 bg-vsc-surface-2/50">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-vsc-text-primary">{module.name}</span>
          <span className="ml-2 text-xs text-vsc-text-ghost">{module.path}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-vsc-text-tertiary">
          <span>{module.fileCount} files</span>
          {module.dependencyCount != null && <span>{module.dependencyCount} deps</span>}
          <span className="text-vsc-text-ghost">{expanded ? "\u25B2" : "\u25BC"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-vsc-border/30 px-3 py-2 text-xs">
          <p className="mb-2 text-vsc-text-secondary">{module.description}</p>

          {module.entryPoints && module.entryPoints.length > 0 && (
            <div className="mb-1.5">
              <span className="font-medium text-vsc-text-tertiary">Entry points: </span>
              <span className="font-mono text-vsc-accent">{module.entryPoints.join(", ")}</span>
            </div>
          )}

          {module.dependents && module.dependents.length > 0 && (
            <div>
              <span className="font-medium text-vsc-text-tertiary">Used by: </span>
              <span className="text-vsc-text-secondary">{module.dependents.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Component ─────────────────────────────────────────────

export const ModulesSection = memo(function ModulesSection({
  modules,
  className,
}: ModulesSectionProps) {
  if (modules.length === 0) {
    return <p className="text-sm text-vsc-text-ghost">No modules detected.</p>;
  }

  return (
    <section className={`space-y-2 ${className ?? ""}`} aria-label="Modules">
      {modules.map((m) => (
        <ModuleCard key={m.name} module={m} />
      ))}
    </section>
  );
});
