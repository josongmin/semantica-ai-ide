/**
 * Code Edit Flow — 파일 읽기/수정 흐름을 파이프라인에 표시
 *
 * Tool calls(읽기/검색/쓰기) + File changes를 순서대로 보여줌.
 */
import React, { useMemo, useState } from "react";
import { useAtomValue } from "jotai";

import { fileChangeSummaryByTurnAtom } from "~entities/diff";
import { toolCallGroupsByTurnAtom } from "~entities/tool-call";

import type { ToolCall, TurnId } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

function shortPath(s: string): string {
  if (!s.trim()) return "";
  const parts = s.split(/[/\\]/);
  return parts.length > 2 ? `${parts[0]}/…/${parts[parts.length - 1]}` : s;
}

function isReadLike(tc: ToolCall): boolean {
  return tc.category === "read" || tc.category === "search";
}

function isWriteLike(tc: ToolCall): boolean {
  return tc.category === "write" || tc.category === "delete";
}

function toolLabel(tc: ToolCall): string {
  const arg = tc.args_summary;
  switch (tc.tool_name) {
    case "read_file":
    case "Read":
      return shortPath(arg) || "file";
    case "write_file":
    case "Write":
      return shortPath(arg) || "file";
    case "edit_file":
    case "Edit":
    case "search_replace":
      return shortPath(arg) || "file";
    case "grep":
    case "Grep":
    case "search":
      return arg ? `"${arg.slice(0, 20)}…"` : "code";
    case "list_directory":
      return shortPath(arg) || "dir";
    default:
      return arg ? shortPath(arg) : tc.tool_name;
  }
}

type FlowEntry =
  | { kind: "read"; path: string; label: string; toolName: string }
  | { kind: "edit"; path: string; status?: string; toolName?: string };

function useFlowEntries(turnId: TurnId): FlowEntry[] {
  const groups = useAtomValue(toolCallGroupsByTurnAtom(turnId));
  const fileSummary = useAtomValue(fileChangeSummaryByTurnAtom(turnId));

  return useMemo(() => {
    const entries: FlowEntry[] = [];

    for (const g of groups) {
      for (const tc of g.calls) {
        if (isReadLike(tc)) {
          const path = tc.args_summary || "";
          entries.push({
            kind: "read",
            path,
            label: toolLabel(tc),
            toolName: tc.tool_name,
          });
        } else if (isWriteLike(tc)) {
          const path = tc.args_summary || "";
          entries.push({
            kind: "edit",
            path,
            toolName: tc.tool_name,
          });
        }
      }
    }

    const seenPaths = new Set(entries.map((e) => e.path));
    for (const fc of fileSummary.files) {
      if (!seenPaths.has(fc.file_path)) {
        entries.push({
          kind: "edit",
          path: fc.file_path,
          status: fc.status,
        });
      }
      seenPaths.add(fc.file_path);
    }

    return entries;
  }, [groups, fileSummary.files]);
}

export const CodeEditFlowWidget = React.memo(function CodeEditFlowWidget({
  turnId,
}: {
  turnId: TurnId;
}) {
  const entries = useFlowEntries(turnId);
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  const readCount = entries.filter((e) => e.kind === "read").length;
  const editCount = entries.filter((e) => e.kind === "edit").length;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="code-edit-flow">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex items-center gap-2 w-full text-left bg-transparent border-none cursor-pointer focus-ring"
      >
        <Icon
          name="chevron-right"
          tokenSize="2xs"
          className={cn(
            "text-vsc-text-tertiary transition-transform duration-normal",
            expanded && "rotate-90",
          )}
        />
        <Icon name="file-code" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">
          파일 읽기/수정 흐름
        </Text>
        <span className="ml-auto flex items-center gap-1.5 text-2xs text-vsc-text-tertiary">
          <span className="flex items-center gap-1">
            <Icon name="book" tokenSize="2xs" />
            {readCount}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="edit" tokenSize="2xs" />
            {editCount}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="pl-8 mt-1.5 space-y-1">
          <div className="space-y-0.5 max-h-[--panel-max-h-sm] overflow-y-auto">
            {entries.map((e, i) => (
              <div key={`${e.kind}-${e.path}-${i}`} className="flex items-center gap-2 text-2xs">
                {e.kind === "read" ? (
                  <>
                    <Icon name="book" tokenSize="2xs" className="text-vsc-info shrink-0" />
                    <Text mono tone="secondary" className="flex-1 min-w-0 truncate">
                      읽음: {e.label || e.path}
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon name="edit" tokenSize="2xs" className="text-vsc-warning shrink-0" />
                    <Text mono tone="secondary" className="flex-1 min-w-0 truncate">
                      수정: {shortPath(e.path)}
                    </Text>
                    {e.status && (
                      <span
                        className={cn(
                          "shrink-0 px-1 rounded text-2xs",
                          e.status === "added" && "bg-vsc-diff-insert/30 text-vsc-success",
                          e.status === "modified" && "bg-vsc-warning/20 text-vsc-warning",
                          e.status === "deleted" && "bg-vsc-diff-delete/30 text-vsc-error",
                        )}
                      >
                        {e.status}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
