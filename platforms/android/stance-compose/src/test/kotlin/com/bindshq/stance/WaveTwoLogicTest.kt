package com.bindshq.stance

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.advanced.stanceAutoScrollSpeed
import com.bindshq.stance.components.advanced.stanceDragAlongList
import com.bindshq.stance.components.advanced.stanceDragTarget
import com.bindshq.stance.components.advanced.stanceMove
import com.bindshq.stance.components.ai.StanceDiffDecision
import com.bindshq.stance.components.ai.StanceDiffFile
import com.bindshq.stance.components.ai.StanceDiffHunk
import com.bindshq.stance.components.ai.StanceDiffLine
import com.bindshq.stance.components.ai.StanceDiffLineKind
import com.bindshq.stance.components.ai.StanceGhostTextTransformation
import com.bindshq.stance.components.ai.StanceLogEntry
import com.bindshq.stance.components.ai.StanceLogLevel
import com.bindshq.stance.components.ai.StancePermission
import com.bindshq.stance.components.ai.StancePlanItem
import com.bindshq.stance.components.ai.StanceRewriteAction
import com.bindshq.stance.components.ai.StanceRiskLevel
import com.bindshq.stance.components.ai.StanceStepStatus
import com.bindshq.stance.components.ai.StanceSubagent
import com.bindshq.stance.components.ai.StanceTableSort
import com.bindshq.stance.components.ai.icon
import com.bindshq.stance.components.ai.stanceAllowVariant
import com.bindshq.stance.components.ai.stanceCitationIndexes
import com.bindshq.stance.components.ai.stanceCountdownTick
import com.bindshq.stance.components.ai.stanceDenyVariant
import com.bindshq.stance.components.ai.stanceDiffCounts
import com.bindshq.stance.components.ai.stanceDiffDecide
import com.bindshq.stance.components.ai.stanceDiffDecideAll
import com.bindshq.stance.components.ai.stanceDiffPrefix
import com.bindshq.stance.components.ai.stanceDiffSplitRows
import com.bindshq.stance.components.ai.stanceFilterLog
import com.bindshq.stance.components.ai.stanceHighlightRanges
import com.bindshq.stance.components.ai.stanceLogLine
import com.bindshq.stance.components.ai.stanceNextSort
import com.bindshq.stance.components.ai.stancePlanProgress
import com.bindshq.stance.components.ai.stanceRewriteItems
import com.bindshq.stance.components.ai.stanceSafeImage
import com.bindshq.stance.components.ai.stanceSetPermission
import com.bindshq.stance.components.ai.stanceSortRows
import com.bindshq.stance.components.ai.stanceSplitRatio
import com.bindshq.stance.components.ai.stanceSubagentNodes
import com.bindshq.stance.components.ai.stanceSuggestionWord
import com.bindshq.stance.components.ai.stanceTableCsv
import com.bindshq.stance.components.ai.stanceToggleLogLevel
import com.bindshq.stance.components.ai.stepState
import com.bindshq.stance.components.data.StanceCodeStyles
import com.bindshq.stance.components.data.StanceCodeToken
import com.bindshq.stance.components.data.StanceCodeTokenType
import com.bindshq.stance.components.data.StanceMarkdownBlock
import com.bindshq.stance.components.data.StanceMarkdownStyles
import com.bindshq.stance.components.data.StanceMarkdownTask
import com.bindshq.stance.components.data.stanceCanHighlight
import com.bindshq.stance.components.data.stanceHighlight
import com.bindshq.stance.components.data.stanceInlineMarkdown
import com.bindshq.stance.components.data.stanceLineStarts
import com.bindshq.stance.components.data.stanceParseMarkdown
import com.bindshq.stance.components.data.stanceSafeLink
import com.bindshq.stance.components.data.stanceStreamingMarkdown
import com.bindshq.stance.components.data.stanceTokenize
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.components.forms.stanceCustomValueCandidate
import com.bindshq.stance.components.forms.stanceInitialMonth
import com.bindshq.stance.components.forms.stanceShowsTodayMarker
import com.bindshq.stance.components.navigation.StanceStepState
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** The pure logic behind the closed gaps and the wave two AI components. */
class WaveTwoLogicTest {
    private val types = { code: String, language: String? -> stanceTokenize(code, language).map { it.type } }
    private fun token(code: String, language: String, value: String) = stanceTokenize(code, language).first { it.value == value }.type

