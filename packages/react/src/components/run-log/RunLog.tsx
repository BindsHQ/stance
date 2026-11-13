'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { copyToClipboard } from '../../internal/use-clipboard.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { useVirtual } from '../../internal/virtual.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';

/** The severity of a log line. */
export type RunLogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface RunLogEntry {
  /** Stable id. */
  id: string;
  /** The time of the line, already formatted, for example 14:02:11. */
  time?: string;
  /** The severity of the line. */
  level: RunLogLevel;
  /** The text of the line. */
  text: string;
}

export interface RunLogLabels {
  /** Accessible name of the log. Default "Run log". */
  label: string;
  /** Name of the level filter. Default "Levels". */
  levels: string;
  /** The words for each level, shown on every line and in the filter. */
  level: Record<RunLogLevel, string>;
  /** Copy button. Default "Copy". */
  copy: string;
  /** Announced and shown after copying. Default "Copied". */
  copied: string;
  /** Button that returns to the newest line. Default "Jump to latest". */
  latest: string;
  /** Shown when no line matches. Default "No log lines". */
  empty: string;
  /** Builds the announcement for a new error. Default "Error: text". */
  errorAnnouncement: (text: string) => string;
  /** The count of shown lines. Default "12 lines". */
  count: (shown: number, total: number) => string;
}

export interface RunLogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onCopy'> {
  /** The lines, oldest first. */
  entries: RunLogEntry[];
  /**
   * Follow the newest line while the reader is at the bottom. Scrolling up releases the
   * log; returning to the bottom follows again. Default true.
   */
  follow?: boolean;
  /** Controlled list of levels to show. */
  levels?: RunLogLevel[];
  /** Levels shown on first render when uncontrolled. Default all four. */
  defaultLevels?: RunLogLevel[];
  /** Called when the reader changes the level filter. */
  onLevelsChange?: (levels: RunLogLevel[]) => void;
  /** Wrap long lines instead of scrolling sideways. Default false. */
  wrap?: boolean;
  /** Height of the log before it scrolls, as a number of px or a CSS length. Default 320. */
  maxHeight?: number | string;
  /** Called with the copied text. Copies the shown lines to the clipboard either way. */
  onCopy?: (text: string) => void;
  /** Show the level filter and copy toolbar. Default true. */
  showToolbar?: boolean;
  /** Translations for the built in strings. Nested groups can be partial too. */
  labels?: Partial<Omit<RunLogLabels, 'level'>> & { level?: Partial<Record<RunLogLevel, string>> };
}

const ALL_LEVELS: RunLogLevel[] = ['error', 'warn', 'info', 'debug'];
const LINE_HEIGHT = 20;

const defaultLabels: RunLogLabels = {
  label: 'Run log',
  levels: 'Levels',
  level: { info: 'Info', warn: 'Warning', error: 'Error', debug: 'Debug' },
  copy: 'Copy',
  copied: 'Copied',
  latest: 'Jump to latest',
  empty: 'No log lines',
  errorAnnouncement: (text) => `Error: ${text}`,
  count: (shown, total) =>
    shown === total
      ? `${total} ${total === 1 ? 'line' : 'lines'}`
      : `${shown} of ${total} ${total === 1 ? 'line' : 'lines'}`,
};

/**
 * A live, monospaced log of an agent run. It follows the newest line until the reader
 * scrolls up, renders only the lines in view, filters by level and copies what is shown.
 */
