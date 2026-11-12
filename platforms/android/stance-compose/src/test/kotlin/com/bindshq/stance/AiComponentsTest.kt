package com.bindshq.stance

import android.content.Context
import android.provider.Settings
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasScrollToIndexAction
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollToIndex
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.ai.StanceAIGeneratedLabel
import com.bindshq.stance.components.ai.StanceAttachment
import com.bindshq.stance.components.ai.StanceAttachmentTray
import com.bindshq.stance.components.ai.StanceBranchSwitcher
import com.bindshq.stance.components.ai.StanceCitationChip
import com.bindshq.stance.components.ai.StanceConfidenceBadge
import com.bindshq.stance.components.ai.StanceConfidenceLevel
import com.bindshq.stance.components.ai.StanceContextChips
import com.bindshq.stance.components.ai.StanceContextItem
import com.bindshq.stance.components.ai.StanceConversation
import com.bindshq.stance.components.ai.StanceConversationList
import com.bindshq.stance.components.ai.StanceFeedback
import com.bindshq.stance.components.ai.StanceFeedbackBar
import com.bindshq.stance.components.ai.StanceFeedbackReason
import com.bindshq.stance.components.ai.StanceGenerationProgress
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceInterruptedReason
import com.bindshq.stance.components.ai.StanceInterruptedState
import com.bindshq.stance.components.ai.StanceMentionItem
import com.bindshq.stance.components.ai.StanceMentionPicker
import com.bindshq.stance.components.ai.StanceMessage
import com.bindshq.stance.components.ai.StanceMessageActions
import com.bindshq.stance.components.ai.StanceMessageRole
import com.bindshq.stance.components.ai.StanceModel
import com.bindshq.stance.components.ai.StanceModelPicker
import com.bindshq.stance.components.ai.StancePromptComposer
import com.bindshq.stance.components.ai.StanceRating
import com.bindshq.stance.components.ai.StanceReasoningDisclosure
import com.bindshq.stance.components.ai.StanceReasoningStatus
import com.bindshq.stance.components.ai.StanceReport
import com.bindshq.stance.components.ai.StanceReportCategory
import com.bindshq.stance.components.ai.StanceReportDialog
import com.bindshq.stance.components.ai.StanceScrollToLatest
import com.bindshq.stance.components.ai.StanceSensitiveContentGate
import com.bindshq.stance.components.ai.StanceShimmerText
import com.bindshq.stance.components.ai.StanceSlashCommand
import com.bindshq.stance.components.ai.StanceSlashCommandMenu
import com.bindshq.stance.components.ai.StanceSource
import com.bindshq.stance.components.ai.StanceSourceList
import com.bindshq.stance.components.ai.StanceStarter
import com.bindshq.stance.components.ai.StanceStopButton
import com.bindshq.stance.components.ai.StanceStreamCadence
import com.bindshq.stance.components.ai.StanceStreamingSkeleton
import com.bindshq.stance.components.ai.StanceStreamingText
import com.bindshq.stance.components.ai.StanceThinkingIndicator
import com.bindshq.stance.components.ai.StanceThread
import com.bindshq.stance.components.ai.StanceThreadEmptyState
import com.bindshq.stance.components.ai.StanceThreadState
import com.bindshq.stance.components.ai.StanceTokenBudgetMeter
import com.bindshq.stance.components.ai.StanceTokenBudgetVariant
import com.bindshq.stance.components.ai.StanceVoiceInputButton
import com.bindshq.stance.components.ai.StanceVoiceInputState
import com.bindshq.stance.components.ai.rememberStanceMessageCustomActions
import com.bindshq.stance.components.ai.rememberStanceThreadState
import com.bindshq.stance.tokens.StanceTokens
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

