'use client';
import * as React from 'react';

/**
 * Matches a keyboard event against a hotkey string such as `mod+k`, `shift+/` or `F8`.
 * `mod` is ⌘ on Apple platforms and Ctrl elsewhere.
 */
export function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());
  const key = parts.pop();
  if (!key) return false;
  const isMac =
    typeof navigator !== 'undefined' &&
    /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
  const want = {
    meta: parts.includes('meta') || (parts.includes('mod') && isMac),
    ctrl: parts.includes('ctrl') || (parts.includes('mod') && !isMac),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
  };
  if (event.metaKey !== want.meta || event.ctrlKey !== want.ctrl || event.altKey !== want.alt)
    return false;
  if (want.shift && !event.shiftKey) return false;
  return event.key.toLowerCase() === key;
}

/** Listens for a global hotkey on window. Pass `false`/undefined to disable. */
export function useHotkey(
  hotkey: string | false | undefined,
  handler: (event: KeyboardEvent) => void,
) {
  const ref = React.useRef(handler);
  ref.current = handler;
  React.useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (matchesHotkey(event, hotkey)) ref.current(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkey]);
}

/** Human-readable label for a hotkey, e.g. `mod+k` → `⌘K` / `Ctrl+K`. */
export function formatHotkey(hotkey: string): string {
  const isMac =
    typeof navigator !== 'undefined' &&
    /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
  return hotkey
    .split('+')
    .map((p) => {
      const k = p.trim().toLowerCase();
      if (k === 'mod') return isMac ? '⌘' : 'Ctrl';
      if (k === 'meta') return '⌘';
      if (k === 'ctrl') return 'Ctrl';
      if (k === 'shift') return isMac ? '⇧' : 'Shift';
      if (k === 'alt') return isMac ? '⌥' : 'Alt';
      return k.length === 1 ? k.toUpperCase() : p.trim();
    })
    .join(isMac ? '' : '+');
}
