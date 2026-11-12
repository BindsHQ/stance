'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import {
  getSourceDomain,
  SourceFavicon,
  SourcePreview,
  type Source,
} from '../source-preview/SourcePreview.js';

/** A source in a SourceList: a Source with a stable id. */
export type SourceListItem = Source & { id: string };

export interface SourceListLabels {
  /** The visible heading and accessible name. */
  title: string;
  /** The expand control when sources are hidden. Receives the hidden and total counts. */
  more: (hidden: number, total: number) => string;
  /** The control that collapses the list again. */
  less: string;
  /** Hidden text added to links that open in a new tab. */
  newTab: string;
}

export interface SourceListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The sources behind the answer, in citation order. */
  sources: SourceListItem[];
  /** `inline` is a compact row that expands; `list` shows full rows. Default `inline`. */
  variant?: 'inline' | 'list';
  /** How many sources show before the rest are folded away. Default 3 inline, all in a list. */
  max?: number;
  /** Called when the reader opens a source. */
  onSourceOpen?: (source: SourceListItem) => void;
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Start expanded when uncontrolled. Default false. */
  defaultExpanded?: boolean;
  /** Called when the list expands or collapses. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Link target for sources. Default `_blank`. */
  target?: React.HTMLAttributeAnchorTarget;
  /** Translations for the built in strings. */
  labels?: Partial<SourceListLabels>;
}

/**
 * The sources behind an answer. The inline variant is a compact row of sites that
 * expands to the full numbered list; the list variant shows the full rows.
 */
export const SourceList = React.forwardRef<HTMLDivElement, SourceListProps>(function SourceList(
  {
    sources,
    variant = 'inline',
    max: maxProp,
    onSourceOpen,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    target = '_blank',
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels: SourceListLabels = {
    title: 'Sources',
    more: (hidden) => `+${hidden} more`,
    less: 'Show fewer',
    newTab: 'opens in a new tab',
    ...labelsProp,
  };
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const id = React.useId();
  const titleId = `${id}-title`;
  const listId = `${id}-list`;
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const refocus = React.useRef(false);
  // The control moves below the list when it expands; keep the reader's focus on it.
  React.useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    toggleRef.current?.focus();
  }, [expanded]);
  if (sources.length === 0) return null;

  const max = Math.max(1, maxProp ?? (variant === 'inline' ? 3 : sources.length));
  const hidden = Math.max(0, sources.length - max);
  const visible = expanded ? sources : sources.slice(0, max);
  const newTab = target === '_blank';
  const showChips = variant === 'inline' && !expanded;

  const toggle =
    hidden > 0 ? (
      <button
        ref={toggleRef}
        type="button"
        className="st-source-list__toggle"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => {
          refocus.current = true;
          setExpanded(!expanded);
        }}
      >
        {expanded ? labels.less : labels.more(hidden, sources.length)}
        <Icon name="chevron-down" size={14} className="st-source-list__chevron" />
      </button>
    ) : null;

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={titleId}
      className={cx('st-source-list', className)}
      data-variant={variant}
      data-state={expanded ? 'expanded' : 'collapsed'}
      {...props}
    >
      <div className="st-source-list__header">
        <span id={titleId} className="st-source-list__title">
          {labels.title}
        </span>
        {variant === 'list' && toggle}
      </div>
      {showChips ? (
        <div className="st-source-list__row">
          <ul id={listId} className="st-source-list__chips">
            {visible.map((source, i) => {
              const text = getSourceDomain(source) ?? source.title;
              const content = (
                <>
                  <SourceFavicon src={source.favicon} size={14} />
                  <span className="st-source-list__chip-index">{i + 1}</span>
                  <span className="st-source-list__chip-text">{text}</span>
                  <span className="st-sr-only">
                    : {source.title}
                    {source.url && newTab ? ` (${labels.newTab})` : ''}
                  </span>
                </>
              );
              return (
                <li key={source.id} className="st-source-list__chip-item">
                  {source.url ? (
                    <a
                      className="st-source-list__chip"
                      href={source.url}
                      target={target}
                      rel={newTab ? 'noopener noreferrer' : undefined}
                      onClick={() => onSourceOpen?.(source)}
                    >
                      {content}
                    </a>
                  ) : onSourceOpen ? (
                    <button
                      type="button"
                      className="st-source-list__chip"
                      onClick={() => onSourceOpen(source)}
                    >
                      {content}
                    </button>
                  ) : (
                    <span className="st-source-list__chip" data-static="">
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {toggle}
        </div>
      ) : (
        <>
          <ol id={listId} className="st-source-list__list">
            {visible.map((source, i) => (
              <li key={source.id} className="st-source-list__item">
                <SourcePreview
                  source={source}
                  index={i + 1}
                  size="sm"
                  target={target}
                  labels={{ newTab: labels.newTab }}
                  {...(onSourceOpen && { onOpen: () => onSourceOpen(source) })}
                />
              </li>
            ))}
          </ol>
          {variant === 'inline' && toggle}
        </>
      )}
    </div>
  );
});
