package com.bindshq.stance.components.advanced

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.zIndex
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import kotlinx.coroutines.flow.first

/**
 * A copy of this list with the item at [from] moved to [to]. Indexes outside the list leave it
 * unchanged.
 */
public fun <T> List<T>.stanceMove(from: Int, to: Int): List<T> {
    if (from !in indices || to !in indices || from == to) return this
    return toMutableList().apply { add(to, removeAt(from)) }
}

/**
 * The index the dragged item should move to, or null to stay. It moves one place when its
 * leading edge in the drag direction passes the middle of the neighbour.
 *
 * @param offsets The top of each visible item, by index.
 * @param sizes Their heights, by index.
 */
internal fun stanceDragTarget(index: Int, dragOffset: Float, offsets: Map<Int, Int>, sizes: Map<Int, Int>): Int? {
    val top = (offsets[index] ?: return null) + dragOffset
    val bottom = top + (sizes[index] ?: 0)
    val next = index + 1
    val previous = index - 1
    return when {
        dragOffset > 0 && next in offsets && bottom > offsets.getValue(next) + sizes.getValue(next) / 2f -> next
        dragOffset < 0 && previous in offsets && top < offsets.getValue(previous) + sizes.getValue(previous) / 2f -> previous
        else -> null
    }
}

/**
 * How fast a list scrolls while an item is dragged past an edge, in pixels per second. Negative
 * scrolls towards the start, positive towards the end, and 0 when the item is inside the viewport.
 *
 * The speed grows in proportion to the overshoot, the distance the dragged item reaches past the
 * edge, and is [maxSpeed] once the overshoot is as long as the item itself.
 *
 * All positions are on the scrolling axis in the list's own direction, so the same numbers work
 * for a reversed list. Pass viewport bounds that leave out the content padding.
 *
 * @param itemStart The leading edge of the dragged item.
 * @param itemEnd Its trailing edge.
 */
internal fun stanceAutoScrollSpeed(itemStart: Float, itemEnd: Float, viewportStart: Float, viewportEnd: Float, maxSpeed: Float): Float {
    val size = itemEnd - itemStart
    if (size <= 0f || maxSpeed <= 0f) return 0f
    val before = viewportStart - itemStart
    val after = itemEnd - viewportEnd
    return when {
        // An item taller than the viewport overshoots both edges: follow the larger overshoot.
        before > 0f && before >= after -> -maxSpeed * (before / size).coerceAtMost(1f)
        after > 0f -> maxSpeed * (after / size).coerceAtMost(1f)
        else -> 0f
    }
}

/** A finger movement along the scrolling axis of a list: a reversed list counts the other way. */
internal fun stanceDragAlongList(delta: Float, reverseLayout: Boolean): Float = if (reverseLayout) -delta else delta

/**
 * A list people can reorder by dragging a handle, with move up and move down actions as an
 * alternative.
 *
 * Built on [LazyColumn] with stable keys. Dragging the grip handle lifts the row, and the other rows
 * ease out of the way with the motion tokens, or at once when animations are off. While the row is
 * held past the top or bottom edge the list scrolls, faster the further past the edge it is held.
 * The lifted row follows the finger from the list layout of each frame, so it stays put when its
 * neighbours move or recompose. Every row has Move up and Move down screen reader actions, and
 * [showMoveButtons] shows them as buttons for people who cannot drag (WCAG 2.5.7). After a move,
 * the row's new position is announced.
 *
 * @param key A stable key for each item.
 * @param itemLabel Plain text for an item, used to name its handle and in announcements.
 * @param onMove Called with the indexes of a move. Apply it with [stanceMove].
 * @param contentPadding Space around the items. Edge scrolling starts at the padded edge.
 * @param reverseLayout Lays the list out from the bottom, as the lazy column does.
 */
