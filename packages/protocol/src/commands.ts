export type DevOSCommand =
  | { readonly type: "query.impact"; readonly symbolId: string }
  | { readonly type: "query.slice"; readonly symbolId: string; readonly direction: "forward" | "backward" }
  | { readonly type: "query.callGraph"; readonly symbolId: string; readonly depth: number }
  | { readonly type: "query.review"; readonly patchId: string }
  | { readonly type: "query.findings"; readonly scope: "file" | "module" | "workspace" }
  | { readonly type: "query.graph"; readonly graphType: "symbol" | "call" | "dependency" | "service" }
  | { readonly type: "replay.seek"; readonly eventId: string }
  | { readonly type: "replay.checkpoint"; readonly checkpointId: string }
  | { readonly type: "agent.pause"; readonly agentId: string }
  | { readonly type: "agent.resume"; readonly agentId: string }
  | { readonly type: "agent.cancel"; readonly agentId: string }
  | { readonly type: "orchestrator.approve"; readonly candidateId: string }
  | { readonly type: "orchestrator.reject"; readonly candidateId: string }
  | { readonly type: "approval.decide"; readonly actionId: string; readonly approved: boolean }
  | { readonly type: "navigate.surface"; readonly surface: SurfaceName }
  | { readonly type: "navigate.file"; readonly filePath: string; readonly line?: number }

export type SurfaceName = "editor" | "review" | "replay" | "agent" | "graph" | "orchestrator" | "chat"
