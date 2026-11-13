package com.bindshq.stance.components.ai

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.animateScrollBy
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceDropdownMenu
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.data.StanceEmptyState
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.fadeEnter
import com.bindshq.stance.foundation.fadeExit
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.launch

/** What [StanceThread] looks at to decide whether to follow the newest content. */
internal data class ThreadSnapshot(
    val itemCount: Int,
    /** Height of the last item when it is in view, or -1. */
    val lastItemSize: Int,
    val viewportSize: Int,
    val canScrollForward: Boolean,
)

/**
 * Whether the thread stays pinned to the newest content after the list changed from
 * [previous] to [current].
 *
 * Being at the bottom always pins. Away from the bottom, a change in content (a new item, a
 * growing last item or a resized viewport) keeps the earlier answer, and a change in scroll
 * position alone, or any change while [userScrolling], releases the pin.
 */
internal fun stanceThreadPinned(pinned: Boolean, previous: ThreadSnapshot?, current: ThreadSnapshot, userScrolling: Boolean): Boolean = when {
    !current.canScrollForward -> true
    userScrolling -> false
    previous == null || threadContentChanged(previous, current) -> pinned
    else -> false
}

internal fun threadContentChanged(previous: ThreadSnapshot, current: ThreadSnapshot): Boolean =
    previous.itemCount != current.itemCount ||
        previous.viewportSize != current.viewportSize ||
        // The last item grew. When it only entered or left the viewport, that is a scroll.
        (previous.lastItemSize >= 0 && current.lastItemSize >= 0 && previous.lastItemSize != current.lastItemSize)

/**
 * Scroll state of a [StanceThread]. Create it with [rememberStanceThreadState].
 *
 * @property listState The list state of the thread's lazy column.
 */
@Stable
public class StanceThreadState internal constructor(public val listState: LazyListState) {
    internal var pinned by mutableStateOf(true)

    /** True while the thread follows the newest content. False once the reader scrolls up. */
    public val isPinned: Boolean get() = pinned

    /** True when the newest content is fully in view. */
    public val isAtBottom: Boolean by derivedStateOf { !listState.canScrollForward }

    /**
     * Scrolls to the newest content and pins the thread to it again.
     *
     * @param animate Pass false to jump, for example when animations are off.
     */
    public suspend fun scrollToLatest(animate: Boolean = true) {
        val last = listState.layoutInfo.totalItemsCount - 1
        if (last < 0) return
        pinned = true
        if (animate) {
            listState.animateScrollToItem(last)
            listState.animateScrollBy(listState.layoutInfo.viewportSize.height.toFloat() * LONG_ITEM_PAGES)
        }
        listState.scrollToItem(last, Int.MAX_VALUE)
    }
}

/**
 * Keeps the list on its newest content while it is pinned and [stick] allows, and releases the
 * pin as soon as the reader scrolls away. Runs until cancelled. Shared by [StanceThread] and
 * [StanceRunLog].
 */
internal suspend fun StanceThreadState.followNewest(stick: () -> Boolean) {
    var previous: ThreadSnapshot? = null
    snapshotFlow {
        val info = listState.layoutInfo
        val last = info.visibleItemsInfo.lastOrNull()
        ThreadSnapshot(
            itemCount = info.totalItemsCount,
            lastItemSize = if (last != null && last.index == info.totalItemsCount - 1) last.size else -1,
            viewportSize = info.viewportSize.height,
            canScrollForward = listState.canScrollForward,
        )
    }.collect { current ->
        pinned = stanceThreadPinned(pinned, previous, current, listState.isScrollInProgress)
        previous = current
        if (stick() && pinned && current.canScrollForward && current.itemCount > 0) {
            listState.scrollToItem(current.itemCount - 1, Int.MAX_VALUE)
        }
    }
}

// How many viewport heights the animated scroll covers past the top of a very tall last item.
private const val LONG_ITEM_PAGES = 4f

/** Remembers the scroll state of a [StanceThread]. */
@Composable
public fun rememberStanceThreadState(listState: LazyListState = rememberLazyListState()): StanceThreadState =
    remember(listState) { StanceThreadState(listState) }

