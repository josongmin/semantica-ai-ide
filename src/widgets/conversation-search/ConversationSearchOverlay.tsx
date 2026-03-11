import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAtom } from "jotai";

import { getVscodeApi } from "~shared/lib/vscodeApi";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { conversationSearchOpenAtom } from "../../shared/lib/atoms/dialogAtoms";

// ─── Types ──────────────────────────────────────────────

type SearchMode = "files" | "code" | "symbols";

interface FileResult {
  readonly path: string;
  readonly icon: string;
}

interface CodeResult {
  readonly filePath: string;
  readonly line: number;
  readonly content: string;
  readonly matchStart: number;
  readonly matchEnd: number;
}

interface SymbolResult {
  readonly name: string;
  readonly kind: string;
  readonly filePath: string;
  readonly line: number;
  readonly icon: string;
}

type SearchResult =
  | { type: "file"; data: FileResult }
  | { type: "code"; data: CodeResult }
  | { type: "symbol"; data: SymbolResult };

// ─── Mode Config ────────────────────────────────────────

const MODES: readonly {
  id: SearchMode;
  label: string;
  icon: string;
  prefix: string;
  placeholder: string;
}[] = [
  {
    id: "files",
    label: "Files",
    icon: "go-to-file",
    prefix: "",
    placeholder: "Search files by name…",
  },
  {
    id: "code",
    label: "Code",
    icon: "search",
    prefix: ">",
    placeholder: "Search code across all files…",
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: "symbol-method",
    prefix: "#",
    placeholder: "Search symbols (functions, classes, types)…",
  },
];

// ─── Mock Data ──────────────────────────────────────────

const MOCK_FILES: FileResult[] = [
  { path: "src/app/App.tsx", icon: "file-code" },
  { path: "src/app/shell/ShellLayout.tsx", icon: "file-code" },
  { path: "src/app/shell/frames/TitleBar.tsx", icon: "file-code" },
  { path: "src/app/shell/frames/SidebarFrame.tsx", icon: "file-code" },
  { path: "src/app/shell/frames/TrayFrame.tsx", icon: "file-code" },
  { path: "src/app/shell/frames/AgentFrame.tsx", icon: "file-code" },
  { path: "src/app/shell/model/shellAtoms.ts", icon: "file-code" },
  { path: "src/app/shell/model/viewRegistry.ts", icon: "file-code" },
  { path: "src/features/explorer/ui/ExplorerView.tsx", icon: "file-code" },
  { path: "src/features/terminal/ui/TerminalView.tsx", icon: "file-code" },
  { path: "src/features/search/ui/SearchView.tsx", icon: "file-code" },
  { path: "src/surfaces/chat/ChatView.tsx", icon: "file-code" },
  { path: "src/surfaces/editor/EditorView.tsx", icon: "file-code" },
  { path: "src/shared/ui/primitives/Button.tsx", icon: "file-code" },
  { path: "src/shared/ui/primitives/Icon.tsx", icon: "file-code" },
  { path: "package.json", icon: "file" },
  { path: "tsconfig.json", icon: "file" },
  { path: "tailwind.config.ts", icon: "file" },
  { path: "vite.config.ts", icon: "file" },
  { path: "README.md", icon: "markdown" },
];

function mockFileSearch(q: string): SearchResult[] {
  if (!q.trim()) return MOCK_FILES.slice(0, 10).map((f) => ({ type: "file", data: f }));
  const lower = q.toLowerCase();
  return MOCK_FILES.filter((f) => f.path.toLowerCase().includes(lower)).map((f) => ({
    type: "file",
    data: f,
  }));
}

function mockCodeSearch(q: string): SearchResult[] {
  if (!q.trim()) return [];
  return [
    {
      type: "code",
      data: {
        filePath: "src/core/engine/SemanticParser.ts",
        line: 14,
        content: `  const ${q}Handler = createHandler();`,
        matchStart: 8,
        matchEnd: 8 + q.length,
      },
    },
    {
      type: "code",
      data: {
        filePath: "src/core/engine/SemanticParser.ts",
        line: 47,
        content: `  return ${q}.process(node);`,
        matchStart: 9,
        matchEnd: 9 + q.length,
      },
    },
    {
      type: "code",
      data: {
        filePath: "src/features/intent-engine/resolver.ts",
        line: 8,
        content: `import { ${q} } from "../core";`,
        matchStart: 10,
        matchEnd: 10 + q.length,
      },
    },
    {
      type: "code",
      data: {
        filePath: "src/features/intent-engine/resolver.ts",
        line: 33,
        content: `  if (${q} !== undefined) {`,
        matchStart: 6,
        matchEnd: 6 + q.length,
      },
    },
    {
      type: "code",
      data: {
        filePath: "src/shared/lib/utils.ts",
        line: 71,
        content: `export function ${q}(input: string): boolean {`,
        matchStart: 16,
        matchEnd: 16 + q.length,
      },
    },
    {
      type: "code",
      data: {
        filePath: "packages/protocol/src/models/index.ts",
        line: 5,
        content: `export type ${q}Config = {`,
        matchStart: 12,
        matchEnd: 12 + q.length,
      },
    },
  ];
}

