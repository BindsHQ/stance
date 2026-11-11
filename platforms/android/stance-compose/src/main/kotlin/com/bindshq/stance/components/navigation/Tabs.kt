package com.bindshq.stance.components.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.PrimaryScrollableTabRow
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextOverflow
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * Switches between views of the same context. Tabs are announced with their position and
 * selected state.
 *
 * @param scrollable Use for many tabs or long labels; tabs then scroll horizontally instead of sharing the width.
 */
@Composable
public fun StanceTabs(
    tabs: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    scrollable: Boolean = false,
) {
    val c = StanceTheme.colors
    val content: @Composable () -> Unit = {
        tabs.forEachIndexed { index, label ->
            Tab(
                selected = index == selectedIndex,
                onClick = { onSelect(index) },
                text = { Text(label, style = StanceTheme.typography.label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                selectedContentColor = c.fgDefault,
                unselectedContentColor = c.fgMuted,
            )
        }
    }
    if (scrollable) {
        PrimaryScrollableTabRow(
            selectedTabIndex = selectedIndex,
            modifier = modifier,
            containerColor = c.bgCanvas,
            contentColor = c.fgDefault,
            edgePadding = StanceSpacing.space4,
            indicator = { TabRowDefaults.PrimaryIndicator(Modifier.tabIndicatorOffset(selectedIndex), color = c.fgDefault) },
            tabs = content,
        )
    } else {
        PrimaryTabRow(
            selectedTabIndex = selectedIndex,
            modifier = modifier,
            containerColor = c.bgCanvas,
            contentColor = c.fgDefault,
            indicator = { TabRowDefaults.PrimaryIndicator(Modifier.tabIndicatorOffset(selectedIndex), color = c.fgDefault) },
            tabs = content,
        )
    }
}

/**
 * Dots showing the current page of a pager. Announced as "Page x of y".
 */
@Composable
public fun StancePagerIndicator(
    pageCount: Int,
    currentPage: Int,
    modifier: Modifier = Modifier,
    description: (current: Int, count: Int) -> String = { current, count -> "Page $current of $count" },
) {
    val c = StanceTheme.colors
    Row(
        modifier = modifier.clearAndSetSemantics { contentDescription = description(currentPage + 1, pageCount) },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(pageCount) { index ->
            Box(
                Modifier
                    .size(StanceSpacing.space2)
                    .clip(CircleShape)
                    .background(if (index == currentPage) c.accentBg else c.borderStrong),
            )
        }
    }
}

/** Progress of one step in a [StanceStepper]. */
public enum class StanceStepState { Complete, Current, Upcoming, Error }

/**
 * Shows progress through a multi-step flow. Each step is announced with its position and state,
 * for example "Step 2 of 4, Recipients, current".
 *
 * @param currentStep Zero-based index of the current step. Earlier steps are complete.
 * @param errorSteps Indices of steps that need attention.
 */
@Composable
public fun StanceStepper(
    steps: List<String>,
    currentStep: Int,
    modifier: Modifier = Modifier,
    errorSteps: Set<Int> = emptySet(),
    stateLabel: (StanceStepState) -> String = { it.name.lowercase() },
) {
    val c = StanceTheme.colors
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
        steps.forEachIndexed { index, label ->
            val state = when {
                index in errorSteps -> StanceStepState.Error
                index < currentStep -> StanceStepState.Complete
                index == currentStep -> StanceStepState.Current
                else -> StanceStepState.Upcoming
            }
            val (fill, content) = when (state) {
                StanceStepState.Complete, StanceStepState.Current -> c.accentBg to c.accentFg
                StanceStepState.Error -> c.dangerSolid to c.dangerOnSolid
                StanceStepState.Upcoming -> c.bgMuted to c.fgMuted
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics(mergeDescendants = true) {
                        contentDescription = "Step ${index + 1} of ${steps.size}, $label"
                        stateDescription = stateLabel(state)
                    },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier.size(StanceSizes.controlSmall).clip(CircleShape).background(fill),
                    contentAlignment = Alignment.Center,
                ) {
                    when (state) {
                        StanceStepState.Complete -> StanceIcon(StanceIcons.Check, null, size = StanceSizes.iconSmall, tint = content)
                        StanceStepState.Error -> StanceIcon(StanceIcons.AlertCircle, null, size = StanceSizes.iconSmall, tint = content)
                        else -> Text("${index + 1}", style = StanceTheme.typography.labelSmall, color = content, modifier = Modifier.clearAndSetSemantics {})
                    }
                }
                Spacer(Modifier.width(StanceSpacing.space3))
                Text(
                    label,
                    style = if (state == StanceStepState.Current) StanceTheme.typography.title else StanceTheme.typography.body,
                    color = if (state == StanceStepState.Upcoming) c.fgMuted else c.fgDefault,
                    modifier = Modifier.clearAndSetSemantics {},
                )
            }
            if (index < steps.lastIndex) {
                Box(
                    Modifier
                        .padding(start = StanceSizes.controlSmall / 2)
                        .width(StanceSpacing.hairline * 2)
                        .height(StanceSpacing.space4)
                        .background(if (index < currentStep) c.accentBg else c.borderDefault),
                )
            }
        }
    }
}