/**
 * The scrolling container for a conversation, on a lazy column.
 *
 * It follows the newest content only while the reader is at the bottom. As soon as they
 * scroll up it releases, and streaming content that grows below never moves what they are
 * reading. Give every item a stable key so positions survive inserts.
 *
 * Screen readers reach it as a list named [label]. New responses are announced once, when
 * complete, by [StanceStreamingText].
 *
 * @param stickToBottom Follow the newest content while the reader is at the bottom.
 * @param onReachTop Called when the reader scrolls to the oldest loaded message, to load older ones.
 * @param scrollToLatest The floating control shown when the reader is away from the newest
 * content. Receives whether it should show and the scroll action.
 * @param content The messages, oldest first.
 */
@Composable
public fun StanceThread(
    modifier: Modifier = Modifier,
    state: StanceThreadState = rememberStanceThreadState(),
    stickToBottom: Boolean = true,
    onReachTop: (() -> Unit)? = null,
    label: String = stringResource(R.string.stance_ai_conversation),
    contentPadding: PaddingValues = PaddingValues(StanceSpacing.space4),
    verticalArrangement: Arrangement.Vertical = Arrangement.spacedBy(StanceSpacing.space4),
    scrollToLatest: @Composable (visible: Boolean, onClick: () -> Unit) -> Unit = { visible, onClick -> StanceScrollToLatest(visible, onClick) },
    content: LazyListScope.() -> Unit,
) {
    val listState = state.listState
    val stick by rememberUpdatedState(stickToBottom)
    LaunchedEffect(state) { state.followNewest { stick } }
    if (onReachTop != null) {
        val reachTop by rememberUpdatedState(onReachTop)
        LaunchedEffect(state) {
            snapshotFlow { listState.lastScrolledBackward && !listState.canScrollBackward }
                .distinctUntilChanged()
                .filter { it }
                .collect { reachTop() }
        }
    }
    val scope = rememberCoroutineScope()
    val animate = !StanceTheme.motion.reduceMotion
    val away by remember(state) { derivedStateOf { listState.canScrollForward && !state.pinned } }
    Box(modifier = modifier) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().semantics {
                contentDescription = label
                isTraversalGroup = true
            },
            state = listState,
            contentPadding = contentPadding,
            verticalArrangement = verticalArrangement,
            content = content,
        )
        Box(modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = StanceSpacing.space3)) {
            scrollToLatest(away) { scope.launch { state.scrollToLatest(animate) } }
        }
    }
}

/** Who a message is from. */
public enum class StanceMessageRole { User, Assistant, System }

/** How a message separates itself from the thread. */
public enum class StanceMessageVariant {
    /** On a filled, rounded surface. */
    Bubble,

    /** Directly on the thread, full width. */
    Plain,
}

@Composable
private fun StanceMessageRole.defaultAuthor(): String = stringResource(
    when (this) {
        StanceMessageRole.User -> R.string.stance_ai_role_user
        StanceMessageRole.Assistant -> R.string.stance_ai_role_assistant
        StanceMessageRole.System -> R.string.stance_ai_role_system
    },
)

private fun StanceMessageRole.alignment(): Alignment.Horizontal = when (this) {
    StanceMessageRole.User -> Alignment.End
    StanceMessageRole.Assistant -> Alignment.Start
    StanceMessageRole.System -> Alignment.CenterHorizontally
}

@Composable
private fun MessageHeader(
    role: StanceMessageRole,
    author: String,
    avatar: (@Composable () -> Unit)?,
    timestamp: String?,
    statusDescription: String?,
    actions: List<CustomAccessibilityAction>,
) {
    val c = StanceTheme.colors
    Row(
        modifier = Modifier.semantics(mergeDescendants = true) {
            heading()
            if (statusDescription != null) stateDescription = statusDescription
            if (actions.isNotEmpty()) customActions = actions
        },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(modifier = Modifier.clearAndSetSemantics { }) {
            when {
                avatar != null -> avatar()
                role == StanceMessageRole.Assistant -> Box(
                    modifier = Modifier.size(StanceSizes.controlSmall).clip(CircleShape).background(c.bgMuted),
                    contentAlignment = Alignment.Center,
                ) { StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgDefault) }
            }
        }
        Text(author, style = StanceTheme.typography.label, color = c.fgDefault)
        if (timestamp != null) Text(timestamp, style = StanceTheme.typography.caption, color = c.fgSubtle)
    }
}

