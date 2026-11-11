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

/**
 * Applies the Stance theme to [content].
 *
 * Provides Stance's semantic colours, typography, shapes, elevation and motion, and bridges them
 * into [MaterialTheme], so Material 3 components used inside are on-brand without extra work.
 *
 * Dynamic colour (Material You) is intentionally not used: Binds has exactly two brand colours,
 * ivory and indigo, and every Stance theme is derived from them.
 *
 * @param appearance The person's preference. [StanceAppearance.System] follows dark theme and contrast settings.
 * @param fontFamily Typeface for the type scale. Defaults to the platform typeface.
 */
@Composable
public fun StanceTheme(
    appearance: StanceAppearance = StanceAppearance.System,
    fontFamily: FontFamily = FontFamily.Default,
    content: @Composable () -> Unit,
) {
    StanceTheme(tokens = rememberStanceThemeTokens(appearance), fontFamily = fontFamily, content = content)
}

/** Applies an explicit set of theme tokens. Useful for previews, tests and scoped themes. */
@Composable
public fun StanceTheme(
    tokens: StanceThemeTokens,
    fontFamily: FontFamily = FontFamily.Default,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val colors = remember(tokens) { StanceColors(tokens.colors) }
    val typography = remember(fontFamily) { stanceTypography(fontFamily) }
    val shapes = remember { StanceShapes() }
    val elevation = remember(tokens) { StanceElevation.from(tokens) }
    val motion = remember(context) { StanceMotion(reduceMotion = isReduceMotionEnabled(context)) }

    CompositionLocalProvider(
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
