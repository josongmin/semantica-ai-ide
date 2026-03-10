import React, { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import { latestRouteAtom, modelRoutesAtom } from "../../features/model-routing";
import type { ModelRoute } from "../../shared/protocol";
import { cn, Icon, Text, Tooltip } from "../../shared/ui";

// ─── Model family color mapping ──────────────────────────────
function getModelColor(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return "text-vsc-keyword";
  if (lower.includes("sonnet")) return "text-vsc-info";
  if (lower.includes("haiku")) return "text-vsc-success";
  if (lower.includes("gpt")) return "text-vsc-link";
  if (lower.includes("gemini")) return "text-vsc-warning";
  return "text-vsc-text-secondary";
}

function getModelIcon(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return "star-full";
  if (lower.includes("sonnet")) return "star-half";
  if (lower.includes("haiku")) return "zap";
  return "hubot";
}

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Route Row ───────────────────────────────────────────────
interface RouteRowProps {
  route: ModelRoute;
}

const RouteRow = React.memo(function RouteRow({ route }: RouteRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded",
        "border border-vsc-border/50 bg-vsc-bg-secondary",
      )}
      data-testid={`route-row-${route.timestamp_ms}`}
    >
      <Icon
        name={getModelIcon(route.model)}
        tokenSize="2xs"
        className={getModelColor(route.model)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Text size="xs" weight="medium" truncate>
            {route.task_type}
          </Text>
          <Icon name="arrow-right" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
          <Text size="xs" className={cn(getModelColor(route.model), "shrink-0")}>
            {route.model}
          </Text>
        </div>
        <Text size="2xs" tone="tertiary" truncate>
          {route.reason}
        </Text>
      </div>
      <Text size="2xs" tone="ghost" className="shrink-0">
        {formatTimestamp(route.timestamp_ms)}
      </Text>
    </div>
  );
});

/**
 * ModelRoutingIndicator: Compact indicator showing current routing decision,
 * with an expanded view showing recent routing history.
 */
export const ModelRoutingIndicator = React.memo(function ModelRoutingIndicator() {
  const latest = useAtomValue(latestRouteAtom);
  const routes = useAtomValue(modelRoutesAtom);
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (!latest) return null;

  return (
    <div data-testid="model-routing-indicator">
      {/* Compact indicator */}
      <Tooltip content={`${latest.task_type} routed to ${latest.model}: ${latest.reason}`}>
        <button
          type="button"
          onClick={toggleExpanded}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md",
            "border border-vsc-border/50 bg-vsc-bg-secondary",
            "hover:bg-vsc-toolbar transition-colors duration-fast",
            "cursor-pointer focus-ring",
          )}
          aria-expanded={expanded}
          aria-controls="model-routing-details"
          aria-label="Model routing decisions"
        >
          <Icon name="git-compare" tokenSize="2xs" className="text-vsc-text-tertiary" />
          <Text size="2xs" weight="medium" truncate className="max-w-[80px]">
            {latest.task_type}
          </Text>
          <Icon name="arrow-right" tokenSize="2xs" className="text-vsc-text-tertiary" />
          <Text size="2xs" className={getModelColor(latest.model)}>
            {latest.model}
          </Text>
          <Icon
            name={expanded ? "chevron-down" : "chevron-right"}
            tokenSize="2xs"
            className="text-vsc-text-tertiary"
          />
        </button>
      </Tooltip>

      {/* Expanded history */}
      {expanded && routes.length > 0 && (
        <div
          id="model-routing-details"
          className="mt-1 flex flex-col gap-1"
          data-testid="model-routing-history"
          role="list"
          aria-label="Recent model routing decisions"
        >
          {routes.map((route) => (
            <div key={route.timestamp_ms} role="listitem">
              <RouteRow route={route} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
