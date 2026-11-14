'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { isRtl } from '../../internal/direction.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Slot } from '../../internal/slot.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

/*
 * Site / app navigation using the WAI-ARIA *disclosure* navigation pattern:
 * buttons with aria-expanded reveal panels of ordinary links. This is the
 * correct pattern for navigation: role="menu" is reserved for application menus.
 */

interface NavContextValue {
  value: string | null;
  setValue: (value: string | null) => void;
  orientation: 'horizontal' | 'vertical';
  openOnHover: boolean;
  rootRef: React.RefObject<HTMLElement | null>;
  scheduleOpen: (value: string) => void;
  openedByHover: React.MutableRefObject<string | null>;
  scheduleClose: () => void;
  cancelTimers: () => void;
}

const [NavProvider, useNav] = createStrictContext<NavContextValue>('NavigationMenu');

interface ItemContextValue {
  value: string;
  triggerId: string;
  contentId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}
const ItemContext = React.createContext<ItemContextValue | null>(null);

export interface NavigationMenuProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'defaultValue'
> {
  /** Accessible name of the navigation landmark, e.g. "Main". */
  'aria-label'?: string;
  /** Value of the open panel (controlled). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Layout. Vertical expands panels inline (sidebars, mobile). Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** Open panels on mouse hover (pointer devices only). Default true for horizontal. */
  openOnHover?: boolean;
}

/** Primary site or product navigation with optional flyout panels of links. */
export const NavigationMenu = React.forwardRef<HTMLElement, NavigationMenuProps>(
  function NavigationMenu(
    {
      value: valueProp,
      defaultValue = null,
      onValueChange,
      orientation = 'horizontal',
      openOnHover,
      className,
      children,
      onKeyDown,
      onBlur,
      onPointerLeave,
      ...props
    },
    forwardedRef,
  ) {
    const [value, setValue] = useControllableState<string | null>({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    });
    const rootRef = React.useRef<HTMLElement>(null);
    const composed = useComposedRefs(forwardedRef, rootRef);
    const hover = openOnHover ?? orientation === 'horizontal';
    const openTimer = React.useRef<number | undefined>(undefined);
    const closeTimer = React.useRef<number | undefined>(undefined);
    const cancelTimers = React.useCallback(() => {
      window.clearTimeout(openTimer.current);
      window.clearTimeout(closeTimer.current);
    }, []);
    // The item the pointer opened by hovering. A click that lands on it keeps it open instead of
    // toggling it shut, so hovering and then clicking never closes the panel just opened.
    const openedByHover = React.useRef<string | null>(null);
    const scheduleOpen = React.useCallback(
      (v: string) => {
        cancelTimers();
        openTimer.current = window.setTimeout(() => {
          openedByHover.current = v;
          setValue(v);
        }, 120);
      },
      [cancelTimers, setValue],
    );
    const scheduleClose = React.useCallback(() => {
      cancelTimers();
      closeTimer.current = window.setTimeout(() => setValue(null), 250);
    }, [cancelTimers, setValue]);
    React.useEffect(() => cancelTimers, [cancelTimers]);
    // Forget the hover once that panel is no longer the open one.
    React.useEffect(() => {
      if (openedByHover.current !== value) openedByHover.current = null;
    }, [value]);

    // Close on outside pointer down.
    React.useEffect(() => {
      if (value === null) return;
      const onDown = (e: PointerEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) setValue(null);
      };
      document.addEventListener('pointerdown', onDown, true);
      return () => document.removeEventListener('pointerdown', onDown, true);
    }, [value, setValue]);

    const ctx = React.useMemo(
      () => ({
        value,
        setValue,
        orientation,
        openOnHover: hover,
        rootRef,
        scheduleOpen,
        openedByHover,
        scheduleClose,
        cancelTimers,
      }),
      [value, setValue, orientation, hover, scheduleOpen, scheduleClose, cancelTimers],
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const root = rootRef.current;
      if (!root) return;
      if (e.key === 'Escape' && value !== null) {
        e.preventDefault();
        const trigger = root.querySelector<HTMLElement>(
          `[data-nav-trigger][data-value="${CSS.escape(value)}"]`,
        );
        setValue(null);
        trigger?.focus();
        return;
      }
      const target = e.target as HTMLElement;
      const rtl = isRtl(root);
      const prev = orientation === 'horizontal' ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
      const next = orientation === 'horizontal' ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
      // Arrow keys move between top-level entries.
      if (target.hasAttribute('data-nav-top') && [prev, next, 'Home', 'End'].includes(e.key)) {
        const tops = Array.from(root.querySelectorAll<HTMLElement>('[data-nav-top]')).filter(
          (el) => el.closest('[data-nav-root]') === root && !el.hasAttribute('disabled'),
        );
        const i = tops.indexOf(target);
        const to =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? tops.length - 1
              : e.key === next
                ? (i + 1) % tops.length
                : (i - 1 + tops.length) % tops.length;
        e.preventDefault();
        tops[to]?.focus();
        return;
      }
      // Inside a panel, Up/Down move between its links.
      const panel = target.closest<HTMLElement>('[data-nav-content]');
      if (panel && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const links = Array.from(
          panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'),
        );
        const i = links.indexOf(target);
        if (i < 0) return;
        e.preventDefault();
        links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus();
      }
    };

    return (
      <NavProvider value={ctx}>
        <nav
          ref={composed}
          className={cx('st-navigation-menu', className)}
          data-orientation={orientation}
          data-nav-root=""
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            onBlur?.(e);
            const next = e.relatedTarget as Node | null;
            if (next && rootRef.current && !rootRef.current.contains(next)) setValue(null);
          }}
          onPointerLeave={(e) => {
            onPointerLeave?.(e);
            if (hover && e.pointerType === 'mouse' && value !== null) scheduleClose();
          }}
          {...props}
        >
          <ul className="st-navigation-menu__list" data-orientation={orientation}>
            {children}
          </ul>
        </nav>
      </NavProvider>
    );
  },
);

