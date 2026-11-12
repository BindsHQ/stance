package com.bindshq.stance

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.unit.width
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.bindshq.stance.components.advanced.StanceSignatureCanvas
import com.bindshq.stance.components.advanced.StanceSignatureState
import com.bindshq.stance.components.data.StanceListItem
import com.bindshq.stance.components.feedback.StanceBanner
import com.bindshq.stance.components.forms.StanceSearchBar
import com.bindshq.stance.components.forms.StanceSlider
import com.bindshq.stance.components.navigation.StanceTopAppBar
import com.bindshq.stance.icons.StanceIcons
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Layout follows the reading direction; physical things such as a signature do not. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class RtlTest {
    @get:Rule
    val rule = createComposeRule()

    private fun setContent(direction: LayoutDirection, content: @Composable () -> Unit) {
        rule.setStanceContent { CompositionLocalProvider(LocalLayoutDirection provides direction, content = content) }
    }

    @Test
    fun listItemLeadingContentMovesToTheRight() {
        setContent(LayoutDirection.Rtl) {
            StanceListItem("Mutual NDA", leading = { Box(Modifier.size(24.dp).testTag("leading")) }, trailing = { Box(Modifier.size(24.dp).testTag("trailing")) })
        }
        val leading = rule.onNodeWithTag("leading").getBoundsInRoot()
        val headline = rule.onNodeWithText("Mutual NDA").getBoundsInRoot()
        val trailing = rule.onNodeWithTag("trailing").getBoundsInRoot()
        assertTrue(leading.left >= headline.right, "leading content sits to the right of the headline")
        assertTrue(trailing.right <= headline.left, "trailing content sits to the left of the headline")
    }

    @Test
    fun listItemLeadingContentStaysOnTheLeftInLtr() {
        setContent(LayoutDirection.Ltr) {
            StanceListItem("Mutual NDA", leading = { Box(Modifier.size(24.dp).testTag("leading")) })
        }
        assertTrue(rule.onNodeWithTag("leading").getBoundsInRoot().right <= rule.onNodeWithText("Mutual NDA").getBoundsInRoot().left)
    }

    @Test
    fun bannerDismissButtonMovesToTheLeft() {
        setContent(LayoutDirection.Rtl) { StanceBanner("Scheduled maintenance tonight", onDismiss = {}) }
        val dismiss = rule.onNodeWithContentDescription("Dismiss").getBoundsInRoot()
        val message = rule.onNodeWithText("Scheduled maintenance tonight", useUnmergedTree = true).getBoundsInRoot()
        assertTrue(dismiss.right <= message.left, "dismiss is at the end edge, which is the left")
    }

    @Test
    fun topAppBarBackButtonMovesToTheRightAndMirrors() {
        setContent(LayoutDirection.Rtl) { StanceTopAppBar("Templates", onNavigateUp = {}) }
        val back = rule.onNodeWithContentDescription("Navigate up").getBoundsInRoot()
        val root = rule.onRoot().getBoundsInRoot()
        assertTrue(back.left > root.width / 2, "back is at the start edge, which is the right")
        assertTrue(back.left > rule.onNodeWithText("Templates").getBoundsInRoot().right - 1.dp)
    }

    @Test
    fun searchBarClearButtonMovesToTheLeft() {
        setContent(LayoutDirection.Rtl) { StanceSearchBar(query = "contract", onQueryChange = {}) }
        val clear = rule.onNodeWithContentDescription("Clear search").getBoundsInRoot()
        val root = rule.onRoot().getBoundsInRoot()
        assertTrue(clear.right < root.width / 2, "clear is at the end edge, which is the left")
    }

    @Test
    fun directionalIconsMirrorAndOthersDoNot() {
        val mirrored = listOf(
            StanceIcons.ArrowLeft, StanceIcons.ArrowRight, StanceIcons.ChevronLeft, StanceIcons.ChevronRight,
            StanceIcons.ChevronsLeft, StanceIcons.ChevronsRight, StanceIcons.ExternalLink, StanceIcons.Send,
        )
        mirrored.forEach { assertTrue(it.autoMirror, "${it.name} mirrors in right to left") }
        val fixed = listOf(StanceIcons.Check, StanceIcons.X, StanceIcons.ArrowUp, StanceIcons.ChevronDown, StanceIcons.Search, StanceIcons.Clock)
        fixed.forEach { assertFalse(it.autoMirror, "${it.name} keeps its direction") }
    }

    @Test
    fun sliderValueGrowsTowardsTheLeft() {
        var value by mutableFloatStateOf(0.5f)
        setContent(LayoutDirection.Rtl) { StanceSlider("Opacity", value = value, onValueChange = { value = it }) }
        rule.onNodeWithContentDescription("Opacity").performTouchInput { down(Offset(width * 0.1f, centerY)); up() }
        rule.waitForIdle()
        assertTrue(value > 0.7f, "a tap near the left edge picks a high value in right to left, got $value")
    }

    @Test
    fun signatureIsNotMirrored() {
        val state = StanceSignatureState()
        setContent(LayoutDirection.Rtl) { StanceSignatureCanvas(state, label = "Signature") }
        // A stroke drawn in the left quarter of the canvas must stay there.
        rule.onNodeWithContentDescription("Signature").performTouchInput {
            down(Offset(width * 0.05f, height * 0.5f))
            repeat(8) { step -> moveTo(Offset(width * (0.05f + 0.02f * (step + 1)), height * 0.5f + 4f * step)) }
            up()
        }
        rule.waitForIdle()
        assertFalse(state.isEmpty, "the drag drew a stroke")
        val bounds = state.toPath().getBounds()
        val width = rule.onNodeWithContentDescription("Signature").fetchSemanticsNode().size.width
        assertTrue(bounds.right < width * 0.5f, "the stroke stayed on the left: $bounds in a canvas $width wide")
        assertTrue(bounds.left >= 0f)
    }
}
