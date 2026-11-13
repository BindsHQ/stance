package com.bindshq.stance

import android.content.Context
import android.provider.Settings
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasScrollToIndexAction
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.performScrollToIndex
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.advanced.StanceSortableList
import com.bindshq.stance.components.advanced.stanceMove
import com.bindshq.stance.components.ai.StanceAgentStatus
import com.bindshq.stance.components.ai.StanceAgentStatusPill
import com.bindshq.stance.components.ai.StanceAgentTask
import com.bindshq.stance.components.ai.StanceApprovalPrompt
import com.bindshq.stance.components.ai.StanceDenyReason
import com.bindshq.stance.components.ai.StanceArtifactPanel
import com.bindshq.stance.components.ai.StanceArtifactVersion
import com.bindshq.stance.components.ai.StanceArtifactView
import com.bindshq.stance.components.ai.StanceAskBar
import com.bindshq.stance.components.ai.StanceCanvasPane
import com.bindshq.stance.components.ai.StanceCanvasSplitState
import com.bindshq.stance.components.ai.StanceCanvasSplitView
import com.bindshq.stance.components.ai.StanceCodeSuggestion
import com.bindshq.stance.components.ai.StanceCopilotPanel
import com.bindshq.stance.components.ai.StanceDiffDecision
import com.bindshq.stance.components.ai.StanceDiffFile
import com.bindshq.stance.components.ai.StanceDiffHunk
import com.bindshq.stance.components.ai.StanceDiffLine
import com.bindshq.stance.components.ai.StanceDiffLineKind
import com.bindshq.stance.components.ai.StanceDiffReview
import com.bindshq.stance.components.ai.StanceDiffView
import com.bindshq.stance.components.ai.StanceFilePreviewCard
import com.bindshq.stance.components.ai.StanceGeneratedChart
import com.bindshq.stance.components.ai.StanceGeneratedColumn
import com.bindshq.stance.components.ai.StanceGeneratedImage
import com.bindshq.stance.components.ai.StanceGeneratedTable
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceInlineSuggestion
import com.bindshq.stance.components.ai.StanceInsightCallout
import com.bindshq.stance.components.ai.StanceLogEntry
import com.bindshq.stance.components.ai.StanceLogLevel
import com.bindshq.stance.components.ai.StanceMarkdownRenderer
import com.bindshq.stance.components.ai.StancePermission
import com.bindshq.stance.components.ai.StancePermissionSheet
import com.bindshq.stance.components.ai.StancePlanChecklist
import com.bindshq.stance.components.ai.StancePlanItem
import com.bindshq.stance.components.ai.StanceRewriteAction
import com.bindshq.stance.components.ai.StanceRewriteMenu
import com.bindshq.stance.components.ai.StanceRewritePreview
import com.bindshq.stance.components.ai.StanceRiskLevel
import com.bindshq.stance.components.ai.StanceRunLog
import com.bindshq.stance.components.ai.StanceSearchResult
import com.bindshq.stance.components.ai.StanceSemanticSearchResults
import com.bindshq.stance.components.ai.StanceSmartField
import com.bindshq.stance.components.ai.StanceSmartFieldStatus
import com.bindshq.stance.components.ai.StanceSource
import com.bindshq.stance.components.ai.StanceStepStatus
import com.bindshq.stance.components.ai.StanceStepTimeline
import com.bindshq.stance.components.ai.StanceSubagent
import com.bindshq.stance.components.ai.StanceSubagentTree
import com.bindshq.stance.components.ai.StanceSuggestion
import com.bindshq.stance.components.ai.StanceSuggestionChips
import com.bindshq.stance.components.ai.StanceSummaryCard
import com.bindshq.stance.components.ai.StanceTaskQueue
import com.bindshq.stance.components.ai.StanceThreadState
import com.bindshq.stance.components.ai.StanceTimelineStep
import com.bindshq.stance.components.ai.StanceToolCallCard
import com.bindshq.stance.components.ai.rememberStanceCanvasSplitState
import com.bindshq.stance.components.ai.rememberStanceThreadState
import com.bindshq.stance.components.ai.stanceSetPermission
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.components.forms.LocalStanceToday
import com.bindshq.stance.components.forms.StanceCalendar
import com.bindshq.stance.components.forms.StanceCombobox
import com.bindshq.stance.components.forms.StanceMultiSelect
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.foundation.StanceWindowWidth
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** Behaviour and semantics of the closed gaps and the wave two AI components. */
@OptIn(ExperimentalTestApi::class)
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class WaveTwoComponentsTest {
    @get:Rule
    val rule = createComposeRule()

    private val isHeading = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading)
    private val politeLiveRegion = SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite)
    private val assertiveLiveRegion = SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Assertive)
    private val notLiveRegion = SemanticsMatcher.keyNotDefined(SemanticsProperties.LiveRegion)

    private fun state(value: String) = SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, value)

    private fun hasCustomAction(label: String) = SemanticsMatcher("has the action $label") { node ->
        node.config.getOrNull(SemanticsActions.CustomActions).orEmpty().any { it.label == label }
    }

    /** Runs the screen reader custom action named [label], as TalkBack would. */
    private fun SemanticsNodeInteraction.performCustomAction(label: String) {
        val action = fetchSemanticsNode().config[SemanticsActions.CustomActions].first { it.label == label }
        rule.runOnIdle { action.action() }
        rule.waitForIdle()
    }

    private fun setAnimatorScale(scale: Float) {
        val context = ApplicationProvider.getApplicationContext<Context>()
        Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, scale)
    }

    private val teams = listOf(StanceSelectOption("sales", "Sales"), StanceSelectOption("legal", "Legal"), StanceSelectOption("finance", "Finance"))

    // ───────────── Closed gaps ─────────────

    @Test
    fun comboboxOffersTheTypedTextFirstAndCommitsIt() {
        var custom by mutableStateOf<String?>(null)
        var chosen by mutableStateOf<String?>("sales")
        rule.setStanceContent {
            StanceCombobox("Team", teams, chosen, { chosen = it }, allowCustomValue = true, customValue = custom, onCustomValue = { custom = it })
        }
        rule.onNode(hasSetTextAction()).performTextReplacement(" Sal ")
        // "Sal" is no option's label, so the first item offers it, above the option it partly matches.
        rule.onNodeWithText("Use “Sal”").assertIsDisplayed()
        val offer = rule.onNodeWithText("Use “Sal”").getBoundsInRoot()
        assertTrue(offer.top < rule.onNodeWithText("Sales").getBoundsInRoot().top, "the offer is the first item")
        rule.onNodeWithText("Use “Sal”").performClick()
        assertEquals("Sal", custom)
        assertNull(chosen, "a custom value replaces the chosen option")
        rule.onNode(hasSetTextAction()).assert(hasText("Sal"))
    }

    @Test
    fun comboboxDoneKeyTakesTheTypedTextAndLabelsAreNotOffered() {
        var custom: String? = null
        rule.setStanceContent { StanceCombobox("Team", teams, null, {}, allowCustomValue = true, onCustomValue = { custom = it }) }
        rule.onNode(hasSetTextAction()).performTextInput("legal")
        rule.onAllNodesWithText("Use “legal”").assertCountEquals(0)
        rule.onNode(hasSetTextAction()).performTextInput(" team")
        rule.onNode(hasSetTextAction()).performImeAction()
        assertEquals("legal team", custom)
    }

    @Test
    fun comboboxWithoutCustomValuesKeepsTheEmptyMessage() {
        rule.setStanceContent { StanceCombobox("Team", teams, null, {}) }
        rule.onNode(hasSetTextAction()).performTextInput("zz")
        rule.onNodeWithText("No results").assertIsDisplayed()
        rule.onAllNodesWithText("Use “zz”").assertCountEquals(0)
    }

    @Test
    fun multiSelectCreatesAChipFromTypedText() {
        var options by mutableStateOf(teams)
        var chosen by mutableStateOf(setOf("sales"))
        rule.setStanceContent {
            StanceMultiSelect("Teams", options, chosen, { chosen = it }, allowCustomValue = true, onCustomValue = { text ->
                options = options + StanceSelectOption(text.lowercase(), text)
                chosen = chosen + text.lowercase()
            })
        }
        rule.onNodeWithContentDescription("Teams").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("Partners")
        rule.onNodeWithText("Use “Partners”").performClick()
        assertEquals(setOf("sales", "partners"), chosen)
        rule.onNode(SemanticsMatcher("removes Partners") { it.config.getOrNull(SemanticsActions.OnClick)?.label == "Remove Partners" }).assertExists()
    }

    @Test
    fun codeBlockIsOneSelectableTextWithHighlighting() {
        val code = "val answer = 42 // the answer\nfun ask() = answer"
        rule.setStanceContent { StanceCodeBlock(code, language = "kotlin", showLineNumbers = true, highlightLines = setOf(2)) }
        val text = rule.onNodeWithText(code).fetchSemanticsNode().config[SemanticsProperties.Text].single()
        assertEquals(code, text.text)
        assertTrue(text.spanStyles.size >= 6, "keywords, the number, the comment and the function are spans: ${text.spanStyles.size}")
        rule.onNodeWithText("1\n2").assertDoesNotExist()
    }

    @Test
    fun codeBlockRendersUnknownLanguagesPlain() {
        rule.setStanceContent { StanceCodeBlock("IDENTIFICATION DIVISION.", language = "cobol") }
        val text = rule.onNodeWithText("IDENTIFICATION DIVISION.").fetchSemanticsNode().config[SemanticsProperties.Text].single()
        assertTrue(text.spanStyles.isEmpty())
    }

    @Test
    fun sortableListScrollsWhileARowIsHeldPastTheBottomEdge() {
        var items by mutableStateOf(List(30) { "Step $it" })
        val state = LazyListState()
        rule.setStanceContent {
            Box(Modifier.height(300.dp)) {
                StanceSortableList(items, key = { it }, itemLabel = { it }, onMove = { from, to -> items = items.stanceMove(from, to) }, state = state) { Text(it) }
            }
        }
        // The row merges its handle, so the handle itself is in the unmerged tree.
        val handle = rule.onNodeWithContentDescription("Reorder Step 1", useUnmergedTree = true)
        handle.performTouchInput {
            down(center)
            // Past the touch slop, then held well below the bottom of the list.
            moveBy(Offset(0f, 40f))
            moveBy(Offset(0f, 400f))
        }
        // The list keeps scrolling for as long as the row is held there, which is until it runs out.
        rule.waitForIdle()
        assertFalse(state.canScrollForward, "the list scrolled to its end")
        assertEquals(29, items.indexOf("Step 1"), "the held row travelled with the scroll")
        assertEquals(List(30) { "Step $it" }.toSet(), items.toSet(), "no row was lost or repeated")
        assertEquals(listOf("Step 0", "Step 2", "Step 3"), items.take(3), "the rows it passed kept their order")
        rule.onNodeWithContentDescription("Reorder Step 1", useUnmergedTree = true).performTouchInput { up() }
        rule.waitForIdle()
        assertEquals(29, items.indexOf("Step 1"))
    }

    @Test
    fun sortableListWorksReversedAndWithContentPadding() {
        var items by mutableStateOf(listOf("Draft", "Review", "Sign"))
        rule.setStanceContent {
            Box(Modifier.height(400.dp)) {
                StanceSortableList(
                    items, key = { it }, itemLabel = { it }, onMove = { from, to -> items = items.stanceMove(from, to) },
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 24.dp), reverseLayout = true,
                ) { Text(it) }
            }
        }
        // Reversed, the first item is at the bottom, so dragging it up moves it later in the list.
        val draft = rule.onNodeWithText("Draft").getBoundsInRoot()
        val sign = rule.onNodeWithText("Sign").getBoundsInRoot()
        assertTrue(draft.top > sign.top)
        rule.onNodeWithContentDescription("Reorder Draft", useUnmergedTree = true).performTouchInput {
            down(center)
            moveBy(Offset(0f, -30f))
            moveBy(Offset(0f, -60f))
            up()
        }
        rule.waitForIdle()
        assertEquals(listOf("Review", "Draft", "Sign"), items)
    }

    @Test
    fun calendarWithAPinnedTodayOpensOnItsMonth() {
        rule.setStanceContent {
            CompositionLocalProvider(LocalStanceToday provides JANUARY_15_2024) { StanceCalendar(null, {}) }
        }
        rule.onNodeWithText("January 2024").assertIsDisplayed()
        rule.onNodeWithText("January 15, 2024", substring = true).assertExists()
    }

    // ───────────── Agents ─────────────

    @Test
    fun toolCallCardNamesItsStatusAndDiscloses() {
        var status by mutableStateOf(StanceStepStatus.Running)
        rule.setStanceContent {
            StanceToolCallCard("Search the web", status, name = "web.search", input = "{ \"query\": \"rollout\" }", output = "[\"guide\"]", durationSeconds = 2)
        }
        val header = rule.onNodeWithContentDescription("Search the web, Running")
        header.assert(politeLiveRegion).assert(state("Collapsed")).assertMinimumTouchTarget(rule)
        rule.onAllNodesWithContentDescription("Input").assertCountEquals(0)
        header.performClick()
        rule.onNodeWithContentDescription("Search the web, Running").assert(state("Expanded"))
        rule.onNodeWithContentDescription("Input").assertExists()
        rule.onNodeWithContentDescription("Output").assertExists()
        rule.onNodeWithText("web.search").assertExists()
        status = StanceStepStatus.Complete
        rule.onNodeWithContentDescription("Search the web, Complete").assert(politeLiveRegion)
    }

    @Test
    fun toolCallCardShowsAnErrorInWordsAndOpensAtOnceWithAnimationsOff() {
        setAnimatorScale(0f)
        try {
            rule.setStanceContent { StanceToolCallCard("Send email", StanceStepStatus.Error, error = "The mailbox is full.", output = "ignored") }
            rule.onNodeWithContentDescription("Send email, Failed").performClick()
            rule.waitForIdle()
            rule.onNodeWithText("The mailbox is full.", useUnmergedTree = true).assertIsDisplayed()
            rule.onNodeWithText("Error", useUnmergedTree = true).assertIsDisplayed()
            rule.onAllNodesWithContentDescription("Output").assertCountEquals(0)
        } finally {
            setAnimatorScale(1f)
        }
    }

    @Test
    fun stepTimelineSaysPositionAndStatusAndExpands() {
        val steps = listOf(
            StanceTimelineStep("read", "Read the brief", StanceStepStatus.Complete, durationLabel = "4 s"),
            StanceTimelineStep("draft", "Draft the email", StanceStepStatus.Running, description = "Writing the first version") { Text("Subject line chosen") },
            StanceTimelineStep("send", "Send for review", StanceStepStatus.Pending),
        )
        rule.setStanceContent { StanceStepTimeline(steps) }
        rule.onNodeWithContentDescription("Steps").assertExists()
        rule.onNodeWithContentDescription("Step 1 of 3, Read the brief, Complete").assertExists()
        rule.onNodeWithContentDescription("Step 3 of 3, Send for review, Pending").assertExists()
        val current = rule.onNodeWithContentDescription("Step 2 of 3, Draft the email, Running")
        current.assert(state("Collapsed"))
        rule.onNodeWithText("Subject line chosen").assertDoesNotExist()
        current.performClick()
        rule.onNodeWithText("Subject line chosen").assertIsDisplayed()
        rule.onNodeWithText("Writing the first version").assertIsDisplayed()
    }

    @Test
    fun planChecklistReordersRemovesAndApproves() {
        var plan by mutableStateOf(listOf(StancePlanItem("a", "Draft the email"), StancePlanItem("b", "Check the figures"), StancePlanItem("c", "Send it")))
        var approved = 0
        rule.setStanceContent { StancePlanChecklist(plan, editable = true, onItemsChange = { plan = it }, onApprove = { approved++ }, onReject = {}) }
        rule.onNodeWithContentDescription("Done: 0 of 3").assertExists()
        // Move down and Move up are accessibility actions on every row. Indexes are zero based.
        rule.onAllNodes(hasCustomAction("Move down")).onFirst().performCustomAction("Move down")
        assertEquals(listOf("b", "a", "c"), plan.map { it.id })
        rule.onNodeWithContentDescription("Remove Send it").performClick()
        assertEquals(listOf("b", "a"), plan.map { it.id })
        rule.onNodeWithText("Approve plan").performClick()
        assertEquals(1, approved)
    }

    @Test
    fun planChecklistReadsStatusesAndDerivesProgress() {
        val plan = listOf(StancePlanItem("a", "Draft", StanceStepStatus.Complete), StancePlanItem("b", "Send", StanceStepStatus.Running))
        rule.setStanceContent { StancePlanChecklist(plan) }
        rule.onNodeWithText("Draft").assert(state("Complete"))
        rule.onNodeWithText("Send").assert(state("Running"))
        rule.onNodeWithContentDescription("Done: 1 of 2").assert(state("50%"))
        rule.onAllNodes(hasCustomAction("Move down")).assertCountEquals(0)
    }

    @Test
    fun approvalCountdownOnlyEverDenies() {
        var allowed = 0
        var denied = 0
        var reason: StanceDenyReason? = null
        rule.mainClock.autoAdvance = false
        rule.setStanceContent {
            StanceApprovalPrompt("Send 48 emails", onAllow = { allowed++ }, onDeny = { denied++; reason = it }, onAllowAlways = { allowed++ }, countdownSeconds = 3)
        }
        rule.mainClock.advanceTimeByFrame()
        rule.onNodeWithText("Denies itself in 3 seconds").assertExists().assert(notLiveRegion)
        rule.mainClock.advanceTimeBy(1_100)
        rule.onNodeWithText("Denies itself in 2 seconds").assertExists()
        assertEquals(0, denied)
        rule.mainClock.advanceTimeBy(2_500)
        assertEquals(1, denied, "the countdown denies once")
        assertEquals(StanceDenyReason.Timeout, reason)
        rule.mainClock.advanceTimeBy(10_000)
        assertEquals(1, denied)
        assertEquals(0, allowed, "nothing ever allows on its own")
    }

    @Test
    fun approvalKeepWaitingStopsTheCountdownAndDenyReportsWhy() {
        val reasons = mutableListOf<StanceDenyReason>()
        rule.mainClock.autoAdvance = false
        rule.setStanceContent {
            StanceApprovalPrompt("Send 48 emails", onAllow = {}, onDeny = { reasons += it }, countdownSeconds = 3)
        }
        rule.mainClock.advanceTimeByFrame()
        rule.onNodeWithText("Keep waiting").assertMinimumTouchTarget(rule).performClick()
        rule.mainClock.advanceTimeBy(10_000)
        rule.onNodeWithText("Denies itself in", substring = true).assertDoesNotExist()
        rule.onNodeWithText("Keep waiting").assertDoesNotExist()
        assertEquals(emptyList(), reasons, "keep waiting leaves the decision with the person")
        rule.onNodeWithText("Deny").performClick()
        rule.mainClock.advanceTimeByFrame()
        assertEquals(listOf(StanceDenyReason.Deny), reasons)
    }

    @Test
    fun approvalDeniesOnEscapeAndNeverFocusesAllowForHighRisk() {
        var allowed = 0
        var denied = 0
        var reason: StanceDenyReason? = null
        rule.setStanceContent {
            StanceApprovalPrompt(
                "Delete 12 contracts",
                onAllow = { allowed++ },
                onDeny = { denied++; reason = it },
                description = "This cannot be undone.",
                risk = StanceRiskLevel.High,
                requestFocus = true,
            ) { com.bindshq.stance.components.forms.StanceTextField("", {}, "Reason") }
        }
        rule.onNodeWithText("High risk", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("Allow").assertIsNotFocused().assertMinimumTouchTarget(rule)
        // Deny comes first in reading and focus order.
        assertTrue(rule.onNodeWithText("Deny").assertMinimumTouchTarget(rule).getBoundsInRoot().left < rule.onNodeWithText("Allow").getBoundsInRoot().left)
        rule.onNode(hasSetTextAction()).performClick()
        rule.onNode(hasSetTextAction()).performKeyInput { pressKey(androidx.compose.ui.input.key.Key.Enter) }
        assertEquals(0, allowed, "Enter never allows")
        rule.onNode(hasSetTextAction()).performKeyInput { pressKey(androidx.compose.ui.input.key.Key.Escape) }
        assertEquals(1, denied)
        assertEquals(StanceDenyReason.Back, reason, "Escape reports back")
        assertEquals(0, allowed)
        rule.onNodeWithText("Allow").performClick()
        assertEquals(1, allowed, "allowing takes an explicit press")
    }

    @Test
    fun approvalIsBusyWhileTheDecisionIsApplied() {
        var denied = 0
        rule.setStanceContent { StanceApprovalPrompt("Run the migration", onAllow = {}, onDeny = { denied++ }, onAllowAlways = {}, busy = true, countdownSeconds = 1) }
        rule.onNodeWithText("Deny").assertIsNotEnabled()
        rule.onNodeWithText("Always allow").assertIsNotEnabled()
        rule.mainClock.advanceTimeBy(5_000)
        assertEquals(0, denied, "a decision in flight is not overruled by the countdown")
    }

    @Test
    fun permissionSheetHasASwitchForEachPermissionAndExplainsRequiredOnes() {
        var permissions by mutableStateOf(
            listOf(
                StancePermission("read", "Read templates", granted = true, description = "See every template", required = true),
                StancePermission("send", "Send email", granted = false, risk = StanceRiskLevel.High),
            ),
        )
        var saved = 0
        rule.setStanceContent {
            StancePermissionSheet({}, "Mail connector", permissions, { permissions = it }, onSave = { saved++ }, description = "Choose what the agent may do.")
        }
        rule.onNodeWithText("Mail connector").assert(isHeading)
        rule.onNodeWithText("Read templates").assertIsOn().assertIsNotEnabled()
        rule.onNodeWithText("See every template, Required", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("High risk", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("Send email").assertIsOff().assertMinimumTouchTarget(rule).performClick()
        assertEquals(listOf(true, true), permissions.map { it.granted })
        rule.onNodeWithText("Send email").assertIsOn()
        rule.onNodeWithText("Save").performClick()
        assertEquals(1, saved)
        assertEquals(listOf(true, false), stanceSetPermission(permissions, "send", false).map { it.granted })
    }

    @Test
    fun agentStatusPillAnnouncesWaitingAssertively() {
        var status by mutableStateOf(StanceAgentStatus.Working)
        var pressed = 0
        rule.setStanceContent { StanceAgentStatusPill(status, detail = "Step 2 of 5", onClick = { pressed++ }) }
        rule.onNodeWithContentDescription("Working, Step 2 of 5").assert(politeLiveRegion).assertMinimumTouchTarget(rule).performClick()
        assertEquals(1, pressed)
        status = StanceAgentStatus.Waiting
        rule.onNodeWithContentDescription("Waiting for you, Step 2 of 5").assert(assertiveLiveRegion)
        status = StanceAgentStatus.Error
        rule.onNodeWithContentDescription("Failed, Step 2 of 5").assert(politeLiveRegion)
    }

    @Test
    fun taskQueueNamesEveryActionAfterItsTask() {
        val tasks = listOf(
            StanceAgentTask("1", "Export report", StanceStepStatus.Running, progress = 0.4f),
            StanceAgentTask("2", "Notify legal", StanceStepStatus.Error, detail = "The address bounced"),
            StanceAgentTask("3", "Archive drafts", StanceStepStatus.Pending),
            StanceAgentTask("4", "Send digest", StanceStepStatus.Running, paused = true),
        )
        val events = mutableListOf<String>()
        rule.setStanceContent {
            StanceTaskQueue(tasks, onCancel = { events += "cancel ${it.id}" }, onRetry = { events += "retry ${it.id}" }, onPause = { events += "pause ${it.id}" }, onResume = { events += "resume ${it.id}" })
        }
        rule.onNodeWithText("Tasks: 4. Running: 1.").assert(isHeading)
        rule.onNodeWithContentDescription("Pause Export report").assertMinimumTouchTarget(rule).performClick()
        rule.onNodeWithContentDescription("Cancel Export report").performClick()
        rule.onNodeWithContentDescription("Retry Notify legal").performClick()
        rule.onNodeWithContentDescription("Cancel Archive drafts").performClick()
        rule.onNodeWithContentDescription("Pause Send digest").assertDoesNotExist()
        rule.onNodeWithContentDescription("Resume Send digest").performClick()
        assertEquals(listOf("pause 1", "cancel 1", "retry 2", "cancel 3", "resume 4"), events)
        rule.onNodeWithText("Notify legal").assert(state("Failed"))
        rule.onNodeWithText("Send digest").assert(state("Paused"))
        rule.onNodeWithText("The address bounced", useUnmergedTree = true).assertExists()
    }

    @Test
    fun taskQueueShowsAnEmptyMessage() {
        rule.setStanceContent { StanceTaskQueue(emptyList()) }
        rule.onNodeWithText("No tasks yet").assertIsDisplayed()
    }

    @Test
    fun subagentTreeCarriesStatusInEveryRow() {
        val agents = listOf(
            StanceSubagent(
                "lead", "Lead agent", StanceStepStatus.Running, "Coordinating the review",
                listOf(StanceSubagent("search", "Researcher", StanceStepStatus.Complete, "Found 3 sources"), StanceSubagent("write", "Writer", StanceStepStatus.Waiting)),
            ),
        )
        var selected by mutableStateOf<String?>(null)
        rule.setStanceContent { StanceSubagentTree(agents, initiallyExpandedIds = setOf("lead"), selectedId = selected, onSelect = { selected = it.id }) }
        rule.onNodeWithContentDescription("Agents").assertExists()
        rule.onNodeWithText("Lead agent").assert(state("Expanded"))
        rule.onNodeWithText("Running", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("Found 3 sources", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("Researcher").performClick()
        assertEquals("search", selected)
        rule.onNodeWithText("Researcher").assertIsSelected()
    }

    @Test
    fun runLogFollowsTheTailReleasesOnScrollAndAnnouncesOnlyErrors() {
        val entries = mutableStateListOf<StanceLogEntry>().apply { addAll(List(60) { StanceLogEntry("$it", StanceLogLevel.Info, "Line $it", "10:00:%02d".format(it)) }) }
        lateinit var state: StanceThreadState
        rule.setStanceContent {
            state = rememberStanceThreadState()
            StanceRunLog(entries, state = state)
        }
        rule.waitForIdle()
        rule.onNodeWithText("Line 59", substring = true).assertIsDisplayed().assert(notLiveRegion)
        assertTrue(state.isPinned)
        rule.onAllNodesWithContentDescription("Errors", substring = true).assertCountEquals(0)

        entries += StanceLogEntry("60", StanceLogLevel.Error, "Timed out")
        rule.waitForIdle()
        rule.onNodeWithText("Error Timed out").assertIsDisplayed().assert(notLiveRegion)
        rule.onNodeWithContentDescription("Errors: 1. Latest: Timed out").assert(politeLiveRegion)

        rule.onNode(hasScrollToIndexAction()).performScrollToIndex(3)
        rule.waitForIdle()
        assertFalse(state.isPinned, "scrolling up releases the tail")
        val reading = state.listState.firstVisibleItemIndex
        entries += StanceLogEntry("61", StanceLogLevel.Info, "Still going")
        rule.waitForIdle()
        assertEquals(reading, state.listState.firstVisibleItemIndex)
        rule.onNodeWithContentDescription("Scroll to latest").performClick()
        rule.waitForIdle()
        assertTrue(state.isPinned)
        rule.onNodeWithText("Info Still going").assertIsDisplayed()
    }

    @Test
    fun runLogFiltersByLevelWithChips() {
        val entries = listOf(
            StanceLogEntry("1", StanceLogLevel.Debug, "Cache warm"),
            StanceLogEntry("2", StanceLogLevel.Info, "Started"),
            StanceLogEntry("3", StanceLogLevel.Warn, "Slow reply"),
        )
        var levels by mutableStateOf(StanceLogLevel.entries.toSet())
        rule.setStanceContent { StanceRunLog(entries, levels = levels, onLevelsChange = { levels = it }, label = "Deploy log") }
        rule.onNodeWithContentDescription("Deploy log").assert(hasScrollToIndexAction())
        rule.onNodeWithText("Debug Cache warm").assertIsDisplayed()
        rule.onNodeWithText("Debug").assertIsSelected().performClick()
        assertEquals(setOf(StanceLogLevel.Info, StanceLogLevel.Warn, StanceLogLevel.Error), levels)
        rule.onNodeWithText("Debug Cache warm").assertDoesNotExist()
        rule.onNodeWithText("Warning Slow reply").assertIsDisplayed()
        rule.onNodeWithContentDescription("Copy log").assertMinimumTouchTarget(rule)
    }

    private val diff = listOf(
        StanceDiffFile(
            "f1",
            "src/Greeting.kt",
            listOf(
                StanceDiffHunk(
                    "h1",
                    listOf(
                        StanceDiffLine(StanceDiffLineKind.Context, "fun greet() {", 1, 1),
                        StanceDiffLine(StanceDiffLineKind.Remove, "print(\"hi\")", 2, null),
                        StanceDiffLine(StanceDiffLineKind.Add, "println(\"hello\")", null, 2),
                    ),
                    header = "@@ 1,3 @@",
                ),
                StanceDiffHunk("h2", listOf(StanceDiffLine(StanceDiffLineKind.Add, "// end", null, 9))),
            ),
        ),
    )

    @Test
    fun diffReviewMarksLinesInWordsAndDecidesHunkByHunk() {
        var decisions by mutableStateOf(emptyMap<String, StanceDiffDecision>())
        var acceptedAll = 0
        rule.setStanceContent { StanceDiffReview(diff, decisions, { decisions = it }, view = StanceDiffView.Unified, onAcceptAll = { acceptedAll++ }) }
        rule.onNodeWithContentDescription("src/Greeting.kt, Modified. Added: 2. Removed: 1.").assert(isHeading)
        // The prefix is on screen and the word is what screen readers hear.
        rule.onNodeWithContentDescription("fun greet() {\nRemoved: print(\"hi\")\nAdded: println(\"hello\")").assertExists()
        val text = rule.onNodeWithContentDescription("Added: // end").fetchSemanticsNode()
        assertTrue(rule.onNodeWithContentDescription("Change 2 of 2, src/Greeting.kt").fetchSemanticsNode().children.isNotEmpty())
        assertTrue(text.config.contains(SemanticsProperties.ContentDescription))

        rule.onAllNodesWithText("Accept").onFirst().assertMinimumTouchTarget(rule).performClick()
        assertEquals(mapOf("h1" to StanceDiffDecision.Accepted), decisions)
        rule.onNodeWithText("Accepted", useUnmergedTree = true).assertExists()
        rule.onNodeWithContentDescription("Change 2 of 2, src/Greeting.kt").performCustomAction("Reject")
        assertEquals(mapOf("h1" to StanceDiffDecision.Accepted, "h2" to StanceDiffDecision.Rejected), decisions)

        rule.onNodeWithText("Accept all").performClick()
        assertEquals(mapOf("h1" to StanceDiffDecision.Accepted, "h2" to StanceDiffDecision.Accepted), decisions)
        assertEquals(1, acceptedAll)
        rule.onNodeWithText("Reject all").performClick()
        assertEquals(setOf(StanceDiffDecision.Rejected), decisions.values.toSet())
    }

    @Test
    fun diffReviewSplitsOnWideWindowsAndCollapsesFiles() {
        var collapsed by mutableStateOf(emptySet<String>())
        rule.setStanceContent { StanceDiffReview(diff, emptyMap(), {}, view = StanceDiffView.Split, collapsedIds = collapsed, onCollapsedChange = { collapsed = it }) }
        // The old side and the new side are separate texts.
        rule.onNodeWithContentDescription("fun greet() {\nRemoved: print(\"hi\")").assertExists()
        rule.onNodeWithContentDescription("fun greet() {\nAdded: println(\"hello\")").assertExists()
        rule.onNodeWithContentDescription("src/Greeting.kt, Modified. Added: 2. Removed: 1.").assert(state("Expanded")).performClick()
        assertEquals(setOf("f1"), collapsed)
        rule.onAllNodesWithText("Accept").assertCountEquals(0)
    }

    // ───────────── Output ─────────────

    private val source = StanceSource("s1", "Deployment guide", domain = "docs.binds.si", snippet = "Signatures deploy within an hour.")

    @Test
    fun markdownRendererDrawsBlocksAndKeepsLinksSafe() {
        val markdown = "## Rollout\nPublish **tonight** [1]. Read [the guide](https://www.stanceui.com) or [this](javascript:alert(1)).\n\n" +
            "- [x] Draft\n- [ ] Review\n\n| Team | Seats |\n| --- | ---: |\n| Sales | 12 |\n\n```kotlin\nval a = 1\n```\n\n![Chart of seats](https://example.com/c.png)"
        rule.setStanceContent { StanceMarkdownRenderer(markdown, citations = mapOf(1 to source)) }
        rule.onNodeWithText("Rollout").assert(isHeading)
        val paragraph = rule.onNodeWithText("Publish tonight [1].", substring = true).fetchSemanticsNode().config[SemanticsProperties.Text].single()
        val links = paragraph.getLinkAnnotations(0, paragraph.length).map { (it.item as LinkAnnotation.Url).url }
        assertEquals(listOf("https://www.stanceui.com"), links, "the javascript link keeps its words and loses its address")
        assertTrue("this" in paragraph.text && "javascript" !in paragraph.text)
        rule.onNodeWithContentDescription("Source 1: Deployment guide").assertMinimumTouchTarget(rule)
        rule.onNodeWithText("Draft").assert(state("Checked"))
        rule.onNodeWithText("Review").assert(state("Not checked"))
        rule.onNodeWithContentDescription("Team: Sales, Seats: 12").assertExists()
        rule.onNodeWithText("val a = 1").assertExists()
        rule.onNodeWithContentDescription("Copy").assertExists()
        // Images are off by default: the description stands in.
        rule.onNodeWithText("Chart of seats").assertExists()
    }

    @Test
    fun markdownRendererToleratesPartialMarkdownWhileStreaming() {
        var text by mutableStateOf("## Result\nIt is **do")
        var loaded = mutableListOf<String>()
        rule.setStanceContent {
            StanceMarkdownRenderer(text, streaming = true, allowImages = true, image = { url, description -> loaded += url; Text("image: $description") })
        }
        rule.onNodeWithText("It is do").assertExists()
        text = "## Result\nIt is **done**.\n\n```kotlin\nval a ="
        rule.onNodeWithText("It is done.").assertExists()
        rule.onNodeWithText("val a =").assertExists()
        rule.onAllNodesWithContentDescription("Copy").assertCountEquals(0)
        text = "![A chart](https://example.com/c.png)\n\n![](https://example.com/no-alt.png)\n\n![Local](file:///c.png)"
        rule.onNodeWithText("image: A chart").assertExists()
        rule.waitForIdle()
        assertEquals(setOf("https://example.com/c.png"), loaded.toSet(), "only described http images reach the slot")
    }

    @Test
    fun codeSuggestionAppliesRunsAndReportsTheResult() {
        var applied by mutableStateOf(false)
        var status by mutableStateOf<StanceStepStatus?>(null)
        rule.setStanceContent {
            StanceCodeSuggestion(
                "println(\"hello\")", language = "kotlin", filename = "Main.kt",
                onApply = { applied = true }, onRun = { status = StanceStepStatus.Complete }, runStatus = status, applied = applied, runOutput = if (status != null) "hello" else null,
            )
        }
        rule.onNodeWithContentDescription("Main.kt").assertExists()
        rule.onNodeWithText("Copy").assertMinimumTouchTarget(rule)
        rule.onNodeWithText("Apply").assert(politeLiveRegion).performClick()
        rule.onNodeWithText("Applied").assertIsNotEnabled()
        rule.onNodeWithText("Run").performClick()
        rule.onNodeWithText("Run, Complete").assert(politeLiveRegion)
        rule.onNodeWithContentDescription("Output").assertExists()
    }

    @Test
    fun codeSuggestionWaitsWhileStreaming() {
        rule.setStanceContent { StanceCodeSuggestion("val a", onApply = {}, onRun = {}, streaming = true) }
        rule.onNodeWithText("Apply").assertIsNotEnabled()
        rule.onNodeWithText("Run").assertIsNotEnabled()
    }

    @Test
    fun artifactPanelIsAPaneWithTabsVersionsAndClose() {
        var view by mutableStateOf(StanceArtifactView.Preview)
        var version by mutableStateOf("v2")
        var closed = 0
        rule.setStanceContent {
            StanceArtifactPanel(
                "Rollout plan", onClose = { closed++ }, kind = "Document",
                versions = listOf(StanceArtifactVersion("v1", "Version 1"), StanceArtifactVersion("v2", "Version 2")), versionId = version, onVersionChange = { version = it },
                view = view, onViewChange = { view = it }, windowWidth = StanceWindowWidth.Expanded,
            ) { shown -> Text(if (shown == StanceArtifactView.Preview) "The document" else "The source") }
        }
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Rollout plan")).assertExists()
        rule.onNodeWithText("Rollout plan").assert(isHeading)
        rule.onNodeWithText("The document").assertIsDisplayed()
        rule.onNodeWithText("Code").performClick()
        rule.onNodeWithText("The source").assertIsDisplayed()
        rule.onNodeWithContentDescription("Version: Version 2").performClick()
        rule.onNodeWithText("Version 1").performClick()
        assertEquals("v1", version)
        rule.onNodeWithContentDescription("Close").assertMinimumTouchTarget(rule).performClick()
        assertEquals(1, closed)
    }

    @Test
    fun artifactPanelIsADialogOnCompactWidths() {
        rule.setStanceContent {
            StanceArtifactPanel("Rollout plan", onClose = {}, status = StanceGenerationStatus.Streaming, windowWidth = StanceWindowWidth.Compact) { Text("The document") }
        }
        rule.onNode(androidx.compose.ui.test.isDialog()).assertExists()
        rule.onNodeWithText("Generating").assert(politeLiveRegion)
        rule.onNodeWithText("The document").assertIsDisplayed()
    }

    @Test
    fun generatedImageIsAProgressBarWhileGeneratingAndOffersActions() {
        var status by mutableStateOf(StanceGenerationStatus.Streaming)
        val events = mutableListOf<String>()
        rule.setStanceContent {
            StanceGeneratedImage(
                painter = null, contentDescription = "A signature block on ivory paper", status = status, progress = 0.4f,
                onDownload = { events += "download" }, onRegenerate = { events += "regenerate" }, prompt = "Signature block",
            )
        }
        rule.onNodeWithContentDescription("Generating image").assert(state("40%"))
        rule.onNodeWithContentDescription("Regenerate").assertIsNotEnabled()
        status = StanceGenerationStatus.Complete
        rule.onNodeWithContentDescription("A signature block on ivory paper").assertExists()
        rule.onNodeWithContentDescription("Regenerate").assertIsEnabled().performClick()
        rule.onNodeWithContentDescription("Download").assertIsNotEnabled()
        rule.onNodeWithText("Prompt: Signature block").assertExists()
        assertEquals(listOf("regenerate"), events)
    }

    private val columns = listOf(StanceGeneratedColumn("team", "Team"), StanceGeneratedColumn("seats", "Seats", numeric = true))
    private val tableRows = listOf(listOf("Sales", "12"), listOf("Legal", "4"), listOf("Finance", "9"))

    @Test
    fun generatedTableSortsFromItsHeadersAndShowsAllRows() {
        rule.setStanceContent { StanceGeneratedTable(columns, tableRows, caption = "Seats by team", maxRows = 2) }
        rule.onNodeWithText("Seats by team").assert(isHeading)
        rule.onNodeWithText("Rows: 2 of 3").assertExists()
        rule.onNodeWithContentDescription("Team: Finance, Seats: 9").assertDoesNotExist()
        rule.onNodeWithText("Seats").assertMinimumTouchTarget(rule).performClick()
        rule.onNodeWithText("Seats").assert(state("Sorted ascending"))
        val legal = rule.onNodeWithContentDescription("Team: Legal, Seats: 4").getBoundsInRoot()
        val finance = rule.onNodeWithContentDescription("Team: Finance, Seats: 9").getBoundsInRoot()
        assertTrue(legal.top < finance.top, "4 sorts before 9")
        rule.onNodeWithText("Seats").performClick()
        rule.onNodeWithText("Seats").assert(state("Sorted descending"))
        rule.onNodeWithContentDescription("Team: Sales, Seats: 12").assertExists()
        rule.onNodeWithText("Show all rows").performClick()
        rule.onNodeWithText("Rows: 3 of 3").assertExists()
        rule.onNodeWithContentDescription("Copy as CSV").assertMinimumTouchTarget(rule)
    }

    @Test
    fun generatedTableDoesNotAnnounceRowsWhileStreaming() {
        rule.setStanceContent { StanceGeneratedTable(columns, tableRows, streaming = true) }
        rule.onNodeWithText("Receiving rows").assertExists()
        rule.onNodeWithContentDescription("Team: Sales, Seats: 12").assert(notLiveRegion)
        rule.onNodeWithContentDescription("Copy as CSV").assertIsNotEnabled()
        // Headers are not buttons until the table is complete.
        rule.onNodeWithText("Seats").assert(SemanticsMatcher.keyNotDefined(SemanticsActions.OnClick))
    }

    @Test
    fun generatedChartReadsItsTakeawayAndAlwaysOffersTheTable() {
        rule.setStanceContent {
            StanceGeneratedChart(
                "Signatures sent", "Signatures doubled since March.", listOf("Mar", "Apr"),
                listOf(StanceChartSeries("Sent", listOf(24f, 48f))), source = "Rollout audit",
            )
        }
        rule.onNodeWithContentDescription("Signatures doubled since March.").assertExists()
        rule.onNodeWithText("Source: Rollout audit").assertExists()
        rule.onNodeWithText("Chart").assertIsSelected()
        rule.onNodeWithText("Table").performClick()
        rule.onNodeWithContentDescription("Category: Apr, Sent: 48").assertExists()
        rule.onNodeWithText("Signatures doubled since March.").assertExists()
    }

    @Test
    fun filePreviewCardReadsAsOneItemAndNamesItsDownload() {
        var status by mutableStateOf(StanceGenerationStatus.Streaming)
        val events = mutableListOf<String>()
        rule.setStanceContent {
            StanceFilePreviewCard("Rollout plan.pdf", typeLabel = "PDF", sizeLabel = "1.2 MB", meta = "12 pages", status = status, progress = 0.5f, onOpen = { events += "open" }, onDownload = { events += "download" })
        }
        rule.onNodeWithText("Open").assertIsNotEnabled()
        rule.onNodeWithContentDescription("Preparing file").assert(state("50%"))
        status = StanceGenerationStatus.Complete
        rule.onNodeWithText("PDF, 1.2 MB, 12 pages", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("Open").performClick()
        rule.onNodeWithContentDescription("Download Rollout plan.pdf").assertMinimumTouchTarget(rule).performClick()
        assertEquals(listOf("open", "download"), events)
    }

    @Test
    fun canvasSplitViewSwitchesPanesOnCompactWidths() {
        lateinit var split: StanceCanvasSplitState
        rule.setStanceContent {
            split = rememberStanceCanvasSplitState()
            StanceCanvasSplitView({ Text("The thread") }, { Text("The document") }, state = split, windowWidth = StanceWindowWidth.Compact, modifier = Modifier.height(400.dp))
        }
        rule.onNodeWithText("The thread").assertIsDisplayed()
        rule.onNodeWithText("The document").assertDoesNotExist()
        rule.onNodeWithText("Conversation").assertIsSelected()
        rule.onNodeWithText("Canvas").performClick()
        assertEquals(StanceCanvasPane.Canvas, split.narrowPane)
        rule.onNodeWithText("The document").assertIsDisplayed()
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Canvas")).assertExists()
    }

    @Test
    @Config(sdk = [35], qualifiers = "w1200dp-h800dp")
    fun canvasSplitViewResizesWithADividerOnExpandedWidths() {
        lateinit var split: StanceCanvasSplitState
        rule.setStanceContent {
            split = rememberStanceCanvasSplitState(initialRatio = 0.5f)
            Box(Modifier.width(1000.dp).height(400.dp)) {
                StanceCanvasSplitView({ Text("The thread") }, { Text("The document") }, state = split, windowWidth = StanceWindowWidth.Expanded)
            }
        }
        rule.onNodeWithText("The thread").assertIsDisplayed()
        rule.onNodeWithText("The document").assertIsDisplayed()
        val divider = rule.onNodeWithContentDescription("Resize panes")
        divider.assertMinimumTouchTarget(rule)
        assertEquals(0.5f, divider.fetchSemanticsNode().config[SemanticsProperties.ProgressBarRangeInfo].current, 0.01f)
        val before = rule.onNodeWithText("The document").getBoundsInRoot().left
        divider.performTouchInput { down(center); moveBy(Offset(60f, 0f)); moveBy(Offset(140f, 0f)); up() }
        rule.waitForIdle()
        assertTrue(split.ratio > 0.5f, "dragging towards the end grows the conversation: ${split.ratio}")
        assertTrue(rule.onNodeWithText("The document").getBoundsInRoot().left > before)
        // Screen readers adjust it like a slider, within the minimum widths.
        rule.runOnIdle { divider.fetchSemanticsNode().config[SemanticsActions.SetProgress].action?.invoke(0f) }
        rule.waitForIdle()
        assertTrue(split.ratio in 0.28f..0.35f, "the conversation keeps its minimum width: ${split.ratio}")
    }

    @Test
    fun canvasSplitViewShowsOnlyTheConversationWhenTheCanvasIsClosed() {
        rule.setStanceContent { StanceCanvasSplitView({ Text("The thread") }, { Text("The document") }, canvasOpen = false, windowWidth = StanceWindowWidth.Expanded) }
        rule.onNodeWithText("The thread").assertIsDisplayed()
        rule.onNodeWithText("The document").assertDoesNotExist()
        rule.onAllNodesWithContentDescription("Resize panes").assertCountEquals(0)
    }

    // ───────────── Product ─────────────

    @Test
    fun inlineSuggestionIsNeverPartOfTheValueUntilAccepted() {
        var value by mutableStateOf("Send it")
        var suggestion by mutableStateOf<String?>(" by Friday")
        var dismissed = 0
        rule.setStanceContent {
            StanceInlineSuggestion(value, { value = it }, "Message", suggestion, onAccept = { value += suggestion.orEmpty(); suggestion = null }, onDismiss = { dismissed++; suggestion = null })
        }
        val field = rule.onNode(hasSetTextAction())
        assertEquals("Send it", field.fetchSemanticsNode().config[SemanticsProperties.InputText].text, "the value holds only what was typed")
        assertEquals("Send it by Friday", field.fetchSemanticsNode().config[SemanticsProperties.EditableText].text, "the ghost text is drawn after it")
        field.performTextInput("!")
        assertTrue("!" in value && "Friday" !in value, "typing never carries the suggestion into the value: $value")
        value = "Send it"
        rule.onNodeWithContentDescription("Accept suggestion:  by Friday").assert(politeLiveRegion).assertMinimumTouchTarget(rule).performClick()
        assertEquals("Send it by Friday", value)
        rule.onAllNodesWithContentDescription("Accept suggestion", substring = true).assertCountEquals(0)
        assertEquals(0, dismissed)
    }

    @Test
    fun inlineSuggestionAcceptsWithTabAndDismissesWithEscape() {
        var accepted = 0
        var dismissed = 0
        var suggestion by mutableStateOf<String?>(" by Friday")
        rule.setStanceContent { StanceInlineSuggestion("Send it", {}, "Message", suggestion, onAccept = { accepted++ }, onDismiss = { dismissed++ }) }
        val field = rule.onNode(hasSetTextAction())
        field.performClick()
        field.performKeyInput { pressKey(androidx.compose.ui.input.key.Key.Tab) }
        assertEquals(1, accepted)
        field.performKeyInput { pressKey(androidx.compose.ui.input.key.Key.Escape) }
        assertEquals(1, dismissed)
        // With no suggestion, Tab and Escape are left to the field.
        suggestion = null
        rule.waitForIdle()
        field.performKeyInput { pressKey(androidx.compose.ui.input.key.Key.Escape) }
        assertEquals(1, dismissed)
    }

    @Test
    fun smartFieldSaysWhereAValueCameFromAndDropsTheMarkOnEdit() {
        var value by mutableStateOf("")
        var status by mutableStateOf(StanceSmartFieldStatus.Suggested)
        var undone = 0
        rule.setStanceContent {
            StanceSmartField(
                "Company", value, { value = it }, status = status, suggestedValue = "Binds d.o.o.", suggestionSource = "Invoice 1042",
                onAccept = { value = "Binds d.o.o."; status = StanceSmartFieldStatus.Accepted }, onUndo = { undone++ },
            )
        }
        rule.onNodeWithText("Suggested: Binds d.o.o., From Invoice 1042").assertExists()
        rule.onNodeWithText("Use suggestion").performClick()
        assertEquals("Binds d.o.o.", value)
        rule.onNodeWithText("Filled in by AI, From Invoice 1042").assertExists()
        rule.onNodeWithText("Undo").performClick()
        assertEquals(1, undone)
        rule.onNode(hasSetTextAction()).performTextInput("New ")
        rule.onNodeWithText("Filled in by AI", substring = true).assertDoesNotExist()
    }

    @Test
    fun rewriteMenuOpensLevelsInPlaceAndPreviewReplacesOnlyOnRequest() {
        val actions = listOf(
            StanceRewriteAction("shorten", "Shorten"),
            StanceRewriteAction("tone", "Change tone", children = listOf(StanceRewriteAction("formal", "Formal"), StanceRewriteAction("friendly", "Friendly"))),
        )
        var open by mutableStateOf(true)
        var chosen: String? = null
        var custom: String? = null
        var replaced = 0
        var discarded = 0
        rule.setStanceContent {
            Column {
                Box { StanceRewriteMenu(open, { open = false }, actions, { chosen = it.id }, allowCustom = true, onCustomSubmit = { custom = it }) }
                StanceRewritePreview("We will reply by Friday.", onReplace = { replaced++ }, onDiscard = { discarded++ })
            }
        }
        rule.onNodeWithText("Change tone").performClick()
        assertTrue(open, "a nested level keeps the menu open")
        rule.onNodeWithText("Back").assertIsDisplayed()
        rule.onNodeWithText("Friendly").performClick()
        assertEquals("friendly", chosen)
        assertFalse(open)
        rule.waitForIdle()

        // Every opening starts at the top level again.
        open = true
        rule.waitForIdle()
        rule.onNodeWithText("Shorten").assertIsDisplayed()
        rule.onNode(hasSetTextAction()).performTextInput("Make it warmer")
        rule.onNodeWithContentDescription("Rewrite").performClick()
        assertEquals("Make it warmer", custom)

        rule.onNodeWithText("Suggested rewrite").assert(isHeading)
        rule.onNodeWithText("We will reply by Friday.").assert(politeLiveRegion)
        assertEquals(0, replaced)
        rule.onNodeWithText("Discard").performClick()
        rule.onNodeWithText("Replace").assertMinimumTouchTarget(rule).performClick()
        assertEquals(1 to 1, replaced to discarded)
    }

    @Test
    fun summaryCardListsPointsAndCollapses() {
        var regenerated = 0
        rule.setStanceContent {
            StanceSummaryCard(points = listOf("Two mailboxes are behind.", "Both sync tonight."), sources = listOf(source), updatedAt = "2 min ago", onRegenerate = { regenerated++ }, onExpand = {}, collapsible = true)
        }
        rule.onNodeWithText("Summary").assert(isHeading).assert(state("Expanded"))
        rule.onNodeWithText("Two mailboxes are behind.").assertIsDisplayed()
        rule.onNodeWithText("Updated 2 min ago", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("Regenerate").performClick()
        assertEquals(1, regenerated)
        rule.onNodeWithText("See original").assertMinimumTouchTarget(rule)
        rule.onNodeWithText("Summary").performClick()
        rule.onNodeWithText("Summary").assert(state("Collapsed"))
        rule.onNodeWithText("Two mailboxes are behind.").assertDoesNotExist()
    }

    @Test
    fun askBarSubmitsFromTheKeyboardAndFromSuggestions() {
        var value by mutableStateOf("")
        var status by mutableStateOf(StanceGenerationStatus.Idle)
        val asked = mutableListOf<String>()
        rule.setStanceContent {
            StanceAskBar(
                value, { value = it }, onSubmit = { asked += it; status = StanceGenerationStatus.Complete },
                suggestions = listOf(StanceSuggestion("1", "Who is behind?"), StanceSuggestion("2", "What changed?")), status = status,
            ) { Text("Two mailboxes in Sales.") }
        }
        rule.onNodeWithText("Two mailboxes in Sales.").assertDoesNotExist()
        rule.onNode(hasSetTextAction()).performTextInput("  When does it sync? ")
        rule.onNodeWithContentDescription("Ask").assertMinimumTouchTarget(rule)
        rule.onNode(hasSetTextAction()).performImeAction()
        assertEquals(listOf("When does it sync?"), asked)
        rule.onNodeWithContentDescription("Answer").assert(politeLiveRegion)
        rule.onNodeWithText("Two mailboxes in Sales.").assertIsDisplayed()
        rule.onNodeWithText("What changed?").performClick()
        assertEquals(listOf("When does it sync?", "What changed?"), asked)
        rule.onNodeWithContentDescription("Clear question").performClick()
        assertEquals("", value)
    }

    @Test
    fun askBarShowsThinkingWhileBusyAndDoesNotSubmitTwice() {
        var asked = 0
        rule.setStanceContent { StanceAskBar("Why?", {}, onSubmit = { asked++ }, status = StanceGenerationStatus.Submitted) { Text("An answer") } }
        rule.onNodeWithContentDescription("Thinking").assertExists()
        rule.onNodeWithText("An answer").assertDoesNotExist()
        rule.onNodeWithContentDescription("Ask").assertIsNotEnabled()
        rule.onNode(hasSetTextAction()).performImeAction()
        assertEquals(0, asked)
    }

    @Test
    fun suggestionChipsAreANamedGroupOfButtons() {
        var picked: String? = null
        var loading by mutableStateOf(false)
        rule.setStanceContent {
            StanceSuggestionChips(listOf(StanceSuggestion("a", "Schedule for tonight"), StanceSuggestion("b", "Show the audit")), { picked = it.id }, loading = loading, label = "Follow ups")
        }
        rule.onNodeWithContentDescription("Follow ups").assertExists()
        rule.onNodeWithText("Show the audit").assertMinimumTouchTarget(rule).performClick()
        assertEquals("b", picked)
        loading = true
        rule.onNodeWithContentDescription("Loading suggestions").assertExists()
        rule.onNodeWithText("Show the audit").assertDoesNotExist()
    }

    @Test
    fun insightCalloutHasAHeadingEvidenceAndOneAction() {
        var acted = 0
        var dismissed = 0
        rule.setStanceContent {
            StanceInsightCallout(
                "Signing slows on Fridays", confidence = com.bindshq.stance.components.ai.StanceConfidenceLevel.High,
                actionLabel = "Move the reminder", onAction = { acted++ }, onDismiss = { dismissed++ }, evidence = { Text("Friday median: 31 hours") },
            ) { Text("Contracts sent on Friday take twice as long.") }
        }
        rule.onNodeWithText("Signing slows on Fridays").assert(isHeading)
        rule.onNodeWithContentDescription("Evidence").assertExists()
        rule.onNodeWithText("High confidence").assertExists()
        rule.onNodeWithText("Move the reminder").performClick()
        rule.onNodeWithContentDescription("Dismiss").assertMinimumTouchTarget(rule).performClick()
        assertEquals(1 to 1, acted to dismissed)
    }

    @Test
    fun semanticSearchAnnouncesTheCountOnceAndMarksPassages() {
        var status by mutableStateOf(StanceGenerationStatus.Submitted)
        var opened: String? = null
        val results = listOf(
            StanceSearchResult("1", "Deploying signatures", "Templates reach every mailbox within an hour.", listOf("every mailbox"), "docs.binds.si", 0.92f, "It describes rollout timing"),
            StanceSearchResult("2", "Signature FAQ", "Mobile clients apply the template on next send."),
        )
        rule.setStanceContent { StanceSemanticSearchResults("rollout timing", results, status = status, onResultSelect = { opened = it.id }, modifier = Modifier.height(600.dp)) }
        rule.onNodeWithContentDescription("Loading").assertExists()
        rule.onNodeWithText("2 results").assertDoesNotExist()
        status = StanceGenerationStatus.Complete
        rule.onNodeWithText("2 results").assert(politeLiveRegion).assert(isHeading)
        val snippet = rule.onNodeWithText("Templates reach every mailbox within an hour.", useUnmergedTree = true).fetchSemanticsNode().config[SemanticsProperties.Text].single()
        val mark = snippet.spanStyles.single()
        assertEquals("every mailbox", snippet.text.substring(mark.start, mark.end))
        assertEquals(androidx.compose.ui.text.font.FontWeight.SemiBold, mark.item.fontWeight, "a mark is heavier, not only tinted")
        rule.onNodeWithText("Why it matched: It describes rollout timing", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("92%", useUnmergedTree = true).assertExists()
        rule.onNodeWithText("Signature FAQ").performClick()
        assertEquals("2", opened)
    }

    @Test
    fun semanticSearchSaysWhenNothingMatches() {
        rule.setStanceContent { StanceSemanticSearchResults("zebra", emptyList(), modifier = Modifier.height(300.dp)) }
        rule.onNodeWithText("Nothing matches “zebra”.").assert(politeLiveRegion)
    }

    @Test
    fun copilotPanelIsAPaneOnWideWindowsAndASheetOnNarrowOnes() {
        var width by mutableStateOf(StanceWindowWidth.Expanded)
        var closed = 0
        rule.setStanceContent {
            Row(Modifier.height(500.dp)) {
                StanceCopilotPanel({ closed++ }, title = "Rollout assistant", windowWidth = width, focusComposer = false, context = { Text("Rollout settings") }, composer = { Text("Composer") }) {
                    Text("The thread")
                }
            }
        }
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Rollout assistant")).assertExists()
        rule.onNodeWithText("Rollout assistant").assert(isHeading)
        rule.onNodeWithText("The thread").assertIsDisplayed()
        rule.onNodeWithText("Rollout settings").assertIsDisplayed()
        rule.onNodeWithContentDescription("Close assistant").assertMinimumTouchTarget(rule).performClick()
        assertEquals(1, closed)
        width = StanceWindowWidth.Compact
        rule.waitForIdle()
        rule.onAllNodesWithContentDescription("Close assistant").assertCountEquals(0)
        rule.onNodeWithText("Rollout assistant").assert(isHeading)
        rule.onNodeWithText("Composer").assertIsDisplayed()
    }

    // ───────────── Font scale ─────────────

    @Test
    fun agentControlsGrowWithTwoHundredPercentText() {
        rule.setStanceContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale = 2f)) {
                Column {
                    StanceApprovalPrompt("Send 48 emails to the Sales group", onAllow = {}, onDeny = {}, onAllowAlways = {}, description = "Each person gets the new footer.", countdownSeconds = null)
                    StanceToolCallCard("Search the web for the rollout guide", StanceStepStatus.Complete, input = "{}")
                    StanceSuggestionChips(listOf(StanceSuggestion("a", "Schedule the change for tonight")), {})
                }
            }
        }
        rule.onNodeWithText("Deny").assertIsDisplayed().assertMinimumTouchTarget(rule)
        rule.onNodeWithText("Always allow").assertIsDisplayed().assertMinimumTouchTarget(rule)
        rule.onNodeWithContentDescription("Search the web for the rollout guide, Complete").assertMinimumTouchTarget(rule)
        rule.onNodeWithText("Schedule the change for tonight").assertIsDisplayed().assertMinimumTouchTarget(rule)
        val width = rule.onRoot().getBoundsInRoot().right
        assertTrue(rule.onNodeWithText("Always allow").getBoundsInRoot().right <= width, "the buttons wrap instead of leaving the screen")
    }

    private companion object {
        const val JANUARY_15_2024 = 1_705_276_800_000L
    }
}
