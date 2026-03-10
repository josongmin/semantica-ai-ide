import React, { useCallback, useMemo } from "react";
import { useSetAtom } from "jotai";

import { scanArchitectureAtom } from "~features/arch-guardian/model/atoms";
import { openDataflowAtom } from "~features/dataflow-lens/model/atoms";
import { analyzeImpactAtom } from "~features/impact-radar/model/atoms";
import { startRootCauseAtom } from "~features/root-cause/model/atoms";
import { openSelfExplainAtom } from "~features/self-explain/model/atoms";
import { ContextMenu, type ContextMenuGroup } from "~shared/ui";

import { dispatchIntentAtom } from "../../app/shell/model/intentRouter";

// ─── Types ──────────────────────────────────────────────

interface EditorContextMenuProps {
  readonly position: { x: number; y: number } | null;
  readonly onClose: () => void;
  readonly filePath: string;
  readonly line: number;
  readonly hasSelection: boolean;
  readonly selectedText: string;
}

// ─── Menu builders ──────────────────────────────────────

function buildGroups(hasSelection: boolean): ContextMenuGroup[] {
  return [
    // ── Edit ──
    {
      items: [
        { id: "cut", label: "Cut", icon: "clippy", shortcut: "⌘X", disabled: !hasSelection },
        { id: "copy", label: "Copy", icon: "copy", shortcut: "⌘C", disabled: !hasSelection },
        { id: "paste", label: "Paste", icon: "paste", shortcut: "⌘V" },
      ],
    },

    // ── Code Navigation ──
    {
      items: [
        {
          id: "go-to-definition",
          label: "Go to Definition",
          icon: "symbol-function",
          shortcut: "F12",
        },
        { id: "peek-definition", label: "Peek Definition", icon: "eye", shortcut: "⌥F12" },
        { id: "go-to-type-def", label: "Go to Type Definition", icon: "symbol-interface" },
        {
          id: "find-references",
          label: "Find All References",
          icon: "references",
          shortcut: "⇧F12",
        },
        { id: "go-to-symbol", label: "Go to Symbol…", icon: "symbol-class", shortcut: "⌘⇧O" },
      ],
    },

    // ── Refactoring ──
    {
      items: [
        { id: "rename-symbol", label: "Rename Symbol", icon: "edit", shortcut: "F2" },
        { id: "format-document", label: "Format Document", icon: "whitespace", shortcut: "⇧⌥F" },
        { id: "toggle-comment", label: "Toggle Line Comment", icon: "comment", shortcut: "⌘/" },
        ...(hasSelection
          ? [
              {
                id: "extract-function",
                label: "Extract to Function…",
                icon: "symbol-method",
              } as const,
            ]
          : []),
      ],
    },

    // ── System Intelligence ──
    {
      label: "System Intelligence",
      items: [
        { id: "explain-symbol", label: "Explain Symbol", icon: "lightbulb" },
        { id: "analyze-impact", label: "Analyze Impact", icon: "radio-tower" },
        { id: "trace-dataflow", label: "Trace Dataflow", icon: "git-merge" },
        { id: "root-cause", label: "Root Cause", icon: "search-fuzzy" },
        { id: "scan-architecture", label: "Scan Architecture", icon: "shield" },
      ],
    },
  ];
}

// ─── Component ──────────────────────────────────────────

export const EditorContextMenu = React.memo(function EditorContextMenu({
  position,
  onClose,
  filePath,
  line,
  hasSelection,
  selectedText,
}: EditorContextMenuProps) {
  const openSelfExplain = useSetAtom(openSelfExplainAtom);
  const analyzeImpact = useSetAtom(analyzeImpactAtom);
  const openDataflow = useSetAtom(openDataflowAtom);
  const startRootCause = useSetAtom(startRootCauseAtom);
  const scanArchitecture = useSetAtom(scanArchitectureAtom);
  const dispatch = useSetAtom(dispatchIntentAtom);

  const symbolId = `${filePath}:${line}`;

  const groups = useMemo(() => buildGroups(hasSelection), [hasSelection]);

  const handleSelect = useCallback(
    (id: string) => {
      switch (id) {
        // ── Edit ──
        case "cut":
          if (hasSelection) {
            void navigator.clipboard.writeText(selectedText);
            // eslint-disable-next-line @typescript-eslint/no-deprecated -- Clipboard API lacks delete; editor integration needed for proper fix
            document.execCommand("delete");
          }
          break;
        case "copy":
          if (hasSelection) void navigator.clipboard.writeText(selectedText);
          break;
        case "paste":
          void navigator.clipboard.readText().then((text) => {
            // eslint-disable-next-line @typescript-eslint/no-deprecated -- Clipboard API lacks insertText; editor integration needed for proper fix
            document.execCommand("insertText", false, text);
          });
          break;

        // ── Code Navigation ──
        case "go-to-definition":
        case "peek-definition":
        case "go-to-type-def":
        case "find-references":
        case "go-to-symbol":
        case "rename-symbol":
        case "format-document":
        case "toggle-comment":
        case "extract-function":
          // These dispatch to shell intent for future implementation
          dispatch({ action: "editor-command", command: id, filePath, line });
          break;

        // ── System Intelligence ──
        case "explain-symbol":
          openSelfExplain({ symbolId, filePath, line });
          dispatch({ action: "show-view", viewId: "self-explain" });
          break;
        case "analyze-impact":
          void analyzeImpact({
            filePath,
            line,
            symbolName: symbolId,
            changeType: "edit",
          });
          dispatch({ action: "show-view", viewId: "impact-radar" });
          break;
        case "trace-dataflow":
          void openDataflow({ symbolId, filePath, line });
          dispatch({ action: "show-view", viewId: "dataflow-lens" });
          break;
        case "root-cause":
          void startRootCause({ symptom: symbolId, filePath, line });
          dispatch({ action: "show-view", viewId: "root-cause" });
          break;
        case "scan-architecture":
          void scanArchitecture();
          dispatch({ action: "show-view", viewId: "arch-guardian" });
          break;
      }
    },
    [
      symbolId,
      filePath,
      line,
      hasSelection,
      selectedText,
      openSelfExplain,
      analyzeImpact,
      openDataflow,
      startRootCause,
      scanArchitecture,
      dispatch,
    ],
  );

  return (
    <ContextMenu position={position} groups={groups} onSelect={handleSelect} onClose={onClose} />
  );
});
