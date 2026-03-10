import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { BackgroundJob } from "~shared/protocol";

/** Map-based store keyed by job id */
export const backgroundJobsAtom = atom<ReadonlyMap<string, BackgroundJob>>(new Map());

export const upsertBackgroundJobAtom = atom(null, (get, set, job: BackgroundJob) => {
  const prev = get(backgroundJobsAtom);
  const next = new Map(prev);
  next.set(job.id, job);
  set(backgroundJobsAtom, next);
});

export const removeBackgroundJobAtom = atom(null, (get, set, id: string) => {
  const prev = get(backgroundJobsAtom);
  if (!prev.has(id)) return;
  const next = new Map(prev);
  next.delete(id);
  set(backgroundJobsAtom, next);
});

export const resetBackgroundJobsAtom = atom(null, (_get, set) => {
  set(backgroundJobsAtom, new Map());
});

/** Derived: list view */
export const backgroundJobsListAtom = atom((get) => [...get(backgroundJobsAtom).values()]);

/** Derived: count of running jobs */
export const runningJobsCountAtom = atom(
  (get) =>
    [...get(backgroundJobsAtom).values()].filter(
      (j) => j.phase === "running" || j.phase === "initializing",
    ).length,
);

registerResetAtom(resetBackgroundJobsAtom);
