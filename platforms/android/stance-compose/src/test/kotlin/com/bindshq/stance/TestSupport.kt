package com.bindshq.stance

import androidx.compose.runtime.Composable
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.unit.dp
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens
import kotlin.test.assertTrue

/** Renders [content] inside the Stance theme. */
fun ComposeContentTestRule.setStanceContent(
    theme: StanceThemeTokens = StanceTokens.light,
    content: @Composable () -> Unit,
) {
    setContent { StanceTheme(tokens = theme, content = content) }
}

/** Asserts the node's touch target is at least 48dp in both dimensions. */
fun SemanticsNodeInteraction.assertMinimumTouchTarget(rule: ComposeContentTestRule): SemanticsNodeInteraction {
    val node = fetchSemanticsNode()
    // Touch bounds include the extra area Material reserves around visuals smaller than 48dp.
    // The node must be on screen: clipped nodes report empty bounds.
    val (width, height) = with(rule.density) { node.touchBoundsInRoot.width.toDp() to node.touchBoundsInRoot.height.toDp() }
    assertTrue(width >= 47.9.dp && height >= 47.9.dp, "touch target is $width × $height, expected at least 48dp")
    return this
}
