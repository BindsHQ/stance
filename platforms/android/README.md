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

## Components

`components.json` lists every public component with its category, summary, the Material API it builds on, accessibility notes and a compiled example. The documentation site reads this file.

Planned, not yet included: a reorderable list with accessible move actions, a calendar month view, document preview.

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

The compositions live in `examples/android/StanceShowcase/app/src/test/.../ComponentPreviews.kt`. Inline components are 408dp wide (360dp of content with 24dp padding) and as tall as their content. Dialogs, menus, sheets and pickers are captured open. Full-screen components use a 411 by 891dp phone.

Entries with `"preview": null` draw nothing on their own: the photo and document picker launchers and `setStanceContent`.

### Generated files

Do not edit these by hand. Run the script after the source changes.

| File | Source | Command, from the repository root |
| --- | --- | --- |
| `stance-tokens/.../StanceTokens.kt` | `packages/tokens/source` | `npm run tokens` |
| `stance-compose/.../icons/StanceIcons.kt` | `packages/react/src/icons/paths.ts` | `node platforms/android/scripts/generate-icons.mjs` |
| `stance-compose/src/main/res/values*/stance_colors.xml` | resolved tokens | `node platforms/android/scripts/generate-resources.mjs` |
| `components.json` | showcase `Examples.kt` and `previews/` | `node platforms/android/scripts/generate-components-json.mjs` |
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
