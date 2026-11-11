'use client';
import * as React from 'react';

export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  enabled = true,
) {
  const ref = React.useRef(handler);
  ref.current = handler;
  React.useEffect(() => {
    if (!enabled) return;
    const listener = (e: WindowEventMap[K]) => ref.current(e);
    window.addEventListener(type, listener);
    return () => window.removeEventListener(type, listener);
  }, [type, enabled]);
}
