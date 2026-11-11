package com.bindshq.stance

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bindshq.stance.a11y.stanceContrastRatio
import com.bindshq.stance.components.data.stanceInitials
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceColors
import com.bindshq.stance.theme.StanceElevation
import com.bindshq.stance.theme.StanceMotion
import com.bindshq.stance.theme.resolveStanceTheme
import com.bindshq.stance.theme.stanceTypography
import com.bindshq.stance.theme.toMaterialColorScheme
import com.bindshq.stance.tokens.StanceColorTokens
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ThemeLogicTest {
    @Test
    fun explicitPreferencesIgnoreSystemSettings() {
        for (dark in listOf(false, true)) for (contrast in listOf(false, true)) {
            assertEquals(StanceTokens.light, resolveStanceTheme(StanceAppearance.Light, dark, contrast))
            assertEquals(StanceTokens.dark, resolveStanceTheme(StanceAppearance.Dark, dark, contrast))
            assertEquals(StanceTokens.highContrast, resolveStanceTheme(StanceAppearance.HighContrast, dark, contrast))
        }
    }

    @Test
    fun systemFollowsDarkThemeAndContrastWithContrastWinning() {
        assertEquals(StanceTokens.light, resolveStanceTheme(StanceAppearance.System, systemInDarkTheme = false, systemHighContrast = false))
        assertEquals(StanceTokens.dark, resolveStanceTheme(StanceAppearance.System, systemInDarkTheme = true, systemHighContrast = false))
        assertEquals(StanceTokens.highContrast, resolveStanceTheme(StanceAppearance.System, systemInDarkTheme = false, systemHighContrast = true))
        assertEquals(StanceTokens.highContrast, resolveStanceTheme(StanceAppearance.System, systemInDarkTheme = true, systemHighContrast = true))
    }

    @Test
    fun storageValuesMatchTheWeb() {
        assertEquals(listOf("system", "light", "dark", "high-contrast"), StanceAppearance.entries.map { it.storageValue })
        assertEquals(StanceAppearance.HighContrast, StanceAppearance.fromStorageValue("high-contrast"))
        assertEquals(StanceAppearance.System, StanceAppearance.fromStorageValue(null))
        assertEquals(StanceAppearance.System, StanceAppearance.fromStorageValue("purple"))
    }

    @Test
    fun everyTokenRoleIsExposedAsAComposeColour() {
        val roles = StanceColorTokens::class.java.declaredFields.map { it.name }.filter { !it.startsWith("$") }.toSet()
        val exposed = StanceColors::class.java.declaredFields.map { it.name }.toSet()
        assertTrue(roles.isNotEmpty())
        assertEquals(emptySet(), roles - exposed, "roles missing from StanceColors")
    }

    @Test
    fun coloursMapExactlyFromTokens() {
        val colors = StanceColors(StanceTokens.light.colors)
        assertEquals(Color(0xFFFCF6EB), colors.bgCanvas)
        assertEquals(Color(0xFF140C2E), colors.fgDefault)
        assertEquals(Color(StanceTokens.dark.colors.accentBg), StanceColors(StanceTokens.dark.colors).accentBg)
    }

    @Test
    fun materialBridgeUsesStanceRoles() {
        for (theme in StanceTokens.allThemes) {
            val colors = StanceColors(theme.colors)
            val scheme = colors.toMaterialColorScheme(theme.isDark)
            assertEquals(colors.accentBg, scheme.primary)
            assertEquals(colors.accentFg, scheme.onPrimary)
            assertEquals(colors.bgCanvas, scheme.background)
            assertEquals(colors.fgDefault, scheme.onSurface)
            assertEquals(colors.dangerSolid, scheme.error)
            assertEquals(colors.borderControl, scheme.outline)
        }
    }

    @Test
    fun typographyUsesScalableUnitsFromTokens() {
        val type = stanceTypography()
        assertEquals(StanceTokens.FontSize.sizemd.sp, type.body.fontSize)
        assertEquals(StanceTokens.FontSize.sizesm.sp, type.label.fontSize)
        assertTrue(type.display.fontSize.value > type.headingLarge.fontSize.value)
        assertTrue(type.body.fontSize.isSp && type.caption.fontSize.isSp)
        assertTrue(type.body.lineHeight.isEm)
    }

    @Test
    fun elevationComesFromShadowTokensAndBecomesOutlinesInHighContrast() {
        val light = StanceElevation.from(StanceTokens.light)
        assertTrue(light.xl.shadow > light.md.shadow && light.md.shadow > light.xs.shadow)
        assertEquals(0.dp, light.md.outline)
        val contrast = StanceElevation.from(StanceTokens.highContrast)
        assertEquals(0.dp, contrast.md.shadow)
        assertTrue(contrast.md.outline > 0.dp)
    }

    @Test
    fun reducedMotionSnaps() {
        assertEquals("SnapSpec", StanceMotion(reduceMotion = true).normal<Float>()::class.simpleName)
        assertEquals("TweenSpec", StanceMotion(reduceMotion = false).normal<Float>()::class.simpleName)
        assertEquals(StanceTokens.Duration.fast, StanceMotion(false).fastMillis)
    }

    @Test
    fun windowWidthClassesFollowAndroidGuidance() {
        assertEquals(StanceWindowWidth.Compact, StanceWindowWidth.fromWidth(411.dp))
        assertEquals(StanceWindowWidth.Medium, StanceWindowWidth.fromWidth(600.dp))
        assertEquals(StanceWindowWidth.Medium, StanceWindowWidth.fromWidth(839.dp))
        assertEquals(StanceWindowWidth.Expanded, StanceWindowWidth.fromWidth(840.dp))
    }

    @Test
    fun initialsUseFirstAndLastName() {
        assertEquals("AO", stanceInitials("Amara Okafor"))
        assertEquals("P", stanceInitials("priya"))
        assertEquals("TR", stanceInitials("  Tomás   de la  Ruiz "))
        assertEquals("?", stanceInitials(""))
    }
}

