# Brand theming

Stance ships with a default palette built from Binds Ivory `#FCF6EB` and Indigo `#140C2E`, and
it works as it is. Brand theming is an optional feature: a product can generate a full palette
from its own brand colours. This spec defines one algorithm that the web, iOS and Android
implement identically, so a brand looks the same everywhere.

## Inputs

A brand is defined by:

| Field | Required | Meaning |
| --- | --- | --- |
| `name` | yes | Human name, used in diagnostics. |
| `light` | yes | The brand's lightest colour. Becomes the light canvas, and the foreground on dark surfaces. Ivory for Binds. |
| `dark` | yes | The brand's darkest colour. Becomes text, the primary accent and the dark canvas. Indigo for Binds. |
| `accent` | no | A separate colour for primary actions, selection, links and focus: one colour, or `{ light, dark }` to give the dark theme its own starting colour (high contrast uses `light`). Without it the accent is `dark` in the light themes and `light` in the dark theme, which is how Binds works today. |

Status colours (danger, success, warning) are functional, not brand, and stay as they are.

## Algorithm

1. **Neutral scale.** Build the 15 step ink scale by linear interpolation in OKLab from `light`
   (step 0) to `dark` (step 1000) at these positions:

   | Step | 0 | 25 | 50 | 100 | 150 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 1000 |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | t | 0 | 0.03 | 0.06 | 0.11 | 0.17 | 0.24 | 0.36 | 0.48 | 0.58 | 0.67 | 0.76 | 0.85 | 0.93 | 0.97 | 1 |

   The implementer verifies these positions against the shipped Binds scale in
   `packages/tokens/source/primitives/color.json` and adjusts them, to more decimals if needed,
   so the Binds pair reproduces every published step exactly. Positions are part of the token
   source, not hard coded per platform.

2. **Semantic roles.** Resolve each theme (light, dark, high contrast) from the same semantic
   source files the tokens build uses today. References to `{color.ink.N}` use the brand scale,
   `{color.brand.ivory}` resolves to `light`, `{color.brand.indigo}` resolves to `dark`.

3. **Derived literals.** The few semantic values that are literal today but come from the brand
   pair become derivation rules in the token source, chosen so the Binds pair reproduces the
   current values exactly (within 1/255 per channel):
   - light surfaces (`bg-surface`, `bg-surface-raised`, `bg-overlay`): `light` mixed toward white
     in OKLab;
   - scrims: `dark` (light and high contrast) or `dark` mixed toward black (dark theme) at the
     current alpha;
   - `interactive-hover` and `interactive-active`: `dark` (light theme) or `light` (dark theme)
     at the current alpha.
   Status literals stay literal.

4. **Accent.** Without an `accent`, the accent roles keep their source aliases (the brand pair
   and ink steps). With one, each theme starts from its accent (`light`, or the single colour,
   for the light and high contrast themes; `dark` for the dark theme) and the roles are fitted
   so every accent passes the contrast checks:
   - **Fitting** keeps the colour's OKLab a and b and changes only L. Each candidate is rounded
     to 8 bit sRGB (clamped) before its WCAG contrast is measured. If the starting colour meets
     the minimum against every target, it is used unchanged. Otherwise L moves toward 0 (black)
     or 1 (white): if that end fails too it is used; otherwise bisect exactly 32 times with
     `lo` = start L and `hi` = the end, `mid = (lo + hi) / 2`, a passing `mid` becoming `hi` and
     a failing one `lo`, and use the colour at `hi`.
   - **Text** (`fg-link`, `interactive-selected-fg`): fitted against `bg-canvas`, `bg-surface`
     and `bg-subtle` (and `interactive-selected` for the selected label), at 4.5:1, toward
     black in the light theme and toward white in the dark theme. High contrast keeps both on
     their source values, since legibility comes first there.
   - **Fill** (`accent-bg`): `accent-fg` is `light` or `dark`, whichever has the higher contrast
     on the starting accent. If that is under 4.5:1 (7:1 in high contrast), L is fitted against
     the foreground, toward black when the foreground is the lighter of the two and toward
     white otherwise. `accent-fg` is then whichever of `light` or `dark` has the higher contrast
     on the fitted fill.
   - **Shades** (`accent-bg-hover`, `accent-bg-active`): the fitted fill mixed in OKLab by 0.15
     and 0.3 toward the brand colour that is not `accent-fg`, so the label only gains contrast.
   - **Ring** (`focus-ring`): fitted against `bg-canvas`, `bg-surface` and `focus-ring-offset`
     at 3:1 (4.5:1 in high contrast, which the token tests require), toward black in the light
     themes and toward white in the dark theme.
   The token build checks that every fitted role covers every contrast pair it appears in.

5. **Contrast check.** After resolving, check the role pairs the token tests already check
   (text on canvas and surfaces at 4.5:1, large text and controls at 3:1, high contrast at 7:1).
   Return the list of failing pairs. On the web, in development, log it once. Never throw at
   runtime; the build-time API (`createBrandTheme`) returns the report so tools can fail CI.

## Platform API

- **Web, `@bindshq/stance-tokens`:** `createBrandTheme(brand)` returns
  `{ css, themes, report }`. `css` is a stylesheet that overrides the `--st-color-*` variables
  for `[data-theme='light']`, `[data-theme='dark']` and `[data-theme='high-contrast']` (and the
  system preference forms the ThemeScript produces). A CLI,
  `npx stance-brand --light '#…' --dark '#…' [--accent '#…'] [--accent-dark '#…'] > brand.css`,
  writes it at build time so there is no runtime cost.
- **Web, `@bindshq/stance-react`:** `<ThemeProvider brand={brand}>` applies a brand at runtime
  for apps that need it (multi-tenant products), scoped to the provider.
- **iOS:** `StanceBrand(name:light:dark:accent:)`, `StanceThemeProvider(brand:)`, and
  `.stanceBrand(_:)` to scope one. `StanceBrand.binds` is the default palette.
- **Android:** `StanceBrand(name, light, dark, accent)`, `StanceTheme(brand = ...)`, and
  `StanceBrand.Binds`, the default palette.

Leaving the brand unset and passing the Binds brand (`brand="binds"` or `bindsBrand` on the web)
are the same: both use the default palette and add nothing at runtime. Nothing is logged for
the default palette. In development builds, a custom brand with failing contrast pairs is
reported once; release builds never log.

## Tests

- The Binds pair through the algorithm reproduces every published role in all three themes on
  all three platforms, exactly (or within 1/255 where the spec allows).
- Reference brands (a bright one, a muted one with separate light and dark accents, and one
  with a mid grey accent) produce identical role values on all three platforms, checked
  against a shared fixture generated by the tokens build, and none has a contrast failure.
- The contrast report flags a deliberately poor pair.
