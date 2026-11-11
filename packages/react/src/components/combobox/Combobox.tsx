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
  type SelectOption,
  type SelectOptions,
} from '../select/listbox-core.js';

export interface ComboboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'prefix'
> {
  options: SelectOptions;
  /** Selected value (controlled). `null` for none. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Text in the input (controlled): use with `onInputChange` for async search. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (text: string) => void;
  /**
   * How options are filtered by the text. `true` (default) matches labels case-insensitively;
   * a function customises matching; `false` disables filtering (server-side search).
   */
  filter?: boolean | ((option: SelectOption, query: string) => boolean);
  /** Accept text that matches no option; the text itself becomes the value. */
  allowCustomValue?: boolean;
  /** Shows a loading row and sets aria-busy on the list. */
  loading?: boolean;
  loadingText?: React.ReactNode;
  emptyText?: React.ReactNode;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Leading content inside the field, e.g. a search icon. */
  prefix?: React.ReactNode;
  /** Open the list when the input receives focus. Default false. */
  openOnFocus?: boolean;
  /** Show a clear button when there is text. Default true. */
  clearable?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderOption?: (
    option: SelectOption,
    state: { selected: boolean; active: boolean },
  ) => React.ReactNode;
  wrapperClassName?: string;
}

function applyFilter(
  options: SelectOptions,
  query: string,
  filter: ComboboxProps['filter'],
): SelectOptions {
  if (filter === false || !query) return options;
  if (filter === true || filter === undefined) return filterOptions(options, query);
  const out: SelectOptions[number][] = [];
  for (const o of options) {
    if ('options' in o) {
      const kept = o.options.filter((x) => filter(x, query));
      if (kept.length) out.push({ label: o.label, options: kept });
    } else if (filter(o, query)) out.push(o);
  }
  return out;
}

/**
 * An editable input with a filtered list of suggestions (WAI-ARIA APG combobox with
 * list autocomplete). Supports async search, custom values and empty/loading states.
 */
