'use client';
import * as React from 'react';

/**
 * A global stack of open dismissable layers (dialogs, popovers, menus).
 * Only the top-most layer reacts to Escape, and clicks inside a higher
 * layer never dismiss the layers below it, even when portalled elsewhere.
 */
const stack: { ref: React.RefObject<HTMLElement | null> }[] = [];

export interface DismissOptions {
  enabled: boolean;
  onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  onPointerDownOutside?: ((event: PointerEvent) => void) | undefined;
  onFocusOutside?: ((event: FocusEvent) => void) | undefined;
  onDismiss: () => void;
  /** Elements (e.g. the trigger) that never count as "outside". */
  excludeRefs?: React.RefObject<HTMLElement | null>[] | undefined;
}

export function useDismissableLayer(ref: React.RefObject<HTMLElement | null>, options: DismissOptions) {
  const optsRef = React.useRef(options);
  optsRef.current = options;
  const { enabled } = options;

  React.useEffect(() => {
    if (!enabled) return;
    const entry = { ref };
    stack.push(entry);
    const isTop = () => stack[stack.length - 1] === entry;
    const insideHigherLayer = (target: Node) => {
      const idx = stack.indexOf(entry);
      return stack.slice(idx + 1).some((l) => l.ref.current?.contains(target));
    };
    const isOutside = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      if (!target.isConnected) return false;
      if (ref.current?.contains(target)) return false;
      if (optsRef.current.excludeRefs?.some((r) => r.current?.contains(target))) return false;
      if (insideHigherLayer(target)) return false;
      return true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !isTop()) return;
      optsRef.current.onEscapeKeyDown?.(event);
      if (!event.defaultPrevented) {
        event.preventDefault();
        event.stopPropagation();
        optsRef.current.onDismiss();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!isOutside(event.target)) return;
      optsRef.current.onPointerDownOutside?.(event);
      if (!event.defaultPrevented) optsRef.current.onDismiss();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!optsRef.current.onFocusOutside || !isOutside(event.target)) return;
      optsRef.current.onFocusOutside(event);
    };
    // Defer pointer listener so the opening click doesn't immediately close the layer.
    const timer = window.setTimeout(() => document.addEventListener('pointerdown', onPointerDown, true), 0);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [enabled, ref]);
}
