import { createStore } from "jotai";

import { resetIdCounter } from "~shared/lib/mocks";
import type { GitCommit, GitCommitId } from "~shared/protocol";

import {
  autoCommitEnabledAtom,
  gitCommitsAtom,
  MAX_GIT_COMMITS,
  pushGitCommitAtom,
  resetGitStoreAtom,
  setAutoCommitEnabledAtom,
} from "../model/atoms";

function createGitCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    id: "cp_1" as GitCommitId,
    sha: "abc1234",
    message: "Initial commit",
    timestamp_ms: Date.now(),
    auto: false,
    ...overrides,
  };
}

beforeEach(() => {
  resetIdCounter();
});

describe("pushGitCommitAtom", () => {
  it("prepends commit to the front of the list", () => {
    const store = createStore();
    const commit1 = createGitCommit({ id: "cp_1" as GitCommitId, sha: "aaa111", message: "First" });
    const commit2 = createGitCommit({
      id: "cp_2" as GitCommitId,
      sha: "bbb222",
      message: "Second",
    });

    store.set(pushGitCommitAtom, commit1);
    store.set(pushGitCommitAtom, commit2);

    const commits = store.get(gitCommitsAtom);
    expect(commits[0]?.sha).toBe("bbb222");
    expect(commits[1]?.sha).toBe("aaa111");
  });

  it("caps list at MAX_GIT_COMMITS", () => {
    const store = createStore();

    for (let i = 0; i < MAX_GIT_COMMITS + 10; i++) {
      store.set(
        pushGitCommitAtom,
        createGitCommit({ id: `cp_${i}` as GitCommitId, sha: `sha${i}`, message: `Commit ${i}` }),
      );
    }

    expect(store.get(gitCommitsAtom).length).toBe(MAX_GIT_COMMITS);
  });

  it("oldest commits are dropped when cap is exceeded", () => {
    const store = createStore();
    const firstCommit = createGitCommit({
      id: "cp_first" as GitCommitId,
      sha: "first_sha",
      message: "Very first",
    });
    store.set(pushGitCommitAtom, firstCommit);

    for (let i = 0; i < MAX_GIT_COMMITS; i++) {
      store.set(
        pushGitCommitAtom,
        createGitCommit({ id: `cp_${i}` as GitCommitId, sha: `sha${i}`, message: `Commit ${i}` }),
      );
    }

    const commits = store.get(gitCommitsAtom);
    expect(commits.length).toBe(MAX_GIT_COMMITS);
    const shas = commits.map((c) => c.sha);
    expect(shas).not.toContain("first_sha");
  });

  it("stores auto-commit flag correctly", () => {
    const store = createStore();
    const autoCommit = createGitCommit({ id: "cp_1" as GitCommitId, auto: true });
    store.set(pushGitCommitAtom, autoCommit);

    expect(store.get(gitCommitsAtom)[0]?.auto).toBe(true);
  });
});

describe("setAutoCommitEnabledAtom", () => {
  it("defaults to false", () => {
    const store = createStore();
    expect(store.get(autoCommitEnabledAtom)).toBe(false);
  });

  it("sets auto-commit enabled to true", () => {
    const store = createStore();
    store.set(setAutoCommitEnabledAtom, true);
    expect(store.get(autoCommitEnabledAtom)).toBe(true);
  });

  it("can toggle back to false", () => {
    const store = createStore();
    store.set(setAutoCommitEnabledAtom, true);
    store.set(setAutoCommitEnabledAtom, false);
    expect(store.get(autoCommitEnabledAtom)).toBe(false);
  });
});

describe("resetGitStoreAtom", () => {
  it("clears commits list and resets auto-commit flag", () => {
    const store = createStore();
    store.set(pushGitCommitAtom, createGitCommit({ id: "cp_1" as GitCommitId }));
    store.set(pushGitCommitAtom, createGitCommit({ id: "cp_2" as GitCommitId }));
    store.set(setAutoCommitEnabledAtom, true);

    store.set(resetGitStoreAtom);

    expect(store.get(gitCommitsAtom)).toEqual([]);
    expect(store.get(autoCommitEnabledAtom)).toBe(false);
  });
});

describe("MAX_GIT_COMMITS constant", () => {
  it("is 50", () => {
    expect(MAX_GIT_COMMITS).toBe(50);
  });
});
