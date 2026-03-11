import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { currentGitBranchAtom } from "~shared/entities/git-history/model/atoms";
import { cn, Icon } from "~shared/ui";

import type { CursorInfo } from "./CodeMirrorEditor";
import {
  activeFileContentAtom,
  activeFileLanguageAtom,
  activeTabAtom,
  editorCursorAtom,
  type EditorCursorState,
  editorTabsAtom,
  updateFileContentAtom,
} from "./editorAtoms";
import { EditorContextMenu } from "./EditorContextMenu";
import { EditorTabBar } from "./EditorTabBar";

const CodeMirrorEditor = React.lazy(() =>
  import("./CodeMirrorEditor").then((m) => ({ default: m.CodeMirrorEditor })),
);

// ─── Language display names ─────────────────────────────

const LANG_LABELS: Record<string, string> = {
  typescript: "TypeScript",
  typescriptreact: "TypeScript JSX",
  javascript: "JavaScript",
  javascriptreact: "JavaScript JSX",
  python: "Python",
  rust: "Rust",
  go: "Go",
  json: "JSON",
  jsonc: "JSON with Comments",
  markdown: "Markdown",
  css: "CSS",
  html: "HTML",
  shell: "Shell",
};

// ─── Component ──────────────────────────────────────────

export function EditorSurface() {
  const activeTab = useAtomValue(activeTabAtom);
  const tabs = useAtomValue(editorTabsAtom);
  const content = useAtomValue(activeFileContentAtom);
  const language = useAtomValue(activeFileLanguageAtom);
  const updateContent = useSetAtom(updateFileContentAtom);
  const setCursor = useSetAtom(editorCursorAtom);
  const cursor = useAtomValue(editorCursorAtom);
  const gitBranch = useAtomValue(currentGitBranchAtom);

  const lineCount = useMemo(() => content.split("\n").length, [content]);

  const handleChange = useCallback(
    (val: string) => {
      if (activeTab) updateContent(activeTab.filePath, val);
    },
    [activeTab, updateContent],
  );

  const handleCursorChange = useCallback(
    (info: CursorInfo) => {
      setCursor(info);
    },
    [setCursor],
  );

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    line: number;
    hasSelection: boolean;
    selectedText: string;
  } | null>(null);

  const handleContextMenu = useCallback(
    (info: { x: number; y: number; line: number; hasSelection: boolean; selectedText: string }) => {
      setCtxMenu(info);
    },
    [],
  );

  const closeContextMenu = useCallback(() => setCtxMenu(null), []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Bar */}
      <EditorTabBar />

      {/* Editor / Welcome */}
      <div className="flex-1 min-h-0">
        {activeTab ? (
          <Suspense fallback={<EditorLoading />}>
            <CodeMirrorEditor
              value={content}
              language={language}
              filePath={activeTab.filePath}
              onChange={handleChange}
              onCursorChange={handleCursorChange}
              onContextMenu={handleContextMenu}
            />
          </Suspense>
        ) : (
          <WelcomeScreen hasFiles={tabs.length > 0} />
        )}
      </div>

      {/* Editor Status Bar */}
      {activeTab && (
        <EditorStatusBar
          cursor={cursor}
          language={language}
          lineCount={lineCount}
          gitBranch={gitBranch}
          encoding="UTF-8"
          indent="Spaces: 2"
        />
      )}

      {/* Context menu */}
      {activeTab && (
        <EditorContextMenu
          position={ctxMenu}
          onClose={closeContextMenu}
          filePath={activeTab.filePath}
          line={ctxMenu?.line ?? 1}
          hasSelection={ctxMenu?.hasSelection ?? false}
          selectedText={ctxMenu?.selectedText ?? ""}
        />
      )}
    </div>
  );
}

// ─── Breadcrumb (reserved for future use) ─────────────────

