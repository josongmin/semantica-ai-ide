import React, { useEffect, useLayoutEffect, useRef } from "react";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { classHighlighter } from "@lezer/highlight";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";

import { changeOverviewRuler } from "./changeOverviewRuler";
import { useCodeMirrorTheme } from "./useCodeMirrorTheme";

// ─── Types ──────────────────────────────────────────────

export interface CodeMirrorEditorProps {
  readonly value: string;
  readonly language: string;
  readonly filePath: string;
  readonly onChange?: (value: string) => void;
  readonly onContextMenu?: (info: {
    x: number;
    y: number;
    line: number;
    hasSelection: boolean;
    selectedText: string;
  }) => void;
  readonly readOnly?: boolean;
}

// ─── Language resolver ──────────────────────────────────

function getLanguageExtension(lang: string): Extension {
  switch (lang) {
    case "typescript":
    case "typescriptreact":
      return javascript({ jsx: true, typescript: true });
    case "javascript":
    case "javascriptreact":
      return javascript({ jsx: true });
    case "json":
    case "jsonc":
      return json();
    case "markdown":
      return markdown();
    case "python":
      return python();
    case "rust":
      return rust();
    case "css":
    case "scss":
    case "less":
      return css();
    case "html":
      return html();
    case "go":
      return go();
    default:
      return [];
  }
}

// ─── Shared keymaps ─────────────────────────────────────

const KEYMAPS = keymap.of([
  ...closeBracketsKeymap,
  ...defaultKeymap,
  ...searchKeymap,
  ...historyKeymap,
  ...foldKeymap,
  ...completionKeymap,
  ...lintKeymap,
  indentWithTab,
]);

// ─── Component ──────────────────────────────────────────

export const CodeMirrorEditor = React.memo(function CodeMirrorEditor({
  value,
  language,
  filePath,
  onChange,
  onContextMenu,
  readOnly = false,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onContextMenuRef = useRef(onContextMenu);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
    onContextMenuRef.current = onContextMenu;
  });

  // Compartments for dynamic reconfiguration
  const themeCompartment = useRef(new Compartment());
  const langCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());
  const rulerCompartment = useRef(new Compartment());

  // Track original value per file for change overview ruler
  const originalValueRef = useRef(value);

  const themeExtension = useCodeMirrorTheme();

  // Track file path for detecting file switches
  const prevFilePathRef = useRef(filePath);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current?.(update.state.doc.toString());
      }
    });

    // Context-menu handler via CM extension (ensures it runs before CM swallows it)
    const contextMenuHandler = EditorView.domEventHandlers({
      contextmenu(e: MouseEvent, v: EditorView) {
        if (!onContextMenuRef.current) return false;
        const pos = v.posAtCoords({ x: e.clientX, y: e.clientY });
        const line = pos != null ? v.state.doc.lineAt(pos).number : 1;
        const sel = v.state.selection.main;
        const hasSelection = !sel.empty;
        const selectedText = hasSelection ? v.state.sliceDoc(sel.from, sel.to) : "";
        e.preventDefault();
        onContextMenuRef.current({ x: e.clientX, y: e.clientY, line, hasSelection, selectedText });
        return true;
      },
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        // Core extensions (static)
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        indentUnit.of("  "),
        KEYMAPS,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        syntaxHighlighting(classHighlighter),
        updateListener,
        contextMenuHandler,

        // Dynamic extensions (reconfigurable via compartments)
        themeCompartment.current.of(themeExtension),
        langCompartment.current.of(getLanguageExtension(language)),
        readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
        rulerCompartment.current.of(changeOverviewRuler(value)),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconfigure theme when app theme changes
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.current.reconfigure(themeExtension),
    });
  }, [themeExtension]);

  // Reconfigure language when it changes
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: langCompartment.current.reconfigure(getLanguageExtension(language)),
    });
  }, [language]);

  // Reconfigure read-only
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  // Sync value on file switch or external update
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const fileChanged = prevFilePathRef.current !== filePath;
    prevFilePathRef.current = filePath;

    const currentDoc = view.state.doc.toString();
    if (fileChanged || value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }

    // Reset overview ruler original baseline on file switch
    if (fileChanged) {
      originalValueRef.current = value;
      view.dispatch({
        effects: rulerCompartment.current.reconfigure(changeOverviewRuler(value)),
      });
    }
  }, [value, filePath]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto cm-scrollbar-autohide"
    />
  );
});
