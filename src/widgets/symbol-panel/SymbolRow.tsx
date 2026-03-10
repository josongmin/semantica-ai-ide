import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { filePermalinkTurnIndexAtom } from "../../features/file-permalink";
import {
  clearFocusedTurnAtom,
  extractFileName,
  focusedTurnIdAtom,
  getVscodeApi,
} from "../../shared/lib";
import type { SymbolKind, SymbolMention, TurnId } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

interface SymbolRowProps {
  symbol: SymbolMention;
}

const KIND_ICONS: Readonly<Record<SymbolKind, string>> = {
  function: "symbol-method",
  class: "symbol-class",
  variable: "symbol-variable",
  type: "symbol-interface",
  file: "file",
};

const KIND_COLORS: Readonly<Record<SymbolKind, string>> = {
  function: "text-vsc-info",
  class: "text-vsc-warning",
  variable: "text-vsc-success",
  type: "text-vsc-info",
  file: "text-vsc-text-secondary",
};

export const SymbolRow = React.memo(function SymbolRow({ symbol }: SymbolRowProps) {
  const turnIndices = useAtomValue(filePermalinkTurnIndexAtom);
  const setFocusedTurnId = useSetAtom(focusedTurnIdAtom);
  const clearFocusedTurn = useSetAtom(clearFocusedTurnAtom);

  const fileName = extractFileName(symbol.file_path);
  const turnIndex = turnIndices.get(symbol.turn_id);

  const handleOpenFile = useCallback(() => {
    getVscodeApi().postMessage({ type: "OPEN_FILE", file_path: symbol.file_path });
  }, [symbol.file_path]);

  const handleTurnClick = useCallback(() => {
    setFocusedTurnId(symbol.turn_id as TurnId);
    clearFocusedTurn();
  }, [symbol.turn_id, setFocusedTurnId, clearFocusedTurn]);

  return (
    <div
      className="flex items-center gap-1.5 py-0.5 px-1 rounded-md text-xs hover:bg-vsc-list-hover transition-colors duration-fast group"
      data-testid={`symbol-row-${symbol.name}`}
    >
      <Icon
        name={KIND_ICONS[symbol.kind]}
        tokenSize="sm"
        className={cn("shrink-0", KIND_COLORS[symbol.kind])}
      />

      <button
        type="button"
        onClick={handleOpenFile}
        title={`Open ${symbol.file_path}${symbol.line != null && symbol.line > 0 ? `:${symbol.line}` : ""}`}
        aria-label={`Open ${symbol.name} in ${symbol.file_path}`}
        className="flex items-center gap-1 flex-1 min-w-0 text-left hover:underline cursor-pointer bg-transparent border-none p-0 text-vsc-fg focus-ring"
      >
        <Text size="xs" weight="medium" truncate>
          {symbol.name}
        </Text>
        <Text size="xs" tone="ghost" truncate>
          {fileName}
          {symbol.line != null && `:${symbol.line}`}
        </Text>
      </button>

      {turnIndex != null && (
        <button
          type="button"
          onClick={handleTurnClick}
          className="shrink-0 px-1 py-0.5 rounded text-2xs bg-vsc-badge-bg text-vsc-badge-fg hover:bg-vsc-info/20 transition-colors duration-fast cursor-pointer bg-transparent border-none focus-ring"
          title={`Jump to Turn ${turnIndex}`}
          aria-label={`Jump to Turn ${turnIndex}`}
        >
          T{turnIndex}
        </button>
      )}
    </div>
  );
});
