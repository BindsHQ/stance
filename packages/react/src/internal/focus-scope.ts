'use client';
import * as React from 'react';
import { focusElement, getTabbables } from './focusable.js';

export interface FocusScopeOptions {
  enabled: boolean;
  /** Keep Tab / Shift+Tab inside the container. */
  trapped?: boolean;
  /** Element to focus on mount; defaults to the first tabbable, then the container. */
  initialFocus?: React.RefObject<HTMLElement | null> | undefined;
  /** Return focus to the previously focused element on unmount. Default true. */
  restoreFocus?: boolean;
  onMountAutoFocus?: ((event: Event) => void) | undefined;
  onUnmountAutoFocus?: ((event: Event) => void) | undefined;
}

export function useFocusScope(ref: React.RefObject<HTMLElement | null>, options: FocusScopeOptions) {
  const { enabled, trapped = true, restoreFocus = true } = options;
  const optsRef = React.useRef(options);
  optsRef.current = options;

  React.useEffect(() => {
    if (!enabled) return;
    const container = ref.current;
    if (!container) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const mountEvent = new Event('stance.focusScope.mount', { cancelable: true });
    optsRef.current.onMountAutoFocus?.(mountEvent);
    if (!mountEvent.defaultPrevented && !container.contains(document.activeElement)) {
      const target =
        optsRef.current.initialFocus?.current ??
        container.querySelector<HTMLElement>('[data-autofocus],[autofocus]') ??
        getTabbables(container)[0] ??
        container;
      focusElement(target);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!trapped || event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const tabbables = getTabbables(container);
      if (tabbables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = tabbables[0]!;
      const last = tabbables[tabbables.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        focusElement(last);
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        focusElement(first);
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!trapped) return;
      const target = event.target as Node | null;
      if (target && !container.contains(target)) {
        // Allow focus to move into higher layers portalled elsewhere (e.g. a popover inside a dialog).
        const inLayer = (target as Element).closest?.('[data-stance-layer]');
        if (inLayer && inLayer !== container) return;
        focusElement(getTabbables(container)[0] ?? container);
      }
    };
    container.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      const unmountEvent = new Event('stance.focusScope.unmount', { cancelable: true });
      optsRef.current.onUnmountAutoFocus?.(unmountEvent);
      if (restoreFocus && !unmountEvent.defaultPrevented && previouslyFocused?.isConnected) {
        // Defer so the restoring happens after React commits the unmount.
        window.setTimeout(() => focusElement(previouslyFocused), 0);
      }
    };
  }, [enabled, ref, trapped, restoreFocus]);
}
