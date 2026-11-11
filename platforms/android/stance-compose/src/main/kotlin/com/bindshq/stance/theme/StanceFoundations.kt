package com.bindshq.stance.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.shape.CornerBasedShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Immutable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bindshq.stance.tokens.StanceShadowLayer
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens

/** The Stance spacing scale on a 4dp grid. Names match the token steps (`space4` = 16dp). */
@Immutable
public object StanceSpacing {
    public val none: Dp = StanceTokens.Space.space0.dp
    public val hairline: Dp = StanceTokens.Space.spacepx.dp
    public val space05: Dp = StanceTokens.Space.space05.dp
    public val space1: Dp = StanceTokens.Space.space1.dp
    public val space15: Dp = StanceTokens.Space.space15.dp
    public val space2: Dp = StanceTokens.Space.space2.dp
    public val space25: Dp = StanceTokens.Space.space25.dp
    public val space3: Dp = StanceTokens.Space.space3.dp
    public val space4: Dp = StanceTokens.Space.space4.dp
    public val space5: Dp = StanceTokens.Space.space5.dp
    public val space6: Dp = StanceTokens.Space.space6.dp
    public val space8: Dp = StanceTokens.Space.space8.dp
    public val space10: Dp = StanceTokens.Space.space10.dp
    public val space12: Dp = StanceTokens.Space.space12.dp
    public val space16: Dp = StanceTokens.Space.space16.dp
    public val space20: Dp = StanceTokens.Space.space20.dp
    public val space24: Dp = StanceTokens.Space.space24.dp
    public val space32: Dp = StanceTokens.Space.space32.dp
}

/** Component dimensions shared across Stance components. */
@Immutable
public object StanceSizes {
    public val controlSmall: Dp = StanceTokens.Size.controlSm.dp
    public val controlMedium: Dp = StanceTokens.Size.controlMd.dp
    public val controlLarge: Dp = StanceTokens.Size.controlLg.dp
    public val iconSmall: Dp = StanceTokens.Size.iconSm.dp
    public val iconMedium: Dp = StanceTokens.Size.iconMd.dp
    public val iconLarge: Dp = StanceTokens.Size.iconLg.dp

    /** Minimum touch target on Android (48dp). */
    public val touchTarget: Dp = StanceTokens.TouchTarget.android.dp
    public val contentMaxWidth: Dp = StanceTokens.Size.containerSm.dp

    /** Default width of a data table column. */
    public val tableColumnWidth: Dp = (StanceTokens.Space.space32 + StanceTokens.Space.space8).dp

    /** Width of a permanent navigation drawer. */
    public val drawerWidth: Dp = (StanceTokens.Space.space32 * 2 + StanceTokens.Space.space8).dp

    /** Tallest a picker may grow inside a dialog (four steps of the largest spacing token). */
    public val pickerMaxHeight: Dp = (StanceTokens.Space.space32 * 4).dp
}

/** Corner shapes from the Stance radius scale. */
@Immutable
public data class StanceShapes(
    val extraSmall: CornerBasedShape = RoundedCornerShape(StanceTokens.Radius.xs.dp),
    val small: CornerBasedShape = RoundedCornerShape(StanceTokens.Radius.sm.dp),
    val medium: CornerBasedShape = RoundedCornerShape(StanceTokens.Radius.md.dp),
    val large: CornerBasedShape = RoundedCornerShape(StanceTokens.Radius.lg.dp),
    val extraLarge: CornerBasedShape = RoundedCornerShape(StanceTokens.Radius.xl.dp),
    val sheet: CornerBasedShape = RoundedCornerShape(StanceTokens.Radius._2xl.dp),
    val pill: CornerBasedShape = RoundedCornerShape(percent = 50),
)

/** One elevation level: the Android shadow elevation plus the outline used when shadows are off. */
@Immutable
public data class StanceElevationLevel(val shadow: Dp, val outline: Dp)

/**
 * Elevation derived from the theme's shadow tokens.
 *
 * Android draws shadows from an elevation value, so each level uses the largest vertical offset
 * of its shadow token. High contrast replaces soft shadows with solid outlines, matching the web theme.
 */
@Immutable
public data class StanceElevation(
    val none: StanceElevationLevel,
    val xs: StanceElevationLevel,
    val sm: StanceElevationLevel,
    val md: StanceElevationLevel,
    val lg: StanceElevationLevel,
    val xl: StanceElevationLevel,
) {
    public companion object {
        public fun from(theme: StanceThemeTokens): StanceElevation {
            fun level(layers: List<StanceShadowLayer>): StanceElevationLevel {
                val soft = layers.filter { it.blur > 0f }
                val ring = layers.filter { it.blur == 0f && it.spread > 0f }
                return StanceElevationLevel(
                    shadow = (soft.maxOfOrNull { it.y } ?: 0f).dp,
                    outline = (ring.maxOfOrNull { it.spread } ?: 0f).dp,
                )
            }
            return StanceElevation(
                none = StanceElevationLevel(0.dp, 0.dp),
                xs = level(theme.shadows.xs),
                sm = level(theme.shadows.sm),
                md = level(theme.shadows.md),
                lg = level(theme.shadows.lg),
                xl = level(theme.shadows.xl),
            )
        }
    }
}

/**
 * Motion from Stance duration and easing tokens.
 *
 * When [reduceMotion] is true (the system animator duration scale is 0), every spec is [snap].
 */
@Immutable
public class StanceMotion(public val reduceMotion: Boolean) {
    public val standardEasing: Easing = StanceTokens.Easing.standard.toEasing()
    public val emphasizedEasing: Easing = StanceTokens.Easing.emphasized.toEasing()
    public val exitEasing: Easing = StanceTokens.Easing.exit.toEasing()

    public val fastMillis: Int = StanceTokens.Duration.fast
    public val normalMillis: Int = StanceTokens.Duration.normal
    public val slowMillis: Int = StanceTokens.Duration.slow

    /** Hover, press and colour changes. */
    public fun <T> fast(): FiniteAnimationSpec<T> = spec(fastMillis, standardEasing)

    /** Menus, snackbars and small surfaces entering. */
    public fun <T> normal(): FiniteAnimationSpec<T> = spec(normalMillis, emphasizedEasing)

    /** Dialogs and sheets entering. */
    public fun <T> slow(): FiniteAnimationSpec<T> = spec(slowMillis, emphasizedEasing)

    /** Anything leaving the screen. Exits are quicker than entrances. */
    public fun <T> exit(): FiniteAnimationSpec<T> = spec(fastMillis, exitEasing)

    private fun <T> spec(millis: Int, easing: Easing): FiniteAnimationSpec<T> =
        if (reduceMotion) snap() else tween(durationMillis = millis, easing = easing)

    override fun equals(other: Any?): Boolean = other is StanceMotion && other.reduceMotion == reduceMotion

    override fun hashCode(): Int = reduceMotion.hashCode()
}

private fun FloatArray.toEasing(): Easing = CubicBezierEasing(this[0], this[1], this[2], this[3])
