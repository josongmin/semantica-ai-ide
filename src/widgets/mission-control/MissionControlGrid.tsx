import React, { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import {
  agentGridLayoutAtom,
  missionControlAgentsListAtom,
  missionControlStatusCountsAtom,
  missionControlVisibleAtom,
} from "../../features/parallel-agents";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import { Button, cn, EmptyState, Icon, SegmentedControl, Text } from "../../shared/ui";
import { MissionControlCard } from "./MissionControlCard";

const layoutOptions = [
  { value: "grid" as const, label: "Grid", icon: "layout" },
  { value: "list" as const, label: "List", icon: "list-flat" },
];

/**
 * Mission Control: Grid view for monitoring multiple parallel agents.
 * Shows a grid (or list) of agent cards with status, progress, and risk info.
 * Click a card to navigate to that agent's chat session.
 */
export const MissionControlGrid = React.memo(function MissionControlGrid() {
  const [visible, setVisible] = useAtom(missionControlVisibleAtom);
  const agents = useAtomValue(missionControlAgentsListAtom);
  const counts = useAtomValue(missionControlStatusCountsAtom);
  const [layout, setLayout] = useAtom(agentGridLayoutAtom);

  const handleNavigate = useCallback((sessionId: string) => {
    getVscodeApi().postMessage({ type: "RESUME_SESSION", session_id: sessionId });
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  if (!visible) return null;

  return (
    <div
      className="flex flex-col gap-2 p-3 border-b border-vsc-border bg-vsc-bg"
      data-testid="mission-control-grid"
      role="region"
      aria-label="Mission Control"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="dashboard" tokenSize="sm" className="text-vsc-text-secondary" />
          <Text size="sm" weight="semibold">
            Mission Control
          </Text>
          <div className="flex items-center gap-1.5 ml-2">
            {counts.running > 0 && (
              <span className="flex items-center gap-1 text-2xs text-vsc-success">
                <Icon name="play" tokenSize="2xs" />
                {counts.running}
              </span>
            )}
            {counts.idle > 0 && (
              <span className="flex items-center gap-1 text-2xs text-vsc-warning">
                <Icon name="watch" tokenSize="2xs" />
                {counts.idle}
              </span>
            )}
            {counts.error > 0 && (
              <span className="flex items-center gap-1 text-2xs text-vsc-error">
                <Icon name="error" tokenSize="2xs" />
                {counts.error}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <SegmentedControl options={layoutOptions} value={layout} onValueChange={setLayout} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Close Mission Control"
          >
            <Icon name="close" tokenSize="2xs" />
          </Button>
        </div>
      </div>

      {/* Agent Grid/List */}
      {agents.length === 0 ? (
        <EmptyState
          icon="robot"
          title="No agents running"
          description="Parallel agents will appear here when active."
        />
      ) : (
        <div
          className={cn(
            layout === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-col gap-2",
          )}
          role="list"
          aria-label="Agent list"
        >
          {agents.map((agent) => (
            <div key={agent.id} role="listitem">
              <MissionControlCard agent={agent} onNavigate={handleNavigate} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
