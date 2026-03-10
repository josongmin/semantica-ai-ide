import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeTabIdAtom,
  closeAllTabsAtom,
  closeOtherTabsAtom,
  closeTabAtom,
  isSessionPinnedAtom,
  newTabAtom,
  openTabsAtom,
  reorderTabsAtom,
  switchTabByIndexAtom,
  togglePinSessionAtom,
} from "../../shared/lib";
import type { SessionId } from "../../shared/protocol";
import { Icon, Tooltip } from "../../shared/ui";
import { type ContextAction,TabContextMenu } from "./TabContextMenu";
import { TabItem } from "./TabItem";
import { useTabDragDrop } from "./useTabDragDrop";

interface ContextMenu {
  x: number;
  y: number;
  sessionId: SessionId;
}

export const SessionTabBar = React.memo(function SessionTabBar() {
  const tabs = useAtomValue(openTabsAtom);
  const activeTabId = useAtomValue(activeTabIdAtom);
  const isSessionPinned = useAtomValue(isSessionPinnedAtom);
  const closeTab = useSetAtom(closeTabAtom);
  const closeOtherTabs = useSetAtom(closeOtherTabsAtom);
  const closeAllTabs = useSetAtom(closeAllTabsAtom);
  const reorderTabs = useSetAtom(reorderTabsAtom);
  const newTab = useSetAtom(newTabAtom);
  const switchTabByIndex = useSetAtom(switchTabByIndexAtom);
  const togglePin = useSetAtom(togglePinSessionAtom);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const dragHandlers = useTabDragDrop(reorderTabs);

  // ─── Overflow detection ───────────────────────────────
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkOverflow, { passive: true });
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      ro.disconnect();
    };
  }, [checkOverflow, tabs.length]);

  const scrollBy = useCallback((direction: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: direction * 150, behavior: "smooth" });
  }, []);

  const handleSwitch = useCallback(
    (id: SessionId) => {
      const idx = tabs.findIndex((t) => t.session_id === id);
      if (idx !== -1) switchTabByIndex(idx);
    },
    [tabs, switchTabByIndex],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, sessionId: SessionId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sessionId });
  }, []);

  const handleContextAction = useCallback(
    (action: ContextAction) => {
      if (!contextMenu) return;
      const { sessionId } = contextMenu;

      switch (action) {
        case "close":
          closeTab(sessionId);
          break;
        case "close-others":
          closeOtherTabs(sessionId);
          break;
        case "close-all":
          closeAllTabs();
          break;
        case "pin":
          togglePin(sessionId);
          break;
      }
      setContextMenu(null);
    },
    [contextMenu, closeTab, closeOtherTabs, closeAllTabs, togglePin],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const contextMenuPinned = useMemo(() => {
    if (!contextMenu) return false;
    return isSessionPinned(contextMenu.sessionId);
  }, [contextMenu, isSessionPinned]);

  if (tabs.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Session tabs"
      className="relative flex h-8 w-full items-stretch border-b border-vsc-border bg-vsc-bg"
    >
      {showLeftArrow && (
        <button
          type="button"
          aria-label="Scroll tabs left"
          className="flex h-8 w-6 shrink-0 items-center justify-center bg-vsc-bg text-vsc-text-tertiary hover:text-vsc-fg transition-colors duration-fast focus-ring"
          onClick={() => scrollBy(-1)}
        >
          <Icon name="chevron-left" tokenSize="xs" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex flex-1 items-stretch overflow-x-auto scrollbar-none"
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDrop={dragHandlers.onDrop}
      >
        {tabs.map((tab, idx) => (
          <TabItem
            key={tab.session_id}
            tab={tab}
            index={idx}
            isActive={tab.session_id === activeTabId}
            isPinned={isSessionPinned(tab.session_id)}
            onSwitch={handleSwitch}
            onClose={closeTab}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {showRightArrow && (
        <button
          type="button"
          aria-label="Scroll tabs right"
          className="flex h-8 w-6 shrink-0 items-center justify-center bg-vsc-bg text-vsc-text-tertiary hover:text-vsc-fg transition-colors duration-fast focus-ring"
          onClick={() => scrollBy(1)}
        >
          <Icon name="chevron-right" tokenSize="xs" />
        </button>
      )}

      <Tooltip content="New session (\u21e7\u2318N)" position="bottom">
        <button
          type="button"
          aria-label="New session"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-vsc-text-tertiary hover:bg-vsc-list-hover hover:text-vsc-fg transition-colors duration-fast border-l border-vsc-tab-border focus-ring"
          onClick={() => newTab()}
        >
          <Icon name="plus" tokenSize="xs" />
        </button>
      </Tooltip>

      {contextMenu && (
        <TabContextMenu
          menu={contextMenu}
          isPinned={contextMenuPinned}
          onAction={handleContextAction}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
});
