import React, { useMemo } from "react";

export interface HighlightedTextProps {
  text: string;
  indices?: readonly number[];
  className?: string;
}

/**
 * Renders text with specific character indices highlighted.
 * Used by CommandPalette to show fuzzy-match highlights.
 */
export const HighlightedText = React.memo(function HighlightedText({
  text,
  indices,
  className,
}: HighlightedTextProps) {
  const chars = useMemo(() => {
    if (!indices || indices.length === 0) return null;

    const indexSet = new Set(indices);
    const result: React.ReactNode[] = [];

    // key={i} uses character position in source text — stable, not an array index
    let i = 0;
    while (i < text.length) {
      if (indexSet.has(i)) {
        // Collect consecutive highlighted chars into one <mark>
        let end = i;
        while (end < text.length && indexSet.has(end)) end++;
        result.push(
          <mark
            key={i}
            className="bg-vsc-selection text-vsc-fg rounded-sm"
          >
            {text.slice(i, end)}
          </mark>,
        );
        i = end;
      } else {
        // Collect consecutive non-highlighted chars
        let end = i;
        while (end < text.length && !indexSet.has(end)) end++;
        result.push(<span key={i}>{text.slice(i, end)}</span>);
        i = end;
      }
    }
    return result;
  }, [text, indices]);

  return <span className={className}>{chars ?? text}</span>;
});
