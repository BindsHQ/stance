'use client';
/**
 * The Stance listbox engine, shared by Select, MultiSelect and Combobox.
 * Focus stays on the trigger or input; the active option is conveyed with
 * aria-activedescendant (WAI-ARIA APG combobox pattern).
 */
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useDismissableLayer } from '../../internal/layer-stack.js';
import { Portal } from '../../internal/portal.js';
import { useFloating } from '../../internal/use-floating.js';
import { Icon } from '../../icons/Icon.js';
import { Spinner } from '../spinner/Spinner.js';

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  disabled?: boolean;
  /** Leading visual, e.g. an Icon or Avatar. */
  icon?: React.ReactNode;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export type SelectOptions = ReadonlyArray<SelectOption | SelectOptionGroup>;

export interface FlatOption {
  option: SelectOption;
  index: number;
  group?: string;
}

export function isOptionGroup(o: SelectOption | SelectOptionGroup): o is SelectOptionGroup {
  return 'options' in o && Array.isArray((o as SelectOptionGroup).options);
}

export function flattenOptions(options: SelectOptions): FlatOption[] {
  const out: FlatOption[] = [];
  for (const o of options) {
    if (isOptionGroup(o))
      for (const child of o.options) out.push({ option: child, index: out.length, group: o.label });
    else out.push({ option: o, index: out.length });
  }
  return out;
}

/** Filters options (keeping groups) by a case-insensitive label match. */
export function filterOptions(options: SelectOptions, query: string): SelectOptions {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  const match = (o: SelectOption) =>
    o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q);
  const out: (SelectOption | SelectOptionGroup)[] = [];
  for (const o of options) {
    if (isOptionGroup(o)) {
      const kept = o.options.filter(match);
      if (kept.length) out.push({ label: o.label, options: kept });
    } else if (match(o)) out.push(o);
  }
  return out;
}

/** Finds the next enabled option index in a direction, or by keyword. */
export function moveActive(
  flat: FlatOption[],
  current: number,
  to: 'next' | 'prev' | 'first' | 'last' | 'page-down' | 'page-up',
): number {
  const enabled = flat.filter((f) => !f.option.disabled).map((f) => f.index);
  if (enabled.length === 0) return -1;
  const pos = enabled.indexOf(current);
  switch (to) {
    case 'first':
      return enabled[0]!;
    case 'last':
      return enabled[enabled.length - 1]!;
    case 'next':
      return pos < 0 ? enabled[0]! : enabled[Math.min(pos + 1, enabled.length - 1)]!;
    case 'prev':
      return pos < 0 ? enabled[enabled.length - 1]! : enabled[Math.max(pos - 1, 0)]!;
    case 'page-down':
      return enabled[Math.min((pos < 0 ? 0 : pos) + 10, enabled.length - 1)]!;
    case 'page-up':
      return enabled[Math.max((pos < 0 ? 0 : pos) - 10, 0)]!;
  }
}

/** Typeahead over option labels; returns a hook that maps keystrokes to an option index. */
export function useOptionTypeahead(flat: FlatOption[]) {
  const buffer = React.useRef('');
  const timer = React.useRef<number | undefined>(undefined);
  return React.useCallback(
    (key: string, current: number): number => {
      window.clearTimeout(timer.current);
      buffer.current += key.toLowerCase();
      timer.current = window.setTimeout(() => (buffer.current = ''), 600);
      const buf = buffer.current;
      const search = buf.split('').every((c) => c === buf[0]) ? buf[0]! : buf;
      const start = Math.max(
        0,
        flat.findIndex((f) => f.index === current),
      );
      const ordered = [...flat.slice(start + 1), ...flat.slice(0, start + 1)];
      const hit = ordered.find(
        (f) => !f.option.disabled && f.option.label.toLowerCase().startsWith(search),
      );
      return hit ? hit.index : -1;
    },
    [flat],
  );
}

export const optionId = (listboxId: string, index: number) => `${listboxId}-option-${index}`;

