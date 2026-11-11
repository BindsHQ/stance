'use client';
/**
 * The Stance menu engine. Shared by DropdownMenu, ContextMenu, Menubar,
 * ActionMenu and SplitButton. Implements the WAI-ARIA APG menu pattern:
 * roving focus, typeahead, submenus, checkbox/radio items, Escape/outside
 * dismissal and focus return — with no third-party dependencies.
 */
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useDismissableLayer } from '../../internal/layer-stack.js';
import { Portal } from '../../internal/portal.js';
import type { Align, Side } from '../../internal/position.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useFloating } from '../../internal/use-floating.js';
import { Icon } from '../../icons/Icon.js';

export type FocusIntent = 'first' | 'last' | 'none';

export interface MenuRootContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Closes this menu and every ancestor menu. */
  closeAll: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Where focus returns on close; also excluded from outside-click dismissal. */
  triggerRef: React.RefObject<HTMLElement | null>;
  contentId: string;
  triggerId: string;
  focusIntentRef: React.MutableRefObject<FocusIntent>;
  parent: MenuRootContextValue | null;
  /** Menubar hook: move to the previous/next top-level menu. */
  onHorizontalNav?: ((direction: 1 | -1) => void) | undefined;
}

export const MenuRootContext = React.createContext<MenuRootContextValue | null>(null);

export function useMenuRoot(consumer: string): MenuRootContextValue {
  const ctx = React.useContext(MenuRootContext);
  if (!ctx)
    throw new Error(
      `<${consumer}> must be used within a menu (DropdownMenu, ContextMenu or MenubarMenu).`,
    );
  return ctx;
}

function topRoot(ctx: MenuRootContextValue): MenuRootContextValue {
  let c = ctx;
  while (c.parent) c = c.parent;
  return c;
}

export interface MenuRootProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MenuRootInternalProps extends MenuRootProps {
  anchorRef?: React.RefObject<HTMLElement | null>;
  onHorizontalNav?: (direction: 1 | -1) => void;
}

/** Provides menu state. Used directly as DropdownMenu and inside ContextMenu / MenubarMenu. */
export function MenuRoot({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  anchorRef,
  onHorizontalNav,
}: MenuRootInternalProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const id = React.useId();
  const triggerRef = React.useRef<HTMLElement>(null);
  const focusIntentRef = React.useRef<FocusIntent>('first');
  const value = React.useMemo<MenuRootContextValue>(
    () => ({
      open,
      setOpen,
      closeAll: () => setOpen(false),
      anchorRef: anchorRef ?? triggerRef,
      triggerRef,
      contentId: `${id}-menu`,
      triggerId: `${id}-trigger`,
      focusIntentRef,
      parent: null,
      onHorizontalNav,
    }),
    [open, setOpen, id, anchorRef, onHorizontalNav],
  );
  return <MenuRootContext.Provider value={value}>{children}</MenuRootContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

interface MenuContentContextValue {
  openSubId: string | null;
  setOpenSubId: (id: string | null) => void;
}
const MenuContentContext = React.createContext<MenuContentContextValue | null>(null);

const ITEM_SELECTOR = '[data-menu-item]:not([data-disabled])';

function getItems(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (el) => el.closest('[data-menu-content]') === container,
  );
}

export interface MenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  /** Wrap focus from last item to first. Default true. */
  loop?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
}

interface MenuContentInternalProps extends MenuContentProps {
  /** Label the menu by its trigger. Default true. */
  labelledByTrigger?: boolean;
  isSub?: boolean;
}

