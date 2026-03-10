/**
 * useAICommandSuggest — RFC-TERMINAL-016 §2.1
 *
 * Hook that handles the Cmd+I natural-language → shell command flow:
 * 1. User types natural language query
 * 2. Debounce 300ms
 * 3. Send request with TerminalAIContext
 * 4. Receive command suggestion
 * 5. Update terminalAICommandInputAtom with result
 *
 * Currently uses a mock AI backend that generates plausible commands
 * based on query keywords. Will be replaced with real LLM call.
 */

import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { type AICommandInputState, terminalAICommandInputAtom, type TerminalAIContext, terminalAIContextAtom } from "../model/aiAtoms";

// ─── Mock AI Backend ──────────────────────────────────────

interface CommandSuggestion {
  readonly command: string;
  readonly explanation: string;
  readonly confidence: number;
  readonly alternatives?: string[];
}

function mockGenerateCommand(
  query: string,
  _context: TerminalAIContext | null,
): CommandSuggestion {
  const q = query.toLowerCase().trim();

  // Test-related queries
  if (/\btest\b/.test(q)) {
    if (/\bwatch\b/.test(q)) {
      return {
        command: "pnpm test -- --watch",
        explanation: "Run tests in watch mode, re-running on file changes.",
        confidence: 0.85,
        alternatives: ["vitest --watch", "npm test -- --watch"],
      };
    }
    if (/\bcoverage\b/.test(q)) {
      return {
        command: "pnpm test -- --coverage",
        explanation: "Run tests with code coverage report.",
        confidence: 0.82,
        alternatives: ["vitest --coverage", "npm test -- --coverage"],
      };
    }
    return {
      command: "pnpm test",
      explanation: "Run the project test suite.",
      confidence: 0.9,
      alternatives: ["npm test", "vitest"],
    };
  }

  // Build-related queries
  if (/\bbuild\b/.test(q)) {
    if (/\bprod|production\b/.test(q)) {
      return {
        command: "NODE_ENV=production pnpm build",
        explanation: "Run a production build with optimizations enabled.",
        confidence: 0.8,
        alternatives: ["npm run build -- --mode production"],
      };
    }
    return {
      command: "pnpm build",
      explanation: "Build the project for distribution.",
      confidence: 0.9,
      alternatives: ["npm run build", "npx tsc && npx vite build"],
    };
  }

  // Install-related queries
  if (/\binstall\b|\badd\b|\bdep/.test(q)) {
    const pkgMatch = /(?:install|add)\s+(\S+)/.exec(q);
    if (pkgMatch) {
      const pkg = pkgMatch[1];
      return {
        command: `pnpm add ${pkg}`,
        explanation: `Install the "${pkg}" package as a dependency.`,
        confidence: 0.88,
        alternatives: [`npm install ${pkg}`, `yarn add ${pkg}`],
      };
    }
    return {
      command: "pnpm install",
      explanation: "Install all project dependencies from lockfile.",
      confidence: 0.92,
      alternatives: ["npm install", "npm ci"],
    };
  }

  // Lint-related queries
  if (/\blint\b|\bformat\b|\bcheck\b/.test(q)) {
    if (/\bfix\b/.test(q)) {
      return {
        command: "pnpm lint --fix",
        explanation: "Run linter with auto-fix enabled.",
        confidence: 0.85,
        alternatives: ["eslint . --fix", "npx prettier --write ."],
      };
    }
    return {
      command: "pnpm lint",
      explanation: "Run the project linter to check for code issues.",
      confidence: 0.88,
      alternatives: ["eslint .", "npx prettier --check ."],
    };
  }

  // Git-related queries
  if (/\bgit\b/.test(q)) {
    if (/\bstatus\b/.test(q)) {
      return { command: "git status", explanation: "Show the working tree status.", confidence: 0.95 };
    }
    if (/\bbranch\b/.test(q)) {
      if (/\bnew\b|\bcreate\b/.test(q)) {
        const branchMatch = /(?:branch|create)\s+(\S+)/.exec(q);
        const name = branchMatch?.[1] ?? "feature/new-branch";
        return {
          command: `git checkout -b ${name}`,
          explanation: `Create and switch to a new branch "${name}".`,
          confidence: 0.82,
          alternatives: [`git switch -c ${name}`],
        };
      }
      return {
        command: "git branch -a",
        explanation: "List all local and remote branches.",
        confidence: 0.88,
        alternatives: ["git branch", "git branch -v"],
      };
    }
    if (/\blog\b/.test(q)) {
      return {
        command: "git log --oneline -20",
        explanation: "Show the last 20 commits in a compact format.",
        confidence: 0.9,
        alternatives: ["git log --oneline --graph -20"],
      };
    }
    if (/\bdiff\b/.test(q)) {
      return {
        command: "git diff",
        explanation: "Show unstaged changes in the working directory.",
        confidence: 0.88,
        alternatives: ["git diff --staged", "git diff HEAD"],
      };
    }
    if (/\bcommit\b/.test(q)) {
      return {
        command: 'git commit -m "update"',
        explanation: "Commit staged changes with a message.",
        confidence: 0.7,
        alternatives: ["git commit --amend", "git commit -a -m 'update'"],
      };
    }
    if (/\bpush\b/.test(q)) {
      return { command: "git push", explanation: "Push commits to the remote.", confidence: 0.9 };
    }
    if (/\bpull\b/.test(q)) {
      return {
        command: "git pull --rebase",
        explanation: "Pull and rebase on top of upstream changes.",
        confidence: 0.85,
        alternatives: ["git pull"],
      };
    }
    return {
      command: "git status",
      explanation: "Show the working tree status.",
      confidence: 0.7,
      alternatives: ["git log --oneline -10", "git diff"],
    };
  }

  // Dev server
  if (/\bdev\b|\bserv/.test(q)) {
    return {
      command: "pnpm dev",
      explanation: "Start the development server with hot reload.",
      confidence: 0.88,
      alternatives: ["npm run dev", "npx vite"],
    };
  }

  // Clean
  if (/\bclean\b|\bclear\b/.test(q)) {
    return {
      command: "rm -rf node_modules/.cache dist",
      explanation: "Clear build caches and dist output.",
      confidence: 0.72,
      alternatives: ["pnpm clean", "rm -rf dist"],
    };
  }

  // Type check
  if (/\btype.?check\b|\btsc\b/.test(q)) {
    return {
      command: "pnpm tsc --noEmit",
      explanation: "Run TypeScript type checking without emitting output.",
      confidence: 0.88,
      alternatives: ["npx tsc --noEmit"],
    };
  }

  // Default: echo the query as a comment
  return {
    command: `# ${query}`,
    explanation: "Could not determine a specific command. Added as a shell comment.",
    confidence: 0.2,
  };
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Handles the Cmd+I AI command suggestion flow.
 * Call `submitQuery(text)` on input change — it debounces internally (300ms).
 */
export function useAICommandSuggest() {
  const setCommandInput = useSetAtom(terminalAICommandInputAtom);
  const context = useAtomValue(terminalAIContextAtom);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitQuery = useCallback(
    (query: string) => {
      // Clear pending debounce
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      // Update query immediately in atom
      setCommandInput((prev) => ({
        ...prev,
        query,
        result: query.trim() ? prev.result : null,
        loading: !!query.trim(),
      }));

      if (!query.trim()) return;

      // Debounce the actual AI call
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;

        const suggestion = mockGenerateCommand(query, context);

        const result: AICommandInputState["result"] = {
          command: suggestion.command,
          explanation: suggestion.explanation,
          confidence: suggestion.confidence,
          ...(suggestion.alternatives ? { alternatives: suggestion.alternatives } : {}),
        };
        setCommandInput((prev) => ({
          ...prev,
          loading: false,
          result,
        }));
      }, 300);
    },
    [setCommandInput, context],
  );

  return { submitQuery };
}