export const RunLog = React.forwardRef<HTMLDivElement, RunLogProps>(function RunLog(
  {
    entries,
    follow = true,
    levels: levelsProp,
    defaultLevels = ALL_LEVELS,
    onLevelsChange,
    wrap = false,
    maxHeight = 320,
    onCopy,
    showToolbar = true,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels: RunLogLabels = {
    ...defaultLabels,
    ...labelsProp,
    level: { ...defaultLabels.level, ...labelsProp?.level },
  };
  const [levels, setLevels] = useControllableState<RunLogLevel[]>({
    value: levelsProp,
    defaultValue: defaultLevels,
    onChange: onLevelsChange,
  });
  const shown = React.useMemo(
    () => entries.filter((entry) => levels.includes(entry.level)),
    [entries, levels],
  );
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const { announce, region } = useAnnouncer();
  const [copied, setCopied] = React.useState(false);
  const copiedTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const { items, totalSize, measureElement } = useVirtual({
    count: shown.length,
    scrollRef: viewportRef,
    itemSize: wrap ? undefined : LINE_HEIGHT,
    estimatedItemSize: LINE_HEIGHT,
    overscan: 8,
    initialViewportSize: typeof maxHeight === 'number' ? maxHeight : 320,
  });

  // Follow the tail: stuck starts true so the log opens at the newest line.
  const stuckRef = React.useRef(true);
  const lastTopRef = React.useRef(0);
  const [atBottom, setAtBottom] = React.useState(true);
  const isAtBottom = () => {
    const viewport = viewportRef.current;
    if (!viewport) return true;
    return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= LINE_HEIGHT;
  };
  const scrollToLatest = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    stuckRef.current = true;
    viewport.scrollTop = viewport.scrollHeight;
    lastTopRef.current = viewport.scrollTop;
    setAtBottom(true);
  }, []);
  useIsomorphicLayoutEffect(() => {
    if (follow && stuckRef.current) scrollToLatest();
    else setAtBottom(isAtBottom());
  }, [totalSize, shown.length, follow, scrollToLatest]);
  const onScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const bottom = isAtBottom();
    // Only an upward move releases the log, so growth while following keeps it stuck.
    if (bottom) stuckRef.current = true;
    else if (viewport.scrollTop < lastTopRef.current) stuckRef.current = false;
    lastTopRef.current = viewport.scrollTop;
    setAtBottom(bottom);
  };

  // Only errors are announced, and only those that arrive after the first render.
  const seen = React.useRef<Set<string> | null>(null);
  const errorLabel = React.useRef(labels.errorAnnouncement);
  errorLabel.current = labels.errorAnnouncement;
  React.useEffect(() => {
    const first = seen.current === null;
    const known = seen.current ?? new Set<string>();
    let latest: RunLogEntry | undefined;
    for (const entry of entries) {
      if (known.has(entry.id)) continue;
      known.add(entry.id);
      if (entry.level === 'error') latest = entry;
    }
    seen.current = known;
    if (!first && latest) announce(errorLabel.current(latest.text));
  }, [entries, announce]);

  const copy = async () => {
    const text = shown
      .map((entry) =>
        [entry.time, labels.level[entry.level].toUpperCase(), entry.text].filter(Boolean).join(' '),
      )
      .join('\n');
    onCopy?.(text);
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    announce(labels.copied);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const toggleLevel = (level: RunLogLevel) =>
    setLevels(
      levels.includes(level)
        ? levels.filter((l) => l !== level)
        : ALL_LEVELS.filter((l) => l === level || levels.includes(l)),
    );

  return (
    <div
      ref={ref}
      className={cx('st-run-log', className)}
      data-wrap={wrap ? '' : undefined}
      data-at-bottom={atBottom ? '' : undefined}
      {...props}
    >
      {showToolbar && (
        <div className="st-run-log__toolbar">
          <span className="st-run-log__levels" role="group" aria-label={labels.levels}>
            {ALL_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className="st-run-log__level-toggle"
                data-level={level}
                aria-pressed={levels.includes(level)}
                onClick={() => toggleLevel(level)}
              >
                {labels.level[level]}
                <span className="st-run-log__level-count">
                  {entries.reduce((n, entry) => n + (entry.level === level ? 1 : 0), 0)}
                </span>
              </button>
            ))}
          </span>
          <span className="st-run-log__tools">
            <span className="st-run-log__count">{labels.count(shown.length, entries.length)}</span>
            <Button
              size="xs"
              variant="ghost"
              leadingIcon={<Icon name={copied ? 'clipboard-check' : 'copy'} size={14} />}
              disabled={shown.length === 0}
              onClick={copy}
            >
              {copied ? labels.copied : labels.copy}
            </Button>
          </span>
        </div>
      )}
      <div className="st-run-log__body">
        <div
          ref={viewportRef}
          className="st-run-log__viewport"
          role="log"
          aria-label={labels.label}
          // The log itself stays silent: new errors are spoken by the announcer instead.
          aria-live="off"
          tabIndex={0}
          style={{ maxBlockSize: maxHeight }}
          onScroll={onScroll}
        >
          {shown.length === 0 ? (
            <p className="st-run-log__empty">{labels.empty}</p>
          ) : (
            <div className="st-run-log__lines" style={{ blockSize: totalSize }}>
              {items.map(({ index, start }) => {
                const entry = shown[index]!;
                return (
                  <div
                    key={entry.id}
                    ref={measureElement}
                    data-index={index}
                    className="st-run-log__line"
                    data-level={entry.level}
                    style={{ insetBlockStart: start }}
                  >
                    {entry.time && <span className="st-run-log__time">{entry.time}</span>}
                    <span className="st-run-log__level">{labels.level[entry.level]}</span>
                    <span className="st-run-log__text">{entry.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!atBottom && (
          <button type="button" className="st-run-log__latest" onClick={scrollToLatest}>
            <Icon name="arrow-down" size={14} />
            {labels.latest}
          </button>
        )}
      </div>
      {region}
    </div>
  );
});
