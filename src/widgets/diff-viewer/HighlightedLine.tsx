import React from "react";

import { tokenClass, tokenizeLine } from "./syntaxHighlight";

interface HighlightedLineProps {
  content: string;
  lang: string | null;
}

/** Render a syntax-highlighted diff line */
export const HighlightedLine = React.memo(function HighlightedLine({
  content,
  lang,
}: HighlightedLineProps) {
  if (!lang) {
    return <span className="px-1 flex-1 whitespace-pre">{content}</span>;
  }

  // Strip diff prefix (+/-/space) for highlighting, then re-add
  const prefix = content[0] ?? "";
  const code = content.slice(1);
  const tokens = tokenizeLine(code, lang);

  return (
    <span className="px-1 flex-1 whitespace-pre">
      {prefix}
      {/* Static list — index key safe (sequential tokens from single-pass tokenizer) */}
      {tokens.map((tok, i) => {
        const cls = tokenClass(tok.type);
        return cls ? (
          <span key={i} className={cls}>
            {tok.text}
          </span>
        ) : (
          tok.text
        );
      })}
    </span>
  );
});
