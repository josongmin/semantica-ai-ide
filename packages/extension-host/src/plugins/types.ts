export interface ToolDefinitionV1 {
  tool_name: string;
  description: string;
  requires_approval?: boolean;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
}

export interface WorkflowDefinitionV1 {
  workflow_id: string;
  title: string;
  description: string;
  default_mode?: "quick_edit" | "plan" | "review" | "diagnose" | "refactor" | "generate";
}

export interface PluginManifestV1 {
  manifest_version: "plugin-manifest.v1";
  plugin_id: string;
  version: string;
  display_name?: string;
  publisher?: string;
  entry: string;
  compat: {
    agent_protocol_range: string;
    tool_protocol_range: string;
  };
  capabilities?: {
    provides?: string[];
  };
  permissions: {
    requested: string[];
  };
  contributes: {
    tools: ToolDefinitionV1[];
    workflows: WorkflowDefinitionV1[];
  };
}

export type ToolHandler = (input: unknown, ctx: { session_id: string; trace_id: string }) => Promise<unknown>;
export type WorkflowRunner = (ctx: { session_id: string; trace_id: string }) => Promise<void>;
