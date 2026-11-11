'use client';
import * as React from 'react';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Input, type InputProps } from '../input/Input.js';

export interface SearchInputProps extends Omit<
  InputProps,
  'type' | 'value' | 'defaultValue' | 'prefix'
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called on Enter. */
  onSearch?: (value: string) => void;
  onClear?: () => void;
  /** Keyboard hint shown while empty, e.g. "⌘K" or "/". Display only; wire the shortcut yourself. */
  shortcut?: string;
  /** Accessible label for the clear button. Default "Clear search". */
  clearLabel?: string;
  /** Show a spinner instead of the search icon (e.g. while fetching results). */
  loading?: boolean;
}

/** A search field with a clear button; Escape clears, Enter submits. */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value: valueProp,
      defaultValue = '',
      onValueChange,
      onSearch,
      onClear,
      shortcut,
      clearLabel = 'Clear search',
      loading,
      onChange,
      onKeyDown,
      placeholder = 'Search',
      ...props
    },
    forwardedRef,
  ) {
    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    });
    const ref = React.useRef<HTMLInputElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    const clear = () => {
      setValue('');
      onClear?.();
      ref.current?.focus();
    };
    return (
      <Input
        ref={composed}
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        value={value}
        wrapperClassName="st-search-input"
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            e.stopPropagation();
            clear();
          } else if (e.key === 'Enter') {
            onSearch?.(value);
          }
        }}
        prefix={
          loading ? (
            <span className="st-search-input__spinner" aria-hidden="true" />
          ) : (
            <Icon name="search" size={16} />
          )
        }
        suffix={
          value ? (
            <button
              type="button"
              className="st-search-input__clear"
              aria-label={clearLabel}
              title={clearLabel}
              onClick={clear}
              disabled={props.disabled}
            >
              <Icon name="x" size={14} />
            </button>
          ) : shortcut ? (
            <kbd className="st-search-input__shortcut" aria-hidden="true">
              {shortcut}
            </kbd>
          ) : undefined
        }
        {...props}
      />
    );
  },
);
