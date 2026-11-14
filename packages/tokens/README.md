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

## Your brand

Make Stance yours: generate a full palette from your own brand colours. Optional; the default palette works as it is.

```bash
npx stance-brand --light '#F7F5F0' --dark '#101B2D' --name Acme > brand.css
```

Load `brand.css` after `@bindshq/stance-tokens/css`. Options: `--accent` (and `--accent-dark` for a separate dark theme accent; Stance fits accent lightness so contrast checks pass), `--out <file>`, and `--check` to exit with status 1 when a contrast check fails. In code:

```ts
import { createBrandTheme } from '@bindshq/stance-tokens';
const { css, themes, report } = createBrandTheme({ name: 'Acme', light: '#F7F5F0', dark: '#101B2D' });
```

`report` lists every pair below its contrast minimum. Guide: https://www.stanceui.com/docs/theming#your-brand

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
| `./brand-recipe.json` | How every colour role derives from a brand |
| `./brand-fixture.json` | Resolved roles for reference brands, for cross platform tests |

Documentation: https://www.stanceui.com/foundations/colors · License: Apache-2.0 © Binds. Stance and Binds are trademarks of Binds; see TRADEMARK.md