/**
 * One turn in a conversation, from the user, the assistant or the system.
 *
 * With [showHeader] the author and time form a heading, so screen reader users can move
 * between messages by heading. The heading carries the [status] as its state ("Responding",
 * "Stopped", "Failed") and the [customActions]. Without a header, a user or system message is
 * read as one item that starts with the author and time.
 *
 * @param status Where this response is in its life. Leave as complete for finished messages.
 * @param author The name read and shown for this message. Defaults to the role.
 * @param avatar Drawn before the author. The assistant gets the sparkle mark when null.
 * @param timestamp The formatted time.
 * @param showHeader Shows the author row. Turn it off inside a [StanceMessageGroup].
 * @param customActions Screen reader actions for this message. Build them with
 * [rememberStanceMessageCustomActions] so they match the visible [StanceMessageActions].
 * @param actions Slot under the content, for [StanceMessageActions].
 * @param footer Slot under the content and above the actions, for sources or an interrupted state.
 */
@Composable
public fun StanceMessage(
    role: StanceMessageRole,
    modifier: Modifier = Modifier,
    status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    author: String = role.defaultAuthor(),
    avatar: (@Composable () -> Unit)? = null,
    timestamp: String? = null,
    variant: StanceMessageVariant = if (role == StanceMessageRole.User) StanceMessageVariant.Bubble else StanceMessageVariant.Plain,
    showHeader: Boolean = role == StanceMessageRole.Assistant,
    statusDescription: String? = status.description(),
    customActions: List<CustomAccessibilityAction> = emptyList(),
    actions: (@Composable () -> Unit)? = null,
    footer: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = StanceTheme.colors
    val separator = stringResource(R.string.stance_list_separator)
    val name = if (timestamp != null) author + separator + timestamp else author
    val failed = status == StanceGenerationStatus.Error
    val system = role == StanceMessageRole.System
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = role.alignment(),
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
    ) {
        if (showHeader) MessageHeader(role, author, avatar, timestamp, statusDescription, customActions)
        val named = if (!showHeader && role != StanceMessageRole.Assistant) {
            Modifier.semantics(mergeDescendants = true) {
                text = AnnotatedString(name)
                if (statusDescription != null) stateDescription = statusDescription
                if (customActions.isNotEmpty()) this.customActions = customActions
            }
        } else {
            Modifier.semantics { isTraversalGroup = true }
        }
        val shape = StanceTheme.shapes.large
        val body = when (variant) {
            StanceMessageVariant.Bubble -> Modifier
                .padding(
                    start = if (role == StanceMessageRole.User) StanceSpacing.space10 else StanceSpacing.none,
                    end = if (role == StanceMessageRole.Assistant) StanceSpacing.space10 else StanceSpacing.none,
                )
                .widthIn(max = StanceSizes.contentMaxWidth)
                .clip(shape)
                .background(c.bgMuted)
                .then(
                    when {
                        failed -> Modifier.border(StanceTheme.tokens.borderWidth.dp, c.dangerBorder, shape)
                        StanceTheme.isHighContrast -> Modifier.border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, shape)
                        else -> Modifier
                    },
                )
                .padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space3)
            StanceMessageVariant.Plain -> if (system) Modifier.widthIn(max = StanceSizes.contentMaxWidth) else Modifier.fillMaxWidth()
        }
        CompositionLocalProvider(LocalContentColor provides if (system) c.fgMuted else c.fgDefault) {
            ProvideTextStyle(
                if (system) StanceTheme.typography.caption.copy(textAlign = TextAlign.Center) else StanceTheme.typography.body,
            ) {
                Column(
                    modifier = named.then(body),
                    verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    content = content,
                )
            }
        }
        footer?.invoke()
        actions?.invoke()
    }
}

/**
 * Consecutive messages from one author under a single avatar and name.
 *
 * The author row is a heading. Put [StanceMessage]s with `showHeader = false` in [content].
 */