export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentInternalProps>(
  function MenuContent(
    {
      side = 'bottom',
      align = 'start',
      sideOffset = 6,
      alignOffset,
      collisionPadding,
      loop = true,
      onEscapeKeyDown,
      onPointerDownOutside,
      labelledByTrigger = true,
      isSub = false,
      className,
      style,
      children,
      onKeyDown,
      ...props
    },
    forwardedRef,
  ) {
    const root = useMenuRoot('MenuContent');
    const ref = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    const [openSubId, setOpenSubId] = React.useState<string | null>(null);
    const contentCtx = React.useMemo(() => ({ openSubId, setOpenSubId }), [openSubId]);

    const floating = useFloating(root.anchorRef, ref, {
      open: root.open,
      side,
      align,
      sideOffset,
      ...(alignOffset !== undefined && { alignOffset }),
      ...(collisionPadding !== undefined && { collisionPadding }),
    });

    useDismissableLayer(ref, {
      enabled: root.open,
      onEscapeKeyDown,
      onPointerDownOutside,
      onDismiss: () => root.setOpen(false),
      excludeRefs: [root.triggerRef],
    });

    // Focus on open, and return focus on close when it would otherwise be lost.
    React.useEffect(() => {
      if (!root.open) return;
      const container = ref.current;
      const intent = root.focusIntentRef.current;
      root.focusIntentRef.current = 'first';
      if (container && intent !== 'none') {
        const items = getItems(container);
        const target = intent === 'last' ? items[items.length - 1] : items[0];
        (target ?? container).focus({ preventScroll: true });
      }
      const trigger = root.triggerRef;
      return () => {
        window.setTimeout(() => {
          const active = document.activeElement as HTMLElement | null;
          // Restore to the trigger when focus was lost: on <body>, on a detached node, or on an
          // element users cannot tab to — unless another layer (e.g. a dialog opened by the item) took it.
          const lost =
            !active ||
            active === document.body ||
            !active.isConnected ||
            (active.tabIndex < 0 &&
              !active.closest('[data-stance-layer], [role="dialog"], [role="alertdialog"]'));
          if (lost && trigger.current?.isConnected) {
            trigger.current.focus({ preventScroll: true });
          }
        }, 0);
      };
    }, [root.open, root.focusIntentRef, root.triggerRef]);

    const typeaheadBuffer = React.useRef('');
    const typeaheadTimer = React.useRef<number | undefined>(undefined);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const container = ref.current;
      // Ignore keys from nested (portalled) submenus that bubble through React.
      if (!container || !container.contains(event.target as Node)) return;
      const items = getItems(container);
      const index = items.indexOf(document.activeElement as HTMLElement);
      const focusAt = (i: number) => items[i]?.focus({ preventScroll: true });
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusAt(index < 0 ? 0 : index + 1 >= items.length ? (loop ? 0 : index) : index + 1);
          return;
        case 'ArrowUp':
          event.preventDefault();
          focusAt(
            index < 0
              ? items.length - 1
              : index - 1 < 0
                ? loop
                  ? items.length - 1
                  : 0
                : index - 1,
          );
          return;
        case 'Home':
        case 'PageUp':
          event.preventDefault();
          focusAt(0);
          return;
        case 'End':
        case 'PageDown':
          event.preventDefault();
          focusAt(items.length - 1);
          return;
        case 'Tab':
          event.preventDefault();
          topRoot(root).closeAll();
          return;
        case 'ArrowLeft':
          if (isSub) {
            event.preventDefault();
            root.setOpen(false);
            root.triggerRef.current?.focus({ preventScroll: true });
          } else if (topRoot(root).onHorizontalNav) {
            event.preventDefault();
            topRoot(root).onHorizontalNav?.(-1);
          }
          return;
        case 'ArrowRight':
          if (!isSub || topRoot(root).onHorizontalNav) {
            const top = topRoot(root);
            if (top.onHorizontalNav) {
              event.preventDefault();
              top.onHorizontalNav(1);
            }
          }
          return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key === ' ' && typeaheadBuffer.current === '') return;
        window.clearTimeout(typeaheadTimer.current);
        typeaheadBuffer.current += event.key.toLowerCase();
        typeaheadTimer.current = window.setTimeout(() => (typeaheadBuffer.current = ''), 600);
        const buf = typeaheadBuffer.current;
        const search = buf.split('').every((c) => c === buf[0]) ? buf[0]! : buf;
        const start = Math.max(0, index);
        const ordered = [...items.slice(start + 1), ...items.slice(0, start + 1)];
        const match = ordered.find((el) =>
          (el.getAttribute('data-text-value') ?? el.textContent ?? '')
            .trim()
            .toLowerCase()
            .startsWith(search),
        );
        if (match) {
          event.preventDefault();
          match.focus({ preventScroll: true });
        }
      }
    };

    if (!root.open) return null;
    return (
      <Portal>
        <MenuContentContext.Provider value={contentCtx}>
          <div
            ref={composed}
            id={root.contentId}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby={labelledByTrigger ? root.triggerId : undefined}
            tabIndex={-1}
            data-menu-content=""
            data-stance-layer=""
            data-state="open"
            data-side={floating.side}
            className={cx('st-floating st-menu', className)}
            style={{ ...floating.style, ...style }}
            onKeyDown={handleKeyDown}
            {...props}
          >
            {children}
          </div>
        </MenuContentContext.Provider>
      </Portal>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

export type MenuSelectEvent = CustomEvent<{ originalEvent: React.SyntheticEvent }>;

export interface MenuItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSelect' | 'role'
> {
  /** Called when the item is chosen by pointer or keyboard. Call `event.preventDefault()` to keep the menu open. */
  onSelect?: (event: MenuSelectEvent) => void;
  disabled?: boolean;
  /** Styles the item as destructive (e.g. Delete). */
  destructive?: boolean;
  /** Icon rendered before the label. */
  icon?: React.ReactNode;
  /** Close the whole menu after selection. Default true. */
  closeOnSelect?: boolean;
  /** Text used for typeahead when the children are not plain text. */
  textValue?: string;
  /** Indent to align with items that have an indicator. */
  inset?: boolean;
}

interface MenuItemBaseProps extends MenuItemProps {
  role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  indicator?: React.ReactNode;
  trailing?: React.ReactNode;
  extraProps?: Record<string, unknown>;
  onActivate?: () => void;
  /** Sub trigger id: do not close subs when this item gains focus. */
  subId?: string;
}

export const MenuItemBase = React.forwardRef<HTMLDivElement, MenuItemBaseProps>(
  function MenuItemBase(
    {
      role,
      onSelect,
      disabled = false,
      destructive = false,
      icon,
      closeOnSelect = true,
      textValue,
      inset,
      indicator,
      trailing,
      extraProps,
      onActivate,
      subId,
      className,
      children,
      onClick,
      onKeyDown,
      onPointerMove,
      onFocus,
      ...props
    },
    ref,
  ) {
    const root = useMenuRoot('DropdownMenuItem');
    const content = React.useContext(MenuContentContext);

    const select = (originalEvent: React.SyntheticEvent) => {
      if (disabled) return;
      onActivate?.();
      const event = new CustomEvent('stance.menu.select', {
        cancelable: true,
        detail: { originalEvent },
      }) as MenuSelectEvent;
      onSelect?.(event);
      if (!event.defaultPrevented && closeOnSelect) topRoot(root).closeAll();
    };

    return (
      <div
        ref={ref}
        role={role}
        tabIndex={-1}
        aria-disabled={disabled || undefined}
        data-menu-item=""
        data-disabled={disabled ? '' : undefined}
        data-destructive={destructive ? '' : undefined}
        data-inset={inset ? '' : undefined}
        data-text-value={textValue}
        className={cx('st-menu__item', className)}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) select(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            select(e);
          }
        }}
        onPointerMove={(e) => {
          onPointerMove?.(e);
          if (
            !disabled &&
            e.pointerType === 'mouse' &&
            document.activeElement !== e.currentTarget
          ) {
            e.currentTarget.focus({ preventScroll: true });
          }
        }}
        onFocus={(e) => {
          onFocus?.(e);
          if (content && content.openSubId !== null && content.openSubId !== subId)
            content.setOpenSubId(null);
        }}
        {...extraProps}
        {...props}
      >
        {indicator !== undefined && (
          <span className="st-menu__indicator" aria-hidden="true">
            {indicator}
          </span>
        )}
        {icon && (
          <span className="st-menu__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="st-menu__label">{children}</span>
        {trailing}
      </div>
    );
  },
);

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(
  function MenuItem(props, ref) {
    return <MenuItemBase ref={ref} role="menuitem" {...props} />;
  },
);

