import React, { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { backgroundJobsListAtom } from "~shared/bootstrap/background-agent";

import { getVscodeApi } from "../../shared/lib";
import { backgroundJobsPanelVisibleAtom } from "../../shared/lib/atoms/bottomSheetAtoms";
import type { BackgroundJob } from "../../shared/protocol";
import { Badge, Button, Icon, ProgressBar, Spinner, Text } from "../../shared/ui";

function jobBadgeVariant(phase: BackgroundJob["phase"]): "error" | "success" | "default" {
  if (phase === "failed") return "error";
  if (phase === "done") return "success";
  return "default";
}

function JobCard({ job }: { job: BackgroundJob }) {
  const handleCancel = useCallback(() => {
    getVscodeApi().postMessage({ type: "CANCEL_BACKGROUND_JOB", job_id: job.id });
  }, [job.id]);

  const isRunning = job.phase === "running" || job.phase === "initializing" || job.phase === "finalizing";

  return (
    <div className="rounded border border-vsc-border/30 bg-vsc-bg-secondary/30 p-1.5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={job.cloud ? "cloud" : "server"} tokenSize="2xs" className="text-vsc-text-tertiary" />
        <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0" title={job.label}>
          {job.label}
        </Text>
        <Badge
          variant={jobBadgeVariant(job.phase)}
          text={job.phase}
        />
      </div>

      {isRunning && (
        <>
          <ProgressBar value={job.progress} max={100} className="mb-1" />
          <div className="flex items-center gap-1">
            <Spinner size="sm" />
            <Text size="2xs" tone="ghost" truncate className="flex-1 min-w-0">
              {job.current_step ?? `Step ${job.steps_completed}/${job.steps_total}`}
            </Text>
            <Text size="2xs" tone="ghost" mono>
              {job.files_changed} files
            </Text>
          </div>
        </>
      )}

      {job.phase === "done" && job.result_summary && (
        <Text size="2xs" tone="ghost" className="line-clamp-2">
          {job.result_summary}
        </Text>
      )}

      {job.phase === "failed" && job.error_message && (
        <Text size="2xs" tone="error" className="line-clamp-2">
          {job.error_message}
        </Text>
      )}

      {isRunning && (
        <Button
          variant="danger"
          size="sm"
          onClick={handleCancel}
          className="mt-1"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

export const BackgroundJobsPanel = React.memo(function BackgroundJobsPanel() {
  const jobs = useAtomValue(backgroundJobsListAtom);
  const visible = useAtomValue(backgroundJobsPanelVisibleAtom);

  const runningCount = useMemo(
    () => jobs.filter((j) => j.phase === "running" || j.phase === "initializing").length,
    [jobs],
  );

  if (!visible) return null;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="background-jobs-panel">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="server-process" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">
          Background Agent
        </Text>
        {runningCount > 0 && (
          <Badge variant="info" text={`${runningCount} running`} className="ml-auto" />
        )}
      </div>

      <div className="pl-5 space-y-1.5 stagger-children">
        {jobs.length === 0 ? (
          <Text size="xs" tone="tertiary" className="py-4">
            No background jobs
          </Text>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
});
