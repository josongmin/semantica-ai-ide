
import { Icon } from "~shared/ui";

// ─── Shared Sub-components ──────────────────────────────

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-vsc-text-ghost select-none">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-vsc-accent/5" />
        <Icon name="checklist" size={32} className="relative opacity-20" />
      </div>
      <p className="text-sm text-vsc-text-tertiary">No tasks match your filters</p>
      <p className="text-xs text-vsc-text-ghost">Try adjusting your search or filter criteria</p>
    </div>
  );
}
