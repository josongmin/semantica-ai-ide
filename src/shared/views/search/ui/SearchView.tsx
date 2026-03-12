import React, { memo, useCallback, useEffect, useRef, useState } from "react";

import { getVscodeApi } from "~shared/lib/vscodeApi";
import { Icon } from "~shared/ui/primitives/Icon";
import { Text } from "~shared/ui/primitives/Text";
import { cn } from "~shared/ui/variants";

// ─── Mock Data ──────────────────────────────────────────

interface SearchResult {
  readonly filePath: string;
  readonly matches: readonly {
    readonly line: number;
    readonly content: string;
    readonly matchStart: number;
    readonly matchEnd: number;
  }[];
}

function generateMockResults(query: string): SearchResult[] {
  if (!query.trim()) return [];
  return [
    {
      filePath: "src/core/engine/SemanticParser.ts",
      matches: [
        {
          line: 14,
          content: `  const ${query}Handler = createHandler();`,
          matchStart: 8,
          matchEnd: 8 + query.length,
        },
        {
          line: 47,
          content: `  return ${query}.process(node);`,
          matchStart: 9,
          matchEnd: 9 + query.length,
        },
        {
          line: 102,
          content: `// Initialize ${query} pipeline`,
          matchStart: 15,
          matchEnd: 15 + query.length,
        },
      ],
    },
    {
      filePath: "src/features/intent-engine/resolver.ts",
      matches: [
        {
          line: 8,
          content: `import { ${query} } from "../core";`,
          matchStart: 10,
          matchEnd: 10 + query.length,
        },
        {
          line: 33,
          content: `  if (${query} !== undefined) {`,
          matchStart: 6,
          matchEnd: 6 + query.length,
        },
      ],
    },
    {
      filePath: "src/shared/lib/utils.ts",
      matches: [
        {
          line: 71,
          content: `export function ${query}(input: string): boolean {`,
          matchStart: 16,
          matchEnd: 16 + query.length,
        },
      ],
    },
    {
      filePath: "packages/protocol/src/models/index.ts",
      matches: [
        {
          line: 5,
          content: `export type ${query}Config = {`,
          matchStart: 12,
          matchEnd: 12 + query.length,
        },
        {
          line: 22,
          content: `  readonly ${query}: string;`,
          matchStart: 11,
          matchEnd: 11 + query.length,
        },
      ],
    },
    {
      filePath: "src/widgets/prompt-box/PromptBox.tsx",
      matches: [
        {
          line: 156,
          content: `  const ${query}Ref = useRef<HTMLDivElement>(null);`,
          matchStart: 8,
          matchEnd: 8 + query.length,
        },
      ],
    },
  ];
}

// ─── Toggle Button ──────────────────────────────────────

const ToggleButton = memo(function ToggleButton({
  icon,
  title,
  active,
  onToggle,
}: {
  icon: string;
  title: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onToggle}
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded-sm border-none cursor-pointer transition-colors duration-fast",
        active
          ? "bg-vsc-accent/20 text-vsc-accent"
          : "bg-transparent text-vsc-text-tertiary hover:text-vsc-fg",
      )}
    >
      <Icon name={icon} tokenSize="2xs" />
    </button>
  );
});

// ─── Highlighted Match ──────────────────────────────────

const MatchLine = memo(function MatchLine({
  filePath,
  line,
  content,
  query,
}: {
  filePath: string;
  line: number;
  content: string;
  query: string;
}) {
  // Simple highlight: find query in content (case-insensitive)
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  const before = idx >= 0 ? content.slice(0, idx) : content;
  const match = idx >= 0 ? content.slice(idx, idx + query.length) : "";
  const after = idx >= 0 ? content.slice(idx + query.length) : "";

  return (
    <button
      type="button"
      onClick={() => {
        getVscodeApi().postMessage({ type: "OPEN_FILE_AT_LINE", file_path: filePath, line });
      }}
      className={cn(
        "flex items-start gap-2 w-full px-3 py-0.5 text-left bg-transparent border-none cursor-pointer",
        "hover:bg-vsc-list-hover/50 transition-colors duration-fast",
      )}
    >
      <Text size="3xs" tone="ghost" mono className="opacity-50 shrink-0 w-8 text-right pt-px">
        {line}
      </Text>
      <Text size="2xs" truncate className="text-vsc-fg/80">
        {before}
        {match && (
          <span className="bg-vsc-accent/25 text-vsc-accent font-medium rounded-sm px-0.5">
            {match}
          </span>
        )}
        {after}
      </Text>
    </button>
  );
});

// ─── Main Panel ─────────────────────────────────────────

