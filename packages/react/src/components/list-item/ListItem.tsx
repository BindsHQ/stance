import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';

export interface ListItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> {
  /** Leading visual: Avatar, Icon or thumbnail. */
  leading?: React.ReactNode;
  /** Primary text. */
  title?: React.ReactNode;
  /** Secondary text under the title. */
  description?: React.ReactNode;
  /** Trailing metadata such as a date or badge. */
  meta?: React.ReactNode;
  /** Trailing actions (buttons). Kept outside the interactive area. */
  actions?: React.ReactNode;
  /**
   * Make the main area interactive by passing a single link or button child
   * with `asChild`; leading/title/description render inside that element.
   */
  asChild?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

/** One row in a List: media, text, metadata and actions. */
export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  {
    leading,
    title,
    description,
    meta,
    actions,
    asChild,
    selected,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  const structured = title != null || description != null || leading != null;
  const body = structured ? (
    <>
      {leading != null && <span className="st-list-item__leading">{leading}</span>}
      <span className="st-list-item__text">
        {title != null && <span className="st-list-item__title">{title}</span>}
        {description != null && <span className="st-list-item__description">{description}</span>}
      </span>
      {meta != null && <span className="st-list-item__meta">{meta}</span>}
    </>
  ) : null;
  let main: React.ReactNode;
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ children?: React.ReactNode }>;
    main = (
      <Slot className="st-list-item__main" data-interactive="">
        {React.cloneElement(child, undefined, structured ? body : child.props.children)}
      </Slot>
    );
  } else {
    main = (
      <div className="st-list-item__main">
        {body}
        {children}
      </div>
    );
  }
  return (
    <li
      ref={ref}
      className={cx('st-list-item', className)}
      data-selected={selected ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      aria-current={selected ? 'true' : undefined}
      {...props}
    >
      {main}
      {actions != null && <div className="st-list-item__actions">{actions}</div>}
    </li>
  );
});
