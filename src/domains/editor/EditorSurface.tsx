import React, { Suspense, useCallback, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import {
  activeFileContentAtom,
  activeFileLanguageAtom,
  activeTabAtom,
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

  const handleChange = useCallback(
    (val: string) => {
      if (activeTab) updateContent(activeTab.filePath, val);
    },
    [activeTab, updateContent],
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
              onContextMenu={handleContextMenu}
            />
          </Suspense>
        ) : (
          <WelcomeScreen hasFiles={tabs.length > 0} />
        )}
      </div>

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

// ─── Breadcrumb (reserved) ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future use
function Breadcrumb({ filePath }: { filePath: string }) {
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

// ─── Status Bar (reserved) ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future use
function StatusBar({
  activeTab,
  language,
  lineCount,
}: {
  activeTab: boolean;
  language: string;
  lineCount: number;
}) {
  const langLabel = LANG_LABELS[language] ?? language;

  return (
    <div className="flex items-center h-6 px-2 bg-vsc-surface-1 border-t border-vsc-border/40 text-xs text-vsc-text-tertiary shrink-0 select-none">
      {/* Left section */}
      <div className="flex items-center gap-1">
        <StatusItem icon="source-control" label="main" accent />
        <StatusDivider />
        <StatusItem icon="error" label="0" />
        <StatusItem icon="warning" label="0" />
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-1">
        {activeTab && (
          <>
            <StatusItem label={`Ln 1, Col 1`} />
            <StatusDivider />
            <StatusItem label="Spaces: 2" />
            <StatusDivider />
            <StatusItem label="UTF-8" />
            <StatusDivider />
            <StatusItem icon="symbol-namespace" label={langLabel} highlight />
            <StatusDivider />
            <StatusItem label={`${lineCount} lines`} />
            <StatusDivider />
          </>
        )}
        <StatusItem icon="check" label="Prettier" accent />
      </div>
    </div>
  );
}

const StatusItem = React.memo(function StatusItem({
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
        "flex items-center gap-1 px-1.5 h-5 rounded-sm",
        "transition-colors duration-fast cursor-pointer border-none bg-transparent focus-ring",
        accent && "text-vsc-accent hover:bg-vsc-accent/10",
        !accent && highlight && "text-vsc-text-secondary hover:bg-vsc-list-hover",
        !accent &&
          !highlight &&
          "text-vsc-text-tertiary hover:bg-vsc-list-hover hover:text-vsc-text-secondary",
      )}
    >
      {icon && <Icon name={icon} tokenSize="2xs" />}
      <span>{label}</span>
    </button>
  );
});

function StatusDivider() {
  return <span className="w-px h-3 bg-vsc-border/30 mx-0.5" />;
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
