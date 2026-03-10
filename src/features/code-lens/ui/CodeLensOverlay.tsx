/**
 * CodeLensOverlay — Container that reads atoms and renders CodeLensCard.
 *
 * Positioned as an overlay within the editor area.
 * Shows a loading skeleton while data is being fetched,
 * then transitions to the full CodeLensCard.
 */

import { memo, useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useNavigateToFile } from "~shared/lib";
import { cn, OverlayPortal, Skeleton } from "~shared/ui";

import {
  closeCodeLensAtom,
  codeLensDataAtom,
  codeLensLoadingAtom,
  codeLensTargetAtom,
  codeLensVisibleAtom,
} from "../model/codeLensAtoms";
import { CodeLensCard } from "./CodeLensCard";

// ─── Loading skeleton ──────────────────────────────────────

const CodeLensSkeleton = memo(function CodeLensSkeleton() {
  return (
    <div
      className={cn(
        "bg-vsc-surface-1/90 backdrop-blur-sm",
        "border border-vsc-border/20 rounded-lg",
        "shadow-lg shadow-black/10",
        "w-full sm:w-[360px] max-w-[90vw] p-3",
        "animate-[codeLensEnter_200ms_ease-out]",
      )}
    >
      <div className="flex gap-2">
        <div className="w-1 shrink-0 rounded bg-vsc-text-ghost/20" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
});

// ─── Overlay ───────────────────────────────────────────────

export const CodeLensOverlay = memo(function CodeLensOverlay() {
  const visible = useAtomValue(codeLensVisibleAtom);
  const loading = useAtomValue(codeLensLoadingAtom);
  const data = useAtomValue(codeLensDataAtom);
  const target = useAtomValue(codeLensTargetAtom);
  const close = useSetAtom(closeCodeLensAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigateToFile = useNavigateToFile();

  const handleFlowNodeClick = useCallback((filePath: string, line: number) => {
    navigateToFile(filePath, line);
  }, [navigateToFile]);

  // Focus the overlay container when it becomes visible
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => containerRef.current?.focus());
    }
  }, [visible]);

  // Escape to close (covers skeleton state; CodeLensCard has its own handler)
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, close]);

  if (!visible) return null;

  return (
    <OverlayPortal>
      <div
        ref={containerRef}
        tabIndex={-1}
        className={cn(
          "fixed inset-0 z-(--z-floating)",
          "flex items-start justify-center",
          "pointer-events-none",
          "pt-[120px]",
          "outline-none",
        )}
      >
        <div className="pointer-events-auto">
          {loading || !data || !target ? (
            <CodeLensSkeleton />
          ) : (
            <CodeLensCard
              data={data}
              target={target}
              onClose={close}
              onFlowNodeClick={handleFlowNodeClick}
            />
          )}
        </div>
      </div>
    </OverlayPortal>
  );
});
