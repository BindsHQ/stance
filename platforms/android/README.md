# Stance for Android

Native Jetpack Compose components for Stance, the Binds design system.

Stance for Android is built on Material 3 for behaviour, semantics and accessibility, and themed with Stance tokens. It looks like Stance and behaves like Android.

Status: 0.1.0, not yet published.

## Modules

| Module | Artifact | Contents |
| --- | --- | --- |
| `stance-tokens` | `com.bindshq:stance-tokens` | Generated design tokens. Pure Kotlin, no Android dependency. |
| `stance-compose` | `com.bindshq:stance-compose` | Theme, components, icons, accessibility helpers and View interop. |

Requirements: minSdk 24, compileSdk 37, Kotlin 2.4, Compose BOM 2026.09.00.

## Setup

Add the version to your catalog and the dependency to your app.

```toml
# gradle/libs.versions.toml
[versions]
stance = "0.1.0"

[libraries]
stance-compose = { module = "com.bindshq:stance-compose", version.ref = "stance" }
```

```kotlin
// app/build.gradle.kts
dependencies {
    implementation(libs.stance.compose)
}
```

Use `Theme.Stance` as the activity theme so the window shows the Stance canvas colour before Compose draws, then wrap your content in `StanceTheme`.

```xml
<activity android:name=".MainActivity" android:theme="@style/Theme.Stance" />
```

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            var appearance by rememberStanceAppearance()
            StanceTheme(appearance = appearance) {
                StanceScaffold(topBar = { StanceTopAppBar("Templates") }) { padding ->
                    StanceButton("Save template", onClick = {}, modifier = Modifier.padding(padding))
                }
            }
        }
    }
}
```

## Theming

`StanceTheme` provides the active theme through `StanceTheme.colors`, `typography`, `shapes`, `elevation`, `motion`, `spacing` and `sizes`.

There are three themes: light, dark and high contrast. `StanceAppearance.System` follows the device. A request for more contrast wins over dark theme. The system contrast level is read on Android 14 and later, and the high contrast text setting on older versions.

`rememberStanceAppearance()` saves the choice in SharedPreferences under the key `stance-theme`, using the same values as the web: `light`, `dark`, `high-contrast` and `system`.

Dynamic colour (Material You) is off on purpose. Binds has two brand colours, ivory `#FCF6EB` and indigo `#140C2E`, and every Stance theme is derived from them.

Type sizes are in `sp`, so text follows the system font size. The default typeface is the platform one. Pass a `FontFamily` to `StanceTheme` to use DM Sans, the Stance web typeface. Font files are not bundled.

Motion uses the Stance duration and easing tokens. When the system has animations turned off, `StanceTheme.motion` returns `snap()` specs.

## Material 3 interop

`StanceTheme` also sets `MaterialTheme` with a colour scheme, typography and shapes mapped from Stance tokens. Any Material 3 component you use inside `StanceTheme` is on-brand without extra work.

Stance wraps a Material component only when it adds a Stance API: semantic variants, sizes, loading and error states, or a label layout. For everything else, use the Material component directly inside `StanceTheme`. Examples: `Scaffold` slots, `HorizontalPager`, `ModalNavigationDrawer`, `LazyColumn`.

The mapping lives in one function, `StanceColors.toMaterialColorScheme()`. When Material revises its roles, only that function changes.

Two overloads take Material types that are still experimental: `StanceTopAppBar(scrollBehavior = ...)` and `StanceBottomSheet(sheetState = ...)`. They are marked `@ExperimentalMaterial3Api`. The default overloads need no opt-in.

## View interop

Adopt Stance one screen region at a time in View-based apps.

```kotlin
// Host any Stance content in a ComposeView.
binding.composeContainer.setStanceContent {
    StanceBadge("Live", tone = StanceTone.Success)
}
```

```xml
<!-- Or use a Stance view in XML. -->
<com.bindshq.stance.interop.StanceButtonView
    android:id="@+id/save"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content" />
```

```kotlin
binding.save.text = "Save template"
binding.save.setOnClickListener { viewModel.save() }
```

## Adaptive layouts

- `StanceScaffold` draws edge to edge and passes system bar, cutout and keyboard insets to content.
- `rememberStanceWindowWidth()` returns compact, medium or expanded, using the Android thresholds of 600dp and 840dp.
- `StanceAdaptiveNavigation` shows a bottom bar on compact widths, a rail on medium widths and a permanent drawer on expanded widths. Selection is kept when the window changes.
- `StanceAdaptiveGrid` fits as many columns as the window allows.
- Predictive back works with the standard `BackHandler` and navigation APIs. Set `android:enableOnBackInvokedCallback="true"` in your manifest.

## Localisation

