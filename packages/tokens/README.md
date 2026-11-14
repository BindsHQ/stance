# @bindshq/stance-tokens

Design tokens for **Stance**, the Binds design system: brand colours, a derived ink scale, semantic roles for light, dark and high-contrast themes, plus type, space, radius, elevation and motion scales.

```bash
npm install @bindshq/stance-tokens
```

## CSS variables

```ts
import '@bindshq/stance-tokens/css';
```

```css
.panel {
  background: var(--st-color-bg-surface);
  color: var(--st-color-fg-default);
  border: 1px solid var(--st-color-border-default);
  border-radius: var(--st-radius-lg);
  padding: var(--st-space-6);
}
```

Themes switch with `data-theme="light" | "dark" | "high-contrast"` on `<html>` or on any element. Without an attribute, the CSS follows `prefers-color-scheme` and `prefers-contrast`.

## JavaScript

```ts
import { brand, ink, light, dark, highContrast, contrastRatio, themeScript } from '@bindshq/stance-tokens';
```

## Tailwind

```ts
// tailwind.config.ts (v3)
import stance from '@bindshq/stance-tokens/tailwind';
export default { presets: [stance] };
```

```css
/* v4 */
@import '@bindshq/stance-tokens/tailwind-v4.css';
```

## Exports

| Path | Contents |
| --- | --- |
| `.` | Typed tokens, theme objects, `contrastRatio`, `themeScript` |
| `./css` | All CSS custom properties and theme blocks |
| `./tailwind` | Tailwind v3 preset |
| `./tailwind-v4.css` | Tailwind v4 `@theme` mapping |
| `./tokens.json` | All tokens as JSON |
| `./contrast-report.json` | WCAG contrast results for every theme |

Documentation: https://www.stanceui.com/foundations/colors · License: Apache-2.0 © Binds. Stance and Binds are trademarks of Binds; see TRADEMARK.md
