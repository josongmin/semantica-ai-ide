/**
 * Smart cost formatter — shows just enough precision to be meaningful.
 *
 * - `>= $0.01`: 2 decimal places  → "$1.23", "$0.42", "$0.13"
 * - `>= $0.001`: 3 decimal places → "$0.005"
 * - `< $0.001`: 4 decimal places  → "$0.0001"
 * - `0`: "$0.00"
 */
export function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  if (usd >= 0.001) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(4)}`;
}

/** Format token count with K/M suffixes */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatRelativeTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
