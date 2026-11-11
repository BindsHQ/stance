export const tokenPrefix = 'st';

/** `cssVar('color', 'bg-canvas')` → `var(--st-color-bg-canvas)` */
export function cssVar(category: string, name: string): string {
  return `var(--${tokenPrefix}-${category}-${name})`;
}
