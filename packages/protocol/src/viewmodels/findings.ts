export interface FindingsDashboardViewModel {
  readonly totalFindings: number;
  readonly bySeverity: Record<string, number>;
  readonly byCategory: Record<string, number>;
  readonly findings: FindingItem[];
}

export interface FindingItem {
  readonly id: string;
  readonly title: string;
  readonly severity: "critical" | "high" | "medium" | "low" | "info";
  readonly category: string;
  readonly filePath: string;
  readonly line: number;
  readonly description: string;
}
