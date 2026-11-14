package com.bindshq.stance.theme

import android.content.Context
import android.provider.Settings
import androidx.compose.foundation.LocalIndication
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens

private val LocalStanceColors = staticCompositionLocalOf { StanceColors(StanceTokens.light.colors) }
private val LocalStanceTypography = staticCompositionLocalOf { stanceTypography() }
private val LocalStanceShapes = staticCompositionLocalOf { StanceShapes() }
private val LocalStanceElevation = staticCompositionLocalOf { StanceElevation.from(StanceTokens.light) }
private val LocalStanceMotion = staticCompositionLocalOf { StanceMotion(reduceMotion = false) }
private val LocalStanceThemeTokens = staticCompositionLocalOf { StanceTokens.light }
private val LocalStanceBaseTokens = staticCompositionLocalOf { StanceTokens.light }
private val LocalStanceBrand = staticCompositionLocalOf { StanceBrand.Binds }

/**
 * Applies the Stance theme to [content].
 *
 * Provides Stance's semantic colours, typography, shapes, elevation and motion, and bridges them
 * into [MaterialTheme], so Material 3 components used inside are on-brand without extra work.
 *
 * Material You dynamic colour is not used, so the palette stays consistent across devices. To
 * use your own colours, pass a [brand]; light, dark and high contrast all follow it.
 *
 * @param appearance The person's preference. [StanceAppearance.System] follows dark theme and contrast settings.
 * @param fontFamily Typeface for the type scale. Defaults to the platform typeface.
 * @param brand Optional brand palette. Null uses the brand already in scope, which is the default palette unless an outer [StanceTheme] or [StanceBrandScope] set one.
 */
@Composable
public fun StanceTheme(
    appearance: StanceAppearance = StanceAppearance.System,
    fontFamily: FontFamily = FontFamily.Default,
    brand: StanceBrand? = null,
    content: @Composable () -> Unit,
) {
    StanceTheme(tokens = rememberStanceThemeTokens(appearance), fontFamily = fontFamily, brand = brand, content = content)
}

/**
 * Applies an explicit set of theme tokens. Useful for previews, tests and scoped themes.
 *
 * With a [brand] other than the default palette, the colours of [tokens] are replaced by the
 * brand's colours for the theme of the same name; everything else in [tokens] is kept.
 */
@Composable
public fun StanceTheme(
    tokens: StanceThemeTokens,
    fontFamily: FontFamily = FontFamily.Default,
    brand: StanceBrand? = null,
    content: @Composable () -> Unit,
) {
    val typography = remember(fontFamily) { stanceTypography(fontFamily) }
    ProvideStanceTheme(base = tokens, brand = brand ?: LocalStanceBrand.current, typography = typography, content = content)
}

/**
 * Applies [brand] to [content] only, keeping the active theme (light, dark or high contrast) and
 * typography. Every Stance component inside picks the brand up with no other change.
 *
 * ```kotlin
 * StanceBrandScope(StanceBrand("Acme", light = "#F2F8FF", dark = "#0A1A50")) {
 *     StanceButton("Upgrade", onClick = {})
 * }
 * ```
 */
@Composable
public fun StanceBrandScope(brand: StanceBrand, content: @Composable () -> Unit) {
    ProvideStanceTheme(
        base = LocalStanceBaseTokens.current,
        brand = brand,
        typography = LocalStanceTypography.current,
        content = content,
    )
}

@Composable
private fun ProvideStanceTheme(
    base: StanceThemeTokens,
    brand: StanceBrand,
    typography: StanceTypography,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    // StanceBrand caches its resolution; remembering the instance keeps it across recompositions
    // even when an equal brand is created inline each time.
    val rememberedBrand = remember(brand) { brand }
    val tokens = remember(rememberedBrand, base) { rememberedBrand.themeTokens(base) }
    if (!rememberedBrand.isDefault) {
        LaunchedEffect(rememberedBrand) { logBrandContrastOnce(context, rememberedBrand) }
    }
    val colors = remember(tokens) { StanceColors(tokens.colors) }
    val shapes = remember { StanceShapes() }
    val elevation = remember(tokens) { StanceElevation.from(tokens) }
    val motion = remember(context) { StanceMotion(reduceMotion = isReduceMotionEnabled(context)) }

    CompositionLocalProvider(
        LocalStanceBrand provides rememberedBrand,
        LocalStanceBaseTokens provides base,
        LocalStanceThemeTokens provides tokens,
        LocalStanceColors provides colors,
        LocalStanceTypography provides typography,
        LocalStanceShapes provides shapes,
        LocalStanceElevation provides elevation,
        LocalStanceMotion provides motion,
    ) {
        MaterialTheme(
            colorScheme = remember(colors, tokens.isDark) { colors.toMaterialColorScheme(tokens.isDark) },
            typography = remember(typography) { typography.toMaterialTypography() },
            shapes = remember(shapes) { shapes.toMaterialShapes() },
        ) {
            CompositionLocalProvider(
                LocalContentColor provides colors.fgDefault,
                LocalIndication provides ripple(color = colors.fgDefault),
                content = content,
            )
        }
    }
}

