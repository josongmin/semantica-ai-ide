import { type default as React, useCallback, useRef } from "react";

/** Container-level drag-and-drop hook for tab reordering (data-attribute approach) */
export function useTabDragDrop(reorderTabs: (args: { fromIndex: number; toIndex: number }) => void) {
  const dragIndexRef = useRef<number | null>(null);

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const idx = (e.target as HTMLElement).closest<HTMLElement>("[data-tab-index]")?.dataset.tabIndex;
    if (idx != null) dragIndexRef.current = Number(idx);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const toStr = (e.target as HTMLElement).closest<HTMLElement>("[data-tab-index]")?.dataset.tabIndex;
      if (toStr == null) return;
      const toIndex = Number(toStr);
      const fromIndex = dragIndexRef.current;
      if (fromIndex != null && fromIndex !== toIndex) {
        reorderTabs({ fromIndex, toIndex });
      }
      dragIndexRef.current = null;
    },
    [reorderTabs],
  );

  return { onDragStart, onDragOver, onDrop } as const;
}
