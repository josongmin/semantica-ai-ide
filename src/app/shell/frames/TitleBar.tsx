import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { getAllSurfaces, type SurfaceDefinition } from "~app/surfaceRegistry";
import { runningAgentsCountAtom } from "~entities/agent-instance";
import { hasGitCommitsAtom } from "~entities/git-history";
import { runningJobsCountAtom } from "~shared/bootstrap/background-agent";
import {
  HAS_TRAFFIC_LIGHTS,
  startTauriDrag,
  toggleTauriMaximize,
} from "~shared/lib/hooks/usePlatform";
import { cn, Icon } from "~shared/ui";

import {
  activeFeatureSheetAtom,
  type FeatureSheetId,
  toggleFeatureSheetAtom,
} from "../../../shared/lib";
import type { SurfaceId } from "../../../shared/protocol/types/ui";
import { CommandPaletteTrigger } from "../components/CommandPaletteTrigger";
import { LayoutToggleGroup } from "../components/LayoutToggleGroup";
import { Separator } from "../components/TopBarPrimitives";
import { activeSurfaceAtom } from "../model/shellAtoms";

// ─── Primary GNB Tabs (always visible, centered) ────────
const PRIMARY_TAB_IDS: readonly SurfaceId[] = ["code", "graph", "tasks", "settings"];

// ─── Surface Categories for the card gallery ─────────────
interface SurfaceCategory {
  readonly title: string;
  readonly ids: readonly SurfaceId[];
}

const SURFACE_CATEGORIES: readonly SurfaceCategory[] = [
  {
    title: "Workspace",
    ids: ["code", "editor", "graph", "overview"],
  },
  {
    title: "AI & Agents",
    ids: ["chat", "agent", "agents", "orchestrator", "reasoning"],
  },
  {
    title: "Review & History",
    ids: ["review", "replay", "timeline"],
  },
  {
    title: "Utilities",
    ids: ["tasks", "settings"],
  },
];

// Short descriptions for each surface
const SURFACE_DESCRIPTIONS: Partial<Record<SurfaceId, string>> = {
  code: "IDE with sidebar, panels & editor",
  editor: "Focused code editing",
  graph: "File & symbol dependency graph",
  overview: "Project dashboard & stats",
  chat: "AI conversation & prompts",
  agent: "Single agent orchestration",
  agents: "Multi-agent fleet management",
  orchestrator: "Agent pipeline control",
  reasoning: "AI reasoning trace viewer",
  review: "Code review & diff viewer",
  replay: "Session replay & playback",
  timeline: "Activity timeline & events",
  tasks: "TODO list & agent tasks",
  settings: "App preferences & config",
};

// ─── Tool definitions for the gallery ────────────────────
interface ToolDef {
  readonly id: NonNullable<FeatureSheetId>;
  readonly label: string;
  readonly icon: string;
  readonly desc?: string;
}

interface ToolCategory {
  readonly title: string;
  readonly tools: readonly ToolDef[];
}

const TOOL_CATEGORIES: readonly ToolCategory[] = [
  {
    title: "AI & Agents",
    tools: [
      { id: "agents", label: "Agents", icon: "server-process", desc: "Parallel agent fleet" },
      { id: "bg-agents", label: "BG Agents", icon: "robot", desc: "Background agents" },
      { id: "mission", label: "Mission", icon: "layout", desc: "Mission control grid" },
      { id: "pipeline", label: "Pipeline", icon: "beaker", desc: "Agent pipeline" },
      { id: "intent", label: "Intent", icon: "timeline-open", desc: "Intent timeline" },
    ],
  },
  {
    title: "Workspace",
    tools: [
      { id: "search", label: "Search", icon: "search", desc: "Semantic code search" },
      { id: "git", label: "Git", icon: "git-commit", desc: "Git history & commits" },
      { id: "review", label: "Review", icon: "git-pull-request", desc: "Review file changes" },
      { id: "workspace", label: "Workspace", icon: "files", desc: "Workspace awareness" },
      { id: "graph", label: "Graph", icon: "graph-line", desc: "Workspace graph" },
      { id: "terminal", label: "Terminal", icon: "terminal", desc: "Terminal bridge" },
    ],
  },
  {
    title: "Knowledge",
    tools: [
      { id: "wiki", label: "Wiki", icon: "book", desc: "DeepWiki docs" },
      { id: "notes", label: "Notes", icon: "note", desc: "Scratchpad notes" },
      { id: "snapshots", label: "Snapshots", icon: "save", desc: "Machine snapshots" },
      { id: "compact", label: "Compact", icon: "fold", desc: "Compaction history" },
    ],
  },
  {
    title: "Monitor",
    tools: [
      { id: "jobs", label: "Jobs", icon: "cloud", desc: "Background jobs" },
      { id: "resources", label: "Resources", icon: "dashboard", desc: "Resource monitor" },
      { id: "activity", label: "Activity", icon: "output", desc: "Activity feed" },
      { id: "preview", label: "Preview", icon: "open-preview", desc: "Live preview" },
    ],
  },
];

