package com.bindshq.stance

import com.bindshq.stance.components.ai.StanceBudgetLevel
import com.bindshq.stance.components.ai.StanceConversation
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceMentionItem
import com.bindshq.stance.components.ai.StanceSlashCommand
import com.bindshq.stance.components.ai.StanceStreamCadence
import com.bindshq.stance.components.ai.ThreadSnapshot
import com.bindshq.stance.components.ai.stanceBudgetLevel
import com.bindshq.stance.components.ai.stanceFilterCommands
import com.bindshq.stance.components.ai.stanceFilterMentions
import com.bindshq.stance.components.ai.stanceGroupConversations
import com.bindshq.stance.components.ai.stanceNextReveal
import com.bindshq.stance.components.ai.stanceRevealAdvance
import com.bindshq.stance.components.ai.stanceThreadPinned
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** The pure logic behind the AI components. */
class AiLogicTest {
    @Test
    fun statusMatchesTheContractAndKnowsWhenItIsBusy() {
        assertEquals(
            listOf("idle", "submitted", "streaming", "complete", "stopped", "error"),
            StanceGenerationStatus.entries.map { it.name.lowercase() },
        )
        assertEquals(
            setOf(StanceGenerationStatus.Submitted, StanceGenerationStatus.Streaming),
            StanceGenerationStatus.entries.filter { it.isBusy }.toSet(),
        )
    }

    @Test
    fun budgetWarnsFromTheThresholdAndIsExceededAtTheLimit() {
        assertEquals(StanceBudgetLevel.Normal, stanceBudgetLevel(799, 1000))
        assertEquals(StanceBudgetLevel.Warning, stanceBudgetLevel(800, 1000))
        assertEquals(StanceBudgetLevel.Warning, stanceBudgetLevel(999, 1000))
        assertEquals(StanceBudgetLevel.Exceeded, stanceBudgetLevel(1000, 1000))
        assertEquals(StanceBudgetLevel.Exceeded, stanceBudgetLevel(1200, 1000))
        assertEquals(StanceBudgetLevel.Warning, stanceBudgetLevel(500, 1000, warnAt = 0.5f))
        assertEquals(StanceBudgetLevel.Normal, stanceBudgetLevel(10, 0))
    }

    @Test
    fun revealStepsByCharacterWordOrAllAtOnce() {
        val text = "Hello brave  world"
        assertEquals(1, stanceNextReveal(text, 0, StanceStreamCadence.Character))
        assertEquals(5, stanceNextReveal(text, 0, StanceStreamCadence.Word))
        assertEquals(11, stanceNextReveal(text, 5, StanceStreamCadence.Word))
        assertEquals(18, stanceNextReveal(text, 11, StanceStreamCadence.Word))
        assertEquals(18, stanceNextReveal(text, 18, StanceStreamCadence.Word))
        assertEquals(18, stanceNextReveal(text, 3, StanceStreamCadence.Instant))
    }

    @Test
    fun revealNeverSplitsASurrogatePair() {
        val text = "a😀b"
        assertEquals(1, stanceNextReveal(text, 0, StanceStreamCadence.Character))
        assertEquals(3, stanceNextReveal(text, 1, StanceStreamCadence.Character))
        assertEquals(4, stanceNextReveal(text, 3, StanceStreamCadence.Character))
    }

    @Test
    fun revealCatchesUpWhenTheStreamIsFarAhead() {
        val short = "abc"
        assertEquals(1, stanceRevealAdvance(short, 0, StanceStreamCadence.Character))
        val long = "x".repeat(400)
        assertEquals(11, stanceRevealAdvance(long, 0, StanceStreamCadence.Character))
        assertEquals(400, stanceRevealAdvance(long, 400, StanceStreamCadence.Character))
        // A shrunk text never reveals past its end.
        assertEquals(3, stanceRevealAdvance(short, 10, StanceStreamCadence.Word))
    }

    @Test
    fun mentionsFilterByLabelAndDescription() {
        val items = listOf(
            StanceMentionItem("1", "Contract.pdf", description = "Shared file"),
            StanceMentionItem("2", "Ana Novak", description = "Legal"),
            StanceMentionItem("3", "Search", description = "Tool"),
        )
        assertEquals(items, stanceFilterMentions(items, " "))
        assertEquals(listOf("1"), stanceFilterMentions(items, "contract").map { it.id })
        assertEquals(listOf("2"), stanceFilterMentions(items, "LEGAL").map { it.id })
        assertTrue(stanceFilterMentions(items, "zzz").isEmpty())
    }

    @Test
    fun commandsFilterWithPrefixMatchesFirst() {
        val commands = listOf(StanceSlashCommand("1", "resume"), StanceSlashCommand("2", "summarise"), StanceSlashCommand("3", "translate"))
        assertEquals(commands, stanceFilterCommands(commands, "/"))
        assertEquals(listOf("2", "1"), stanceFilterCommands(commands, "/su").map { it.id })
        assertEquals(listOf("3"), stanceFilterCommands(commands, "TR").map { it.id })
    }

    private fun snapshot(count: Int = 10, last: Int = 100, viewport: Int = 800, forward: Boolean = false) = ThreadSnapshot(count, last, viewport, forward)

    @Test
    fun threadStaysPinnedWhileContentGrowsAtTheBottom() {
        val atBottom = snapshot()
        assertTrue(stanceThreadPinned(true, null, atBottom, userScrolling = false))
        // The last item grew and a new item arrived: still pinned, so the thread follows.
        assertTrue(stanceThreadPinned(true, atBottom, snapshot(last = 140, forward = true), userScrolling = false))
        assertTrue(stanceThreadPinned(true, atBottom, snapshot(count = 11, last = -1, forward = true), userScrolling = false))
        // The keyboard opened.
        assertTrue(stanceThreadPinned(true, atBottom, snapshot(viewport = 500, forward = true), userScrolling = false))
    }

    @Test
    fun threadReleasesWhenTheReaderScrollsUpAndPinsAgainAtTheBottom() {
        val atBottom = snapshot()
        val scrolledUp = snapshot(forward = true)
        assertFalse(stanceThreadPinned(true, atBottom, scrolledUp, userScrolling = false))
        // The last item left the viewport: a scroll, not growth.
        assertFalse(stanceThreadPinned(true, atBottom, snapshot(last = -1, forward = true), userScrolling = false))
        // A drag wins even when content grows in the same frame.
        assertFalse(stanceThreadPinned(true, atBottom, snapshot(last = 140, forward = true), userScrolling = true))
        // Growth while released does not pin.
        assertFalse(stanceThreadPinned(false, scrolledUp, snapshot(count = 11, forward = true), userScrolling = false))
        assertTrue(stanceThreadPinned(false, scrolledUp, atBottom, userScrolling = true))
    }

    @Test
    fun conversationsGroupWithPinnedFirst() {
        val items = listOf(
            StanceConversation("1", "Renewal terms", group = "Today"),
            StanceConversation("2", "Brand voice", group = "Yesterday", pinned = true),
            StanceConversation("3", "Onboarding email", group = "Today"),
            StanceConversation("4", "Untitled"),
        )
        val groups = stanceGroupConversations(items, "Pinned")
        assertEquals(listOf("Pinned", "Today", null), groups.map { it.first })
        assertEquals(listOf(listOf("2"), listOf("1", "3"), listOf("4")), groups.map { group -> group.second.map { it.id } })
    }
}
