package com.bindshq.stance.tokens

import java.io.File
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.fail

class StanceBrandEngineTest {
    private val fixture: Map<String, Any?> by lazy {
        val path = System.getProperty("stance.brandFixture")
            ?: "../../../packages/tokens/generated/json/brand-fixture.json"
        val file = File(path)
        assertTrue(file.isFile, "brand-fixture.json not found at ${file.absolutePath}; run npm run tokens")
        @Suppress("UNCHECKED_CAST")
        MiniJson(file.readText()).parse() as Map<String, Any?>
    }

    @Suppress("UNCHECKED_CAST")
    private val brands: List<Map<String, Any?>> get() = fixture["brands"] as List<Map<String, Any?>>

    @Suppress("UNCHECKED_CAST")
    private fun resolve(input: Map<String, Any?>): StanceResolvedBrand {
        val light = StanceBrandEngine.parseHex(input["light"] as String)
        val dark = StanceBrandEngine.parseHex(input["dark"] as String)
        return when (val accent = input["accent"]) {
            null -> StanceBrandEngine.resolve(light, dark)
            is String -> StanceBrandEngine.parseHex(accent).let { StanceBrandEngine.resolve(light, dark, it, it) }
            else -> (accent as Map<String, String>).let {
                StanceBrandEngine.resolve(light, dark, StanceBrandEngine.parseHex(it.getValue("light")), StanceBrandEngine.parseHex(it.getValue("dark")))
            }
        }
    }

    @Test
    fun everyFixtureRoleMatchesExactly() {
        assertEquals(listOf("Binds", "Harbour", "Sage", "Graphite"), brands.map { (it["brand"] as Map<*, *>)["name"] })
        var checked = 0
        val mismatches = mutableListOf<String>()
        for (entry in brands) {
            @Suppress("UNCHECKED_CAST")
            val input = entry["brand"] as Map<String, Any?>
            val resolved = resolve(input)
            @Suppress("UNCHECKED_CAST")
            val ink = entry["ink"] as Map<String, String>
            for ((step, hex) in ink) {
                val actual = StanceBrandEngine.toHex(resolved.ink.getValue(step.toInt()))
                if (actual != hex) mismatches += "${input["name"]} ink $step: $actual, expected $hex"
                checked++
            }
            @Suppress("UNCHECKED_CAST")
            val themes = entry["themes"] as Map<String, Map<String, Map<String, Any?>>>
            assertEquals(StanceBrandRecipe.allThemes.map { it.name }, themes.keys.toList())
            for ((theme, roles) in themes) {
                val actualRoles = resolved.themes.getValue(theme)
                assertEquals(roles.keys, actualRoles.keys, "${input["name"]} $theme roles")
                for ((role, expected) in roles) {
                    val actual = actualRoles.getValue(role)
                    val alpha = (expected["alpha"] as Number).toDouble()
                    if (actual.hex != expected["hex"] || actual.alpha != alpha) {
                        mismatches += "${input["name"]} $theme $role: ${actual.hex} ${actual.alpha}, expected ${expected["hex"]} $alpha"
                    }
                    checked++
                }
            }
            @Suppress("UNCHECKED_CAST")
            val failures = entry["contrastFailures"] as List<Any?>
            assertTrue(failures.isEmpty())
            assertEquals(emptyList(), resolved.contrastReport(), "${input["name"]} contrast report")
        }
        if (mismatches.isNotEmpty()) fail(mismatches.joinToString("\n"))
        // 4 brands × (15 ink steps + 3 themes × 60 roles).
        assertEquals(4 * (15 + 3 * 60), checked)
    }

    @Test
    fun bindsPairReproducesThePublishedTokens() {
        val resolved = StanceBrandEngine.resolve(StanceBrandRecipe.bindsLight, StanceBrandRecipe.bindsDark)
        val published = listOf(StanceTokens.light, StanceTokens.dark, StanceTokens.highContrast)
        for (theme in published) {
            val expected = theme.colors.asMap()
            val actual = resolved.colors(theme.name).asMap()
            val recipe = StanceBrandRecipe.allThemes.first { it.name == theme.name }
            for (entry in recipe.roles) {
                val e = expected.getValue(entry.property)
                val a = actual.getValue(entry.property)
                if (entry.recipe is StanceRoleRecipe.Derive) {
                    // The spec allows 1/255 per channel for derived literals.
                    for (shift in listOf(24, 16, 8, 0)) {
                        val d = abs(((e shr shift) and 0xFF) - ((a shr shift) and 0xFF))
                        assertTrue(d <= 1, "${theme.name} ${entry.role}: ${a.toString(16)} vs ${e.toString(16)}")
                    }
                } else {
                    assertEquals(e, a, "${theme.name} ${entry.role}")
                }
            }
        }
        val ink = StanceTokens.Ink
        val publishedInk = listOf(ink.ink0, ink.ink25, ink.ink50, ink.ink100, ink.ink150, ink.ink200, ink.ink300, ink.ink400, ink.ink500, ink.ink600, ink.ink700, ink.ink800, ink.ink900, ink.ink950, ink.ink1000)
        assertEquals(publishedInk.map { (it and 0xFFFFFF).toInt() }, StanceBrandRecipe.ink.map { resolved.ink.getValue(it.step) })
        assertEquals(emptyList(), resolved.contrastReport())
    }

