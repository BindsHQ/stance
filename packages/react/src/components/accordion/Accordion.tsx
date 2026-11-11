'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { createStrictContext } from '../../internal/context.js';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  headingLevel: 2 | 3 | 4 | 5 | 6;
  disabled: boolean;
  baseId: string;
}

const [AccordionProvider, useAccordionContext] =
  createStrictContext<AccordionContextValue>('Accordion');

interface AccordionItemContextValue {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
}

const [AccordionItemProvider, useAccordionItemContext] =
  createStrictContext<AccordionItemContextValue>('AccordionItem');

interface AccordionBaseProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Heading level wrapping each trigger. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  disabled?: boolean;
  variant?: 'default' | 'separated';
}

export interface AccordionSingleProps extends AccordionBaseProps {
  type?: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Allow closing the open item. Default true. */
  collapsible?: boolean;
}

export interface AccordionMultipleProps extends AccordionBaseProps {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

/** Vertically stacked headings that each reveal a section (WAI-ARIA accordion pattern). */
export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(props, ref) {
    if (props.type === 'multiple') return <AccordionMultiple ref={ref} {...props} />;
    return <AccordionSingle ref={ref} {...props} />;
  },
);

const AccordionSingle = React.forwardRef<HTMLDivElement, AccordionSingleProps>(
  function AccordionSingle(
    { type: _type, value, defaultValue = null, onValueChange, collapsible = true, ...rest },
    ref,
  ) {
    const [current, setCurrent] = useControllableState<string | null>({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const isOpen = React.useCallback((v: string) => current === v, [current]);
    const toggle = React.useCallback(
      (v: string) => setCurrent((prev) => (prev === v ? (collapsible ? null : prev) : v)),
      [setCurrent, collapsible],
    );
    return <AccordionRoot ref={ref} isOpen={isOpen} toggle={toggle} {...rest} />;
  },
);

const AccordionMultiple = React.forwardRef<HTMLDivElement, AccordionMultipleProps>(
  function AccordionMultiple(
    { type: _type, value, defaultValue = [], onValueChange, ...rest },
    ref,
  ) {
    const [current, setCurrent] = useControllableState<string[]>({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const isOpen = React.useCallback((v: string) => current.includes(v), [current]);
    const toggle = React.useCallback(
      (v: string) =>
        setCurrent((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])),
      [setCurrent],
    );
    return <AccordionRoot ref={ref} isOpen={isOpen} toggle={toggle} {...rest} />;
  },
);

const AccordionRoot = React.forwardRef<
  HTMLDivElement,
  AccordionBaseProps & { isOpen: (v: string) => boolean; toggle: (v: string) => void }
>(function AccordionRoot(
  {
    isOpen,
    toggle,
    headingLevel = 3,
    disabled = false,
    variant = 'default',
    className,
    onKeyDown,
    ...props
  },
  ref,
) {
  const baseId = React.useId();
  const value = React.useMemo(
    () => ({ isOpen, toggle, headingLevel, disabled, baseId }),
    [isOpen, toggle, headingLevel, disabled, baseId],
  );
  // Optional APG keyboard support: Up/Down/Home/End move between headers.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('st-accordion__trigger')) return;
    const root = event.currentTarget;
    const triggers = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.st-accordion__trigger'),
    ).filter((t) => !t.disabled && t.closest('.st-accordion') === root);
    const i = triggers.indexOf(target as HTMLButtonElement);
    let next: HTMLButtonElement | undefined;
    if (event.key === 'ArrowDown') next = triggers[(i + 1) % triggers.length];
    else if (event.key === 'ArrowUp') next = triggers[(i - 1 + triggers.length) % triggers.length];
    else if (event.key === 'Home') next = triggers[0];
    else if (event.key === 'End') next = triggers[triggers.length - 1];
    if (next) {
      event.preventDefault();
      next.focus();
    }
  };
  return (
    <AccordionProvider value={value}>
      <div
        ref={ref}
        className={cx('st-accordion', className)}
        data-variant={variant}
        onKeyDown={composeHandlers(onKeyDown, handleKeyDown)}
        {...props}
      />
    </AccordionProvider>
  );
});

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique value identifying this item. */
  value: string;
  disabled?: boolean;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem({ value, disabled, className, ...props }, ref) {
    const ctx = useAccordionContext('AccordionItem');
    const open = ctx.isOpen(value);
    const isDisabled = disabled ?? ctx.disabled;
    const safe = value.replace(/[^a-zA-Z0-9_-]/g, '_');
    const item = React.useMemo(
      () => ({
        value,
        open,
        disabled: isDisabled,
        triggerId: `${ctx.baseId}-${safe}-trigger`,
        contentId: `${ctx.baseId}-${safe}-content`,
      }),
      [value, open, isDisabled, ctx.baseId, safe],
    );
    return (
      <AccordionItemProvider value={item}>
        <div
          ref={ref}
          className={cx('st-accordion__item', className)}
          data-state={open ? 'open' : 'closed'}
          data-disabled={isDisabled ? '' : undefined}
          {...props}
        />
      </AccordionItemProvider>
    );
  },
);

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Hide the chevron indicator. */
  hideIndicator?: boolean;
}

/** The header button. Rendered inside a heading of the accordion's `headingLevel`. */
export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  function AccordionTrigger({ hideIndicator, className, children, onClick, ...props }, ref) {
    const ctx = useAccordionContext('AccordionTrigger');
    const item = useAccordionItemContext('AccordionTrigger');
    const Heading = `h${ctx.headingLevel}` as 'h3';
    return (
      <Heading className="st-accordion__heading">
        <button
          ref={ref}
          type="button"
          id={item.triggerId}
          aria-expanded={item.open}
          aria-controls={item.contentId}
          disabled={item.disabled || undefined}
          data-state={item.open ? 'open' : 'closed'}
          className={cx('st-accordion__trigger', className)}
          onClick={composeHandlers(onClick, () => ctx.toggle(item.value))}
          {...props}
        >
          <span className="st-accordion__label">{children}</span>
          {!hideIndicator && (
            <Icon name="chevron-down" size={16} className="st-accordion__chevron" />
          )}
        </button>
      </Heading>
    );
  },
);

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  function AccordionContent({ forceMount = false, className, children, ...props }, ref) {
    const item = useAccordionItemContext('AccordionContent');
    if (!item.open && !forceMount) return null;
    return (
      <div
        ref={ref}
        id={item.contentId}
        role="region"
        aria-labelledby={item.triggerId}
        hidden={!item.open}
        data-state={item.open ? 'open' : 'closed'}
        className={cx('st-accordion__content', className)}
        {...props}
      >
        <div className="st-accordion__content-inner">{children}</div>
      </div>
    );
  },
);
