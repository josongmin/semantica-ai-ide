import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { inferLanguage } from "~shared/bootstrap/workspace-awareness";

import { useOverlayBehavior } from "../../shared/lib";
import { fuzzyScore } from "../../shared/lib/fuzzyScore";
import { cn, HighlightedText, Icon, OverlayPortal, Text } from "../../shared/ui";

const MAX_VISIBLE = 20;

export interface FileMentionPopoverProps {
  open: boolean;
  onClose: () => void;
  onSelect: (filePath: string) => void;
  files: readonly string[];
  query: string;
  anchorRect: DOMRect | null;
}

export const FileMentionPopover = React.memo(function FileMentionPopover({
  open,
  onClose,
  onSelect,
  files,
  query,
  anchorRect,
}: FileMentionPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return files.slice(0, MAX_VISIBLE);
    const scored: { path: string; match: { score: number; indices: number[] } }[] = [];
    for (const f of files) {
      const match = fuzzyScore(query, f);
      if (match) scored.push({ path: f, match });
    }
    scored.sort((a, b) => b.match.score - a.match.score);
    return scored.slice(0, MAX_VISIBLE).map((s) => s.path);
  }, [files, query]);

  // Reset focus when filtered list changes
  useEffect(() => {
    setFocusIndex(0);
  }, [filtered]);

  const { mounted, exiting } = useOverlayBehavior({
    id: "file-mention",
    type: "popover",
    open,
    onClose,
    containerRef: popoverRef,
    clickOutside: true,
  });

  // Use refs to avoid stale closures in the window listener,
  // preventing repeated add/remove on every focusIndex change.
  const filteredRef = useRef(filtered);
  useLayoutEffect(() => {
    filteredRef.current = filtered;
  });
  const focusIndexRef = useRef(focusIndex);
  useLayoutEffect(() => {
    focusIndexRef.current = focusIndex;
  });
  const onSelectRef = useRef(onSelect);
  useLayoutEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      const currentFiltered = filteredRef.current;
      if (currentFiltered.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((prev) => (prev + 1) % currentFiltered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) => (prev - 1 + currentFiltered.length) % currentFiltered.length);
          break;
        case "Enter":
        case "Tab": {
          e.preventDefault();
          const selected = currentFiltered[focusIndexRef.current];
          if (selected !== undefined) {
            onSelectRef.current(selected);
          }
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!mounted || !anchorRect || filtered.length === 0) return null;

  return (
    <OverlayPortal>
      <div
        ref={popoverRef}
        data-testid="file-mention-popover"
        style={{
          position: "fixed",
          bottom: window.innerHeight - anchorRect.top + 4,
          left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - 408)),
          maxWidth: Math.min(400, window.innerWidth - 16),
        }}
        className={cn(
          "z-[--z-overlay]",
          "glass-panel border border-vsc-border/40 rounded-lg shadow-lg py-1 max-h-[--panel-max-h-sm] overflow-y-auto scroll-shadow",
          exiting ? "opacity-0" : "opacity-100",
        )}
      >
        {filtered.map((file, index) => {
          const fileName = file.split("/").pop() ?? file;
          const dirPath = file.slice(0, file.length - fileName.length);
          const lang = inferLanguage(file);
          const match = query ? fuzzyScore(query, fileName) : null;
          // Rough token estimate: ~4 chars per token average
          const tokenEstimate = Math.ceil(file.length * 2);
          return (
            <button
              key={file}
              type="button"
              onClick={() => onSelect(file)}
              className={cn(
                "w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer",
                "focus-ring",
                index === focusIndex ? "bg-vsc-list-hover" : "hover:bg-vsc-list-hover",
              )}
              data-testid={`file-mention-item-${index}`}
            >
              <Icon name="file" tokenSize="xs" className="shrink-0 text-vsc-text-tertiary" />
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="flex items-center gap-1 truncate min-w-0">
                  {match ? (
                    <HighlightedText text={fileName} indices={match.indices} className="text-xs" />
                  ) : (
                    <Text size="xs" tone="primary" as="span">
                      {fileName}
                    </Text>
                  )}
                  {lang && (
                    <Text size="2xs" tone="ghost" as="span">
                      {lang}
                    </Text>
                  )}
                </span>
                {dirPath && (
                  <Text size="2xs" tone="ghost" as="span" truncate>
                    {dirPath}
                  </Text>
                )}
              </span>
              <Text size="2xs" tone="ghost" as="span" className="shrink-0">
                ~{tokenEstimate} tok
              </Text>
            </button>
          );
        })}
      </div>
    </OverlayPortal>
  );
});
