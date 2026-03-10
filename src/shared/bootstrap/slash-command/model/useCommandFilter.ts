import { useMemo } from "react";

import { fuzzyMatch } from "./fuzzyMatch";
import { CATEGORY_META } from "./registry";
import type { CommandGroup, CommandMatch, SlashCommandDef } from "./types";

/**
 * Derives filtered + scored command matches from query and registry.
 * Groups results by category for rendering.
 */
export function useCommandFilter(
  query: string,
  commands: readonly SlashCommandDef[],
): { flatMatches: CommandMatch[]; groups: CommandGroup[] } {
  return useMemo(() => {
    const matches = fuzzyMatch(query, commands);

    // Group by category
    const groupMap = new Map<string, CommandMatch[]>();
    for (const match of matches) {
      const cat = match.command.category;
      const list = groupMap.get(cat) ?? [];
      list.push(match);
      groupMap.set(cat, list);
    }

    // Sort groups by category order, build CommandGroup[]
    const groups: CommandGroup[] = Array.from(groupMap.entries())
      .map(([cat, items]) => ({
        category: cat as CommandMatch["command"]["category"],
        label: CATEGORY_META[cat as keyof typeof CATEGORY_META].label,
        items,
      }))
      .sort((a, b) => {
        const orderA = CATEGORY_META[a.category].order;
        const orderB = CATEGORY_META[b.category].order;
        return orderA - orderB;
      });

    return { flatMatches: matches, groups };
  }, [query, commands]);
}
