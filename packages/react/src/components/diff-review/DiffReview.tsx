'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { DiffHunk, DiffLine } from '../../internal/line-diff.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import { useIsOverflowing } from '../../internal/use-is-overflowing.js';

/** One line of a hunk. */
export type DiffReviewLine = DiffLine;
/** A run of changed lines with the context around it. */
export type DiffReviewHunk = DiffHunk;
/** What happened to a file. */
export type DiffReviewFileStatus = 'added' | 'modified' | 'deleted' | 'renamed';
/** The decision on one hunk. A hunk without a decision is pending. */
export type DiffReviewDecision = 'accepted' | 'rejected';
/** Decisions keyed by hunk id. */
export type DiffReviewDecisions = Record<string, DiffReviewDecision>;
/** How the two sides are laid out. */
export type DiffReviewView = 'unified' | 'split';

export interface DiffReviewFile {
  /** Stable id, used for collapsing. */
  id: string;
  /** The path of the file after the change. */
  path: string;
  /** What happened to the file. */
  status: DiffReviewFileStatus;
  /** The path before a rename. */
  previousPath?: string;
  /** The changes in the file. Hunk ids must be unique across all files. */
  hunks: DiffReviewHunk[];
}

export interface DiffReviewLabels {
  /** Accessible name of the whole review. Default "Proposed changes". */
  label: string;
  /** The summary line. Receives file, change and decided counts. */
  summary: (files: number, changes: number, decided: number) => string;
  /** Accept every change. Default "Accept all". */
  acceptAll: string;
  /** Reject every change. Default "Reject all". */
  rejectAll: string;
  /** Accept one change. Default "Accept". */
  accept: string;
  /** Reject one change. Default "Reject". */
  reject: string;
  /** Accept every change in a file. Default "Accept file". */
  acceptFile: string;
  /** Reject every change in a file. Default "Reject file". */
  rejectFile: string;
  /** Name of the view switch. Default "View". */
  view: string;
  /** Default "Unified". */
  unified: string;
  /** Default "Split". */
  split: string;
  /** The words for each file status. */
  fileStatus: Record<DiffReviewFileStatus, string>;
  /** The words for each decision, and for a change that has none. */
  decision: Record<DiffReviewDecision | 'pending', string>;
  /** Names one change. Default "Change 1 of 2 in src/app.ts". */
  hunk: (index: number, count: number, path: string) => string;
  /** Hidden text for the line counts of a file. Default "3 added, 1 removed". */
  counts: (added: number, removed: number) => string;
  /** Hidden word before an added line. Default "Added". */
  added: string;
  /** Hidden word before a removed line. Default "Removed". */
  removed: string;
  /** Hidden word before an unchanged line. Default "Unchanged". */
  unchanged: string;
  /** Hidden heading of the old side in the split view. Default "Before". */
  before: string;
  /** Hidden heading of the new side in the split view. Default "After". */
  after: string;
  /** Hidden text of the rename, given the old path. Default "Renamed from old.ts". */
  renamedFrom: (path: string) => string;
  /** Shown when there are no files. Default "No changes to review". */
  empty: string;
}