Every built-in string lives in `res/values/strings.xml` with a `stance_` prefix (`strings_ai.xml` and `stance_ai_` for the AI components), and is the default of a parameter. Stance ships English, Arabic and Spanish.

- To change one string in one place, pass the parameter: `StanceBanner(message, dismissDescription = "Hide notice")`.
- To change it everywhere, or to add a language, define the same resource name in your app. App resources win over library resources.
- Counts use plurals (`stance_results`, `stance_names_and_more`), so languages with more than two forms read correctly.

```xml
<!-- app/src/main/res/values-fr/strings.xml -->
<string name="stance_dismiss">Fermer</string>
```

Right to left needs no extra code. Layout uses start and end, chevrons and horizontal arrows mirror, and sliders and swipe actions follow the reading direction. A signature is never mirrored. Set `android:supportsRtl="true"` in your manifest.

## Motion

Banners, inline alerts, the loading overlay, the stepper and the tab indicator ease between states with the Stance duration and easing tokens. Pass `visible = false` to `StanceBanner` or `StanceInlineAlert` to ease it out before removing it. When the system animator duration scale is 0, every change applies at once.

`StanceBottomSheet` follows the predictive back gesture through Material 3, and `StanceDialog` shrinks slightly as the gesture progresses.

## Accessibility

- Every component sets roles, states and labels for TalkBack.
- Touch targets are at least 48dp, even when the visual is smaller.
- Text scales with the system font size, tested at 200%.
- Focus is visible for keyboards and D-pads. Use `Modifier.stanceFocusRing()` on custom elements.
- Errors and status messages are live regions. Warnings and errors are announced immediately.
- Swipe actions are also exposed as accessibility custom actions.
- Status is never shown by colour alone.
- Contrast is tested for every theme: 4.5:1 for text and 3:1 for boundaries, and 7:1 for text in high contrast.

A signature cannot be drawn with a screen reader or switch. Always offer a typed or uploaded alternative next to `StanceSignatureCanvas`.

## AI components

`com.bindshq.stance.components.ai` implements the cross-platform contract in `specs/ai-components.json`: 33 components in four groups.

| Group | Components |
| --- | --- |
| Conversation | `StanceThread`, `StanceMessage`, `StanceMessageGroup`, `StanceMessageActions`, `StanceBranchSwitcher`, `StanceScrollToLatest`, `StanceConversationList`, `StanceThreadEmptyState` |
| Prompt | `StancePromptComposer`, `StanceAttachmentTray`, `StanceMentionPicker`, `StanceSlashCommandMenu`, `StanceModelPicker`, `StanceContextChips`, `StanceVoiceInputButton`, `StanceStopButton`, `StanceTokenBudgetMeter` |
| Streaming | `StanceStreamingText`, `StanceThinkingIndicator`, `StanceReasoningDisclosure`, `StanceShimmerText`, `StanceGenerationProgress`, `StanceStreamingSkeleton`, `StanceInterruptedState` |
| Trust | `StanceCitationChip`, `StanceSourceList`, `StanceSourcePreview`, `StanceConfidenceBadge`, `StanceAIGeneratedLabel`, `StanceDisclaimerNote`, `StanceFeedbackBar`, `StanceReportDialog`, `StanceSensitiveContentGate` |

They are presentational. There is no networking and no model SDK: your app owns the messages and passes a `StanceGenerationStatus` (idle, submitted, streaming, complete, stopped, error).

```kotlin
Column {
    StanceThread(modifier = Modifier.weight(1f)) {
        items(messages, key = { it.id }) { message ->
            StanceMessage(message.role, status = message.status, timestamp = message.time) {
                StanceStreamingText(message.text, streaming = message.status == StanceGenerationStatus.Streaming)
            }
        }
    }
    StancePromptComposer(
        value = draft,
        onValueChange = { draft = it },
        onSubmit = viewModel::send,
        onStop = viewModel::stop,
        status = status,
    )
}
```

- `StanceThread` follows the newest message only while the reader is at the bottom. Give items stable keys.
- `StanceStreamingText` reveals at the `stream` token cadence as a draw-time clip, so a beat never lays the text out again. Screen readers hear a response once, when it is complete.
- Shimmer, pulse and reveal are static or instant when the system has animations turned off.
- AI surfaces use the ink scale only. Identity comes from the sparkle icon, motion and plain labels.
- Send, stop and ratings give haptic feedback.
- Touch has no hover, so `StanceMessageActions` takes a `visible` flag where the web has a hover option, and a citation previews in a bottom sheet.

The showcase has an Assistant screen with a full conversation and a canned, local reply.

## Native parity

These cover web components that had no Android counterpart. The plan is `specs/native-parity.json`.

