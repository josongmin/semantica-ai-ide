import React from "react";

import { cn } from "../../shared/ui";

/** Parse a conventional commit first-line into structured parts. */
// eslint-disable-next-line react-refresh/only-export-components
export function parseCommitMessage(
  text: string,
): { type: string; scope?: string; subject: string; bodyLines: string[] } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const firstLine = trimmed.split("\n")[0] ?? "";
  const match =
    /^(feat|fix|chore|refactor|docs|style|test|perf|ci|build|revert)(\(([^)]+)\))?!?:?\s*(.*)/i.exec(
      firstLine,
    );
  if (!match) return null;
  const type = match[1]?.toLowerCase() ?? "chore";
  const scope = match[3];
  const subject = match[4] ?? "";
  const body = trimmed.includes("\n") ? trimmed.slice(trimmed.indexOf("\n") + 1).trim() : "";
  const bodyLines = body ? body.split("\n").filter((l) => l.trim()) : [];
  return { type, scope, subject, bodyLines };
}

// ── Commit type color accents ──────────────────────────────

const DEFAULT_TYPE_STYLE = { icon: "gear", color: "text-vsc-text-tertiary" } as const;
const TYPE_STYLE: Record<string, { icon: string; color: string }> = {
  feat: { icon: "sparkle", color: "text-vsc-success" },
  fix: { icon: "wrench", color: "text-vsc-error" },
  refactor: { icon: "symbol-misc", color: "text-vsc-info" },
  perf: { icon: "flame", color: "text-vsc-warning" },
  docs: { icon: "book", color: "text-vsc-accent" },
  test: { icon: "beaker", color: "text-vsc-accent" },
  chore: { icon: "gear", color: "text-vsc-text-tertiary" },
  style: { icon: "symbol-color", color: "text-vsc-accent" },
  ci: { icon: "server-process", color: "text-vsc-text-tertiary" },
  build: { icon: "package", color: "text-vsc-text-tertiary" },
  revert: { icon: "discard", color: "text-vsc-warning" },
};

interface CommitMessageCardProps {
  codeText: string;
  actions: React.ReactNode;
}

/** Renders a conventional-commit message as a structured card with icon header. */
export const CommitMessageCard = React.memo(function CommitMessageCard({
  codeText,
  actions,
}: CommitMessageCardProps) {
  const parsed = parseCommitMessage(codeText);
  if (!parsed) return null;

  const { type, scope, subject, bodyLines } = parsed;
  const style = TYPE_STYLE[type] ?? DEFAULT_TYPE_STYLE;

  return (
    <div className="relative group/code my-1.5 -mx-1 rounded-xl border border-vsc-border/40 bg-vsc-surface-1/50 overflow-hidden">
      {/* Content area */}
      <div className="px-2.5 py-1.5">
        {/* Subject line + type badge in top-right */}
        <div className="flex items-center gap-2">
          <p className="flex-1 min-w-0 text-2xs text-vsc-fg font-medium leading-normal">
            {subject}
          </p>

          {/* Type badge — top right */}
          <span
            className={cn(
              "inline-flex items-center gap-1 shrink-0 px-1.5 h-4 rounded",
              "text-3xs font-semibold tracking-wide uppercase",
              "bg-vsc-surface-2/60",
              style.color,
            )}
          >
            {type}
            {scope && (
              <span className="text-vsc-text-ghost font-normal normal-case">({scope})</span>
            )}
          </span>
        </div>

        {/* Body bullets */}
        {bodyLines.length > 0 && (
          <ul className="mt-1 space-y-px text-xs text-vsc-text-secondary leading-snug">
            {bodyLines.map((line) => {
              const bullet = line.replace(/^[-*]\s*/, "");
              return (
                <li key={line} className="flex items-baseline gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-vsc-text-ghost/40 shrink-0 mt-[4px]" />
                  <span>{bullet}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {actions}
    </div>
  );
});
