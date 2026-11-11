'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useRovingFocus } from '../../internal/roving-focus.js';
import { useControllableState } from '../../internal/use-controllable-state.js';

type Orientation = 'horizontal' | 'vertical';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  orientation: Orientation;
  activationMode: 'automatic' | 'manual';
  variant: 'line' | 'pill';
  size: 'sm' | 'md';
}

const [TabsProvider, useTabsContext] = createStrictContext<TabsContextValue>('Tabs');

const slug = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`);
const triggerId = (base: string, value: string) => `${base}-tab-${slug(value)}`;
const panelId = (base: string, value: string) => `${base}-panel-${slug(value)}`;

export interface TabsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Controlled selected tab value. */
  value?: string;
  /** Initially selected tab when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Default `horizontal`. */
  orientation?: Orientation;
  /**
   * `automatic` selects a tab as soon as it receives focus (recommended when panels render instantly).
   * `manual` requires Enter/Space (use when panels load data). Default `automatic`.
   */
  activationMode?: 'automatic' | 'manual';
  /** `line` underlines the active tab; `pill` fills it. Default `line`. */
  variant?: 'line' | 'pill';
  size?: 'sm' | 'md';
}

/** Organises related content into panels shown one at a time. */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    orientation = 'horizontal',
    activationMode = 'automatic',
    variant = 'line',
    size = 'md',
    className,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const baseId = React.useId();
  const ctx = React.useMemo(
    () => ({ value, setValue, baseId, orientation, activationMode, variant, size }),
    [value, setValue, baseId, orientation, activationMode, variant, size],
  );
  return (
    <TabsProvider value={ctx}>
      <div
        ref={ref}
        className={cx('st-tabs', className)}
        data-orientation={orientation}
        data-variant={variant}
        data-size={size}
        {...props}
      />
    </TabsProvider>
  );
});

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Wrap keyboard focus from last to first. Default true. */
  loop?: boolean;
  /** Stretch triggers to fill the width (horizontal only). */
  fullWidth?: boolean;
}

/** The row (or column) of tabs. Requires an accessible name when a page has several tab sets. */
export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { loop = true, fullWidth, className, onKeyDown, ...props },
  forwardedRef,
) {
  const ctx = useTabsContext('TabsList');
  const ref = React.useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(forwardedRef, ref);
  const { onKeyDown: roving } = useRovingFocus(ref, { orientation: ctx.orientation, loop });
  return (
    <div
      ref={composed}
      role="tablist"
      aria-orientation={ctx.orientation}
      className={cx('st-tabs__list', className)}
      data-orientation={ctx.orientation}
      data-full-width={fullWidth ? '' : undefined}
      onKeyDown={composeHandlers(onKeyDown, roving)}
      {...props}
    />
  );
});

export interface TabsTriggerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> {
  /** Value that identifies this tab and its panel. */
  value: string;
  /** Optional icon before the label. */
  icon?: React.ReactNode;
  /** Optional trailing content such as a count. */
  badge?: React.ReactNode;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger(
    { value, icon, badge, disabled, className, children, onFocus, onClick, onKeyDown, ...props },
    ref,
  ) {
    const ctx = useTabsContext('TabsTrigger');
    const selected = ctx.value === value;
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={triggerId(ctx.baseId, value)}
        aria-selected={selected}
        aria-controls={panelId(ctx.baseId, value)}
        tabIndex={selected ? 0 : -1}
        disabled={disabled}
        data-state={selected ? 'active' : 'inactive'}
        data-roving-item=""
        data-disabled={disabled ? '' : undefined}
        className={cx('st-tabs__trigger', className)}
        onFocus={composeHandlers(onFocus, () => {
          if (ctx.activationMode === 'automatic' && !disabled) ctx.setValue(value);
        })}
        onClick={composeHandlers(onClick, () => {
          if (!disabled) ctx.setValue(value);
        })}
        onKeyDown={composeHandlers(onKeyDown, (e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            ctx.setValue(value);
          }
        })}
        {...props}
      >
        {icon && (
          <span className="st-tabs__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="st-tabs__label">{children}</span>
        {badge != null && <span className="st-tabs__badge">{badge}</span>}
      </button>
    );
  },
);

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Keep the panel mounted (hidden) when inactive, preserving its state. Default false. */
  forceMount?: boolean;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, forceMount, className, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsContent');
  const selected = ctx.value === value;
  if (!selected && !forceMount) return null;
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={panelId(ctx.baseId, value)}
      aria-labelledby={triggerId(ctx.baseId, value)}
      tabIndex={0}
      hidden={!selected}
      data-state={selected ? 'active' : 'inactive'}
      className={cx('st-tabs__content', className)}
      {...props}
    />
  );
});

export { useTabsContext };
