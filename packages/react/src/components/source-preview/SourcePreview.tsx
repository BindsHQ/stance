'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

/** One source behind an answer. Shared by SourcePreview, CitationChip and SourceList. */
export interface Source {
  /** The title of the page or document. */
  title: string;
  /** Where the source lives. Makes the title a link. */
  url?: string;
  /** The site name to show, for example "docs.example.com". Derived from `url` when omitted. */
  domain?: string;
  /** URL of a small site icon. A globe is shown when it is missing or fails to load. */
  favicon?: string;
  /** A short quote or summary from the source. */
  snippet?: string;
}

export interface SourcePreviewLabels {
  /** Hidden text added to links that open in a new tab. */
  newTab: string;
}

export interface SourcePreviewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The source to show. */
  source: Source;
  /** Called when the reader opens the source. Without a `url` the title becomes a button. */
  onOpen?: (source: Source) => void;
  /** Card density. Default `md`. */
  size?: 'sm' | 'md';
  /** A citation number shown before the title, matching a CitationChip. */
  index?: number;
  /** Link target for the title. Default `_blank`. */
  target?: React.HTMLAttributeAnchorTarget;
  /** Number of snippet lines before it is cut. Default 3. */
  snippetLines?: number;
  /** Translations for the built in strings. */
  labels?: Partial<SourcePreviewLabels>;
}

/** The site name for a source: its `domain`, or the host of its `url` without "www.". */
export function getSourceDomain(source: Source): string | undefined {
  if (source.domain) return source.domain;
  if (!source.url) return undefined;
  try {
    return new URL(source.url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/** A decorative site icon that falls back to a globe when there is no image or it fails. */
export function SourceFavicon({ src, size = 16 }: { src?: string | undefined; size?: number }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  return (
    <span
      className="st-source-favicon"
      aria-hidden="true"
      style={{ inlineSize: size, blockSize: size }}
    >
      {src && !failed ? (
        <img src={src} alt="" width={size} height={size} onError={() => setFailed(true)} />
      ) : (
        <Icon name="globe" size={size} />
      )}
    </span>
  );
}

/** A card for one source: title, site, snippet and a link to open it. */
export const SourcePreview = React.forwardRef<HTMLDivElement, SourcePreviewProps>(
  function SourcePreview(
    {
      source,
      onOpen,
      size = 'md',
      index,
      target = '_blank',
      snippetLines = 3,
      labels: labelsProp,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const labels = { newTab: 'opens in a new tab', ...labelsProp };
    const domain = getSourceDomain(source);
    const newTab = target === '_blank';
    const title = <span className="st-source-preview__title-text">{source.title}</span>;
    return (
      <div
        ref={ref}
        className={cx('st-source-preview', className)}
        data-size={size}
        style={{ ['--_lines' as string]: snippetLines, ...style }}
        {...props}
      >
        <div className="st-source-preview__site">
          <SourceFavicon src={source.favicon} size={size === 'sm' ? 14 : 16} />
          {index != null && <span className="st-source-preview__index">{index}</span>}
          {domain && <span className="st-source-preview__domain">{domain}</span>}
        </div>
        {source.url ? (
          <a
            className="st-source-preview__title"
            href={source.url}
            target={target}
            rel={newTab ? 'noopener noreferrer' : undefined}
            onClick={() => onOpen?.(source)}
          >
            {title}
            <Icon name="external-link" size={12} className="st-source-preview__open" />
            {newTab && <span className="st-sr-only"> ({labels.newTab})</span>}
          </a>
        ) : onOpen ? (
          <button type="button" className="st-source-preview__title" onClick={() => onOpen(source)}>
            {title}
          </button>
        ) : (
          <span className="st-source-preview__title" data-static="">
            {title}
          </span>
        )}
        {source.snippet && <p className="st-source-preview__snippet">{source.snippet}</p>}
      </div>
    );
  },
);
