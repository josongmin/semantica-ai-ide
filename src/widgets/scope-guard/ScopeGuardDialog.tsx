import React, { useCallback, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";

import { scopeGuardAdapterAtom } from "../../shared/lib/atoms";
import { scopeGuardDialogOpenAtom } from "../../shared/lib/atoms/uiAtoms";
import { Button, Dialog, Icon, Text } from "../../shared/ui";

interface PatternListProps {
  readonly label: string;
  readonly patterns: readonly string[];
  readonly onAdd: (pattern: string) => void;
  readonly onRemove: (index: number) => void;
}

const PatternList = React.memo(function PatternList({
  label,
  patterns,
  onAdd,
  onRemove,
}: PatternListProps) {
  const [input, setInput] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed) {
      onAdd(trimmed);
      setInput("");
    }
  }, [input, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  return (
    <div className="space-y-1.5">
      <Text size="xs" weight="medium">
        {label}
      </Text>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. src/**/*.ts"
          className="flex-1 px-2 py-1 text-xs bg-vsc-input border border-vsc-border rounded
                     text-vsc-fg placeholder:text-vsc-text-ghost outline-none focus:border-vsc-focus focus:ring-1 focus:ring-vsc-focus/30"
          aria-label={`Add ${label.toLowerCase()} pattern`}
        />
        <Button variant="ghost" size="sm" icon="add" onClick={handleAdd} aria-label="Add pattern">
          Add
        </Button>
      </div>
      {patterns.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {patterns.map((pattern, i) => (
            <span
              key={pattern}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vsc-surface-1 border border-vsc-border text-xs"
            >
              <code className="text-2xs">{pattern}</code>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-vsc-error/20 text-vsc-text-tertiary hover:text-vsc-error transition-colors duration-fast cursor-pointer bg-transparent border-none p-0 focus-ring"
                aria-label={`Remove pattern ${pattern}`}
              >
                <Icon name="close" tokenSize="2xs" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export const ScopeGuardDialog = React.memo(function ScopeGuardDialog() {
  const [open, setOpen] = useAtom(scopeGuardDialogOpenAtom);
  const scopeGuard = useAtomValue(scopeGuardAdapterAtom);
  const currentIncludes = useMemo(() => scopeGuard?.includes ?? [], [scopeGuard?.includes]);
  const currentExcludes = useMemo(() => scopeGuard?.excludes ?? [], [scopeGuard?.excludes]);

  const [includes, setIncludes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<string[]>([]);

  // Sync local state when dialog opens
  const handleOpen = useCallback(() => {
    setIncludes([...currentIncludes]);
    setExcludes([...currentExcludes]);
  }, [currentIncludes, currentExcludes]);

  // Re-sync when dialog opens
  React.useEffect(() => {
    if (open) handleOpen();
  }, [open, handleOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const addInclude = useCallback((pattern: string) => {
    setIncludes((prev) => [...prev, pattern]);
  }, []);

  const removeInclude = useCallback((index: number) => {
    setIncludes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addExclude = useCallback((pattern: string) => {
    setExcludes((prev) => [...prev, pattern]);
  }, []);

  const removeExclude = useCallback((index: number) => {
    setExcludes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    scopeGuard?.setScopeGuard({ includes, excludes });
    setOpen(false);
  }, [includes, excludes, setOpen, scopeGuard]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Scope Guard"
      description="Restrict which files and folders the agent can modify."
      className="max-w-lg"
    >
      <div className="space-y-4" data-testid="scope-guard-dialog">
        <PatternList
          label="Include Patterns"
          patterns={includes}
          onAdd={addInclude}
          onRemove={removeInclude}
        />

        <PatternList
          label="Exclude Patterns"
          patterns={excludes}
          onAdd={addExclude}
          onRemove={removeExclude}
        />

        {/* Preview */}
        {(includes.length > 0 || excludes.length > 0) && (
          <div className="rounded-md bg-vsc-surface-1 border border-vsc-border p-2">
            <Text size="2xs" tone="tertiary" weight="medium" className="mb-1">
              Preview
            </Text>
            {includes.length > 0 && (
              <div className="flex items-center gap-1 text-2xs text-vsc-success">
                <Icon name="check" tokenSize="2xs" />
                Allowed: {includes.join(", ")}
              </div>
            )}
            {excludes.length > 0 && (
              <div className="flex items-center gap-1 text-2xs text-vsc-error">
                <Icon name="close" tokenSize="2xs" />
                Blocked: {excludes.join(", ")}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-vsc-border">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