/** Behaviour and semantics of the AI components. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class AiComponentsTest {
    @get:Rule
    val rule = createComposeRule()

    private val isHeading = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading)
    private val politeLiveRegion = SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite)
    private val assertiveLiveRegion = SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Assertive)
    private val notLiveRegion = SemanticsMatcher.keyNotDefined(SemanticsProperties.LiveRegion)

    private fun state(value: String) = SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, value)

    private fun setAnimatorScale(scale: Float) {
        val context = ApplicationProvider.getApplicationContext<Context>()
        Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, scale)
    }

    private val source = StanceSource("s1", "Deployment guide", domain = "docs.binds.si", snippet = "Signatures deploy to every mailbox within an hour.")

    // Composer

    @Test
    fun composerSendsTheDraftAndIsDisabledWhenEmpty() {
        var draft by mutableStateOf("")
        val sent = mutableListOf<String>()
        rule.setStanceContent { StancePromptComposer(draft, { draft = it }, onSubmit = { sent += it }) }
        rule.onNodeWithContentDescription("Send").assertIsNotEnabled().assertMinimumTouchTarget(rule)
        rule.onNodeWithContentDescription("Message").performTextInput("Draft a renewal email")
        rule.onNodeWithContentDescription("Send").assertIsEnabled().performClick()
        assertEquals(listOf("Draft a renewal email"), sent)
        // The draft is cleared after it is sent.
        assertEquals("", draft)
        rule.onNodeWithContentDescription("Send").assertIsNotEnabled()
    }

    @Test
    fun composerSubmitsFromTheKeyboardAction() {
        var draft by mutableStateOf("Hello")
        val sent = mutableListOf<String>()
        rule.setStanceContent { StancePromptComposer(draft, { draft = it }, onSubmit = { sent += it }) }
        rule.onNodeWithContentDescription("Message").performImeAction()
        draft = "   "
        rule.onNodeWithContentDescription("Message").performImeAction()
        assertEquals(listOf("Hello"), sent)
    }

    @Test
    fun composerSendBecomesStopWhileAResponseIsOnItsWay() {
        var status by mutableStateOf(StanceGenerationStatus.Idle)
        var stopped = 0
        val sent = mutableListOf<String>()
        rule.setStanceContent {
            StancePromptComposer("Next question", {}, onSubmit = { sent += it }, onStop = { stopped++ }, status = status)
        }
        rule.onNodeWithContentDescription("Send").assertIsEnabled()
        for (busy in listOf(StanceGenerationStatus.Submitted, StanceGenerationStatus.Streaming)) {
            status = busy
            rule.onAllNodesWithContentDescription("Send").assertCountEquals(0)
            rule.onNodeWithContentDescription("Stop").assertHasClickAction().assertMinimumTouchTarget(rule).performClick()
            // The keyboard action does not send while busy.
            rule.onNodeWithContentDescription("Message").performImeAction()
        }
        assertEquals(2, stopped)
        assertTrue(sent.isEmpty())
        for (settled in listOf(StanceGenerationStatus.Complete, StanceGenerationStatus.Stopped, StanceGenerationStatus.Error)) {
            status = settled
            rule.onNodeWithContentDescription("Send").assertIsEnabled()
            rule.onAllNodesWithContentDescription("Stop").assertCountEquals(0)
        }
    }

    @Test
    fun composerShowsItsSlotsAndCanBeDisabled() {
        rule.setStanceContent {
            StancePromptComposer(
                "Hi", {}, onSubmit = {}, enabled = false,
                header = { Text("Header slot") }, footer = { Text("Footer slot") },
                leading = { Text("Leading slot") }, trailing = { Text("Trailing slot") },
            )
        }
        listOf("Header slot", "Footer slot", "Leading slot", "Trailing slot").forEach { rule.onNodeWithText(it).assertIsDisplayed() }
        rule.onNodeWithContentDescription("Send").assertIsNotEnabled()
    }

    @Test
    fun stopButtonStopsInBothVariants() {
        var stopped = 0
        rule.setStanceContent {
            Column {
                StanceStopButton(onStop = { stopped++ })
                StanceStopButton(onStop = { stopped++ }, label = "Stop writing", variant = com.bindshq.stance.components.ai.StanceStopButtonVariant.Labelled)
            }
        }
        rule.onNodeWithContentDescription("Stop").assertMinimumTouchTarget(rule).performClick()
        rule.onNodeWithText("Stop writing").performClick()
        assertEquals(2, stopped)
    }

    // Streaming

    @Test
    fun streamingTextIsSilentWhileArrivingAndAnnouncedOnceWhenComplete() {
        setAnimatorScale(1f)
        var text by mutableStateOf("Signatures deploy")
        var streaming by mutableStateOf(true)
        var ended = 0
        rule.mainClock.autoAdvance = false
        rule.setStanceContent { StanceStreamingText(text, streaming = streaming, onRevealEnd = { ended++ }) }
        rule.mainClock.advanceTimeBy(200)
        rule.onAllNodesWithText("Signatures deploy").assertCountEquals(0)

        text = "Signatures deploy to every mailbox within an hour."
        rule.waitForIdle()
        rule.mainClock.advanceTimeBy(48)
        rule.onAllNodesWithText(text).assertCountEquals(0)
        assertEquals(0, ended)

        streaming = false
        rule.waitForIdle()
        rule.mainClock.advanceTimeBy(2_000)
        rule.onNodeWithText(text).assertIsDisplayed().assert(politeLiveRegion)
        assertEquals(1, ended)
        rule.mainClock.advanceTimeBy(2_000)
        assertEquals(1, ended)
    }

    @Test
    fun streamingTextRevealsLineByLineAtTheStreamCadence() {
        setAnimatorScale(1f)
        val text = List(60) { "word$it" }.joinToString(" ")
        rule.mainClock.autoAdvance = false
        rule.setStanceContent {
            Box(Modifier.testTag("reveal")) { StanceStreamingText(text, streaming = true, cadence = StanceStreamCadence.Word) }
        }
        rule.mainClock.advanceTimeBy(StanceTokens.Duration.stream * 2L)
        val early = rule.onNodeWithTag("reveal").fetchSemanticsNode().size.height
        rule.mainClock.advanceTimeBy(5_000)
        val settled = rule.onNodeWithTag("reveal").fetchSemanticsNode().size.height
        assertTrue(early < settled, "height follows the revealed line: $early then $settled")
    }

    @Test
    fun streamingTextIsInstantWhenAnimationsAreOffAndForFinishedMessages() {
        setAnimatorScale(0f)
        var streaming by mutableStateOf(true)
        var ended = 0
        rule.mainClock.autoAdvance = false
        rule.setStanceContent {
            Column {
                StanceStreamingText("Arrives at once", streaming = streaming, onRevealEnd = { ended++ })
                StanceStreamingText("Already finished")
            }
        }
        rule.mainClock.advanceTimeByFrame()
        // A message that never streamed is plain text, not a live region.
        rule.onNodeWithText("Already finished").assertIsDisplayed().assert(notLiveRegion)
        streaming = false
        rule.waitForIdle()
        rule.mainClock.advanceTimeBy(200)
        rule.onNodeWithText("Arrives at once").assert(politeLiveRegion)
        assertEquals(1, ended)
        setAnimatorScale(1f)
    }

    @Test
    fun thinkingIndicatorIsAPoliteStatusWithoutTheElapsedTime() {
        rule.setStanceContent { StanceThinkingIndicator(elapsedSeconds = 12) }
        rule.onNodeWithContentDescription("Thinking").assert(politeLiveRegion)
        // Visual only, so it is not announced every second.
        rule.onAllNodesWithText("12 seconds").assertCountEquals(0)
    }

    @Test
    fun thinkingAndShimmerAreStaticWhenAnimationsAreOff() {
        setAnimatorScale(0f)
        rule.setStanceContent {
            Column {
                StanceThinkingIndicator(label = "Working")
                StanceShimmerText("Searching the web")
            }
        }
        rule.onNodeWithContentDescription("Working").assertIsDisplayed()
        rule.onNodeWithText("Searching the web").assertIsDisplayed()
        setAnimatorScale(1f)
    }

    @Test
    fun reasoningOpensWhileThinkingAndCollapsesToASummary() {
        var status by mutableStateOf(StanceReasoningStatus.Thinking)
        rule.setStanceContent {
            StanceReasoningDisclosure(status, durationSeconds = 12) { Text("Comparing both clauses") }
        }
        rule.onNodeWithText("Comparing both clauses").assertIsDisplayed()
        rule.onNodeWithText("Thinking").assert(SemanticsMatcher.keyIsDefined(SemanticsActions.Collapse))
        status = StanceReasoningStatus.Done
        rule.waitForIdle()
        rule.onAllNodesWithText("Comparing both clauses").assertCountEquals(0)
        rule.onNodeWithText("Thought for 12 seconds").assert(SemanticsMatcher.keyIsDefined(SemanticsActions.Expand)).performClick()
        rule.onNodeWithText("Comparing both clauses").assertIsDisplayed()
    }

    @Test
    fun generationProgressAnnouncesItsStageAndCancels() {
        var cancelled = false
        rule.setStanceContent {
            StanceGenerationProgress("Creating document", progress = 0.42f, stage = "Rendering page 2", onCancel = { cancelled = true })
        }
        rule.onNodeWithContentDescription("Creating document").assert(state("42%"))
        rule.onNodeWithText("Rendering page 2").assert(politeLiveRegion)
        rule.onNodeWithContentDescription("Cancel").performClick()
        assertTrue(cancelled)
    }

    @Test
    fun skeletonIsOneStatusForScreenReaders() {
        rule.setStanceContent { StanceStreamingSkeleton(lines = 4) }
        rule.onNodeWithContentDescription("Loading response").assertIsDisplayed()
    }

    @Test
    fun interruptedStateIsAnAlertForErrorsAndAStatusWhenStopped() {
        var retried = false
        var continued = false
        rule.setStanceContent {
            Column {
                StanceInterruptedState(StanceInterruptedReason.Stopped, onContinue = { continued = true })
                StanceInterruptedState(StanceInterruptedReason.Network, description = "Check your connection.", onRetry = { retried = true })
                StanceInterruptedState(StanceInterruptedReason.Limit)
                StanceInterruptedState(StanceInterruptedReason.Error)
            }
        }
        rule.onNodeWithText("Limit reached").assert(politeLiveRegion)
        rule.onNodeWithText("Something went wrong").assert(assertiveLiveRegion)
        rule.onNodeWithText("Response stopped").assert(politeLiveRegion)
        rule.onNodeWithText("Connection lost").assert(assertiveLiveRegion)
        rule.onNodeWithText("Continue").performClick()
        rule.onNodeWithText("Try again").performClick()
        assertTrue(retried && continued)
    }

    // Conversation

    @Test
    fun messageHeadingCarriesAuthorTimeStatusAndActions() {
        var status by mutableStateOf(StanceGenerationStatus.Streaming)
        var copied = false
        rule.setStanceContent {
            StanceMessage(
                StanceMessageRole.Assistant,
                status = status,
                timestamp = "10:42",
                customActions = rememberStanceMessageCustomActions(onCopy = { copied = true }, onRate = {}),
            ) { Text("Here is the draft.") }
        }
        val heading = rule.onNodeWithText("Assistant").assert(isHeading).assert(state("Responding"))
        val actions = heading.fetchSemanticsNode().config[SemanticsActions.CustomActions]
        assertEquals(listOf("Copy", "Good response", "Bad response"), actions.map { it.label })
        actions.first().action()
        assertTrue(copied)
        mapOf(
            StanceGenerationStatus.Submitted to "Sending",
            StanceGenerationStatus.Stopped to "Stopped",
            StanceGenerationStatus.Error to "Failed",
        ).forEach { (next, words) ->
            status = next
            rule.onNodeWithText("Assistant").assert(state(words))
        }
        status = StanceGenerationStatus.Complete
        rule.waitForIdle()
        assertNull(rule.onNodeWithText("Assistant").fetchSemanticsNode().config.getOrNull(SemanticsProperties.StateDescription))
    }

    @Test
    fun userMessageIsReadAsOneItemStartingWithTheAuthor() {
        rule.setStanceContent {
            StanceMessage(StanceMessageRole.User, timestamp = "10:41") { Text("Draft a renewal email") }
        }
        val texts = rule.onNodeWithText("Draft a renewal email").fetchSemanticsNode().config[SemanticsProperties.Text].map { it.text }
        assertEquals(listOf("You, 10:41", "Draft a renewal email"), texts)
    }

    @Test
    fun messageActionsRateAsTogglesAndConfirmACopy() {
        var rating by mutableStateOf<StanceRating?>(null)
        var copies = 0
        var retried = false
        rule.setStanceContent {
            StanceMessageActions(onCopy = { copies++ }, onRetry = { retried = true }, onRate = { rating = it }, rating = rating)
        }
        rule.onNodeWithContentDescription("Good response").assertIsOff().assertMinimumTouchTarget(rule).performClick()
        assertEquals(StanceRating.Up, rating)
        rule.onNodeWithContentDescription("Good response").assertIsOn()
        rule.onNodeWithContentDescription("Bad response").assertIsOff().performClick()
        assertEquals(StanceRating.Down, rating)
        rule.onNodeWithContentDescription("Good response").assertIsOff()
        rule.onNodeWithContentDescription("Bad response").performClick()
        assertNull(rating)
        rule.onNodeWithContentDescription("Try again").performClick()
        assertTrue(retried)
        rule.onAllNodesWithContentDescription("Edit").assertCountEquals(0)

        rule.mainClock.autoAdvance = false
        rule.onNodeWithContentDescription("Copy").assert(politeLiveRegion).performClick()
        rule.waitForIdle()
        rule.mainClock.advanceTimeBy(200)
        assertEquals(1, copies)
        rule.onNodeWithContentDescription("Copied").assert(politeLiveRegion)
        rule.mainClock.advanceTimeBy(3_000)
        rule.onNodeWithContentDescription("Copy").assertIsDisplayed()
    }

    @Test
    fun branchSwitcherStaysInsideItsBounds() {
        var index by mutableIntStateOf(0)
        var count by mutableIntStateOf(3)
        rule.setStanceContent { StanceBranchSwitcher(count, index, { index = it }) }
        rule.onNodeWithText("1 of 3").assert(politeLiveRegion)
        rule.onNodeWithContentDescription("Previous version").assertIsNotEnabled()
        rule.onNodeWithContentDescription("Next version").assertIsEnabled().performClick()
        rule.onNodeWithContentDescription("Next version").performClick()
        assertEquals(2, index)
        rule.onNodeWithText("3 of 3").assertIsDisplayed()
        rule.onNodeWithContentDescription("Next version").assertIsNotEnabled()
        rule.onNodeWithContentDescription("Previous version").assertIsEnabled().performClick()
        assertEquals(1, index)
        // An index outside the range is clamped, and a single version shows nothing.
        index = 9
        rule.onNodeWithText("3 of 3").assertIsDisplayed()
        count = 1
        rule.onAllNodesWithContentDescription("Next version").assertCountEquals(0)
    }

    @Test
    fun threadFollowsNewContentOnlyWhileTheReaderIsAtTheBottom() {
        val messages = mutableStateListOf<String>().apply { addAll(List(40) { "Message $it" }) }
        lateinit var state: StanceThreadState
        rule.setStanceContent {
            state = rememberStanceThreadState()
            StanceThread(modifier = Modifier.height(400.dp), state = state) {
                items(messages, key = { it }) { Text(it, modifier = Modifier.height(60.dp)) }
            }
        }
        rule.waitForIdle()
        rule.onNodeWithText("Message 39").assertIsDisplayed()
        assertTrue(state.isPinned && state.isAtBottom)
        rule.onAllNodesWithContentDescription("Scroll to latest").assertCountEquals(0)

        messages += "Message 40"
        rule.waitForIdle()
        rule.onNodeWithText("Message 40").assertIsDisplayed()

        rule.onNode(hasScrollToIndexAction()).performScrollToIndex(5)
        rule.waitForIdle()
        assertFalse(state.isPinned)
        val reading = state.listState.firstVisibleItemIndex
        messages += "Message 41"
        messages[messages.lastIndex] = "Message 41 grew"
        rule.waitForIdle()
        assertEquals(reading, state.listState.firstVisibleItemIndex)
        assertFalse(state.isPinned)

        rule.onNodeWithContentDescription("Scroll to latest").performClick()
        rule.waitForIdle()
        rule.onNodeWithText("Message 41 grew").assertIsDisplayed()
        assertTrue(state.isPinned)
    }

    @Test
    fun threadIsALabelledListAndCanTurnFollowingOff() {
        val messages = mutableStateListOf<String>().apply { addAll(List(30) { "Message $it" }) }
        rule.setStanceContent {
            StanceThread(modifier = Modifier.height(400.dp), stickToBottom = false, label = "Renewal terms") {
                items(messages, key = { it }) { Text(it, modifier = Modifier.height(60.dp)) }
            }
        }
        rule.waitForIdle()
        rule.onNodeWithContentDescription("Renewal terms").assert(hasScrollToIndexAction())
        rule.onNodeWithText("Message 0").assertIsDisplayed()
    }

    @Test
    fun scrollToLatestNamesTheUnreadCount() {
        var clicked = false
        rule.setStanceContent { StanceScrollToLatest(visible = true, onClick = { clicked = true }, unreadCount = 3) }
        rule.onNodeWithContentDescription("Scroll to latest, 3 new messages").assertMinimumTouchTarget(rule).performClick()
        assertTrue(clicked)
    }

    @Test
    fun conversationListGroupsSelectsAndOffersActions() {
        val items = listOf(
            StanceConversation("1", "Renewal terms", updatedAt = "10:42", group = "Today"),
            StanceConversation("2", "Brand voice", group = "Yesterday", pinned = true),
        )
        var selected by mutableStateOf("1")
        val events = mutableListOf<String>()
        rule.setStanceContent {
            StanceConversationList(
                items, selected, onSelect = { selected = it.id },
                onRename = { events += "rename ${it.id}" }, onDelete = { events += "delete ${it.id}" }, onPin = { item, pinned -> events += "pin ${item.id} $pinned" },
            )
        }
        rule.onNodeWithText("Pinned").assert(isHeading)
        rule.onNodeWithText("Today").assert(isHeading)
        rule.onNodeWithText("Renewal terms").assertIsSelected()
        rule.onNodeWithText("Brand voice").performClick()
        assertEquals("2", selected)
        val actions = rule.onNodeWithText("Brand voice").fetchSemanticsNode().config[SemanticsActions.CustomActions]
        assertEquals(listOf("Unpin", "Rename", "Delete"), actions.map { it.label })
        rule.onNodeWithContentDescription("More actions for Renewal terms").assertMinimumTouchTarget(rule).performClick()
        rule.onNodeWithText("Pin").performClick()
        assertEquals(listOf("pin 1 true"), events)
    }

    @Test
    fun conversationListShowsAnEmptyState() {
        rule.setStanceContent { StanceConversationList(emptyList(), null, onSelect = {}) }
        rule.onNodeWithText("No conversations yet").assert(isHeading)
    }

    @Test
    fun threadEmptyStateOffersStarters() {
        var picked: String? = null
        rule.setStanceContent {
            StanceThreadEmptyState(
                "How can I help?",
                starters = listOf(StanceStarter("1", "Summarise a contract", "Key dates and obligations")),
                onStarterSelect = { picked = it.id },
            )
        }
        rule.onNodeWithText("How can I help?").assert(isHeading)
        rule.onNodeWithText("Summarise a contract").performClick()
        assertEquals("1", picked)
    }

    // Prompt

    @Test
    fun attachmentTrayNamesRemoveButtonsAndAnnouncesErrors() {
        val removed = mutableListOf<String>()
        var readOnly by mutableStateOf(false)
        rule.setStanceContent {
            StanceAttachmentTray(
                listOf(
                    StanceAttachment("1", "Contract.pdf", sizeLabel = "1.2 MB"),
                    StanceAttachment("2", "Logo.png", progress = 0.4f),
                    StanceAttachment("3", "Scan.tiff", error = "File is too large"),
                ),
                onRemove = { removed += it.id },
                readOnly = readOnly,
            )
        }
        rule.onNodeWithText("Uploading 40%").assertIsDisplayed()
        rule.onNodeWithText("File is too large").assert(politeLiveRegion)
        rule.onNodeWithContentDescription("Remove Contract.pdf").assertMinimumTouchTarget(rule).performClick()
        assertEquals(listOf("1"), removed)
        readOnly = true
        rule.onAllNodesWithContentDescription("Remove Contract.pdf").assertCountEquals(0)
    }

    @Test
    fun mentionPickerFiltersAndSelects() {
        var picked: String? = null
        var query by mutableStateOf("")
        rule.setStanceContent {
            Box {
                Text("Composer")
                StanceMentionPicker(
                    expanded = true, onDismissRequest = {},
                    items = listOf(
                        StanceMentionItem("1", "Contract.pdf", group = "Files"),
                        StanceMentionItem("2", "Ana Novak", group = "People"),
                    ),
                    onSelect = { picked = it.id }, query = query, activeIndex = 1,
                )
            }
        }
        rule.onNodeWithText("Files").assert(isHeading)
        rule.onNodeWithText("Ana Novak").assertIsSelected()
        query = "contract"
        rule.onAllNodesWithText("Ana Novak").assertCountEquals(0)
        rule.onNodeWithText("Contract.pdf").performClick()
        assertEquals("1", picked)
        query = "zzz"
        rule.onNodeWithText("No results").assert(politeLiveRegion)
    }

    @Test
    fun slashCommandMenuListsCommandsWithTheirSlash() {
        var picked: String? = null
        var expanded by mutableStateOf(true)
        rule.setStanceContent {
            Box {
                Text("Composer")
                StanceSlashCommandMenu(
                    expanded = expanded, onDismissRequest = {},
                    commands = listOf(StanceSlashCommand("1", "summarise", "Shorten the document"), StanceSlashCommand("2", "translate")),
                    onSelect = { picked = it.id }, query = "sum",
                )
            }
        }
        rule.onAllNodesWithText("/translate").assertCountEquals(0)
        rule.onNodeWithText("/summarise").assertIsSelected().performClick()
        assertEquals("1", picked)
        expanded = false
        rule.onAllNodesWithText("/summarise").assertCountEquals(0)
    }

    @Test
    fun modelPickerOpensASheetAndSelects() {
        val models = listOf(
            StanceModel("fast", "Swift", "Quick answers", badges = listOf("Fast")),
            StanceModel("deep", "Atlas", "Careful reasoning", badges = listOf("Vision")),
            StanceModel("old", "Legacy", enabled = false),
        )
        var selected by mutableStateOf("fast")
        rule.setStanceContent { StanceModelPicker(models, selected, { selected = it.id }) }
        rule.onNodeWithContentDescription("Model: Swift").assertMinimumTouchTarget(rule).performClick()
        rule.onNodeWithText("Careful reasoning").assertIsDisplayed()
        rule.onNodeWithText("Legacy").assertIsNotEnabled()
        rule.onNodeWithText("Atlas").performClick()
        rule.waitForIdle()
        assertEquals("deep", selected)
        rule.onNodeWithContentDescription("Model: Atlas").assertIsDisplayed()
    }

    @Test
    fun contextChipsRemoveAddAndCollapse() {
        val removed = mutableListOf<String>()
        var added = false
        rule.setStanceContent {
            StanceContextChips(
                listOf(StanceContextItem("1", "Contract.pdf", kind = "File"), StanceContextItem("2", "Pricing page"), StanceContextItem("3", "Selection")),
                onRemove = { removed += it.id }, onAdd = { added = true }, max = 2,
            )
        }
        rule.onNodeWithContentDescription("File: Contract.pdf").assertMinimumTouchTarget(rule).performClick()
        assertEquals(listOf("1"), removed)
        rule.onAllNodesWithContentDescription("Selection").assertCountEquals(0)
        rule.onNodeWithText("1 more").performClick()
        rule.onNodeWithContentDescription("Selection").assertIsDisplayed()
        rule.onNodeWithText("Add context").performClick()
        assertTrue(added)
    }

    @Test
    fun voiceInputButtonAnnouncesItsState() {
        var voice by mutableStateOf(StanceVoiceInputState.Idle)
        var presses = 0
        rule.setStanceContent { StanceVoiceInputButton(voice, onClick = { presses++ }, level = 0.6f) }
        rule.onNodeWithContentDescription("Voice input").assert(state("Off")).assert(politeLiveRegion).assertIsOff().assertMinimumTouchTarget(rule).performClick()
        voice = StanceVoiceInputState.Listening
        rule.onNodeWithContentDescription("Voice input").assert(state("Listening")).assertIsOn()
        voice = StanceVoiceInputState.Processing
        rule.onNode(state("Processing")).assertIsDisplayed()
        voice = StanceVoiceInputState.Unavailable
        rule.onNodeWithContentDescription("Voice input").assert(state("Unavailable")).assertIsNotEnabled()
        assertEquals(1, presses)
    }

    @Test
    fun tokenBudgetMeterAnnouncesTheWarningOnceItIsCrossed() {
        var used by mutableStateOf(50_000L)
        rule.setStanceContent {
            Column {
                StanceTokenBudgetMeter(used, 100_000L)
                StanceTokenBudgetMeter(used, 100_000L, label = "Bar", variant = StanceTokenBudgetVariant.Bar)
            }
        }
        val meter = rule.onNodeWithContentDescription("Context used").assert(state("50,000 of 100,000"))
        assertEquals(0.5f, meter.fetchSemanticsNode().config[SemanticsProperties.ProgressBarRangeInfo].current)
        rule.onAllNodesWithContentDescription("Near the limit").assertCountEquals(0)
        used = 85_000L
        rule.onAllNodesWithContentDescription("Near the limit").assertCountEquals(2)[0].assert(politeLiveRegion)
        used = 100_000L
        rule.onAllNodesWithContentDescription("Limit reached").assertCountEquals(2)
        rule.onAllNodesWithContentDescription("Near the limit").assertCountEquals(0)
    }

    @Test
    fun tokenBudgetMeterFormatsItsValue() {
        rule.setStanceContent {
            StanceTokenBudgetMeter(1_200, 4_000, variant = StanceTokenBudgetVariant.Text, format = { used, limit -> "${limit - used} left" })
        }
        rule.onNodeWithContentDescription("Context used").assert(state("2800 left"))
    }

    // Trust

    @Test
    fun citationChipIsNamedByItsSourceAndOpensAPreview() {
        var opened: String? = null
        rule.setStanceContent { StanceCitationChip(2, source, onOpen = { opened = it.id }) }
        rule.onNodeWithContentDescription("Source 2: Deployment guide").assertHasClickAction().assertMinimumTouchTarget(rule).performClick()
        rule.onNodeWithText("Source 2").assert(isHeading)
        rule.onNodeWithText("Signatures deploy to every mailbox within an hour.").assertIsDisplayed()
        rule.onNodeWithText("View source").performClick()
        rule.waitForIdle()
        assertEquals("s1", opened)
    }

    @Test
    fun sourceListExpandsFromChipsToTheFullList() {
        val sources = List(5) { StanceSource("s$it", "Source title $it", domain = "site$it.example", snippet = "Snippet $it") }
        val opened = mutableListOf<String>()
        rule.setStanceContent { StanceSourceList(sources, max = 2, onSourceOpen = { opened += it.id }) }
        rule.onNodeWithText("Sources").assert(isHeading)
        rule.onNodeWithContentDescription("Source title 1").assertIsDisplayed()
        rule.onAllNodesWithContentDescription("Source title 2").assertCountEquals(0)
        rule.onNodeWithContentDescription("Source title 0").performClick()
        assertEquals(listOf("s0"), opened)
        rule.onNodeWithText("Show all 5 sources").performClick()
        rule.waitForIdle()
        rule.onNodeWithText("Snippet 4").assertIsDisplayed()
        rule.onNodeWithText("Show fewer").performClick()
        rule.waitForIdle()
        rule.onAllNodesWithText("Snippet 4").assertCountEquals(0)
    }

    @Test
    fun trustLabelsSayWhatTheyMeanInWords() {
        rule.setStanceContent {
            Column {
                StanceConfidenceBadge(StanceConfidenceLevel.Low, description = "Two sources disagree")
                StanceConfidenceBadge(StanceConfidenceLevel.Unknown)
                StanceAIGeneratedLabel(model = "Atlas")
            }
        }
        val low = rule.onNodeWithText("Low confidence").fetchSemanticsNode().config[SemanticsProperties.Text].map { it.text }
        assertEquals(listOf("Low confidence", "Two sources disagree"), low)
        rule.onNodeWithText("Confidence unknown").assertIsDisplayed()
        val label = rule.onNodeWithText("Generated by AI").fetchSemanticsNode().config[SemanticsProperties.Text].map { it.text }
        assertEquals(listOf("Generated by AI", "Atlas"), label)
    }

    @Test
    fun feedbackBarGoesFromRatingToDetailsToThanks() {
        var rating by mutableStateOf<StanceRating?>(null)
        var submitted by mutableStateOf(false)
        var feedback: StanceFeedback? = null
        rule.setStanceContent {
            StanceFeedbackBar(
                rating, { rating = it },
                reasons = listOf(StanceFeedbackReason("wrong", "Not accurate"), StanceFeedbackReason("long", "Too long")),
                onSubmit = { feedback = it; submitted = true },
                submitted = submitted,
            )
        }
        // Idle: only the rating.
        rule.onAllNodesWithText("Send feedback").assertCountEquals(0)
        rule.onNodeWithContentDescription("Bad response").assertIsOff().assertMinimumTouchTarget(rule).performClick()
        rule.waitForIdle()
        assertEquals(StanceRating.Down, rating)
        // Detail: a labelled group of reasons and a comment.
        rule.onNodeWithContentDescription("Bad response").assertIsOn()
        rule.onNodeWithContentDescription("Tell us more").assertIsDisplayed()
        rule.onNodeWithText("Too long").performClick()
        rule.onNodeWithText("Not accurate").performClick()
        rule.onNodeWithText("Too long").performClick()
        rule.onNode(hasSetTextAction()).performTextInput(" The date is wrong ")
        rule.onNodeWithText("Send feedback").performClick()
        rule.waitForIdle()
        assertEquals(StanceFeedback(StanceRating.Down, listOf("wrong"), "The date is wrong"), feedback)
        // Submitted: a polite thank you replaces the form.
        rule.onNodeWithText("Thanks for your feedback").assert(politeLiveRegion)
        rule.onAllNodesWithText("Send feedback").assertCountEquals(0)
        rule.onAllNodesWithContentDescription("Bad response").assertCountEquals(0)
    }

    @Test
    fun feedbackBarSubmitsAtOnceWhenThereIsNothingMoreToAsk() {
        var rating by mutableStateOf<StanceRating?>(null)
        val submissions = mutableListOf<StanceFeedback>()
        rule.setStanceContent { StanceFeedbackBar(rating, { rating = it }, onSubmit = { submissions += it }, allowComment = false) }
        rule.onNodeWithContentDescription("Good response").performClick()
        assertEquals(listOf(StanceFeedback(StanceRating.Up, emptyList(), "")), submissions)
        // Taking the rating back submits nothing.
        rule.onNodeWithContentDescription("Good response").performClick()
        assertEquals(1, submissions.size)
    }

    @Test
    fun reasoningKeepsTheReadersChoiceWhenThinkingEnds() {
        var status by mutableStateOf(StanceReasoningStatus.Thinking)
        rule.setStanceContent { StanceReasoningDisclosure(status) { Text("Comparing both clauses") } }
        rule.onNodeWithText("Thinking").performClick()
        rule.onNodeWithText("Thinking").performClick()
        status = StanceReasoningStatus.Done
        rule.waitForIdle()
        rule.onNodeWithText("Comparing both clauses").assertIsDisplayed()
    }

    @Test
    fun reportDialogStaysOpenAndBusyWhileSubmitting() {
        var dismissed = false
        rule.setStanceContent {
            StanceReportDialog(onDismissRequest = { dismissed = true }, categories = listOf(StanceReportCategory("wrong", "Incorrect")), onSubmit = {}, submitting = true)
        }
        rule.onNodeWithText("Send report").assert(state("Loading"))
        rule.onNodeWithText("Cancel").assertIsNotEnabled()
        rule.onNodeWithText("Incorrect").assertIsNotEnabled()
        assertFalse(dismissed)
    }

    @Test
    fun feedbackBarWithoutDetailsIsOnlyARating() {
        var rating by mutableStateOf<StanceRating?>(StanceRating.Up)
        rule.setStanceContent { StanceFeedbackBar(rating, { rating = it }) }
        rule.onAllNodesWithText("Send feedback").assertCountEquals(0)
        rule.onNodeWithContentDescription("Good response").assertIsOn().performClick()
        assertNull(rating)
    }

    @Test
    fun reportDialogNeedsACategoryBeforeItSubmits() {
        var report: StanceReport? = null
        rule.setStanceContent {
            StanceReportDialog(
                onDismissRequest = {},
                categories = listOf(StanceReportCategory("harm", "Harmful", "Could hurt someone"), StanceReportCategory("wrong", "Incorrect")),
                onSubmit = { report = it },
            )
        }
        rule.onNodeWithText("Report this response").assert(isHeading)
        rule.onNodeWithText("Send report").assertIsNotEnabled()
        rule.onNodeWithText("Incorrect").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("The renewal date is wrong")
        rule.onNodeWithText("Send report").assertIsEnabled().performClick()
        assertEquals(StanceReport("wrong", "The renewal date is wrong"), report)
    }

    @Test
    fun sensitiveContentIsAbsentUntilRevealed() {
        rule.setStanceContent { StanceSensitiveContentGate { Text("Graphic description") } }
        rule.onAllNodesWithText("Graphic description").assertCountEquals(0)
        rule.onNodeWithText("Sensitive content").assertIsDisplayed()
        rule.onNodeWithText("Show").performClick()
        rule.waitForIdle()
        rule.onNodeWithText("Graphic description").assertIsDisplayed()
        rule.onAllNodesWithText("Sensitive content").assertCountEquals(0)
        rule.onNodeWithText("Hide").performClick()
        rule.waitForIdle()
        rule.onAllNodesWithText("Graphic description").assertCountEquals(0)
    }

    @Test
    fun aiComponentsRenderInHighContrastAtDoubleFontSize() {
        rule.setContent {
            androidx.compose.runtime.CompositionLocalProvider(
                androidx.compose.ui.platform.LocalDensity provides androidx.compose.ui.unit.Density(rule.density.density, fontScale = 2f),
            ) {
                com.bindshq.stance.theme.StanceTheme(tokens = StanceTokens.highContrast) {
                    Column {
                        StanceMessage(StanceMessageRole.User) { Text("A long question that wraps onto several lines at this size") }
                        StanceMessageActions(onCopy = {}, onRate = {})
                        StancePromptComposer("A long draft that wraps onto several lines at this font size", {}, onSubmit = {})
                        StanceTokenBudgetMeter(90, 100, variant = StanceTokenBudgetVariant.Bar)
                    }
                }
            }
        }
        rule.onNodeWithContentDescription("Send").assertIsDisplayed().assertMinimumTouchTarget(rule)
        rule.onNodeWithContentDescription("Copy").assertIsDisplayed().assertMinimumTouchTarget(rule)
        rule.onNodeWithContentDescription("Near the limit").assertIsDisplayed()
    }
}
