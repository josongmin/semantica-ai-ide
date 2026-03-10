import { fuzzyScore } from "~shared/lib/fuzzyScore";

import type { CommandMatch, SlashCommandDef } from "./types";

/**
 * Fuzzy-match a query against all commands.
 * Searches label + keywords. Returns scored results sorted by score.
 */
export function fuzzyMatch(query: string, commands: readonly SlashCommandDef[]): CommandMatch[] {
  if (!query) {
    return commands
      .filter((cmd) => !cmd.hidden)
      .map((cmd) => ({ command: cmd, score: 0, matchIndices: [] }));
  }

  const results: CommandMatch[] = [];

  for (const cmd of commands) {
    if (cmd.hidden) continue;

    // Score against label (primary)
    const labelResult = fuzzyScore(query, cmd.label);

    // Score against keywords (secondary, 50% weight)
    let keywordScore = 0;
    if (cmd.keywords) {
      for (const kw of cmd.keywords) {
        const kwResult = fuzzyScore(query, kw);
        if (kwResult && kwResult.score * 0.5 > keywordScore) {
          keywordScore = kwResult.score * 0.5;
        }
      }
    }

    const bestLabelScore = labelResult?.score ?? 0;
    const totalScore = Math.max(bestLabelScore, keywordScore);

    if (totalScore > 0) {
      results.push({
        command: cmd,
        score: totalScore,
        matchIndices: labelResult?.indices ?? [],
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
