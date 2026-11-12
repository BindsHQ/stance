'use client';
import * as React from 'react';

export interface Announcer {
  /** Speaks a message politely. Repeating the same message speaks it again. */
  announce: (message: string) => void;
  /** The visually hidden live region. Render it once, anywhere inside the component. */
  region: React.ReactElement;
}

/**
 * A polite, visually hidden live region for one component. Use it for state changes
 * (started, finished, copied), never for streamed tokens.
 */
export function useAnnouncer(politeness: 'polite' | 'assertive' = 'polite'): Announcer {
  const [state, setState] = React.useState({ message: '', tick: 0 });
  const announce = React.useCallback((message: string) => {
    setState((prev) => ({ message, tick: prev.tick + 1 }));
  }, []);
  const region = (
    <span
      className="st-sr-only"
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      data-st-announcer=""
    >
      {/* A changing invisible suffix makes an identical message count as new content. */}
      {state.message ? state.message + (state.tick % 2 ? ' ' : '') : ''}
    </span>
  );
  return { announce, region };
}
