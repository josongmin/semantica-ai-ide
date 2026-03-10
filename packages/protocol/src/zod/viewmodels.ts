import { z } from "zod";
import {
  AgentUnitSchema,
  AgentStepSchema,
  GraphNodeSchema,
  GraphEdgeSchema,
  ImpactSummarySchema,
  SecuritySummarySchema,
  CloneSummarySchema,
  MetricsSummarySchema,
  TestImpactSummarySchema,
  TimelineEventSchema,
  CheckpointSchema,
  TaskNodeSchema,
  CandidateArtifactSchema,
  OrchestratorRunSchema,
} from "./models.js";

// ── Editor ────────────────────────────────────────────────

export const DiagnosticItemSchema = z.object({
  line: z.number(),
  column: z.number(),
  severity: z.enum(["error", "warning", "info", "hint"]),
  message: z.string(),
  source: z.string().optional(),
  code: z.string().optional(),
});

export const EditorDiagnosticViewModelSchema = z.object({
  filePath: z.string(),
  diagnostics: z.array(DiagnosticItemSchema),
});

export const SymbolItemSchema = z.object({
  name: z.string(),
  kind: z.string(),
  filePath: z.string(),
  line: z.number(),
  column: z.number(),
  containerName: z.string().optional(),
});

export const SymbolNavigationViewModelSchema = z.object({
  symbols: z.array(SymbolItemSchema),
});

// ── Impact ────────────────────────────────────────────────

export const ImpactNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["function", "class", "module", "file"]),
  filePath: z.string(),
  impactLevel: z.enum(["direct", "transitive"]),
});

export const ImpactEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(["calls", "imports", "extends"]),
});

export const ImpactGraphViewModelSchema = z.object({
  rootSymbol: z.string(),
  nodes: z.array(ImpactNodeSchema),
  edges: z.array(ImpactEdgeSchema),
  totalAffected: z.number(),
});

// ── Slice ─────────────────────────────────────────────────

export const SliceStatementSchema = z.object({
  filePath: z.string(),
  line: z.number(),
  content: z.string(),
  isRelevant: z.boolean(),
});

export const SliceViewModelSchema = z.object({
  criterion: z.string(),
  direction: z.enum(["forward", "backward", "both"]),
  statements: z.array(SliceStatementSchema),
  coverage: z.number(),
});

// ── Review ────────────────────────────────────────────────

export const ProofVerdictViewSchema = z.object({
  outcome: z.enum(["safe", "warning", "unsafe", "unknown"]),
  confidence: z.number(),
  recommendation: z.enum(["auto_approve", "human_review", "auto_reject"]),
  reasons: z.array(z.object({
    category: z.string(),
    level: z.string(),
    message: z.string(),
  })),
});

export const ReviewEvidenceViewModelSchema = z.object({
  patchId: z.string(),
  summary: z.string(),
  impact: ImpactSummarySchema,
  security: SecuritySummarySchema,
  clone: CloneSummarySchema,
  metrics: MetricsSummarySchema,
  tests: TestImpactSummarySchema,
  proofVerdict: ProofVerdictViewSchema.optional(),
  overallRisk: z.enum(["low", "medium", "high", "critical"]),
});

// ── Findings ──────────────────────────────────────────────

export const FindingItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  category: z.string(),
  filePath: z.string(),
  line: z.number(),
  description: z.string(),
});

export const FindingsDashboardViewModelSchema = z.object({
  totalFindings: z.number(),
  bySeverity: z.record(z.number()),
  byCategory: z.record(z.number()),
  findings: z.array(FindingItemSchema),
});

// ── Replay ────────────────────────────────────────────────

export const ReplayTimelineViewModelSchema = z.object({
  events: z.array(TimelineEventSchema),
  checkpoints: z.array(CheckpointSchema),
  totalDuration: z.number(),
  currentPosition: z.number().optional(),
});

// ── Agent ─────────────────────────────────────────────────

export const AgentUnitViewSchema = AgentUnitSchema.extend({
  steps: z.array(AgentStepSchema),
  elapsedMs: z.number().optional(),
});

export const AgentRunViewModelSchema = z.object({
  agents: z.array(AgentUnitViewSchema),
  activeCount: z.number(),
  completedCount: z.number(),
  failedCount: z.number(),
});

// ── Approval ──────────────────────────────────────────────

export const ApprovalItemViewSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  description: z.string(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  createdAt: z.number(),
  agentId: z.string().optional(),
  toolName: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "timeout"]),
});

export const ApprovalQueueViewModelSchema = z.object({
  items: z.array(ApprovalItemViewSchema),
  pendingCount: z.number(),
});

// ── Context ───────────────────────────────────────────────

export const ContextFileSchema = z.object({
  path: z.string(),
  relevance: z.number(),
  tokenCount: z.number(),
});

export const ContextSymbolSchema = z.object({
  name: z.string(),
  kind: z.string(),
  filePath: z.string(),
  relevance: z.number(),
});

export const ContextPackViewModelSchema = z.object({
  files: z.array(ContextFileSchema),
  symbols: z.array(ContextSymbolSchema),
  totalTokens: z.number(),
});

// ── Orchestrator ──────────────────────────────────────────

export const OrchestratorRunViewSchema = OrchestratorRunSchema.extend({
  elapsedMs: z.number(),
  taskCount: z.number(),
  agentCount: z.number(),
});

export const TaskNodeViewSchema = TaskNodeSchema.extend({
  agentName: z.string().optional(),
  elapsedMs: z.number().optional(),
  isBlocked: z.boolean(),
  blockedBy: z.array(z.string()),
});

export const OrchestratorAgentUnitViewSchema = AgentUnitSchema.extend({
  taskTitle: z.string().optional(),
  elapsedMs: z.number().optional(),
});

export const CandidateArtifactViewSchema = CandidateArtifactSchema.extend({
  agentName: z.string(),
  taskTitle: z.string(),
});

export const OrchestratorApprovalItemViewSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  description: z.string(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  createdAt: z.number(),
  status: z.enum(["pending", "approved", "rejected", "timeout"]),
});

export const CandidateScoreSchema = z.object({
  candidateId: z.string(),
  score: z.number(),
  reasons: z.array(z.string()),
});

export const ConvergenceViewSchema = z.object({
  mode: z.enum(["single_candidate", "multi_candidate_compare", "repair_loop"]),
  selectedCandidateId: z.string().optional(),
  candidateScores: z.array(CandidateScoreSchema),
});

export const MultiAgentOrchestratorViewModelSchema = z.object({
  orchestrator: OrchestratorRunViewSchema,
  tasks: z.array(TaskNodeViewSchema),
  agents: z.array(OrchestratorAgentUnitViewSchema),
  candidates: z.array(CandidateArtifactViewSchema),
  approvals: z.array(OrchestratorApprovalItemViewSchema),
  convergence: ConvergenceViewSchema.optional(),
});

// ── Graph ─────────────────────────────────────────────────

export const KnowledgeGraphViewModelSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  totalNodes: z.number(),
  totalEdges: z.number(),
  layoutType: z.enum(["force", "hierarchy", "radial", "grid"]),
});
