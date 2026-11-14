package com.bindshq.stance.tokens

import kotlin.math.floor

// Hand written, not generated. Implements specs/brand-theming.md from the generated
// [StanceBrandRecipe] tables, step for step like packages/tokens/src/brand-engine.js, so a
// brand resolves to the same 8 bit colours on every platform. Pure Kotlin: no Android types.

/** A resolved colour role: [rgb] is 0xRRGGBB and [alpha] runs from 0 to 1. */
public data class StanceBrandColor(public val rgb: Int, public val alpha: Double) {
    /** Uppercase `#RRGGBB`, without alpha. */
    public val hex: String get() = StanceBrandEngine.toHex(rgb)

    /** ARGB as used by [StanceColorTokens]: alpha × 255 rounded half up. */
    public val argb: Long
        get() = (StanceBrandEngine.roundHalfUp(alpha * 255.0).toLong() shl 24) or (rgb.toLong() and 0xFFFFFF)
}

/** A role pair whose contrast is below the minimum Stance requires for it. */
public data class StanceBrandContrastFailure(
    /** Theme name: light, dark or high-contrast. */
    public val theme: String,
    /** Foreground role, for example fg-default. */
    public val fg: String,
    /** Background role, for example bg-canvas. */
    public val bg: String,
    /** Measured WCAG 2 contrast ratio, rounded to two decimals. */
    public val ratio: Double,
    /** Minimum ratio for this pair in this theme. */
    public val required: Double,
) {
    override fun toString(): String = "$theme: $fg on $bg is $ratio:1, needs $required:1"
}

/**
 * A brand resolved through [StanceBrandRecipe]: the ink scale and every role of every theme.
 * [themes] is keyed by theme name, then by role name (for example bg-canvas).
 */
public class StanceResolvedBrand internal constructor(
    public val ink: Map<Int, Int>,
    public val themes: Map<String, Map<String, StanceBrandColor>>,
) {
    /** The colour tokens of [theme] (light, dark or high-contrast). */
    public fun colors(theme: String): StanceColorTokens {
        val roles = themes[theme] ?: throw IllegalArgumentException("Unknown theme $theme")
        return stanceColorTokens { role -> (roles[role] ?: error("Missing role $role in $theme")).argb }
    }

    /** [base] with its colours replaced by this brand's colours for the theme of the same name. */
    public fun applyTo(base: StanceThemeTokens): StanceThemeTokens {
        val name = if (base.name in themes) base.name else if (base.isDark) "dark" else "light"
        return base.copy(colors = colors(name))
    }

    /** Every contrast pair of [StanceBrandRecipe.contrastPairs] that fails, in theme order. */
    public fun contrastReport(): List<StanceBrandContrastFailure> = buildList {
        for (theme in StanceBrandRecipe.allThemes) {
            val roles = themes.getValue(theme.name)
            val highContrast = theme.name == StanceBrandRecipe.highContrast.name
            for (pair in StanceBrandRecipe.contrastPairs) {
                val required = if (highContrast) pair.highContrastMinimum else pair.minimum
                val ratio = StanceBrandEngine.contrast(
                    roles[pair.fg]?.rgb ?: 0,
                    roles[pair.bg]?.rgb ?: 0,
                )
                if (ratio < required) {
                    add(StanceBrandContrastFailure(theme.name, pair.fg, pair.bg, StanceBrandEngine.roundHalfUp(ratio * 100) / 100, required))
                }
            }
        }
    }
}

/**
 * The colour maths behind brand theming: OKLab conversion and mixing, WCAG contrast, accent
 * fitting and the role resolver. Every function works on 8 bit sRGB as 0xRRGGBB and doubles.
 */
public object StanceBrandEngine {
    private const val WHITE = 0xFFFFFF
    private const val BLACK = 0x000000

    /** Rounds half up (toward positive infinity), like JavaScript `Math.round`. */
    public fun roundHalfUp(x: Double): Double {
        val f = floor(x)
        return if (x - f >= 0.5) f + 1 else f
    }

