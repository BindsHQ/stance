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
| Accordion | `StanceAccordion`, built on `DisclosureGroup` |
| Tables | `StanceDataTable`: `Table` in regular width (a pinned header grid on iOS 17.0 to 17.3), a `List` of cards in compact width |
| Trees and reordering | `StanceTreeView` and `StanceSortableList`, built on `List`, `onMove` and `EditButton` |
| Charts | `StanceChart`, built on Swift Charts with Audio Graphs |
| Numbers, times and date ranges | `StanceNumberField` (`TextField` and `Stepper`; bind a `Double?` to allow an empty field), `StanceTimePicker` and `StanceDateRangePicker` (`DatePicker`) |
| One time codes | `StancePinField`: one `TextField` with `.oneTimeCode`, boxes drawn over it |
| Choosing from long lists | `StanceCombobox` and `StanceMultiSelect`: a `.searchable` `List` in a sheet or popover. Pass `custom: .text` to accept typed text as a new value or tag |
| Split and toggle buttons | `StanceSplitButton` (`Menu(primaryAction:)`), `StanceToggleButton` (`Toggle`) |
| Segmented tabs and progress rings | `StanceTabs(style: .segmented)` (`Picker`), `StanceProgressCircle` (`ProgressView`) |
| Markdown, code and copying | `StanceRichText` and `StanceMarkdownRenderer` (`AttributedString`), `StanceCodeBlock` (one selectable `Text`, highlighted by `StanceCodeHighlighter`), `StanceCopyButton` (`UIPasteboard`) |

Custom controls exist only where iOS has none: checkbox, checkbox group, radio group, badge,
tag, chip, avatar, banner, toast, empty state, skeleton, timeline, stepper, pagination, filter
bar, the second thumb of the range slider, the underline tab strip and the signature canvas.

### Components by group

| Group | Components |
| --- | --- |
| Actions | `StanceButton`, `StanceIconButton`, `StanceButtonGroup`, `StanceMenu`, `StanceSplitButton`, `StanceCopyButton`, `StanceToggleButton`, `StanceToggleButtonGroup` |
| Forms | `StanceFormField`, `StanceTextField`, `StanceSecureField`, `StanceTextEditor`, `StanceSearchField`, `StanceNumberField`, `StancePinField`, `StancePicker`, `StanceCombobox`, `StanceMultiSelect`, `StanceCheckbox`, `StanceCheckboxGroup`, `StanceRadioGroup`, `StanceSlider`, `StanceRangeSlider`, `StanceDatePicker`, `StanceDateRangePicker`, `StanceTimePicker`, `StanceInlineEdit` |
| Data display | `StanceBadge`, `StanceTag`, `StanceChip`, `StanceAvatar`, `StanceAvatarGroup`, `StanceProgressView`, `StanceProgressCircle`, `StanceSkeleton`, `StanceEmptyState`, `StanceTimeline`, `StanceStatCard`, `StanceDescriptionList`, `StanceListRow`, `StanceAccordion`, `StanceDataTable`, `StanceTreeView`, `StanceSortableList`, `StanceChart`, `StanceRichText`, `StanceCodeBlock`, `StanceNotificationRow` |
| Navigation | `StanceAdaptiveNavigation`, `StanceTabs`, `StancePagination`, `StanceStepper`, `StancePageIndicator` |
| Advanced | `StanceFilterBar`, `StanceFilterChip`, `StanceSearchableList`, `StanceCalendar`, `StanceSignatureCanvas`, `StanceAttachmentPicker`, `StanceDocumentPreview` |

Some web components have no separate iOS type because a native one covers them. In
`components.json`, `webEquivalent` is a web slug or a list of slugs: `StanceDataTable` covers
`data-table`, `table` and `data-grid`, and `stanceSheet()` covers `sheet`, `dialog` and `drawer`.
Others are plain platform idioms, listed in `specs/native-parity.json`: `NavigationStack` for
breadcrumbs, `.popover` for popovers, `.help` for tooltips and the system `.toolbar`.

Motion comes from the motion tokens through `StanceMotion` and is removed under Reduce Motion.
Where a system control would give feedback, StanceUI does too: a selection tick on the
checkbox, a tap when a toast appears, a success tap when progress completes, and numeric text
transitions on changing values.

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

## Localisation

StanceUI is fully localisable, and right to left layouts work without extra parameters.

- **Built in strings.** Words the library supplies itself, such as "Dismiss", "Loading", "Send"
  and "Thought for 12 seconds", live in string tables in the package bundle
  (`Sources/StanceUI/Resources`). English is the base, with complete Arabic and Spanish
  translations and plural rules for each. They resolve with `String(localized:bundle:locale:)`
  for the locale in the SwiftUI environment, so `.environment(\.locale, Locale(identifier: "ar"))`
  works in previews and tests. Other languages fall back to English.
- **Your strings.** A string literal is a localisation key looked up in your app, the way
  `Text("Save")` is. A `String` value is shown as written, and you can pass a
  `LocalizedStringResource` explicitly.
- **Overrides.** Every built in string has a parameter or a labels value, for example
  `StanceLoadingState("Fetching mailboxes")` or
  `StancePromptComposerLabels(send: "Ask")`. Leave it out to keep the localised default.

```swift
StanceButton("Deploy") {}                              // key "Deploy" in your string catalog
StanceButton(template.name) {}                         // shown as written
StanceLocalization.string("stance.dismiss", locale: Locale(identifier: "es"))   // "Descartar"
```

Your app must declare the languages it supports (a string catalog or `CFBundleLocalizations`)
for iOS to use the package's translations. A title passed as a localisation key is resolved
when the view is created, with the app's language.

