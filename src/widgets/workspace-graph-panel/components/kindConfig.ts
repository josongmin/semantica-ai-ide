import { getVscodeColor } from "../../../shared/lib/vscodeTheme";
import type { GraphNodeKind } from "../../../shared/protocol";

// ─── Kind Config ──────────────────────────────────────────────

export const KIND_CONFIG: Record<
  GraphNodeKind,
  { cssVar: string; fallback: string; label: string; icon: string }
> = {
  file: { cssVar: "--vscode-charts-blue", fallback: "#7aa2f7", label: "File", icon: "file" },
  class: { cssVar: "--vscode-charts-yellow", fallback: "#e0af68", label: "Class", icon: "symbol-class" },
  function: { cssVar: "--vscode-charts-green", fallback: "#9ece6a", label: "Function", icon: "symbol-method" },
  interface: { cssVar: "--vscode-charts-purple", fallback: "#bb9af7", label: "Interface", icon: "symbol-interface" },
  module: { cssVar: "--vscode-charts-blue", fallback: "#7dcfff", label: "Module", icon: "package" },
  variable: { cssVar: "--vscode-charts-red", fallback: "#f7768e", label: "Variable", icon: "symbol-variable" },
};

export function getKindColor(kind: GraphNodeKind): string {
  const cfg = KIND_CONFIG[kind];
  return getVscodeColor(cfg.cssVar, cfg.fallback);
}
