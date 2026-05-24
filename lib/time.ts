/**
 * Relative time formatter (Japanese).
 * Returns strings like "たった今", "5分前", "3時間前", "2日前", "2026-05-01".
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'たった今';
  const min = Math.floor(diff / 60_000);
  if (min < 1)  return 'たった今';
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7)  return `${day}日前`;
  return d.toISOString().slice(0, 10);
}
