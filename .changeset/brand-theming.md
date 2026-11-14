---
'@bindshq/stance-tokens': minor
'@bindshq/stance-react': minor
---

Brand theming. `createBrandTheme(brand)` and the `stance-brand` CLI build every colour role in all three themes from a product's own light, dark and optional accent colours (one accent, or one per light and dark theme), with a contrast report. Accents keep their hue and have their lightness fitted where needed, so every accent passes the contrast checks. `ThemeProvider` takes a `brand` prop that applies one to its subtree, and `Brand` and `bindsBrand` are exported. The token source now records the ink scale positions and how surfaces, scrims and interactive washes derive from the brand pair, and the build emits the recipe and a shared fixture as JSON, Swift and Kotlin.
