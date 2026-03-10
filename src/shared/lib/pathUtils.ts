/** Cross-platform: extract file name from path (handles both / and \) */
export function extractFileName(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  return normalized.split("/").pop() || path;
}

/** Cross-platform: extract directory from path (handles both / and \) */
export function extractDirPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts.slice(0, -1).join("/");
}
