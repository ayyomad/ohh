/**
 * Relative time for the "EDITED <t>" metadata. Pure: both input and "now"
 * are injectable, so tests are deterministic.
 */

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMinutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} d ago`;
  }
  const year = then.getFullYear();
  const month = String(then.getMonth() + 1).padStart(2, "0");
  const day = String(then.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
