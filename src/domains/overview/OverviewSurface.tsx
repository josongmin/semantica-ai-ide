import React, { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  generateRepoOverviewAtom,
  MOCK_REPO_OVERVIEW,
  type OverviewSection,
  repoOverviewAtom,
  repoScanPhaseAtom,
  repoSectionsLoadedAtom,
} from "~features/repo-explain";
import { cn, Icon, Spinner, type Step, StepTimeline } from "~shared/ui";

import { ArchDiagram } from "./ArchDiagram";
import { ConventionGrid } from "./ConventionGrid";
import { FlowCard } from "./FlowCard";
import { ModuleList } from "./ModuleList";
import { RiskList } from "./RiskList";

// ─── Phase → StepTimeline mapping ─────────────────────────

const SCAN_STEPS: { id: string; label: string }[] = [
  { id: "scanning", label: "Scanning" },
  { id: "analyzing", label: "Analyzing" },
  { id: "generating", label: "Generating" },
  { id: "done", label: "Done" },
];

function buildTimelineSteps(phase: string): Step[] {
  const phaseOrder = ["scanning", "analyzing", "generating", "done"];
  const currentIdx = phaseOrder.indexOf(phase);

  return SCAN_STEPS.map((s, i) => {
    let status: "completed" | "active" | "pending";
    if (i < currentIdx) {
      status = "completed";
    } else if (i === currentIdx) {
      status = phase === "done" ? "completed" : "active";
    } else {
      status = "pending";
    }
    return { id: s.id, label: s.label, status };
  });
}

// ─── Section wrapper with reveal animation ────────────────

interface RevealSectionProps {
  section: OverviewSection;
  loadedSections: Set<OverviewSection>;
  delay: number;
  children: React.ReactNode;
  className?: string;
}

const RevealSection = React.memo(function RevealSection({
  section,
  loadedSections,
  delay,
  children,
  className,
}: RevealSectionProps) {
  const isLoaded = loadedSections.has(section);

  return (
    <div
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out",
        isLoaded
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
});

// ─── Section card wrapper ─────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}

const SectionCard = React.memo(function SectionCard({
  title,
  icon,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-vsc-surface-1 border border-vsc-border/15 rounded-lg p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon name={icon} tokenSize="xs" className="text-vsc-text-secondary" />
        <h3 className="text-sm font-semibold text-vsc-fg">{title}</h3>
      </div>
      {children}
    </div>
  );
});

// ─── Entry points tree ────────────────────────────────────

const EntryPointsTree = React.memo(function EntryPointsTree({
  entryPoints,
}: {
  entryPoints: NonNullable<ReturnType<typeof useAtomValue<typeof repoOverviewAtom>>>["entryPoints"];
}) {
  return (
    <div className="flex flex-col gap-3">
      {entryPoints.map((ep) => (
        <div key={ep.name} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Icon name="file-code" tokenSize="2xs" className="text-vsc-accent shrink-0" />
            <span className="text-xs font-medium text-vsc-fg">{ep.name}</span>
          </div>
          {ep.children.map((child, ci) => (
            <div key={child.name} className="flex items-center gap-2 pl-5">
              <span className="text-vsc-text-ghost text-2xs select-none">
                {ci === ep.children.length - 1 ? "\u2514" : "\u251C"}
              </span>
              <span className="text-2xs text-vsc-text-secondary">{child.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

// ─── Main component ───────────────────────────────────────

export const OverviewSurface = React.memo(function OverviewSurface() {
  const overview = useAtomValue(repoOverviewAtom);
  const phase = useAtomValue(repoScanPhaseAtom);
  const loadedSections = useAtomValue(repoSectionsLoadedAtom);
  const generate = useSetAtom(generateRepoOverviewAtom);

  // Trigger generation on mount — only in dev mode to avoid showing mock data to real users
  useEffect(() => {
    if (!overview && import.meta.env.DEV) {
      generate(MOCK_REPO_OVERVIEW);
    }
  }, [overview, generate]);

  // Timeline steps
  const timelineSteps = buildTimelineSteps(phase);

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-vsc-text-ghost">
        <Spinner className="w-5 h-5" />
        <p className="text-sm">Scanning repository...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-3 sm:px-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Icon name="repo" tokenSize="lg" className="text-vsc-accent" />
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-bold text-vsc-fg">{overview.projectName}</h1>
              <p className="text-sm text-vsc-text-secondary">{overview.tagline}</p>
            </div>
          </div>

          {/* Scan progress */}
          {phase !== "done" && (
            <div className="mt-2">
              <StepTimeline steps={timelineSteps} direction="horizontal" />
            </div>
          )}
        </div>

        {/* Architecture */}
        <RevealSection section="architecture" loadedSections={loadedSections} delay={0}>
          <SectionCard title="Architecture" icon="symbol-structure">
            <ArchDiagram
              nodes={overview.architecture.nodes}
              edges={overview.architecture.edges}
            />
          </SectionCard>
        </RevealSection>

        {/* Modules + Entry Points (2-col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RevealSection section="modules" loadedSections={loadedSections} delay={80}>
            <SectionCard title="Key Modules" icon="symbol-namespace">
              <ModuleList modules={overview.modules} />
            </SectionCard>
          </RevealSection>

          <RevealSection section="entry-points" loadedSections={loadedSections} delay={160}>
            <SectionCard title="Entry Points" icon="symbol-event">
              <EntryPointsTree entryPoints={overview.entryPoints} />
            </SectionCard>
          </RevealSection>
        </div>

        {/* Critical Flows */}
        <RevealSection section="flows" loadedSections={loadedSections} delay={240}>
          <SectionCard title="Critical Flows" icon="git-merge">
            <FlowCard flows={overview.criticalFlows} />
          </SectionCard>
        </RevealSection>

        {/* Conventions + Risks (2-col) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RevealSection section="conventions" loadedSections={loadedSections} delay={320}>
            <SectionCard title="Conventions" icon="book">
              <ConventionGrid conventions={overview.conventions} />
            </SectionCard>
          </RevealSection>

          <RevealSection section="risks" loadedSections={loadedSections} delay={400}>
            <SectionCard title="Risks & Debt" icon="shield">
              <RiskList risks={overview.risks} />
            </SectionCard>
          </RevealSection>
        </div>
      </div>
    </div>
  );
});