    /** Parses `#RGB` or `#RRGGBB` (leading `#` optional, any case) to 0xRRGGBB. */
    public fun parseHex(hex: String): Int {
        val h = hex.trim().removePrefix("#")
        val full = if (h.length == 3) h.map { "$it$it" }.joinToString("") else h
        require((full.length == 6 || full.length == 8) && full.all { it.isDigit() || it.lowercaseChar() in 'a'..'f' }) {
            "Invalid hex colour: $hex"
        }
        return full.substring(0, 6).toInt(16)
    }

    /** Formats 0xRRGGBB as uppercase `#RRGGBB`. */
    public fun toHex(rgb: Int): String = "#" + (rgb and 0xFFFFFF).toString(16).padStart(6, '0').uppercase()

    private fun toLinear(c: Double): Double = if (c <= 0.04045) c / 12.92 else StrictMath.pow((c + 0.055) / 1.055, 2.4)

    private fun toEncoded(c: Double): Double = if (c <= 0.0031308) c * 12.92 else 1.055 * StrictMath.pow(c, 1 / 2.4) - 0.055

    private fun channels(rgb: Int): DoubleArray = doubleArrayOf(
        ((rgb shr 16) and 255) / 255.0,
        ((rgb shr 8) and 255) / 255.0,
        (rgb and 255) / 255.0,
    )

    /** Converts 0xRRGGBB to OKLab `[L, a, b]` (Ottosson 2020). */
    public fun toOklab(rgb: Int): DoubleArray {
        val c = channels(rgb)
        val r = toLinear(c[0])
        val g = toLinear(c[1])
        val b = toLinear(c[2])
        val l = StrictMath.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
        val m = StrictMath.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
        val s = StrictMath.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
        return doubleArrayOf(
            0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
        )
    }