function mockSymbolSearch(q: string): SearchResult[] {
  if (!q.trim()) return [];
  const lower = q.toLowerCase();
  const symbols: SymbolResult[] = [
    {
      name: "ShellLayout",
      kind: "component",
      filePath: "src/app/shell/ShellLayout.tsx",
      line: 53,
      icon: "symbol-class",
    },
    {
      name: "TitleBar",
      kind: "component",
      filePath: "src/app/shell/frames/TitleBar.tsx",
      line: 74,
      icon: "symbol-class",
    },
    {
      name: "SidebarFrame",
      kind: "component",
      filePath: "src/app/shell/frames/SidebarFrame.tsx",
      line: 21,
      icon: "symbol-class",
    },
    {
      name: "registerView",
      kind: "function",
      filePath: "src/app/shell/model/viewRegistry.ts",
      line: 42,
      icon: "symbol-method",
    },
    {
      name: "getViewsForFrame",
      kind: "function",
      filePath: "src/app/shell/model/viewRegistry.ts",
      line: 48,
      icon: "symbol-method",
    },
    {
      name: "ViewDefinition",
      kind: "interface",
      filePath: "src/app/shell/model/viewRegistry.ts",
      line: 8,
      icon: "symbol-interface",
    },
    {
      name: "FrameSlot",
      kind: "type",
      filePath: "src/app/shell/model/viewRegistry.ts",
      line: 38,
      icon: "symbol-type-parameter",
    },
    {
      name: "activeSurfaceAtom",
      kind: "variable",
      filePath: "src/app/shell/model/shellAtoms.ts",
      line: 10,
      icon: "symbol-variable",
    },
    {
      name: "sidebarVisibleAtom",
      kind: "variable",
      filePath: "src/app/shell/model/shellAtoms.ts",
      line: 15,
      icon: "symbol-variable",
    },
    {
      name: "useCodeMirrorTheme",
      kind: "function",
      filePath: "src/surfaces/editor/useCodeMirrorTheme.ts",
      line: 237,
      icon: "symbol-method",
    },
    {
      name: "SearchResult",
      kind: "interface",
      filePath: "src/features/search/ui/SearchView.tsx",
      line: 9,
      icon: "symbol-interface",
    },
  ];
  return symbols
    .filter((s) => s.name.toLowerCase().includes(lower) || s.kind.toLowerCase().includes(lower))
    .map((s) => ({ type: "symbol", data: s }));
}

// ─── Component ──────────────────────────────────────────