Right to left: layouts use leading and trailing edges throughout. Directional Stance icons
(back and forward chevrons and arrows, the sidebar, the list and log out) mirror on their own;
ticks, clocks and objects do not. The signature canvas keeps its coordinates so a signature is
never mirrored, and the system slider follows the layout direction as every iOS slider does.

To add a language, copy `en.lproj` in `Sources/StanceUI/Resources`, translate both files and
run the tests: they fail if a key is missing or empty.

## AI components

Sixty components for conversational, agentic and generative interfaces, in
`Sources/StanceUI/Components/AI`. They implement the cross-platform contracts in
`specs/ai-components.json` and `specs/ai-components-wave-2.json`, shared with the web and
Android packages.

| Group | Components |
| --- | --- |
| Conversation | `StanceThread`, `StanceMessage`, `StanceMessageGroup`, `StanceMessageActions`, `StanceBranchSwitcher`, `StanceScrollToLatest`, `StanceConversationList`, `StanceThreadEmptyState` |
| Prompt | `StancePromptComposer`, `StanceAttachmentTray`, `StanceMentionPicker`, `StanceSlashCommandMenu`, `StanceModelPicker`, `StanceContextChips`, `StanceVoiceInputButton`, `StanceStopButton`, `StanceTokenBudgetMeter` |
| Streaming | `StanceStreamingText`, `StanceThinkingIndicator`, `StanceReasoningDisclosure`, `StanceShimmerText`, `StanceGenerationProgress`, `StanceStreamingSkeleton`, `StanceInterruptedState` |
| Trust | `StanceCitationChip`, `StanceSourceList`, `StanceSourcePreview`, `StanceConfidenceBadge`, `StanceAIGeneratedLabel`, `StanceDisclaimerNote`, `StanceFeedbackBar`, `StanceReportDialog`, `StanceSensitiveContentGate` |
| Agents | `StanceToolCallCard`, `StanceStepTimeline`, `StancePlanChecklist`, `StanceApprovalPrompt`, `StancePermissionSheet`, `StanceAgentStatusPill`, `StanceTaskQueue`, `StanceSubagentTree`, `StanceRunLog`, `StanceDiffReview` |
| Output | `StanceMarkdownRenderer`, `StanceCodeSuggestion`, `StanceArtifactPanel`, `StanceGeneratedImage`, `StanceGeneratedTable`, `StanceGeneratedChart`, `StanceFilePreviewCard`, `StanceCanvasSplitView` |
| Product | `StanceInlineSuggestion`, `StanceSmartField`, `StanceRewriteMenu`, `StanceSummaryCard`, `StanceAskBar`, `StanceSuggestionChips`, `StanceInsightCallout`, `StanceSemanticSearchResults`, `StanceCopilotPanel` |

- **Presentational.** No networking and no model SDK. Your app owns the conversation and
  passes text and a `StanceGenerationStatus` in: `idle`, `submitted`, `streaming`, `complete`,
  `stopped` or `error`.
- **Native first.** The thread is a `ScrollView` with a bottom anchor, the composer a vertical
  `TextField`, the model picker a `Menu`, the report dialog a sheet with detents, and a citation
  previews in a popover on iPad and a sheet on iPhone.
- **Streaming safe.** Text is only added at the end, so earlier lines never move, and the
  thread follows the newest message only while the reader is at the bottom.
- **No new hues.** Surfaces use the ink scale. The assistant is identified by the sparkle icon,
  motion and clear labels.
- **People stay in control.** Anything an agent wants to do goes through `StanceApprovalPrompt`
  or `StancePermissionSheet`. Deny is the safe default, a countdown can only deny, and a high
  risk action is never the default button. Changes are reviewed hunk by hunk in
  `StanceDiffReview`, where added and removed lines carry a plus or minus and a spoken word,
  never colour alone. Steps and tasks share `StanceStepStatus`, always shown in words.
- **Safe output.** `StanceMarkdownRenderer` parses Markdown to native views, never HTML. Links
  are limited to http, https and mailto, images are off unless the app supplies them, and
  half written Markdown is tolerated while streaming. Code, diffs and logs stay left to right
  in right to left screens.
- **Native panels.** Approval details and permissions are sheets with detents, the artifact and
  copilot panels are an inspector column in regular width and a sheet in compact width, the
  plan is a `List` with `onMove`, the rewrite menu is a `Menu`, and the subagent tree, generated
  table and generated chart build on `StanceTreeView`, `StanceDataTable` and `StanceChart`.
- **Calm for everyone.** Shimmer, pulse and the text reveal use the `shimmer`, `pulse` and
  `stream` motion tokens and are still under Reduce Motion. VoiceOver hears a response start,
  finish, stop or fail once, never token by token.

```swift
struct Chat: View {
    @State private var draft = ""
    @State private var status = StanceGenerationStatus.idle
    let messages: [ChatMessage]

    var body: some View {
        VStack(spacing: 0) {
            StanceThread {
                ForEach(messages) { message in
                    StanceMessage(role: message.role, status: message.status) {
                        StanceStreamingText(message.text, isStreaming: message.status == .streaming)
                    } actions: {
                        StanceMessageActions(onCopy: { copy(message) }, onRetry: { retry(message) })
                    }
                }
                if status == .submitted { StanceThinkingIndicator() }
            }
            StancePromptComposer(text: $draft, status: status) { text in
                send(text)
            } onStop: {
                stop()
            }
            .padding()
        }
    }
}
```

System glyphs (send, stop, microphone, copy, thumbs) are SF Symbols. The sparkle is the Stance
icon.

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

Apache License 2.0. See [LICENSE](../../LICENSE) and [NOTICE](../../NOTICE). The Stance and Binds names, logos and brand colours are trademarks of Binds and are not covered by the License; see [TRADEMARK.md](../../TRADEMARK.md).