| Group | Components |
| --- | --- |
| Actions | `StanceCopyButton`, `Modifier.stanceContextMenu`, `StanceToolbar`, `StanceThemeSwitcher` |
| Forms | `StanceCombobox`, `StanceMultiSelect`, `StanceCheckboxGroup`, `StanceNumberField`, `StancePinField`, `StanceInlineEdit`, `StanceCalendar` |
| Data display | `StanceAccordion`, `StanceCollapsible`, `StanceTreeView`, `StanceChart`, `StanceCodeBlock`, `StanceRichText` |
| Navigation, feedback and overlays | `StancePagination`, `StanceNotificationItem`, `StancePopover` |
| Advanced | `StanceSortableList` |

- Each wraps the Material 3 component where one exists: the exposed dropdown menu for the combobox and multi select, the date picker in display mode for the calendar, segmented buttons for the theme switcher. Charts, pin boxes and the sortable drag are drawn by Stance.
- `StanceToolbar` follows the Material 3 floating toolbar, which this BOM ships only as an expressive preview, so it is drawn on `Surface`.
- `StanceSortableList` has Move up and Move down actions on every row. `StanceChart` reads as one summary, then one stop per category.
- `StancePinField` and `StanceCodeBlock` stay left to right in right to left layouts.

## Components

`components.json` lists every public component with its category, summary, the Material API it builds on, accessibility notes and a compiled example. The documentation site reads this file.

`webEquivalent` is the web slug, or an array of slugs when one Android component covers several web components (for example `StanceDataTable` covers `table`, `data-table` and `data-grid`), or null.

Planned, not yet included: document preview.

## Development

Requires JDK 17 or later and the Android SDK with platform 37.

```bash
./gradlew :stance-tokens:test :stance-compose:testDebugUnitTest
./gradlew :stance-compose:assembleRelease :stance-compose:lintDebug
scripts/test-summary.sh stance-tokens/build/test-results stance-compose/build/test-results
```

Tests run on the JVM with Robolectric, so no emulator is needed. The showcase app in `examples/android/StanceShowcase` adds screenshot tests with Roborazzi.

### Component previews

`previews/` holds a rendered image of every visual component in the light, dark and high-contrast themes. The documentation site shows them. They are drawn by the real composables on the JVM with Robolectric and Roborazzi, so they are never mock-ups.

Regenerate them after changing a component or a token. Requires oxipng (`brew install oxipng`) and Node.

```bash
cd examples/android/StanceShowcase
./gradlew :app:generateStancePreviews
```

This renders the images, optimises them losslessly and refreshes `components.json`, which records each preview and its size in dp. To redo one component while iterating, add `-Pstance.previews.only=StanceButton`.

The compositions live in `examples/android/StanceShowcase/app/src/test/.../ComponentPreviews.kt`, `AiComponentPreviews.kt` and `ParityComponentPreviews.kt`. Inline components are 408dp wide (360dp of content with 24dp padding) and as tall as their content. Dialogs, menus, sheets and pickers are captured open. Full-screen components use a 411 by 891dp phone.

Entries with `"preview": null` draw nothing on their own: the photo and document picker launchers and `setStanceContent`.

### Generated files

Do not edit these by hand. Run the script after the source changes.

| File | Source | Command, from the repository root |
| --- | --- | --- |
| `stance-tokens/.../StanceTokens.kt` | `packages/tokens/source` | `npm run tokens` |
| `stance-compose/.../icons/StanceIcons.kt` | `packages/react/src/icons/paths.ts` | `node platforms/android/scripts/generate-icons.mjs` |
| `stance-compose/src/main/res/values*/stance_colors.xml` | resolved tokens | `node platforms/android/scripts/generate-resources.mjs` |
| `components.json` | showcase `Examples.kt`, `AiExamples.kt`, `ParityExamples.kt` and `previews/` | `node platforms/android/scripts/generate-components-json.mjs` |
| `previews/*.png` | the composables | `./gradlew :app:generateStancePreviews` in the showcase |

`StanceColors` mirrors the generated colour roles one to one. A unit test fails when a role is added to the token source without being exposed there.

## Upgrades

The layering, deprecation and versioning rules are in [docs/architecture/cross-platform.md](../../docs/architecture/cross-platform.md). In short: components read semantic roles, never values, so a design change is one edit to the token source.

## Publishing

Not published yet. `maven-publish` is configured with a local test repository only:

```bash
./gradlew publishAllPublicationsToLocalTestRepository   # writes to build/repo
```

Before a public release, Binds needs to confirm the Maven destination, ownership of the `com.bindshq` group and artifact signing.

## License

MIT. The Stance and Binds names and logos are trademarks of Binds.
