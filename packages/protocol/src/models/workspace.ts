// Workspace identity hierarchy (RFC-013)

export interface OrganizationId {
  readonly orgId: string;
}

export interface WorkspaceId {
  readonly workspaceId: string;
}

export interface RepositoryId {
  readonly workspaceId: string;
  readonly repoId: string;
}

export interface SessionIdentity {
  readonly workspaceId: string;
  readonly userId: string;
  readonly sessionId: string;
}

export interface AgentIdentity {
  readonly workspaceId: string;
  readonly sessionId: string;
  readonly agentId: string;
}

export interface RuntimeId {
  readonly workspaceId: string;
  readonly runtimeId: string;
  readonly type: "local" | "remote" | "worker";
}

export interface WorkspaceContext {
  readonly workspaceId: string;
  readonly repoIds?: string[];
  readonly sessionId?: string;
  readonly agentId?: string;
  readonly runtimeId?: string;
}
