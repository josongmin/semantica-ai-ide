export type DateGroup = "Pinned" | "Today" | "Yesterday" | "This Week" | "This Month" | "Older";

export const DATE_GROUP_ORDER: readonly DateGroup[] = [
  "Pinned",
  "Today",
  "Yesterday",
  "This Week",
  "This Month",
  "Older",
];

export function getDateGroup(timestampMs: number): DateGroup {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const dayOfWeek = now.getDay(); // 0=Sun
  const startOfWeek = startOfToday - dayOfWeek * 86_400_000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  if (timestampMs >= startOfToday) return "Today";
  if (timestampMs >= startOfYesterday) return "Yesterday";
  if (timestampMs >= startOfWeek) return "This Week";
  if (timestampMs >= startOfMonth) return "This Month";
  return "Older";
}

export function toStatusDotStatus(
  status: string,
): "idle" | "running" | "success" | "error" | "paused" {
  switch (status) {
    case "running":
      return "running";
    case "error":
      return "error";
    case "paused":
      return "paused";
    case "completed":
      return "success";
    default:
      return "idle";
  }
}
