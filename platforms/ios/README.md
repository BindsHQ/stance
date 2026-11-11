# StanceUI for iOS and iPadOS

Native SwiftUI components for Stance, the Binds design system. StanceUI uses the same design
tokens as the web and Android packages, and follows Apple's Human Interface Guidelines for
everything else: navigation, sheets, alerts, pickers and gestures are the system's own.

- iOS 17 and iPadOS 17 or later. Swift 6 language mode with strict concurrency.
- No third-party dependencies.
- Light, dark and high-contrast themes from one token source.
- Dynamic Type, VoiceOver, Increase Contrast, Reduce Motion and Bold Text supported throughout.

## Install

Add the package in Xcode (File, Add Package Dependencies) or in `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/BindsHQ/stance.git", from: "0.1.0")
],
targets: [
    .target(name: "MyApp", dependencies: [.product(name: "StanceUI", package: "stance")])
]
```

The repository root has a `Package.swift` that points at `platforms/ios/Sources`, so the URL
above resolves directly. To work against a local checkout instead:

```swift
.package(path: "../stance")
```

Products:

| Product | Contents |
| --- | --- |
| `StanceUI` | Components, theme adapter, icons, accessibility helpers, UIKit interop |
| `StanceTokens` | Generated token constants only. No UI framework imports. |

## Set up

Wrap the app once. The stored preference is read before the first frame, so the wrong theme
never flashes.

```swift
import StanceUI
import SwiftUI

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            StanceThemeProvider {
                RootView().stanceToastHost()
            }
        }
    }
}
```

Then build with components and tokens:

```swift
struct TemplateSettings: View {
    @State private var name = "Sales team signature"
    @State private var autoApply = true
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        StanceCard("Details") {
            StanceTextField("Template name", text: $name, isRequired: true)
            Toggle("Apply to new members", isOn: $autoApply).toggleStyle(.stance)
            StanceButton("Deploy", leadingIcon: .send) {}
        }
        .padding(StanceSpacing.lg)
        .background(theme.colors.bgCanvas)
    }
}
```

## Theming

`StanceAppearance` is the preference: `system`, `light`, `dark` or `highContrast`. It is stored
in UserDefaults under `stance-theme` with the same values the web uses.

- **System** follows the device colour scheme. Increase Contrast selects the high-contrast theme.
- **High contrast** is a complete theme: full-strength boundaries, 7:1 text, thicker focus rings
  and outlines in place of shadows.
- Read the active theme with `@Environment(\.stanceTheme)`. Colours are semantic roles such as
  `theme.colors.bgSurface` and `theme.colors.fgMuted`, named like the web roles.
- Scope a theme to part of a screen with `.stanceScopedTheme(.dark)`.
- The default typeface is the system font. To use DM Sans, bundle the font in your app and pass
  `StanceThemeProvider(fontFamily: "DM Sans")`. Every text style still scales with Dynamic Type.

Let people choose:

```swift
@AppStorage(StanceAppearance.storageKey) private var appearance = StanceAppearance.system.rawValue
```

## Native first

StanceUI wraps system controls and styles them with tokens. It does not reimplement them.

| Need | Use |
| --- | --- |
| Buttons | `StanceButton`, or `.buttonStyle(.stance(.primary))` on any `Button` |
| Switch | `Toggle(...).toggleStyle(.stance)` |
| Menus | `StanceMenu`, built on `Menu` |
| Sheets | `.stanceSheet(_:isPresented:)`, built on `sheet` and detents |
| Alerts and confirmations | `.stanceAlert` and `.stanceConfirmationDialog` |
| Dates and times | `StanceDatePicker` and `StanceCalendar`, built on `DatePicker` |
| Top-level navigation | `StanceAdaptiveNavigation`: tab bar on iPhone, sidebar on iPad |
| Search | `.searchable`, or `StanceSearchableList` |
| Swipe actions and pull to refresh | The system `.swipeActions` and `.refreshable` modifiers, unchanged |

Custom controls exist only where iOS has none: checkbox, radio group, badge, tag, avatar,
banner, toast, empty state, skeleton, timeline, stepper, filter bar and signature canvas.

