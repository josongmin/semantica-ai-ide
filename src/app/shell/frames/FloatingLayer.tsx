/**
 * FloatingLayer — Floating Window Orchestration
 *
 * Renders all visible floating windows and the minimized dock.
 * Mounted at the top of the z-stack in ShellLayout.
 * Each window renders its view component via the registry.
 */

import React, { Suspense } from "react";
import { useAtomValue } from "jotai";

import { Spinner } from "~shared/ui";

import {
  hasFloatingWindowsAtom,
  minimizedFloatingWindowsAtom,
  visibleFloatingWindowsAtom,
} from "../model/floatingAtoms";
import { getViewById } from "../model/viewRegistry";
import { FloatingDock } from "./FloatingDock";
import { FloatingFrame } from "./FloatingFrame";

// ─── Component ───────────────────────────────────────────

export const FloatingLayer = React.memo(function FloatingLayer() {
  const visible = useAtomValue(visibleFloatingWindowsAtom);
  const minimized = useAtomValue(minimizedFloatingWindowsAtom);
  const hasAny = useAtomValue(hasFloatingWindowsAtom);

  if (!hasAny) return null;

  return (
    <div
      className="fixed inset-0 z-(--z-floating) pointer-events-none"
      aria-label="Floating windows"
    >
      {/* Visible floating windows — re-enable pointer events per window */}
      {visible.map((win, index) => {
        const view = getViewById(win.viewId);
        if (!view) return null;

        const Comp = view.component;
        return (
          <div
            key={win.viewId}
            className="si-stagger-item"
            style={{ "--si-delay": `${index * 60}ms` } as React.CSSProperties}
          >
            <FloatingFrame state={win} panel={view}>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full w-full">
                    <Spinner size="sm" />
                  </div>
                }
              >
                <Comp />
              </Suspense>
            </FloatingFrame>
          </div>
        );
      })}

      {/* Minimized dock */}
      {minimized.length > 0 && <FloatingDock />}
    </div>
  );
});
