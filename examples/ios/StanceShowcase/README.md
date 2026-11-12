# Stance Showcase for iOS

A demonstration app for StanceUI. It shows the foundations, every component with its variants
and states, the AI components with a full conversation screen, a theme switcher and one
composed sample screen. It has no business logic and makes
no network requests. It is also the regression surface for UI and accessibility tests.

```bash
brew install xcodegen
xcodegen generate
open StanceShowcase.xcodeproj
```

Launch arguments, used by screenshots and UI tests:

| Argument | Effect |
| --- | --- |
| `-screen components` | Open a tab: `components`, `foundations`, `assistant`, `sample` or `settings` |
| `-category forms` | Open a component category directly |
| `-stance-theme dark` | Start in `light`, `dark`, `high-contrast` or `system` |
| `-stance-locale ar` | Show StanceUI's built in strings in `ar` or `es`, right to left for Arabic |

On iPhone the app uses a tab bar. On iPad it uses a sidebar.