    // ───────────── Highlight tokenizer ─────────────

    @Test
    fun tokenizerKnowsLanguagesAndPassesUnknownOnesThrough() {
        // The same two cases as the web test.
        assertTrue(StanceCodeTokenType.String in types("const a = 'x'", "ts"))
        assertEquals(listOf(StanceCodeToken(StanceCodeTokenType.Plain, "anything")), stanceTokenize("anything", "cobol"))
        assertEquals(listOf(StanceCodeToken(StanceCodeTokenType.Plain, "plain")), stanceTokenize("plain", null))
        assertTrue(stanceCanHighlight("TSX") && stanceCanHighlight("kotlin") && stanceCanHighlight("swift"))
        assertFalse(stanceCanHighlight("cobol") || stanceCanHighlight(null))
    }

    @Test
    fun tokensAlwaysJoinBackToTheCode() {
        val samples = mapOf(
            "tsx" to "import { Button } from '@bindshq/stance-react';\n\n// Primary action\nexport const Save = () => <Button>Save</Button>;\n",
            "css" to ".st-button { --st-gap: 4px; color: var(--st-fg); }\n@media (min-width: 600px) { a { margin: -1.5rem } }",
            "bash" to "npm install --save-dev @bindshq/stance-react # tokens\necho \"done\"",
            "json" to "{ \"name\": \"stance\", \"private\": true, \"version\": 1.5e3, \"tags\": [null] }",
            "kotlin" to "@Composable\nfun Greeting(name: String = \"\"\"raw\"\"\") { val n = 0xFF + 1_000L /* note */ }",
            "swift" to "#if DEBUG\nlet rate: Double = 2.5 // per second\n@State var open = false\n#endif",
            "html" to "<img src=x onerror=\"alert(1)\">",
        )
        for ((language, code) in samples) {
            assertEquals(code, stanceTokenize(code, language).joinToString("") { it.value }, language)
        }
    }

    @Test
    fun javascriptTokensMatchTheWebRules() {
        val code = "export const Save = () => <Button size=\"sm\">Save</Button>; // done"
        assertEquals(StanceCodeTokenType.Keyword, token(code, "tsx", "export"))
        assertEquals(StanceCodeTokenType.Keyword, token(code, "tsx", "const"))
        assertEquals(StanceCodeTokenType.Tag, token(code, "tsx", "<Button"))
        assertEquals(StanceCodeTokenType.Tag, token(code, "tsx", "</Button"))
        assertEquals(StanceCodeTokenType.Attr, token(code, "tsx", "size"))
        assertEquals(StanceCodeTokenType.String, token(code, "tsx", "\"sm\""))
        assertEquals(StanceCodeTokenType.Comment, token(code, "tsx", "// done"))
        assertEquals(StanceCodeTokenType.Fn, token("render(<App />, 42)", "js", "render"))
        assertEquals(StanceCodeTokenType.Number, token("render(<App />, 42)", "js", "42"))
        // A keyword inside a longer word stays plain, and whitespace joins the plain run before it.
        assertEquals(listOf(StanceCodeTokenType.Plain), types("offset  classes", "js"))
        assertEquals(StanceCodeTokenType.Punct, token("a => b", "js", "=>"))
    }

    @Test
    fun cssBashAndJsonTokensMatchTheWebRules() {
        assertEquals(StanceCodeTokenType.Prop, token("a { --st-gap: 4px }", "css", "--st-gap"))
        assertEquals(StanceCodeTokenType.Number, token("a { --st-gap: 4px }", "css", "4px"))
        assertEquals(StanceCodeTokenType.Keyword, token("@media (x) {}", "css", "@media"))
        assertEquals(StanceCodeTokenType.Fn, token("a { color: var(--x) }", "css", "var"))
        assertEquals(StanceCodeTokenType.Tag, token(".st-button {}", "css", ".st-button"))

        assertEquals(StanceCodeTokenType.Keyword, token("npm install --save x # go", "bash", "npm"))
        assertEquals(StanceCodeTokenType.Attr, token("npm install --save x # go", "bash", "--save"))
        assertEquals(StanceCodeTokenType.Comment, token("npm install --save x # go", "sh", "# go"))
        assertEquals(StanceCodeTokenType.Plain, token("npmrc", "bash", "npmrc"))

        assertEquals(StanceCodeTokenType.Prop, token("{ \"name\": \"stance\", \"n\": -1.5 }", "json", "\"name\""))
        assertEquals(StanceCodeTokenType.String, token("{ \"name\": \"stance\", \"n\": -1.5 }", "json", "\"stance\""))
        assertEquals(StanceCodeTokenType.Number, token("{ \"name\": \"stance\", \"n\": -1.5 }", "json", "-1.5"))
        assertEquals(StanceCodeTokenType.Keyword, token("[true, null]", "json", "null"))
    }

