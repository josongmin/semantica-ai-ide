import { getVscodeColor } from "../../../shared/lib/vscodeTheme";
import type { GraphNodeKind } from "../../../shared/protocol";

// ─── Kind Config ──────────────────────────────────────────────

export const KIND_CONFIG: Record<
  GraphNodeKind,
  { cssVar: string; fallback: string; label: string; icon: string }
> = {
  file: { cssVar: "--color-chart-blue", fallback: "#7aa2f7", label: "File", icon: "file" },
  class: {
    cssVar: "--color-chart-yellow",
    fallback: "#e0af68",
    label: "Class",
    icon: "symbol-class",
  },
  function: {
    cssVar: "--color-chart-green",
    fallback: "#9ece6a",
    label: "Function",
    icon: "symbol-method",
  },
  interface: {
    cssVar: "--color-chart-purple",
    fallback: "#bb9af7",
    label: "Interface",
    icon: "symbol-interface",
  },
  module: { cssVar: "--color-chart-blue", fallback: "#7dcfff", label: "Module", icon: "package" },
  variable: {
    cssVar: "--color-chart-red",
    fallback: "#f7768e",
    label: "Variable",
    icon: "symbol-variable",
  },
};

export function getKindColor(kind: GraphNodeKind): string {
  const cfg = KIND_CONFIG[kind];
  return getVscodeColor(cfg.cssVar, cfg.fallback);
}
