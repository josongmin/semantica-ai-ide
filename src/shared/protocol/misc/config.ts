/**
 * Configuration & Integration Types
 *
 * TeamConfig, PromptTemplate, ContextSpace, IntegrationConnection, LinkedTicket.
 */

// ─── Team Config ────────────────────────────────────────────
export type TeamConfigStatus = "same" | "different" | "local_only" | "team_only";

export interface TeamConfig {
  readonly key: string;
  readonly local_value: string;
  readonly team_value: string;
  readonly status: TeamConfigStatus;
}

export type ConfigChoice = "local" | "team" | "merge";

// ─── Prompt Template ────────────────────────────────────────
export type PromptTemplateScope = "personal" | "team";

export interface PromptTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly template: string;
  readonly scope: PromptTemplateScope;
  readonly category?: string;
  readonly created_by?: string;
}

// ─── Context Space ──────────────────────────────────────────
export interface ContextSpace {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly files: readonly string[];
  readonly rules: readonly string[];
  readonly active: boolean;
  readonly created_by?: string;
}

// ─── Integration Connection ─────────────────────────────────
export type IntegrationPlatform = "slack" | "teams" | "discord" | "custom";
export type IntegrationStatus = "connected" | "disconnected" | "syncing";

export interface IntegrationConnection {
  readonly id: string;
  readonly platform: IntegrationPlatform;
  readonly channel: string;
  readonly status: IntegrationStatus;
  readonly last_sync_ms?: number;
}

// ─── Linked Ticket ──────────────────────────────────────────
export type TicketPlatform = "linear" | "jira" | "github";

export interface LinkedTicket {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly status: string;
  readonly platform: TicketPlatform;
  readonly url: string;
}