export interface DiffReviewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The files that change, each with its hunks. */
  files: DiffReviewFile[];
  /** Controlled decisions, keyed by hunk id. */
  decisions?: DiffReviewDecisions;
  /** Decisions on first render when uncontrolled. */
  defaultDecisions?: DiffReviewDecisions;
  /** Called with the full record whenever a decision changes. */
  onDecisionsChange?: (decisions: DiffReviewDecisions) => void;
  /** Controlled layout: one column or old and new side by side. */
  view?: DiffReviewView;
  /** Layout on first render when uncontrolled. Default `unified`. */
  defaultView?: DiffReviewView;
  /** Called when the reader switches layout. */
  onViewChange?: (view: DiffReviewView) => void;
  /** Called after accept all, once every hunk is marked accepted. */
  onAcceptAll?: () => void;
  /** Called after reject all, once every hunk is marked rejected. */
  onRejectAll?: () => void;
  /** Controlled ids of collapsed files. */
  collapsedIds?: string[];
  /** Collapsed files on first render when uncontrolled. */
  defaultCollapsedIds?: string[];
  /** Called when a file collapses or expands. */
  onCollapsedChange?: (ids: string[]) => void;
  /** Hide accept and reject, for a diff that is only shown. Default false. */
  readOnly?: boolean;
  /** Wrap long lines instead of scrolling sideways. Default false. */
  wrap?: boolean;
  /** Translations for the built in strings. Nested groups can be partial too. */
  labels?: Partial<Omit<DiffReviewLabels, 'fileStatus' | 'decision'>> & {
    fileStatus?: Partial<DiffReviewLabels['fileStatus']>;
    decision?: Partial<DiffReviewLabels['decision']>;
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const defaultLabels: DiffReviewLabels = {
  label: 'Proposed changes',
  summary: (files, changes, decided) =>
    `${plural(files, 'file', 'files')}, ${plural(changes, 'change', 'changes')}, ${decided} decided`,
  acceptAll: 'Accept all',
  rejectAll: 'Reject all',
  accept: 'Accept',
  reject: 'Reject',
  acceptFile: 'Accept file',
  rejectFile: 'Reject file',
  view: 'View',
  unified: 'Unified',
  split: 'Split',
  fileStatus: { added: 'Added', modified: 'Modified', deleted: 'Deleted', renamed: 'Renamed' },
  decision: { accepted: 'Accepted', rejected: 'Rejected', pending: 'Pending' },
  hunk: (index, count, path) => `Change ${index} of ${count} in ${path}`,
  counts: (added, removed) => `${added} added, ${removed} removed`,
  added: 'Added',
  removed: 'Removed',
  unchanged: 'Unchanged',
  before: 'Before',
  after: 'After',
  renamedFrom: (path) => `Renamed from ${path}`,
  empty: 'No changes to review',
};

const PREFIX: Record<DiffReviewLine['kind'], string> = { add: '+', remove: '-', context: ' ' };

interface SplitRow {
  left?: DiffReviewLine | undefined;
  right?: DiffReviewLine | undefined;
}

/** Pairs each run of removed lines with the added lines that follow it. */
function toSplitRows(lines: DiffReviewLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.kind === 'context') {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }
    const removed: DiffReviewLine[] = [];
    const added: DiffReviewLine[] = [];
    while (i < lines.length && lines[i]!.kind === 'remove') removed.push(lines[i++]!);
    while (i < lines.length && lines[i]!.kind === 'add') added.push(lines[i++]!);
    for (let k = 0; k < Math.max(removed.length, added.length); k++)
      rows.push({ left: removed[k], right: added[k] });
  }
  return rows;
}

/**
 * A proposed change shown as a diff, by file and by hunk, with accept and reject for
 * each hunk, each file and everything. Added and removed lines carry a text prefix and
 * a hidden word, so the diff never relies on colour.
 */
