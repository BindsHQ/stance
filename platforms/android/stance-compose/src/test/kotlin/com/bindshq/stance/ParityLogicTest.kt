package com.bindshq.stance

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import com.bindshq.stance.components.advanced.stanceDragTarget
import com.bindshq.stance.components.advanced.stanceMove
import com.bindshq.stance.components.data.StanceAccordionMode
import com.bindshq.stance.components.data.StanceMarkdownBlock
import com.bindshq.stance.components.data.StanceMarkdownStyles
import com.bindshq.stance.components.data.StanceTreeNode
import com.bindshq.stance.components.data.stanceAccordionToggle
import com.bindshq.stance.components.data.stanceCodeLines
import com.bindshq.stance.components.data.stanceInlineMarkdown
import com.bindshq.stance.components.data.stanceNiceMax
import com.bindshq.stance.components.data.stanceParseMarkdown
import com.bindshq.stance.components.data.stanceToggleTreeNode
import com.bindshq.stance.components.data.stanceVisibleTreeRows
import com.bindshq.stance.components.forms.StanceCheckboxOption
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.components.forms.stanceClampNumber
import com.bindshq.stance.components.forms.stanceFilterOptions
import com.bindshq.stance.components.forms.stanceInlineEditCommit
import com.bindshq.stance.components.forms.stanceIsSelectableDay
import com.bindshq.stance.components.forms.stanceLabelContains
import com.bindshq.stance.components.forms.stanceParseNumber
import com.bindshq.stance.components.forms.stancePrecisionOf
import com.bindshq.stance.components.forms.stanceSanitizePin
import com.bindshq.stance.components.forms.stanceSelectAllState
import com.bindshq.stance.components.forms.stanceStepNumber
import com.bindshq.stance.components.forms.stanceToggleAll
import com.bindshq.stance.components.navigation.stancePaginationRange
import java.util.Locale
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** The pure logic behind the native parity components. */
class ParityLogicTest {
    private val teams = listOf(
        StanceSelectOption("sales", "Sales"),
        StanceSelectOption("legal", "Legal"),
        StanceSelectOption("finance", "Finance"),
        StanceSelectOption("people", "People and culture"),
    )

    @Test
    fun comboboxFilterMatchesLabelsIgnoringCase() {
        assertEquals(listOf("legal"), stanceFilterOptions(teams, "LEG", ::stanceLabelContains).map { it.value })
        assertEquals(listOf("finance", "people"), stanceFilterOptions(teams, "n", ::stanceLabelContains).map { it.value })
        assertEquals(teams, stanceFilterOptions(teams, "  ", ::stanceLabelContains), "a blank query shows everything")
        assertEquals(emptyList(), stanceFilterOptions(teams, "zz", ::stanceLabelContains))
    }

    @Test
    fun comboboxWithoutFilterShowsEveryOptionForServerSearch() {
        assertEquals(teams, stanceFilterOptions(teams, "leg", null))
        val startsWith: (StanceSelectOption<String>, String) -> Boolean = { option, query -> option.label.startsWith(query) }
        assertEquals(listOf("people"), stanceFilterOptions(teams, "Peo", startsWith).map { it.value })
    }

    @Test
    fun multiSelectSearchTrimsTheQuery() {
        assertEquals(listOf("people"), stanceFilterOptions(teams, " culture ", ::stanceLabelContains).map { it.value })
    }

    @Test
    fun numberFieldStepsAndStopsAtItsBounds() {
        assertEquals(10.0, stanceStepNumber(9.0, 1, 1.0, 0.0, 10.0, 0))
        assertEquals(10.0, stanceStepNumber(10.0, 1, 1.0, 0.0, 10.0, 0), "the maximum holds")
        assertEquals(0.0, stanceStepNumber(0.0, -1, 1.0, 0.0, 10.0, 0), "the minimum holds")
        assertEquals(5.0, stanceStepNumber(null, 1, 1.0, 5.0, 10.0, 0), "an empty field starts at the minimum")
        assertEquals(0.0, stanceStepNumber(null, -1, 1.0, null, null, 0), "or at zero without one")
        assertEquals(0.3, stanceStepNumber(0.2, 1, 0.1, null, null, 1), "decimal steps do not drift")
    }

    @Test
    fun numberFieldRoundsAndClamps() {
        assertEquals(2, stancePrecisionOf(0.05))
        assertEquals(0, stancePrecisionOf(1.0))
        assertEquals(1.24, stanceClampNumber(1.2449, null, null, 2))
        assertEquals(100.0, stanceClampNumber(250.0, 0.0, 100.0, 0))
        assertEquals(-5.0, stanceClampNumber(-12.0, -5.0, null, 0))
    }