    @Test
    fun awkwardAccentsAreFittedWithoutContrastFailures() {
        val pairs = listOf(
            0xFCF6EB to 0x140C2E,
            0xF2F8FF to 0x0A1A50,
            0xFFFFFF to 0x000000,
        )
        for ((light, dark) in pairs) {
            for (accent in listOf(0x7A7A7A, 0xFFFF00, 0x000000, 0xFFFFFF, light, dark)) {
                val resolved = StanceBrandEngine.resolve(light, dark, accent, accent)
                assertEquals(emptyList(), resolved.contrastReport(), "accent ${StanceBrandEngine.toHex(accent)} on ${StanceBrandEngine.toHex(light)}/${StanceBrandEngine.toHex(dark)}")
            }
        }
    }

    @Test
    fun poorPairIsReported() {
        val report = StanceBrandEngine.resolve(0xFFFFFF, 0xBBBBBB).contrastReport()
        assertTrue(report.any { it.theme == "light" && it.fg == "fg-default" && it.bg == "bg-canvas" && it.ratio < 4.5 })
        assertTrue(report.first().toString().contains(":1, needs "))
    }

    @Test
    fun colourMathsBasics() {
        assertEquals(0xFCF6EB, StanceBrandEngine.parseHex("#fcf6eb"))
        assertEquals(0xAABBCC, StanceBrandEngine.parseHex("abc"))
        assertEquals("#0A1A50", StanceBrandEngine.toHex(0x0A1A50))
        assertEquals(21.0, StanceBrandEngine.contrast(0xFFFFFF, 0x000000), 1e-9)
        assertEquals(0x123456, StanceBrandEngine.mix(0x123456, 0xFFFFFF, 0.0))
        assertEquals(0xFFFFFF, StanceBrandEngine.mix(0x123456, 0xFFFFFF, 1.0))
        assertEquals(1.0, StanceBrandEngine.roundHalfUp(0.5))
        assertEquals(0.0, StanceBrandEngine.roundHalfUp(0.49999999999999994))
        assertEquals(122L, StanceBrandColor(0, 0.48).argb ushr 24)
    }

    private fun StanceColorTokens.asMap(): Map<String, Long> {
        val values = mutableMapOf<String, Long>()
        for (entry in StanceBrandRecipe.light.roles) {
            val getter = StanceColorTokens::class.java.getMethod("get" + entry.property.replaceFirstChar { it.uppercase() })
            values[entry.property] = getter.invoke(this) as Long
        }
        return values
    }
}

/** A small JSON reader for the fixture, so the tests need no extra library. */
private class MiniJson(private val s: String) {
    private var i = 0

    fun parse(): Any? = value().also { ws(); check(i == s.length) { "Trailing JSON at $i" } }

    private fun ws() {
        while (i < s.length && s[i].isWhitespace()) i++
    }

    private fun value(): Any? {
        ws()
        return when (val c = s[i]) {
            '{' -> obj()
            '[' -> arr()
            '"' -> str()
            't' -> lit("true", true)
            'f' -> lit("false", false)
            'n' -> lit("null", null)
            else -> if (c == '-' || c.isDigit()) num() else error("Unexpected '$c' at $i")
        }
    }

    private fun lit(word: String, v: Any?): Any? {
        check(s.startsWith(word, i)); i += word.length; return v
    }

    private fun num(): Double {
        val start = i
        while (i < s.length && (s[i].isDigit() || s[i] in "+-.eE")) i++
        return s.substring(start, i).toDouble()
    }

    private fun str(): String {
        val sb = StringBuilder()
        i++
        while (s[i] != '"') {
            if (s[i] == '\\') {
                i++
                when (val e = s[i]) {
                    'n' -> sb.append('\n')
                    't' -> sb.append('\t')
                    'r' -> sb.append('\r')
                    'b' -> sb.append('\b')
                    'f' -> sb.append('\u000C')
                    'u' -> { sb.append(s.substring(i + 1, i + 5).toInt(16).toChar()); i += 4 }
                    else -> sb.append(e)
                }
            } else {
                sb.append(s[i])
            }
            i++
        }
        i++
        return sb.toString()
    }

    private fun arr(): List<Any?> {
        val out = mutableListOf<Any?>()
        i++
        ws()
        if (s[i] == ']') { i++; return out }
        while (true) {
            out += value(); ws()
            if (s[i++] == ']') return out
        }
    }

    private fun obj(): Map<String, Any?> {
        val out = LinkedHashMap<String, Any?>()
        i++
        ws()
        if (s[i] == '}') { i++; return out }
        while (true) {
            ws()
            val k = str(); ws(); check(s[i++] == ':')
            out[k] = value(); ws()
            if (s[i++] == '}') return out
        }
    }
}
