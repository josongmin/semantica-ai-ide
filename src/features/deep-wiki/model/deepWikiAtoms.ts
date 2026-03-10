import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { WikiPage } from "../../../shared/protocol";

/** Wiki page tree node for navigation sidebar */
export interface WikiTreeNode {
  readonly page: WikiPage;
  readonly children: readonly WikiTreeNode[];
}

/** All wiki pages keyed by id */
export const wikiPagesAtom = atom<ReadonlyMap<string, WikiPage>>(new Map());

/** Write-only: replace all wiki pages from a SET_WIKI_PAGES serverEvent */
export const setWikiPagesAtom = atom(null, (_get, set, pages: readonly WikiPage[]) => {
  const map = new Map<string, WikiPage>();
  for (const page of pages) {
    map.set(page.id, page);
  }
  set(wikiPagesAtom, map);
});

/** Currently active wiki page id */
export const activeWikiPageIdAtom = atom<string | null>(null);

/** Derived: the currently active wiki page (or null) */
export const activeWikiPageAtom = atom<WikiPage | null>((get) => {
  const id = get(activeWikiPageIdAtom);
  if (!id) return null;
  return get(wikiPagesAtom).get(id) ?? null;
});

/** Derived: tree structure built from flat wiki pages */
export const wikiTreeAtom = atom<readonly WikiTreeNode[]>((get) => {
  const pages = get(wikiPagesAtom);
  if (pages.size === 0) return [];

  // Build lookup of children by parent_id
  const childrenMap = new Map<string | undefined, WikiPage[]>();
  for (const page of pages.values()) {
    const parentKey = page.parent_id ?? undefined;
    const siblings = childrenMap.get(parentKey) ?? [];
    siblings.push(page);
    childrenMap.set(parentKey, siblings);
  }

  // Recursive tree builder
  function buildNodes(parentId: string | undefined): WikiTreeNode[] {
    const children = childrenMap.get(parentId) ?? [];
    return children.map((page) => ({
      page,
      children: buildNodes(page.id),
    }));
  }

  return buildNodes(undefined);
});

/** Write-only: reset all wiki state */
export const resetDeepWikiStoreAtom = atom(null, (_get, set) => {
  set(wikiPagesAtom, new Map());
  set(activeWikiPageIdAtom, null);
});

registerResetAtom(resetDeepWikiStoreAtom);
