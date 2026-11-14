# @bindshq/stance-react

Accessible, dependency-free React components for **Stance**, the Binds design system.

```bash
npm install @bindshq/stance-tokens @bindshq/stance-react
```

```tsx
import '@bindshq/stance-tokens/css';
import '@bindshq/stance-react/styles.css';
import { ThemeProvider, ThemeScript, Button } from '@bindshq/stance-react';
```

Make Stance yours: generate a full palette from your own brand colours, at build time with the `stance-brand` CLI from `@bindshq/stance-tokens`, or at runtime:

```tsx
<ThemeProvider brand={{ name: 'Acme', light: '#F7F5F0', dark: '#101B2D' }}>{children}</ThemeProvider>
```

Guide: https://www.stanceui.com/docs/theming#your-brand

- React 18.2+ and 19
- Zero runtime dependencies
- Light, dark and high-contrast themes
- WAI-ARIA keyboard models and focus management
- Plain CSS on tokens: works with or without Tailwind
- ESM, tree-shakeable, `'use client'` only where needed

Documentation and live examples: https://www.stanceui.com/components · License: Apache-2.0 © Binds. Stance and Binds are trademarks of Binds; see TRADEMARK.md
