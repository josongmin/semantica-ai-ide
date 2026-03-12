import { memo, useCallback } from "react";

import { cn, DropdownMenu, type DropdownMenuItem, Icon } from "~shared/ui";

export type ViewMode =
  | "project"
  | "packages"
  | "project-files"
  | "production"
  | "tests"
  | "open-files"
  | "all-changed-files"
  | "scratches";

interface ViewModeEntry {
  readonly id: ViewMode;
  readonly label: string;
  readonly icon: string;
  readonly separator?: boolean;
}

const VIEW_MODES: readonly ViewModeEntry[] = [
  { id: "project", label: "Project", icon: "root-folder" },
  { id: "packages", label: "Packages", icon: "package" },
  { id: "project-files", label: "Project Files", icon: "files" },
  { id: "production", label: "Production", icon: "server-process", separator: true },
  { id: "tests", label: "Tests", icon: "beaker" },
  { id: "open-files", label: "Open Files", icon: "go-to-file", separator: true },
  { id: "all-changed-files", label: "All Changed Files", icon: "diff" },
  { id: "scratches", label: "Scratches and Consoles", icon: "note", separator: true },
];

const VIEW_MODE_LABEL: Record<ViewMode, string> = Object.fromEntries(
  VIEW_MODES.map((m) => [m.id, m.label]),
) as Record<ViewMode, string>;

export interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeSelector = memo(function ViewModeSelector({
  value,
  onChange,
}: ViewModeSelectorProps) {
  const items: DropdownMenuItem[] = [];
  for (const mode of VIEW_MODES) {
    if (mode.separator) {
      items.push({ id: `sep-${mode.id}`, label: "", separator: true });
    }
    items.push({ id: mode.id, label: mode.label, icon: mode.icon });
  }

  const handleSelect = useCallback(
    (id: string) => {
      if (id.startsWith("sep-")) return;
      onChange(id as ViewMode);
    },
    [onChange],
  );

  return (
    <div className="flex items-center h-[36px] px-2 bg-white shrink-0 border-b border-vsc-border/10">
      {/* Left: view mode dropdown */}
      <DropdownMenu
        items={items}
        onSelect={handleSelect}
        trigger={
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 px-1 h-[28px] rounded",
              "bg-transparent border-none cursor-pointer text-left",
              "hover:bg-vsc-list-hover/50 transition-colors duration-fast focus-ring",
            )}
          >
            <span className="text-md font-medium text-vsc-fg truncate">
              {VIEW_MODE_LABEL[value]}
            </span>
            <Icon name="chevron-down" size={9} className="text-vsc-text-ghost shrink-0" />
          </button>
        }
      />

      {/* Right: action icons */}
      <div className="flex items-center gap-0.5 ml-auto">
        <HeaderAction icon="new-file" title="New File" />
        <HeaderAction icon="target" title="Locate File" />
        <HeaderAction icon="ellipsis" title="More Actions" />
      </div>
    </div>
  );
});

// ─── Header action button ────────────────────────────────

function HeaderAction({ icon, title }: { icon: string; title: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={cn(
        "flex items-center justify-center w-[22px] h-[22px] rounded",
        "bg-transparent border-none cursor-pointer",
        "text-vsc-text-tertiary hover:text-vsc-text-primary hover:bg-vsc-surface-2/60",
        "transition-colors duration-fast focus-ring",
      )}
    >
      <Icon name={icon} size={14} />
    </button>
  );
}