    /** Converts OKLab to 0xRRGGBB, clamping each channel to 0 to 1 and rounding × 255 half up. */
    public fun fromOklab(lightness: Double, a: Double, b: Double): Int {
        val l = StrictMath.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3.0)
        val m = StrictMath.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3.0)
        val s = StrictMath.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3.0)
        val lin = doubleArrayOf(
            4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
        )
        var out = 0
        for (c in lin) {
            val encoded = toEncoded(c.coerceIn(0.0, 1.0)) * 255
            out = (out shl 8) or roundHalfUp(encoded.coerceIn(0.0, 255.0)).toInt()
        }
        return out
    }

    /** Linear interpolation in OKLab: [t] 0 gives [from], 1 gives [to]. */
    public fun mix(from: Int, to: Int, t: Double): Int {
        val a = toOklab(from)
        val b = toOklab(to)
        return fromOklab(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
    }

    /** WCAG 2 relative luminance. */
    public fun luminance(rgb: Int): Double {
        val c = channels(rgb)
        return 0.2126 * toLinear(c[0]) + 0.7152 * toLinear(c[1]) + 0.0722 * toLinear(c[2])
    }

    /** WCAG 2 contrast ratio, from 1 to 21. */
    public fun contrast(a: Int, b: Int): Double {
        val la = luminance(a)
        val lb = luminance(b)
        val hi = maxOf(la, lb)
        val lo = minOf(la, lb)
        return (hi + 0.05) / (lo + 0.05)
    }

    /**
     * Fits the OKLab lightness of [start] until it meets [min] against every colour in
     * [against], keeping a and b, exactly as documented on [StanceBrandRecipe.FIT_ITERATIONS].
     * [targetL] is 0.0 (toward black) or 1.0 (toward white).
     */
    public fun fitAccent(start: Int, against: List<Int>, min: Double, targetL: Double): Int {
        fun passes(rgb: Int) = against.all { contrast(rgb, it) >= min }
        if (passes(start)) return start
        val lab = toOklab(start)
        fun at(l: Double) = fromOklab(l, lab[1], lab[2])
        if (!passes(at(targetL))) return at(targetL)
        var lo = lab[0]
        var hi = targetL
        repeat(StanceBrandRecipe.FIT_ITERATIONS) {
            val mid = (lo + hi) / 2
            if (passes(at(mid))) hi = mid else lo = mid
        }
        return at(hi)
    }

    /** The ink scale for a brand pair: step to 0xRRGGBB. */
    public fun inkScale(light: Int, dark: Int): Map<Int, Int> =
        StanceBrandRecipe.ink.associate { it.step to mix(light, dark, it.t) }

    /**
     * Resolves every role of every theme for a brand. [accentLight] starts the themes whose
     * recipe accent is light (light and high contrast), [accentDark] the dark theme. Pass both
     * null for no accent; pass the same value twice for a single accent.
     */
    public fun resolve(light: Int, dark: Int, accentLight: Int? = null, accentDark: Int? = accentLight): StanceResolvedBrand {
        val lightRgb = light and 0xFFFFFF
        val darkRgb = dark and 0xFFFFFF
        val ink = inkScale(lightRgb, darkRgb)
        val themes = LinkedHashMap<String, Map<String, StanceBrandColor>>()
        for (theme in StanceBrandRecipe.allThemes) {
            val accent = when (theme.accent) {
                StanceBrandSource.Light -> accentLight
                StanceBrandSource.Dark -> accentDark
            }?.and(0xFFFFFF)
            themes[theme.name] = ThemeResolver(theme, lightRgb, darkRgb, accent, ink).resolveAll()
        }
        return StanceResolvedBrand(ink, themes)
    }

    private class ThemeResolver(
        val theme: StanceThemeRecipe,
        val light: Int,
        val dark: Int,
        val accent: Int?,
        val ink: Map<Int, Int>,
    ) {
        private val recipes = theme.roles.associate { it.role to it.recipe }
        private val out = HashMap<String, StanceBrandColor>()

        fun resolveAll(): Map<String, StanceBrandColor> {
            for (entry in theme.roles) role(entry.role)
            val ordered = LinkedHashMap<String, StanceBrandColor>()
            for (entry in theme.roles) ordered[entry.role] = out.getValue(entry.role)
            return ordered
        }

        private fun role(name: String): StanceBrandColor {
            out[name]?.let { return it }
            val recipe = recipes[name] ?: error("Unknown role $name in theme ${theme.name}")
            return step(recipe).also { out[name] = it }
        }

        private fun named(target: StanceMixTarget): Int = when (target) {
            StanceMixTarget.White -> WHITE
            StanceMixTarget.Black -> BLACK
            StanceMixTarget.Light -> light
            StanceMixTarget.Dark -> dark
        }

        private fun foreground(on: Int): Int = if (contrast(light, on) >= contrast(dark, on)) light else dark

        private fun step(r: StanceRoleRecipe): StanceBrandColor = when (r) {
            StanceRoleRecipe.Light -> StanceBrandColor(light, 1.0)
            StanceRoleRecipe.Dark -> StanceBrandColor(dark, 1.0)
            is StanceRoleRecipe.Ink -> StanceBrandColor(ink[r.step] ?: error("Unknown ink step ${r.step}"), 1.0)
            is StanceRoleRecipe.Literal -> StanceBrandColor(r.rgb and 0xFFFFFF, r.alpha)
            is StanceRoleRecipe.Derive -> {
                val from = if (r.from == StanceBrandSource.Light) light else dark
                val rgb = r.toward?.let { mix(from, named(it), r.amount) } ?: from
                StanceBrandColor(rgb, r.alpha)
            }
            is StanceRoleRecipe.AccentFit -> when {
                accent == null -> step(r.fallback)
                r.use == StanceAccentUse.Fill -> {
                    val fg = foreground(accent)
                    val targetL = if (luminance(fg) > luminance(accent)) 0.0 else 1.0
                    StanceBrandColor(fitAccent(accent, listOf(fg), r.min, targetL), 1.0)
                }
                else -> {
                    val against = r.against.map { role(it).rgb }
                    val targetL = if (r.toward == StanceMixTarget.White) 1.0 else 0.0
                    StanceBrandColor(fitAccent(accent, against, r.min, targetL), 1.0)
                }
            }
            is StanceRoleRecipe.AccentShade -> if (accent == null) {
                step(r.fallback)
            } else {
                val toward = if (role(r.awayFrom).rgb == light) dark else light
                StanceBrandColor(mix(role(r.of).rgb, toward, r.amount), 1.0)
            }
            is StanceRoleRecipe.AccentForeground -> StanceBrandColor(foreground(role(r.on).rgb), 1.0)
        }
    }
}