export interface MenuCheckboxItemProps extends Omit<MenuItemProps, 'icon'> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
}

export const MenuCheckboxItem = React.forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  function MenuCheckboxItem(
    { checked = false, onCheckedChange, closeOnSelect = false, ...props },
    ref,
  ) {
    return (
      <MenuItemBase
        ref={ref}
        role="menuitemcheckbox"
        closeOnSelect={closeOnSelect}
        extraProps={{
          'aria-checked': checked === 'indeterminate' ? 'mixed' : checked,
          'data-state':
            checked === true
              ? 'checked'
              : checked === 'indeterminate'
                ? 'indeterminate'
                : 'unchecked',
        }}
        indicator={
          checked === 'indeterminate' ? (
            <Icon name="minus" size={14} />
          ) : checked ? (
            <Icon name="check" size={14} />
          ) : null
        }
        onActivate={() => onCheckedChange?.(checked === 'indeterminate' ? true : !checked)}
        {...props}
      />
    );
  },
);

interface RadioGroupContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
}
const MenuRadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface MenuRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const MenuRadioGroup = React.forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  function MenuRadioGroup(
    { value: valueProp, defaultValue, onValueChange, className, ...props },
    ref,
  ) {
    const [value, setValue] = useControllableState<string | undefined>({
      value: valueProp,
      defaultValue,
      onChange: onValueChange as (v: string | undefined) => void,
    });
    const ctx = React.useMemo(
      () => ({ value, onValueChange: (v: string) => setValue(v) }),
      [value, setValue],
    );
    return (
      <MenuRadioGroupContext.Provider value={ctx}>
        <div ref={ref} role="group" className={cx('st-menu__group', className)} {...props} />
      </MenuRadioGroupContext.Provider>
    );
  },
);