    @Test
    fun kotlinAndSwiftAreHighlighted() {
        val kotlin = "@Composable\nfun Greeting(name: String) { val n = 0xFF // note\n return \"\"\"hi\"\"\" }"
        assertEquals(StanceCodeTokenType.Attr, token(kotlin, "kotlin", "@Composable"))
        assertEquals(StanceCodeTokenType.Keyword, token(kotlin, "kt", "fun"))
        assertEquals(StanceCodeTokenType.Fn, token(kotlin, "kotlin", "Greeting"))
        assertEquals(StanceCodeTokenType.Number, token(kotlin, "kotlin", "0xFF"))
        assertEquals(StanceCodeTokenType.Comment, token(kotlin, "kts", "// note"))
        assertEquals(StanceCodeTokenType.String, token(kotlin, "kotlin", "\"\"\"hi\"\"\""))
        val swift = "@State var open = false\nguard let rate = 2.5 else { return }"
        assertEquals(StanceCodeTokenType.Attr, token(swift, "swift", "@State"))
        assertEquals(StanceCodeTokenType.Keyword, token(swift, "swift", "guard"))
        assertEquals(StanceCodeTokenType.Number, token(swift, "swift", "2.5"))
        assertEquals(StanceCodeTokenType.Keyword, token(swift, "swift", "false"))
    }

    @Test
    fun highlightingKeepsTheTextAndStylesByInkWeightAndSlant() {
        val ink = Color.Black
        val styles = StanceCodeStyles(
            comment = SpanStyle(color = ink, fontStyle = FontStyle.Italic),
            string = SpanStyle(color = ink),
            keyword = SpanStyle(color = ink, fontWeight = FontWeight.SemiBold),
            number = SpanStyle(color = ink),
            tag = SpanStyle(color = ink),
            attr = SpanStyle(color = ink),
            punct = SpanStyle(color = ink),
            fn = SpanStyle(color = ink),
            prop = SpanStyle(color = ink),
        )
        val code = "const a = 1 // one"
        val text = stanceHighlight(code, "js", styles)
        assertEquals(code, text.text, "selection and copy see exactly the code")
        val keyword = text.spanStyles.first { it.start == 0 }
        assertEquals(5, keyword.end)
        assertEquals(FontWeight.SemiBold, keyword.item.fontWeight)
        assertEquals(FontStyle.Italic, text.spanStyles.last().item.fontStyle)
        assertTrue(stanceHighlight(code, "cobol", styles).spanStyles.isEmpty())
        assertEquals(listOf(0, 4, 5), stanceLineStarts("abc\n\nd"))
    }

    // ───────────── Markdown ─────────────

    @Test
    fun markdownReadsTaskListsTablesAndImages() {
        val blocks = stanceParseMarkdown(
            "# Plan\n- [x] Draft\n- [ ] Review\n- plain\n\n| Team | Seats |\n| --- | ---: |\n| Sales | 12 |\n| Legal |\n\n![A chart](https://example.com/c.png)",
        )
        assertEquals(StanceMarkdownBlock.Heading(1, "Plan"), blocks[0])
        assertEquals(StanceMarkdownBlock.TaskList(listOf(StanceMarkdownTask(true, "Draft"), StanceMarkdownTask(false, "Review"))), blocks[1])
        assertEquals(StanceMarkdownBlock.BulletList(listOf("plain")), blocks[2])
        assertEquals(
            StanceMarkdownBlock.Table(listOf("Team", "Seats"), listOf(false, true), listOf(listOf("Sales", "12"), listOf("Legal", ""))),
            blocks[3],
        )
        assertEquals(StanceMarkdownBlock.Image("A chart", "https://example.com/c.png"), blocks[4])
        assertEquals(5, blocks.size)
    }