export interface NavigationMenuItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Identifier for the panel. Generated by default. */
  value?: string;
}

export const NavigationMenuItem = React.forwardRef<HTMLLIElement, NavigationMenuItemProps>(
  function NavigationMenuItem({ value: valueProp, className, onPointerEnter, ...props }, ref) {
    const nav = useNav('NavigationMenuItem');
    const generated = React.useId();
    const value = valueProp ?? generated;
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const item = React.useMemo(
      () => ({
        value,
        triggerId: `${generated}-trigger`,
        contentId: `${generated}-content`,
        triggerRef,
        contentRef,
      }),
      [value, generated],
    );
    return (
      <ItemContext.Provider value={item}>
        <li
          ref={ref}
          className={cx('st-navigation-menu__item', className)}
          data-state={nav.value === value ? 'open' : 'closed'}
          onPointerEnter={(e) => {
            onPointerEnter?.(e);
            if (nav.openOnHover && e.pointerType === 'mouse') nav.cancelTimers();
          }}
          {...props}
        />
      </ItemContext.Provider>
    );
  },
);

function useItem(consumer: string) {
  const item = React.useContext(ItemContext);
  if (!item) throw new Error(`<${consumer}> must be used within <NavigationMenuItem>.`);
  return item;
}

export type NavigationMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Reveals the item's panel. Click, Enter, Space or ArrowDown (horizontal) opens it. */
export const NavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  NavigationMenuTriggerProps
>(function NavigationMenuTrigger(
  { className, children, onClick, onKeyDown, onPointerEnter, ...props },
  ref,
) {
  const nav = useNav('NavigationMenuTrigger');
  const item = useItem('NavigationMenuTrigger');
  const open = nav.value === item.value;
  const composed = useComposedRefs(ref, item.triggerRef);
  return (
    <button
      ref={composed}
      type="button"
      id={item.triggerId}
      aria-expanded={open}
      aria-controls={item.contentId}
      data-state={open ? 'open' : 'closed'}
      data-nav-trigger=""
      data-nav-top=""
      data-value={item.value}
      className={cx('st-navigation-menu__trigger', className)}
      onClick={composeHandlers(onClick, () => {
        nav.cancelTimers();
        const keepOpen = open && nav.openedByHover.current === item.value;
        nav.openedByHover.current = null;
        if (!keepOpen) nav.setValue(open ? null : item.value);
      })}
      onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent) => {
        const openKey =
          nav.orientation === 'horizontal'
            ? 'ArrowDown'
            : isRtl(e.currentTarget)
              ? 'ArrowLeft'
              : 'ArrowRight';
        if (e.key === openKey) {
          e.preventDefault();
          nav.setValue(item.value);
          window.requestAnimationFrame(() => {
            item.contentRef.current
              ?.querySelector<HTMLElement>('a[href],button:not([disabled])')
              ?.focus();
          });
        }
      })}
      onPointerEnter={composeHandlers(onPointerEnter, (e: React.PointerEvent) => {
        if (nav.openOnHover && e.pointerType === 'mouse') nav.scheduleOpen(item.value);
      })}
      {...props}
    >
      {children}
      <Icon name="chevron-down" size={14} className="st-navigation-menu__chevron" />
    </button>
  );
});

