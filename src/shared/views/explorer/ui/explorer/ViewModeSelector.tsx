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
    <DropdownMenu
      items={items}
      onSelect={handleSelect}
      className="w-full"
      trigger={
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 w-full px-2.5 h-[26px]",
            "bg-transparent border-none cursor-pointer text-left",
            "hover:bg-vsc-list-hover/50 transition-colors duration-fast focus-ring",
          )}
        >
          <Icon name="root-folder" size={13} className="text-vsc-text-tertiary shrink-0" />
          <span className="text-[13px] font-medium text-vsc-fg truncate">
            {VIEW_MODE_LABEL[value]}
          </span>
          <Icon name="chevron-down" size={10} className="text-vsc-text-ghost shrink-0 ml-auto" />
        </button>
      }
    />
  );
});