    @Test
    fun aLineWithPipesIsOnlyATableWithARuleUnderIt() {
        assertEquals(listOf(StanceMarkdownBlock.Paragraph("a | b")), stanceParseMarkdown("a | b"))
        assertEquals(listOf(StanceMarkdownBlock.Paragraph("a | b c | d")), stanceParseMarkdown("a | b\nc | d"))
    }

    @Test
    fun everyStreamingPrefixParsesWithoutHalfConstructs() {
        val document = "## Result\nIt is **done** and `safe`, see [the guide](https://www.stanceui.com).\n\n" +
            "| Team | Seats |\n| --- | --- |\n| Sales | 12 |\n\n```kotlin\nval a = 1\n```\n- [x] Checked"
        val styles = StanceMarkdownStyles(SpanStyle(), TextLinkStyles())
        for (end in 0..document.length) {
            val shown = stanceStreamingMarkdown(document.substring(0, end))
            for (block in stanceParseMarkdown(shown)) {
                val text = when (block) {
                    is StanceMarkdownBlock.Paragraph -> stanceInlineMarkdown(block.text, styles).text
                    is StanceMarkdownBlock.Heading -> stanceInlineMarkdown(block.text, styles).text
                    else -> ""
                }
                assertFalse("**" in text || "](" in text || "`" in text || text.startsWith("|"), "prefix $end shows a half construct: $text")
            }
        }
        // Complete text is left alone, also when it ends on the line that closes a fence.
        assertEquals(document, stanceStreamingMarkdown(document))
        val closed = "```bash\nnpm test\n```"
        assertEquals(closed, stanceStreamingMarkdown(closed))
        assertEquals(listOf(StanceMarkdownBlock.Code("npm test", "bash")), stanceParseMarkdown(stanceStreamingMarkdown(closed)))
    }

    @Test
    fun streamingHoldsBackOpenMarkersLinksAndTables() {
        assertEquals("It is done", stanceStreamingMarkdown("It is **done"))
        assertEquals("It is **done** and ", stanceStreamingMarkdown("It is **done** and *"))
        assertEquals("see the guide", stanceStreamingMarkdown("see [the guide](https://www.stance"))
        assertEquals("see the gui", stanceStreamingMarkdown("see [the gui"))
        assertEquals("run npm", stanceStreamingMarkdown("run `npm"))
        assertEquals("* a bullet", stanceStreamingMarkdown("* a bullet"))
        assertEquals("Intro", stanceStreamingMarkdown("Intro\n| Team | Seats |"))
        assertEquals("Intro", stanceStreamingMarkdown("Intro\n| Team | Seats |\n| --"))
        assertEquals("| A | B |\n| --- | --- |", stanceStreamingMarkdown("| A | B |\n| --- | --- |"))
        // An open code fence is already code: nothing inside it is touched.
        val fenced = "```kotlin\nval a = \"**x"
        assertEquals(fenced, stanceStreamingMarkdown(fenced))
        assertEquals(listOf(StanceMarkdownBlock.Code("val a = \"**x", "kotlin")), stanceParseMarkdown(fenced))
    }

    @Test
    fun onlyHttpHttpsAndMailtoLinksAreOpened() {
        assertEquals("https://www.stanceui.com", stanceSafeLink(" https://www.stanceui.com "))
        assertEquals("HTTP://example.com", stanceSafeLink("HTTP://example.com"))
        assertEquals("mailto:hello@binds.si", stanceSafeLink("mailto:hello@binds.si"))
        for (unsafe in listOf("javascript:alert(1)", "JaVaScRiPt:alert(1)", "intent://x#Intent;end", "file:///etc/hosts", "content://sms", "data:text/html,x", "/relative", "java\nscript:x", "")) {
            assertNull(stanceSafeLink(unsafe), unsafe)
        }
        assertTrue(stanceSafeImage("https://example.com/a.png"))
        assertFalse(stanceSafeImage("mailto:a@b.c") || stanceSafeImage("file:///a.png"))

        val styles = StanceMarkdownStyles(SpanStyle(), TextLinkStyles())
        val allow = { url: String -> stanceSafeLink(url) != null }
        val unsafe = stanceInlineMarkdown("Tap [here](javascript:alert(1)) now", styles, allowLink = allow)
        assertTrue(unsafe.getLinkAnnotations(0, unsafe.length).isEmpty(), "an unsafe link keeps its words and loses its address")
        assertTrue(unsafe.text.startsWith("Tap here"))
        val safe = stanceInlineMarkdown("Read [the guide](https://www.stanceui.com)", styles, allowLink = allow)
        assertEquals("https://www.stanceui.com", (safe.getLinkAnnotations(0, safe.length).single().item as LinkAnnotation.Url).url)
        // An image inside a line shows as its description.
        assertEquals("See A chart here", stanceInlineMarkdown("See ![A chart](https://x.y/c.png) here", styles).text)
    }

