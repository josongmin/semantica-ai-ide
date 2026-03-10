// Trigger registration side effects
import "./featureSheets";

import React, { Suspense, useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeFeatureSheetAtom,
  toggleFeatureSheetAtom,
} from "~shared/lib";
import { ErrorBoundary, FeaturePanel } from "~shared/ui";

import { getAllFeatureSheets } from "./featureSheetRegistry";

/**
 * Renders the active feature panel inside a centered modal overlay.
 * Only one panel is open at a time (mutex via activeFeatureSheetAtom).
 * Panel content is rendered on-demand (not eagerly) to reduce initial bundle cost.
 */
export const FeatureSheetHost = React.memo(function FeatureSheetHost() {
  const activeSheet = useAtomValue(activeFeatureSheetAtom);
  const toggleSheet = useSetAtom(toggleFeatureSheetAtom);
  const sheets = useMemo(() => getAllFeatureSheets(), []);

  const handleClose = useCallback(() => {
    toggleSheet(null);
  }, [toggleSheet]);

  return (
    <>
      {sheets.map((sheet) => {
        const isOpen = activeSheet === sheet.id;
        return (
          <FeaturePanel
            key={sheet.id}
            open={isOpen}
            onClose={handleClose}
            title={sheet.title}
            icon={sheet.icon}
          >
            <ErrorBoundary fallback={null}>
              <Suspense fallback={null}>{isOpen && sheet.render()}</Suspense>
            </ErrorBoundary>
          </FeaturePanel>
        );
      })}
    </>
  );
});