export interface MenuRadioItemProps extends Omit<MenuItemProps, 'icon'> {
  value: string;
}

export const MenuRadioItem = React.forwardRef<HTMLDivElement, MenuRadioItemProps>(
  function MenuRadioItem({ value, closeOnSelect = false, ...props }, ref) {
    const group = React.useContext(MenuRadioGroupContext);
    if (!group)
      throw new Error('<DropdownMenuRadioItem> must be used within <DropdownMenuRadioGroup>.');
    const checked = group.value === value;
    return (
      <MenuItemBase
        ref={ref}
        role="menuitemradio"
        closeOnSelect={closeOnSelect}
        extraProps={{ 'aria-checked': checked, 'data-state': checked ? 'checked' : 'unchecked' }}
        indicator={checked ? <span className="st-menu__radio-dot" /> : null}
        onActivate={() => group.onValueChange(value)}
        {...props}
      />
    );
  },
);

export const MenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(function MenuLabel({ className, inset, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="presentation"
      data-inset={inset ? '' : undefined}
      className={cx('st-menu__label-heading', className)}
      {...props}
    />
  );
});

export const MenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function MenuSeparator({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cx('st-menu__separator', className)}
        {...props}
      />
    );
  },
);

export interface MenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visible group heading; also labels the group. */
  label?: React.ReactNode;
}

export const MenuGroup = React.forwardRef<HTMLDivElement, MenuGroupProps>(function MenuGroup(
  { label, className, children, ...props },
  ref,
) {
  const id = React.useId();
  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={label ? id : undefined}
      className={cx('st-menu__group', className)}
      {...props}
    >
      {label && (
        <div id={id} role="presentation" className="st-menu__label-heading">
          {label}
        </div>
      )}
      {children}
    </div>
  );
});

