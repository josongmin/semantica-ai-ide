import React, { useCallback, useId, useLayoutEffect, useRef, useState } from "react";

import { useMermaidRenderer } from "~shared/bootstrap/theme-settings";

import { cn, CodeBlockActions, Icon, Spinner } from "../../shared/ui";

interface MermaidDiagramProps {
  source: string;
  className?: string;
}

/**
 * Renders a mermaid diagram source as inline SVG.
 * Toggle between diagram view and code view via header pill.
 */
export const MermaidDiagram = React.memo(function MermaidDiagram({
  source,
  className,
}: MermaidDiagramProps) {
  const diagramId = `mermaid-${useId().replace(/:/g, "-")}`;
  const state = useMermaidRenderer(source, diagramId);
  const [showCode, setShowCode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedTopRef = useRef<number | null>(null);

  const toggleView = useCallback(() => {
    if (containerRef.current) {
      savedTopRef.current = containerRef.current.getBoundingClientRect().top;
    }
    setShowCode((v) => !v);
  }, []);

  // After render, restore scroll so the container stays at the same viewport position
  useLayoutEffect(() => {
    if (savedTopRef.current !== null && containerRef.current) {
      const currentTop = containerRef.current.getBoundingClientRect().top;
      const delta = currentTop - savedTopRef.current;
      if (delta !== 0) {
        const scrollParent =
          containerRef.current.closest("[data-scroll-container]") ?? document.documentElement;
        scrollParent.scrollTop += delta;
      }
      savedTopRef.current = null;
    }
  }, [showCode]);

  if (state.status === "loading") {
    return (
      <div
        className={cn(
          "my-1.5 -mx-1 p-4 bg-vsc-code-bg flex items-center justify-center gap-2",
          className,
        )}
      >
        <Spinner size="sm" />
        <span className="text-2xs text-vsc-text-tertiary">Rendering diagram...</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={cn("relative group/code my-1.5 -mx-1", className)}>
        <div className="flex items-center h-[--height-row-sm] px-3 bg-vsc-surface-3 text-2xs text-vsc-error font-medium">
          mermaid (render error)
        </div>
        <pre className="px-3 py-2 bg-vsc-code-bg overflow-auto text-xs leading-normal m-0">
          <code>{source}</code>
        </pre>
        <CodeBlockActions code={source} language="mermaid" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("my-1.5 -mx-1", className)}>
      {/* Header with toggle */}
      <div className="flex items-center h-[--height-row-sm] px-2 bg-vsc-surface-3">
        <Icon name="type-hierarchy-sub" tokenSize="2xs" className="text-vsc-text-ghost mr-1" />
        <span className="flex-1 text-2xs text-vsc-text-tertiary font-medium">mermaid</span>

        {/* View toggle pill */}
        <div className="flex items-center bg-vsc-code-bg rounded-sm overflow-hidden border border-vsc-border/30">
          <button
            type="button"
            onClick={showCode ? toggleView : undefined}
            className={cn(
              "flex items-center gap-1 px-1.5 h-5 text-2xs border-none cursor-pointer transition-colors duration-fast focus-ring",
              !showCode
                ? "bg-vsc-toolbar text-vsc-text-secondary font-medium"
                : "bg-transparent text-vsc-text-ghost hover:text-vsc-text-tertiary",
            )}
          >
            <Icon name="preview" tokenSize="2xs" />
            Diagram
          </button>
          <button
            type="button"
            onClick={showCode ? undefined : toggleView}
            className={cn(
              "flex items-center gap-1 px-1.5 h-5 text-2xs border-none cursor-pointer transition-colors duration-fast focus-ring",
              showCode
                ? "bg-vsc-toolbar text-vsc-text-secondary font-medium"
                : "bg-transparent text-vsc-text-ghost hover:text-vsc-text-tertiary",
            )}
          >
            <Icon name="code" tokenSize="2xs" />
            Code
          </button>
        </div>
      </div>

      {/* Content */}
      {showCode ? (
        <div className="relative group/code">
          <pre className="px-3 py-2 bg-vsc-code-bg overflow-auto text-xs leading-relaxed m-0 font-mono text-vsc-fg">
            <code>{source}</code>
          </pre>
          <CodeBlockActions code={source} language="mermaid" />
        </div>
      ) : (
        <div
          className="px-2 py-3 bg-vsc-code-bg overflow-x-auto flex justify-center
                     [&>svg]:max-w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: state.svgHtml }}
        />
      )}
    </div>
  );
});
