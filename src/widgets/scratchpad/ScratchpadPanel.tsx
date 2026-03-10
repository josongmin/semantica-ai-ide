import React, { useCallback, useMemo, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
  activeNotepadAtom,
  activeNotepadIdAtom,
  deleteNotepadAtom,
  notepadListAtom,
  upsertNotepadAtom,
} from "../../features/scratchpad";
import { getVscodeApi } from "../../shared/lib";
import type { Notepad } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

// ─── Notepad Tab ─────────────────────────────────────────────
interface NotepadTabProps {
  notepad: Notepad;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotepadTab = React.memo(function NotepadTab({
  notepad,
  isActive,
  onSelect,
  onDelete,
}: NotepadTabProps) {
  const handleSelect = useCallback(() => {
    onSelect(notepad.id);
  }, [notepad.id, onSelect]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(notepad.id);
    },
    [notepad.id, onDelete],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(notepad.id);
      }
    },
    [notepad.id, onSelect],
  );

  return (
    <div
      className={cn(
        "group inline-flex items-center gap-1 px-2 py-1 rounded-t-md cursor-pointer",
        "transition-colors duration-fast",
        isActive
          ? "bg-vsc-tab-active border border-b-0 border-vsc-tab-border text-vsc-fg"
          : "bg-transparent text-vsc-text-tertiary hover:bg-vsc-toolbar hover:text-vsc-text-secondary",
      )}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      aria-label={notepad.title}
      data-testid={`notepad-tab-${notepad.id}`}
    >
      <Icon name="note" tokenSize="2xs" className="shrink-0 text-inherit" />
      <Text
        size="2xs"
        weight={isActive ? "medium" : "normal"}
        truncate
        className="max-w-[100px] text-inherit"
      >
        {notepad.title}
      </Text>
      <button
        type="button"
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-fast ml-0.5 rounded text-vsc-text-tertiary hover:bg-vsc-error/20 hover:text-vsc-error focus-ring"
        aria-label={`Delete ${notepad.title}`}
        tabIndex={-1}
      >
        <Icon name="close" tokenSize="2xs" className="text-inherit" />
      </button>
    </div>
  );
});

/**
 * ScratchpadPanel: Multiple named notepads with simple text editing.
 * Provides tabs for switching between notepads and @Notepads mention support
 * through the data layer.
 */
