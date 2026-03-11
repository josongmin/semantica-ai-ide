import { memo } from "react";
/**
 * ArchitectureSection — displays the high-level architecture summary
 * including tech stack, patterns, and directory structure overview.
 */

// ─── Types ─────────────────────────────────────────────────

export interface ArchitectureInfo {
  readonly summary: string;
  readonly techStack: readonly string[];
  readonly patterns: readonly string[];
  readonly directoryStructure: readonly DirectoryEntry[];
}

export interface DirectoryEntry {
  readonly path: string;
  readonly description: string;
  readonly depth: number;
}

interface ArchitectureSectionProps {
  readonly data: ArchitectureInfo;
  readonly className?: string;
}

// ─── Component ─────────────────────────────────────────────

export const ArchitectureSection = memo(function ArchitectureSection({
  data,
  className,
}: ArchitectureSectionProps) {
  return (
    <section className={`space-y-4 ${className ?? ""}`} aria-label="Architecture overview">
      {/* Summary */}
      <p className="text-sm leading-relaxed text-vsc-text-secondary">{data.summary}</p>

      {/* Tech Stack */}
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-vsc-text-tertiary">
          Tech Stack
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {data.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-vsc-accent/10 px-2 py-0.5 text-xs text-vsc-accent"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Patterns */}
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-vsc-text-tertiary">
          Patterns
        </h4>
        <ul className="space-y-1">
          {data.patterns.map((pattern) => (
            <li key={pattern} className="flex items-start gap-2 text-xs text-vsc-text-secondary">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-vsc-text-ghost" />
              {pattern}
            </li>
          ))}
        </ul>
      </div>

      {/* Directory Structure */}
      {data.directoryStructure.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-vsc-text-tertiary">
            Directory Layout
          </h4>
          <div className="space-y-0.5 font-mono text-xs">
            {data.directoryStructure.map((entry) => (
              <div
                key={entry.path}
                className="flex gap-2"
                style={{ paddingLeft: entry.depth * 12 }}
              >
                <span className="shrink-0 text-vsc-text-tertiary">{entry.path}</span>
                <span className="truncate text-vsc-text-ghost">{entry.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
