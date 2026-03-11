import React, { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Activity,
  Bot,
  Code2,
  LayoutGrid,
  Lightbulb,
  type LucideIcon,
  Settings,
  ShieldCheck,
  TerminalSquare,
  TrendingUp,
} from "lucide-react";

import { cn } from "~shared/ui";

import { detachToFloatingAtom } from "../model/floatingAtoms";
import {
  activeNavCategoryAtom,
  NAV_SECTIONS,
  type NavCategoryId,
  type NavToolId,
} from "../model/navRegistry";
import { activeSurfaceAtom, navBarExpandedAtom } from "../model/shellAtoms";

// ─── Icon Map (Lucide) ──────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  code: Code2,
  hubot: Bot,
  "graph-line": TrendingUp,
  lightbulb: Lightbulb,
  "symbol-structure": LayoutGrid,
  shield: ShieldCheck,
  dashboard: Activity,
  terminal: TerminalSquare,
  gear: Settings,
};

// ─── Nav Category / Tool data (inline for Lucide mapping) ──

interface NavEntry {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

const NAV_CATEGORIES: readonly (NavEntry & { id: NavCategoryId })[] = [
  { id: "ide", label: "IDE", icon: "code" },
  { id: "agent", label: "Agent", icon: "hubot" },
  { id: "graph", label: "Graph", icon: "graph-line" },
  { id: "intelligence", label: "Intelligence", icon: "lightbulb" },
  { id: "architecture", label: "Architecture", icon: "symbol-structure" },
  { id: "security", label: "Security", icon: "shield" },
  { id: "monitor", label: "Monitor", icon: "dashboard" },
];

const NAV_TOOLS: readonly (NavEntry & { id: NavToolId })[] = [
  { id: "terminal", label: "Terminal", icon: "terminal" },
  { id: "settings", label: "Settings", icon: "gear" },
];

// ─── Constants ──────────────────────────────────────────

const RAIL_W = 48;

// ─── Component ──────────────────────────────────────────

export const NavBar = React.memo(function NavBar({ width }: { width: number }) {
  const expanded = useAtomValue(navBarExpandedAtom);
  const [activeCategory, setActiveCategory] = useAtom(activeNavCategoryAtom);
  const setActiveSurface = useSetAtom(activeSurfaceAtom);
  const detachToFloating = useSetAtom(detachToFloatingAtom);

  const handleCategoryClick = useCallback(
    (id: NavCategoryId) => {
      setActiveCategory(id);
      if (id === "graph") setActiveSurface("graph");
      if (id === "agent") setActiveSurface("chat");
      if (id === "ide") setActiveSurface("code");
    },
    [setActiveCategory, setActiveSurface],
  );

  const handleToolClick = useCallback(
    (id: NavToolId) => {
      if (id === "terminal") {
        detachToFloating("terminal");
      } else if (id === "settings") {
        setActiveSurface("settings");
      }
    },
    [setActiveSurface, detachToFloating],
  );

  return (
    <nav
      className="flex flex-col h-full shrink-0 bg-vsc-surface-1 overflow-hidden transition-[width] duration-200 ease-out"
      style={{ width }}
      aria-label="Main navigation"
    >
      {expanded ? (
        /* ── Expanded: sections with labels ── */
        <div className="flex flex-col flex-1 min-h-0 py-2 overflow-y-auto overflow-x-hidden">
          {NAV_SECTIONS.map((section) => {
            const categories = section.categoryIds
              .map((id) => NAV_CATEGORIES.find((c) => c.id === id))
              .filter(Boolean) as (typeof NAV_CATEGORIES)[number][];
            const tools = section.toolIds
              ? (section.toolIds
                  .map((id) => NAV_TOOLS.find((t) => t.id === id))
                  .filter(Boolean) as (typeof NAV_TOOLS)[number][])
              : [];

            return (
              <div key={section.id} className="mb-2 last:mb-0">
                {section.label && (
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-vsc-text-ghost">
                      {section.label}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5 px-2">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const LucideIcon = ICON_MAP[cat.icon] ?? Code2;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.id)}
                        className={cn(
                          "flex items-center gap-3 h-8 px-2 rounded-[8px] shrink-0",
                          "cursor-pointer border-none focus-ring transition-colors duration-150",
                          isActive
                            ? "bg-vsc-surface-3/50 text-vsc-fg font-medium"
                            : "text-vsc-text-secondary hover:text-vsc-fg hover:bg-vsc-surface-3/30",
                        )}
                      >
                        <LucideIcon
                          size={20}
                          strokeWidth={1.75}
                          className={cn(
                            "shrink-0",
                            isActive ? "text-vsc-accent" : "text-vsc-text-ghost",
                          )}
                        />
                        <span className="text-[13px] truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                  {tools.map((tool) => {
                    const LucideIcon = ICON_MAP[tool.icon] ?? Settings;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleToolClick(tool.id)}
                        className="flex items-center gap-3 h-8 px-2 rounded-[8px] shrink-0
                                   cursor-pointer border-none focus-ring transition-colors duration-150
                                   text-vsc-text-secondary hover:text-vsc-fg hover:bg-vsc-surface-3/30"
                      >
                        <LucideIcon
                          size={20}
                          strokeWidth={1.75}
                          className="shrink-0 text-vsc-text-ghost"
                        />
                        <span className="text-[13px] truncate">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex-1" />

          {/* Footer */}
          <div className="px-2 mt-2">
            <button
              type="button"
              onClick={() => setActiveSurface("settings")}
              className="flex items-center gap-3 h-8 px-2 rounded-[8px] w-full
                         cursor-pointer border-none focus-ring transition-colors duration-150
                         text-vsc-text-secondary hover:text-vsc-fg hover:bg-vsc-surface-3/30"
            >
              <Settings size={20} strokeWidth={1.75} className="shrink-0 text-vsc-text-ghost" />
              <span className="text-[13px]">Settings</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Collapsed: icon rail ── */
        <div className="flex flex-col items-center py-3 gap-0.5" style={{ width: RAIL_W }}>
          {/* Logo */}
          <div className="flex items-center justify-center w-full h-8 mb-3 shrink-0">
            <NavLogo />
          </div>

          {/* Main nav icons */}
          <div className="flex flex-col items-center w-full gap-0.5">
            {NAV_CATEGORIES.map((cat) => (
              <NavIcon
                key={cat.id}
                icon={cat.icon}
                label={cat.label}
                isActive={activeCategory === cat.id}
                onClick={() => handleCategoryClick(cat.id)}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-5 h-px bg-vsc-border/30 my-2 shrink-0" />

          {/* Tool icons */}
          <div className="flex flex-col items-center w-full gap-0.5">
            {NAV_TOOLS.map((tool) => (
              <NavIcon
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                isActive={false}
                onClick={() => handleToolClick(tool.id)}
              />
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Settings */}
          <NavIcon
            icon="gear"
            label="Settings"
            isActive={false}
            onClick={() => setActiveSurface("settings")}
          />
        </div>
      )}
    </nav>
  );
});

// ─── Nav Icon (collapsed rail) ──────────────────────────

interface NavIconProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavIcon = React.memo(function NavIcon({ icon, label, isActive, onClick }: NavIconProps) {
  const LucideIcon = ICON_MAP[icon] ?? Code2;
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center justify-center w-9 h-9 shrink-0",
        "cursor-pointer border-none focus-ring transition-colors duration-150",
        "rounded-[8px]",
        isActive
          ? "text-vsc-fg bg-vsc-surface-3/60"
          : "text-vsc-text-ghost hover:text-vsc-fg hover:bg-vsc-surface-3/30",
      )}
    >
      <LucideIcon size={22} strokeWidth={1.75} />
    </button>
  );
});

// ─── Logo ────────────────────────────────────────────────

const NavLogo = React.memo(function NavLogo() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-vsc-text-secondary"
      aria-hidden
    >
      <path
        d="M4 14l3-6 3 6M10 10l2.5-4L15 10M14 8l2-3 2 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
