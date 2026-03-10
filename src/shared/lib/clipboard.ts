/** Thin wrapper for navigator.clipboard — enables reliable mocking in tests. */
export function writeToClipboard(text: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- clipboard API may not exist in all environments
  if (navigator.clipboard === undefined) {
    return Promise.reject(new Error("Clipboard API not available in this context"));
  }
  return navigator.clipboard.writeText(text);
}