    @Test
    fun citationsAreTheNumbersWithASource() {
        assertEquals(listOf(2, 1), stanceCitationIndexes("First [2], then [1] and [2] again, not [9] or [3](https://x.y).", setOf(1, 2, 3)))
        assertEquals(emptyList(), stanceCitationIndexes("No markers [x] here", setOf(1)))
    }

    // ───────────── Agents ─────────────

    @Test
    fun stepStatusMapsOntoTheStepperStates() {
        assertEquals(StanceStepState.Complete, StanceStepStatus.Complete.stepState())
        assertEquals(StanceStepState.Current, StanceStepStatus.Running.stepState())
        assertEquals(StanceStepState.Current, StanceStepStatus.Waiting.stepState())
        assertEquals(StanceStepState.Error, StanceStepStatus.Error.stepState())
        assertEquals(StanceStepState.Upcoming, StanceStepStatus.Pending.stepState())
        assertEquals(StanceStepState.Upcoming, StanceStepStatus.Skipped.stepState())
        assertEquals(StanceStepStatus.entries.size, StanceStepStatus.entries.map { it.icon }.toSet().size, "every status has its own icon")
        assertEquals(setOf(StanceStepStatus.Pending, StanceStepStatus.Running, StanceStepStatus.Waiting), StanceStepStatus.entries.filter { it.isOpen }.toSet())
        assertEquals(setOf(StanceStepStatus.Complete, StanceStepStatus.Skipped), StanceStepStatus.entries.filter { it.isDone }.toSet())
    }

    @Test
    fun planProgressCountsDoneStepsAndReorders() {
        val plan = listOf(
            StancePlanItem("a", "Draft", StanceStepStatus.Complete),
            StancePlanItem("b", "Review", StanceStepStatus.Skipped),
            StancePlanItem("c", "Send", StanceStepStatus.Running),
            StancePlanItem("d", "Archive"),
        )
        assertEquals(0.5f, stancePlanProgress(plan))
        assertEquals(0f, stancePlanProgress(emptyList()))
        // Indexes are zero based.
        assertEquals(listOf("b", "c", "a", "d"), plan.stanceMove(0, 2).map { it.id })
        assertEquals(listOf("d", "a", "b", "c"), plan.stanceMove(3, 0).map { it.id })
        assertEquals(plan, plan.stanceMove(1, 9))
    }

    @Test
    fun approvalNeverMakesAHighRiskAllowTheDefault() {
        assertEquals(StanceButtonVariant.Primary, stanceAllowVariant(StanceRiskLevel.Low))
        assertEquals(StanceButtonVariant.Primary, stanceAllowVariant(StanceRiskLevel.Medium))
        assertEquals(StanceButtonVariant.Outline, stanceAllowVariant(StanceRiskLevel.High))
        assertEquals(StanceButtonVariant.Primary, stanceDenyVariant(StanceRiskLevel.High))
        for (risk in StanceRiskLevel.entries) {
            assertTrue(stanceAllowVariant(risk) != StanceButtonVariant.Primary || stanceDenyVariant(risk) != StanceButtonVariant.Primary)
        }
        assertEquals(listOf(2, 1, 0, 0), generateSequence(3) { stanceCountdownTick(it) }.drop(1).take(4).toList())
    }

    @Test
    fun requiredPermissionsStayGranted() {
        val permissions = listOf(StancePermission("read", "Read mail", granted = true, required = true), StancePermission("send", "Send mail", granted = false))
        assertEquals(listOf(true, true), stanceSetPermission(permissions, "send", true).map { it.granted })
        assertEquals(listOf(true, false), stanceSetPermission(permissions, "read", false).map { it.granted })
    }

