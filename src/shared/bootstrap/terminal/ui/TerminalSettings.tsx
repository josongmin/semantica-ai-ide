/**
 * TerminalSettings — RFC-TERMINAL-014 §5
 *
 * Terminal configuration UI for the settings page.
 * User-configurable options per RFC-014 settings spec.
 * Persists to localStorage with auto-load on mount.
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

// ─── Settings Schema (RFC-014 §5.1) ───────────────────────

export interface TerminalSettingsValues {
  defaultShell: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: "bar" | "block" | "underline";
  cursorBlink: boolean;
  scrollback: number;
  defaultMode: "classic" | "hybrid" | "semantic";
  overlayEnabled: boolean;
  commandBlockCollapsed: boolean;
  copyOnSelect: boolean;
  rightClickPaste: boolean;
  bellSound: boolean;
}

const DEFAULT_SETTINGS: TerminalSettingsValues = {
  defaultShell: "auto",
  fontSize: 13,
  lineHeight: 1.2,
  cursorStyle: "bar",
  cursorBlink: true,
  scrollback: 5000,
  defaultMode: "hybrid",
  overlayEnabled: true,
  commandBlockCollapsed: false,
  copyOnSelect: false,
  rightClickPaste: false,
  bellSound: false,
};

const STORAGE_KEY = "semantica:terminal-settings";

function loadSettings(): TerminalSettingsValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw)
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<TerminalSettingsValues>) };
  } catch {
    /* ignore corrupted data */
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: TerminalSettingsValues): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* localStorage may be full or unavailable */
  }
}

// ─── Component ─────────────────────────────────────────────

export const TerminalSettings = memo(function TerminalSettings() {
  const [settings, setSettings] = useState<TerminalSettingsValues>(loadSettings);

  // Debounced persist — avoid thrashing localStorage on rapid changes (e.g. number input)
  const saveTimerRef = useRef(0);
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => saveSettings(settings), 300);
    return () => clearTimeout(saveTimerRef.current);
  }, [settings]);

  const update = useCallback(
    <K extends keyof TerminalSettingsValues>(key: K, value: TerminalSettingsValues[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <div className="flex flex-col gap-6 p-4 max-w-[600px]">
      {/* Section: Appearance */}
      <SettingsSection title="Appearance" icon="paintcan">
        <SettingsRow label="Font Size" description="Terminal font size in pixels">
          <NumberInput
            value={settings.fontSize}
            min={8}
            max={24}
            onChange={(v) => update("fontSize", v)}
            aria-label="Terminal font size"
          />
        </SettingsRow>
        <SettingsRow label="Line Height" description="Terminal line height multiplier">
          <NumberInput
            value={settings.lineHeight}
            min={1.0}
            max={2.0}
            step={0.05}
            onChange={(v) => update("lineHeight", v)}
            aria-label="Terminal line height"
          />
        </SettingsRow>
        <SettingsRow label="Cursor Style">
          <SelectInput
            value={settings.cursorStyle}
            options={[
              { value: "bar", label: "Bar" },
              { value: "block", label: "Block" },
              { value: "underline", label: "Underline" },
            ]}
            onChange={(v) => update("cursorStyle", v as TerminalSettingsValues["cursorStyle"])}
            aria-label="Cursor style"
          />
        </SettingsRow>
        <SettingsRow label="Cursor Blink">
          <ToggleSwitch
            checked={settings.cursorBlink}
            onChange={(v) => update("cursorBlink", v)}
            aria-label="Cursor blink"
          />
        </SettingsRow>
      </SettingsSection>

      {/* Section: Behavior */}
      <SettingsSection title="Behavior" icon="gear">
        <SettingsRow label="Default Shell" description="Shell to use for new sessions">
          <SelectInput
            value={settings.defaultShell}
            options={[
              { value: "auto", label: "Auto-detect" },
              { value: "zsh", label: "zsh" },
              { value: "bash", label: "bash" },
              { value: "pwsh", label: "PowerShell" },
              { value: "fish", label: "fish" },
            ]}
            onChange={(v) => update("defaultShell", v)}
            aria-label="Default shell"
          />
        </SettingsRow>
        <SettingsRow label="Scrollback" description="Maximum scrollback buffer lines">
          <NumberInput
            value={settings.scrollback}
            min={1000}
            max={100000}
            step={1000}
            onChange={(v) => update("scrollback", v)}
            aria-label="Scrollback lines"
          />
        </SettingsRow>
        <SettingsRow label="Copy on Select">
          <ToggleSwitch
            checked={settings.copyOnSelect}
            onChange={(v) => update("copyOnSelect", v)}
            aria-label="Copy on select"
          />
        </SettingsRow>
        <SettingsRow label="Bell Sound">
          <ToggleSwitch
            checked={settings.bellSound}
            onChange={(v) => update("bellSound", v)}
            aria-label="Bell sound"
          />
        </SettingsRow>
      </SettingsSection>

      {/* Section: Semantic Features */}
      <SettingsSection title="Semantic Features" icon="layers">
        <SettingsRow label="Default Mode" description="Terminal rendering mode for new sessions">
          <SelectInput
            value={settings.defaultMode}
            options={[
              { value: "classic", label: "Classic (raw terminal only)" },
              { value: "hybrid", label: "Hybrid (default — overlay on raw)" },
              { value: "semantic", label: "Semantic (full structured UI)" },
            ]}
            onChange={(v) => update("defaultMode", v as TerminalSettingsValues["defaultMode"])}
            aria-label="Default terminal mode"
          />
        </SettingsRow>
        <SettingsRow label="Overlay Enabled" description="Show semantic overlay on top of terminal">
          <ToggleSwitch
            checked={settings.overlayEnabled}
            onChange={(v) => update("overlayEnabled", v)}
            aria-label="Overlay enabled"
          />
        </SettingsRow>
        <SettingsRow label="Auto-collapse Succeeded Blocks">
          <ToggleSwitch
            checked={settings.commandBlockCollapsed}
            onChange={(v) => update("commandBlockCollapsed", v)}
            aria-label="Auto-collapse succeeded blocks"
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
});

// ─── Sub-components ────────────────────────────────────────

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-semibold text-vsc-fg mb-3">
        <Icon name={icon} size={14} className="text-vsc-accent" />
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 px-2 rounded hover:bg-vsc-surface-1/50 transition-colors duration-fast">
      <div className="flex-1 min-w-0">
        <div className="text-2xs text-vsc-fg">{label}</div>
        {description && <div className="text-3xs text-vsc-text-ghost mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  min,
  max,
  step = 1,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  "aria-label"?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = Number(e.target.value);
        onChange(Math.min(max, Math.max(min, v)));
      }}
      aria-label={ariaLabel}
      className={cn(
        "w-20 px-2 py-1 rounded text-2xs font-mono text-center",
        "bg-vsc-surface-1 border border-vsc-border/30",
        "text-vsc-fg outline-none",
        "focus:border-vsc-accent transition-colors duration-fast",
      )}
    />
  );
}

function SelectInput({
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  "aria-label"?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(
        "px-2 py-1 rounded text-2xs",
        "bg-vsc-surface-1 border border-vsc-border/30",
        "text-vsc-fg outline-none",
        "focus:border-vsc-accent transition-colors duration-fast",
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full",
        "transition-colors duration-fast",
        checked ? "bg-vsc-accent" : "bg-vsc-surface-2",
      )}
      onClick={() => onChange(!checked)}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm",
          "transition-transform duration-fast",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}
