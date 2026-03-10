import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { speculativeEditFamily } from "../../features/speculative-edit";
import { getVscodeApi } from "../../shared/lib";
import type { SpeculativeEdit, TurnId } from "../../shared/protocol";
import { Badge, cn, Icon, Spinner, Text } from "../../shared/ui";

function EditCard({ edit }: { edit: SpeculativeEdit }) {
  const handleAccept = useCallback(() => {
    getVscodeApi().postMessage({ type: "ACCEPT_SPECULATIVE_EDIT", edit_id: edit.id });
  }, [edit.id]);

  const handleReject = useCallback(() => {
    getVscodeApi().postMessage({ type: "REJECT_SPECULATIVE_EDIT", edit_id: edit.id });
  }, [edit.id]);

  const fileName = edit.file_path.split("/").pop() ?? edit.file_path;

  return (
    <div className="rounded border border-vsc-border/30 bg-vsc-bg-secondary/30 p-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name="file-code" tokenSize="2xs" className="text-vsc-text-tertiary" />
        <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">
          {fileName}
          <Text as="span" size="2xs" tone="ghost">
            :{edit.line_start}-{edit.line_end}
          </Text>
        </Text>
        <Badge
          variant={(() => { if (edit.risk_level === "dangerous") return "error" as const; if (edit.risk_level === "moderate") return "warning" as const; return "success" as const; })()}
          text={`${Math.round(edit.confidence * 100)}%`}
        />
      </div>

      <div className="text-2xs font-mono leading-tight">
        <div className="text-vsc-error/70 line-through truncate min-w-0">
          {edit.original_text.slice(0, 80)}
        </div>
        <div className="text-vsc-success/70 truncate min-w-0">
          {edit.proposed_text.slice(0, 80)}
        </div>
      </div>

      {edit.status === "pending" && (
        <div className="flex items-center gap-1 mt-1 justify-end">
          <button
            type="button"
            onClick={handleAccept}
            className="px-1.5 py-0.5 rounded text-2xs bg-vsc-success/10 text-vsc-success hover:bg-vsc-success/20 transition-colors duration-fast cursor-pointer focus-ring"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="px-1.5 py-0.5 rounded text-2xs bg-vsc-error/10 text-vsc-error hover:bg-vsc-error/20 transition-colors duration-fast cursor-pointer focus-ring"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

interface SpeculativePreviewProps {
  turnId: TurnId;
}

export const SpeculativePreview = React.memo(function SpeculativePreview({
  turnId,
}: SpeculativePreviewProps) {
  const state = useAtomValue(speculativeEditFamily(turnId));

  if (state.status === "idle" && state.edits.length === 0) return null;

  const pendingCount = state.edits.filter((e) => e.status === "pending").length;

  return (
    <div
      className={cn("mx-4 my-2 px-3 py-2.5 rounded-lg border border-vsc-border/40 bg-vsc-surface-1/50")}
      data-testid="speculative-preview"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="wand" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">
          Speculative Edits
        </Text>
        {state.status === "predicting" && <Spinner size="sm" className="ml-auto" />}
        {pendingCount > 0 && (
          <Badge variant="warning" text={`${pendingCount} pending`} className="ml-auto" />
        )}
      </div>

      <div className="pl-5 space-y-1.5">
        {state.edits.map((edit) => (
          <EditCard key={edit.id} edit={edit} />
        ))}
      </div>
    </div>
  );
});