export interface NavigationMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Keep the panel mounted while closed (hidden). Default true, so links stay indexable. */
  forceMount?: boolean;
}

/** The panel revealed by a trigger. Contains ordinary links, not menu items. */
export const NavigationMenuContent = React.forwardRef<HTMLDivElement, NavigationMenuContentProps>(
  function NavigationMenuContent({ forceMount = true, className, ...props }, ref) {
    const nav = useNav('NavigationMenuContent');
    const item = useItem('NavigationMenuContent');
    const open = nav.value === item.value;
    const composed = useComposedRefs(ref, item.contentRef);
    if (!open && !forceMount) return null;
    return (
      <div
        ref={composed}
        id={item.contentId}
        hidden={!open}
        data-state={open ? 'open' : 'closed'}
        data-nav-content=""
        className={cx('st-navigation-menu__content', className)}
        {...props}
      />
    );
  },
);

export interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the link as the current page (aria-current="page"). */
  active?: boolean;
  /** Secondary line under the title, for rich panels. */
  description?: React.ReactNode;
  /** Icon shown before the title in panels. */
  icon?: React.ReactNode;
  /** Render your router's link component. */
  asChild?: boolean;
}

/** A navigation link, either top level or inside a panel. Closes the open panel when followed. */
export const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(
  function NavigationMenuLink(
    { active, description, icon, asChild, className, children, onClick, ...props },
    ref,
  ) {
    const nav = useNav('NavigationMenuLink');
    const ownRef = React.useRef<HTMLAnchorElement>(null);
    const composed = useComposedRefs(ref, ownRef);
    const [inPanel, setInPanel] = React.useState(false);
    React.useEffect(() => {
      setInPanel(Boolean(ownRef.current?.closest('[data-nav-content]')));
    }, []);
    const rich = description != null || icon != null;
    const shared = {
      ref: composed,
      'aria-current': active ? ('page' as const) : undefined,
      'data-active': active ? '' : undefined,
      'data-nav-top': inPanel ? undefined : '',
      'data-rich': rich ? '' : undefined,
      className: cx(
        inPanel ? 'st-navigation-menu__panel-link' : 'st-navigation-menu__link',
        className,
      ),
      onClick: composeHandlers(onClick, () => nav.setValue(null)),
      ...props,
    };
    if (asChild) return <Slot {...(shared as React.HTMLAttributes<HTMLElement>)}>{children}</Slot>;
    return (
      <a {...shared}>
        {rich ? (
          <>
            {icon && (
              <span className="st-navigation-menu__link-icon" aria-hidden="true">
                {icon}
              </span>
            )}
            <span className="st-navigation-menu__link-text">
              <span className="st-navigation-menu__link-title">{children}</span>
              {description && (
                <span className="st-navigation-menu__link-description">{description}</span>
              )}
            </span>
          </>
        ) : (
          children
        )}
      </a>
    );
  },
);
