import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Activity,
  Bell,
  Bot,
  ChevronDown,
  Code2,
  GitBranch,
  LayoutGrid,
  Lightbulb,
  type LucideIcon,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  TerminalSquare,
  TrendingUp,
} from "lucide-react";

import { currentGitBranchAtom } from "~entities/git-history/model/atoms";
import {
  HAS_TRAFFIC_LIGHTS,
  startTauriDrag,
  toggleTauriMaximize,
} from "~shared/lib/hooks/usePlatform";
import { cn } from "~shared/ui";

import { conversationSearchOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import { detachToFloatingAtom } from "../model/floatingAtoms";
import { activeNavCategoryAtom, type NavCategoryId, type NavToolId } from "../model/navRegistry";
import { activeSurfaceAtom } from "../model/shellAtoms";

// ─── GNB CSS variable helpers ────────────────────────────

const gnb = {
  text: "var(--color-gnb-text)",
  textDim: "var(--color-gnb-text-dim)",
  textGhost: "var(--color-gnb-text-ghost)",
  hover: "var(--color-gnb-hover)",
  border: "var(--color-gnb-border)",
  pillBg: "var(--color-gnb-pill-bg)",
  accent: "var(--color-gnb-accent)",
  accentSecondary: "var(--color-gnb-accent-secondary)",
  glow: "var(--color-gnb-glow)",
  activeFrom: "var(--color-gnb-active-from)",
  activeTo: "var(--color-gnb-active-to)",
  from: "var(--color-gnb-from)",
  via: "var(--color-gnb-via)",
  to: "var(--color-gnb-to)",
} as const;

// ─── Nav Icon Map ────────────────────────────────────────

const NAV_ICON_MAP: Record<string, LucideIcon> = {
  ide: Code2,
  agent: Bot,
  graph: TrendingUp,
  intelligence: Lightbulb,
  architecture: LayoutGrid,
  security: ShieldCheck,
  monitor: Activity,
  terminal: TerminalSquare,
  settings: Settings,
};

interface NavItem {
  id: NavCategoryId;
  label: string;
  isTool?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: "ide", label: "IDE" },
  { id: "agent", label: "Agent" },
  { id: "graph", label: "Graph" },
  { id: "intelligence", label: "Intelligence" },
  { id: "architecture", label: "Architecture" },
  { id: "security", label: "Security" },
  { id: "monitor", label: "Monitor" },
  { id: "terminal" as NavCategoryId, label: "Terminal", isTool: true },
];

// ─── TitleBar Component ─────────────────────────────────

