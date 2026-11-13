import * as React from 'react';
import { cx } from '../../internal/cx.js';

export interface SuggestionChipsItem {
  /** Stable id, passed back on select. */
  id: string;
  /** The words on the chip. Keep them short. */
  label: string;
  /** Icon before the label. */
  icon?: React.ReactNode;
}

export interface SuggestionChipsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSelect'
> {
  /** The follow up prompts or next actions to offer. */
  items: SuggestionChipsItem[];
  /** Called with the chip the person chose. */
  onSelect?: (item: SuggestionChipsItem) => void;
  /** Shows placeholders while suggestions are being prepared. Default false. */
  loading?: boolean;
  /** Wrap onto more lines. When false the row scrolls sideways. Default true. */
  wrap?: boolean;
  /** Accessible name of the group. Default "Suggestions". */
  label?: string;
  /** Read by screen readers while loading. Default "Loading suggestions". */
  loadingLabel?: string;
  /** Chip height: sm 28, md 32. Default `md`. */
  size?: 'sm' | 'md';
  /** Disables every chip. Default false. */
  disabled?: boolean;
  /** How many placeholders to show while loading. Default 3. */
  loadingCount?: number;
}

const placeholderWidths = [7.5, 10, 6];

/**
 * Short follow up prompts or next actions, offered after a response or beside content.
 * Each chip is a button; choosing one never moves focus on its own.
 */
export const SuggestionChips = React.forwardRef<HTMLDivElement, SuggestionChipsProps>(
  function SuggestionChips(
    {
      items,
      onSelect,
      loading = false,
      wrap = true,
      label = 'Suggestions',
      loadingLabel = 'Loading suggestions',
      size = 'md',
      disabled = false,
      loadingCount = 3,
      className,
      ...props
    },
    ref,
  ) {
    if (!loading && items.length === 0) return null;
    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        aria-busy={loading || undefined}
        className={cx('st-suggestion-chips', className)}
        data-wrap={wrap ? '' : undefined}
        data-size={size}
        data-loading={loading ? '' : undefined}
        {...props}
      >
        {loading ? (
          <>
            <span className="st-sr-only" role="status">
              {loadingLabel}
            </span>
            <span className="st-suggestion-chips__list" aria-hidden="true">
              {Array.from({ length: Math.max(1, loadingCount) }, (_, i) => (
                <span
                  key={i}
                  className="st-suggestion-chips__placeholder"
                  style={{ inlineSize: `${placeholderWidths[i % placeholderWidths.length]}rem` }}
                />
              ))}
            </span>
          </>
        ) : (
          <ul className="st-suggestion-chips__list">
            {items.map((item) => (
              <li key={item.id} className="st-suggestion-chips__item">
                <button
                  type="button"
                  className="st-suggestion-chips__chip"
                  disabled={disabled}
                  onClick={() => onSelect?.(item)}
                >
                  {item.icon != null && (
                    <span className="st-suggestion-chips__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="st-suggestion-chips__label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