@Composable
public fun <T> StanceSortableList(
    items: List<T>,
    key: (T) -> Any,
    itemLabel: (T) -> String,
    onMove: (from: Int, to: Int) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    enabled: Boolean = true,
    showMoveButtons: Boolean = false,
    state: LazyListState = rememberLazyListState(),
    moveUpLabel: String = stringResource(R.string.stance_move_up),
    moveDownLabel: String = stringResource(R.string.stance_move_down),
    handleDescription: (String) -> String = rememberFromResources { r -> { item -> r.getString(R.string.stance_reorder, item) } },
    movedText: (item: String, position: Int, count: Int) -> String =
        rememberFromResources { r -> { item, position, count -> r.getString(R.string.stance_moved, item, position, count) } },
    contentPadding: PaddingValues = PaddingValues(),
    reverseLayout: Boolean = false,
    itemContent: @Composable (T) -> Unit,
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val haptics = LocalHapticFeedback.current
    val currentItems by rememberUpdatedState(items)
    val move by rememberUpdatedState(onMove)
    var dragging by remember { mutableStateOf<Any?>(null) }
    // Where the lifted row's leading edge is, in the list's own coordinates. It moves only with the finger.
    var dragStart by remember { mutableFloatStateOf(0f) }
    // The index a requested move is heading for, until the caller's new list arrives.
    var pendingTarget by remember { mutableIntStateOf(NO_MOVE) }
    var pendingWaits by remember { mutableIntStateOf(0) }
    var lastMoved by remember { mutableStateOf<Any?>(null) }

    fun moveBy(index: Int, delta: Int) {
        val target = index + delta
        if (target !in currentItems.indices) return
        lastMoved = key(currentItems[index])
        move(index, target)
    }

    // Moves the lifted row one place when it has passed the middle of a neighbour.
    fun settle() {
        val itemKey = dragging ?: return
        val from = currentItems.indexOfFirst { key(it) == itemKey }
        if (from < 0) return
        if (pendingTarget != NO_MOVE) {
            // A caller that ignores a move must not freeze the drag: give up waiting after a few events.
            if (from != pendingTarget && ++pendingWaits <= PENDING_EVENTS) return
            pendingTarget = NO_MOVE
        }
        val visible = state.layoutInfo.visibleItemsInfo
        // The layout still shows the old order for a frame after a move: wait for it.
        val slot = visible.firstOrNull { it.key == itemKey }?.takeIf { it.index == from } ?: return
        val target = stanceDragTarget(
            from,
            dragStart - slot.offset,
            visible.associate { it.index to it.offset },
            visible.associate { it.index to it.size },
        ) ?: return
        // The lazy list holds on to its first visible key. Pin the position instead, so the row
        // under the finger does not drag the whole list with it.
        if (from == state.firstVisibleItemIndex || target == state.firstVisibleItemIndex) {
            state.requestScrollToItem(state.firstVisibleItemIndex, state.firstVisibleItemScrollOffset)
        }
        pendingTarget = target
        pendingWaits = 0
        lastMoved = itemKey
        move(from, target)
        haptics.performHapticFeedback(HapticFeedbackType.SegmentFrequentTick)
    }

    val maxSpeed = with(LocalDensity.current) { (StanceSizes.touchTarget * AUTO_SCROLL_ROWS_PER_SECOND).toPx() }

    // The speed the list should scroll at right now, or 0 when the held row is inside the
    // viewport or the list has nowhere further to go.
    fun edgeSpeed(): Float {
        val info = state.layoutInfo
        val slot = info.visibleItemsInfo.firstOrNull { it.key == dragging } ?: return 0f
        val speed = stanceAutoScrollSpeed(
            itemStart = dragStart,
            itemEnd = dragStart + slot.size,
            viewportStart = 0f,
            viewportEnd = (info.viewportEndOffset - info.afterContentPadding).toFloat(),
            maxSpeed = maxSpeed,
        )
        return if ((speed > 0f && !state.canScrollForward) || (speed < 0f && !state.canScrollBackward)) 0f else speed
    }

    LaunchedEffect(dragging) {
        if (dragging == null) return@LaunchedEffect
        while (true) {
            // Nothing runs until the held row reaches past an edge.
            snapshotFlow { edgeSpeed() != 0f }.first { it }
            var last = withFrameNanos { it }
            while (true) {
                val now = withFrameNanos { it }
                val speed = edgeSpeed()
                if (speed == 0f) break
                val scrolled = state.scrollBy(speed * (now - last) / NANOS_PER_SECOND)
                last = now
                if (scrolled != 0f) settle()
            }
        }
    }

    LazyColumn(
        modifier = modifier.semantics { if (label != null) contentDescription = label },
        state = state,
        contentPadding = contentPadding,
        reverseLayout = reverseLayout,
    ) {
        itemsIndexed(items, key = { _, item -> key(item) }) { index, item ->
            val itemKey = key(item)
            val isDragging = itemKey == dragging
            val name = itemLabel(item)
            Row(
                modifier = Modifier
                    .then(
                        if (isDragging) {
                            Modifier
                        } else {
                            Modifier.animateItem(
                                fadeInSpec = null,
                                placementSpec = if (motion.reduceMotion) null else motion.normal(),
                                fadeOutSpec = null,
                            )
                        },
                    )
                    .zIndex(if (isDragging) 1f else 0f)
                    .graphicsLayer {
                        // Read at draw time from the layout of this frame, so a move or a scroll never shows as a jump.
                        val slot = if (isDragging) state.layoutInfo.visibleItemsInfo.firstOrNull { it.key == itemKey } else null
                        translationY = if (slot == null) 0f else stanceDragAlongList(dragStart - slot.offset, state.layoutInfo.reverseLayout)
                    }
                    .then(if (isDragging) Modifier.shadow(StanceTheme.elevation.lg.shadow, StanceTheme.shapes.medium) else Modifier)
                    .background(if (isDragging) c.bgSurfaceRaised else c.bgSurface, StanceTheme.shapes.medium)
                    .fillMaxWidth()
                    .heightIn(min = StanceSizes.touchTarget)
                    .semantics(mergeDescendants = true) {
                        if (enabled) {
                            customActions = buildList {
                                if (index > 0) add(CustomAccessibilityAction(moveUpLabel) { moveBy(index, -1); true })
                                if (index < items.lastIndex) add(CustomAccessibilityAction(moveDownLabel) { moveBy(index, 1); true })
                            }
                        }
                        if (itemKey == lastMoved) {
                            stateDescription = movedText(name, index + 1, items.size)
                            liveRegion = LiveRegionMode.Polite
                        }
                    },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
            ) {
                val drag = if (!enabled) {
                    Modifier
                } else {
                    Modifier.pointerInput(itemKey) {
                        detectDragGestures(
                            onDragStart = {
                                val slot = state.layoutInfo.visibleItemsInfo.firstOrNull { it.key == itemKey }
                                if (slot != null) {
                                    dragStart = slot.offset.toFloat()
                                    pendingTarget = NO_MOVE
                                    dragging = itemKey
                                    haptics.performHapticFeedback(HapticFeedbackType.GestureThresholdActivate)
                                }
                            },
                            onDragEnd = {
                                dragging = null
                                haptics.performHapticFeedback(HapticFeedbackType.GestureEnd)
                            },
                            onDragCancel = { dragging = null },
                            onDrag = { change, amount ->
                                change.consume()
                                dragStart += stanceDragAlongList(amount.y, state.layoutInfo.reverseLayout)
                                settle()
                            },
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .size(StanceSizes.touchTarget)
                        .clearAndSetSemantics { contentDescription = handleDescription(name) }
                        .then(drag),
                    contentAlignment = Alignment.Center,
                ) {
                    StanceIcon(StanceIcons.GripVertical, contentDescription = null, size = StanceSizes.iconMedium, tint = if (enabled) c.fgMuted else c.fgDisabled)
                }
                Box(modifier = Modifier.weight(1f)) { itemContent(item) }
                if (showMoveButtons) {
                    StanceIconButton(StanceIcons.ChevronUp, moveUpLabel, onClick = { moveBy(index, -1) }, enabled = enabled && index > 0)
                    StanceIconButton(StanceIcons.ChevronDown, moveDownLabel, onClick = { moveBy(index, 1) }, enabled = enabled && index < items.lastIndex)
                }
            }
        }
    }
}

private const val NO_MOVE = -1

// The fastest edge scroll, in rows of the minimum height per second.
private const val AUTO_SCROLL_ROWS_PER_SECOND = 12

// Drag events to wait for the caller's reordered list before a move is taken as ignored.
private const val PENDING_EVENTS = 4
private const val NANOS_PER_SECOND = 1_000_000_000f
