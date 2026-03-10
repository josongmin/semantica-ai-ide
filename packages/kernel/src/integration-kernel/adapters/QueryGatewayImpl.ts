import type { QueryGateway, QueryIntent, QueryJob } from "../types.js";
import type { KernelTransport } from "../factory.js";

export class QueryGatewayImpl implements QueryGateway {
  private readonly jobs = new Map<string, QueryJob>();
  private nextJobId = 0;

  constructor(private readonly transport: KernelTransport) {
    this.transport.on("query/job/update", (data) => {
      const update = data as {
        id: string;
        status: QueryJob["status"];
        progress?: number;
        result?: unknown;
        error?: string;
      };
      const existing = this.jobs.get(update.id);
      if (existing) {
        this.jobs.set(update.id, {
          ...existing,
          status: update.status,
          progress: update.progress ?? existing.progress,
          result: update.result ?? existing.result,
          error: update.error ?? existing.error,
        });
      }
    });
  }

  async query(intent: QueryIntent): Promise<QueryJob> {
    const id = `qj-${++this.nextJobId}-${Date.now()}`;
    const job: QueryJob = {
      id,
      status: "running",
      progress: 0,
    };
    this.jobs.set(id, job);
    await this.transport.send("query/execute", { jobId: id, intent });
    return job;
  }

  async cancel(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Unknown job: ${jobId}`);
    }
    if (job.status !== "running") {
      return;
    }
    this.jobs.set(jobId, { ...job, status: "failed", error: "cancelled" });
    await this.transport.send("query/cancel", { jobId });
  }

  async getJob(jobId: string): Promise<QueryJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Unknown job: ${jobId}`);
    }
    return job;
  }
}
