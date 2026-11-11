// The foreground/background pairs every theme must satisfy, with WCAG 2.2 AA minimums.
// 4.5 = body text (1.4.3); 3 = large text / UI component boundaries (1.4.11).
export const pairs = [
  ['fg-default', 'bg-canvas', 4.5], ['fg-default', 'bg-surface', 4.5], ['fg-default', 'bg-muted', 4.5],
  ['fg-default', 'bg-surface-raised', 4.5], ['fg-default', 'bg-emphasis', 4.5],
  ['fg-muted', 'bg-canvas', 4.5], ['fg-muted', 'bg-surface', 4.5], ['fg-muted', 'bg-muted', 4.5],
  ['fg-subtle', 'bg-canvas', 4.5], ['fg-subtle', 'bg-surface', 4.5],
  ['fg-inverse', 'bg-inverse', 4.5], ['accent-fg', 'accent-bg', 4.5], ['accent-fg', 'accent-bg-hover', 4.5],
  ['accent-fg', 'accent-bg-active', 4.5], ['interactive-selected-fg', 'interactive-selected', 4.5],
  ['fg-link', 'bg-canvas', 4.5],
  ['border-control', 'bg-canvas', 3], ['border-control', 'bg-surface', 3],
  ['focus-ring', 'bg-canvas', 3], ['focus-ring', 'bg-surface', 3], ['focus-ring', 'focus-ring-offset', 3],
  ['danger-fg', 'bg-canvas', 4.5], ['danger-fg', 'danger-bg', 4.5], ['danger-on-solid', 'danger-solid', 4.5],
  ['danger-on-solid', 'danger-solid-hover', 4.5],
  ['success-fg', 'bg-canvas', 4.5], ['success-fg', 'success-bg', 4.5], ['success-on-solid', 'success-solid', 4.5],
  ['warning-fg', 'bg-canvas', 4.5], ['warning-fg', 'warning-bg', 4.5], ['warning-on-solid', 'warning-solid', 4.5],
  ['info-fg', 'bg-canvas', 4.5], ['info-fg', 'info-bg', 4.5], ['info-on-solid', 'info-solid', 4.5],
  ['chart-1', 'bg-surface', 3], ['chart-2', 'bg-surface', 3],
];
/** High contrast raises every text pair to AAA (7:1) and every boundary to 4.5:1. */
export const hcBoost = (min) => (min >= 4.5 ? 7 : 4.5);

export function report(t) {
  const rows = [];
  for (const theme of [t.light, t.dark, t.highContrast]) {
    for (const [fg, bg, min] of pairs) {
      const required = theme.name === 'high-contrast' ? hcBoost(min) : min;
      const ratio = t.contrastRatio(theme.colors[fg], theme.colors[bg]);
      rows.push({ theme: theme.name, fg, bg, ratio: Math.round(ratio * 100) / 100, required, pass: ratio >= required });
    }
  }
  return rows;
}
