/**
 * A small fuzzy scorer for command menus. Returns 0 for no match, higher is better:
 * exact > prefix > word-prefix > substring > in-order subsequence.
 */
export function fuzzyScore(text: string, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  const words = t.split(/[\s\-_/.]+/);
  if (words.some((w) => w.startsWith(q))) return 60;
  const idx = t.indexOf(q);
  if (idx >= 0) return 40 - Math.min(idx, 20);
  // Subsequence: every query character appears in order.
  let ti = 0;
  let gaps = 0;
  for (const ch of q) {
    if (ch === ' ') continue;
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    gaps += found - ti;
    ti = found + 1;
  }
  return Math.max(1, 20 - gaps);
}
