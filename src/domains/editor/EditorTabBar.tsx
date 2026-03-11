import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import {
  activeEditorTabAtom,
  closeEditorTabAtom,
  type EditorTab,
  editorTabsAtom,
} from "./editorAtoms";

// ─── Language color accents (subtle, per-language) ──────

const LANG_COLOR: Readonly<Record<string, string>> = {
  typescript: "text-[--color-lang-typescript]",
  typescriptreact: "text-[--color-lang-typescript]",
  javascript: "text-[--color-lang-javascript]",
  javascriptreact: "text-[--color-lang-javascript]",
  python: "text-[--color-lang-python]",
  rust: "text-[--color-lang-rust]",
  go: "text-[--color-lang-go]",
  json: "text-[--color-lang-json]",
  markdown: "text-[--color-lang-markdown]",
  css: "text-[--color-lang-css]",
  html: "text-[--color-lang-html]",
  shell: "text-[--color-lang-shell]",
};

const LANG_ICON: Readonly<Record<string, string>> = {
  typescript: "symbol-namespace",
  javascript: "symbol-event",
  python: "symbol-misc",
  rust: "gear",
  go: "package",
  json: "json",
  markdown: "markdown",
  css: "symbol-color",
  html: "code",
  shell: "terminal",
};

function langIcon(lang?: string): string {
  return LANG_ICON[lang ?? ""] ?? "file";
}

// ─── Component ──────────────────────────────────────────

export const EditorTabBar = React.memo(function EditorTabBar() {
  const tabs = useAtomValue(editorTabsAtom);
  const activeTab = useAtomValue(activeEditorTabAtom);
  const setActive = useSetAtom(activeEditorTabAtom);
  const closeTab = useSetAtom(closeEditorTabAtom);

  if (tabs.length === 0) {
    return (
      <div className="flex items-center h-[30px] px-4 bg-white text-xs text-vsc-text-ghost shrink-0">
        <Icon name="files" tokenSize="2xs" className="mr-1.5 opacity-30" />
        No files open
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-stretch h-[30px] bg-white overflow-x-auto shrink-0",
        "scrollbar-none",
      )}
      role="tablist"
      aria-label="Editor tabs"
    >
      {tabs.map((tab, i) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTab}
          isFirst={i === 0}
          onActivate={() => setActive(tab.id)}
          onClose={() => closeTab(tab.id)}
        />
      ))}

      {/* Fill remaining space — matches inactive bg */}
      <div className="flex-1 min-w-10" />
    </div>
  );
});

// ─── TabItem ────────────────────────────────────────────

const TabItem = React.memo(function TabItem({
  tab,
  isActive,
  isFirst,
  onActivate,
  onClose,
}: {
  tab: EditorTab;
  isActive: boolean;
  isFirst: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );

  const iconColor = LANG_COLOR[tab.language ?? ""] ?? "text-vsc-text-ghost";

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onActivate}
      className={cn(
        "group relative flex items-center gap-1.5 px-3 text-xs cursor-pointer shrink-0",
        "select-none transition-colors duration-fast",
        // Separator between tabs
        !isFirst && "border-l border-vsc-border/20",
        isActive
          ? "bg-white text-vsc-text-primary"
          : "text-vsc-fg/70 hover:text-vsc-fg hover:bg-white/40",
      )}
    >
      {/* Bottom accent — colored line for active tab */}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-vsc-accent/70 z-1" />
      )}
      {!isActive && <span className="absolute bottom-0 left-0 right-0 h-px bg-vsc-border/20" />}

      {/* Language icon — colored per language */}
      <Icon
        name={langIcon(tab.language)}
        tokenSize="2xs"
        className={cn(
          "shrink-0 transition-colors duration-fast",
          isActive ? iconColor : "text-vsc-text-ghost/60 group-hover:text-vsc-text-ghost",
        )}
      />

      {/* Filename */}
      <span
        className={cn("truncate max-w-[140px]", isActive && "font-medium")}
        title={tab.fileName}
      >
        {tab.fileName}
      </span>

      {/* Close / dirty indicator zone */}
      <div className="w-[18px] h-[--height-row-xs] flex items-center justify-center shrink-0 -mr-1 relative">
        {/* Dirty dot — visible when not hovered */}
        {tab.isDirty && (
          <span
            className={cn(
              "absolute inset-0 m-auto w-1.5 h-1.5 rounded-full group-hover:opacity-0 transition-opacity duration-fast",
              isActive ? "bg-vsc-accent" : "bg-vsc-text-ghost/50",
            )}
          />
        )}

        {/* Close button — appears on hover */}
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded",
            "bg-transparent border-none cursor-pointer transition-colors duration-fast focus-ring",
            "text-vsc-text-ghost/60 hover:text-vsc-text-primary hover:bg-vsc-surface-3/60",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-fast",
          )}
          aria-label={`Close ${tab.fileName}`}
        >
          <Icon name="close" tokenSize="2xs" />
        </button>
      </div>
    </div>
  );
});
