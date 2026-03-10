import React, { useCallback, useRef, useState } from "react";
import { useSetAtom } from "jotai";

import { reorderMemoryRulesAtom } from "../../entities/memory-rule";
import { useProjectMemory } from "../../features/project-memory";
import type { MemoryRuleId } from "../../shared/protocol";
import { Button, EmptyState, Text } from "../../shared/ui";
import { MemoryRuleRow } from "./MemoryRuleRow";

export const MemoryPanel = React.memo(function MemoryPanel() {
  const {
    panelVisible,
    ruleIds,
    editingRuleId,
    setEditingRuleId,
    saveRule,
    deleteRule,
    toggleActive,
  } = useProjectMemory();
  const reorderRules = useSetAtom(reorderMemoryRulesAtom);

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((index: number) => {
    if (dragIndexRef.current == null || dragIndexRef.current === index) {
      setDropTargetIndex(null);
      return;
    }
    setDropTargetIndex(index);
  }, []);

  const handleDrop = useCallback(
    (index: number) => {
      const from = dragIndexRef.current;
      if (from == null || from === index) return;
      const next = [...ruleIds];
      const [moved] = next.splice(from, 1);
      if (moved === undefined) return;
      next.splice(index, 0, moved);
      reorderRules(next);
      dragIndexRef.current = null;
      setDropTargetIndex(null);
    },
    [ruleIds, reorderRules],
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDropTargetIndex(null);
  }, []);

  const handleNewRule = useCallback(() => {
    setEditingRuleId("new");
  }, [setEditingRuleId]);

  const handleSave = useCallback(
    (title: string, content: string) => {
      saveRule({ title, content, source: "custom" });
      setEditingRuleId(null);
    },
    [saveRule, setEditingRuleId],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingRuleId(null);
  }, [setEditingRuleId]);

  const handleEdit = useCallback(
    (ruleId: string) => {
      setEditingRuleId(ruleId as MemoryRuleId);
    },
    [setEditingRuleId],
  );

  if (!panelVisible) return null;

  return (
    <div
      className="border-t border-vsc-border bg-vsc-surface-1"
      role="region"
      aria-label="Memory panel"
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-vsc-border">
        <Text size="3xs" tone="secondary" className="font-medium tracking-wide">
          Project Memory
        </Text>
        <Button size="sm" variant="ghost" onClick={handleNewRule}>
          New Rule
        </Button>
      </div>

      {/* Inline form for new rule */}
      {editingRuleId === "new" && (
        <MemoryRuleRow
          id="__new__"
          onToggle={toggleActive}
          onDelete={deleteRule}
          isEditing
          onEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
        />
      )}

      {ruleIds.length === 0 && editingRuleId !== "new" ? (
        <EmptyState icon="book" title="No memory rules yet" />
      ) : (
        <div role="list" className="divide-y divide-vsc-border">
          {ruleIds.map((id, index) => (
            <MemoryRuleRow
              key={id}
              id={id}
              onToggle={toggleActive}
              onDelete={deleteRule}
              isEditing={editingRuleId === id}
              onEdit={handleEdit}
              onCancelEdit={handleCancelEdit}
              onSave={handleSave}
              draggable
              isDragOver={dropTargetIndex === index}
              onDragStart={() => handleDragStart(index)}
              onDragOver={() => handleDragOver(index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
});