export const DiffReview = React.forwardRef<HTMLDivElement, DiffReviewProps>(function DiffReview(
  {
    files,
    decisions: decisionsProp,
    defaultDecisions,
    onDecisionsChange,
    view: viewProp,
    defaultView = 'unified',
    onViewChange,
    onAcceptAll,
    onRejectAll,
    collapsedIds: collapsedProp,
    defaultCollapsedIds,
    onCollapsedChange,
    readOnly = false,
    wrap = false,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels: DiffReviewLabels = {
    ...defaultLabels,
    ...labelsProp,
    fileStatus: { ...defaultLabels.fileStatus, ...labelsProp?.fileStatus },
    decision: { ...defaultLabels.decision, ...labelsProp?.decision },
  };
  const [decisions, setDecisions] = useControllableState<DiffReviewDecisions>({
    value: decisionsProp,
    defaultValue: defaultDecisions ?? {},
    onChange: onDecisionsChange,
  });
  const [view, setView] = useControllableState<DiffReviewView>({
    value: viewProp,
    defaultValue: defaultView,
    onChange: onViewChange,
  });
  const [collapsed, setCollapsed] = useControllableState<string[]>({
    value: collapsedProp,
    defaultValue: defaultCollapsedIds ?? [],
    onChange: onCollapsedChange,
  });
  const { announce, region } = useAnnouncer();
  const baseId = React.useId();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(ref, rootRef);

  const allHunks = files.flatMap((file) => file.hunks);
  const decided = allHunks.filter((hunk) => decisions[hunk.id]).length;

  const decide = (ids: string[], decision: DiffReviewDecision | null) => {
    const next = { ...decisions };
    for (const id of ids) {
      if (decision) next[id] = decision;
      else delete next[id];
    }
    setDecisions(next);
  };

  const toggleHunk = (hunk: DiffReviewHunk, decision: DiffReviewDecision | null, name: string) => {
    const next = decision && decisions[hunk.id] === decision ? null : decision;
    decide([hunk.id], next);
    announce(`${name}, ${labels.decision[next ?? 'pending']}`);
  };

  const moveHunk = (from: HTMLElement, step: 1 | -1) => {
    const hunks = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[data-st-diff-hunk]') ?? [],
    );
    hunks[hunks.indexOf(from) + step]?.focus();
  };

  const renderUnified = (hunk: DiffReviewHunk) => (
    <table className="st-diff-review__lines" role="presentation">
      <tbody>
        {hunk.lines.map((line, i) => (
          <tr key={i} className="st-diff-review__line" data-kind={line.kind}>
            <td className="st-diff-review__number" aria-hidden="true">
              {line.oldNumber}
            </td>
            <td className="st-diff-review__number" aria-hidden="true">
              {line.newNumber}
            </td>
            <td className="st-diff-review__prefix" aria-hidden="true">
              {PREFIX[line.kind]}
            </td>
            <td className="st-diff-review__text">
              <span className="st-sr-only">
                {line.kind === 'add'
                  ? labels.added
                  : line.kind === 'remove'
                    ? labels.removed
                    : labels.unchanged}
                :{' '}
              </span>
              {line.text || '\n'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const splitCells = (line: DiffReviewLine | undefined, side: 'old' | 'new') =>
    line ? (
      <>
        <td className="st-diff-review__number" aria-hidden="true">
          {side === 'old' ? line.oldNumber : line.newNumber}
        </td>
        <td className="st-diff-review__prefix" aria-hidden="true" data-kind={line.kind}>
          {PREFIX[line.kind]}
        </td>
        <td className="st-diff-review__text" data-kind={line.kind} data-side={side}>
          <span className="st-sr-only">
            {side === 'old' ? labels.before : labels.after},{' '}
            {line.kind === 'add'
              ? labels.added
              : line.kind === 'remove'
                ? labels.removed
                : labels.unchanged}
            :{' '}
          </span>
          {line.text || '\n'}
        </td>
      </>
    ) : (
      <td className="st-diff-review__blank" colSpan={3} data-side={side} />
    );

  const renderSplit = (hunk: DiffReviewHunk) => (
    <table className="st-diff-review__lines" role="presentation" data-split="">
      <tbody>
        {toSplitRows(hunk.lines).map((row, i) => (
          <tr key={i} className="st-diff-review__line">
            {splitCells(row.left, 'old')}
            {splitCells(row.right, 'new')}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div
      ref={composedRef}
      role="group"
      aria-label={labels.label}
      className={cx('st-diff-review', className)}
      data-view={view}
      data-wrap={wrap ? '' : undefined}
      {...props}
    >
      <div className="st-diff-review__toolbar">
        <span className="st-diff-review__summary">
          {labels.summary(files.length, allHunks.length, decided)}
        </span>
        <span className="st-diff-review__toolbar-actions">
          <span className="st-diff-review__views" role="group" aria-label={labels.view}>
            {(['unified', 'split'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className="st-diff-review__view"
                aria-pressed={view === option}
                onClick={() => setView(option)}
              >
                {labels[option]}
              </button>
            ))}
          </span>
          {!readOnly && allHunks.length > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  decide(
                    allHunks.map((hunk) => hunk.id),
                    'rejected',
                  );
                  announce(`${labels.rejectAll}: ${labels.decision.rejected}`);
                  onRejectAll?.();
                }}
              >
                {labels.rejectAll}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  decide(
                    allHunks.map((hunk) => hunk.id),
                    'accepted',
                  );
                  announce(`${labels.acceptAll}: ${labels.decision.accepted}`);
                  onAcceptAll?.();
                }}
              >
                {labels.acceptAll}
              </Button>
            </>
          )}
        </span>
      </div>
      {files.length === 0 && <p className="st-diff-review__empty">{labels.empty}</p>}
      {files.map((file, fileIndex) => {
        const isCollapsed = collapsed.includes(file.id);
        const bodyId = `${baseId}-file-${fileIndex}`;
        const lines = file.hunks.flatMap((hunk) => hunk.lines);
        const added = lines.filter((line) => line.kind === 'add').length;
        const removed = lines.filter((line) => line.kind === 'remove').length;
        const hunkIds = file.hunks.map((hunk) => hunk.id);
        return (
          <div
            key={file.id}
            role="group"
            className="st-diff-review__file"
            aria-label={file.path}
            data-status={file.status}
          >
            <div className="st-diff-review__file-header">
              <button
                type="button"
                className="st-diff-review__file-toggle"
                aria-expanded={!isCollapsed}
                aria-controls={bodyId}
                onClick={() =>
                  setCollapsed(
                    isCollapsed
                      ? collapsed.filter((id) => id !== file.id)
                      : [...collapsed, file.id],
                  )
                }
              >
                <Icon name="chevron-down" size={14} className="st-diff-review__chevron" />
                <span className="st-diff-review__path">{file.path}</span>
              </button>
              <span className="st-diff-review__file-meta">
                <span className="st-diff-review__file-status">
                  {labels.fileStatus[file.status]}
                  {file.status === 'renamed' && file.previousPath && (
                    <span className="st-sr-only">, {labels.renamedFrom(file.previousPath)}</span>
                  )}
                </span>
                <span className="st-diff-review__counts">
                  <span aria-hidden="true">
                    <span data-kind="add">+{added}</span> <span data-kind="remove">-{removed}</span>
                  </span>
                  <span className="st-sr-only">{labels.counts(added, removed)}</span>
                </span>
              </span>
              {!readOnly && file.hunks.length > 0 && (
                <span className="st-diff-review__file-actions">
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`${labels.rejectFile}: ${file.path}`}
                    onClick={() => {
                      decide(hunkIds, 'rejected');
                      announce(`${file.path}, ${labels.decision.rejected}`);
                    }}
                  >
                    {labels.rejectFile}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`${labels.acceptFile}: ${file.path}`}
                    onClick={() => {
                      decide(hunkIds, 'accepted');
                      announce(`${file.path}, ${labels.decision.accepted}`);
                    }}
                  >
                    {labels.acceptFile}
                  </Button>
                </span>
              )}
            </div>
            <div id={bodyId} className="st-diff-review__file-body" hidden={isCollapsed}>
              {!isCollapsed &&
                file.hunks.map((hunk, hunkIndex) => {
                  const decision = decisions[hunk.id];
                  const name = labels.hunk(hunkIndex + 1, file.hunks.length, file.path);
                  const state = labels.decision[decision ?? 'pending'];
                  return (
                    <div
                      key={hunk.id}
                      role="group"
                      aria-label={`${name}, ${state}`}
                      tabIndex={0}
                      className="st-diff-review__hunk"
                      data-st-diff-hunk=""
                      data-decision={decision ?? 'pending'}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.ctrlKey || event.metaKey || event.altKey) return;
                        const key = event.key.toLowerCase();
                        if (key === 'arrowdown' || key === 'j') moveHunk(event.currentTarget, 1);
                        else if (key === 'arrowup' || key === 'k')
                          moveHunk(event.currentTarget, -1);
                        else if (key === 'a' && !readOnly) toggleHunk(hunk, 'accepted', name);
                        else if (key === 'r' && !readOnly) toggleHunk(hunk, 'rejected', name);
                        else if (key === 'u' && !readOnly) toggleHunk(hunk, null, name);
                        else return;
                        event.preventDefault();
                      }}
                    >
                      <div className="st-diff-review__hunk-header">
                        <span className="st-diff-review__hunk-range">{hunk.header}</span>
                        <span className="st-diff-review__hunk-actions">
                          <span className="st-diff-review__decision">
                            {decision && (
                              <Icon name={decision === 'accepted' ? 'check' : 'x'} size={12} />
                            )}
                            {state}
                          </span>
                          {!readOnly && (
                            <>
                              <button
                                type="button"
                                className="st-diff-review__choice"
                                aria-pressed={decision === 'rejected'}
                                aria-label={`${labels.reject}: ${name}`}
                                onClick={() => toggleHunk(hunk, 'rejected', name)}
                              >
                                {labels.reject}
                              </button>
                              <button
                                type="button"
                                className="st-diff-review__choice"
                                aria-pressed={decision === 'accepted'}
                                aria-label={`${labels.accept}: ${name}`}
                                onClick={() => toggleHunk(hunk, 'accepted', name)}
                              >
                                {labels.accept}
                              </button>
                            </>
                          )}
                        </span>
                      </div>
                      <HunkScroll label={hunk.header}>
                        {view === 'split' ? renderSplit(hunk) : renderUnified(hunk)}
                      </HunkScroll>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
      {region}
    </div>
  );
});

/**
 * The horizontally scrolling body of a hunk. Long lines scroll sideways, so when they do the
 * body joins the tab order and arrow keys can scroll it (WCAG 2.1.1). Short hunks add no stop.
 */
function HunkScroll({ label, children }: { label?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const overflowing = useIsOverflowing(ref);
  return (
    <div
      ref={ref}
      className="st-diff-review__scroll"
      {...(overflowing && { tabIndex: 0, role: 'group', 'aria-label': label ?? 'Lines' })}
    >
      {children}
    </div>
  );
}