export const TitleBar = React.memo(function TitleBar() {
  const currentBranch = useAtomValue(currentGitBranchAtom);
  const setSearchOpen = useSetAtom(conversationSearchOpenAtom);
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

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  return (
    <header
      role="banner"
      className="relative flex items-center h-12 shrink-0 select-none"
      style={{
        background: `linear-gradient(135deg, ${gnb.from}, ${gnb.via} 50%, ${gnb.to})`,
        borderBottom: `1px solid ${gnb.border}`,
      }}
      onMouseDown={startTauriDrag}
      onDoubleClick={toggleTauriMaximize}
    >
      {/* ── Left: Project + Branch + Run/Debug ── */}
      <div
        ref={leftRef}
        className="flex items-center h-full shrink-0 gap-1 z-10"
        style={{ paddingLeft: HAS_TRAFFIC_LIGHTS ? 78 : 12 }}
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2 h-7 rounded-md text-[12px] font-medium
                     cursor-pointer border-none focus-ring transition-colors duration-150"
          style={{ color: gnb.text }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = gnb.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded text-[13px] font-bold shrink-0"
            style={{ backgroundColor: "rgba(139,92,246,0.25)", color: gnb.accent }}
          >
            S
          </span>
          <span className="truncate max-w-[140px]">semantica</span>
          <ChevronDown size={12} className="shrink-0" style={{ color: gnb.textGhost }} />
        </button>
      </div>

      {/* ── Center: Feature Nav (responsive overflow) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <ResponsiveNavGroup
          items={NAV_ITEMS}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
          onToolClick={handleToolClick}
          leftRef={leftRef}
          rightRef={rightRef}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Right: Branch + Search + Utilities ── */}
      <div ref={rightRef} className="flex items-center gap-1 px-3 shrink-0 z-10">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[12px]
                     cursor-pointer border-none focus-ring transition-colors duration-150"
          style={{ color: gnb.textDim }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = gnb.text;
            e.currentTarget.style.backgroundColor = gnb.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = gnb.textDim;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <GitBranch size={14} className="shrink-0" style={{ color: gnb.text }} />
          <span className="truncate max-w-[120px]">{currentBranch}</span>
          <ChevronDown size={12} className="shrink-0" style={{ color: gnb.textGhost }} />
        </button>
        <GnbIconButton Icon={Search} label="Search (⌘K)" onClick={() => setSearchOpen(true)} />
        <GnbIconButton Icon={Bell} label="Notifications" />
        <GnbIconButton
          Icon={Settings}
          label="Settings"
          onClick={() => handleToolClick("settings")}
        />
        <button
          type="button"
          className="flex items-center justify-center w-6 h-6 rounded-full shrink-0
                     text-[10px] font-bold cursor-pointer border-none focus-ring transition-colors duration-150"
          style={{ backgroundColor: "rgba(139,92,246,0.2)", color: gnb.accent }}
          title="Account"
          aria-label="Account"
        >
          U
        </button>
      </div>
    </header>
  );
});

// ─── Responsive Nav Group (overflow → "..." popup) ──────

/** Approximate width per nav button (icon + gap + label + padding) */
const ITEM_EST_W = 90;
/** Width for the "..." overflow button + GnbGroup padding */
const OVERFLOW_BTN_W = 40;
const GROUP_PADDING = 16;
/** Minimum gap between center nav and left/right sections */
const SAFETY_GAP = 32;
/** Maximum number of visible nav items in the GNB */
const MAX_VISIBLE_ITEMS = 6;

function ResponsiveNavGroup({
  items,
  activeCategory,
  onCategoryClick,
  onToolClick,
  leftRef,
  rightRef,
}: {
  items: readonly NavItem[];
  activeCategory: NavCategoryId;
  onCategoryClick: (id: NavCategoryId) => void;
  onToolClick: (id: NavToolId) => void;
  leftRef: React.RefObject<HTMLDivElement | null>;
  rightRef: React.RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Measure actual available space between left and right sections
  useEffect(() => {
    const header = containerRef.current?.closest("header");
    if (!header) return;

    const measure = () => {
      const headerW = header.clientWidth;
      const leftW = leftRef.current?.offsetWidth ?? 0;
      const rightW = rightRef.current?.offsetWidth ?? 0;
      const available = headerW - leftW - rightW - SAFETY_GAP * 2;
      const usable = available - GROUP_PADDING;

      // All items fit → show everything (capped at MAX_VISIBLE_ITEMS)
      const cappedTotal = Math.min(items.length, MAX_VISIBLE_ITEMS);
      const allItemsW = cappedTotal * ITEM_EST_W;
      if (allItemsW <= usable) {
        setVisibleCount(cappedTotal);
        return;
      }

      // Need overflow button → subtract its width
      const maxItems = Math.max(1, Math.floor((usable - OVERFLOW_BTN_W) / ITEM_EST_W));
      setVisibleCount(Math.min(cappedTotal, maxItems));
    };

    const ro = new ResizeObserver(measure);
    ro.observe(header);
    measure();
    return () => ro.disconnect();
  }, [items.length, leftRef, rightRef]);

  // Close popover on outside click
  useEffect(() => {
    if (!overflowOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [overflowOpen]);

  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);

  const handleItemClick = (item: NavItem) => {
    if (item.isTool) {
      onToolClick(item.id as NavToolId);
    } else {
      onCategoryClick(item.id);
    }
  };

  return (
    <div ref={containerRef} className="pointer-events-auto relative">
      <GnbGroup>
        {visible.map((item) => {
          const NavIcon = NAV_ICON_MAP[item.id] ?? Code2;
          return (
            <GnbNavButton
              key={item.id}
              Icon={NavIcon}
              label={item.label}
              isActive={!item.isTool && activeCategory === item.id}
              onClick={() => handleItemClick(item)}
            />
          );
        })}

        {overflow.length > 0 && (
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            title="More..."
            aria-label="More features"
            aria-expanded={overflowOpen}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0
                       cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring text-[12px]"
            style={{
              color: overflowOpen ? gnb.text : gnb.textDim,
              backgroundColor: overflowOpen ? gnb.hover : "transparent",
            }}
          >
            <MoreHorizontal size={15} strokeWidth={2} />
          </button>
        )}
      </GnbGroup>

      {/* Overflow popover */}
      {overflowOpen && overflow.length > 0 && (
        <div
          ref={popoverRef}
          className="absolute top-full mt-1.5 right-0 z-50 flex flex-col gap-0.5 p-1.5 rounded-lg min-w-[170px]"
          style={{
            background: `linear-gradient(160deg, ${gnb.from}, ${gnb.via})`,
            border: `1px solid ${gnb.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {overflow.map((item) => {
            const NavIcon = NAV_ICON_MAP[item.id] ?? Code2;
            const isItemActive = !item.isTool && activeCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  handleItemClick(item);
                  setOverflowOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] w-full text-left
                           cursor-pointer border-none transition-all duration-fast"
                style={{
                  color: isItemActive ? gnb.text : gnb.textDim,
                  fontWeight: isItemActive ? 500 : 400,
                  backgroundColor: isItemActive ? gnb.hover : "transparent",
                }}
              >
                <NavIcon size={15} strokeWidth={2} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── GNB Group ───────────────────────────────────────────

function GnbGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-0.5 px-1.5 h-8 rounded-lg", className)}
      style={{
        backgroundColor: gnb.pillBg,
        border: `1px solid ${gnb.border}`,
      }}
    >
      {children}
    </div>
  );
}

// ─── GNB Icon Button (Lucide) ────────────────────────────

function GnbIconButton({
  Icon,
  label,
  isActive,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md shrink-0
                 cursor-pointer bg-transparent border-none transition-all duration-fast focus-ring"
      style={{ color: isActive ? gnb.accent : gnb.textDim }}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

// ─── GNB Nav Button (icon + label) ──────────────────────

function GnbNavButton({
  Icon,
  label,
  isActive,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-2 h-6 rounded-md shrink-0",
        "cursor-pointer border-none transition-colors duration-150 focus-ring text-[12px]",
        !isActive && "bg-transparent",
      )}
      style={
        isActive
          ? {
              color: gnb.text,
              background: `linear-gradient(135deg, ${gnb.activeFrom}, ${gnb.activeTo})`,
              border: `1px solid ${gnb.border}`,
            }
          : { color: gnb.textDim, border: "1px solid transparent" }
      }
    >
      <Icon
        size={15}
        strokeWidth={2}
        className="shrink-0"
        style={isActive ? { color: gnb.accentSecondary } : undefined}
      />
      <span>{label}</span>
    </button>
  );
}
