<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/logo/svg/stance-logo-ivory.svg" />
    <img src="brand/logo/svg/stance-logo-indigo.svg" alt="Stance" width="260" />
  </picture>
</p>

<h1 align="center">Stance</h1>

<p align="center"><strong>The Binds Design System</strong><br/>One system. Consistent foundations. Distinct product experiences.</p>

<p align="center">
  <a href="https://www.stanceui.com">Documentation</a> ·
  <a href="https://www.stanceui.com/components">Components</a> ·
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
- **One source, three platforms.** Tokens are written once in the W3C design-token format and generated for CSS, TypeScript, Swift and Kotlin.
- **Native everywhere.** React for the web, SwiftUI for iOS and iPadOS, Jetpack Compose for Android. Each uses its platform's own controls and conventions.
- **Three appearance modes.** Light, dark and high contrast on every platform, following the system by default.
- **Accessible by default.** The target is WCAG 2.2 AA. Contrast is verified for every theme, and each platform has its own accessibility tests.
- **No third-party runtime dependencies** on the web or iOS. Android builds on AndroidX and Material 3.

## Platforms

| Platform | Package | Status |
| --- | --- | --- |
| Web | [`@bindshq/stance-tokens`](./packages/tokens), [`@bindshq/stance-react`](./packages/react) | 0.1.1 |
| iOS and iPadOS | [`StanceUI`](./platforms/ios) (Swift Package) | 0.1.0, in development |
| Android | [`com.bindshq:stance-compose`](./platforms/android) | 0.1.0, in development |

See [docs/architecture/cross-platform.md](./docs/architecture/cross-platform.md) for the layering and the upgrade policy.

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
packages/tokens      token source and generators, @bindshq/stance-tokens
packages/react       @bindshq/stance-react
platforms/ios        StanceUI for iOS and iPadOS (SwiftUI)
platforms/android    Stance for Android (Jetpack Compose)
examples/ios         iOS showcase app
examples/android     Android showcase app
brand/               logo, mark and app icons
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
npm run tokens       # regenerate CSS, TypeScript, Swift and Kotlin from the token source
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for conventions, and use `npx changeset` to record changes for the next release.

## Versioning

Stance follows [semantic versioning](https://semver.org). Both packages are released together with the same version number. Products pin exact versions and upgrade deliberately.

## License

[MIT](./LICENSE) © Binds. The Binds name and logo are trademarks of Binds and are not licensed under MIT.
