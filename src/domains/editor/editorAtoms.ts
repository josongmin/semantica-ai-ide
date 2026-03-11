import { atom } from "jotai";

// ─── Types ──────────────────────────────────────────────

export interface EditorTab {
  readonly id: string;
  readonly filePath: string;
  readonly fileName: string;
  readonly isDirty: boolean;
  readonly language?: string;
}

// ─── State Atoms ────────────────────────────────────────

export const editorTabsAtom = atom<EditorTab[]>([]);
export const activeEditorTabAtom = atom<string | null>(null);
export const editorSplitModeAtom = atom<"single" | "split-horizontal" | "split-vertical">("single");

/** File content cache: filePath -> content string */
export const fileContentsAtom = atom<ReadonlyMap<string, string>>(new Map());

// ─── Derived ────────────────────────────────────────────

/** Active tab object */
export const activeTabAtom = atom<EditorTab | null>((get) => {
  const id = get(activeEditorTabAtom);
  if (!id) return null;
  return get(editorTabsAtom).find((t) => t.id === id) ?? null;
});

/** Content of the currently active tab */
export const activeFileContentAtom = atom<string>((get) => {
  const tab = get(activeTabAtom);
  if (!tab) return "";
  return get(fileContentsAtom).get(tab.filePath) ?? "";
});

/** Language of the currently active tab */
export const activeFileLanguageAtom = atom<string>((get) => {
  const tab = get(activeTabAtom);
  return tab?.language ?? "plaintext";
});

// ─── Actions ────────────────────────────────────────────

/** Open a file in the editor (adds tab if not open, activates it) */
export const openFileInEditorAtom = atom(null, (get, set, filePath: string, content?: string) => {
  const tabs = get(editorTabsAtom);
  const existing = tabs.find((t) => t.filePath === filePath);

  if (existing) {
    set(activeEditorTabAtom, existing.id);
  } else {
    const fileName = filePath.split("/").pop() ?? filePath;
    const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTab: EditorTab = {
      id,
      filePath,
      fileName,
      isDirty: false,
      language: inferLanguage(fileName),
    };
    set(editorTabsAtom, [...tabs, newTab]);
    set(activeEditorTabAtom, id);
  }

  if (content !== undefined) {
    const contents = new Map(get(fileContentsAtom));
    contents.set(filePath, content);
    set(fileContentsAtom, contents);
  }
});

/** Close a tab */
export const closeEditorTabAtom = atom(null, (get, set, tabId: string) => {
  const tabs = get(editorTabsAtom);
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;

  const newTabs = tabs.filter((t) => t.id !== tabId);
  set(editorTabsAtom, newTabs);

  if (get(activeEditorTabAtom) === tabId) {
    const next = newTabs[Math.min(idx, newTabs.length - 1)];
    set(activeEditorTabAtom, next?.id ?? null);
  }
});

/** Update file content (marks tab dirty) */
export const updateFileContentAtom = atom(null, (get, set, filePath: string, content: string) => {
  const contents = new Map(get(fileContentsAtom));
  contents.set(filePath, content);
  set(fileContentsAtom, contents);

  set(
    editorTabsAtom,
    get(editorTabsAtom).map((t) => (t.filePath === filePath ? { ...t, isDirty: true } : t)),
  );
});

// ─── Cursor State ────────────────────────────────────────

export interface EditorCursorState {
  readonly line: number;
  readonly col: number;
  readonly selections: number;
  readonly selectedChars: number;
}

export const editorCursorAtom = atom<EditorCursorState>({
  line: 1,
  col: 1,
  selections: 1,
  selectedChars: 0,
});

// ─── Helpers ────────────────────────────────────────────

export function inferLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    vue: "html",
    svelte: "html",
    yaml: "yaml",
    yml: "yaml",
    toml: "ini",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    sql: "sql",
    graphql: "graphql",
    xml: "xml",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    rb: "ruby",
    php: "php",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return map[ext] ?? "plaintext";
}