export const SearchView = React.memo(function SearchView() {
  const [query, setQuery] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [includeGlob, setIncludeGlob] = useState("");
  const [excludeGlob, setExcludeGlob] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      setResults(generateMockResults(q));
      setLoading(false);
      setSearched(true);
    }, 300);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      doSearch(val);
    },
    [doSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuery("");
        setResults([]);
        setSearched(false);
        setLoading(false);
        inputRef.current?.blur();
      } else if (e.key === "Enter") {
        if (debounceRef.current !== null) clearTimeout(debounceRef.current);
        if (query.trim()) {
          setLoading(true);
          setTimeout(() => {
            setResults(generateMockResults(query));
            setLoading(false);
            setSearched(true);
          }, 150);
        }
      }
    },
    [query],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full select-none text-xs">
      {/* ── Header / Search Input ── */}
      <div className="shrink-0 px-2 pt-2.5 pb-2 space-y-1.5">
        {/* Main search input row */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 h-7 rounded-md",
            "bg-vsc-input-bg border border-vsc-accent/15",
            "focus-within:border-vsc-accent/30 transition-colors duration-fast",
          )}
        >
          <Icon name="search" tokenSize="2xs" className="text-vsc-accent/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search across all files"
            className="flex-1 bg-transparent border-none outline-none text-2xs text-vsc-fg placeholder:text-vsc-text-ghost/50 min-w-0"
          />
          <ToggleButton
            icon="regex"
            title="Use Regular Expression"
            active={useRegex}
            onToggle={() => setUseRegex((v) => !v)}
          />
          <ToggleButton
            icon="case-sensitive"
            title="Match Case"
            active={caseSensitive}
            onToggle={() => setCaseSensitive((v) => !v)}
          />
          <ToggleButton
            icon="whole-word"
            title="Match Whole Word"
            active={wholeWord}
            onToggle={() => setWholeWord((v) => !v)}
          />
        </div>

        {/* Include / Exclude filters */}
        <div className="flex gap-1.5">
          <div
            className={cn(
              "flex items-center gap-1 px-2 h-5 rounded-md flex-1",
              "bg-vsc-input-bg border border-vsc-border/10",
              "focus-within:border-vsc-accent/20 transition-colors duration-fast",
            )}
          >
            <input
              type="text"
              value={includeGlob}
              onChange={(e) => setIncludeGlob(e.target.value)}
              placeholder="Include (e.g. src/**)"
              className="flex-1 bg-transparent border-none outline-none text-3xs text-vsc-fg placeholder:text-vsc-text-ghost/40 min-w-0"
            />
          </div>
          <div
            className={cn(
              "flex items-center gap-1 px-2 h-5 rounded-md flex-1",
              "bg-vsc-input-bg border border-vsc-border/10",
              "focus-within:border-vsc-accent/20 transition-colors duration-fast",
            )}
          >
            <input
              type="text"
              value={excludeGlob}
              onChange={(e) => setExcludeGlob(e.target.value)}
              placeholder="Exclude (e.g. node_modules)"
              className="flex-1 bg-transparent border-none outline-none text-3xs text-vsc-fg placeholder:text-vsc-text-ghost/40 min-w-0"
            />
          </div>
        </div>

        {/* Result count / Loading */}
        {(searched || loading) && (
          <div className="flex items-center gap-1.5 px-0.5">
            {loading ? (
              <Icon name="loading" tokenSize="2xs" className="text-vsc-accent/60 animate-spin" />
            ) : (
              <Text size="3xs" tone="tertiary">
                {totalMatches} result{totalMatches !== 1 ? "s" : ""} in {results.length} file
                {results.length !== 1 ? "s" : ""}
              </Text>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-vsc-border/15 to-transparent shrink-0" />

      {/* ── Results Area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
            <Icon name="search" tokenSize="lg" className="text-vsc-text-ghost/20" />
            <Text size="2xs" tone="ghost" className="opacity-40 text-center">
              Search across all files
            </Text>
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
            <Icon name="search-stop" tokenSize="lg" className="text-vsc-text-ghost/20" />
            <Text size="2xs" tone="ghost" className="opacity-40 text-center">
              No results found for &ldquo;{query}&rdquo;
            </Text>
          </div>
        )}

        {results.map((fileResult) => (
          <FileResultGroup key={fileResult.filePath} result={fileResult} query={query} />
        ))}
      </div>
    </div>
  );
});

/** @deprecated Use SearchView instead */
export { SearchView as SearchPanel };

// ─── File Result Group ──────────────────────────────────

const FileResultGroup = memo(function FileResultGroup({
  result,
  query,
}: {
  result: SearchResult;
  query: string;
}) {
  const [open, setOpen] = useState(true);
  const parts = result.filePath.split("/");
  const fileName = parts.pop() ?? result.filePath;
  const dirPath = parts.join("/");

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 h-6 text-left bg-transparent border-none cursor-pointer",
          "hover:bg-vsc-list-hover/50 transition-colors duration-fast",
        )}
      >
        <Icon
          name="chevron-right"
          tokenSize="2xs"
          className={cn(
            "shrink-0 transition-transform duration-normal text-vsc-text-tertiary",
            open && "rotate-90",
          )}
        />
        <Icon name="file" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
        <Text size="2xs" weight="medium" truncate>
          {fileName}
        </Text>
        <Text size="3xs" tone="ghost" truncate className="opacity-40">
          {dirPath}
        </Text>
        <Text size="3xs" tone="ghost" mono className="ml-auto opacity-50 shrink-0">
          {result.matches.length}
        </Text>
      </button>
      {open &&
        result.matches.map((m) => (
          <MatchLine
            key={`${m.line}-${m.content}`}
            filePath={result.filePath}
            line={m.line}
            content={m.content}
            query={query}
          />
        ))}
    </div>
  );
});
