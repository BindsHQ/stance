import { describe, expect, it } from 'vitest';
import { diffLines } from './line-diff';

const kinds = (text: string, next: string, context?: number) =>
  diffLines(text, next, context === undefined ? {} : { context }).map((h) =>
    h.lines.map((l) => `${l.kind === 'add' ? '+' : l.kind === 'remove' ? '-' : ' '}${l.text}`),
  );

describe('diffLines', () => {
  it('returns no hunks for identical text', () => {
    expect(diffLines('a\nb', 'a\nb')).toEqual([]);
    expect(diffLines('', '')).toEqual([]);
  });

  it('marks a changed line as a removal followed by an addition', () => {
    expect(kinds('a\nb\nc', 'a\nx\nc')).toEqual([[' a', '-b', '+x', ' c']]);
  });

  it('numbers lines on both sides', () => {
    const [hunk] = diffLines('a\nb\nc', 'a\nc\nd');
    expect(hunk!.lines).toEqual([
      { kind: 'context', text: 'a', oldNumber: 1, newNumber: 1 },
      { kind: 'remove', text: 'b', oldNumber: 2 },
      { kind: 'context', text: 'c', oldNumber: 3, newNumber: 2 },
      { kind: 'add', text: 'd', newNumber: 3 },
    ]);
    expect(hunk!.header).toBe('@@ -1,3 +1,3 @@');
  });

  it('handles a new file and a deleted file', () => {
    expect(kinds('', 'a\nb')).toEqual([['+a', '+b']]);
    expect(kinds('a\nb', '')).toEqual([['-a', '-b']]);
    expect(diffLines('', 'a\nb')[0]!.header).toBe('@@ -0,0 +1,2 @@');
    expect(diffLines('a\nb', '')[0]!.header).toBe('@@ -1,2 +0,0 @@');
  });

  it('splits distant changes into hunks and merges close ones', () => {
    const old = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const next = [...old];
    next[1] = 'changed 2';
    next[17] = 'changed 18';
    const far = diffLines(old.join('\n'), next.join('\n'), { context: 2 });
    expect(far).toHaveLength(2);
    expect(far.map((h) => h.id)).toEqual(['hunk-1', 'hunk-2']);
    expect(far[1]!.header).toBe('@@ -16,5 +16,5 @@');
    next[4] = 'changed 5';
    const near = diffLines(old.join('\n'), next.join('\n'), { context: 2, idPrefix: 'a' });
    expect(near).toHaveLength(2);
    expect(near[0]!.id).toBe('a-1');
    expect(near[0]!.lines.filter((l) => l.kind === 'add')).toHaveLength(2);
  });

  it('supports zero context and Windows line endings', () => {
    expect(kinds('a\r\nb\r\nc', 'a\nB\nc', 0)).toEqual([['-b', '+B']]);
  });

  it('rebuilds both texts from the hunks of a full context diff', () => {
    const old = 'one\ntwo\nthree\nfour\nfive';
    const next = 'zero\none\nthree\nfour\nfive\nsix';
    const lines = diffLines(old, next, { context: 100 }).flatMap((h) => h.lines);
    expect(
      lines
        .filter((l) => l.kind !== 'add')
        .map((l) => l.text)
        .join('\n'),
    ).toBe(old);
    expect(
      lines
        .filter((l) => l.kind !== 'remove')
        .map((l) => l.text)
        .join('\n'),
    ).toBe(next);
  });
});
