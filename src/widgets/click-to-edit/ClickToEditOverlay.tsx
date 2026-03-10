import React, { useCallback, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { clickToEditEnabledAtom, elementMappingsAtom } from "../../features/click-to-edit";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { ElementMapping } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

// ─── Helpers ─────────────────────────────────────────────────

/** Find the best matching element mapping for a given element */
function findMappingForElement(
  element: HTMLElement,
  mappings: readonly ElementMapping[],
): ElementMapping | null {
  for (const mapping of mappings) {
    try {
      if (element.matches(mapping.selector)) {
        return mapping;
      }
    } catch {
      /* silently ignore — invalid CSS selector in mapping; skip to next */
    }
  }
  // Walk up the DOM tree
  if (element.parentElement) {
    return findMappingForElement(element.parentElement, mappings);
  }
  return null;
}

// ─── ClickToEditOverlay ──────────────────────────────────────

/**
 * AS-05: Click-to-Edit transparent overlay for preview panels.
 * Hover highlights elements with a blue outline.
 * Click sends element info to the extension for source code lookup.
 */
export const ClickToEditOverlay = React.memo(function ClickToEditOverlay() {
  const enabled = useAtomValue(clickToEditEnabledAtom);
  const mappings = useAtomValue(elementMappingsAtom);
  const setEnabled = useSetAtom(clickToEditEnabledAtom);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hoveredMapping, setHoveredMapping] = useState<ElementMapping | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || mappings.length === 0) return;

      // Get the element underneath the overlay
      const overlay = overlayRef.current;
      if (!overlay) return;

      // Temporarily hide overlay to get element beneath
      overlay.style.pointerEvents = "none";
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      overlay.style.pointerEvents = "auto";

      if (elementBelow) {
        const mapping = findMappingForElement(elementBelow, mappings);
        if (mapping) {
          setHoveredMapping(mapping);
          setHoverRect(elementBelow.getBoundingClientRect());
          return;
        }
      }

      setHoveredMapping(null);
      setHoverRect(null);
    },
    [enabled, mappings],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredMapping(null);
    setHoverRect(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !hoveredMapping) return;
      e.preventDefault();
      e.stopPropagation();

      getVscodeApi().postMessage({
        type: "NAVIGATE_TO_SOURCE",
        file_path: hoveredMapping.file_path,
        line: hoveredMapping.line,
        column: hoveredMapping.column,
      });
    },
    [enabled, hoveredMapping],
  );

  const handleToggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        className={cn(
          "absolute top-2 right-2 z-[--z-overlay] flex items-center gap-1 px-2 py-1 rounded",
          "text-xs border transition-colors duration-fast focus-ring cursor-pointer",
          enabled
            ? "bg-vsc-info/20 border-vsc-info/50 text-vsc-info"
            : "bg-vsc-bg border-vsc-panel-border text-vsc-text-secondary hover:bg-vsc-list-hover",
        )}
        onClick={handleToggle}
        title={enabled ? "Disable click-to-edit" : "Enable click-to-edit"}
        data-testid="click-to-edit-toggle"
      >
        <Icon name="inspect" tokenSize="xs" />
        <Text as="span" size="xs">{enabled ? "Inspecting" : "Inspect"}</Text>
      </button>

      {/* Overlay */}
      {enabled && (
        <div
          ref={overlayRef}
          className="absolute inset-0 z-[--z-overlay] cursor-crosshair focus-ring"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          data-testid="click-to-edit-overlay"
          role="button"
          tabIndex={-1}
          aria-label="Click an element to navigate to its source code"
        >
          {/* Hover highlight */}
          {hoveredMapping && hoverRect && (
            <div
              className="fixed pointer-events-none border-2 border-vsc-info rounded-sm bg-vsc-info/10"
              style={{
                top: hoverRect.top,
                left: hoverRect.left,
                width: hoverRect.width,
                height: hoverRect.height,
              }}
              data-testid="click-to-edit-highlight"
            >
              {/* Tooltip showing file path */}
              <div className="absolute -top-6 left-0 bg-vsc-info text-vsc-button-fg text-2xs px-1.5 py-0.5 rounded whitespace-nowrap">
                {hoveredMapping.file_path}:{hoveredMapping.line}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status bar indicator */}
      {enabled && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[--z-overlay] flex items-center gap-1.5 px-2 py-1 bg-vsc-info/10 border-t border-vsc-info/30"
          data-testid="click-to-edit-status"
        >
          <Icon name="inspect" tokenSize="2xs" className="text-vsc-info" />
          <Text size="2xs" tone="secondary">
            Click-to-Edit active ({mappings.length} mapped elements)
          </Text>
        </div>
      )}
    </>
  );
});