export const MenuShortcut = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function MenuShortcut({ className, ...props }, ref) {
  return (
    <span ref={ref} aria-hidden="true" className={cx('st-menu__shortcut', className)} {...props} />
  );
});

/* ------------------------------------------------------------------ */
/* Submenus                                                            */
/* ------------------------------------------------------------------ */

interface SubContextValue {
  subId: string;
}
const MenuSubContext = React.createContext<SubContextValue | null>(null);

export interface MenuSubProps {
  children?: React.ReactNode;
}

/** A nested menu. Contains a SubTrigger and a SubContent. */
export function MenuSub({ children }: MenuSubProps) {
  const parent = useMenuRoot('DropdownMenuSub');
  const content = React.useContext(MenuContentContext);
  if (!content) throw new Error('<DropdownMenuSub> must be used within menu content.');
  const subId = React.useId();
  const triggerRef = React.useRef<HTMLElement>(null);
  const focusIntentRef = React.useRef<FocusIntent>('first');
  const open = parent.open && content.openSubId === subId;
  const { setOpenSubId } = content;
  const value = React.useMemo<MenuRootContextValue>(
    () => ({
      open,
      setOpen: (o: boolean) => setOpenSubId(o ? subId : null),
      closeAll: parent.closeAll,
      anchorRef: triggerRef,
      triggerRef,
      contentId: `${subId}-menu`,
      triggerId: `${subId}-trigger`,
      focusIntentRef,
      parent,
    }),
    [open, setOpenSubId, subId, parent],
  );
  return (
    <MenuSubContext.Provider value={{ subId }}>
      <MenuRootContext.Provider value={value}>{children}</MenuRootContext.Provider>
    </MenuSubContext.Provider>
  );
}

export const MenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  Omit<MenuItemProps, 'onSelect' | 'closeOnSelect'>
>(function MenuSubTrigger({ disabled, onKeyDown, onPointerMove, ...props }, forwardedRef) {
  const sub = useMenuRoot('DropdownMenuSubTrigger');
  const subCtx = React.useContext(MenuSubContext);
  const ref = useComposedRefs(forwardedRef, sub.triggerRef as React.Ref<HTMLDivElement>);
  // The item itself lives in the parent menu, so render it within the parent's root context.
  const parent = sub.parent!;
  return (
    <MenuRootContext.Provider value={parent}>
      <MenuItemBase
        ref={ref}
        role="menuitem"
        disabled={disabled}
        closeOnSelect={false}
        subId={subCtx?.subId}
        extraProps={{
          id: sub.triggerId,
          'aria-haspopup': 'menu',
          'aria-expanded': sub.open,
          'aria-controls': sub.open ? sub.contentId : undefined,
          'data-state': sub.open ? 'open' : 'closed',
        }}
        onSelect={() => {
          sub.focusIntentRef.current = 'first';
          sub.setOpen(true);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === 'ArrowRight' && !disabled) {
            e.preventDefault();
            e.stopPropagation();
            sub.focusIntentRef.current = 'first';
            sub.setOpen(true);
          }
        }}
        onPointerMove={(e) => {
          onPointerMove?.(e);
          if (!disabled && e.pointerType === 'mouse' && !sub.open) {
            sub.focusIntentRef.current = 'none';
            sub.setOpen(true);
          }
        }}
        trailing={<Icon name="chevron-right" size={14} className="st-menu__sub-icon" />}
        {...props}
      />
    </MenuRootContext.Provider>
  );
});

export const MenuSubContent = React.forwardRef<
  HTMLDivElement,
  Omit<MenuContentProps, 'side' | 'align'>
>(function MenuSubContent({ sideOffset = 2, alignOffset = -5, ...props }, ref) {
  return (
    <MenuContent
      ref={ref}
      side="right"
      align="start"
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      isSub
      {...props}
    />
  );
});
