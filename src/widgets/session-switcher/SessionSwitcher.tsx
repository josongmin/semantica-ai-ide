import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeTabIdAtom,
  newTabAtom,
  openSessionTabAtom,
  sessionSwitcherOpenAtom,
  useOverlayBehavior,
} from "../../shared/lib";
import type { SessionListEntry } from "../../shared/protocol";
import { Icon, Kbd, Text } from "../../shared/ui";
import { useSessionKeyboard } from "./hooks/useSessionKeyboard";
import { useSessionSearch } from "./hooks/useSessionSearch";
import { SessionResultsList } from "./SessionResultsList";

export const SessionSwitcher = React.memo(function SessionSwitcher() {
  const activeTabId = useAtomValue(activeTabIdAtom);
  const isOpen = useAtomValue(sessionSwitcherOpenAtom);
  const setOpen = useSetAtom(sessionSwitcherOpenAtom);
  const openSession = useSetAtom(openSessionTabAtom);
  const createNewTab = useSetAtom(newTabAtom);

  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), [setOpen]);

  // Overlay behavior: escape dismiss, focus trap, body scroll lock
  const { mounted, handleTabKeyDown } = useOverlayBehavior({
    id: "session-switcher",
    type: "command-palette",
    open: isOpen,
    onClose: close,
    containerRef,
    bodyLock: true,
    focusTrap: true,
  });

  // Cmd/Ctrl+Shift+K toggling is handled by useSessionShortcuts

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setFocusIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Search / filter / rank
  const results = useSessionSearch(query);

  // Select a session
  const selectSession = useCallback(
    (entry: SessionListEntry) => {
      openSession(entry);
      close();
    },
    [openSession, close],
  );

  // Handle new session
  const handleNewSession = useCallback(() => {
    createNewTab();
    close();
  }, [createNewTab, close]);

  // Keyboard navigation
  const { handleKeyDown, listRef } = useSessionKeyboard({
    resultCount: results.length,
    focusIndex,
    setFocusIndex,
    onSelect: (index) => {
      if (results[index]) selectSession(results[index]);
    },
    onNewSession: handleNewSession,
  });

  // Stable handler for search input changes
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setFocusIndex(0);
    },
    [],
  );

  // Stop propagation on inner container click
  const stopPropagation = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  );

  // Combined keydown handler for the container
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      handleTabKeyDown(e);
      handleKeyDown(e);
    },
    [handleTabKeyDown, handleKeyDown],
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[--z-overlay] flex flex-col items-center pt-[12%] bg-vsc-fg/40 backdrop-blur-[2px]"
      onClick={close}
      role="presentation"
      data-testid="session-switcher-backdrop"
    >
      <div
        ref={containerRef}
        className="w-[90%] max-w-[400px] bg-vsc-surface-2 border border-vsc-border rounded-lg shadow-xl overflow-hidden"
        onClick={stopPropagation}
        onKeyDown={handleContainerKeyDown}
        data-testid="session-switcher"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border">
          <Icon name="search" tokenSize="sm" className="text-vsc-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Switch session..."
            value={query}
            onChange={handleQueryChange}
            className="flex-1 bg-transparent border-none outline-none text-sm text-vsc-fg placeholder-vsc-text-tertiary"
            data-testid="session-switcher-input"
          />
        </div>

        {/* Session list */}
        <SessionResultsList
          results={results}
          focusIndex={focusIndex}
          activeTabId={activeTabId}
          onSelect={selectSession}
          listRef={listRef}
        />

        {/* Footer hint bar */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-vsc-border">
          <span className="flex items-center gap-1">
            <Kbd>{"\u2191\u2193"}</Kbd>
            <Text size="2xs" tone="ghost" as="span">
              Navigate
            </Text>
          </span>
          <span className="flex items-center gap-1">
            <Kbd>{"\u23CE"}</Kbd>
            <Text size="2xs" tone="ghost" as="span">
              Switch
            </Text>
          </span>
          <span className="flex items-center gap-1">
            <Kbd>{"\u21e7\u2318N"}</Kbd>
            <Text size="2xs" tone="ghost" as="span">
              New
            </Text>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
});
