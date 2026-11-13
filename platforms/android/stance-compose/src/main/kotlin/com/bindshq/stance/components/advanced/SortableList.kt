package com.bindshq.stance.components.advanced

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
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
 * A list people can reorder by dragging a handle, with move up and move down actions as an
 * alternative.
 *
 * Built on [LazyColumn] with stable keys. Dragging the grip handle lifts the row, and the other rows
 * ease out of the way with the motion tokens, or at once when animations are off. Every row has
 * Move up and Move down screen reader actions, and [showMoveButtons] shows them as buttons for
 * people who cannot drag (WCAG 2.5.7). After a move, the row's new position is announced.
 *
 * @param key A stable key for each item.
 * @param itemLabel Plain text for an item, used to name its handle and in announcements.
 * @param onMove Called with the indexes of a move. Apply it with [stanceMove].
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
    itemContent: @Composable (T) -> Unit,
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val haptics = LocalHapticFeedback.current
    val currentItems by rememberUpdatedState(items)
    val move by rememberUpdatedState(onMove)
    var dragging by remember { mutableStateOf<Any?>(null) }
    var dragOffset by remember { mutableFloatStateOf(0f) }
    var lastMoved by remember { mutableStateOf<Any?>(null) }

    fun moveBy(index: Int, delta: Int) {
        val target = index + delta
        if (target !in currentItems.indices) return
        lastMoved = key(currentItems[index])
        move(index, target)
    }

    LazyColumn(
        modifier = modifier.semantics { if (label != null) contentDescription = label },
        state = state,
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
                    .graphicsLayer { translationY = if (isDragging) dragOffset else 0f }
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
                                dragging = itemKey
                                dragOffset = 0f
                                haptics.performHapticFeedback(HapticFeedbackType.GestureThresholdActivate)
                            },
                            onDragEnd = {
                                dragging = null
                                dragOffset = 0f
                                haptics.performHapticFeedback(HapticFeedbackType.GestureEnd)
                            },
                            onDragCancel = {
                                dragging = null
                                dragOffset = 0f
                            },
                            onDrag = { change, amount ->
                                change.consume()
                                dragOffset += amount.y
                                val from = currentItems.indexOfFirst { key(it) == itemKey }
                                val visible = state.layoutInfo.visibleItemsInfo
                                val target = stanceDragTarget(
                                    from,
                                    dragOffset,
                                    visible.associate { it.index to it.offset },
                                    visible.associate { it.index to it.size },
                                )
                                if (target != null) {
                                    val neighbour = visible.first { it.index == target }
                                    // The row moves by its neighbour's height, so the finger stays on it.
                                    dragOffset += if (target > from) -neighbour.size else neighbour.size
                                    lastMoved = itemKey
                                    move(from, target)
                                    haptics.performHapticFeedback(HapticFeedbackType.SegmentFrequentTick)
                                }
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
