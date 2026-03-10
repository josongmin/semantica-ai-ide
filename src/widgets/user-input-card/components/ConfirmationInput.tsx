import React, { memo, useEffect } from "react";

import { Button } from "../../../shared/ui";

// ─── Confirmation input (Yes / No) ─────────────────────────
export const ConfirmationInput = memo(function ConfirmationInput({
  onSubmit,
  onKeyActionRef,
}: {
  onSubmit: (answer: string) => void;
  onKeyActionRef: React.MutableRefObject<((key: string) => boolean) | null>;
}) {
  useEffect(() => {
    onKeyActionRef.current = (key: string) => {
      if (key === "y" || key === "1") { onSubmit("yes"); return true; }
      if (key === "n" || key === "2") { onSubmit("no"); return true; }
      return false;
    };
    return () => { onKeyActionRef.current = null; };
  }, [onSubmit, onKeyActionRef]);

  return (
    <div className="flex gap-2">
      <Button variant="primary" size="sm" icon="check" onClick={() => onSubmit("yes")}>
        Yes
        <kbd className="ml-1 text-2xs opacity-50 font-mono">Y</kbd>
      </Button>
      <Button variant="ghost" size="sm" icon="close" onClick={() => onSubmit("no")}>
        No
        <kbd className="ml-1 text-2xs opacity-50 font-mono">N</kbd>
      </Button>
    </div>
  );
});
