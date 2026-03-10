import { z } from "zod";

// ── Workspace (RFC-013) ───────────────────────────────────

export const OrganizationIdSchema = z.object({
  orgId: z.string(),
});

export const WorkspaceIdSchema = z.object({
  workspaceId: z.string(),
});

export const RepositoryIdSchema = z.object({
  workspaceId: z.string(),
  repoId: z.string(),
});

export const SessionIdentitySchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  sessionId: z.string(),
});

export const AgentIdentitySchema = z.object({
  workspaceId: z.string(),
  sessionId: z.string(),
  agentId: z.string(),
});

export const RuntimeIdSchema = z.object({
  workspaceId: z.string(),
  runtimeId: z.string(),
  type: z.enum(["local", "remote", "worker"]),
});

export const WorkspaceContextSchema = z.object({
  workspaceId: z.string(),
  repoIds: z.array(z.string()).optional(),
  sessionId: z.string().optional(),
  agentId: z.string().optional(),
  runtimeId: z.string().optional(),
});

// ── Agent (RFC-008) ───────────────────────────────────────

export const AgentRoleSchema = z.enum(["planner", "search", "impact", "patch", "test", "review", "repair"]);
export const AgentStatusSchema = z.enum(["idle", "assigned", "running", "waiting", "blocked", "failed", "completed"]);

export const AgentUnitSchema = z.object({
  id: z.string(),
  role: AgentRoleSchema,
  name: z.string(),
  status: AgentStatusSchema,
  currentTaskId: z.string().optional(),
  currentStep: z.string().optional(),
  progress: z.number().optional(),
});

export const AgentStepSchema = z.object({
  stepId: z.string(),
  agentId: z.string(),
  action: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  output: z.string().optional(),
});

// ── Orchestrator (RFC-008) ────────────────────────────────

export const OrchestratorStatusSchema = z.enum(["planning", "running", "converging", "awaiting_approval", "completed", "failed"]);
export const TaskTypeSchema = z.enum(["search", "analysis", "patch", "test", "review", "repair"]);
export const TaskStatusSchema = z.enum(["queued", "ready", "running", "blocked", "completed", "failed"]);
export const TaskPrioritySchema = z.enum(["low", "normal", "high", "critical"]);
export const CandidateKindSchema = z.enum(["patch", "analysis_bundle", "review_bundle", "repair_proposal"]);
export const CandidateStatusSchema = z.enum(["draft", "ready", "selected", "discarded"]);

export const OrchestratorRunSchema = z.object({
  id: z.string(),
  intent: z.string(),
  status: OrchestratorStatusSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  planId: z.string(),
  activeAgentIds: z.array(z.string()),
  candidateIds: z.array(z.string()),
});

export const TaskNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: TaskTypeSchema,
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dependsOn: z.array(z.string()),
  assignedAgentId: z.string().optional(),
  outputs: z.array(z.string()).optional(),
});

export const CandidateArtifactSchema = z.object({
  id: z.string(),
  kind: CandidateKindSchema,
  sourceAgentId: z.string(),
  relatedTaskId: z.string(),
  patchId: z.string().optional(),
  reviewEvidenceId: z.string().optional(),
  score: z.number().optional(),
  status: CandidateStatusSchema,
});

// ── Review (RFC-004) ──────────────────────────────────────

export const ImpactSummarySchema = z.object({
  affectedFiles: z.number(),
  affectedFunctions: z.number(),
  affectedModules: z.array(z.string()),
  callChainDepth: z.number(),
});

export const SecuritySummarySchema = z.object({
  newVulnerabilities: z.number(),
  fixedVulnerabilities: z.number(),
  taintPathCount: z.number(),
  verdict: z.enum(["clean", "warning", "critical"]),
});

export const CloneSummarySchema = z.object({
  newClones: z.number(),
  removedClones: z.number(),
  totalClones: z.number(),
});

export const MetricsSummarySchema = z.object({
  complexityDelta: z.number(),
  linesDelta: z.number(),
  functionsDelta: z.number(),
});

export const TestImpactSummarySchema = z.object({
  affectedTests: z.number(),
  passingTests: z.number(),
  failingTests: z.number(),
  coverageDelta: z.number(),
});