@Composable
public fun StanceMessageGroup(
    role: StanceMessageRole,
    modifier: Modifier = Modifier,
    author: String = role.defaultAuthor(),
    avatar: (@Composable () -> Unit)? = null,
    timestamp: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = role.alignment(),
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
    ) {
        MessageHeader(role, author, avatar, timestamp, statusDescription = null, actions = emptyList())
        content()
    }
}

/** The words of a [StanceMessageActions] row. Build with [StanceMessageActionsDefaults.labels]. */
@Immutable
public data class StanceMessageActionsLabels(
    val copy: String,
    val copied: String,
    val retry: String,
    val edit: String,
    val goodResponse: String,
    val badResponse: String,
)

/** Defaults for [StanceMessageActions]. */
public object StanceMessageActionsDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        copy: String = stringResource(R.string.stance_ai_copy),
        copied: String = stringResource(R.string.stance_ai_copied),
        retry: String = stringResource(R.string.stance_try_again),
        edit: String = stringResource(R.string.stance_ai_edit),
        goodResponse: String = stringResource(R.string.stance_ai_good_response),
        badResponse: String = stringResource(R.string.stance_ai_bad_response),
    ): StanceMessageActionsLabels = StanceMessageActionsLabels(copy, copied, retry, edit, goodResponse, badResponse)
}

/**
 * The row of actions under a message: copy, retry, edit, good response and bad response.
 *
 * Only actions with a callback are shown. The rating buttons are toggles and give haptic
 * feedback. After a copy, the button reads "Copied" for a moment as a polite live region.
 * Touch has no hover, so the web `visibility` option is the [visible] flag here: decide in
 * the app, for example the newest message only.
 *
 * @param onRate Called with the new rating, or null when the active one is tapped again.
 * @param content Extra actions after the built-in ones.
 */
@Composable
public fun StanceMessageActions(
    modifier: Modifier = Modifier,
    onCopy: (() -> Unit)? = null,
    onRetry: (() -> Unit)? = null,
    onEdit: (() -> Unit)? = null,
    onRate: ((StanceRating?) -> Unit)? = null,
    rating: StanceRating? = null,
    visible: Boolean = true,
    labels: StanceMessageActionsLabels = StanceMessageActionsDefaults.labels(),
    content: @Composable RowScope.() -> Unit = {},
) {
    val motion = StanceTheme.motion
    val haptics = LocalHapticFeedback.current
    var copied by remember { mutableStateOf(false) }
    LaunchedEffect(copied) {
        if (copied) {
            delay(COPIED_HOLD_MILLIS)
            copied = false
        }
    }
    AnimatedVisibility(visible = visible, modifier = modifier, enter = motion.fadeEnter(), exit = motion.fadeExit()) {
        Row(
            modifier = Modifier.semantics { isTraversalGroup = true },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (onCopy != null) {
                StanceIconButton(
                    icon = if (copied) StanceIcons.Check else StanceIcons.Copy,
                    contentDescription = if (copied) labels.copied else labels.copy,
                    onClick = {
                        onCopy()
                        copied = true
                    },
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                )
            }
            if (onRetry != null) StanceIconButton(StanceIcons.Refresh, labels.retry, onRetry)
            if (onEdit != null) StanceIconButton(StanceIcons.Pencil, labels.edit, onEdit)
            if (onRate != null) {
                AiIconToggle(StanceIcons.ThumbsUp, labels.goodResponse, checked = rating == StanceRating.Up, onCheckedChange = { on ->
                    haptics.performHapticFeedback(if (on) HapticFeedbackType.ToggleOn else HapticFeedbackType.ToggleOff)
                    onRate(if (on) StanceRating.Up else null)
                })
                AiIconToggle(StanceIcons.ThumbsDown, labels.badResponse, checked = rating == StanceRating.Down, onCheckedChange = { on ->
                    haptics.performHapticFeedback(if (on) HapticFeedbackType.ToggleOn else HapticFeedbackType.ToggleOff)
                    onRate(if (on) StanceRating.Down else null)
                })
            }
            content()
        }
    }
}

// How long the copy button reads "Copied". A reading time, not an animation, so it has no motion token.
private const val COPIED_HOLD_MILLIS = 2000L

