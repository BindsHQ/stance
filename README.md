<p align="center">
  <img src="apps/docs/public/icon.svg" width="56" height="56" alt="" />
</p>

<h1 align="center">Stance</h1>

<p align="center"><strong>The Binds Design System</strong><br/>One system. Consistent foundations. Distinct product experiences.</p>

<p align="center">
  <a href="https://stanceui.com">Documentation</a> ·
  <a href="https://stanceui.com/components">Components</a> ·
  <a href="./CHANGELOG.md">Changelog</a> ·
  <a href="./CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/BindsHQ/stance/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/BindsHQ/stance/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://www.npmjs.com/package/@bindshq/stance-react"><img alt="npm" src="https://img.shields.io/npm/v/@bindshq/stance-react?label=%40bindshq%2Fstance-react" /></a>
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-140C2E" /></a>
</p>

---

Stance is the official, open-source design system of [Binds](https://binds.si). It is the single source of truth for the visual language, design tokens, accessible UI components and interaction patterns shared across Binds products.

## Highlights

- **Brand-true tokens.** Built from the two official Binds colours, ivory `#FCF6EB` and indigo `#140C2E`. Every neutral is an OKLab interpolation between them.
- **Three appearance modes.** Light, dark and high contrast. Stance detects the system preference, persists the user's choice, syncs it across tabs and avoids a flash on load.
- **Accessible by default.** The target is WCAG 2.2 AA. Contrast is verified for every theme, axe-core runs in all three modes, and keyboard models follow WAI-ARIA APG.
- **Zero runtime dependencies.** Focus management, positioning, date maths and virtualisation are all implemented in Stance. React is the only peer.
- **Works anywhere.** Plain CSS on custom properties, with a Tailwind v3 preset and a Tailwind v4 theme. ESM and tree-shakeable, for React 18 and 19.

## Packages

| Package | Description |
| --- | --- |
| [`@bindshq/stance-tokens`](./packages/tokens) | Design tokens: CSS variables, typed JS, JSON, Tailwind presets, the theme script and contrast utilities |
| [`@bindshq/stance-react`](./packages/react) | React components, icons and theming |

## Install

```bash
npm install @bindshq/stance-tokens @bindshq/stance-react
```

```tsx
// app/layout.tsx
import '@bindshq/stance-tokens/css';
import '@bindshq/stance-react/styles.css';
import { ThemeProvider, ThemeScript } from '@bindshq/stance-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
```

```tsx
import { Button, FormField, Input } from '@bindshq/stance-react';

<FormField label="Template name" required>
  <Input name="name" />
</FormField>
<Button type="submit">Save template</Button>
```

## Repository

```text
apps/docs            stanceui.com: landing page and documentation (Next.js, static export)
packages/tokens      @bindshq/stance-tokens
packages/react       @bindshq/stance-react
scripts/             repository tooling
```

## Development

Requires Node.js 20.11+ and npm 10+.

```bash
npm install
npm run build        # tokens → react
npm test             # token contrast + component tests
npm run typecheck
npm run dev:docs     # http://localhost:3100
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for conventions, and use `npx changeset` to record changes for the next release.

## Versioning

Stance follows [semantic versioning](https://semver.org). Both packages are released together with the same version number. Products pin exact versions and upgrade deliberately.

## License

[MIT](./LICENSE) © Binds. The Binds name and logo are trademarks of Binds and are not licensed under MIT.
