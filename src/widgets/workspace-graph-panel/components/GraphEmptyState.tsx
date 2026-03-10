import { EmptyState } from "../../../shared/ui";

// ─── Empty / Loading State ────────────────────────────────────

export function GraphEmptyState() {
  return (
    <EmptyState
      icon="graph-line"
      title="Building..."
      description="Symbol dependencies from LSP"
      className="py-12"
    />
  );
}
