import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Default `md`. */
  size?: 'sm' | 'md';
  /** Leading icon. */
  icon?: React.ReactNode;
  /** When provided, renders a remove button. */
  onRemove?: () => void;
  /**
   * Accessible label for the remove button. Defaults to "Remove <text>" when the
   * tag's children are a string.
   */
  removeLabel?: string;
  disabled?: boolean;
}

/** A keyword label, optionally removable, for assigned groups, departments or labels. */
export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { size = 'md', icon, onRemove, removeLabel, disabled, className, children, ...props },
  ref,
) {
  const text =
    typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;
  const label = removeLabel ?? (text ? `Remove ${text}` : 'Remove');
  return (
    <span
      ref={ref}
      className={cx('st-tag', className)}
      data-size={size}
      data-removable={onRemove ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      {icon != null && (
        <span className="st-tag__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="st-tag__label">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="st-tag__remove"
          aria-label={label}
          disabled={disabled}
          onClick={onRemove}
        >
          <Icon name="x" size={size === 'sm' ? 10 : 12} strokeWidth={2.25} />
        </button>
      )}
    </span>
  );
});