    @Test
    fun numberFieldReadsLocalisedInput() {
        assertEquals(1.5, stanceParseNumber("1,5", Locale.forLanguageTag("es")))
        assertEquals(1.5, stanceParseNumber("1.5", Locale.forLanguageTag("es")), "a point is accepted everywhere")
        assertEquals(1234.0, stanceParseNumber("€ 1234", Locale.UK))
        assertEquals(-3.0, stanceParseNumber("-3", Locale.UK))
        assertEquals(42.0, stanceParseNumber("٤٢", Locale.forLanguageTag("ar")), "Arabic Indic digits")
        assertNull(stanceParseNumber("", Locale.UK))
        assertNull(stanceParseNumber("abc", Locale.UK))
    }

    @Test
    fun pinFieldKeepsAllowedCharactersUpToItsLength() {
        assertEquals("123456", stanceSanitizePin("123-456", 6, numeric = true), "a pasted code with a separator")
        assertEquals("123456", stanceSanitizePin("Your code is 123 456", 6, numeric = true))
        assertEquals("1234", stanceSanitizePin("123456", 4, numeric = true), "extra characters are dropped")
        assertEquals("AB12", stanceSanitizePin("ab-12", 6, numeric = false), "letters are upper cased")
        assertEquals("", stanceSanitizePin("abc", 6, numeric = true))
    }

    @Test
    fun treeShowsChildrenOfExpandedNodesOnly() {
        val tree = listOf(
            StanceTreeNode("src", "src", listOf(StanceTreeNode("main", "main", listOf(StanceTreeNode("app", "App.kt"))), StanceTreeNode("test", "test"))),
            StanceTreeNode("readme", "README.md"),
        )
        assertEquals(listOf("src", "readme"), stanceVisibleTreeRows(tree, emptySet()).map { it.node.id })
        val open = stanceVisibleTreeRows(tree, setOf("src"))
        assertEquals(listOf("src", "main", "test", "readme"), open.map { it.node.id })
        assertEquals(listOf(0, 1, 1, 0), open.map { it.level })
        assertEquals(
            listOf("src", "main", "app", "test", "readme"),
            stanceVisibleTreeRows(tree, setOf("src", "main")).map { it.node.id },
        )
        assertEquals(listOf("src", "readme"), stanceVisibleTreeRows(tree, setOf("main")).map { it.node.id }, "a hidden open node stays hidden")
        assertEquals(setOf("src", "main"), stanceToggleTreeNode(setOf("src"), "main"))
        assertEquals(setOf("main"), stanceToggleTreeNode(setOf("src", "main"), "src"))
    }

    @Test
    fun sortableMoveReordersAndIgnoresInvalidIndexes() {
        val list = listOf("a", "b", "c", "d")
        assertEquals(listOf("b", "a", "c", "d"), list.stanceMove(0, 1))
        assertEquals(listOf("d", "a", "b", "c"), list.stanceMove(3, 0))
        assertEquals(list, list.stanceMove(0, 4))
        assertEquals(list, list.stanceMove(-1, 2))
    }

    @Test
    fun sortableDragMovesPastTheMiddleOfANeighbour() {
        val offsets = mapOf(0 to 0, 1 to 100, 2 to 200)
        val sizes = mapOf(0 to 100, 1 to 100, 2 to 100)
        assertNull(stanceDragTarget(1, 40f, offsets, sizes), "not past the middle yet")
        assertEquals(2, stanceDragTarget(1, 60f, offsets, sizes))
        assertEquals(0, stanceDragTarget(1, -60f, offsets, sizes))
        assertNull(stanceDragTarget(2, 80f, offsets, sizes), "the last row has nowhere further to go")
    }

    @Test
    fun paginationRangeMatchesTheWeb() {
        assertEquals((1..7).toList(), stancePaginationRange(4, 7))
        assertEquals(listOf(1, 2, 3, 4, 5, null, 10), stancePaginationRange(1, 10))
        assertEquals(listOf(1, null, 4, 5, 6, null, 10), stancePaginationRange(5, 10))
        assertEquals(listOf(1, null, 6, 7, 8, 9, 10), stancePaginationRange(10, 10))
        assertEquals(listOf(1, null, 6, 7, 8, 9, 10), stancePaginationRange(99, 10), "out of range pages are clamped")
        assertEquals(emptyList(), stancePaginationRange(1, 0))
        // The number of slots never changes as the page moves.
        assertEquals(setOf(7), (1..20).map { stancePaginationRange(it, 20).size }.toSet())
    }

    private val styles = StanceMarkdownStyles(SpanStyle(color = Color.Gray), TextLinkStyles(SpanStyle(color = Color.Blue)))

    @Test
    fun markdownBlocksMapToTheirKinds() {
        val blocks = stanceParseMarkdown(
            """
            # Rollout
            Signatures deploy **tonight**.
            Second line of the same paragraph.

            - Sales
            - Legal

            3. Draft
            4. Review

            > Keep the legal footer.

            ```kotlin
            val x = 1
            ```
            ---
            """.trimIndent(),
        )
        assertEquals(
            listOf(
                StanceMarkdownBlock.Heading(1, "Rollout"),
                StanceMarkdownBlock.Paragraph("Signatures deploy **tonight**. Second line of the same paragraph."),
                StanceMarkdownBlock.BulletList(listOf("Sales", "Legal")),
                StanceMarkdownBlock.OrderedList(3, listOf("Draft", "Review")),
                StanceMarkdownBlock.Quote("Keep the legal footer."),
                StanceMarkdownBlock.Code("val x = 1", "kotlin"),
                StanceMarkdownBlock.Rule,
            ),
            blocks,
        )
    }