export const ConversationSearchOverlay = React.memo(function ConversationSearchOverlay() {
  const [open, setOpen] = useAtom(conversationSearchOpenAtom);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("files");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Detect mode prefix ──
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === ">" && mode !== "code") {
        setMode("code");
        setQuery("");
        setSelectedIdx(0);
        return;
      }
      if (val === "#" && mode !== "symbols") {
        setMode("symbols");
        setQuery("");
        setSelectedIdx(0);
        return;
      }
      setQuery(val);
      setSelectedIdx(0);
    },
    [mode],
  );

  // ── Search results ──
  const results = useMemo(() => {
    switch (mode) {
      case "files":
        return mockFileSearch(query);
      case "code":
        return mockCodeSearch(query);
      case "symbols":
        return mockSymbolSearch(query);
    }
  }, [mode, query]);

  // ── Close ──
  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setMode("files");
    setSelectedIdx(0);
  }, [setOpen]);

  // ── Select result ──
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const vscode = getVscodeApi();
      switch (result.type) {
        case "file":
          vscode.postMessage({ type: "OPEN_FILE", file_path: result.data.path });
          break;
        case "code":
          vscode.postMessage({
            type: "OPEN_FILE_AT_LINE",
            file_path: result.data.filePath,
            line: result.data.line,
          });
          break;
        case "symbol":
          vscode.postMessage({
            type: "OPEN_FILE_AT_LINE",
            file_path: result.data.filePath,
            line: result.data.line,
          });
          break;
      }
      handleClose();
    },
    [handleClose],
  );

  // ── Keyboard ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode !== "files" || query) {
          e.preventDefault();
          setQuery("");
          setMode("files");
          setSelectedIdx(0);
        } else {
          handleClose();
        }
        return;
      }
      if (e.key === "Backspace" && !query && mode !== "files") {
        setMode("files");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && results[selectedIdx]) {
        e.preventDefault();
        handleSelect(results[selectedIdx]);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const modeIds = MODES.map((m) => m.id);
        const curIdx = modeIds.indexOf(mode);
        const nextIdx = e.shiftKey
          ? (curIdx - 1 + modeIds.length) % modeIds.length
          : (curIdx + 1) % modeIds.length;
        setMode(modeIds[nextIdx] ?? modeIds[0]);
        setQuery("");
        setSelectedIdx(0);
      }
    },
    [mode, query, results, selectedIdx, handleClose, handleSelect],
  );

  // ── Scroll selected into view ──
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  // ── Global shortcut: Cmd+K ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  // ── Auto-focus + inert background ──
  useEffect(() => {
    if (!open) return;
    // Mark all sibling elements of our portal as inert to prevent
    // focus/keyboard leaking into shell, sidebar, agent panel, etc.
    const root = document.getElementById("root");
    if (root) {
      root.setAttribute("inert", "");
      root.style.pointerEvents = "none";
    }
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      if (root) {
        root.removeAttribute("inert");
        root.style.pointerEvents = "";
      }
    };
  }, [open]);

  if (!open) return null;

  const currentMode = MODES.find((m) => m.id === mode) ?? MODES[0];

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Unified search"
      ref={dialogRef}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fade-in_80ms_ease-out]"
        onClick={handleClose}
        role="presentation"
      />

      {/* Search Panel */}
      <div
        className={cn(
          "relative w-full max-w-[600px] mx-4 rounded-xl overflow-hidden",
          "bg-vsc-bg/95 backdrop-blur-xl border border-vsc-border/40",
          "shadow-2xl shadow-black/30",
          "animate-[slide-up-in_120ms_ease-out]",
        )}
      >
        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-0">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setQuery("");
                setSelectedIdx(0);
                inputRef.current?.focus();
              }}
              className={cn(
                "inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px]",
                "cursor-pointer border-none transition-all duration-fast",
                mode === m.id
                  ? "bg-vsc-accent/15 text-vsc-accent font-medium"
                  : "bg-transparent text-vsc-text-secondary hover:text-vsc-fg hover:bg-vsc-surface-2/40",
              )}
            >
              <Icon name={m.icon} tokenSize="2xs" />
              <span>{m.label}</span>
              {m.prefix && <kbd className="ml-0.5 text-[9px] opacity-70 font-mono">{m.prefix}</kbd>}
            </button>
          ))}
          <div className="flex-1" />
          <kbd className="text-[9px] text-vsc-text-tertiary font-mono">Tab to switch</kbd>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Icon name={currentMode.icon} tokenSize="sm" className="text-vsc-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            className={cn(
              "flex-1 bg-transparent text-sm text-vsc-fg",
              "placeholder:text-vsc-text-tertiary",
              "outline-none",
            )}
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIdx(0);
                inputRef.current?.focus();
              }}
              className="text-vsc-text-ghost hover:text-vsc-fg cursor-pointer bg-transparent border-none"
            >
              <Icon name="close" tokenSize="2xs" />
            </button>
          )}
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-vsc-border/30 to-transparent" />

        {/* Results */}
        <div ref={listRef} className="max-h-[min(400px,50vh)] overflow-y-auto py-1">
          {results.length === 0 && query.trim() && (
            <div className="flex flex-col items-center gap-2 py-8 text-vsc-text-tertiary">
              <Icon name="search-stop" size={24} className="opacity-60" />
              <span className="text-xs">No results for &ldquo;{query}&rdquo;</span>
            </div>
          )}

          {results.length === 0 && !query.trim() && mode !== "files" && (
            <div className="flex flex-col items-center gap-2 py-8 text-vsc-text-tertiary">
              <Icon name={currentMode.icon} size={24} className="opacity-60" />
              <span className="text-xs">Type to search {currentMode.label.toLowerCase()}…</span>
            </div>
          )}

          {results.map((result, idx) => (
            <ResultRow
              key={resultKey(result, idx)}
              result={result}
              query={query}
              selected={idx === selectedIdx}
              onSelect={() => handleSelect(result)}
              onHover={() => setSelectedIdx(idx)}
            />
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-3 px-4 py-1.5 border-t border-vsc-border/30 text-[10px] text-vsc-text-tertiary">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2 font-mono text-[9px]">↑↓</kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2 font-mono text-[9px]">↵</kbd>
            open
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2 font-mono text-[9px]">esc</kbd>
            close
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2 font-mono text-[9px]">&gt;</kbd>
            code
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2 font-mono text-[9px]">#</kbd>
            symbols
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
});

// ─── Result Row ─────────────────────────────────────────

function resultKey(r: SearchResult, idx: number): string {
  switch (r.type) {
    case "file":
      return `file-${r.data.path}`;
    case "code":
      return `code-${r.data.filePath}:${r.data.line}-${idx}`;
    case "symbol":
      return `sym-${r.data.name}-${r.data.filePath}-${idx}`;
  }
}

const ResultRow = React.memo(function ResultRow({
  result,
  query,
  selected,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  query: string;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  switch (result.type) {
    case "file":
      return (
        <FileRow
          data={result.data}
          query={query}
          selected={selected}
          onSelect={onSelect}
          onHover={onHover}
        />
      );
    case "code":
      return (
        <CodeRow
          data={result.data}
          query={query}
          selected={selected}
          onSelect={onSelect}
          onHover={onHover}
        />
      );
    case "symbol":
      return (
        <SymbolRow
          data={result.data}
          query={query}
          selected={selected}
          onSelect={onSelect}
          onHover={onHover}
        />
      );
  }
});

// ─── File Row ───────────────────────────────────────────

const FileRow = React.memo(function FileRow({
  data,
  query,
  selected,
  onSelect,
  onHover,
}: {
  data: FileResult;
  query: string;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const parts = data.path.split("/");
  const fileName = parts.pop() ?? data.path;
  const dirPath = parts.join("/");

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-2.5 w-full px-4 h-8 text-left",
        "cursor-pointer border-none transition-colors duration-fast",
        selected ? "bg-vsc-accent/10" : "bg-transparent hover:bg-vsc-surface-2/30",
      )}
    >
      <Icon name={data.icon} tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
      <span className="text-xs text-vsc-fg truncate">
        <Highlight text={fileName} query={query} />
      </span>
      <span className="text-[10px] text-vsc-text-secondary/70 truncate min-w-0">{dirPath}</span>
    </button>
  );
});

