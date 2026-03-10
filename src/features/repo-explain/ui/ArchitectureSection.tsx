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
      <p className="text-sm leading-relaxed text-[var(--color-zinc-300,#d4d4d8)]">
        {data.summary}
      </p>

      {/* Tech Stack */}
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-zinc-400,#a1a1aa)]">
          Tech Stack
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {data.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-[var(--color-blue-500,#3b82f6)]/10 px-2 py-0.5 text-xs text-[var(--color-blue-400,#60a5fa)]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Patterns */}
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-zinc-400,#a1a1aa)]">
          Patterns
        </h4>
        <ul className="space-y-1">
          {data.patterns.map((pattern) => (
            <li
              key={pattern}
              className="flex items-start gap-2 text-xs text-[var(--color-zinc-300,#d4d4d8)]"
            >
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--color-zinc-500,#71717a)]" />
              {pattern}
            </li>
          ))}
        </ul>
      </div>

      {/* Directory Structure */}
      {data.directoryStructure.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-zinc-400,#a1a1aa)]">
            Directory Layout
          </h4>
          <div className="space-y-0.5 font-mono text-xs">
            {data.directoryStructure.map((entry) => (
              <div key={entry.path} className="flex gap-2" style={{ paddingLeft: entry.depth * 12 }}>
                <span className="shrink-0 text-[var(--color-zinc-400,#a1a1aa)]">
                  {entry.path}
                </span>
                <span className="truncate text-[var(--color-zinc-500,#71717a)]">
                  {entry.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