/** Accessors for the active Stance theme. */
public object StanceTheme {
    public val colors: StanceColors
        @Composable @ReadOnlyComposable get() = LocalStanceColors.current

    public val typography: StanceTypography
        @Composable @ReadOnlyComposable get() = LocalStanceTypography.current

    public val shapes: StanceShapes
        @Composable @ReadOnlyComposable get() = LocalStanceShapes.current

    public val elevation: StanceElevation
        @Composable @ReadOnlyComposable get() = LocalStanceElevation.current

    public val motion: StanceMotion
        @Composable @ReadOnlyComposable get() = LocalStanceMotion.current

    public val spacing: StanceSpacing get() = StanceSpacing

    public val sizes: StanceSizes get() = StanceSizes

    /** The raw tokens of the active theme, including its name and border and focus widths. */
    public val tokens: StanceThemeTokens
        @Composable @ReadOnlyComposable get() = LocalStanceThemeTokens.current

    /** The brand in scope. [StanceBrand.Binds] when none was set. */
    public val brand: StanceBrand
        @Composable @ReadOnlyComposable get() = LocalStanceBrand.current

    /** True when the high-contrast theme is active. */
    public val isHighContrast: Boolean
        @Composable @ReadOnlyComposable get() = LocalStanceThemeTokens.current.name == StanceTokens.highContrast.name
}

/** True when the system animator duration scale is 0 ("Remove animations"). */
public fun isReduceMotionEnabled(context: Context): Boolean =
    Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f

/**
 * Maps Stance roles onto a Material 3 [ColorScheme]. This is the only place that knows how the
 * two systems correspond; when Material revises its roles, only this function changes.
 */
public fun StanceColors.toMaterialColorScheme(isDark: Boolean): ColorScheme {
    val base = if (isDark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = accentBg,
        onPrimary = accentFg,
        primaryContainer = bgEmphasis,
        onPrimaryContainer = fgDefault,
        inversePrimary = accentFg,
        secondary = fgMuted,
        onSecondary = bgCanvas,
        secondaryContainer = interactiveSelected,
        onSecondaryContainer = interactiveSelectedFg,
        tertiary = fgMuted,
        onTertiary = bgCanvas,
        tertiaryContainer = bgMuted,
        onTertiaryContainer = fgDefault,
        background = bgCanvas,
        onBackground = fgDefault,
        surface = bgCanvas,
        onSurface = fgDefault,
        surfaceVariant = bgMuted,
        onSurfaceVariant = fgMuted,
        surfaceTint = bgCanvas,
        inverseSurface = bgInverse,
        inverseOnSurface = fgInverse,
        error = dangerSolid,
        onError = dangerOnSolid,
        errorContainer = dangerBg,
        onErrorContainer = dangerFg,
        outline = borderControl,
        outlineVariant = borderDefault,
        scrim = bgScrim,
        surfaceBright = bgSurfaceRaised,
        surfaceDim = bgMuted,
        surfaceContainerLowest = bgSurface,
        surfaceContainerLow = bgSurface,
        surfaceContainer = bgSubtle,
        surfaceContainerHigh = bgOverlay,
        surfaceContainerHighest = bgMuted,
    )
}

/** Maps the Stance type scale onto Material 3 [Typography]. */
public fun StanceTypography.toMaterialTypography(): Typography = Typography(
    displayLarge = display,
    displayMedium = display,
    displaySmall = headingLarge,
    headlineLarge = headingLarge,
    headlineMedium = headingMedium,
    headlineSmall = headingSmall,
    titleLarge = headingSmall,
    titleMedium = title,
    titleSmall = label,
    bodyLarge = body,
    bodyMedium = bodySmall,
    bodySmall = caption,
    labelLarge = button,
    labelMedium = labelSmall,
    labelSmall = labelSmall,
)

/** Maps Stance shapes onto Material 3 [Shapes]. */
public fun StanceShapes.toMaterialShapes(): Shapes = Shapes(
    extraSmall = extraSmall,
    small = small,
    medium = medium,
    large = large,
    extraLarge = extraLarge,
)
