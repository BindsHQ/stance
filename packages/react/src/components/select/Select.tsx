'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { useFormField, useFormFieldControl } from '../form-field/FormField.js';
import {
  ListboxPopup,
  flattenOptions,
  moveActive,
  optionId,
  useOptionTypeahead,
  type SelectOption,
  type SelectOptions,
} from './listbox-core.js';

export interface SelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> {
  /** Options, optionally grouped: `[{ label: 'Group', options: [...] }]`. */
  options: SelectOptions;
  /** Selected value (controlled). Use `null` for no selection. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Text shown when nothing is selected. */
  placeholder?: string;
  /** Form field name; a hidden input carries the value on submit. */
  name?: string;
  /** Form id, when the select lives outside its form element. */
  form?: string;
  required?: boolean;
  invalid?: boolean;
  /** Control height: sm 32, md 40, lg 48. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Custom option rendering inside the list. */
  renderOption?: (
    option: SelectOption,
    state: { selected: boolean; active: boolean },
  ) => React.ReactNode;
  /** Shown when `options` is empty. */
  emptyText?: React.ReactNode;
  /** Class for the popup. */
  contentClassName?: string;
}

/**
 * Choose one value from a list. A select-only combobox (WAI-ARIA APG): focus stays
 * on the trigger, arrow keys move the active option, typing jumps by label.
 */
export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    options,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    placeholder = 'Select…',
    name,
    form,
    required,
    invalid,
    size = 'md',
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    renderOption,
    emptyText,
    contentClassName,
    className,
    onKeyDown,
    onClick,
    onBlur,
    ...rest
  },
  forwardedRef,
) {
  const field = useFormField();
  const props = useFormFieldControl({
    ...rest,
    required,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((v: string | null) => void) | undefined,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const composed = useComposedRefs(forwardedRef, triggerRef);
  const listboxId = `${React.useId()}-listbox`;
  const flat = React.useMemo(() => flattenOptions(options), [options]);
  const selectedIndex = flat.findIndex((f) => f.option.value === value);
  const selected = selectedIndex >= 0 ? flat[selectedIndex]!.option : undefined;
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const typeahead = useOptionTypeahead(flat);
  const isInvalid = props['aria-invalid'] === true || String(props['aria-invalid']) === 'true';

  const openWith = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };
  const commit = (index: number) => {
    const f = flat[index];
    if (f && !f.option.disabled) setValue(f.option.value);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || props.disabled) return;
    const current = activeIndex >= 0 ? activeIndex : selectedIndex;
    if (!open) {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          e.preventDefault();
          openWith(
            current >= 0 ? current : moveActive(flat, -1, e.key === 'ArrowUp' ? 'last' : 'first'),
          );
          return;
        case 'Home':
          e.preventDefault();
          openWith(moveActive(flat, -1, 'first'));
          return;
        case 'End':
          e.preventDefault();
          openWith(moveActive(flat, -1, 'last'));
          return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const hit = typeahead(e.key, current);
        if (hit >= 0) openWith(hit);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (e.altKey) return;
        setActiveIndex(moveActive(flat, activeIndex, 'next'));
        return;
      case 'ArrowUp':
        e.preventDefault();
        if (e.altKey) commit(activeIndex);
        else setActiveIndex(moveActive(flat, activeIndex, 'prev'));
        return;
      case 'Home':
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'first'));
        return;
      case 'End':
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'last'));
        return;
      case 'PageDown':
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'page-down'));
        return;
      case 'PageUp':
        e.preventDefault();
        setActiveIndex(moveActive(flat, activeIndex, 'page-up'));
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        return;
      case 'Tab':
        // APG: Tab selects the active option and moves focus on.
        if (activeIndex >= 0) commit(activeIndex);
        else setOpen(false);
        return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const hit = typeahead(e.key, activeIndex);
      if (hit >= 0) setActiveIndex(hit);
    }
  };

  return (
    <>
      <button
        ref={composed}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(listboxId, activeIndex) : undefined
        }
        aria-labelledby={field && !props['aria-label'] ? field.labelId : undefined}
        data-state={open ? 'open' : 'closed'}
        data-size={size}
        data-placeholder={selected ? undefined : ''}
        data-invalid={isInvalid ? '' : undefined}
        data-disabled={props.disabled ? '' : undefined}
        className={cx('st-input st-select', className)}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          if (open) setOpen(false);
          else openWith(selectedIndex >= 0 ? selectedIndex : moveActive(flat, -1, 'first'));
        }}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onBlur?.(e);
          if (open) setOpen(false);
        }}
        {...props}
      >
        {selected?.icon && (
          <span className="st-select__icon" aria-hidden="true">
            {selected.icon}
          </span>
        )}
        <span className="st-select__value">{selected ? selected.label : placeholder}</span>
        <Icon name="chevrons-up-down" size={16} className="st-select__chevron" />
      </button>
      {name && (
        <input
          type="hidden"
          name={name}
          form={form}
          value={value ?? ''}
          disabled={props.disabled}
        />
      )}
      <ListboxPopup
        open={open}
        anchorRef={triggerRef}
        listboxId={listboxId}
        labelledBy={field?.labelId}
        ariaLabel={
          !field ? ((props['aria-label'] as string | undefined) ?? placeholder) : undefined
        }
        options={options}
        flat={flat}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        isSelected={(v) => v === value}
        onSelectOption={(o) => {
          setValue(o.value);
          setOpen(false);
        }}
        onDismiss={() => setOpen(false)}
        renderOption={renderOption}
        emptyText={emptyText}
        size={size}
        className={contentClassName}
      />
    </>
  );
});
