import React, { useCallback } from "react";
import { useAtom } from "jotai";

import {
  CATEGORY_SETTINGS,
  type CategoryPermission,
  type PermissionPreset,
  usePermissionSettings,
} from "../../features/permission-settings";
import { permissionSettingsOpenAtom } from "../../shared/lib";
import type { ToolCategory } from "../../shared/protocol";
import {
  Button,
  cn,
  Dialog,
  Icon,
  SegmentedControl,
  type SegmentedOption,
  Text,
} from "../../shared/ui";

const PERMISSION_OPTIONS: readonly SegmentedOption<CategoryPermission>[] = [
  { value: "auto", label: "Auto" },
  { value: "ask", label: "Ask" },
  { value: "block", label: "Block" },
];

interface PresetButtonDef {
  preset: PermissionPreset;
  label: string;
  description: string;
}

const PRESET_BUTTONS: readonly PresetButtonDef[] = [
  { preset: "conservative", label: "Conservative", description: "Ask for everything" },
  { preset: "balanced", label: "Balanced", description: "Auto read, ask write" },
  { preset: "turbo", label: "Turbo", description: "Auto most, ask delete" },
];

export const PermissionSettingsDialog = React.memo(function PermissionSettingsDialog() {
  const [open, setOpen] = useAtom(permissionSettingsOpenAtom);
  const { getPermission, setPermission, applyPreset, resetToDefaults, apply } =
    usePermissionSettings();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleApply = useCallback(() => {
    apply();
    handleClose();
  }, [apply, handleClose]);

  const handlePreset = useCallback(
    (preset: PermissionPreset) => {
      applyPreset(preset);
    },
    [applyPreset],
  );

  const handlePermissionChange = useCallback(
    (category: ToolCategory, value: CategoryPermission) => {
      setPermission(category, value);
    },
    [setPermission],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Permission Settings"
      description="Configure auto-approval rules per tool category"
      className="max-w-lg"
    >
      {/* Presets */}
      <div className="flex items-center gap-1.5 mb-3">
        <Text size="2xs" tone="ghost" weight="medium" className="shrink-0">
          Presets:
        </Text>
        {PRESET_BUTTONS.map(({ preset, label, description }) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePreset(preset)}
            title={description}
            className="px-2 py-0.5 text-2xs rounded-md bg-vsc-code-bg hover:bg-vsc-list-hover
                       transition-colors duration-fast cursor-pointer text-vsc-text-secondary font-medium focus-ring"
            data-testid={`preset-${preset}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category rows */}
      <div className="space-y-1 mb-4">
        {CATEGORY_SETTINGS.map(({ category, label, description, icon }) => {
          const currentPermission = getPermission(category);
          return (
            <div
              key={category}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-vsc-code-bg/50 transition-colors duration-fast"
            >
              <Icon
                name={icon}
                tokenSize="sm"
                className={cn(
                  "shrink-0",
                  category === "delete" ? "text-vsc-error" : "text-vsc-text-tertiary",
                )}
              />
              <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <Text size="xs" weight="medium">
                  {label}
                </Text>
                <Text size="2xs" tone="tertiary">
                  {description}
                </Text>
              </div>
              <SegmentedControl<CategoryPermission>
                options={PERMISSION_OPTIONS}
                value={currentPermission}
                onValueChange={(v) => handlePermissionChange(category, v)}
                size="sm"
              />
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-vsc-border pt-3">
        <button
          type="button"
          onClick={resetToDefaults}
          className="text-2xs text-vsc-link hover:underline cursor-pointer focus-ring bg-transparent border-none p-0"
          data-testid="reset-defaults"
        >
          Reset to defaults
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
