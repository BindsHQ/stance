const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

function isVisible(el: HTMLElement): boolean {
  if (el.hidden) return false;
  // jsdom has no layout; treat elements as visible unless explicitly hidden.
  const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
  return !style || (style.visibility !== 'hidden' && style.display !== 'none');
}

/** Tabbable descendants in DOM order (excludes tabindex="-1"). */
export function getTabbables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) =>
      el.tabIndex >= 0 && !el.hasAttribute('inert') && !el.closest('[inert]') && isVisible(el),
  );
}

export function focusElement(el: HTMLElement | null | undefined, options?: { select?: boolean }) {
  if (!el || typeof el.focus !== 'function') return;
  el.focus({ preventScroll: true });
  if (options?.select && el instanceof HTMLInputElement) el.select();
}
