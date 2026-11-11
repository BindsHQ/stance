# Stance cross-platform architecture

One design language. One source of truth. Platform-native implementations.

## Layers

```text
packages/tokens/source/**/*.json        W3C design-token source (the only place values are written)
        │  scripts/build-tokens.mjs: validate → resolve aliases → generate
        ├── packages/tokens/src/generated.ts          → CSS variables, Tailwind presets, JSON (web)
        ├── platforms/ios/Sources/StanceTokens/        → Swift constants (no UI framework imports)
        └── platforms/android/stance-tokens/           → Kotlin constants (no Android imports)

packages/react            Web components        (React, plain CSS on tokens)
platforms/ios             StanceUI              (SwiftUI, UIKit interop)
platforms/android         Stance for Compose    (Jetpack Compose, Material 3 interop)
```

Each platform has three layers, and only the top one is public API for products:

1. **Tokens (generated).** Raw values and the three themes. Never edited by hand.
2. **Theme adapter (hand-written, thin).** Maps Stance tokens onto the platform's own theming
   system: CSS custom properties on the web, an `Environment` theme on iOS, `CompositionLocal`s
   plus a Material 3 `ColorScheme` bridge on Android. This is the only layer that knows about
   platform design-language details.
3. **Components.** Read semantic roles from the theme adapter. They never contain colour,
   spacing or type values.

## Scalability and upgradability rules

These hold from the first native release.

- **A design change is one edit.** Change a value in `packages/tokens/source`, run
  `npm run tokens`, and CSS, Swift and Kotlin all update. CI fails if generated files are stale
  (`tokens:check`) or if any platform's values differ from the source (parity tests).
- **Semantic roles are the contract.** Components depend on role names (`bg-surface`,
  `accent-bg`), not values. Values can change in any release; removing or renaming a role is a
  breaking change and goes through deprecation.
- **Adding is safe, removing is staged.** New roles, tokens and components are minor releases.
  Removal takes two steps: mark deprecated (with the replacement named) for at least one minor
  release, then remove in the next breaking release. Native code uses the platform's own
  deprecation annotations (`@available(*, deprecated)`, `@Deprecated`) so compilers warn.
- **Platform design updates are absorbed in the adapter.** When Apple or Google revise their
  design language (for example Liquid Glass or a new Material version), the change is made in
  the theme adapter and in the few components that wrap system controls. Stance components
  prefer wrapping native controls over reimplementing them, so most platform updates arrive for
  free with the OS.
- **Independent versions, shared token version.** Web, iOS and Android packages are versioned
  separately with semantic versioning. Every release records the token version it was generated
  from, and the compatibility table below is updated in the same change.
- **Minimum platform versions move deliberately.** Raising a minimum OS or SDK version is a
  breaking change for that platform package only.
- **New platforms plug in at the generator.** Supporting another target (for example Flutter or
  Windows) means adding one output to `build-tokens.mjs` and a new adapter; nothing upstream
  changes.

## Compatibility

| Package | Version | Tokens | Minimum platform |
| --- | --- | --- | --- |
| `@bindshq/stance-tokens` | 0.1.1 | — | — |
| `@bindshq/stance-react` | 0.1.1 | 0.1.1 | React 18.2 |
| `StanceUI` (iOS) | 0.1.0 (unreleased) | 0.1.1 | iOS 17, iPadOS 17 |
| Stance for Compose (Android) | 0.1.0 (unreleased) | 0.1.1 | Android 7.0 (API 24) |

## Platform adaptation

Consistency means the same roles, meaning and accessibility bar on every platform. It does not
mean identical pixels. Each platform uses its own navigation, sheets, pickers, menus, gestures
and type scaling (Dynamic Type on iOS, `sp` scaling on Android). Touch targets follow each
platform's guidance: 24px minimum on the web, 44pt on iOS, 48dp on Android.

## Native applications

Binds and eSignify are web products today; neither organisation has an iOS or Android
application. The native packages ship with showcase apps for demonstration and regression
testing. No native product migration has taken place.
