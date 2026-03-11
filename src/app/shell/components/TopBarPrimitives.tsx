
import { cn, Icon } from "~shared/ui";

// ─── Shared primitives for the top bar ──────────────────

export function Separator() {
  return <span className="w-px h-3 mx-1" style={{ backgroundColor: "var(--color-gnb-border)" }} />;
}

export function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-md",
        "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
        "text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
      )}
      title={label}
      aria-label={label}
    >
      <Icon name={icon} tokenSize="xs" />
    </button>
  );
}
