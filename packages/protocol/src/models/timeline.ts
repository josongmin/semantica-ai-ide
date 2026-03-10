// Timeline & event domain models (RFC-005/010 canonical)

export type EventDomain = "editor" | "analysis" | "agent" | "review" | "timeline" | "graph" | "workspace" | "policy";

export interface DevOSEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly workspaceId: string;
  readonly sessionId?: string;
  readonly repoId?: string;
  readonly agentId?: string;
  readonly runtimeId?: string;
  readonly domain: EventDomain;
  readonly type: string;
  readonly payload: unknown;
}

export interface TimelineEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly domain: EventDomain;
  readonly type: string;
  readonly title: string;
  readonly description?: string;
  readonly agentId?: string;
  readonly duration?: number;
  readonly severity?: "info" | "warning" | "error";
}

export interface Checkpoint {
  readonly id: string;
  readonly timestamp: number;
  readonly description: string;
  readonly filesChanged: string[];
  readonly snapshotId?: string;
}