/**
 * The same actions as a [StanceMessageActions] row, as screen reader custom actions for
 * [StanceMessage], so a message's actions are one swipe away from its heading.
 */
@Composable
public fun rememberStanceMessageCustomActions(
    onCopy: (() -> Unit)? = null,
    onRetry: (() -> Unit)? = null,
    onEdit: (() -> Unit)? = null,
    onRate: ((StanceRating?) -> Unit)? = null,
    rating: StanceRating? = null,
    labels: StanceMessageActionsLabels = StanceMessageActionsDefaults.labels(),
): List<CustomAccessibilityAction> {
    val copy by rememberUpdatedState(onCopy)
    val retry by rememberUpdatedState(onRetry)
    val edit by rememberUpdatedState(onEdit)
    val rate by rememberUpdatedState(onRate)
    return remember(onCopy != null, onRetry != null, onEdit != null, onRate != null, rating, labels) {
        buildList {
            if (onCopy != null) add(CustomAccessibilityAction(labels.copy) { copy?.invoke(); true })
            if (onRetry != null) add(CustomAccessibilityAction(labels.retry) { retry?.invoke(); true })
            if (onEdit != null) add(CustomAccessibilityAction(labels.edit) { edit?.invoke(); true })
            if (onRate != null) {
                add(CustomAccessibilityAction(labels.goodResponse) { rate?.invoke(if (rating == StanceRating.Up) null else StanceRating.Up); true })
                add(CustomAccessibilityAction(labels.badResponse) { rate?.invoke(if (rating == StanceRating.Down) null else StanceRating.Down); true })
            }
        }
    }
}

/**
 * Steps between alternative versions of a message after an edit or retry.
 *
 * Previous and next buttons around the position, for example "2 of 3". The position is a
 * polite live region. The buttons are disabled at the first and last version, and the arrows
 * mirror in right to left layouts. Nothing is shown for a single version.
 *
 * @param count Number of versions.
 * @param index The current version, starting at 0. Values outside the range are clamped.
 * @param onIndexChange Called with the new index, always inside the range.
 */
@Composable
public fun StanceBranchSwitcher(
    count: Int,
    index: Int,
    onIndexChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    previousLabel: String = stringResource(R.string.stance_ai_previous_version),
    nextLabel: String = stringResource(R.string.stance_ai_next_version),
    positionText: (current: Int, count: Int) -> String = defaultPositionText(),
) {
    if (count <= 1) return
    val current = index.coerceIn(0, count - 1)
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        StanceIconButton(StanceIcons.ChevronLeft, previousLabel, onClick = { onIndexChange(current - 1) }, enabled = current > 0)
        Text(
            positionText(current + 1, count),
            style = StanceTheme.typography.caption,
            color = StanceTheme.colors.fgMuted,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
        StanceIconButton(StanceIcons.ChevronRight, nextLabel, onClick = { onIndexChange(current + 1) }, enabled = current < count - 1)
    }
}

@Composable
internal fun defaultPositionText(): (Int, Int) -> String =
    rememberFromResources { r -> { current, count -> r.getString(R.string.stance_ai_position, current, count) } }

/**
 * A floating button that appears when the reader has scrolled away from the newest message.
 *
 * @param unreadCount Messages that arrived while the reader was away. Shown beside the arrow
 * and read as part of the name when above zero.
 */
@Composable
public fun StanceScrollToLatest(
    visible: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    unreadCount: Int = 0,
    label: String = if (unreadCount > 0) {
        pluralStringResource(R.plurals.stance_ai_scroll_to_latest_unread, unreadCount, unreadCount)
    } else {
        stringResource(R.string.stance_ai_scroll_to_latest)
    },
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    AnimatedVisibility(visible = visible, modifier = modifier, enter = motion.fadeEnter(), exit = motion.fadeExit()) {
        StanceSurface(
            modifier = Modifier.semantics { contentDescription = label },
            shape = StanceTheme.shapes.pill,
            color = c.bgSurfaceRaised,
            elevation = StanceTheme.elevation.md,
            bordered = true,
            onClick = onClick,
        ) {
            Row(
                modifier = Modifier
                    .heightIn(min = StanceSizes.touchTarget)
                    .widthIn(min = StanceSizes.touchTarget)
                    .padding(horizontal = StanceSpacing.space3),
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1, Alignment.CenterHorizontally),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                StanceIcon(StanceIcons.ArrowDown, contentDescription = null, size = StanceSizes.iconSmall)
                if (unreadCount > 0) {
                    Text(unreadCount.toString(), style = StanceTheme.typography.label, modifier = Modifier.clearAndSetSemantics { })
                }
            }
        }
    }
}

