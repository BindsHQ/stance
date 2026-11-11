@file:OptIn(ExperimentalMaterial3Api::class)

package com.bindshq.stance.components.advanced

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.data.StanceEmptyState
import com.bindshq.stance.components.forms.StanceFilterChip
import com.bindshq.stance.components.forms.StanceSearchBar
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.foundation.colors
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * Wraps scrollable content with the platform pull-to-refresh gesture.
 * Also offer a refresh action elsewhere for people who cannot perform the gesture.
 */
@Composable
public fun StancePullToRefresh(
    refreshing: Boolean,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val state = rememberPullToRefreshState()
    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = onRefresh,
        modifier = modifier,
        state = state,
        indicator = {
            PullToRefreshDefaults.Indicator(
                state = state,
                isRefreshing = refreshing,
                modifier = Modifier.align(Alignment.TopCenter),
                containerColor = StanceTheme.colors.bgOverlay,
                color = StanceTheme.colors.accentBg,
            )
        },
    ) { content() }
}

/** An action revealed by swiping a row. */
@Immutable
public data class StanceSwipeAction(
    val label: String,
    val icon: ImageVector,
    val tone: StanceTone = StanceTone.Neutral,
    val onAction: () -> Unit,
)

/**
 * Reveals an action when a row is swiped. The same actions are exposed as accessibility
 * custom actions, so TalkBack and Switch Access users can perform them without the gesture.
 *
 * @param endAction Triggered by swiping from the end edge towards the start (typically delete).
 * @param startAction Triggered by swiping from the start edge (typically archive or mark as read).
 */
@Composable
public fun StanceSwipeActions(
    modifier: Modifier = Modifier,
    startAction: StanceSwipeAction? = null,
    endAction: StanceSwipeAction? = null,
    content: @Composable () -> Unit,
) {
    val state = rememberSwipeToDismissBoxState()
    LaunchedEffect(state.currentValue) {
        when (state.currentValue) {
            SwipeToDismissBoxValue.StartToEnd -> startAction?.onAction?.invoke()
            SwipeToDismissBoxValue.EndToStart -> endAction?.onAction?.invoke()
            SwipeToDismissBoxValue.Settled -> Unit
        }
        if (state.currentValue != SwipeToDismissBoxValue.Settled) state.reset()
    }
    SwipeToDismissBox(
        state = state,
        modifier = modifier.semantics {
            customActions = listOfNotNull(startAction, endAction).map { action ->
                CustomAccessibilityAction(action.label) {
                    action.onAction()
                    true
                }
            }
        },
        enableDismissFromStartToEnd = startAction != null,
        enableDismissFromEndToStart = endAction != null,
        backgroundContent = {
            val action = if (state.dismissDirection == SwipeToDismissBoxValue.StartToEnd) startAction else endAction
            if (action != null) {
                val tone = action.tone.colors()
                Row(
                    modifier = Modifier.fillMaxSize().background(tone.solid).padding(horizontal = StanceSpacing.space6),
                    horizontalArrangement = if (action === startAction) Arrangement.Start else Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    StanceIcon(action.icon, contentDescription = null, tint = tone.onSolid)
                    Text(action.label, style = StanceTheme.typography.label, color = tone.onSolid, modifier = Modifier.padding(start = StanceSpacing.space2))
                }
            }
        },
    ) { Box(Modifier.background(StanceTheme.colors.bgSurface)) { content() } }
}

/**
 * A search field over a filtered list, with a result count announced as people type
 * and an empty state when nothing matches.
 *
 * @param matches Returns whether an item matches the query. Called for every item on each change.
 */
@Composable
public fun <T> StanceSearchableList(
    items: List<T>,
    matches: (item: T, query: String) -> Boolean,
    modifier: Modifier = Modifier,
    placeholder: String = "Search",
    key: ((T) -> Any)? = null,
    resultsDescription: (Int) -> String = { count -> if (count == 1) "1 result" else "$count results" },
    emptyTitle: String = "No results",
    emptyDescription: (String) -> String = { query -> "Nothing matches “$query”." },
    itemContent: @Composable (T) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    val results = remember(items, query) { if (query.isBlank()) items else items.filter { matches(it, query.trim()) } }
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceSearchBar(query = query, onQueryChange = { query = it }, placeholder = placeholder, modifier = Modifier.padding(horizontal = StanceSpacing.space4))
        Text(
            resultsDescription(results.size),
            style = StanceTheme.typography.caption,
            color = StanceTheme.colors.fgMuted,
            modifier = Modifier.padding(horizontal = StanceSpacing.space4).semantics { liveRegion = LiveRegionMode.Polite },
        )
        if (results.isEmpty()) {
            StanceEmptyState(title = emptyTitle, description = if (query.isBlank()) null else emptyDescription(query), icon = StanceIcons.Search)
        } else {
            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                items(results, key = key) { item -> itemContent(item) }
            }
        }
    }
}

/** A filter shown in a [StanceFilterBar]. */
@Immutable
public data class StanceFilter(val id: String, val label: String, val selected: Boolean)

/**
 * A horizontally scrolling row of filter chips with a "Clear all" action when any filter is active.
 */
@Composable
public fun StanceFilterBar(
    filters: List<StanceFilter>,
    onToggle: (id: String) -> Unit,
    onClearAll: () -> Unit,
    modifier: Modifier = Modifier,
    clearAllLabel: String = "Clear all",
) {
    Row(
        modifier = modifier.horizontalScroll(rememberScrollState()).padding(horizontal = StanceSpacing.space4),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        filters.forEach { filter ->
            StanceFilterChip(label = filter.label, selected = filter.selected, onClick = { onToggle(filter.id) })
        }
        if (filters.any { it.selected }) {
            StanceButton(clearAllLabel, onClick = onClearAll, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small)
        }
    }
}
