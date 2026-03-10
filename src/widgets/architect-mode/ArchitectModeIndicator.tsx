import React, { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import { architectStateAtom } from "../../features/architect-mode";
import type { ArchitectRole } from "../../shared/protocol";
import { Badge, cn, Icon, Text, Tooltip } from "../../shared/ui";

// ─── Role color mapping ──────────────────────────────────────
const ROLE_COLORS: Record<ArchitectRole, { bg: string; text: string; border: string }> = {
  planner: {
    bg: "bg-vsc-keyword/15",
    text: "text-vsc-keyword",
    border: "border-vsc-keyword/40",
  },
  coder: {
    bg: "bg-vsc-info/15",
    text: "text-vsc-info",
    border: "border-vsc-info/40",
  },
  critic: {
    bg: "bg-vsc-warning/15",
    text: "text-vsc-warning",
    border: "border-vsc-warning/40",
  },
};

const ROLE_ICONS: Record<ArchitectRole, string> = {
  planner: "lightbulb",
  coder: "code",
  critic: "eye",
};

const TRANSITION_MS = 300;

const ROLE_LABELS: Record<ArchitectRole, string> = {
  planner: "Planner",
  coder: "Coder",
  critic: "Critic",
};

/**
 * ArchitectModeIndicator: Shows which model role is currently active
 * (Planner, Coder, or Critic) with color coding and transition animation.
 */
export const ArchitectModeIndicator = React.memo(function ArchitectModeIndicator() {
  const state = useAtomValue(architectStateAtom);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevRoleRef = useRef<ArchitectRole | null>(null);

  // Trigger transition animation when role changes
  useEffect(() => {
    if (!state) return;
    if (prevRoleRef.current !== null && prevRoleRef.current !== state.active_role) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
      prevRoleRef.current = state.active_role;
      return () => clearTimeout(timer);
    }
    prevRoleRef.current = state.active_role;
  }, [state]);

  if (!state) return null;

  const role = state.active_role;
  const colors = ROLE_COLORS[role];
  const tooltipContent = state.task_description
    ? `${ROLE_LABELS[role]}: ${state.model_name} - ${state.task_description}`
    : `${ROLE_LABELS[role]}: ${state.model_name}`;

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border",
          "transition-[transform,opacity] duration-slow ease-in-out",
          colors.bg,
          colors.border,
          isTransitioning && "scale-105 opacity-80",
        )}
        data-testid="architect-mode-indicator"
        role="status"
        aria-label={`Architect mode: ${ROLE_LABELS[role]} using ${state.model_name}`}
      >
        <Icon
          name={ROLE_ICONS[role]}
          tokenSize="2xs"
          className={cn(colors.text, isTransitioning && "animate-pulse")}
        />
        <Badge text={ROLE_LABELS[role]} />
        <Text size="2xs" tone="secondary" truncate className="max-w-[100px]">
          {state.model_name}
        </Text>
      </div>
    </Tooltip>
  );
});