/**
 * A past conversation.
 *
 * @param updatedAt The formatted time of the last message.
 * @param group The date heading it belongs under, for example "Today".
 */
@Immutable
public data class StanceConversation(
    val id: String,
    val title: String,
    val updatedAt: String? = null,
    val group: String? = null,
    val pinned: Boolean = false,
)

/**
 * Orders conversations for display: pinned ones first under [pinnedLabel], then the rest
 * under their group in order of first appearance. A null key means no heading.
 */
internal fun stanceGroupConversations(items: List<StanceConversation>, pinnedLabel: String): List<Pair<String?, List<StanceConversation>>> {
    val (pinned, rest) = items.partition { it.pinned }
    val groups = LinkedHashMap<String?, MutableList<StanceConversation>>()
    rest.forEach { groups.getOrPut(it.group) { mutableListOf() }.add(it) }
    return buildList {
        if (pinned.isNotEmpty()) add(pinnedLabel to pinned)
        groups.forEach { (group, members) -> add(group to members) }
    }
}

/**
 * A list of past conversations grouped by date, with selection, rename, delete and pin.
 *
 * Group names are headings. The current conversation is announced as selected. Each row has
 * a menu button for its actions, and the same actions are screen reader custom actions.
 *
 * @param onRename Adds a rename action. Show your own dialog from it.
 * @param onDelete Adds a delete action.
 * @param onPin Adds a pin or unpin action. Receives the new pinned value.
 * @param emptyState Shown when [items] is empty.
 */
