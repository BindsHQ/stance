'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useClipboard } from '../../internal/use-clipboard.js';
import { Icon } from '../../icons/Icon.js';
import { iconNames, type IconName } from '../../icons/paths.js';

export interface IconGalleryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Icons to show. Default: every Stance icon. */
  icons?: readonly IconName[];
  /** Initial search query. */
  defaultQuery?: string;
  /** Icon size in the grid, px. Default 24. */
  iconSize?: number;
  /** Called when an icon is chosen. By default the icon name is copied to the clipboard. */
  onSelect?: (name: IconName) => void;
  /** Label for the search field. Default "Search icons". */
  searchLabel?: string;
}

/** A searchable grid of Stance icons; choosing one copies its name. */
export const IconGallery = React.forwardRef<HTMLDivElement, IconGalleryProps>(function IconGallery(
  {
    icons = iconNames,
    defaultQuery = '',
    iconSize = 24,
    onSelect,
    searchLabel = 'Search icons',
    className,
    ...props
  },
  ref,
) {
  const [query, setQuery] = React.useState(defaultQuery);
  const [last, setLast] = React.useState<IconName | null>(null);
  const { copy, copied } = useClipboard();
  const searchId = React.useId();
  const q = query.trim().toLowerCase();
  const results = q
    ? icons.filter((n) => n.includes(q) || n.replace(/-/g, ' ').includes(q))
    : icons;
  return (
    <div ref={ref} className={cx('st-icon-gallery', className)} {...props}>
      <div className="st-icon-gallery__toolbar">
        <label htmlFor={searchId} className="st-sr-only">
          {searchLabel}
        </label>
        <div className="st-input st-icon-gallery__search" data-size="md">
          <span className="st-input__affix" data-position="prefix">
            <Icon name="search" />
          </span>
          <input
            id={searchId}
            type="search"
            className="st-input__control"
            placeholder={`${searchLabel}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="st-icon-gallery__count" aria-live="polite">
          {results.length} {results.length === 1 ? 'icon' : 'icons'}
        </span>
      </div>
      {results.length === 0 ? (
        <p className="st-icon-gallery__empty">No icons match “{query}”.</p>
      ) : (
        <ul className="st-icon-gallery__grid" role="list">
          {results.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="st-icon-gallery__item"
                aria-label={onSelect ? name : `Copy icon name ${name}`}
                data-copied={copied && last === name ? '' : undefined}
                onClick={() => {
                  setLast(name);
                  if (onSelect) onSelect(name);
                  else void copy(name);
                }}
              >
                <Icon name={name} size={iconSize} />
                <span className="st-icon-gallery__name" aria-hidden="true">
                  {copied && last === name ? 'Copied' : name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="st-sr-only" role="status">
        {copied && last ? `Copied ${last}` : ''}
      </span>
    </div>
  );
});
