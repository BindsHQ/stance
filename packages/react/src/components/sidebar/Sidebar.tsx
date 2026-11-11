'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { cx } from '../../internal/cx.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  contentId: string;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

/** Read the sidebar's collapsed state, e.g. to adjust your layout. Returns null outside a Sidebar. */
export function useSidebar(): SidebarContextValue | null {
  return React.useContext(SidebarContext);
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Controlled collapsed (icon-only) state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Root element. `nav` (default) adds a navigation landmark labelled by `aria-label`. */
  as?: 'nav' | 'aside' | 'div';
  /** Accessible name of the landmark. Default "Main". */
  'aria-label'?: string;
  /** Active item style: `subtle` tint or `inverted` (accent fill). Default `subtle`. */
  activeStyle?: 'subtle' | 'inverted';
  /** Expanded width, any CSS length. Default `18rem`. */
  width?: string;
  /** Collapsed width. Default `5rem`. */
  collapsedWidth?: string;
}

/**
 * Sidebar navigation primitives. They do not position themselves; place the Sidebar
 * in your own layout (fixed, sticky or in a grid) so existing app shells stay intact.
 */
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    collapsed: collapsedProp,
    defaultCollapsed = false,
    onCollapsedChange,
    as: Tag = 'nav',
    activeStyle = 'subtle',
    width,
    collapsedWidth,
    className,
    style,
    ...props
  },
  ref,
) {
  const [collapsed, setCollapsed] = useControllableState({
    value: collapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  });
  const contentId = React.useId();
  const ctx = React.useMemo(
    () => ({ collapsed, setCollapsed, contentId }),
    [collapsed, setCollapsed, contentId],
  );
  return (
    <SidebarContext.Provider value={ctx}>
      <Tag
        ref={ref as React.Ref<HTMLElement & HTMLDivElement>}
        id={contentId}
        aria-label={Tag === 'div' ? undefined : (props['aria-label'] ?? 'Main')}
        className={cx('st-sidebar', className)}
        data-collapsed={collapsed ? '' : undefined}
        data-active-style={activeStyle}
        style={{
          ...(width && { ['--st-sidebar-width' as string]: width }),
          ...(collapsedWidth && { ['--st-sidebar-collapsed-width' as string]: collapsedWidth }),
          ...style,
        }}
        {...props}
      />
    </SidebarContext.Provider>
  );
});

function useSidebarContext(part: string) {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error(`<${part}> must be used within <Sidebar>.`);
  return ctx;
}

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SidebarHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cx('st-sidebar__header', className)} {...props} />;
  },
);

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function SidebarContent({ className, ...props }, ref) {
  return <div ref={ref} className={cx('st-sidebar__content', className)} {...props} />;
});

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SidebarFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cx('st-sidebar__footer', className)} {...props} />;
  },
);

export interface SidebarGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Group heading. Hidden visually when the sidebar is collapsed. */
  label?: React.ReactNode;
  /** Let users show and hide the group's items. */
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  function SidebarGroup(
    {
      label,
      collapsible = false,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const sidebar = useSidebarContext('SidebarGroup');
    const [open, setOpen] = useControllableState({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const id = React.useId();
    const labelId = `${id}-label`;
    const listId = `${id}-list`;
    // Collapsed sidebars always show items (as icons).
    const showItems = !collapsible || open || sidebar.collapsed;
    return (
      <div
        ref={ref}
        className={cx('st-sidebar__group', className)}
        data-state={showItems ? 'open' : 'closed'}
        {...props}
      >
        {label != null &&
          (collapsible && !sidebar.collapsed ? (
            <button
              type="button"
              id={labelId}
              className="st-sidebar__group-label"
              data-collapsible=""
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen(!open)}
            >
              <span>{label}</span>
              <Icon name="chevron-down" size={14} className="st-sidebar__group-chevron" />
            </button>
          ) : (
            <div id={labelId} className="st-sidebar__group-label">
              {label}
            </div>
          ))}
        <ul
          id={listId}
          className="st-sidebar__list"
          aria-labelledby={label != null ? labelId : undefined}
          hidden={!showItems}
        >
          {children}
        </ul>
      </div>
    );
  },
);

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Icon shown in both expanded and collapsed states. Strongly recommended. */
  icon?: React.ReactNode;
  /** Marks the current page (aria-current="page" on links). */
  active?: boolean;
  /** Trailing count or status, e.g. a number of pending invites. */
  badge?: React.ReactNode;
  /** Render your own link (e.g. Next.js Link). */
  asChild?: boolean;
  /** Render a button instead of a link when there is no href, e.g. "Log out". */
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  disabled?: boolean;
}

export const SidebarItem = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  SidebarItemProps
>(function SidebarItem(
  { icon, active, badge, asChild, href, disabled, className, children, onClick, ...props },
  ref,
) {
  const sidebar = useSidebarContext('SidebarItem');
  const labelText = typeof children === 'string' ? children : undefined;
  const inner = (label: React.ReactNode) => (
    <>
      {icon && (
        <span className="st-sidebar__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="st-sidebar__label">{label}</span>
      {badge != null && <span className="st-sidebar__badge">{badge}</span>}
    </>
  );
  const shared = {
    className: cx('st-sidebar__item', className),
    'data-active': active ? '' : undefined,
    title: sidebar.collapsed ? labelText : undefined,
  };
  let element: React.ReactNode;
  if (asChild && React.isValidElement(children)) {
    const childLabel = (children.props as { children?: React.ReactNode }).children;
    element = (
      <Slot
        ref={ref as React.Ref<HTMLElement>}
        {...shared}
        title={sidebar.collapsed && typeof childLabel === 'string' ? childLabel : undefined}
        aria-current={active ? 'page' : undefined}
        {...(props as React.HTMLAttributes<HTMLElement>)}
        {...(onClick && { onClick: onClick as React.MouseEventHandler<HTMLElement> })}
      >
        {React.cloneElement(children, undefined, inner(childLabel))}
      </Slot>
    );
  } else if (href !== undefined && !disabled) {
    element = (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        {...shared}
        {...props}
      >
        {inner(children)}
      </a>
    );
  } else {
    element = (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        disabled={disabled}
        aria-current={active ? 'true' : undefined}
        onClick={onClick}
        {...shared}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {inner(children)}
      </button>
    );
  }
  return <li className="st-sidebar__cell">{element}</li>;
});

export interface SidebarToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Labels for the two states. */
  expandLabel?: string;
  collapseLabel?: string;
}

/** Collapses and expands the sidebar. */
export const SidebarToggle = React.forwardRef<HTMLButtonElement, SidebarToggleProps>(
  function SidebarToggle(
    {
      expandLabel = 'Expand sidebar',
      collapseLabel = 'Collapse sidebar',
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) {
    const sidebar = useSidebarContext('SidebarToggle');
    const label = sidebar.collapsed ? expandLabel : collapseLabel;
    return (
      <button
        ref={ref}
        type="button"
        className={cx('st-sidebar__toggle', className)}
        aria-expanded={!sidebar.collapsed}
        aria-controls={sidebar.contentId}
        aria-label={children ? undefined : label}
        title={label}
        onClick={composeHandlers(onClick, () => sidebar.setCollapsed(!sidebar.collapsed))}
        {...props}
      >
        {children ?? (
          <Icon name={sidebar.collapsed ? 'chevrons-right' : 'chevrons-left'} size={16} />
        )}
      </button>
    );
  },
);
