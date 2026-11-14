package com.bindshq.stance

import android.content.pm.ApplicationInfo
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.theme.StanceBrand
import com.bindshq.stance.theme.StanceBrandAccent
import com.bindshq.stance.theme.StanceBrandScope
import com.bindshq.stance.theme.StanceColors
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceBrandEngine
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLog
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertSame
import kotlin.test.assertTrue

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class BrandTest {
    @get:Rule
    val rule = createComposeRule()

    private val harbour = StanceBrand("Harbour", light = "#F2F8FF", dark = "#0A1A50", accent = "#FF5A36")
    private val harbourResolved = StanceBrandEngine.resolve(0xF2F8FF, 0x0A1A50, 0xFF5A36, 0xFF5A36)

    private fun expected(theme: StanceThemeTokens) = StanceColors(harbourResolved.applyTo(theme).colors)

    @Test
    fun bindsBrandIsTheDefaultPalette() {
        assertTrue(StanceBrand.Binds.isDefault)
        assertEquals(StanceBrand.Binds, StanceBrand("Binds", "#fcf6eb", "#140C2E"))
        for (theme in StanceTokens.allThemes) assertSame(theme, StanceBrand.Binds.themeTokens(theme))
        assertEquals(emptyList(), StanceBrand.Binds.contrastReport())

        var none: StanceColors? = null
        var binds: StanceColors? = null
        rule.setContent {
            Column {
                StanceTheme(tokens = StanceTokens.dark) { none = StanceTheme.colors }
                StanceTheme(tokens = StanceTokens.dark, brand = StanceBrand.Binds) { binds = StanceTheme.colors }
            }
        }
        rule.waitForIdle()
        assertEquals(StanceColors(StanceTokens.dark.colors), none)
        assertEquals(none, binds)
    }

    @Test
    fun constructorsAgree() {
        val fromHex = StanceBrand("Sage", "#F4F2EC", "#171D1A", accentLight = "#5E7361", accentDark = "#8FA892")
        val fromColor = StanceBrand(
            "Sage",
            light = Color(0xFFF4F2EC),
            dark = Color(0xFF171D1A),
            accent = StanceBrandAccent(light = Color(0xFF5E7361), dark = Color(0xFF8FA892)),
        )
        assertEquals(fromHex, fromColor)
        assertEquals(fromHex.hashCode(), fromColor.hashCode())
        assertEquals(StanceBrand("A", "#FFF", "#000", "#123456"), StanceBrand("A", Color.White, Color.Black, Color(0xFF123456)))
        assertNotEquals(StanceBrand("A", "#FFF", "#000"), StanceBrand("A", "#FFF", "#000", "#123456"))
    }

    @Test
    fun brandScopesToItsSubtree() {
        var outer: StanceColors? = null
        var inner: StanceColors? = null
        var after: StanceColors? = null
        var innerTokens: StanceThemeTokens? = null
        var innerBrand: StanceBrand? = null
        rule.setContent {
            StanceTheme(tokens = StanceTokens.light) {
                Column {
                    outer = StanceTheme.colors
                    StanceBrandScope(harbour) {
                        inner = StanceTheme.colors
                        innerTokens = StanceTheme.tokens
                        innerBrand = StanceTheme.brand
                    }
                    after = StanceTheme.colors
                }
            }
        }
        rule.waitForIdle()
        assertEquals(StanceColors(StanceTokens.light.colors), outer)
        assertEquals(outer, after)
        assertEquals(expected(StanceTokens.light), inner)
        assertEquals("light", innerTokens?.name)
        assertEquals(harbour, innerBrand)
    }

    @Test
    fun nestedDefaultScopeRestoresTheDefaultPalette() {
        var colors: StanceColors? = null
        rule.setContent {
            StanceTheme(tokens = StanceTokens.highContrast, brand = harbour) {
                StanceBrandScope(StanceBrand.Binds) { colors = StanceTheme.colors }
            }
        }
        rule.waitForIdle()
        assertEquals(StanceColors(StanceTokens.highContrast.colors), colors)
    }

    @Test
    fun componentsPickUpTheBrandInEveryTheme() {
        var theme by mutableStateOf(StanceTokens.light)
        var colors: StanceColors? = null
        var primary: Color? = null
        var highContrast: Boolean? = null
        rule.setContent {
            StanceTheme(tokens = theme, brand = harbour) {
                colors = StanceTheme.colors
                primary = MaterialTheme.colorScheme.primary
                highContrast = StanceTheme.isHighContrast
                StanceButton("Upgrade", onClick = {}, modifier = Modifier.testTag("button"))
            }
        }
        for (t in StanceTokens.allThemes) {
            theme = t
            rule.waitForIdle()
            val want = expected(t)
            assertNotEquals(StanceColors(t.colors).accentBg, want.accentBg, t.name)
            assertEquals(want, colors, t.name)
            assertEquals(want.accentBg, primary, t.name)
            assertEquals(t.name == "high-contrast", highContrast)
            val pixels = rule.onNodeWithTag("button").captureToImage().toPixelMap()
            val argb = buildSet { for (x in 0 until pixels.width) for (y in 0 until pixels.height) add(pixels[x, y].toArgb()) }
            assertTrue(want.accentBg.toArgb() in argb, "${t.name}: the button is not filled with the brand accent")
        }
    }

    @Test
    fun poorBrandLogsOnceInDebuggableApps() {
        val context = ApplicationProvider.getApplicationContext<android.app.Application>()
        context.applicationInfo.flags = context.applicationInfo.flags or ApplicationInfo.FLAG_DEBUGGABLE
        ShadowLog.clear()
        val poor = StanceBrand("Washed out ${System.nanoTime()}", "#FFFFFF", "#BBBBBB")
        assertTrue(poor.contrastReport().isNotEmpty())
        rule.setContent {
            Column {
                StanceTheme(tokens = StanceTokens.light, brand = StanceBrand.Binds) {}
                StanceTheme(tokens = StanceTokens.light, brand = harbour) {}
                StanceTheme(tokens = StanceTokens.light, brand = poor) {}
                StanceTheme(tokens = StanceTokens.dark, brand = poor) {}
            }
        }
        rule.waitForIdle()
        val logs = ShadowLog.getLogsForTag("Stance")
        assertEquals(1, logs.size, logs.joinToString { it.msg })
        assertTrue(logs.single().msg.contains("fg-default on bg-canvas"))
    }

    @Test
    fun releaseBuildsNeverLog() {
        val context = ApplicationProvider.getApplicationContext<android.app.Application>()
        context.applicationInfo.flags = context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE.inv()
        ShadowLog.clear()
        val poor = StanceBrand("Release ${System.nanoTime()}", "#FFFFFF", "#BBBBBB")
        rule.setContent { StanceTheme(tokens = StanceTokens.light, brand = poor) {} }
        rule.waitForIdle()
        assertEquals(0, ShadowLog.getLogsForTag("Stance").size)
    }
}
