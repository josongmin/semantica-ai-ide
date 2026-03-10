import React from "react";

import { Button } from "../../shared/ui";

export interface SearchResult {
  turnId: string;
  timestamp: string;
  text: string;
  matchStart: number;
  matchEnd: number;
}

interface SearchResultsListProps {
  query: string;
  results: SearchResult[];
  onSelect: () => void;
}

export const SearchResultsList = React.memo(function SearchResultsList({
  query,
  results,
  onSelect,
}: SearchResultsListProps) {
  return (
    <div className="max-h-[min(320px,50vh)] overflow-y-auto">
      {query && results.length === 0 && (
        <p className="p-4 text-2xs text-vsc-text-ghost text-center">No results found</p>
      )}
      {results.map((r) => (
        <Button
          key={`${r.turnId}-${r.matchStart}`}
          variant="ghost"
          size="sm"
          className="w-full text-left px-3 py-2 hover:bg-vsc-list-hover"
          onClick={onSelect}
        >
          <div className="text-2xs text-vsc-text-ghost">{r.timestamp}</div>
          <div className="text-xs text-vsc-text-secondary mt-0.5 line-clamp-2">
            {r.text}
          </div>
        </Button>
      ))}
    </div>
  );
});