/** WCAG 2.2 contrast for the role pairs components rely on, in every theme. */
class ContrastTest {
    private data class Pair(val fg: (StanceColors) -> Color, val bg: (StanceColors) -> Color, val name: String, val min: Float)

    private val text = 4.5f
    private val boundary = 3f
    private val pairs = listOf(
        Pair({ it.fgDefault }, { it.bgCanvas }, "fgDefault on bgCanvas", text),
        Pair({ it.fgDefault }, { it.bgSurface }, "fgDefault on bgSurface", text),
        Pair({ it.fgDefault }, { it.bgMuted }, "fgDefault on bgMuted", text),
        Pair({ it.fgMuted }, { it.bgCanvas }, "fgMuted on bgCanvas", text),
        Pair({ it.fgMuted }, { it.bgSurface }, "fgMuted on bgSurface", text),
        Pair({ it.fgSubtle }, { it.bgCanvas }, "fgSubtle on bgCanvas", text),
        Pair({ it.accentFg }, { it.accentBg }, "accentFg on accentBg", text),
        Pair({ it.fgInverse }, { it.bgInverse }, "fgInverse on bgInverse", text),
        Pair({ it.interactiveSelectedFg }, { it.interactiveSelected }, "selected fg on selected", text),
        Pair({ it.dangerFg }, { it.bgCanvas }, "dangerFg on bgCanvas", text),
        Pair({ it.dangerFg }, { it.dangerBg }, "dangerFg on dangerBg", text),
        Pair({ it.dangerOnSolid }, { it.dangerSolid }, "dangerOnSolid on dangerSolid", text),
        Pair({ it.successFg }, { it.successBg }, "successFg on successBg", text),
        Pair({ it.successOnSolid }, { it.successSolid }, "successOnSolid on successSolid", text),
        Pair({ it.warningFg }, { it.warningBg }, "warningFg on warningBg", text),
        Pair({ it.infoFg }, { it.infoBg }, "infoFg on infoBg", text),
        Pair({ it.borderControl }, { it.bgCanvas }, "borderControl on bgCanvas", boundary),
        Pair({ it.borderControl }, { it.bgSurface }, "borderControl on bgSurface", boundary),
        Pair({ it.focusRing }, { it.bgCanvas }, "focusRing on bgCanvas", boundary),
    )

    private fun check(theme: StanceThemeTokens, highContrast: Boolean) {
        val colors = StanceColors(theme.colors)
        for (pair in pairs) {
            val required = if (!highContrast) pair.min else if (pair.min == text) 7f else 4.5f
            val ratio = stanceContrastRatio(pair.fg(colors), pair.bg(colors))
            assertTrue(ratio >= required, "${theme.name}: ${pair.name} is ${"%.2f".format(ratio)}:1, needs $required:1")
        }
    }

    @Test fun lightMeetsAA() = check(StanceTokens.light, highContrast = false)

    @Test fun darkMeetsAA() = check(StanceTokens.dark, highContrast = false)

    @Test fun highContrastMeetsAAA() = check(StanceTokens.highContrast, highContrast = true)
}
