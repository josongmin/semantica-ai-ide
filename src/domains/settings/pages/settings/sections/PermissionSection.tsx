import React, { useCallback } from "react";

import {
  CATEGORY_SETTINGS,
  type CategoryPermission,
  type PermissionPreset,
  usePermissionSettings,
} from "~features/permission-settings";
import type { ToolCategory } from "~shared/protocol";
import { Button, cn, Icon, SegmentedControl, type SegmentedOption, Text } from "~shared/ui";

const PERMISSION_OPTIONS: readonly SegmentedOption<CategoryPermission>[] = [
  { value: "auto", label: "Auto" },
  { value: "ask", label: "Ask" },
  { value: "block", label: "Block" },
];

const PRESET_BUTTONS: readonly {
  preset: PermissionPreset;
  label: string;
  description: string;
}[] = [
  { preset: "conservative", label: "Conservative", description: "Ask for everything" },
  { preset: "balanced", label: "Balanced", description: "Auto read, ask write" },
  { preset: "turbo", label: "Turbo", description: "Auto most, ask delete" },
];

export const PermissionSection = React.memo(function PermissionSection() {
  const { getPermission, setPermission, applyPreset, resetToDefaults, apply } =
    usePermissionSettings();

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
    <div className="px-6 py-6 space-y-4">
      <div>
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Configure auto-approval rules per tool category
        </Text>
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Presets
        </Text>
        <div className="flex flex-wrap gap-2">
          {PRESET_BUTTONS.map(({ preset, label, description }) => (
            <Button
              key={preset}
              variant="ghost"
              size="sm"
              onClick={() => handlePreset(preset)}
              title={description}
              className="text-2xs rounded-lg border border-vsc-border bg-vsc-surface-1
                         hover:bg-vsc-list-hover text-vsc-text-secondary transition-colors duration-fast"
              data-testid={`preset-${preset}`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category rows */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Tool categories
        </Text>
        <div className="space-y-1">
          {CATEGORY_SETTINGS.map(({ category, label, description, icon }) => {
            const currentPermission = getPermission(category);
            return (
              <div
                key={category}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-vsc-code-bg/50 transition-colors duration-fast"
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
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-vsc-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          className="text-2xs text-vsc-link hover:underline p-0"
          data-testid="reset-defaults"
        >
          Reset to defaults
        </Button>
        <Button variant="primary" size="sm" onClick={apply} data-testid="apply-permissions">
          Apply
        </Button>
      </div>
    </div>
  );
});
