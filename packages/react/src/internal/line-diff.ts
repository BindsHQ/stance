/** One line of a diff hunk. */
export interface DiffLine {
  /** Whether the line was added, removed or is unchanged context. */
  kind: 'add' | 'remove' | 'context';
  /** The text of the line, without a prefix. */
  text: string;
  /** Line number in the old file. Absent on added lines. */
  oldNumber?: number;
  /** Line number in the new file. Absent on removed lines. */
  newNumber?: number;
}

/** A run of changed lines with the context around it. */
export interface DiffHunk {
  /** Stable id, used as the key of the decision. */
  id: string;
  /** The range header, for example `@@ -1,4 +1,5 @@`. */
  header?: string;
  /** The lines, in display order. */
  lines: DiffLine[];
}

export interface DiffLinesOptions {
  /** Unchanged lines kept around each change. Default 3. */
  context?: number;
  /** Prefix for hunk ids, so ids stay unique across files. Default "hunk". */
  idPrefix?: string;
}

const split = (text: string) => (text === '' ? [] : text.replace(/\r\n?/g, '\n').split('\n'));

/**
 * A small line diff (longest common subsequence) that returns hunks in the shape
 * DiffReview takes. Meant for examples and short texts: it uses memory in proportion to
 * the product of the changed line counts.
 */
export function diffLines(
  oldText: string,
  newText: string,
  { context = 3, idPrefix = 'hunk' }: DiffLinesOptions = {},
): DiffHunk[] {
  const a = split(oldText);
  const b = split(newText);
  // Trim the common start and end so the table only covers the changed middle.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const n = endA - start;
  const m = endB - start;
  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[start + i] === b[start + j]
          ? table[(i + 1) * width + j + 1]! + 1
          : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!);
    }
  }

  const lines: DiffLine[] = [];
  const same = (i: number, j: number) =>
    lines.push({ kind: 'context', text: a[i]!, oldNumber: i + 1, newNumber: j + 1 });
  for (let k = 0; k < start; k++) same(k, k);
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[start + i] === b[start + j]) {
      same(start + i, start + j);
      i++;
      j++;
    } else if (i < n && (j >= m || table[(i + 1) * width + j]! >= table[i * width + j + 1]!)) {
      lines.push({ kind: 'remove', text: a[start + i]!, oldNumber: start + i + 1 });
      i++;
    } else {
      lines.push({ kind: 'add', text: b[start + j]!, newNumber: start + j + 1 });
      j++;
    }
  }
  for (let k = 0; endA + k < a.length; k++) same(endA + k, endB + k);

  // Group changes with their context into hunks.
  const keep = Math.max(0, context);
  const changed = lines.flatMap((line, index) => (line.kind === 'context' ? [] : [index]));
  const hunks: DiffHunk[] = [];
  let from = -1;
  let to = -1;
  const flush = () => {
    if (from < 0) return;
    const slice = lines.slice(from, to + 1);
    const olds = slice.filter((l) => l.kind !== 'add');
    const news = slice.filter((l) => l.kind !== 'remove');
    const range = (list: DiffLine[], key: 'oldNumber' | 'newNumber', fallback: number) =>
      `${list[0]?.[key] ?? fallback},${list.length}`;
    // An empty side starts after the last line before the hunk.
    const before = lines.slice(0, from);
    const oldBefore = before.filter((l) => l.kind !== 'add').length;
    const newBefore = before.filter((l) => l.kind !== 'remove').length;
    hunks.push({
      id: `${idPrefix}-${hunks.length + 1}`,
      header: `@@ -${range(olds, 'oldNumber', oldBefore)} +${range(news, 'newNumber', newBefore)} @@`,
      lines: slice,
    });
  };
  for (const index of changed) {
    const lo = Math.max(0, index - keep);
    const hi = Math.min(lines.length - 1, index + keep);
    if (from >= 0 && lo <= to + 1) {
      to = hi;
    } else {
      flush();
      from = lo;
      to = hi;
    }
  }
  flush();
  return hunks;
}
