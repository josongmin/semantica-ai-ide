/**
 * Validates that a MessageEvent originates from a trusted source.
 * Rejects cross-origin messages that could inject commands.
 *
 * - Production: only vscode-webview:// origins
 * - Development: vscode-webview:// + localhost/127.0.0.1
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (import.meta.env.PROD) {
    return !!origin && origin.startsWith("vscode-webview://");
  }

  // Dev: empty origin is OK (same-origin postMessage)
  if (!origin) return true;

  if (origin.startsWith("vscode-webview://")) return true;

  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    /* Invalid URL format — treat as untrusted origin */
    return false;
  }
}
