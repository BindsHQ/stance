export type Direction = 'ltr' | 'rtl';

/**
 * Reads the text direction that applies to an element.
 * Prefers the nearest explicit `dir` attribute, which is cheap and works without layout;
 * falls back to the computed `direction` for `dir="auto"` and CSS-only direction.
 */
export function getDirection(element: Element | null | undefined): Direction {
  if (!element) return 'ltr';
  const attr = element.closest('[dir]')?.getAttribute('dir')?.toLowerCase();
  if (attr === 'rtl' || attr === 'ltr') return attr;
  const view = element.ownerDocument?.defaultView;
  return view?.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}

export function isRtl(element: Element | null | undefined): boolean {
  return getDirection(element) === 'rtl';
}

/**
 * Maps a physical horizontal arrow key to its logical meaning for the element's direction:
 * `ArrowRight` in RTL behaves like `ArrowLeft` in LTR and the reverse. Other keys pass through.
 */
export function logicalKey(key: string, element: Element | null | undefined): string {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return key;
  if (!isRtl(element)) return key;
  return key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
}