    @Test
    fun runLogFiltersByLevelAndFormatsLines() {
        val entries = listOf(
            StanceLogEntry("1", StanceLogLevel.Info, "Started", "10:41:00"),
            StanceLogEntry("2", StanceLogLevel.Debug, "Cache warm"),
            StanceLogEntry("3", StanceLogLevel.Error, "Timed out", "10:41:09"),
        )
        assertEquals(entries, stanceFilterLog(entries, StanceLogLevel.entries.toSet()))
        assertEquals(listOf("1", "3"), stanceFilterLog(entries, setOf(StanceLogLevel.Info, StanceLogLevel.Error)).map { it.id })
        assertEquals(emptyList(), stanceFilterLog(entries, emptySet()))
        assertEquals(setOf(StanceLogLevel.Info), stanceToggleLogLevel(setOf(StanceLogLevel.Info, StanceLogLevel.Warn), StanceLogLevel.Warn))
        assertEquals(setOf(StanceLogLevel.Info, StanceLogLevel.Warn), stanceToggleLogLevel(setOf(StanceLogLevel.Info), StanceLogLevel.Warn))
        assertEquals("10:41:09 Error Timed out", stanceLogLine(entries[2], "Error"))
        assertEquals("Debug Cache warm", stanceLogLine(entries[1], "Debug"))
    }

    @Test
    fun subagentsBecomeTreeNodesThatCarryTheirStatus() {
        val agents = listOf(
            StanceSubagent("lead", "Lead", StanceStepStatus.Running, "Coordinating", listOf(StanceSubagent("search", "Researcher", StanceStepStatus.Complete))),
        )
        val node = stanceSubagentNodes(agents) { it.name }.single()
        assertEquals("Lead", node.label)
        assertEquals("Running", node.meta)
        assertEquals("Coordinating", node.description)
        assertEquals(StanceStepStatus.Running.icon, node.icon)
        assertEquals("Complete", node.children.single().meta)
    }

    // ───────────── Diff ─────────────

    private val hunk = StanceDiffHunk(
        "h1",
        listOf(
            StanceDiffLine(StanceDiffLineKind.Context, "fun greet() {", 1, 1),
            StanceDiffLine(StanceDiffLineKind.Remove, "    print(\"hi\")", 2, null),
            StanceDiffLine(StanceDiffLineKind.Remove, "    done()", 3, null),
            StanceDiffLine(StanceDiffLineKind.Add, "    println(\"hello\")", null, 2),
            StanceDiffLine(StanceDiffLineKind.Context, "}", 4, 3),
            StanceDiffLine(StanceDiffLineKind.Add, "// end", null, 4),
        ),
    )

    @Test
    fun diffDecisionsToggleAndAcceptAllCoversEveryHunk() {
        val files = listOf(StanceDiffFile("f1", "Greeting.kt", listOf(hunk, hunk.copy(id = "h2"))), StanceDiffFile("f2", "Other.kt", listOf(hunk.copy(id = "h3"))))
        var decisions = stanceDiffDecide(emptyMap(), "h1", StanceDiffDecision.Accepted)
        assertEquals(mapOf("h1" to StanceDiffDecision.Accepted), decisions)
        decisions = stanceDiffDecide(decisions, "h1", StanceDiffDecision.Rejected)
        assertEquals(mapOf("h1" to StanceDiffDecision.Rejected), decisions, "a second decision replaces the first")
        decisions = stanceDiffDecide(decisions, "h1", StanceDiffDecision.Rejected)
        assertEquals(emptyMap(), decisions, "the same decision again takes it back")
        assertEquals(
            mapOf("h1" to StanceDiffDecision.Accepted, "h2" to StanceDiffDecision.Accepted, "h3" to StanceDiffDecision.Accepted),
            stanceDiffDecideAll(files, StanceDiffDecision.Accepted),
        )
        assertEquals(setOf(StanceDiffDecision.Rejected), stanceDiffDecideAll(files, StanceDiffDecision.Rejected).values.toSet())
    }

    @Test
    fun diffLinesAreMarkedAndPairedForTheSplitView() {
        assertEquals(2 to 2, stanceDiffCounts(hunk.lines))
        assertEquals(listOf('+', '-', ' '), StanceDiffLineKind.entries.map { stanceDiffPrefix(it) })
        val rows = stanceDiffSplitRows(hunk.lines)
        assertEquals(listOf("fun greet() {", "    print(\"hi\")", "    done()", "}", null), rows.map { it.old?.text })
        assertEquals(listOf("fun greet() {", "    println(\"hello\")", null, "}", "// end"), rows.map { it.new?.text })
    }

