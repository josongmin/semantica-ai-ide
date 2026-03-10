/**
 * MCP (Model Context Protocol) Types
 */

import type { McpServerId, McpToolCallId } from "./core";

// ─── MCP ───────────────────────────────────────────────────
export type McpServerStatus = "connecting" | "connected" | "disconnected" | "error" | "disabled";
export interface McpServer {
  readonly id: McpServerId;
  readonly name: string;
  readonly url: string;
  readonly status: McpServerStatus;
  readonly enabled: boolean;
  readonly tool_count: number;
  readonly error_message?: string;
}
export interface McpTool {
  readonly name?: string;
  readonly tool_name?: string;
  readonly server_id: McpServerId;
  readonly description: string;
  readonly requires_approval?: boolean;
  readonly input_schema?: Readonly<Record<string, unknown>>;
}
export type McpToolCallStatus = "pending" | "running" | "success" | "error";
export interface McpToolCall {
  readonly id: McpToolCallId;
  readonly turn_id: string;
  readonly server_id: McpServerId;
  readonly tool_name: string;
  readonly args_summary: string;
  readonly status: McpToolCallStatus;
  readonly result_summary?: string;
  readonly duration_ms?: number;
  readonly error_message?: string;
}

// ─── MCP Registry ───────────────────────────────────────────
export interface McpRegistryEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly author: string;
  readonly rating: number;
  readonly install_count: number;
  readonly installed: boolean;
  readonly categories: readonly string[];
  readonly compatibility: string;
}
