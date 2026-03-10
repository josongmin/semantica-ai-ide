export type PlatformKind = "vscode" | "tauri" | "browser"

export function detectPlatform(): PlatformKind {
  // Check for Tauri first (more specific)
  if (typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_INTERNALS__" in window)) return "tauri"
  // Check for VSCode webview API
  if (typeof acquireVsCodeApi === "function") return "vscode"
  // Fallback to browser (dev mode)
  return "browser"
}

declare function acquireVsCodeApi(): unknown
