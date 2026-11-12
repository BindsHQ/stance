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
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationVector1D
import androidx.compose.animation.core.VectorConverter
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.material3.TabIndicatorScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.unit.Dp
import kotlinx.coroutines.launch
import com.bindshq.stance.foundation.defaultPageDescription
import com.bindshq.stance.foundation.defaultStepDescription
import com.bindshq.stance.foundation.defaultStepStateLabel
import com.bindshq.stance.foundation.fadeEnter
import com.bindshq.stance.foundation.fadeExit

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
            indicator = { StanceTabIndicator(selectedIndex) },
            tabs = content,
        )
    } else {
        PrimaryTabRow(
            selectedTabIndex = selectedIndex,
            modifier = modifier,
            containerColor = c.bgCanvas,
            contentColor = c.fgDefault,
            indicator = { StanceTabIndicator(selectedIndex) },
            tabs = content,
        )
    }
}

/**
 * The selected tab indicator. It slides between tabs with the theme's `normal` motion and
 * jumps when animations are off. Positions are relative, so it follows right to left layouts.
 */
@Composable
private fun TabIndicatorScope.StanceTabIndicator(selectedIndex: Int) {
    val spec = StanceTheme.motion.normal<Dp>()
    val scope = rememberCoroutineScope()
    val slide = remember { TabIndicatorSlide() }
    TabRowDefaults.PrimaryIndicator(
        modifier = Modifier.tabIndicatorLayout { measurable, constraints, tabPositions ->
            val tab = tabPositions[selectedIndex.coerceIn(0, tabPositions.lastIndex)]
            val offset = slide.offset ?: Animatable(tab.left, Dp.VectorConverter).also { slide.offset = it }
            val width = slide.width ?: Animatable(tab.width, Dp.VectorConverter).also { slide.width = it }
            if (offset.targetValue != tab.left) scope.launch { offset.animateTo(tab.left, spec) }
            if (width.targetValue != tab.width) scope.launch { width.animateTo(tab.width, spec) }
            val placeable = measurable.measure(constraints.copy(minWidth = width.value.roundToPx(), maxWidth = width.value.roundToPx()))
            layout(constraints.maxWidth, constraints.maxHeight) {
                placeable.placeRelative(offset.value.roundToPx(), constraints.maxHeight - placeable.height)
            }
        }.wrapContentWidth(),
        color = StanceTheme.colors.fgDefault,
    )
}

/** Holds the indicator animations, created on the first measure so the indicator never slides in from zero. */
private class TabIndicatorSlide {
    var offset: Animatable<Dp, AnimationVector1D>? = null
    var width: Animatable<Dp, AnimationVector1D>? = null
}

/**
 * Dots showing the current page of a pager. Announced as "Page x of y".
 */
@Composable
public fun StancePagerIndicator(
    pageCount: Int,
    currentPage: Int,
    modifier: Modifier = Modifier,
    description: (current: Int, count: Int) -> String = defaultPageDescription(),
) {
    val c = StanceTheme.colors
    Row(
        modifier = modifier.clearAndSetSemantics { contentDescription = description(currentPage + 1, pageCount) },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(pageCount) { index ->
            val dot by animateColorAsState(if (index == currentPage) c.accentBg else c.borderStrong, StanceTheme.motion.fast(), label = "stance-pager-dot")
            Box(Modifier.size(StanceSpacing.space2).clip(CircleShape).background(dot))
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
 * @param stateLabel The spoken word for a step's state.
 * @param stepDescription The spoken position of a step, from its one-based number, the step count and its label.
 */
@Composable
public fun StanceStepper(
    steps: List<String>,
    currentStep: Int,
    modifier: Modifier = Modifier,
    errorSteps: Set<Int> = emptySet(),
    stateLabel: (StanceStepState) -> String = defaultStepStateLabel(),
    stepDescription: (step: Int, count: Int, label: String) -> String = defaultStepDescription(),
) {
    val motion = StanceTheme.motion
    val c = StanceTheme.colors
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
        steps.forEachIndexed { index, label ->
            val state = when {
                index in errorSteps -> StanceStepState.Error
                index < currentStep -> StanceStepState.Complete
                index == currentStep -> StanceStepState.Current
                else -> StanceStepState.Upcoming
            }
            val (targetFill, targetContent) = when (state) {
                StanceStepState.Complete, StanceStepState.Current -> c.accentBg to c.accentFg
                StanceStepState.Error -> c.dangerSolid to c.dangerOnSolid
                StanceStepState.Upcoming -> c.bgMuted to c.fgMuted
            }
            // Moving between steps eases the colours and swaps the mark instead of snapping.
            val fill by animateColorAsState(targetFill, motion.normal(), label = "stance-step-fill")
            val content by animateColorAsState(targetContent, motion.normal(), label = "stance-step-content")
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics(mergeDescendants = true) {
                        contentDescription = stepDescription(index + 1, steps.size, label)
                        stateDescription = stateLabel(state)
                    },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier.size(StanceSizes.controlSmall).clip(CircleShape).background(fill),
                    contentAlignment = Alignment.Center,
                ) {
                    AnimatedContent(
                        targetState = state,
                        transitionSpec = { motion.fadeEnter() togetherWith motion.fadeExit() },
                        contentAlignment = Alignment.Center,
                        label = "stance-step-mark",
                    ) { mark ->
                        when (mark) {
                            StanceStepState.Complete -> StanceIcon(StanceIcons.Check, null, size = StanceSizes.iconSmall, tint = content)
                            StanceStepState.Error -> StanceIcon(StanceIcons.AlertCircle, null, size = StanceSizes.iconSmall, tint = content)
                            else -> Text("${index + 1}", style = StanceTheme.typography.labelSmall, color = content, modifier = Modifier.clearAndSetSemantics {})
                        }
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
                val connector by animateColorAsState(if (index < currentStep) c.accentBg else c.borderDefault, motion.normal(), label = "stance-step-connector")
                Box(
                    Modifier
                        .padding(start = StanceSizes.controlSmall / 2)
                        .width(StanceSpacing.hairline * 2)
                        .height(StanceSpacing.space4)
                        .background(connector),
                )
            }
        }
    }
}
