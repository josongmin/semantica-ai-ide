import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { GitCommit } from "~shared/protocol";

// ─── Git History Atoms ─────────────────────────────────────

/** Maximum number of git commits to retain in memory */
export const MAX_GIT_COMMITS = 50;

/** Ordered list of git commits (newest first) */
export const gitCommitsAtom = atom<readonly GitCommit[]>([]);

/** Whether there are any git commits (avoids subscribing to the full commits array) */
export const hasGitCommitsAtom = atom((get) => get(gitCommitsAtom).length > 0);

/** Current git branch — derived from the most recent commit's branch field */
export const currentGitBranchAtom = atom((get) => get(gitCommitsAtom)[0]?.branch ?? "main");

/** Whether auto-commit is enabled */
export const autoCommitEnabledAtom = atom<boolean>(false);

/** Write-only: prepend a new commit to the list, capped at MAX_GIT_COMMITS. Deduplicates by id. */
export const pushGitCommitAtom = atom(null, (get, set, commit: GitCommit) => {
  const commits = get(gitCommitsAtom);
  if (commits.some((c) => c.id === commit.id)) return;
  const next = [commit, ...commits];
  set(gitCommitsAtom, next.length > MAX_GIT_COMMITS ? next.slice(0, MAX_GIT_COMMITS) : next);
});

/** Write-only: set auto-commit enabled state */
export const setAutoCommitEnabledAtom = atom(null, (_get, set, enabled: boolean) => {
  set(autoCommitEnabledAtom, enabled);
});

/** Write-only: reset all git history state */
export const resetGitStoreAtom = atom(null, (_get, set) => {
  set(gitCommitsAtom, []);
  set(autoCommitEnabledAtom, false);
});

registerResetAtom(resetGitStoreAtom);