export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    options,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    inputValue: inputValueProp,
    defaultInputValue,
    onInputChange,
    filter = true,
    allowCustomValue = false,
    loading = false,
    loadingText,
    emptyText = 'No results',
    invalid,
    size = 'md',
    prefix,
    openOnFocus = false,
    clearable = true,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    renderOption,
    name,
    form,
    className,
    wrapperClassName,
    onKeyDown,
    onFocus,
    onBlur,
    ...rest
  },
  forwardedRef,
) {
  const field = useFormField();
  const props = useFormFieldControl({
    ...rest,
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
  });
  const all = React.useMemo(() => flattenOptions(options), [options]);
  const labelFor = React.useCallback(
    (v: string | null) =>
      v == null ? '' : (all.find((f) => f.option.value === v)?.option.label ?? v),
    [all],
  );
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [text, setText] = useControllableState<string>({
    value: inputValueProp,
    defaultValue: defaultInputValue ?? labelFor(defaultValue),
    onChange: onInputChange,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  // Only filter after the user has typed since the list opened; reopening shows everything.
  const [typed, setTyped] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const composed = useComposedRefs(forwardedRef, inputRef);
  const listboxId = `${React.useId()}-listbox`;
  const visible = React.useMemo(
    () => (typed ? applyFilter(options, text, filter) : options),
    [options, text, filter, typed],
  );
  const flat = React.useMemo(() => flattenOptions(visible), [visible]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const isInvalid = props['aria-invalid'] === true || String(props['aria-invalid']) === 'true';

  // Keep the active option valid as the list changes.
  React.useEffect(() => {
    if (!open) return;
    setActiveIndex((i) => {
      if (i >= 0 && i < flat.length && !flat[i]!.option.disabled) return i;
      const selected = flat.find((f) => f.option.value === value);
      return typed || !selected ? (typed ? moveActive(flat, -1, 'first') : -1) : selected.index;
    });
  }, [open, flat, typed, value]);

  // Sync the text when the value changes from outside.
  const lastValue = React.useRef(value);
  React.useEffect(() => {
    if (lastValue.current !== value) {
      lastValue.current = value;
      if (inputValueProp === undefined) setText(labelFor(value));
    }
  }, [value, labelFor, setText, inputValueProp]);

  const close = () => {
    setOpen(false);
    setTyped(false);
  };
  const choose = (o: SelectOption) => {
    lastValue.current = o.value;
    setValue(o.value);
    setText(o.label);
    close();
  };
  const commitText = () => {
    const exact = all.find(
      (f) => f.option.label.toLowerCase() === text.trim().toLowerCase() && !f.option.disabled,
    );
    if (exact) {
      if (exact.option.value !== value) choose(exact.option);
      else setText(exact.option.label);
    } else if (allowCustomValue && text.trim()) {
      lastValue.current = text.trim();
      setValue(text.trim());
    } else if (!text.trim()) {
      lastValue.current = null;
      setValue(null);
    } else {
      setText(labelFor(value));
    }
  };

  // Arrow keys wrap around the list, as in the APG editable combobox examples.
  const wrap = (from: number, dir: 'next' | 'prev') => {
    const edge = moveActive(flat, -1, dir === 'next' ? 'last' : 'first');
    return from === edge
      ? moveActive(flat, -1, dir === 'next' ? 'first' : 'last')
      : moveActive(flat, from, dir);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          if (e.altKey) return;
          setActiveIndex(moveActive(flat, -1, 'first'));
        } else setActiveIndex(wrap(activeIndex, 'next'));
        return;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(moveActive(flat, -1, 'last'));
        } else setActiveIndex(wrap(activeIndex, 'prev'));
        return;
      case 'Enter':
        if (open && activeIndex >= 0 && flat[activeIndex]) {
          e.preventDefault();
          choose(flat[activeIndex]!.option);
        } else if (open) {
          e.preventDefault();
          commitText();
          close();
        }
        return;
      case 'Escape':
        // Open: the layer closes the list. Closed: clear the field (APG).
        if (!open && text) {
          e.preventDefault();
          setText('');
          lastValue.current = null;
          setValue(null);
        }
        return;
      case 'Tab':
        if (open) {
          if (activeIndex >= 0 && flat[activeIndex] && typed) choose(flat[activeIndex]!.option);
          else close();
        }
        return;
    }
  };

  return (
    <div
      ref={boxRef}
      className={cx('st-input st-combobox', wrapperClassName)}
      data-size={size}
      data-state={open ? 'open' : 'closed'}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={props.disabled ? '' : undefined}
    >
      {prefix != null && (
        <span className="st-input__affix" data-position="prefix">
          {prefix}
        </span>
      )}
      <input
        ref={composed}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(listboxId, activeIndex) : undefined
        }
        className={cx('st-input__control', className)}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setTyped(true);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          onFocus?.(e);
          if (openOnFocus && !open) setOpen(true);
        }}
        onBlur={(e) => {
          onBlur?.(e);
          commitText();
          close();
        }}
        onClick={() => {
          if (!open) setOpen(true);
        }}
        {...props}
      />
      {clearable && text && !props.disabled && !props.readOnly && (
        <button
          type="button"
          className="st-combobox__clear"
          aria-label="Clear"
          tabIndex={-1}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            setText('');
            lastValue.current = null;
            setValue(null);
            setTyped(true);
            inputRef.current?.focus();
          }}
        >
          <Icon name="x" size={14} />
        </button>
      )}
      <button
        type="button"
        className="st-combobox__toggle"
        aria-label={open ? 'Hide suggestions' : 'Show suggestions'}
        tabIndex={-1}
        disabled={props.disabled}
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => {
          inputRef.current?.focus();
          if (open) close();
          else setOpen(true);
        }}
      >
        <Icon name="chevron-down" size={16} />
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
        anchorRef={boxRef}
        listboxId={listboxId}
        labelledBy={field?.labelId}
        ariaLabel={
          !field ? ((props['aria-label'] as string | undefined) ?? 'Suggestions') : undefined
        }
        options={visible}
        flat={flat}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        isSelected={(v) => v === value}
        onSelectOption={choose}
        onDismiss={close}
        loading={loading}
        loadingText={loadingText}
        emptyText={
          allowCustomValue && text.trim() ? `Press Enter to use “${text.trim()}”` : emptyText
        }
        renderOption={renderOption}
        size={size}
      />
    </div>
  );
});