// ─── Component ──────────────────────────────────────────

export const TitleBar = React.memo(function TitleBar() {
  const [activeSurface, setActiveSurface] = useAtom(activeSurfaceAtom);
  const allSurfaces = getAllSurfaces();
  const activeSheet = useAtomValue(activeFeatureSheetAtom);
  const toggleSheet = useSetAtom(toggleFeatureSheetAtom);
  const runningAgentsCount = useAtomValue(runningAgentsCountAtom);
  const hasGitCommits = useAtomValue(hasGitCommitsAtom);
  const bgJobsCount = useAtomValue(runningJobsCountAtom);

  const badges = useMemo<Partial<Record<string, number | boolean>>>(
    () => ({
      agents: runningAgentsCount > 0 ? runningAgentsCount : undefined,
      git: hasGitCommits || undefined,
      jobs: bgJobsCount > 0 ? bgJobsCount : undefined,
    }),
    [runningAgentsCount, hasGitCommits, bgJobsCount],
  );

  const primaryTabs = PRIMARY_TAB_IDS.map((id) => allSurfaces.find((s) => s.id === id)).filter(
    (s): s is SurfaceDefinition => s != null,
  );

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const toggleGallery = useCallback(() => {
    setGalleryOpen((prev) => !prev);
  }, []);

  const selectSurface = useCallback(
    (id: SurfaceId) => {
      setActiveSurface(id);
      setGalleryOpen(false);
    },
    [setActiveSurface],
  );

  const openSettings = useCallback(() => {
    setActiveSurface("settings");
  }, [setActiveSurface]);

  // Close gallery on click outside
  useEffect(() => {
    if (!galleryOpen) return;
    function handleClick(e: MouseEvent) {
      if (galleryRef.current && !galleryRef.current.contains(e.target as Node)) {
        setGalleryOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setGalleryOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [galleryOpen]);

  const isOverflowActive = !PRIMARY_TAB_IDS.includes(activeSurface);

  return (
    <header
      role="banner"
      className="relative flex items-center h-[40px] bg-vsc-surface-1 border-b border-vsc-border/30 shrink-0 select-none"
      onMouseDown={startTauriDrag}
      onDoubleClick={toggleTauriMaximize}
    >
      {/* ── Left: traffic lights / logo ── */}
      <div
        className="flex items-center justify-center h-full shrink-0"
        style={{ width: HAS_TRAFFIC_LIGHTS ? 96 : 40 }}
      >
        {!HAS_TRAFFIC_LIGHTS && (
          <div className="w-4 h-4 rounded bg-vsc-accent/15 flex items-center justify-center">
            <Icon name="sparkle" tokenSize="2xs" className="text-vsc-accent" />
          </div>
        )}
      </div>

      {/* ── Center: GNB tabs (absolute center) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <nav
          className="flex items-center gap-0.5 pointer-events-auto"
          role="tablist"
          aria-label="Surfaces"
        >
          {primaryTabs.map((tab) => {
            const isActive = activeSurface === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveSurface(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 h-6 text-[11px] rounded-full relative",
                  "cursor-pointer border-none shrink-0 focus-ring",
                  "transition-all duration-normal",
                  isActive
                    ? "bg-vsc-accent/15 text-vsc-accent font-semibold"
                    : "bg-transparent text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
                )}
              >
                <Icon
                  name={tab.icon}
                  tokenSize="2xs"
                  className={cn("shrink-0", isActive && "text-vsc-accent")}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* ── "..." Gallery trigger ── */}
          <div className="relative" ref={galleryRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={galleryOpen}
              onClick={toggleGallery}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full relative",
                "cursor-pointer border-none shrink-0 focus-ring",
                "transition-all duration-normal",
                galleryOpen || isOverflowActive
                  ? "bg-vsc-accent/15 text-vsc-accent"
                  : "bg-transparent text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
              )}
              title="All features"
            >
              <Icon name="ellipsis" tokenSize="2xs" />
            </button>

            {/* ── Gallery Panel (card view) ── */}
            {galleryOpen && (
              <SurfaceGallery
                allSurfaces={allSurfaces}
                activeSurface={activeSurface}
                onSelect={selectSurface}
                activeSheet={activeSheet}
                onToggleSheet={toggleSheet}
                badges={badges}
              />
            )}
          </div>
        </nav>
      </div>

      {/* ── Right: Search + Layout toggles + Settings ── */}
      <div className="ml-auto flex items-center gap-0.5 px-2 shrink-0">
        <CommandPaletteTrigger />
        <Separator />
        <LayoutToggleGroup />
        <Separator />
        <button
          type="button"
          onClick={openSettings}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-full",
            "cursor-pointer border-none shrink-0 focus-ring",
            "transition-all duration-normal",
            "bg-transparent text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
          )}
          title="Settings"
          aria-label="Settings"
        >
          <Icon name="gear" tokenSize="2xs" />
        </button>
      </div>
    </header>
  );
});

