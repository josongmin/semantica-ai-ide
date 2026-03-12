import { memo } from "react";

import { cn, Icon } from "~shared/ui";

import type { ProjectStats } from "./helpers";

// ── Language color mapping ───────────────────────────────

const LANG_DOT_COLOR: Record<string, string> = {
  TypeScript: "bg-lang-typescript",
  JavaScript: "bg-lang-javascript",
  Python: "bg-lang-python",
  Rust: "bg-lang-rust",
  Go: "bg-lang-go",
  Java: "bg-lang-java",
  Ruby: "bg-lang-ruby",
  Swift: "bg-[#F05138]",
  Kotlin: "bg-[#A97BFF]",
  "C#": "bg-[#178600]",
  "C++": "bg-[#f34b7d]",
  C: "bg-[#555555]",
  PHP: "bg-[#4F5D95]",
  Vue: "bg-[#41b883]",
  Svelte: "bg-[#ff3e00]",
  Dart: "bg-[#00B4AB]",
};

export const ProjectSectionHeader = memo(function ProjectSectionHeader({
  label,
  stats,
  open,
  onToggle,
}: {
  label: string;
  stats: ProjectStats;
  open: boolean;
  onToggle: () => void;
}) {
  const { files, folders, primaryLang, langBreakdown } = stats;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex flex-col w-full pl-1.5 pr-4 py-1",
        "bg-transparent border-none cursor-pointer text-left",
        "hover:bg-vsc-list-hover/50 transition-colors duration-fast focus-ring",
      )}
      aria-expanded={open}
    >
      {/* Row 1: chevron + name + primary lang */}
      <div className="flex items-center gap-1 w-full">
        <Icon
          name="chevron-right"
          tokenSize="2xs"
          className={cn(
            "transition-transform duration-normal text-vsc-text-tertiary shrink-0",
            open && "rotate-90",
          )}
        />
        <span className="text-sm font-medium text-vsc-fg flex-1 truncate">{label}</span>
        {primaryLang && (
          <span className="flex items-center gap-1 text-2xs text-vsc-text-ghost shrink-0">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                LANG_DOT_COLOR[primaryLang] ?? "bg-vsc-text-ghost",
              )}
            />
            {primaryLang}
          </span>
        )}
      </div>

      {/* Row 2: meta stats */}
      <div className="flex items-center gap-2.5 pl-[18px] mt-px">
        <span className="flex items-center gap-0.5 text-2xs text-vsc-text-ghost">
          <Icon name="file" tokenSize="2xs" className="opacity-50" />
          {files}
        </span>
        <span className="flex items-center gap-0.5 text-2xs text-vsc-text-ghost">
          <Icon name="folder" tokenSize="2xs" className="opacity-50" />
          {folders}
        </span>
        {langBreakdown.length > 0 && (
          <>
            <span className="w-px h-2.5 bg-vsc-border/30" />
            {langBreakdown.map(({ lang, pct }) => (
              <span key={lang} className="flex items-center gap-0.5 text-2xs text-vsc-text-ghost">
                <span
                  className={cn(
                    "w-1 h-1 rounded-full shrink-0",
                    LANG_DOT_COLOR[lang] ?? "bg-vsc-text-ghost",
                  )}
                />
                {pct}%
              </span>
            ))}
          </>
        )}
      </div>
    </button>
  );
});
