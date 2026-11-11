package com.bindshq.stance.tokens

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class StanceTokensTest {
    @Test
    fun brandColoursAreTheOfficialBindsValues() {
        assertEquals(0xFFFCF6EB, StanceTokens.Brand.ivory)
        assertEquals(0xFF140C2E, StanceTokens.Brand.indigo)
    }

    @Test
    fun lightAndDarkAreBuiltOnTheBrandColours() {
        assertEquals(StanceTokens.Brand.ivory, StanceTokens.light.colors.bgCanvas)
        assertEquals(StanceTokens.Brand.indigo, StanceTokens.light.colors.fgDefault)
        assertEquals(StanceTokens.Brand.indigo, StanceTokens.dark.colors.bgCanvas)
        assertEquals(StanceTokens.Brand.ivory, StanceTokens.dark.colors.fgDefault)
    }

    @Test
    fun thereAreThreeNamedThemes() {
        assertEquals(listOf("light", "dark", "high-contrast"), StanceTokens.allThemes.map { it.name })
        assertTrue(StanceTokens.dark.isDark)
        assertTrue(!StanceTokens.light.isDark && !StanceTokens.highContrast.isDark)
    }

    @Test
    fun spacingFollowsTheFourPointGrid() {
        assertEquals(4f, StanceTokens.Space.space1)
        assertEquals(16f, StanceTokens.Space.space4)
        assertEquals(48f, StanceTokens.TouchTarget.android)
    }

    @Test
    fun highContrastUsesStrongerFocusAndBorders() {
        assertTrue(StanceTokens.highContrast.focusWidth > StanceTokens.light.focusWidth)
        assertTrue(StanceTokens.highContrast.controlBorderWidth > StanceTokens.light.controlBorderWidth)
    }
}