On iOS 26 the system bars, sheets and controls keep their Liquid Glass materials. StanceUI does
not draw its own glass and does not recolour system chrome beyond the tint.

## UIKit

```swift
view.backgroundColor = StanceUIKit.color(\.bgCanvas)   // follows dark mode and Increase Contrast
label.font = StanceUIKit.font(.heading)                // scaled for Dynamic Type
label.adjustsFontForContentSizeCategory = true

// Host StanceUI in a UIKit screen
let controller = StanceUIKit.hostingController { TemplateSettings() }
navigationController?.pushViewController(controller, animated: true)
```

To use a UIKit view inside StanceUI, wrap it with `UIViewRepresentable` as usual and read
colours through `StanceUIKit.color` so it follows the theme. `StanceDocumentPreview` is an
example: it hosts the Quick Look controller.

## Accessibility

- Every text style scales with Dynamic Type through the largest accessibility sizes. Rows and
  button groups reflow instead of truncating.
- Interactive controls keep a 44 by 44 point target.
- Visible labels match accessibility labels, so Voice Control commands work.
- Errors, toasts and result counts are announced without moving focus.
- Animations are removed when Reduce Motion is on.
- Status is never shown by colour alone.

Token contrast is tested for all three themes. The showcase UI tests run the system
accessibility audit on real screens.

## Icons

`StanceIcon(.signature)` draws the shared Stance icon set natively from the same geometry the
web uses. Icons are decorative unless you pass `label:`. Use SF Symbols where people expect a
system glyph.

Regenerate after the web icon set changes:

```bash
node platforms/ios/Scripts/generate-icons.mjs
```

## Tokens and upgrades

`Sources/StanceTokens/StanceTokens.swift` is generated from `packages/tokens/source`. Do not
edit it. Change a value in the source, run `npm run tokens` at the repository root, and CSS,
Swift and Kotlin all update.

Components never contain colour, spacing, radius, type or duration values. They read semantic
roles from the theme adapter in `Sources/StanceUI/Theme`, which is the only layer that knows
platform details. See `docs/architecture/cross-platform.md` for the layering, versioning and
deprecation policy.

## Develop and test

```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer   # if Xcode is not the active toolchain

cd platforms/ios
swift test                                           # logic, contrast and rendering tests on macOS
xcodebuild test -scheme Stance-Package \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'

node Scripts/generate-example-tests.mjs              # recompile every example in components.json
```

The showcase app lives in `examples/ios/StanceShowcase`:

```bash
cd examples/ios/StanceShowcase
xcodegen generate
xcodebuild test -project StanceShowcase.xcodeproj -scheme StanceShowcase \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

`components.json` is the machine-readable inventory the documentation site reads. Every example
in it is compiled by `Tests/StanceUITests/ComponentExamples.swift`.

## Previews

`previews/` holds real renders of every visual component in light, dark and high contrast, plus
full-screen showcase captures for the website. They come from the actual SwiftUI components
running in the showcase app on the iPhone 17 Pro simulator, never from mock-ups.

Regenerate them from the repository root:

```bash
sh platforms/ios/Scripts/build-previews.sh
```

The script needs Xcode, xcodegen, oxipng, node and python3 with Pillow. It:

1. Captures inline component previews with the simulator's own screenshot, cropped to the rect
   the showcase reports. Each composition is defined in
   `examples/ios/StanceShowcase/StanceShowcase/PreviewGallery.swift`.
2. Captures presented system UI (menus, sheets, alerts and confirmation dialogs) in its
   presented state with `PreviewCaptureTests`, which taps the trigger first.
3. Captures the home-page showcase screens with the status bar set to 9:41.
4. Resamples iPhone captures to 2x, optimises every PNG losslessly with oxipng, and records each
   preview with its size in `components.json`. Non-visual helpers get `"preview": null`.

Inline previews are 345pt of content with 24pt padding on the theme canvas, capped at 520pt of
content height. File names follow `previews/<slug>.<theme>.png`.

## Licence

MIT. The Stance and Binds names and logos are trademarks of Binds.
