# Changelog

All notable changes to Stance are documented here. Packages are versioned together. This project follows [Semantic Versioning](https://semver.org).

## 0.1.1

Initial public release of Stance, the Binds design system.

### @bindshq/stance-tokens

- Brand tokens for the two official Binds colours, ivory `#FCF6EB` and indigo `#140C2E`.
- An ink scale with 15 steps, interpolated between the brand colours in OKLab.
- Semantic colour roles, with complete light, dark and high-contrast themes.
- Typography, spacing, sizing, radius, shadow, z-index, breakpoint and motion scales.
- Outputs: CSS variables, typed ESM, JSON, a Tailwind v3 preset, a Tailwind v4 theme and a contrast report.
- `themeScript()` for theme application with no flash, with support for legacy storage keys.
- Contrast utilities, and a WCAG 2.2 AA test suite covering every theme.

### @bindshq/stance-react

- Accessible React components with zero runtime dependencies.
- Internal accessibility primitives: focus scope, a dismissable layer stack, anchored positioning, roving focus, typeahead and a portal that preserves scoped themes.
- `ThemeProvider`, `ThemeScript`, `Theme` and `ThemeSwitcher`.
- An original icon set.
