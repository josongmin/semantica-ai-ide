import React, { useCallback, useEffect, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { TodoBoard } from "~widgets/todo-board";
import { useProjectTodoActions } from "~features/project-todo";
import { pendingTodoCountAtom } from "~entities/project-todo";
import {
  currentPageAtom,
  todoBoardFilterAtom,
  todoBoardSearchAtom,
  todoBoardSortAtom,
} from "~shared/lib";
import type { ProjectTodo, ProjectTodoPriority } from "~shared/protocol";
import { Button, ErrorBoundary, Icon, Text } from "~shared/ui";

import { AddTodoDialog } from "./AddTodoDialog";
import { DeleteTodoDialog } from "./DeleteTodoDialog";
import { TodoBoardToolbar } from "./TodoBoardToolbar";

export const TodoBoardPage = React.memo(function TodoBoardPage() {
  const setPage = useSetAtom(currentPageAtom);
  const pendingCount = useAtomValue(pendingTodoCountAtom);
  const [search, setSearch] = useAtom(todoBoardSearchAtom);
  const [sortBy, setSortBy] = useAtom(todoBoardSortAtom);
  const [filter, setFilter] = useAtom(todoBoardFilterAtom);
  const { loadTodos, addTodo, deleteTodo } = useProjectTodoActions();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTodo | null>(null);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleBack = useCallback(() => {
    setPage("chat");
  }, [setPage]);

  const openAddDialog = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const closeAddDialog = useCallback(() => {
    setAddDialogOpen(false);
  }, []);

  const handleAdd = useCallback(
    (label: string, priority: ProjectTodoPriority) => {
      addTodo(label, priority);
      setAddDialogOpen(false);
    },
    [addTodo],
  );

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteTodo(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteTodo]);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  return (
    <ErrorBoundary fallback={<div className="p-4 text-vsc-error">Todo board failed to load</div>}>
      <div data-testid="todo-board-page" className="flex flex-col h-full bg-vsc-bg">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border bg-vsc-surface-1">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to chat"
            className="p-1 rounded hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring"
          >
            <Icon name="arrow-left" tokenSize="sm" />
          </button>
          <Text size="sm" weight="medium" tone="primary" className="flex-1">
            Project TODOs
          </Text>
          {pendingCount > 0 && (
            <Text size="2xs" tone="info">
              {pendingCount} active
            </Text>
          )}
          <Button variant="ghost" size="sm" icon="add" onClick={openAddDialog}>
            New
          </Button>
        </div>

        <TodoBoardToolbar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Board content */}
        <div className="flex-1 overflow-y-auto scroll-shadow px-1">
          <TodoBoard onDelete={setDeleteTarget} />
        </div>

        <AddTodoDialog open={addDialogOpen} onClose={closeAddDialog} onAdd={handleAdd} />

        <DeleteTodoDialog
          target={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </ErrorBoundary>
  );
});
