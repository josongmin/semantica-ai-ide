/**
 * useSystemLensActions — RFC-SYSTEM-LENS-001 §12
 *
 * Cross-feature orchestration hook.
 * Routes LensHoverCard action buttons to the appropriate feature:
 *   [Graph]    → openMiniGraph (system-lens internal)
 *   [Dataflow] → openDataflow (dataflow-lens)
 *   [Impact]   → analyzeImpact (impact-radar) + open bottom panel
 *   [Explain]  → openSelfExplain (self-explain) + open bottom panel
 */

import { useCallback, useMemo } from "react";
import { useSetAtom } from "jotai";

import { dispatchIntentAtom } from "../../../app/shell/model/intentRouter";
import { analyzeImpactAtom } from "../../impact-radar";
import { openSelfExplainAtom } from "../../self-explain";
import { openMiniGraphAtom } from "../model/atoms";

type LensAction = "graph" | "dataflow" | "impact" | "explain";

interface LensActionContext {
  readonly symbolId: string;
  readonly symbolName: string;
  readonly filePath: string;
  readonly line: number;
}

export function useSystemLensActions() {
  const openMiniGraph = useSetAtom(openMiniGraphAtom);
  const analyzeImpact = useSetAtom(analyzeImpactAtom);
  const openSelfExplain = useSetAtom(openSelfExplainAtom);
  const dispatchIntent = useSetAtom(dispatchIntentAtom);

  const dispatch = useCallback(
    (action: LensAction, ctx: LensActionContext) => {
      switch (action) {
        case "graph":
          openMiniGraph(ctx.symbolId);
          break;

        case "dataflow":
          // Dataflow lens opens as overlay — dynamic import to keep independent
          void (async () => {
            try {
              const { openDataflowAtom } = await import("../../dataflow-lens/model/atoms");
              const { getDefaultStore } = await import("jotai");
              void getDefaultStore().set(openDataflowAtom, {
                symbolId: ctx.symbolId,
                filePath: ctx.filePath,
                line: ctx.line,
              });
            } catch {
              // dataflow-lens not available yet — silent fail
            }
          })();
          break;

        case "impact":
          void analyzeImpact({
            filePath: ctx.filePath,
            line: ctx.line,
            symbolName: ctx.symbolName,
            changeType: "edit",
          });
          dispatchIntent({ action: "show-view", viewId: "impact-radar" });
          break;

        case "explain":
          openSelfExplain({
            symbolId: ctx.symbolId,
            filePath: ctx.filePath,
            line: ctx.line,
          });
          dispatchIntent({ action: "show-view", viewId: "self-explain" });
          break;
      }
    },
    [openMiniGraph, analyzeImpact, openSelfExplain, dispatchIntent],
  );

  return useMemo(() => ({ dispatch }), [dispatch]);
}
