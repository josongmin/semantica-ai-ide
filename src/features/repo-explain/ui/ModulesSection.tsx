import { memo, useState } from "react";

/**
 * ModulesSection — displays the module list with dependency counts and descriptions.
 */
import { Text } from "~shared/ui";

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
          <Text size="sm" weight="medium">
            {module.name}
          </Text>
          <Text size="xs" tone="ghost" className="ml-2">
            {module.path}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Text size="xs" tone="tertiary">
            {module.fileCount} files
          </Text>
          {module.dependencyCount != null && (
            <Text size="xs" tone="tertiary">
              {module.dependencyCount} deps
            </Text>
          )}
          <Text size="xs" tone="ghost">
            {expanded ? "\u25B2" : "\u25BC"}
          </Text>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-vsc-border/30 px-3 py-2 text-xs">
          <Text as="p" size="xs" tone="secondary" className="mb-2">
            {module.description}
          </Text>

          {module.entryPoints && module.entryPoints.length > 0 && (
            <div className="mb-1.5">
              <Text weight="medium" tone="tertiary">
                Entry points:{" "}
              </Text>
              <Text tone="info" className="font-mono">
                {module.entryPoints.join(", ")}
              </Text>
            </div>
          )}

          {module.dependents && module.dependents.length > 0 && (
            <div>
              <Text weight="medium" tone="tertiary">
                Used by:{" "}
              </Text>
              <Text tone="secondary">{module.dependents.join(", ")}</Text>
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
    return (
      <Text as="p" size="sm" tone="ghost">
        No modules detected.
      </Text>
    );
  }

  return (
    <section className={`space-y-2 ${className ?? ""}`} aria-label="Modules">
      {modules.map((m) => (
        <ModuleCard key={m.name} module={m} />
      ))}
    </section>
  );
});
