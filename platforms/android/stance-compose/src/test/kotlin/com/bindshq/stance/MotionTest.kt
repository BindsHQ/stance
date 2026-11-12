package com.bindshq.stance

import android.content.Context
import android.provider.Settings
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.height
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.feedback.StanceBanner
import com.bindshq.stance.components.feedback.StanceInlineAlert
import com.bindshq.stance.components.feedback.StanceLoadingOverlay
import com.bindshq.stance.components.navigation.StanceStepper
import com.bindshq.stance.components.navigation.StanceTabs
import com.bindshq.stance.theme.StanceMotion
import com.bindshq.stance.tokens.StanceTokens
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** State changes ease with the motion tokens, and apply at once when animations are off. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class MotionTest {
    @get:Rule
    val rule = createComposeRule()

    private fun setAnimatorScale(scale: Float) {
        val context = ApplicationProvider.getApplicationContext<Context>()
        Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, scale)
    }

    @Test
    fun motionExposesTheNewTokens() {
        val motion = StanceMotion(reduceMotion = false)
        assertEquals(StanceTokens.Duration.slower, motion.slowerMillis)
        assertEquals(StanceTokens.Duration.stream, motion.streamMillis)
        assertEquals(StanceTokens.Duration.shimmer, motion.shimmerMillis)
        assertEquals(StanceTokens.Duration.pulse, motion.pulseMillis)
        assertEquals(0.5f, motion.linearEasing.transform(0.5f), 0.001f)
        assertEquals("TweenSpec", motion.slower<Float>()::class.simpleName)
        assertEquals("SnapSpec", StanceMotion(reduceMotion = true).slower<Float>()::class.simpleName)
    }

    @Test
    fun bannerEasesInToItsFullHeight() {
        setAnimatorScale(1f)
        rule.mainClock.autoAdvance = false
        rule.setStanceContent { StanceBanner("Scheduled maintenance tonight") }
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeByFrame()
        val early = rule.onNodeWithText("Scheduled maintenance tonight").getBoundsInRoot().height
        rule.mainClock.advanceTimeBy(1_000)
        val settled = rule.onNodeWithText("Scheduled maintenance tonight").getBoundsInRoot().height
        assertTrue(early < settled, "the banner grows as it enters: $early then $settled")
    }

    @Test
    fun bannerIsThereAtOnceWhenAnimationsAreOff() {
        setAnimatorScale(0f)
        rule.mainClock.autoAdvance = false
        rule.setStanceContent { StanceBanner("Scheduled maintenance tonight") }
        rule.mainClock.advanceTimeByFrame()
        val first = rule.onNodeWithText("Scheduled maintenance tonight").assertIsDisplayed().getBoundsInRoot().height
        rule.mainClock.advanceTimeBy(1_000)
        assertEquals(first, rule.onNodeWithText("Scheduled maintenance tonight").getBoundsInRoot().height)
        setAnimatorScale(1f)
    }

    @Test
    fun alertLeavesWhenNoLongerVisible() {
        var visible by mutableStateOf(true)
        rule.setStanceContent { StanceInlineAlert("Draft saved", onDismiss = { visible = false }, visible = visible) }
        rule.onNodeWithText("Draft saved").assertIsDisplayed()
        visible = false
        rule.waitForIdle()
        rule.onNodeWithText("Draft saved").assertDoesNotExist()
    }

    @Test
    fun loadingOverlayFadesAwayAndStopsBlocking() {
        var loading by mutableStateOf(true)
        rule.setStanceContent { StanceLoadingOverlay(visible = loading, message = "Saving") { Box(Modifier.size(200.dp)) } }
        rule.onNodeWithContentDescription("Saving").assertIsDisplayed()
        loading = false
        rule.waitForIdle()
        rule.onNodeWithContentDescription("Saving").assertDoesNotExist()
    }

    @Test
    fun stepperStatesFollowTheCurrentStep() {
        var step by mutableIntStateOf(0)
        rule.setStanceContent { StanceStepper(steps = listOf("Document", "Recipients", "Review"), currentStep = step) }
        fun state(label: String) = rule.onNode(
            SemanticsMatcher("step $label") { node ->
                node.config.getOrNull(SemanticsProperties.ContentDescription).orEmpty().any { it.endsWith(label) }
            },
        ).fetchSemanticsNode().config[SemanticsProperties.StateDescription]
        assertEquals("current", state("Document"))
        step = 2
        rule.waitForIdle()
        assertEquals("complete", state("Document"))
        assertEquals("complete", state("Recipients"))
        assertEquals("current", state("Review"))
    }

    @Test
    fun tabIndicatorSettlesUnderTheSelectedTabWithAnimationsOff() {
        setAnimatorScale(0f)
        var selected by mutableIntStateOf(0)
        rule.setStanceContent { StanceTabs(listOf("Overview", "Activity", "Settings"), selected, { selected = it }) }
        rule.onNodeWithText("Activity").assertIsDisplayed()
        selected = 2
        rule.waitForIdle()
        rule.onNodeWithText("Settings").assertIsDisplayed()
        setAnimatorScale(1f)
    }
}
