'use client';
import * as React from 'react';

/** Accumulates printable keystrokes for 600ms and returns the first item whose label matches. */
export function useTypeahead<T>(items: () => T[], getLabel: (item: T) => string, current: () => T | undefined) {
  const buffer = React.useRef('');
  const timer = React.useRef<number | undefined>(undefined);
  return React.useCallback(
    (key: string): T | undefined => {
      if (key.length !== 1 || key === ' ' && buffer.current === '') return undefined;
      window.clearTimeout(timer.current);
      buffer.current += key.toLowerCase();
      timer.current = window.setTimeout(() => (buffer.current = ''), 600);
      const list = items();
      const start = Math.max(0, list.indexOf(current() as T));
      const ordered = [...list.slice(start + 1), ...list.slice(0, start + 1)];
      const search = buffer.current.split('').every((c) => c === buffer.current[0]) ? buffer.current[0]! : buffer.current;
      return ordered.find((item) => getLabel(item).toLowerCase().startsWith(search));
    },
    [items, getLabel, current],
  );
}
