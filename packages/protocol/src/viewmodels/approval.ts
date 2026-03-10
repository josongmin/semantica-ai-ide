export interface ApprovalQueueViewModel {
  readonly items: ApprovalItemView[];
  readonly pendingCount: number;
}

export interface ApprovalItemView {
  readonly id: string;
  readonly actionId: string;
  readonly description: string;
  readonly riskLevel: "low" | "medium" | "high" | "critical";
  readonly createdAt: number;
  readonly agentId?: string;
  readonly toolName?: string;
  readonly status: "pending" | "approved" | "rejected" | "timeout";
}
