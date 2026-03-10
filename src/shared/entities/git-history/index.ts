// Types (re-exported from shared/protocol)
export type { GitCommit, GitCommitId } from "./model/types";

// Atoms (entity-owned state)
export {
  autoCommitEnabledAtom,
  gitCommitsAtom,
  hasGitCommitsAtom,
  MAX_GIT_COMMITS,
  pushGitCommitAtom,
  resetGitStoreAtom,
  setAutoCommitEnabledAtom,
} from "./model/atoms";
