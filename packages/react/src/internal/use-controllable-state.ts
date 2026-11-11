import * as React from 'react';

interface Options<T> {
  value?: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
}

/** Supports both controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) usage. */
export function useControllableState<T>({ value, defaultValue, onChange }: Options<T>) {
  const [internal, setInternal] = React.useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : internal;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const currentRef = React.useRef(current);
  currentRef.current = current;

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(currentRef.current) : next;
      if (Object.is(resolved, currentRef.current)) return;
      if (!controlled) setInternal(resolved);
      currentRef.current = resolved;
      onChangeRef.current?.(resolved);
    },
    [controlled],
  );
  return [current, setValue] as const;
}