    // ───────────── Output and product ─────────────

    @Test
    fun generatedTableSortsAndExportsCsv() {
        val rows = listOf(listOf("Sales", "12"), listOf("legal", "1,204"), listOf("Finance", "n/a"), listOf("Support", "9%"))
        assertEquals(rows, stanceSortRows(rows, null, numeric = false))
        assertEquals(listOf("Finance", "legal", "Sales", "Support"), stanceSortRows(rows, StanceTableSort(0), numeric = false).map { it[0] })
        assertEquals(listOf("Support", "Sales", "legal", "Finance"), stanceSortRows(rows, StanceTableSort(0, descending = true), numeric = false).map { it[0] })
        assertEquals(listOf("9%", "12", "1,204", "n/a"), stanceSortRows(rows, StanceTableSort(1), numeric = true).map { it[1] })
        assertEquals(listOf("1,204", "12", "9%", "n/a"), stanceSortRows(rows, StanceTableSort(1, descending = true), numeric = true).map { it[1] })

        assertEquals(StanceTableSort(1), stanceNextSort(null, 1))
        assertEquals(StanceTableSort(1, descending = true), stanceNextSort(StanceTableSort(1), 1))
        assertNull(stanceNextSort(StanceTableSort(1, descending = true), 1))
        assertEquals(StanceTableSort(0), stanceNextSort(StanceTableSort(1, descending = true), 0))

        assertEquals("Team,Seats\nSales,12\nlegal,\"1,204\"\n\"He said \"\"hi\"\"\",2", stanceTableCsv(listOf("Team", "Seats"), rows.take(2) + listOf(listOf("He said \"hi\"", "2"))))
        // Cells a spreadsheet would run as formulas open as text; negative numbers stay numbers.
        assertEquals(
            "Cell\n'=SUM(A1:A9)\n'+1\n'@cmd\n'-x\n-12\n-1.5%\n\"'=HYPERLINK(\"\"x\"\"),1\"",
            stanceTableCsv(listOf("Cell"), listOf("=SUM(A1:A9)", "+1", "@cmd", "-x", "-12", "-1.5%", "=HYPERLINK(\"x\"),1").map { listOf(it) }),
        )
    }

    @Test
    fun splitRatioKeepsBothPanesAtTheirMinimum() {
        assertEquals(0.5f, stanceSplitRatio(0.4f, 100f, 1000f, 200f, 200f))
        assertEquals(0.2f, stanceSplitRatio(0.4f, -900f, 1000f, 200f, 200f))
        assertEquals(0.8f, stanceSplitRatio(0.4f, 900f, 1000f, 200f, 200f))
        assertEquals(0.4f, stanceSplitRatio(0.4f, 50f, 300f, 200f, 200f), "minimums that do not fit leave the ratio alone")
        assertEquals(0.4f, stanceSplitRatio(0.4f, 50f, 0f, 200f, 200f))
    }

    @Test
    fun ghostTextIsNeverPartOfTheValue() {
        val ghost = StanceGhostTextTransformation(" by Friday", SpanStyle(color = Color.Gray))
        val shown = ghost.filter(AnnotatedString("Send it"))
        assertEquals("Send it by Friday", shown.text.text)
        assertEquals(7, shown.offsetMapping.originalToTransformed(7))
        assertEquals(7, shown.offsetMapping.transformedToOriginal(17), "the cursor cannot land inside the suggestion")
        assertEquals(3, shown.offsetMapping.transformedToOriginal(3))
        assertEquals("Send it", StanceGhostTextTransformation("", SpanStyle()).filter(AnnotatedString("Send it")).text.text)
        assertEquals(" by", stanceSuggestionWord(" by Friday"))
        assertEquals("Friday", stanceSuggestionWord("Friday"))
    }

