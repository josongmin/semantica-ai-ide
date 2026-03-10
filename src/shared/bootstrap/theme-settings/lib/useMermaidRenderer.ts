import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import { LIGHT_THEME_IDS, type ThemeId,themeIdAtom } from "~shared/lib/theme";
import { detectVscodeTheme, getVscodeColor } from "~shared/lib/vscodeTheme";

// ─── Types ────────────────────────────────────────────────

export type MermaidRenderState =
  | { status: "loading" }
  | { status: "success"; svgHtml: string }
  | { status: "error"; error: string };

// ─── Module-level lazy loader ─────────────────────────────

interface MermaidModule {
  default: {
    initialize: (config: Record<string, unknown>) => void;
    render: (id: string, source: string) => Promise<{ svg: string }>;
  };
}

let mermaidPromise: Promise<MermaidModule["default"]> | null = null;

/** Read live CSS variable colors and build mermaid themeVariables */
function buildThemeVariables(isDark: boolean): Record<string, string> {
  const d = isDark;
  const bg = getVscodeColor("--vscode-editor-background", d ? "#1a1b26" : "#ffffff");
  const fg = getVscodeColor("--vscode-editor-foreground", d ? "#a9b1d6" : "#1e1e1e");
  const border = getVscodeColor("--vscode-panel-border", d ? "#3b4261" : "#d4d4d4");
  const surface = getVscodeColor("--vscode-sideBar-background", d ? "#1f2335" : "#f3f3f3");

  // Monotone palette — all nodes use surface/border/fg, no accent colors
  return {
    primaryColor: surface,
    primaryTextColor: fg,
    primaryBorderColor: border,
    secondaryColor: surface,
    secondaryTextColor: fg,
    secondaryBorderColor: border,
    tertiaryColor: surface,
    tertiaryTextColor: fg,
    tertiaryBorderColor: border,
    lineColor: border,
    textColor: fg,
    mainBkg: surface,
    nodeBorder: border,
    clusterBkg: bg,
    clusterBorder: border,
    titleColor: fg,
    edgeLabelBackground: bg,
    nodeTextColor: fg,
    actorBkg: surface,
    actorBorder: border,
    actorTextColor: fg,
    actorLineColor: border,
    signalColor: fg,
    signalTextColor: fg,
    labelBoxBkgColor: surface,
    labelBoxBorderColor: border,
    labelTextColor: fg,
    loopTextColor: fg,
    noteBkgColor: surface,
    noteBorderColor: border,
    noteTextColor: fg,
    activationBkgColor: surface,
    activationBorderColor: border,
    sequenceNumberColor: bg,
    sectionBkgColor: surface,
    altSectionBkgColor: bg,
    sectionBkgColor2: surface,
    taskBkgColor: surface,
    taskBorderColor: border,
    taskTextColor: fg,
    taskTextLightColor: fg,
    taskTextOutsideColor: fg,
    activeTaskBkgColor: surface,
    activeTaskBorderColor: border,
    doneTaskBkgColor: surface,
    doneTaskBorderColor: border,
    critBkgColor: surface,
    critBorderColor: border,
    todayLineColor: border,
    pie1: border,
    pie2: surface,
    pie3: bg,
    pie4: fg,
    pie5: border,
  };
}

function loadMermaid(theme: "dark" | "default"): Promise<MermaidModule["default"]> {
  mermaidPromise ??= import("mermaid").then((mod) => mod.default);
  const isDark = theme === "dark";
  const themeVariables = buildThemeVariables(isDark);

  return mermaidPromise.then((mermaid) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      themeVariables,
      securityLevel: "strict",
    });
    return mermaid;
  });
}

// ─── Theme detection helpers ──────────────────────────────

function resolveMermaidTheme(themeId: string): "dark" | "default" {
  if (themeId === "system" || themeId === "vscode-sync") {
    return detectVscodeTheme();
  }
  return LIGHT_THEME_IDS.has(themeId as ThemeId) ? "default" : "dark";
}

// ─── Hook ─────────────────────────────────────────────────

/**
 * Lazy-loads mermaid and renders a diagram source string into SVG.
 * Re-renders when the app theme changes so diagrams match the current palette.
 */
export function useMermaidRenderer(source: string, id: string): MermaidRenderState {
  const [state, setState] = useState<MermaidRenderState>({ status: "loading" });
  const abortRef = useRef(false);
  const themeId = useAtomValue(themeIdAtom);
  const mermaidTheme = resolveMermaidTheme(themeId);

  const [prevInputs, setPrevInputs] = useState({ source, id, mermaidTheme });

  // React-recommended pattern: adjust state during render when props change
  if (prevInputs.source !== source || prevInputs.id !== id || prevInputs.mermaidTheme !== mermaidTheme) {
    setPrevInputs({ source, id, mermaidTheme });
    setState({ status: "loading" });
  }

  useEffect(() => {
    abortRef.current = false;

    loadMermaid(mermaidTheme)
      .then((mermaid) => mermaid.render(id, source))
      .then(({ svg }) => {
        if (!abortRef.current) {
          setState({ status: "success", svgHtml: svg });
        }
      })
      .catch((err: unknown) => {
        if (!abortRef.current) {
          setState({
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });

    return () => {
      abortRef.current = true;
    };
  }, [source, id, mermaidTheme]);

  return state;
}
