'use client';
import * as React from 'react';

export interface HoverIntentOptions {
  setOpen: (open: boolean) => void;
  openDelay: number;
  closeDelay: number;
}

/** Debounced open/close for hover-driven surfaces (Tooltip, HoverCard). */
export function useHoverIntent({ setOpen, openDelay, closeDelay }: HoverIntentOptions) {
  const timer = React.useRef<number | undefined>(undefined);
  const setOpenRef = React.useRef(setOpen);
  setOpenRef.current = setOpen;
  const cancel = React.useCallback(() => window.clearTimeout(timer.current), []);
  const schedule = React.useCallback(
    (open: boolean, delay: number) => {
      cancel();
      if (delay <= 0) setOpenRef.current(open);
      else timer.current = window.setTimeout(() => setOpenRef.current(open), delay);
    },
    [cancel],
  );
  React.useEffect(() => cancel, [cancel]);
  return {
    scheduleOpen: React.useCallback(
      (delay = openDelay) => schedule(true, delay),
      [schedule, openDelay],
    ),
    scheduleClose: React.useCallback(
      (delay = closeDelay) => schedule(false, delay),
      [schedule, closeDelay],
    ),
    cancel,
  };
}
