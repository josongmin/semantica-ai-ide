import { memo, useState } from "react";
/**
 * FlowsSection — displays data flow visualizations as ordered step sequences.
 */

// ─── Types ─────────────────────────────────────────────────

/** Flow step — extends atoms CriticalFlow step shape with optional description */
export interface FlowStep {
  readonly label: string;
  readonly description?: string;
  readonly filePath?: string;
}

export interface DataFlow {
  readonly name: string;
  readonly description: string;
  readonly steps: readonly FlowStep[];
}

interface FlowsSectionProps {
  readonly flows: readonly DataFlow[];
  readonly className?: string;
}

// ─── Sub-components ────────────────────────────────────────

const FlowDiagram = memo(function FlowDiagram({ flow }: { flow: DataFlow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-[var(--color-zinc-700,#3f3f46)]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-[var(--color-zinc-100,#f4f4f5)]">
          {flow.name}
        </span>
        <span className="text-xs text-[var(--color-zinc-500,#71717a)]">
          {flow.steps.length} steps {expanded ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-zinc-700,#3f3f46)] px-3 py-2">
          <p className="mb-3 text-xs text-[var(--color-zinc-400,#a1a1aa)]">
            {flow.description}
          </p>

          <div className="space-y-1">
            {flow.steps.map((step, i) => (
              <div key={step.label} className="flex items-start gap-2">
                {/* Step indicator */}
                <div className="flex shrink-0 flex-col items-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-blue-500,#3b82f6)]/20 text-[10px] font-medium text-[var(--color-blue-400,#60a5fa)]">
                    {i + 1}
                  </span>
                  {i < flow.steps.length - 1 && (
                    <span className="mt-0.5 h-3 w-px bg-[var(--color-zinc-600,#52525b)]" />
                  )}
                </div>

                {/* Step content */}
                <div className="min-w-0 pb-1">
                  <span className="text-xs font-medium text-[var(--color-zinc-200,#e4e4e7)]">
                    {step.label}
                  </span>
                  {step.description && (
                    <p className="text-xs text-[var(--color-zinc-400,#a1a1aa)]">
                      {step.description}
                    </p>
                  )}
                  {step.filePath && (
                    <span className="font-mono text-[10px] text-[var(--color-zinc-500,#71717a)]">
                      {step.filePath}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Component ─────────────────────────────────────────────

export const FlowsSection = memo(function FlowsSection({
  flows,
  className,
}: FlowsSectionProps) {
  if (flows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-zinc-500,#71717a)]">No data flows detected.</p>
    );
  }

  return (
    <section className={`space-y-2 ${className ?? ""}`} aria-label="Data flows">
      {flows.map((flow) => (
        <FlowDiagram key={flow.name} flow={flow} />
      ))}
    </section>
  );
});
