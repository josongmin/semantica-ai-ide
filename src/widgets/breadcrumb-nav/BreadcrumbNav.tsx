import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { breadcrumbContextAtom, clearBreadcrumbBelowAtom } from "../../features/breadcrumb-nav";
import { focusedTurnIdAtom } from "../../shared/lib";
import { extractFileName } from "../../shared/lib/pathUtils";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import { cn, Icon, Text, Tooltip } from "../../shared/ui";

interface BreadcrumbSegment {
  key: string;
  label: string;
  icon: string;
  tooltip: string;
  onClick: () => void;
}

/**
 * Breadcrumb Navigation: Shows current location as clickable segments.
 * Session -> Turn -> File -> Symbol
 *
 * Each segment navigates to that level when clicked.
 */
export const BreadcrumbNav = React.memo(function BreadcrumbNav() {
  const context = useAtomValue(breadcrumbContextAtom);
  const setFocusedTurn = useSetAtom(focusedTurnIdAtom);
  const clearBelow = useSetAtom(clearBreadcrumbBelowAtom);

  const handleSessionClick = useCallback(() => {
    // Scroll to top of chat
    const messageList = document.querySelector("[data-testid='message-list']");
    messageList?.scrollTo({ top: 0, behavior: "smooth" });
    clearBelow("session");
  }, [clearBelow]);

  const handleTurnClick = useCallback(() => {
    if (context.turn_id) {
      setFocusedTurn(context.turn_id);
      clearBelow("turn");
    }
  }, [context.turn_id, setFocusedTurn, clearBelow]);

  const handleFileClick = useCallback(() => {
    if (context.file_path) {
      getVscodeApi().postMessage({ type: "OPEN_FILE", file_path: context.file_path });
      clearBelow("file");
    }
  }, [context.file_path, clearBelow]);

  const handleSymbolClick = useCallback(() => {
    // Symbol click opens file at the symbol's location
    if (context.file_path) {
      getVscodeApi().postMessage({ type: "OPEN_FILE", file_path: context.file_path });
    }
  }, [context.file_path]);

  // Build segments from context
  const segments: BreadcrumbSegment[] = [];

  if (context.session_name) {
    segments.push({
      key: "session",
      label: context.session_name,
      icon: "comment-discussion",
      tooltip: "Scroll to top of session",
      onClick: handleSessionClick,
    });
  }

  if (context.turn_id) {
    segments.push({
      key: "turn",
      label: context.turn_label ?? `Turn`,
      icon: "debug-step-into",
      tooltip: `Jump to turn ${context.turn_label ?? context.turn_id}`,
      onClick: handleTurnClick,
    });
  }

  if (context.file_path) {
    segments.push({
      key: "file",
      label: extractFileName(context.file_path),
      icon: "file",
      tooltip: context.file_path,
      onClick: handleFileClick,
    });
  }

  if (context.symbol_name) {
    segments.push({
      key: "symbol",
      label: context.symbol_name,
      icon: "symbol-method",
      tooltip: `Symbol: ${context.symbol_name}`,
      onClick: handleSymbolClick,
    });
  }

  if (segments.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1 px-3 py-1 border-b border-vsc-border bg-vsc-bg-secondary overflow-x-auto"
      aria-label="Breadcrumb navigation"
      data-testid="breadcrumb-nav"
    >
      {segments.map((segment, index) => (
        <React.Fragment key={segment.key}>
          {index > 0 && (
            <Icon
              name="chevron-right"
              tokenSize="2xs"
              className="text-vsc-text-tertiary shrink-0 mx-0.5"
              aria-hidden
            />
          )}
          <Tooltip content={segment.tooltip}>
            <button
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                "text-vsc-text-secondary hover:text-vsc-text hover:bg-vsc-bg-tertiary",
                "transition-[color,background-color,transform] duration-fast cursor-pointer whitespace-nowrap focus-ring active:scale-95",
              )}
              onClick={segment.onClick}
              aria-label={segment.tooltip}
              data-testid={`breadcrumb-${segment.key}`}
            >
              <Icon name={segment.icon} tokenSize="xs" className="shrink-0" />
              <Text size="xs">{segment.label}</Text>
            </button>
          </Tooltip>
        </React.Fragment>
      ))}
    </nav>
  );
});
