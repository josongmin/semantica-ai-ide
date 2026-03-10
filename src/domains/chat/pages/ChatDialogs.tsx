// Trigger registration side effects
import "./chatDialogEntries";

import React, { Suspense } from "react";
import { useAtom } from "jotai";

import { completionSettingsOpenAtom } from "~shared/lib";
import { ErrorBoundary } from "~shared/ui";

import { getAllDialogs } from "./dialogRegistry";

// CompletionSettingsDialog requires props (open, onClose) so it stays as a special case
const CompletionSettingsDialog = React.lazy(() =>
  import("~widgets/completion-settings-dialog").then((m) => ({
    default: m.CompletionSettingsDialog,
  })),
);

/** All dialog/modal ErrorBoundary-wrapped widgets rendered as PanelLayout children. */
export const ChatDialogs = React.memo(function ChatDialogs() {
  const [completionOpen, setCompletionOpen] = useAtom(completionSettingsOpenAtom);
  const dialogs = getAllDialogs();

  return (
    <Suspense fallback={null}>
      {dialogs.map((d) => (
        <ErrorBoundary key={d.id} fallback={null}>
          {d.render()}
        </ErrorBoundary>
      ))}

      {/* Special case: requires props */}
      <ErrorBoundary fallback={null}>
        <CompletionSettingsDialog open={completionOpen} onClose={() => setCompletionOpen(false)} />
      </ErrorBoundary>
    </Suspense>
  );
});
