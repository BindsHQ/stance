'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { useFormField, useFormFieldControl } from '../form-field/FormField.js';
import {
  ListboxPopup,
  filterOptions,
  flattenOptions,
  moveActive,
  optionId,
  useOptionTypeahead,
  type SelectOption,
  type SelectOptions,
} from '../select/listbox-core.js';

export interface MultiSelectProps {
  options: SelectOptions;
  /** Selected values (controlled). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  /** Show a search input that filters options. Default false. */
  searchable?: boolean;
  /** Placeholder for the search input. Default "Search…". */
  searchPlaceholder?: string;
  /** Show "Select all" / "Clear" actions in the popup. Default true. */
  showActions?: boolean;
  /** Collapse tags beyond this count into “+N”. Default 3. */
  maxTags?: number;
  /** Form field name; one hidden input per selected value. */
  name?: string;
  form?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  emptyText?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /** Label for tag remove buttons. Default (label) => `Remove ${label}`. */
  removeLabel?: (label: string) => string;
}

/**
 * Choose several values from a list. Selected values appear as removable tags;
 * the popup is a multi-selectable listbox that stays open while you pick.
 */
export const MultiSelect = React.forwardRef<HTMLElement, MultiSelectProps>(function MultiSelect(
  {
    options,
    value: valueProp,
    defaultValue = [],
    onValueChange,
    placeholder = 'Select…',
    searchable = false,
    searchPlaceholder = 'Search…',
    showActions = true,
    maxTags = 3,
    name,
    form,
    size = 'md',
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    emptyText = 'No matches',
    className,
    invalid,
    removeLabel = (label) => `Remove ${label}`,
    ...rest
  },
  forwardedRef,
) {
  const field = useFormField();
  const props = useFormFieldControl({
    ...rest,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const [value, setValue] = useControllableState<string[]>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [query, setQuery] = React.useState('');
  const boxRef = React.useRef<HTMLDivElement>(null);
  const controlRef = React.useRef<HTMLElement>(null);
  const composed = useComposedRefs(forwardedRef, controlRef);
  const listboxId = `${React.useId()}-listbox`;
  const visible = React.useMemo(
    () => (searchable ? filterOptions(options, query) : options),
    [options, query, searchable],
  );
  const flat = React.useMemo(() => flattenOptions(visible), [visible]);
  const all = React.useMemo(() => flattenOptions(options), [options]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const typeahead = useOptionTypeahead(flat);
  const selectedSet = React.useMemo(() => new Set(value), [value]);
  const selectedOptions = value
    .map((v) => all.find((f) => f.option.value === v)?.option)
    .filter(Boolean) as SelectOption[];
  const isInvalid = props['aria-invalid'] === true || String(props['aria-invalid']) === 'true';
  const disabled = Boolean(props.disabled);

  React.useEffect(() => {
    if (open)
      setActiveIndex((i) => (i >= 0 && i < flat.length ? i : moveActive(flat, -1, 'first')));
  }, [open, flat]);
  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const toggle = (v: string) =>
    setValue(selectedSet.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  const enabledVisible = flat.filter((f) => !f.option.disabled).map((f) => f.option.value);
  const allSelected = enabledVisible.length > 0 && enabledVisible.every((v) => selectedSet.has(v));
  const selectAll = () => setValue(Array.from(new Set([...value, ...enabledVisible])));
  const clear = () => setValue([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && open) {
      e.preventDefault();
      if (allSelected) setValue(value.filter((v) => !enabledVisible.includes(v)));
      else selectAll();
      return;
    }
    if (e.key === 'Backspace' && searchable && query === '' && value.length) {
      setValue(value.slice(0, -1));
      return;
    }
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key) || (e.key === ' ' && !searchable)) {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(moveActive(flat, -1, e.key === 'ArrowUp' ? 'last' : 'first'));
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'next'));
        return;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'prev'));
        return;
      case 'Home':
        if (searchable) return;
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'first'));
        return;
      case 'End':
        if (searchable) return;
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'last'));
        return;
      case 'Enter':
        e.preventDefault();
        if (flat[activeIndex] && !flat[activeIndex]!.option.disabled)
          toggle(flat[activeIndex]!.option.value);
        return;
      case ' ':
        if (searchable) return;
        e.preventDefault();
        if (flat[activeIndex] && !flat[activeIndex]!.option.disabled)
          toggle(flat[activeIndex]!.option.value);
        return;
      case 'Tab':
        setOpen(false);
        return;
    }
    if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const hit = typeahead(e.key, activeIndex);
      if (hit >= 0) setActiveIndex(hit);
    }
  };

  const shown = selectedOptions.slice(0, maxTags);
  const hidden = selectedOptions.length - shown.length;
  const summary = selectedOptions.length === 0 ? placeholder : `${selectedOptions.length} selected`;
  const labelledBy = field && !props['aria-label'] ? field.labelId : undefined;

  const comboProps = {
    ref: composed,
    role: 'combobox' as const,
    id: props.id,
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': open,
    'aria-controls': open ? listboxId : undefined,
    'aria-activedescendant':
      open && activeIndex >= 0 ? optionId(listboxId, activeIndex) : undefined,
    'aria-labelledby': labelledBy,
    'aria-label': props['aria-label'],
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
    'aria-required': props.required || undefined,
    disabled,
    onKeyDown: handleKeyDown,
    onBlur: () => setOpen(false),
  };

  return (
    <div
      ref={boxRef}
      className={cx('st-input st-multi-select', className)}
      data-size={size}
      data-state={open ? 'open' : 'closed'}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      onPointerDown={(e) => {
        // Clicking the empty area of the box focuses/opens the control.
        if (disabled || e.target !== e.currentTarget) return;
        e.preventDefault();
        controlRef.current?.focus();
        setOpen(!open);
      }}
    >
      {shown.length > 0 && (
        <ul className="st-multi-select__tags" aria-label="Selected">
          {shown.map((o) => (
            <li key={o.value} className="st-multi-select__tag">
              <span className="st-multi-select__tag-label">{o.label}</span>
              <button
                type="button"
                className="st-multi-select__tag-remove"
                aria-label={removeLabel(o.label)}
                disabled={disabled}
                tabIndex={-1}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => setValue(value.filter((v) => v !== o.value))}
              >
                <Icon name="x" size={12} strokeWidth={2.25} />
              </button>
            </li>
          ))}
          {hidden > 0 && <li className="st-multi-select__more">+{hidden}</li>}
        </ul>
      )}
      {searchable ? (
        <input
          {...comboProps}
          ref={composed as React.Ref<HTMLInputElement>}
          type="text"
          autoComplete="off"
          aria-autocomplete="list"
          className="st-multi-select__search"
          placeholder={selectedOptions.length ? searchPlaceholder : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onClick={() => setOpen(true)}
        />
      ) : (
        <button
          {...comboProps}
          ref={composed as React.Ref<HTMLButtonElement>}
          type="button"
          className="st-multi-select__control"
          data-placeholder={selectedOptions.length ? undefined : ''}
          onClick={() => setOpen(!open)}
        >
          <span className={selectedOptions.length ? 'st-sr-only' : undefined}>{summary}</span>
        </button>
      )}
      {value.length > 0 && !disabled && (
        <button
          type="button"
          className="st-multi-select__clear"
          aria-label="Clear selection"
          tabIndex={-1}
          onPointerDown={(e) => e.preventDefault()}
          onClick={clear}
        >
          <Icon name="x" size={14} />
        </button>
      )}
      <Icon name="chevrons-up-down" size={16} className="st-select__chevron" />
      {name && value.map((v) => <input key={v} type="hidden" name={name} form={form} value={v} />)}
      <ListboxPopup
        open={open}
        anchorRef={boxRef}
        listboxId={listboxId}
        labelledBy={labelledBy}
        ariaLabel={props['aria-label'] ?? (!field ? placeholder : undefined)}
        options={visible}
        flat={flat}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        isSelected={(v) => selectedSet.has(v)}
        onSelectOption={(o) => toggle(o.value)}
        onDismiss={() => setOpen(false)}
        multiple
        emptyText={emptyText}
        size={size}
        header={
          showActions && flat.length > 0 ? (
            <div className="st-listbox__actions">
              <button
                type="button"
                tabIndex={-1}
                className="st-listbox__action"
                onPointerDown={(e) => e.preventDefault()}
                onClick={allSelected ? clear : selectAll}
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <span className="st-multi-select__count" aria-live="polite">
                {value.length} selected
              </span>
            </div>
          ) : undefined
        }
      />
    </div>
  );
});
