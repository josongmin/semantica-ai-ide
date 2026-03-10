import { type default as React, useCallback, useRef, useState } from "react";

interface UsePromptDragDropOptions {
  addFile: (path: string) => void;
  projectFiles: readonly string[];
}

export function usePromptDragDrop({ addFile, projectFiles }: UsePromptDragDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!dropRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      for (const f of files) {
        const match = projectFiles.find((p) => p.endsWith(`/${f.name}`) || p === f.name);
        addFile(match ?? f.name);
      }
    },
    [addFile, projectFiles],
  );

  return { isDragging, dropRef, handleDragOver, handleDragLeave, handleDrop };
}