// ─── Surface Gallery (card view) ─────────────────────────

interface SurfaceGalleryProps {
  allSurfaces: readonly SurfaceDefinition[];
  activeSurface: SurfaceId;
  onSelect: (id: SurfaceId) => void;
  activeSheet: FeatureSheetId;
  onToggleSheet: (id: FeatureSheetId) => void;
  badges: Partial<Record<string, number | boolean>>;
}

const SurfaceGallery = React.memo(function SurfaceGallery({
  allSurfaces,
  activeSurface,
  onSelect,
  activeSheet,
  onToggleSheet,
  badges,
}: SurfaceGalleryProps) {
  const surfaceMap = new Map(allSurfaces.map((s) => [s.id, s]));

  return (
    <div
      className={cn(
        "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] z-(--z-overlay)",
        "rounded-lg border border-vsc-border bg-vsc-bg/95 backdrop-blur-lg",
        "shadow-lg shadow-black/20",
        "p-3 max-h-[80vh] overflow-y-auto scrollbar-thin",
        "animate-in fade-in slide-in-from-top-1 duration-fast",
      )}
      role="dialog"
      aria-label="All features"
    >
      {/* ── Surfaces ── */}
      {SURFACE_CATEGORIES.map((category) => {
        const surfaces = category.ids
          .map((id) => surfaceMap.get(id))
          .filter((s): s is SurfaceDefinition => s != null);
        if (surfaces.length === 0) return null;

        return (
          <div key={category.title} className="mb-3 last:mb-0">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-vsc-text-ghost mb-1.5 px-1">
              {category.title}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {surfaces.map((surface) => {
                const isActive = activeSurface === surface.id;
                const desc = SURFACE_DESCRIPTIONS[surface.id];
                return (
                  <button
                    key={surface.id}
                    type="button"
                    onClick={() => onSelect(surface.id)}
                    className={cn(
                      "flex items-start gap-2.5 p-2 rounded-md text-left",
                      "cursor-pointer border-none focus-ring",
                      "transition-all duration-fast group",
                      isActive
                        ? "bg-vsc-accent/12 ring-1 ring-vsc-accent/30"
                        : "bg-vsc-surface-2/20 hover:bg-vsc-surface-2/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-md shrink-0 mt-px",
                        "transition-colors duration-fast",
                        isActive
                          ? "bg-vsc-accent/20 text-vsc-accent"
                          : "bg-vsc-surface-2/40 text-vsc-text-tertiary group-hover:text-vsc-fg group-hover:bg-vsc-surface-2/60",
                      )}
                    >
                      <Icon name={surface.icon} tokenSize="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-[11px] font-medium leading-tight",
                          isActive ? "text-vsc-accent" : "text-vsc-fg",
                        )}
                      >
                        {surface.label}
                      </div>
                      {desc && (
                        <div className="text-[10px] text-vsc-text-ghost leading-snug mt-0.5 line-clamp-1">
                          {desc}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-vsc-accent shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Divider ── */}
      <div className="h-px bg-vsc-border/30 my-3" />

      {/* ── Tools (Feature Sheets) ── */}
      {TOOL_CATEGORIES.map((category) => (
        <div key={category.title} className="mb-3 last:mb-0">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-vsc-text-ghost mb-1.5 px-1">
            {category.title}
          </h3>
          <div className="grid grid-cols-3 gap-1">
            {category.tools.map((tool) => {
              const isActive = activeSheet === tool.id;
              const badge = badges[tool.id];
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onToggleSheet(tool.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
                    "cursor-pointer border-none focus-ring",
                    "transition-all duration-fast group",
                    isActive
                      ? "bg-vsc-accent/12 ring-1 ring-vsc-accent/30"
                      : "bg-transparent hover:bg-vsc-surface-2/40",
                  )}
                >
                  <Icon
                    name={tool.icon}
                    tokenSize="2xs"
                    className={cn(
                      "shrink-0 transition-colors duration-fast",
                      isActive
                        ? "text-vsc-accent"
                        : "text-vsc-text-tertiary group-hover:text-vsc-fg",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] leading-tight truncate",
                      isActive ? "text-vsc-accent font-medium" : "text-vsc-fg",
                    )}
                  >
                    {tool.label}
                  </span>
                  {typeof badge === "number" && badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-vsc-badge-bg text-vsc-badge-fg text-[9px] font-semibold leading-none tabular-nums shrink-0 ml-auto">
                      {badge}
                    </span>
                  )}
                  {badge === true && (
                    <span className="size-1.5 rounded-full bg-vsc-error shrink-0 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
