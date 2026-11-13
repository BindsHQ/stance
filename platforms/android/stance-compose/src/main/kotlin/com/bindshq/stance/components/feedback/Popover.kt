package com.bindshq.stance.components.feedback

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import com.bindshq.stance.foundation.fadeEnter
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * Places a popover centred under its anchor, or above it when there is no room below, and keeps
 * it inside the window. Reports where the caret should point.
 */
internal class StancePopoverPosition(
    private val margin: Int,
    private val onPlaced: (caretX: Int, above: Boolean) -> Unit,
) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset {
        val centre = anchorBounds.center.x
        val maxX = (windowSize.width - popupContentSize.width - margin).coerceAtLeast(margin)
        val x = (centre - popupContentSize.width / 2).coerceIn(margin, maxX)
        val below = anchorBounds.bottom
        val above = anchorBounds.top - popupContentSize.height
        val placeAbove = below + popupContentSize.height > windowSize.height - margin && above >= margin
        onPlaced(centre - x, placeAbove)
        return IntOffset(x, if (placeAbove) above else below)
    }
}

/**
 * Rich content in a small floating panel tied to the element that opened it, with a caret that
 * points at that element.
 *
 * Built on the Compose [Popup]. Place it inside the same parent as the button that opens it, like
 * a dropdown menu. It dismisses on outside taps and back, takes focus so keyboard and screen reader
 * users move into it, and is announced as a pane named by [title]. Use it for content with
 * controls; for a short hint use [StanceTooltip].
 *
 * @param title Shown as a heading and names the pane for screen readers.
 * @param showCaret Draws the caret that points at the anchor.
 */
@Composable
public fun StancePopover(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    title: String? = null,
    showCaret: Boolean = true,
    content: @Composable ColumnScope.() -> Unit,
) {
    if (!expanded) return
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val density = LocalDensity.current
    val caret = StanceSpacing.space2
    val margin = with(density) { StanceSpacing.space2.roundToPx() }
    var caretX by remember { mutableIntStateOf(0) }
    var above by remember { mutableStateOf(false) }
    val position = remember(margin) {
        StancePopoverPosition(margin) { x, isAbove ->
            caretX = x
            above = isAbove
        }
    }
    Popup(
        popupPositionProvider = position,
        onDismissRequest = onDismissRequest,
        properties = PopupProperties(focusable = true, dismissOnBackPress = true, dismissOnClickOutside = true),
    ) {
        val visible = remember { MutableTransitionState(motion.reduceMotion).apply { targetState = true } }
        AnimatedVisibility(visibleState = visible, enter = motion.fadeEnter()) {
            Box {
                Surface(
                    modifier = modifier
                        .padding(top = if (showCaret && !above) caret else StanceSpacing.none, bottom = if (showCaret && above) caret else StanceSpacing.none)
                        .widthIn(max = StanceSizes.contentMaxWidth / 2)
                        .semantics { paneTitle = title.orEmpty() },
                    shape = StanceTheme.shapes.large,
                    color = c.bgOverlay,
                    contentColor = c.fgDefault,
                    shadowElevation = StanceTheme.elevation.md.shadow,
                    border = BorderStroke(StanceTheme.tokens.borderWidth.dp, if (StanceTheme.isHighContrast) c.borderStrong else c.borderDefault),
                ) {
                    Column(
                        modifier = Modifier.padding(StanceSpacing.space4),
                        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    ) {
                        if (title != null) {
                            Text(title, style = StanceTheme.typography.title, color = c.fgDefault, modifier = Modifier.semantics { heading() })
                        }
                        content()
                    }
                }
                if (showCaret) {
                    val fill = c.bgOverlay
                    val edge = if (StanceTheme.isHighContrast) c.borderStrong else c.borderDefault
                    val stroke = StanceTheme.tokens.borderWidth.dp
                    Canvas(
                        modifier = Modifier
                            .align(if (above) AbsoluteAlignment.BottomLeft else AbsoluteAlignment.TopLeft)
                            .absoluteOffset { IntOffset(caretX - caret.roundToPx(), 0) }
                            .size(width = caret * 2, height = caret + stroke),
                    ) {
                        val w = size.width
                        val h = size.height
                        // The base overlaps the panel border so the caret joins the panel.
                        val tip = if (above) Offset(w / 2, h) else Offset(w / 2, 0f)
                        val baseY = if (above) 0f else h
                        val triangle = Path().apply {
                            moveTo(0f, baseY)
                            lineTo(tip.x, tip.y)
                            lineTo(w, baseY)
                            close()
                        }
                        drawPath(triangle, fill)
                        val sides = Path().apply {
                            moveTo(0f, baseY)
                            lineTo(tip.x, tip.y)
                            lineTo(w, baseY)
                        }
                        drawPath(sides, edge, style = Stroke(width = stroke.toPx()))
                    }
                }
            }
        }
    }
}