@Composable
public fun StanceConversationList(
    items: List<StanceConversation>,
    selectedId: String?,
    onSelect: (StanceConversation) -> Unit,
    modifier: Modifier = Modifier,
    onRename: ((StanceConversation) -> Unit)? = null,
    onDelete: ((StanceConversation) -> Unit)? = null,
    onPin: ((StanceConversation, pinned: Boolean) -> Unit)? = null,
    label: String = stringResource(R.string.stance_ai_conversations),
    pinnedLabel: String = stringResource(R.string.stance_ai_pinned),
    renameLabel: String = stringResource(R.string.stance_ai_rename),
    deleteLabel: String = stringResource(R.string.stance_ai_delete),
    pinLabel: String = stringResource(R.string.stance_ai_pin),
    unpinLabel: String = stringResource(R.string.stance_ai_unpin),
    moreDescription: (title: String) -> String = defaultMoreDescription(),
    emptyState: @Composable () -> Unit = {
        StanceEmptyState(
            title = stringResource(R.string.stance_ai_no_conversations),
            description = stringResource(R.string.stance_ai_no_conversations_description),
            icon = StanceIcons.Message,
        )
    },
) {
    if (items.isEmpty()) {
        Box(modifier = modifier) { emptyState() }
        return
    }
    val c = StanceTheme.colors
    val groups = remember(items, pinnedLabel) { stanceGroupConversations(items, pinnedLabel) }
    LazyColumn(
        modifier = modifier.semantics { contentDescription = label },
        contentPadding = PaddingValues(StanceSpacing.space2),
    ) {
        groups.forEach { (group, members) ->
            if (group != null) {
                item(key = "stance-group:$group", contentType = "group") {
                    Text(
                        group,
                        style = StanceTheme.typography.labelSmall,
                        color = c.fgMuted,
                        modifier = Modifier
                            .padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space2)
                            .semantics { heading() },
                    )
                }
            }
            items(members, key = { it.id }, contentType = { "conversation" }) { item ->
                val selected = item.id == selectedId
                val menu = remember(item, onRename != null, onDelete != null, onPin != null, renameLabel, deleteLabel, pinLabel, unpinLabel) {
                    buildList {
                        if (onPin != null) {
                            add(StanceMenuItem(if (item.pinned) unpinLabel else pinLabel, onClick = { onPin(item, !item.pinned) }, icon = StanceIcons.Pin))
                        }
                        if (onRename != null) add(StanceMenuItem(renameLabel, onClick = { onRename(item) }, icon = StanceIcons.Pencil))
                        if (onDelete != null) {
                            add(StanceMenuItem(deleteLabel, onClick = { onDelete(item) }, icon = StanceIcons.Trash, destructive = true, startsGroup = size > 0))
                        }
                    }
                }
                var menuOpen by remember { mutableStateOf(false) }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = StanceSizes.touchTarget)
                        .clip(StanceTheme.shapes.medium)
                        .background(if (selected) c.interactiveSelected else Color.Transparent)
                        .selectable(selected = selected, onClick = { onSelect(item) })
                        .semantics {
                            if (menu.isNotEmpty()) {
                                customActions = menu.map { entry -> CustomAccessibilityAction(entry.label) { entry.onClick(); true } }
                            }
                        }
                        .padding(start = StanceSpacing.space3),
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (item.pinned) StanceIcon(StanceIcons.Pin, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
                    Column(modifier = Modifier.weight(1f).padding(vertical = StanceSpacing.space2)) {
                        Text(
                            item.title,
                            style = StanceTheme.typography.label,
                            color = if (selected) c.interactiveSelectedFg else c.fgDefault,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        if (item.updatedAt != null) Text(item.updatedAt, style = StanceTheme.typography.caption, color = c.fgMuted)
                    }
                    if (menu.isNotEmpty()) {
                        Box {
                            StanceIconButton(StanceIcons.MoreHorizontal, moreDescription(item.title), onClick = { menuOpen = true })
                            StanceDropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }, items = menu)
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun defaultMoreDescription(): (String) -> String =
    rememberFromResources { r -> { title -> r.getString(R.string.stance_ai_more_actions_for, title) } }

/** A suggested first prompt on a [StanceThreadEmptyState]. */
@Immutable
public data class StanceStarter(
    val id: String,
    val label: String,
    val description: String? = null,
    val icon: ImageVector? = null,
)

/**
 * The opening screen of a new conversation, with a greeting and starter prompts.
 *
 * The title is a heading. Each starter is one button.
 *
 * @param icon The mark above the title. The sparkle by default.
 */
@Composable
public fun StanceThreadEmptyState(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    icon: ImageVector = StanceIcons.Sparkle,
    starters: List<StanceStarter> = emptyList(),
    onStarterSelect: (StanceStarter) -> Unit = {},
) {
    val c = StanceTheme.colors
    Column(
        modifier = modifier.fillMaxWidth().padding(StanceSpacing.space6),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
    ) {
        Box(
            modifier = Modifier.size(StanceSizes.controlLarge + StanceSpacing.space2).clip(CircleShape).background(c.bgMuted),
            contentAlignment = Alignment.Center,
        ) { StanceIcon(icon, contentDescription = null, size = StanceSizes.iconLarge, tint = c.fgDefault) }
        Text(title, style = StanceTheme.typography.headingSmall, color = c.fgDefault, textAlign = TextAlign.Center, modifier = Modifier.semantics { heading() })
        if (description != null) {
            Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = StanceSizes.contentMaxWidth))
        }
        if (starters.isNotEmpty()) {
            Column(
                modifier = Modifier.widthIn(max = StanceSizes.contentMaxWidth).padding(top = StanceSpacing.space2),
                verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            ) {
                starters.forEach { starter ->
                    StanceCard(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { onStarterSelect(starter) },
                        contentPadding = PaddingValues(StanceSpacing.space3),
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3), verticalAlignment = Alignment.CenterVertically) {
                            if (starter.icon != null) StanceIcon(starter.icon, contentDescription = null, tint = c.fgMuted)
                            Column {
                                Text(starter.label, style = StanceTheme.typography.label, color = c.fgDefault)
                                if (starter.description != null) Text(starter.description, style = StanceTheme.typography.caption, color = c.fgMuted)
                            }
                        }
                    }
                }
            }
        }
    }
}
