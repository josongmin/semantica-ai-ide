import React from "react";
import { useAtomValue } from "jotai";

import { watchActiveAtom, watchPatternsAtom, watchTriggersAtom } from "../../features/file-watch";
import { watchModePanelVisibleAtom } from "../../shared/lib/atoms/bottomSheetAtoms";
import { Badge, Collapsible } from "../../shared/ui";

export const WatchModePanel = React.memo(function WatchModePanel() {
  const visible = useAtomValue(watchModePanelVisibleAtom);
  const active = useAtomValue(watchActiveAtom);
  const patterns = useAtomValue(watchPatternsAtom);
  const triggers = useAtomValue(watchTriggersAtom);

  if (!visible) return null;

  return (
    <Collapsible title="Watch Mode" icon="eye" badge={active ? "Active" : "Off"}>
      <div className="px-3 py-2 space-y-2">
        {/* Patterns */}
        <div className="text-2xs text-vsc-text-secondary">
          <span className="font-medium">Patterns:</span>
          {patterns.length === 0 ? (
            <span className="ml-1 text-vsc-text-ghost">None configured</span>
          ) : (
            <div className="flex flex-wrap gap-1 mt-1">
              {patterns.map((p) => (
                <Badge key={p} text={p} variant="default" />
              ))}
            </div>
          )}
        </div>

        {/* Recent triggers */}
        {triggers.length > 0 && (
          <div className="text-2xs">
            <span className="font-medium text-vsc-text-secondary">Recent triggers:</span>
            <div className="mt-1 flex flex-col gap-1">
              {triggers.slice(-5).map((t) => (
                <div key={`${t.timestamp}-${t.filePath}`} className="flex items-center gap-1.5">
                  <span className="text-vsc-text-ghost tabular-nums">{t.timestamp}</span>
                  <span className="text-vsc-text-secondary truncate min-w-0">{t.filePath}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
});