// ─── Code Row ───────────────────────────────────────────

const CodeRow = React.memo(function CodeRow({
  data,
  query,
  selected,
  onSelect,
  onHover,
}: {
  data: CodeResult;
  query: string;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const parts = data.filePath.split("/");
  const fileName = parts.pop() ?? data.filePath;

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-2.5 w-full px-4 h-8 text-left",
        "cursor-pointer border-none transition-colors duration-fast",
        selected ? "bg-vsc-accent/10" : "bg-transparent hover:bg-vsc-surface-2/30",
      )}
    >
      <Icon name="file-code" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
      <span className="text-[10px] text-vsc-text-tertiary shrink-0 tabular-nums w-6 text-right">
        {data.line}
      </span>
      <span className="text-xs font-mono text-vsc-fg truncate min-w-0">
        <Highlight text={data.content.trim()} query={query} />
      </span>
      <span className="ml-auto text-[10px] text-vsc-text-secondary/70 shrink-0">{fileName}</span>
    </button>
  );
});

// ─── Symbol Row ─────────────────────────────────────────

const SymbolRow = React.memo(function SymbolRow({
  data,
  query,
  selected,
  onSelect,
  onHover,
}: {
  data: SymbolResult;
  query: string;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const parts = data.filePath.split("/");
  const fileName = parts.pop() ?? data.filePath;

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-2.5 w-full px-4 h-8 text-left",
        "cursor-pointer border-none transition-colors duration-fast",
        selected ? "bg-vsc-accent/10" : "bg-transparent hover:bg-vsc-surface-2/30",
      )}
    >
      <Icon name={data.icon} tokenSize="2xs" className="text-vsc-accent/70 shrink-0" />
      <span className="text-xs text-vsc-fg font-medium truncate">
        <Highlight text={data.name} query={query} />
      </span>
      <span
        className={cn(
          "text-[9px] px-1 py-0.5 rounded font-mono shrink-0",
          "bg-vsc-surface-2 text-vsc-text-tertiary",
        )}
      >
        {data.kind}
      </span>
      <span className="ml-auto text-[10px] text-vsc-text-secondary/70 shrink-0">
        {fileName}:{data.line}
      </span>
    </button>
  );
});

// ─── Highlight helper ───────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-vsc-accent/25 text-vsc-accent rounded-sm">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}
