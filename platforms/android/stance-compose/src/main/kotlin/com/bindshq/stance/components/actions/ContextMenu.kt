package com.bindshq.stance.components.actions

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.changedToUpIgnoreConsumed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.onLongClick
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Whether a context menu is open and where it was asked for.
 * Create it with [rememberStanceContextMenuState].
 */
@Stable
public class StanceContextMenuState internal constructor() {
    /** True while the menu is shown. */
    public var expanded: Boolean by mutableStateOf(false)
        private set

    internal var touch: Offset? by mutableStateOf(null)
    internal var anchorSize: IntSize by mutableStateOf(IntSize.Zero)

    /** Opens the menu at [position] inside the anchor, or at its start edge when null. */
    public fun open(position: Offset? = null) {
        touch = position
        expanded = true
    }

    /** Closes the menu. */
    public fun dismiss() {
        expanded = false
    }
}

/** Remembers the state shared by [Modifier.stanceContextMenu] and [StanceContextMenu]. */
@Composable
public fun rememberStanceContextMenuState(): StanceContextMenuState = remember { StanceContextMenuState() }

/**
 * Opens a context menu when the element is long pressed, at the touch point.
 *
 * The long press is taken before child clickables see the release, so a long press on a
 * clickable row opens the menu without also clicking it. Screen readers get a long click action
 * named by [label], for example "Template actions". Put a [StanceContextMenu] with the same
 * [state] inside the element that has this modifier.
 */
public fun Modifier.stanceContextMenu(state: StanceContextMenuState, label: String, enabled: Boolean = true): Modifier {
    if (!enabled) return this
    return this
        .onSizeChanged { state.anchorSize = it }
        .pointerInput(state) {
            awaitEachGesture {
                val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
                val released = withTimeoutOrNull(viewConfiguration.longPressTimeoutMillis) {
                    while (true) {
                        val event = awaitPointerEvent(PointerEventPass.Initial)
                        val change = event.changes.firstOrNull { it.id == down.id } ?: return@withTimeoutOrNull true
                        if (change.changedToUpIgnoreConsumed()) return@withTimeoutOrNull true
                        if ((change.position - down.position).getDistance() > viewConfiguration.touchSlop) return@withTimeoutOrNull true
                    }
                    @Suppress("UNREACHABLE_CODE")
                    true
                }
                if (released == null) {
                    state.open(down.position)
                    // The rest of this gesture belongs to the menu, so nothing underneath clicks.
                    do {
                        val event = awaitPointerEvent(PointerEventPass.Initial)
                        event.changes.forEach { it.consume() }
                    } while (event.changes.any { it.pressed })
                }
            }
        }
        .semantics { onLongClick(label) { state.open(); true } }
}

/**
 * The menu opened by [Modifier.stanceContextMenu]: a [StanceDropdownMenu] placed at the touch point.
 * It dismisses on back, outside taps and Escape, and gives haptic feedback when it opens.
 */
@Composable
public fun StanceContextMenu(state: StanceContextMenuState, items: List<StanceMenuItem>, modifier: Modifier = Modifier) {
    val haptics = LocalHapticFeedback.current
    LaunchedEffect(state.expanded) {
        if (state.expanded && state.touch != null) haptics.performHapticFeedback(HapticFeedbackType.LongPress)
    }
    val density = LocalDensity.current
    val direction = LocalLayoutDirection.current
    val touch = state.touch
    val offset = if (touch == null) {
        DpOffset.Zero
    } else {
        with(density) {
            // Material measures x from the start edge and y from the anchor's bottom edge.
            val x = if (direction == LayoutDirection.Ltr) touch.x else state.anchorSize.width - touch.x
            DpOffset(x.toDp(), (touch.y - state.anchorSize.height).toDp())
        }
    }
    StanceDropdownMenu(
        expanded = state.expanded,
        onDismissRequest = state::dismiss,
        items = items,
        modifier = modifier,
        offset = offset,
    )
}