/** @internal Reserved for future breadcrumb UI */
function BreadcrumbReserved({ filePath }: { filePath: string }) {
  const rawSegments = filePath.split("/");
  const displaySegments =
    rawSegments.length > 5
      ? [...rawSegments.slice(0, 2), "\u2026", ...rawSegments.slice(-2)]
      : rawSegments;

  return (
    <div className="flex items-center h-[--height-row-md] px-4 bg-vsc-surface-0 border-b border-vsc-border/20 text-xs text-vsc-text-ghost shrink-0 gap-1">
      <Icon name="symbol-file" tokenSize="2xs" className="mr-1.5 opacity-40 shrink-0" />
      {displaySegments.map((seg, i, arr) => {
        const isLast = i === arr.length - 1;
        return (
          <React.Fragment key={`${seg}-${i}`}>
            {i > 0 && (
              <Icon name="chevron-right" tokenSize="2xs" className="mx-0.5 opacity-30 shrink-0" />
            )}
            <span
              className={cn(
                "transition-colors duration-fast",
                isLast
                  ? "text-vsc-text-primary font-medium"
                  : "hover:text-vsc-text-secondary cursor-pointer",
              )}
            >
              {seg}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Editor Status Bar ──────────────────────────────────

const STATUS_BAR_H = 26;

function EditorStatusBar({
  cursor,
  language,
  lineCount,
  gitBranch,
  encoding,
  indent,
}: {
  cursor: EditorCursorState;
  language: string;
  lineCount: number;
  gitBranch: string;
  encoding: string;
  indent: string;
}) {
  const langLabel = LANG_LABELS[language] ?? language;

  // Cursor position label
  const posLabel =
    cursor.selectedChars > 0
      ? `Ln ${cursor.line}, Col ${cursor.col} (${cursor.selectedChars} selected)`
      : `Ln ${cursor.line}, Col ${cursor.col}`;

  return (
    <div
      className="flex items-center px-1.5 bg-vsc-surface-1 border-t border-vsc-border/20 text-[11px] text-vsc-text-tertiary shrink-0 select-none gap-px"
      style={{ height: STATUS_BAR_H }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-px">
        <StatusChip icon="git-branch" label={gitBranch || "main"} accent />
        <StatusSep />
        <StatusChip icon="error" label="0" />
        <StatusChip icon="warning" label="0" />
      </div>

      {/* ── Right ── */}
      <div className="ml-auto flex items-center gap-px">
        <StatusChip label={posLabel} />
        <StatusSep />
        <StatusChip label={indent} />
        <StatusSep />
        <StatusChip label={encoding} />
        <StatusSep />
        <StatusChip icon="symbol-namespace" label={langLabel} highlight />
        <StatusSep />
        <StatusChip label={`${lineCount} lines`} />
        <StatusSep />
        <StatusChip icon="check" label="Prettier" accent />
      </div>
    </div>
  );
}

const StatusChip = React.memo(function StatusChip({
  icon,
  label,
  accent,
  highlight,
}: {
  icon?: string;
  label: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 rounded-sm",
        "text-[11px] leading-none tracking-[0.01em]",
        "transition-colors duration-fast cursor-pointer border-none bg-transparent focus-ring",
        accent && "text-vsc-accent hover:bg-vsc-accent/10",
        !accent && highlight && "text-vsc-text-secondary hover:bg-vsc-list-hover",
        !accent &&
          !highlight &&
          "text-vsc-text-tertiary hover:bg-vsc-list-hover hover:text-vsc-text-secondary",
      )}
      style={{ height: STATUS_BAR_H - 6 }}
    >
      {icon && <Icon name={icon} size={12} className="shrink-0" />}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
});

function StatusSep() {
  return <span className="w-px h-3 bg-vsc-border/25 mx-0.5" />;
}

// ─── Loading & Welcome ──────────────────────────────────

function EditorLoading() {
  return (
    <div className="flex items-center justify-center h-full bg-vsc-surface-0">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-vsc-border" />
          <div className="absolute inset-0 rounded-full border-2 border-vsc-accent border-t-transparent animate-spin" />
        </div>
        <span className="text-vsc-text-tertiary text-xs">Loading editor...</span>
      </div>
    </div>
  );
}

function WelcomeScreen({ hasFiles }: { hasFiles: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-vsc-text-ghost select-none">
      {/* Logo mark */}
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-vsc-accent/5" />
        <div className="absolute -inset-4 rounded-full bg-vsc-accent/8" />
        <Icon name="code" size={40} className="relative opacity-20" />
      </div>

      <div className="text-center">
        <h2 className="text-base font-medium text-vsc-text-secondary tracking-tight mb-1.5">
          Semantica IDE
        </h2>
        <p className="text-sm leading-relaxed max-w-[260px] text-vsc-text-ghost">
          {hasFiles ? "Select a tab to continue editing" : "Open a file from the Explorer to start"}
        </p>
      </div>

      {/* Keyboard shortcuts */}
      <div className="flex flex-col gap-2 mt-2">
        <ShortcutHint keys={["Cmd", "P"]} label="Quick Open" />
        <ShortcutHint keys={["Cmd", "Shift", "P"]} label="Command Palette" />
        <ShortcutHint keys={["Cmd", "B"]} label="Toggle Sidebar" />
      </div>
    </div>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1 min-w-[100px] justify-end">
        {keys.map((k) => (
          <kbd
            key={k}
            className={cn(
              "inline-flex items-center justify-center min-w-[22px] h-[--height-row-xs] px-1",
              "rounded bg-vsc-surface-2/80 border border-vsc-border/50",
              "text-2xs text-vsc-text-secondary font-mono leading-none",
              "shadow-sm",
            )}
          >
            {k}
          </kbd>
        ))}
      </span>
      <span className="text-vsc-text-ghost">{label}</span>
    </div>
  );
}

/** @internal Reserved for future use */
export { BreadcrumbReserved };