export const ReviewBundleSchema = z.object({
  id: z.string(),
  patchId: z.string(),
  timestamp: z.number(),
  impact: ImpactSummarySchema,
  security: SecuritySummarySchema,
  clone: CloneSummarySchema,
  metrics: MetricsSummarySchema,
  tests: TestImpactSummarySchema,
});

// ── Graph (RFC-007) ───────────────────────────────────────

export const GraphNodeTypeSchema = z.enum(["function", "class", "module", "service", "file", "package"]);
export const GraphEdgeTypeSchema = z.enum(["calls", "imports", "extends", "implements", "depends_on", "contains"]);

export const GraphNodeSchema = z.object({
  id: z.string(),
  type: GraphNodeTypeSchema,
  label: z.string(),
  filePath: z.string().optional(),
  line: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: GraphEdgeTypeSchema,
  weight: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ── Timeline (RFC-005/010) ────────────────────────────────

export const EventDomainSchema = z.enum(["editor", "analysis", "agent", "review", "timeline", "graph", "workspace", "policy"]);

export const DevOSEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  workspaceId: z.string(),
  sessionId: z.string().optional(),
  repoId: z.string().optional(),
  agentId: z.string().optional(),
  runtimeId: z.string().optional(),
  domain: EventDomainSchema,
  type: z.string(),
  payload: z.unknown(),
});

export const TimelineEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  domain: EventDomainSchema,
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  agentId: z.string().optional(),
  duration: z.number().optional(),
  severity: z.enum(["info", "warning", "error"]).optional(),
});

export const CheckpointSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  description: z.string(),
  filesChanged: z.array(z.string()),
  snapshotId: z.string().optional(),
});

// ── Verdict (RFC-011) ─────────────────────────────────────

export const SecurityVerdictSchema = z.enum(["clean", "warning", "critical"]);
export const VerdictOutcomeSchema = z.enum(["safe", "warning", "unsafe", "unknown"]);
export const VerdictCategorySchema = z.enum(["impact", "security", "clone", "metrics", "tests"]);
export const VerdictLevelSchema = z.enum(["pass", "warning", "fail"]);
export const PolicyRecommendationSchema = z.enum(["auto_approve", "human_review", "auto_reject"]);

export const ImpactProofSchema = z.object({
  affectedFiles: z.number(),
  affectedFunctions: z.number(),
  affectedModules: z.array(z.string()),
  callChainDepth: z.number(),
});

export const TaintPathSchema = z.object({
  source: z.string(),
  sink: z.string(),
  path: z.array(z.string()),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export const SecurityProofSchema = z.object({
  newVulnerabilities: z.number(),
  fixedVulnerabilities: z.number(),
  taintPaths: z.array(TaintPathSchema),
  verdict: SecurityVerdictSchema,
});

export const CloneFragmentSchema = z.object({
  fileA: z.string(),
  fileB: z.string(),
  lineRangeA: z.tuple([z.number(), z.number()]),
  lineRangeB: z.tuple([z.number(), z.number()]),
  similarity: z.number(),
});

export const CloneProofSchema = z.object({
  newClones: z.number(),
  removedClones: z.number(),
  cloneFragments: z.array(CloneFragmentSchema),
});

export const MetricsProofSchema = z.object({
  complexityDelta: z.number(),
  linesDelta: z.number(),
  maintainabilityDelta: z.number(),
});

export const TestProofSchema = z.object({
  affectedTests: z.number(),
  passingTests: z.number(),
  failingTests: z.number(),
  coverageDelta: z.number(),
  newUncoveredLines: z.number(),
});

export const ProofBundleSchema = z.object({
  id: z.string(),
  patchId: z.string(),
  timestamp: z.number(),
  impact: ImpactProofSchema,
  security: SecurityProofSchema,
  clone: CloneProofSchema,
  metrics: MetricsProofSchema,
  tests: TestProofSchema,
});

export const VerdictReasonSchema = z.object({
  category: VerdictCategorySchema,
  level: VerdictLevelSchema,
  message: z.string(),
});

export const PatchVerdictSchema = z.object({
  id: z.string(),
  proofBundleId: z.string(),
  patchId: z.string(),
  outcome: VerdictOutcomeSchema,
  confidence: z.number(),
  reasons: z.array(VerdictReasonSchema),
  recommendation: PolicyRecommendationSchema,
});
