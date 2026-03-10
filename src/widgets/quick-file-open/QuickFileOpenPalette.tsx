import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { filePickerOpenAtom, projectFilesAtom } from "../../shared/lib/atoms/uiAtoms";
import { fuzzyScore } from "../../shared/lib/fuzzyScore";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import { cn, HighlightedText, Icon, OverlayPortal, Text } from "../../shared/ui";

const MAX_RESULTS = 30;
const OPEN_FILE_PICKER_EVENT = "semantica:open-file-picker";

export const QuickFileOpenPalette = React.memo(function QuickFileOpenPalette() {
  const files = useAtomValue(projectFilesAtom);
  const isOpen = useAtomValue(filePickerOpenAtom);
  const setOpen = useSetAtom(filePickerOpenAtom);

  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Listen for Cmd/Ctrl+P and custom event
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setOpen(true);
      }
    }
    function handleCustomEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_FILE_PICKER_EVENT, handleCustomEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_FILE_PICKER_EVENT, handleCustomEvent);
    };
  }, [setOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
       
      setQuery("");
      setFocusIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query) return files.slice(0, MAX_RESULTS);
    const scored: { path: string; score: number; indices: number[] }[] = [];
    for (const f of files) {
      const match = fuzzyScore(query, f);
      if (match) scored.push({ path: f, ...match });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RESULTS).map((s) => s.path);
  }, [files, query]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const selectFile = useCallback(
    (filePath: string) => {
      getVscodeApi().postMessage({ type: "OPEN_FILE", file_path: filePath });
      close();
    },
    [close],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[focusIndex]) selectFile(results[focusIndex]);
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, focusIndex, selectFile, close]);

  // Scroll focused item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[focusIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusIndex]);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[--z-overlay] flex flex-col items-center pt-[15%]"
        onClick={close}
      >
        <div
          className="w-[90%] max-w-[500px] bg-vsc-surface-2 border border-vsc-border/40 rounded-lg shadow-xl overflow-hidden animate-[fade-in_100ms_ease]"
          onClick={(e) => e.stopPropagation()}
          data-testid="quick-file-open"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border">
            <Icon name="search" tokenSize="sm" className="text-vsc-text-tertiary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search files..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusIndex(0);
              }}
              className="flex-1 bg-transparent border-none outline-none text-sm text-vsc-fg placeholder-vsc-text-tertiary focus-ring"
              data-testid="quick-file-input"
            />
          </div>
          <div
            ref={listRef}
            className="max-h-[--panel-max-h-md] overflow-y-auto py-1 scroll-shadow"
            data-scroll-contain
          >
            {results.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <Text size="xs" tone="tertiary">
                  No files found
                </Text>
              </div>
            ) : (
              results.map((file, index) => {
                const fileName = file.split("/").pop() ?? file;
                const dirPath = file.slice(0, file.length - fileName.length);
                const match = query ? fuzzyScore(query, fileName) : null;
                return (
                  <button
                    key={file}
                    type="button"
                    onClick={() => selectFile(file)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors duration-fast focus-ring",
                      index === focusIndex ? "bg-vsc-list-hover" : "hover:bg-vsc-list-hover",
                    )}
                    data-testid={`quick-file-item-${index}`}
                  >
                    <Icon name="file" tokenSize="xs" className="shrink-0 text-vsc-text-tertiary" />
                    <span className="flex-1 min-w-0 truncate">
                      {match ? (
                        <HighlightedText
                          text={fileName}
                          indices={match.indices}
                          className="text-xs"
                        />
                      ) : (
                        <Text size="xs" tone="primary" as="span">
                          {fileName}
                        </Text>
                      )}
                      {dirPath && (
                        <Text size="2xs" tone="ghost" as="span" className="ml-1">
                          {dirPath}
                        </Text>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
});