export interface ListboxPopupProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  listboxId: string;
  /** id(s) labelling the listbox. */
  labelledBy?: string | undefined;
  ariaLabel?: string | undefined;
  options: SelectOptions;
  flat: FlatOption[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  isSelected: (value: string) => boolean;
  onSelectOption: (option: SelectOption) => void;
  onDismiss: () => void;
  multiple?: boolean;
  loading?: boolean;
  loadingText?: React.ReactNode;
  emptyText?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  renderOption?:
    | ((option: SelectOption, state: { selected: boolean; active: boolean }) => React.ReactNode)
    | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string | undefined;
}

/** The floating listbox popup. Pointer interactions never move focus off the trigger. */
export function ListboxPopup({
  open,
  anchorRef,
  listboxId,
  labelledBy,
  ariaLabel,
  options,
  flat,
  activeIndex,
  setActiveIndex,
  isSelected,
  onSelectOption,
  onDismiss,
  multiple = false,
  loading = false,
  loadingText = 'Loading…',
  emptyText = 'No options',
  header,
  footer,
  renderOption,
  size = 'md',
  className,
}: ListboxPopupProps) {
  const popupRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const floating = useFloating(anchorRef, popupRef, {
    open,
    side: 'bottom',
    align: 'start',
    sideOffset: 4,
    matchAnchorWidth: true,
  });
  useDismissableLayer(popupRef, { enabled: open, onDismiss, excludeRefs: [anchorRef] });

  React.useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(optionId(listboxId, activeIndex))?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, listboxId]);

  if (!open) return null;

  const renderOne = (f: FlatOption) => {
    const { option, index } = f;
    const selected = isSelected(option.value);
    const active = index === activeIndex;
    return (
      <li
        key={`${option.value}-${index}`}
        id={optionId(listboxId, index)}
        role="option"
        aria-selected={selected}
        aria-disabled={option.disabled || undefined}
        data-active={active ? '' : undefined}
        data-disabled={option.disabled ? '' : undefined}
        className="st-listbox__option"
        onPointerDown={(e) => e.preventDefault()}
        onPointerMove={() => {
          if (!option.disabled && !active) setActiveIndex(index);
        }}
        onClick={() => {
          if (!option.disabled) onSelectOption(option);
        }}
      >
        {multiple && (
          <span
            className="st-listbox__checkbox"
            data-checked={selected ? '' : undefined}
            aria-hidden="true"
          >
            {selected && <Icon name="check" size={12} strokeWidth={2.5} />}
          </span>
        )}
        {renderOption ? (
          renderOption(option, { selected, active })
        ) : (
          <>
            {option.icon && (
              <span className="st-listbox__icon" aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span className="st-listbox__text">
              <span className="st-listbox__label">{option.label}</span>
              {option.description && (
                <span className="st-listbox__description">{option.description}</span>
              )}
            </span>
          </>
        )}
        {!multiple && selected && <Icon name="check" size={16} className="st-listbox__check" />}
      </li>
    );
  };

  let cursor = 0;
  const body = options.map((o, gi) => {
    if (isOptionGroup(o)) {
      const items = flat.slice(cursor, cursor + o.options.length);
      cursor += o.options.length;
      const gid = `${listboxId}-group-${gi}`;
      return (
        <li key={gid} role="presentation" className="st-listbox__group">
          <div id={gid} className="st-listbox__group-label" role="presentation">
            {o.label}
          </div>
          <ul role="group" aria-labelledby={gid} className="st-listbox__group-list">
            {items.map(renderOne)}
          </ul>
        </li>
      );
    }
    const f = flat[cursor++]!;
    return renderOne(f);
  });

  return (
    <Portal>
      <div
        ref={popupRef}
        data-stance-layer=""
        data-state="open"
        data-side={floating.side}
        data-size={size}
        className={cx('st-floating st-listbox', className)}
        style={floating.style}
      >
        {header}
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={ariaLabel ? undefined : labelledBy}
          aria-label={ariaLabel}
          aria-multiselectable={multiple || undefined}
          aria-busy={loading || undefined}
          tabIndex={-1}
          className="st-listbox__list"
        >
          {body}
        </ul>
        {loading ? (
          <div className="st-listbox__status" role="status">
            <Spinner size="sm" label={null} /> {loadingText}
          </div>
        ) : (
          flat.length === 0 && (
            <div className="st-listbox__status" role="status">
              {emptyText}
            </div>
          )
        )}
        {footer}
      </div>
    </Portal>
  );
}