    @Test
    fun rewriteMenuOpensNestedLevelsInPlace() {
        val tone = StanceRewriteAction("tone", "Change tone", children = listOf(StanceRewriteAction("formal", "Formal"), StanceRewriteAction("friendly", "Friendly")))
        val actions = listOf(StanceRewriteAction("shorten", "Shorten"), tone)
        var opened: StanceRewriteAction? = null
        var chosen: String? = null
        val top = stanceRewriteItems(actions, null, "Back", { opened = it }, { chosen = it.id })
        assertEquals(listOf("Shorten", "Change tone"), top.map { it.label })
        assertEquals(listOf(false, true), top.map { it.keepOpen })
        top[1].onClick()
        assertEquals(tone, opened)
        top[0].onClick()
        assertEquals("shorten", chosen)
        val nested = stanceRewriteItems(actions, tone, "Back", { opened = it }, { chosen = it.id })
        assertEquals(listOf("Back", "Formal", "Friendly"), nested.map { it.label })
        assertTrue(nested[0].keepOpen)
        nested[0].onClick()
        assertNull(opened)
        nested[2].onClick()
        assertEquals("friendly", chosen)
    }

    @Test
    fun searchHighlightsMergeAndIgnoreCase() {
        assertEquals(listOf(0..3, 9..17), stanceHighlightRanges("Sign the signature today", listOf("sign", "signature", "ature", " ")))
        assertEquals(emptyList(), stanceHighlightRanges("Nothing here", listOf("zz", "")))
    }

    // ───────────── Closed gaps ─────────────

    @Test
    fun comboboxOffersTypedTextOnlyWhenItIsNotAnOption() {
        val teams = listOf(StanceSelectOption("sales", "Sales"), StanceSelectOption("legal", "Legal"))
        assertEquals("Partners", stanceCustomValueCandidate(teams, "  Partners "))
        assertEquals("Sal", stanceCustomValueCandidate(teams, "Sal"), "a partial match is still a new value")
        assertNull(stanceCustomValueCandidate(teams, "sales"), "an existing label is chosen, not created")
        assertNull(stanceCustomValueCandidate(teams, "   "))
    }

    @Test
    fun autoScrollSpeedIsProportionalToTheOvershoot() {
        val speed = { start: Float, end: Float -> stanceAutoScrollSpeed(start, end, viewportStart = 0f, viewportEnd = 800f, maxSpeed = 1000f) }
        assertEquals(0f, speed(100f, 200f), "inside the viewport nothing scrolls")
        assertEquals(0f, speed(0f, 100f))
        assertEquals(0f, speed(700f, 800f))
        assertEquals(250f, speed(725f, 825f), "a quarter of the row past the end")
        assertEquals(500f, speed(750f, 850f))
        assertEquals(1000f, speed(900f, 1000f), "capped at the maximum")
        assertEquals(-250f, speed(-25f, 75f))
        assertEquals(-1000f, speed(-300f, -200f))
        // Content padding moves the edges in.
        assertEquals(500f, stanceAutoScrollSpeed(650f, 750f, viewportStart = 0f, viewportEnd = 700f, maxSpeed = 1000f))
        assertEquals(0f, stanceAutoScrollSpeed(10f, 10f, 0f, 800f, 1000f))
        // A reversed list measures from the bottom, so a finger moving down moves towards the start.
        assertEquals(-12f, stanceDragAlongList(12f, reverseLayout = true))
        assertEquals(12f, stanceDragAlongList(12f, reverseLayout = false))
    }

    @Test
    fun aDraggedRowMovesOnePlaceWhenItPassesHalfANeighbour() {
        val offsets = mapOf(0 to 0, 1 to 100, 2 to 200)
        val sizes = mapOf(0 to 100, 1 to 100, 2 to 100)
        assertNull(stanceDragTarget(1, 40f, offsets, sizes))
        assertEquals(2, stanceDragTarget(1, 60f, offsets, sizes))
        assertEquals(0, stanceDragTarget(1, -60f, offsets, sizes))
        assertNull(stanceDragTarget(2, 80f, offsets, sizes), "the last row has nowhere to go")
        assertNull(stanceDragTarget(7, 80f, offsets, sizes), "a row that is not laid out stays")
    }

    @Test
    fun aPinnedTodayRemovesTheClockFromTheCalendar() {
        val pinned = 1_700_000_000_000L
        assertEquals(42L, stanceInitialMonth(42L, pinned), "the chosen day wins")
        assertEquals(pinned, stanceInitialMonth(null, pinned))
        assertNull(stanceInitialMonth(null, null), "Material picks the month from the device clock")
        assertFalse(stanceShowsTodayMarker(pinned))
        assertTrue(stanceShowsTodayMarker(null))
    }
}
