package com.bindshq.stance.theme

import android.content.Context
import android.content.pm.ApplicationInfo
import android.util.Log
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.colorspace.ColorSpaces
import androidx.compose.ui.graphics.toArgb
import com.bindshq.stance.tokens.StanceBrandContrastFailure
import com.bindshq.stance.tokens.StanceBrandEngine
import com.bindshq.stance.tokens.StanceBrandRecipe
import com.bindshq.stance.tokens.StanceResolvedBrand
import com.bindshq.stance.tokens.StanceThemeTokens
import java.util.Collections

/**
 * An optional accent for a [StanceBrand]: the colour for primary actions, selection, links and
 * focus. [light] starts the light and high contrast themes, [dark] the dark theme. Stance adjusts
 * the lightness where needed so every contrast check passes.
 */
@Immutable
public class StanceBrandAccent private constructor(
    /** 0xRRGGBB starting colour for the light and high contrast themes. */
    public val lightRgb: Int,
    /** 0xRRGGBB starting colour for the dark theme. */
    public val darkRgb: Int,
) {
    /** One accent colour for every theme. */
    public constructor(color: Color) : this(color.rgb(), color.rgb())

    /** A separate starting colour for the dark theme. */
    public constructor(light: Color, dark: Color) : this(light.rgb(), dark.rgb())

    /** One accent colour for every theme, as `#RGB` or `#RRGGBB`. */
    public constructor(hex: String) : this(StanceBrandEngine.parseHex(hex), StanceBrandEngine.parseHex(hex))

    /** A separate starting colour for the dark theme, as `#RGB` or `#RRGGBB`. */
    public constructor(light: String, dark: String) : this(StanceBrandEngine.parseHex(light), StanceBrandEngine.parseHex(dark))

    /** The light theme accent as a [Color]. */
    public val light: Color get() = Color(0xFF000000 or lightRgb.toLong())

    /** The dark theme accent as a [Color]. */
    public val dark: Color get() = Color(0xFF000000 or darkRgb.toLong())

    override fun equals(other: Any?): Boolean = other is StanceBrandAccent && other.lightRgb == lightRgb && other.darkRgb == darkRgb

    override fun hashCode(): Int = 31 * lightRgb + darkRgb

    override fun toString(): String =
        if (lightRgb == darkRgb) StanceBrandEngine.toHex(lightRgb) else "${StanceBrandEngine.toHex(lightRgb)}/${StanceBrandEngine.toHex(darkRgb)}"
}

/**
 * A brand for Stance: a palette generated from your own colours (specs/brand-theming.md).
 * Optional; without one, Stance uses its default palette, which is also [StanceBrand.Binds].
 *
 * ```kotlin
 * val acme = StanceBrand("Acme", light = "#F2F8FF", dark = "#0A1A50", accent = "#FF5A36")
 * StanceTheme(brand = acme) { App() }
 * ```
 *
 * [light] becomes the light canvas and the foreground on dark surfaces; [dark] becomes text and
 * the dark canvas. Light, dark and high contrast all follow the brand. Colours are opaque sRGB;
 * any alpha is ignored. Resolution happens once per brand and is cached.
 */
@Immutable
public class StanceBrand(
    /** Human name, used in diagnostics. */
    public val name: String,
    /** The brand's lightest colour. */
    public val light: Color,
    /** The brand's darkest colour. */
    public val dark: Color,
    /** Optional accent; null keeps the brand pair as the accent. */
    public val accent: StanceBrandAccent? = null,
) {
    /** A brand with one accent colour for every theme. */
    public constructor(name: String, light: Color, dark: Color, accent: Color) :
        this(name, light, dark, StanceBrandAccent(accent))

    /** A brand from `#RGB` or `#RRGGBB` hex strings. Throws [IllegalArgumentException] for other text. */
    public constructor(name: String, light: String, dark: String, accent: String? = null) :
        this(name, hexColor(light), hexColor(dark), accent?.let { StanceBrandAccent(it) })

    /** A brand from hex strings with a separate accent for the dark theme. */
    public constructor(name: String, light: String, dark: String, accentLight: String, accentDark: String) :
        this(name, hexColor(light), hexColor(dark), StanceBrandAccent(accentLight, accentDark))

    private val lightRgb: Int = light.rgb()
    private val darkRgb: Int = dark.rgb()

    /** True for the default palette: the Binds pair with no accent. It adds nothing at runtime. */
    public val isDefault: Boolean
        get() = accent == null && lightRgb == StanceBrandRecipe.bindsLight && darkRgb == StanceBrandRecipe.bindsDark

    private val resolved: StanceResolvedBrand? by lazy(LazyThreadSafetyMode.PUBLICATION) {
        if (isDefault) null else StanceBrandEngine.resolve(lightRgb, darkRgb, accent?.lightRgb, accent?.darkRgb)
    }

    /**
     * [base] with this brand's colours for the theme of the same name (light, dark or
     * high-contrast). The default palette returns [base] unchanged.
     */
    public fun themeTokens(base: StanceThemeTokens): StanceThemeTokens = resolved?.applyTo(base) ?: base

    /**
     * Role pairs whose contrast is below what Stance requires, across all three themes. Empty
     * when every check passes, which is always the case for the default palette.
     */
    public fun contrastReport(): List<StanceBrandContrastFailure> = report

    private val report: List<StanceBrandContrastFailure> by lazy(LazyThreadSafetyMode.PUBLICATION) {
        resolved?.contrastReport().orEmpty()
    }

    override fun equals(other: Any?): Boolean =
        other is StanceBrand && other.name == name && other.lightRgb == lightRgb && other.darkRgb == darkRgb && other.accent == accent

    override fun hashCode(): Int = ((name.hashCode() * 31 + lightRgb) * 31 + darkRgb) * 31 + (accent?.hashCode() ?: 0)

    override fun toString(): String =
        "StanceBrand($name, ${StanceBrandEngine.toHex(lightRgb)}, ${StanceBrandEngine.toHex(darkRgb)}${accent?.let { ", $it" } ?: ""})"

    public companion object {
        /** The default Stance palette, Binds Ivory and Indigo. The same as passing no brand. */
        public val Binds: StanceBrand = StanceBrand(
            name = "Binds",
            light = Color(0xFF000000 or StanceBrandRecipe.bindsLight.toLong()),
            dark = Color(0xFF000000 or StanceBrandRecipe.bindsDark.toLong()),
        )
    }
}

private fun hexColor(hex: String): Color = Color(0xFF000000 or StanceBrandEngine.parseHex(hex).toLong())

private fun Color.rgb(): Int = convert(ColorSpaces.Srgb).toArgb() and 0xFFFFFF

private val loggedBrands: MutableSet<StanceBrand> = Collections.synchronizedSet(HashSet())

/**
 * In debuggable apps, logs a brand's contrast failures once per brand per process. Release
 * builds and the default palette never log.
 */
internal fun logBrandContrastOnce(context: Context, brand: StanceBrand) {
    if (brand.isDefault) return
    if ((context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) == 0) return
    val report = brand.contrastReport()
    if (report.isEmpty() || !loggedBrands.add(brand)) return
    Log.w(
        "Stance",
        "Brand \"${brand.name}\" has ${report.size} contrast pair(s) below the minimum:\n" +
            report.joinToString("\n") { "  $it" },
    )
}