    @Test
    fun inlineMarkdownMapsToSpansAndLinks() {
        val text = stanceInlineMarkdown("Read **the guide** and *try* `stance` at [the site](https://www.stanceui.com).", styles)
        assertEquals("Read the guide and try stance at the site.", text.text)
        val bold = text.spanStyles.single { it.item.fontWeight == FontWeight.SemiBold }
        assertEquals("the guide", text.text.substring(bold.start, bold.end))
        val italic = text.spanStyles.single { it.item.fontStyle == FontStyle.Italic }
        assertEquals("try", text.text.substring(italic.start, italic.end))
        val code = text.spanStyles.single { it.item == styles.code }
        assertEquals("stance", text.text.substring(code.start, code.end))
        val link = text.getLinkAnnotations(0, text.length).single()
        assertEquals("https://www.stanceui.com", (link.item as LinkAnnotation.Url).url)
        assertEquals("the site", text.text.substring(link.start, link.end))
    }

    @Test
    fun inlineMarkdownKeepsUnclosedMarkersAndEscapes() {
        assertEquals("2 * 3 = 6", stanceInlineMarkdown("2 * 3 = 6", styles).text)
        assertEquals("file_name_here", stanceInlineMarkdown("file_name_here", styles).text, "underscores inside words are not emphasis")
        assertEquals("*literal*", stanceInlineMarkdown("\\*literal\\*", styles).text)
        assertEquals("<b>raw</b>", stanceInlineMarkdown("<b>raw</b>", styles).text, "HTML stays text")
    }

    @Test
    fun chartAxisRoundsUpToANiceValue() {
        assertEquals(50f, stanceNiceMax(48f))
        assertEquals(100f, stanceNiceMax(100f))
        assertEquals(150f, stanceNiceMax(101f))
        assertEquals(60f, stanceNiceMax(55f))
        assertEquals(2.5f, stanceNiceMax(2.3f))
        assertEquals(1f, stanceNiceMax(0f))
    }

    @Test
    fun accordionSingleKeepsOneOpenAndMultipleKeepsMany() {
        assertEquals(setOf("b"), stanceAccordionToggle(setOf("a"), "b", StanceAccordionMode.Single))
        assertEquals(emptySet(), stanceAccordionToggle(setOf("a"), "a", StanceAccordionMode.Single))
        assertEquals(setOf("a"), stanceAccordionToggle(setOf("a"), "a", StanceAccordionMode.Single, collapsible = false))
        assertEquals(setOf("a", "b"), stanceAccordionToggle(setOf("a"), "b", StanceAccordionMode.Multiple))
        assertEquals(setOf("b"), stanceAccordionToggle(setOf("a", "b"), "a", StanceAccordionMode.Multiple))
    }

    @Test
    fun selectAllIsMixedOnAndOffAndSkipsDisabledOptions() {
        val options = listOf(StanceCheckboxOption(1, "One"), StanceCheckboxOption(2, "Two"), StanceCheckboxOption(3, "Three", enabled = false))
        assertEquals(ToggleableState.Off, stanceSelectAllState(options, emptySet()))
        assertEquals(ToggleableState.Indeterminate, stanceSelectAllState(options, setOf(1)))
        assertEquals(ToggleableState.On, stanceSelectAllState(options, setOf(1, 2)))
        assertEquals(setOf(1, 2), stanceToggleAll(options, setOf(1)))
        assertEquals(setOf(3), stanceToggleAll(options, setOf(1, 2, 3)), "a disabled option keeps its state")
    }

    @Test
    fun inlineEditTrimsAndValidates() {
        assertEquals("Sales", stanceInlineEditCommit("  Sales ", trim = true, validate = null).value)
        val rejected = stanceInlineEditCommit(" ", trim = true) { if (it.isEmpty()) "Enter a name" else null }
        assertNull(rejected.value)
        assertEquals("Enter a name", rejected.error)
    }

    @Test
    fun calendarHonoursBoundsAndRules() {
        val day = 86_400_000L
        assertTrue(stanceIsSelectableDay(5 * day, 1 * day, 10 * day) { true })
        assertTrue(!stanceIsSelectableDay(0, 1 * day, 10 * day) { true })
        assertTrue(!stanceIsSelectableDay(11 * day, null, 10 * day) { true })
        assertTrue(!stanceIsSelectableDay(5 * day, null, null) { it != 5 * day })
    }

    @Test
    fun codeLinesIgnoreATrailingBreak() {
        assertEquals(listOf("a", "b"), stanceCodeLines("a\nb\n"))
        assertEquals(listOf(""), stanceCodeLines(""))
    }
}