export const ScratchpadPanel = React.memo(function ScratchpadPanel() {
  const notepadList = useAtomValue(notepadListAtom);
  const activeNotepad = useAtomValue(activeNotepadAtom);
  const [activeId, setActiveId] = useAtom(activeNotepadIdAtom);
  const upsertNotepad = useSetAtom(upsertNotepadAtom);
  const deleteNotepad = useSetAtom(deleteNotepadAtom);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Select first notepad if none selected
  const effectiveActiveId = activeId ?? (notepadList.length > 0 ? (notepadList[0]?.id ?? null) : null);

  const handleSelectTab = useCallback(
    (id: string) => {
      setActiveId(id);
    },
    [setActiveId],
  );

  const handleCreateNotepad = useCallback(() => {
    const id = `np_${Date.now()}`;
    const newNotepad: Notepad = {
      id,
      title: "Untitled",
      content: "",
      updated_at_ms: Date.now(),
    };
    upsertNotepad(newNotepad);
    setActiveId(id);
    // Focus title input after creation
    requestAnimationFrame(() => titleInputRef.current?.select());
  }, [upsertNotepad, setActiveId]);

  const handleDeleteNotepad = useCallback(
    (id: string) => {
      deleteNotepad(id);
      getVscodeApi().postMessage({ type: "DELETE_NOTEPAD", notepad_id: id });
      // Switch to first remaining notepad
      const remaining = notepadList.filter((n) => n.id !== id);
      const firstRemaining = remaining[0];
      if (remaining.length > 0 && firstRemaining !== undefined) {
        setActiveId(firstRemaining.id);
      } else {
        setActiveId(null);
      }
    },
    [deleteNotepad, notepadList, setActiveId],
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeNotepad) return;
      const updated: Notepad = {
        ...activeNotepad,
        title: e.target.value,
        updated_at_ms: Date.now(),
      };
      upsertNotepad(updated);
    },
    [activeNotepad, upsertNotepad],
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!activeNotepad) return;
      const updated: Notepad = {
        ...activeNotepad,
        content: e.target.value,
        updated_at_ms: Date.now(),
      };
      upsertNotepad(updated);
    },
    [activeNotepad, upsertNotepad],
  );

  const handleSave = useCallback(() => {
    if (!activeNotepad) return;
    getVscodeApi().postMessage({
      type: "SAVE_NOTEPAD",
      notepad_id: activeNotepad.id,
      title: activeNotepad.title,
      content: activeNotepad.content,
    });
  }, [activeNotepad]);

  // Use activeNotepad if we derived an effective active ID
  const displayedNotepad = useMemo(() => {
    if (activeNotepad) return activeNotepad;
    if (effectiveActiveId) {
      return notepadList.find((n) => n.id === effectiveActiveId) ?? null;
    }
    return null;
  }, [activeNotepad, effectiveActiveId, notepadList]);

  return (
    <div className="flex flex-col h-full" data-testid="scratchpad-panel">
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-1 pt-1 border-b border-vsc-tab-border bg-vsc-surface-1 overflow-x-auto"
        role="tablist"
        aria-label="Notepads"
      >
        {notepadList.map((notepad) => (
          <NotepadTab
            key={notepad.id}
            notepad={notepad}
            isActive={notepad.id === (activeId ?? effectiveActiveId)}
            onSelect={handleSelectTab}
            onDelete={handleDeleteNotepad}
          />
        ))}
        <button
          type="button"
          onClick={handleCreateNotepad}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-md",
            "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring",
          )}
          aria-label="Create new notepad"
          data-testid="create-notepad-button"
        >
          <Icon name="add" tokenSize="2xs" className="text-inherit" />
        </button>
      </div>

      {/* Editor area */}
      {displayedNotepad ? (
        <div className="flex flex-col flex-1 gap-2 p-2">
          {/* Title input */}
          <input
            ref={titleInputRef}
            type="text"
            value={displayedNotepad.title}
            onChange={handleTitleChange}
            placeholder="Notepad title..."
            className={cn(
              "w-full px-2 py-1 text-sm font-medium rounded-md",
              "bg-transparent border border-transparent",
              "text-vsc-text-primary placeholder:text-vsc-text-tertiary",
              "focus:outline-none focus:border-vsc-focus focus:bg-vsc-input",
            )}
            aria-label="Notepad title"
            data-testid="notepad-title-input"
          />

          {/* Content textarea */}
          <textarea
            value={displayedNotepad.content}
            onChange={handleContentChange}
            placeholder="Write your notes here... Reference this notepad with @Notepads"
            className={cn(
              "flex-1 w-full px-2 py-1.5 text-xs rounded-md resize-none",
              "bg-vsc-input border border-vsc-border",
              "text-vsc-text-primary placeholder:text-vsc-text-tertiary",
              "focus:outline-none focus:border-vsc-focus focus:ring-1 focus:ring-vsc-focus/30",
              "font-mono",
            )}
            aria-label="Notepad content"
            data-testid="notepad-content-textarea"
          />

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <Text size="2xs" tone="ghost">
              Last updated: {new Date(displayedNotepad.updated_at_ms).toLocaleTimeString()}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="text-vsc-text-secondary hover:text-vsc-fg"
            >
              <Icon name="save" tokenSize="2xs" className="mr-1 text-inherit" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8">
          <Icon name="note" tokenSize="sm" className="text-vsc-text-tertiary" />
          <Text size="xs" tone="tertiary">
            No notepads yet
          </Text>
          <Button variant="ghost" size="sm" onClick={handleCreateNotepad}>
            <Icon name="add" tokenSize="2xs" className="mr-1" />
            Create Notepad
          </Button>
        </div>
      )}
    </div>
  );
});
