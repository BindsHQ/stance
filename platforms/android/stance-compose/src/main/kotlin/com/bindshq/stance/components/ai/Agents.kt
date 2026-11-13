package com.bindshq.stance.components.ai

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.CollectionItemInfo
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.collectionItemInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.advanced.StanceSortableList
import com.bindshq.stance.components.advanced.stanceMove
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.components.data.StanceProgressIndicator
import com.bindshq.stance.components.data.StanceTimelineConnector
import com.bindshq.stance.components.data.StanceTreeNode
import com.bindshq.stance.components.data.StanceTreeView
import com.bindshq.stance.components.feedback.StanceBottomSheet
import com.bindshq.stance.components.forms.StanceInlineEdit
import com.bindshq.stance.components.forms.StanceSwitch
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.defaultStepDescription
import com.bindshq.stance.foundation.expandEnter
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.foundation.shrinkExit
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import kotlinx.coroutines.delay

// Wave two, agents: what an agent is doing, what it wants to do, and the person's say over it.
// The contract is specs/ai-components-wave-2.json.

private val idSetSaver = listSaver<Set<String>, String>(save = { it.toList() }, restore = { it.toSet() })

/**
 * The header of an AI disclosure: an icon, a title and a status, as one button that reports
 * Expanded or Collapsed. Its name carries the status, for example "Search the web, complete", and
 * a change of status is announced once through a polite live region.
 */
@Composable
private fun AgentDisclosureHeader(
    title: String,
    spoken: String,
    expanded: Boolean,
    onToggle: (() -> Unit)?,
    modifier: Modifier = Modifier,
    leading: @Composable () -> Unit,
    trailing: @Composable RowScope.() -> Unit = {},
) {
    val c = StanceTheme.colors
    val rotation by animateFloatAsState(if (expanded) HALF_TURN else 0f, StanceTheme.motion.fast(), label = "stance-agent-chevron")
    val expandedText = stringResource(R.string.stance_expanded)
    val collapsedText = stringResource(R.string.stance_collapsed)
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = StanceSizes.touchTarget)
            .then(
                if (onToggle != null) {
                    Modifier.stanceFocusRing(StanceTheme.shapes.medium).clickable(role = Role.Button, onClick = onToggle)
                } else {
                    Modifier
                },
            )
            .clearAndSetSemantics {
                contentDescription = spoken
                liveRegion = LiveRegionMode.Polite
                if (onToggle != null) {
                    role = Role.Button
                    stateDescription = if (expanded) expandedText else collapsedText
                    if (expanded) collapse { onToggle(); true } else expand { onToggle(); true }
                }
            }
            .padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space2),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        leading()
        Text(title, style = StanceTheme.typography.label, color = c.fgDefault, modifier = Modifier.weight(1f))
        trailing()
        if (onToggle != null) {
            StanceIcon(
                StanceIcons.ChevronDown,
                contentDescription = null,
                size = StanceSizes.iconSmall,
                tint = c.fgMuted,
                modifier = Modifier.graphicsLayer { rotationZ = rotation },
            )
        }
    }
}

/**
 * A row of a timeline: the rail at the start, as tall as the body beside it. The body is measured
 * first, so it may hold any content, including content that cannot report an intrinsic height.
 */
@Composable
private fun TimelineRailRow(modifier: Modifier = Modifier, rail: @Composable () -> Unit, body: @Composable () -> Unit) {
    Layout(content = { Box { rail() }; Box { body() } }, modifier = modifier) { measurables, constraints ->
        val railWidth = StanceSizes.iconMedium.roundToPx()
        val gap = StanceSpacing.space1.roundToPx()
        val bodyPlaceable = measurables[1].measure(
            constraints.copy(minWidth = 0, minHeight = 0, maxWidth = (constraints.maxWidth - railWidth - gap).coerceAtLeast(0)),
        )
        val railPlaceable = measurables[0].measure(Constraints.fixed(railWidth, bodyPlaceable.height))
        layout(constraints.constrainWidth(railWidth + gap + bodyPlaceable.width), bodyPlaceable.height) {
            railPlaceable.placeRelative(0, 0)
            bodyPlaceable.placeRelative(railWidth + gap, 0)
        }
    }
}

// ───────────── Tool call card ─────────────

/**
 * One tool call by the assistant: what it ran, with what input, and what came back.
 *
 * A disclosure with hoisted [expanded] state. The header is a button named by the title and the
 * status, for example "Search the web, complete", and a change of status is announced once. The
 * input and output are code blocks, highlighted when their language is known, and an [error] is
 * shown in the danger role with an icon and a label.
 *
 * @param name The identifier of the tool, shown in monospace under the title, for example `web.search`.
 * @param input What the tool was called with.
 * @param output What it returned.
 * @param error What went wrong, shown instead of the output.
 * @param durationSeconds How long the call took. Shown after the status when set.
 * @param actions Buttons under the body, such as retry.
 * @param content Shown in the body after the input and output, for a richer result than code.
 */
@Composable
public fun StanceToolCallCard(
    title: String,
    status: StanceStepStatus,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    name: String? = null,
    icon: ImageVector = StanceIcons.Terminal,
    input: String? = null,
    output: String? = null,
    error: String? = null,
    durationSeconds: Int? = null,
    inputLanguage: String? = "json",
    outputLanguage: String? = "json",
    statusLabel: String = stringResource(stepStatusLabelRes(status)),
    inputLabel: String = stringResource(R.string.stance_ai_tool_input),
    outputLabel: String = stringResource(R.string.stance_ai_tool_output),
    errorLabel: String = stringResource(R.string.stance_ai_tool_error),
    durationText: String? = durationSeconds?.let { pluralStringResource(R.plurals.stance_ai_seconds, it, it) },
    actions: (@Composable RowScope.() -> Unit)? = null,
    content: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val hasBody = input != null || output != null || error != null || actions != null || content != null
    AiCard(modifier) {
        AgentDisclosureHeader(
            title = title,
            spoken = defaultNamedState()(title, statusLabel),
            expanded = expanded,
            onToggle = if (hasBody) ({ onExpandedChange(!expanded) }) else null,
            leading = { StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted) },
            trailing = {
                StepStatusMark(status)
                Text(
                    if (durationText != null) stringResource(R.string.stance_ai_named_state, statusLabel, durationText) else statusLabel,
                    style = StanceTheme.typography.caption,
                    color = if (status == StanceStepStatus.Error) c.dangerFg else c.fgMuted,
                )
            },
        )
        AnimatedVisibility(visible = expanded && hasBody, enter = motion.expandEnter(), exit = motion.shrinkExit()) {
            Column {
                StanceDivider()
                Column(modifier = Modifier.padding(StanceSpacing.space3), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
                    if (name != null) Text(name, style = StanceTheme.typography.code, color = c.fgMuted)
                    if (input != null) StanceCodeBlock(input, title = inputLabel, language = inputLanguage, wrap = true)
                    if (error != null) {
                        Row(
                            modifier = Modifier.semantics(mergeDescendants = true) { },
                            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                        ) {
                            StanceIcon(StanceIcons.AlertCircle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.dangerFg)
                            Column {
                                Text(errorLabel, style = StanceTheme.typography.label, color = c.dangerFg)
                                Text(error, style = StanceTheme.typography.bodySmall, color = c.fgDefault)
                            }
                        }
                    } else if (output != null) {
                        StanceCodeBlock(output, title = outputLabel, language = outputLanguage, wrap = true)
                    }
                    content?.invoke(this)
                    if (actions != null) Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), content = actions)
                }
            }
        }
    }
}

/** [StanceToolCallCard] that keeps its own expanded state. */
@Composable
public fun StanceToolCallCard(
    title: String,
    status: StanceStepStatus,
    modifier: Modifier = Modifier,
    name: String? = null,
    icon: ImageVector = StanceIcons.Terminal,
    input: String? = null,
    output: String? = null,
    error: String? = null,
    durationSeconds: Int? = null,
    initiallyExpanded: Boolean = false,
    actions: (@Composable RowScope.() -> Unit)? = null,
    content: (@Composable ColumnScope.() -> Unit)? = null,
) {
    var expanded by rememberSaveable { mutableStateOf(initiallyExpanded) }
    StanceToolCallCard(
        title = title,
        status = status,
        expanded = expanded,
        onExpandedChange = { expanded = it },
        modifier = modifier,
        name = name,
        icon = icon,
        input = input,
        output = output,
        error = error,
        durationSeconds = durationSeconds,
        actions = actions,
        content = content,
    )
}

// ───────────── Step timeline ─────────────

/**
 * One step of a [StanceStepTimeline].
 *
 * @param durationLabel The formatted time the step took, for example "12 s".
 * @param content Detail revealed when the step is expanded. A step without content does not expand.
 */
@Immutable
public data class StanceTimelineStep(
    val id: String,
    val title: String,
    val status: StanceStepStatus,
    val description: String? = null,
    val durationLabel: String? = null,
    val content: (@Composable ColumnScope.() -> Unit)? = null,
)

/**
 * The ordered steps of an agent run, on the rail of the Stance timeline, with hoisted
 * [expandedIds].
 *
 * It is a list: each step says its position, title and status, for example "Step 2 of 4, Draft
 * the email, running", the wording the Stance stepper uses. Status is an icon and words, never
 * colour alone. A step with content is a button that reports Expanded or Collapsed.
 *
 * @param compact Hides descriptions and tightens the rail, for a side panel.
 * @param statusLabel The words for a status.
 * @param stepDescription Builds the spoken position and title of a step.
 */
@Composable
public fun StanceStepTimeline(
    steps: List<StanceTimelineStep>,
    expandedIds: Set<String>,
    onExpandedChange: (Set<String>) -> Unit,
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    label: String = stringResource(R.string.stance_ai_steps),
    statusLabel: (StanceStepStatus) -> String = defaultStepStatusLabel(),
    stepDescription: (step: Int, count: Int, title: String) -> String = defaultStepDescription(),
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val named = defaultNamedState()
    Column(
        modifier = modifier.fillMaxWidth().semantics {
            contentDescription = label
            collectionInfo = CollectionInfo(rowCount = steps.size, columnCount = 1)
        },
    ) {
        steps.forEachIndexed { index, step ->
            key(step.id) {
                val expanded = step.id in expandedIds
                val status = statusLabel(step.status)
                TimelineRailRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .semantics { collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1) },
                    rail = {
                        // The status mark of the step, joined to the next one by the timeline connector.
                        Column(
                            modifier = Modifier.fillMaxSize().clearAndSetSemantics { },
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            // The mark sits on the centre line of the header, with the rail running into it and out of it.
                            val lead = (StanceSizes.touchTarget - StanceSizes.iconSmall) / 2
                            if (index > 0) {
                                StanceTimelineConnector(Modifier.height(lead - StanceSpacing.space1))
                                Spacer(Modifier.height(StanceSpacing.space1))
                            } else {
                                Spacer(Modifier.height(lead))
                            }
                            StepStatusMark(step.status)
                            if (index < steps.lastIndex) {
                                Spacer(Modifier.height(StanceSpacing.space1))
                                StanceTimelineConnector(Modifier.weight(1f))
                            }
                        }
                    },
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(bottom = if (compact) StanceSpacing.none else StanceSpacing.space2)) {
                        AgentDisclosureHeader(
                            title = step.title,
                            spoken = named(stepDescription(index + 1, steps.size, step.title), status),
                            expanded = expanded,
                            onToggle = if (step.content != null) ({ onExpandedChange(if (expanded) expandedIds - step.id else expandedIds + step.id) }) else null,
                            leading = { },
                            trailing = {
                                Text(
                                    step.durationLabel ?: status,
                                    style = StanceTheme.typography.caption,
                                    color = if (step.status == StanceStepStatus.Error) c.dangerFg else c.fgMuted,
                                )
                            },
                        )
                        if (step.description != null && !compact) {
                            Text(
                                step.description,
                                style = StanceTheme.typography.bodySmall,
                                color = c.fgMuted,
                                modifier = Modifier.padding(horizontal = StanceSpacing.space3),
                            )
                        }
                        if (step.content != null) {
                            AnimatedVisibility(visible = expanded, enter = motion.expandEnter(), exit = motion.shrinkExit()) {
                                ProvideTextStyle(StanceTheme.typography.bodySmall) {
                                    Column(
                                        modifier = Modifier.padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space2),
                                        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                                        content = step.content,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** [StanceStepTimeline] that keeps its own expanded steps, saved across configuration changes. */
@Composable
public fun StanceStepTimeline(
    steps: List<StanceTimelineStep>,
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    initiallyExpandedIds: Set<String> = emptySet(),
) {
    var expanded by rememberSaveable(stateSaver = idSetSaver) { mutableStateOf(initiallyExpandedIds) }
    StanceStepTimeline(steps, expanded, { expanded = it }, modifier, compact)
}

// ───────────── Plan checklist ─────────────

/** One step of a plan in a [StancePlanChecklist]. */
@Immutable
public data class StancePlanItem(
    val id: String,
    val title: String,
    val status: StanceStepStatus = StanceStepStatus.Pending,
    val description: String? = null,
)

/** The share of a plan that is done, from 0 to 1: complete and skipped steps over all steps. */
public fun stancePlanProgress(items: List<StancePlanItem>): Float =
    if (items.isEmpty()) 0f else items.count { it.status.isDone }.toFloat() / items.size

/**
 * The plan an agent proposes before it starts: steps to review, and when [editable] to rename,
 * reorder or remove, then approve or reject.
 *
 * The editable plan is a [StanceSortableList], so steps move by dragging the handle and by the
 * Move up and Move down accessibility actions, and each title is a [StanceInlineEdit]. Every
 * change is reported through [onItemsChange]; indexes are zero based. A progress summary heads
 * the list. Approve and reject give haptic feedback.
 *
 * @param editable Lets people rename, reorder and remove steps. Needs [onItemsChange].
 * @param progress From 0 to 1. Derived from the step statuses when null.
 * @param maxHeight The tallest the editable list grows before it scrolls.
 * @param progressText The progress in words, from the number of steps done and the total.
 * @param removeDescription Names a step's remove button, for example "Remove Send the email".
 */
@Composable
public fun StancePlanChecklist(
    items: List<StancePlanItem>,
    modifier: Modifier = Modifier,
    title: String = stringResource(R.string.stance_ai_plan),
    editable: Boolean = false,
    onItemsChange: ((List<StancePlanItem>) -> Unit)? = null,
    onApprove: (() -> Unit)? = null,
    onReject: (() -> Unit)? = null,
    progress: Float? = null,
    maxHeight: Dp = StanceSizes.pickerMaxHeight,
    approveLabel: String = stringResource(R.string.stance_ai_plan_approve),
    rejectLabel: String = stringResource(R.string.stance_ai_plan_reject),
    stepLabel: String = stringResource(R.string.stance_ai_plan_step),
    statusLabel: (StanceStepStatus) -> String = defaultStepStatusLabel(),
    progressText: (done: Int, total: Int) -> String =
        rememberFromResources { r -> { done, total -> r.getString(R.string.stance_ai_plan_progress, done, total) } },
    removeDescription: (title: String) -> String = defaultRemoveDescription(),
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    val editing = editable && onItemsChange != null
    val current by rememberUpdatedState(items)
    AiCard(modifier) {
        Column(modifier = Modifier.padding(StanceSpacing.space4), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
            Text(title, style = StanceTheme.typography.title, color = c.fgDefault, modifier = Modifier.semantics { heading() })
            StanceProgressIndicator(
                progress = (progress ?: stancePlanProgress(items)).coerceIn(0f, 1f),
                label = progressText(items.count { it.status.isDone }, items.size),
                showValue = false,
            )
            if (editing) {
                StanceSortableList(
                    items = items,
                    key = { it.id },
                    itemLabel = { it.title },
                    onMove = { from, to -> onItemsChange?.invoke(current.stanceMove(from, to)) },
                    modifier = Modifier.heightIn(max = maxHeight),
                    label = title,
                ) { item ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StanceInlineEdit(
                            value = item.title,
                            onCommit = { text -> onItemsChange?.invoke(current.map { if (it.id == item.id) it.copy(title = text) else it }) },
                            label = stepLabel,
                            modifier = Modifier.weight(1f),
                            textStyle = StanceTheme.typography.bodySmall,
                        )
                        StanceIconButton(
                            StanceIcons.Trash,
                            removeDescription(item.title),
                            onClick = { onItemsChange?.invoke(current.filterNot { it.id == item.id }) },
                        )
                    }
                }
            } else {
                Column(modifier = Modifier.semantics { collectionInfo = CollectionInfo(rowCount = items.size, columnCount = 1) }) {
                    items.forEachIndexed { index, item ->
                        key(item.id) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = StanceSpacing.space15)
                                    .semantics(mergeDescendants = true) {
                                        collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1)
                                        stateDescription = statusLabel(item.status)
                                    },
                                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                            ) {
                                StepStatusMark(item.status, modifier = Modifier.padding(top = StanceSpacing.space05))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.title, style = StanceTheme.typography.bodySmall, color = if (item.status == StanceStepStatus.Skipped) c.fgMuted else c.fgDefault)
                                    if (item.description != null) Text(item.description, style = StanceTheme.typography.caption, color = c.fgMuted)
                                }
                            }
                        }
                    }
                }
            }
            if (onApprove != null || onReject != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                    if (onApprove != null) {
                        StanceButton(approveLabel, onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                            onApprove()
                        }, size = StanceButtonSize.Small, leadingIcon = StanceIcons.Check)
                    }
                    if (onReject != null) {
                        StanceButton(rejectLabel, onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.Reject)
                            onReject()
                        }, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small)
                    }
                }
            }
        }
    }
}

// ───────────── Approval prompt ─────────────

/** The words of a [StanceApprovalPrompt]. Build with [StanceApprovalPromptDefaults.labels]. */
@Immutable
public data class StanceApprovalLabels(
    val allow: String,
    val allowAlways: String,
    val deny: String,
    val risk: String,
    /** The action that stops the countdown, so the prompt waits for a decision. */
    val keepWaiting: String,
)

/** Defaults for [StanceApprovalPrompt]. */
public object StanceApprovalPromptDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        risk: StanceRiskLevel,
        allow: String = stringResource(R.string.stance_ai_approval_allow),
        allowAlways: String = stringResource(R.string.stance_ai_approval_allow_always),
        deny: String = stringResource(R.string.stance_ai_approval_deny),
        riskLabel: String = stringResource(riskLabelRes(risk)),
        keepWaiting: String = stringResource(R.string.stance_ai_approval_keep_waiting),
    ): StanceApprovalLabels = StanceApprovalLabels(allow, allowAlways, deny, riskLabel, keepWaiting)
}

/** Why a [StanceApprovalPrompt] denied. */
public enum class StanceDenyReason {
    /** The person pressed deny. */
    Deny,

    /** The person pressed Escape or used the back gesture. */
    Back,

    /** The countdown ran out. */
    Timeout,
}

/**
 * The button variant of the allow action. Only deny is ever the prominent, default action when
 * the risk is high: allowing a high risk action always takes a deliberate press on a quiet button.
 */
internal fun stanceAllowVariant(risk: StanceRiskLevel): StanceButtonVariant =
    if (risk == StanceRiskLevel.High) StanceButtonVariant.Outline else StanceButtonVariant.Primary

/** The button variant of the deny action, the safe default. */
internal fun stanceDenyVariant(risk: StanceRiskLevel): StanceButtonVariant =
    if (risk == StanceRiskLevel.High) StanceButtonVariant.Primary else StanceButtonVariant.Outline

/** The seconds left on an approval countdown after one more second, never below zero. */
internal fun stanceCountdownTick(remaining: Int): Int = (remaining - 1).coerceAtLeast(0)

/**
 * Asks for permission before the agent acts, as an inline card: the action, its effect and the
 * risk in words, with allow, allow always and deny.
 *
 * Deny is the safe default. Escape denies, and so does the back gesture while [denyOnBack] is
 * true. A [countdownSeconds] can only ever deny: when it runs out [onDeny] is called with
 * [StanceDenyReason.Timeout], and nothing here allows on its own. Keep waiting stops the countdown
 * and leaves the decision with the person. When the risk is high, allow is the quiet button and
 * never takes focus, so Enter cannot allow by accident. Allow and deny give haptic feedback.
 *
 * The countdown is shown in words and is not announced every second.
 *
 * @param onDeny Called once per denial with why: the deny button, Escape or back, or the countdown.
 * @param description The effect of the action in plain words.
 * @param onAllowAlways Shows "Always allow" when set.
 * @param busy Set while the decision is being applied: the buttons are disabled, allow shows progress and the countdown holds.
 * @param countdownSeconds Seconds until the prompt denies itself, or null for no limit.
 * @param requestFocus Moves focus to the deny button when the prompt appears.
 * @param details The command, the diff or anything else worth reading before deciding.
 */
@Composable
public fun StanceApprovalPrompt(
    title: String,
    onAllow: () -> Unit,
    onDeny: (StanceDenyReason) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    risk: StanceRiskLevel = StanceRiskLevel.Low,
    onAllowAlways: (() -> Unit)? = null,
    busy: Boolean = false,
    countdownSeconds: Int? = null,
    requestFocus: Boolean = false,
    denyOnBack: Boolean = true,
    labels: StanceApprovalLabels = StanceApprovalPromptDefaults.labels(risk),
    details: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    val deny by rememberUpdatedState(onDeny)
    val denyFocus = remember { FocusRequester() }
    var remaining by remember(countdownSeconds) { mutableIntStateOf(countdownSeconds?.coerceAtLeast(0) ?: 0) }
    // False once the person chose to keep waiting, or after the countdown has denied.
    var counting by remember(countdownSeconds) { mutableStateOf(countdownSeconds != null) }

    // The countdown only ever ends in a denial, and only once.
    if (counting && !busy) {
        LaunchedEffect(countdownSeconds) {
            while (remaining > 0) {
                delay(SECOND_MILLIS)
                remaining = stanceCountdownTick(remaining)
            }
            counting = false
            deny(StanceDenyReason.Timeout)
        }
    }
    BackHandler(enabled = denyOnBack && !busy) { deny(StanceDenyReason.Back) }
    LaunchedEffect(requestFocus) { if (requestFocus) runCatching { denyFocus.requestFocus() } }

    val shape = StanceTheme.shapes.large
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(c.bgSurface)
            .border(
                StanceTheme.tokens.controlBorderWidth.dp,
                if (risk == StanceRiskLevel.High) c.dangerBorder else c.borderStrong,
                shape,
            )
            .onPreviewKeyEvent { event ->
                if (event.key == Key.Escape && event.type == KeyEventType.KeyUp && !busy) {
                    deny(StanceDenyReason.Back)
                    true
                } else {
                    false
                }
            }
            .semantics { isTraversalGroup = true }
            .padding(StanceSpacing.space4),
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
    ) {
        Column(
            modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
            verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
        ) {
            RiskMark(risk, labels.risk)
            Text(title, style = StanceTheme.typography.title, color = c.fgDefault, modifier = Modifier.semantics { heading() })
            if (description != null) Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
        }
        if (details != null) Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2), content = details)
        if (counting) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    pluralStringResource(R.plurals.stance_ai_approval_countdown, remaining, remaining),
                    style = StanceTheme.typography.caption,
                    color = c.fgMuted,
                    modifier = Modifier.weight(1f, fill = false),
                )
                StanceButton(
                    labels.keepWaiting,
                    onClick = { counting = false },
                    variant = StanceButtonVariant.Ghost,
                    size = StanceButtonSize.Small,
                    enabled = !busy,
                )
            }
        }
        ApprovalActions(
            risk = risk,
            labels = labels,
            busy = busy,
            denyFocus = denyFocus,
            onAllow = {
                haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                onAllow()
            },
            onAllowAlways = onAllowAlways?.let { always ->
                {
                    haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                    always()
                }
            },
            onDeny = {
                haptics.performHapticFeedback(HapticFeedbackType.Reject)
                onDeny(StanceDenyReason.Deny)
            },
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ApprovalActions(
    risk: StanceRiskLevel,
    labels: StanceApprovalLabels,
    busy: Boolean,
    denyFocus: FocusRequester,
    onAllow: () -> Unit,
    onAllowAlways: (() -> Unit)?,
    onDeny: () -> Unit,
) {
    // Deny comes first in reading and focus order, so it is what Enter and Tab reach first.
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
    ) {
        StanceButton(labels.deny, onClick = onDeny, modifier = Modifier.focusRequester(denyFocus), variant = stanceDenyVariant(risk), size = StanceButtonSize.Small, enabled = !busy)
        StanceButton(labels.allow, onClick = onAllow, variant = stanceAllowVariant(risk), size = StanceButtonSize.Small, loading = busy)
        if (onAllowAlways != null) {
            StanceButton(labels.allowAlways, onClick = onAllowAlways, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, enabled = !busy)
        }
    }
}

// ───────────── Permission sheet ─────────────

/**
 * One thing an agent or connector may access, in a [StancePermissionSheet].
 *
 * @param required A permission the agent cannot work without. Its switch is on and disabled, and says why.
 * @param risk Shown in words beside the description when set.
 */
@Immutable
public data class StancePermission(
    val id: String,
    val title: String,
    val granted: Boolean,
    val description: String? = null,
    val required: Boolean = false,
    val risk: StanceRiskLevel? = null,
)

/** The [permissions] after the one with [id] is switched to [granted]. A required permission stays granted. */
public fun stanceSetPermission(permissions: List<StancePermission>, id: String, granted: Boolean): List<StancePermission> =
    permissions.map { if (it.id == id) it.copy(granted = granted || it.required) else it }

/**
 * A bottom sheet listing what an agent or connector may access, with a switch for each
 * permission, on [StanceBottomSheet] and [StanceSwitch].
 *
 * Compose it while it should be open. It dismisses on drag, back and scrim taps, which leaves the
 * permissions as they were until [onSave]. Required permissions are disabled and explained in
 * their description. Each switch is announced with its name, description and state.
 *
 * @param onPermissionsChange Called with the whole list after a switch is flipped.
 * @param saving Set while the choice is being stored: the sheet stays open and save shows progress.
 * @param requiredNote Added to the description of a required permission.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun StancePermissionSheet(
    onDismissRequest: () -> Unit,
    title: String,
    permissions: List<StancePermission>,
    onPermissionsChange: (List<StancePermission>) -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    saving: Boolean = false,
    saveLabel: String = stringResource(R.string.stance_save),
    cancelLabel: String = stringResource(R.string.stance_cancel),
    requiredNote: String = stringResource(R.string.stance_ai_permission_required),
    riskLabel: (StanceRiskLevel) -> String = defaultRiskLabel(),
) {
    val c = StanceTheme.colors
    val separator = stringResource(R.string.stance_list_separator)
    // Save sits at the bottom, so the sheet opens at its full height and never half way.
    StanceBottomSheet(
        onDismissRequest = { if (!saving) onDismissRequest() },
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        modifier = modifier,
        title = title,
    ) {
        if (description != null) Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
        Column(
            modifier = Modifier
                .weight(1f, fill = false)
                .verticalScroll(rememberScrollState())
                .semantics { contentDescription = title },
        ) {
            permissions.forEachIndexed { index, permission ->
                key(permission.id) {
                    val notes = listOfNotNull(
                        permission.description,
                        permission.risk?.let(riskLabel),
                        requiredNote.takeIf { permission.required },
                    )
                    StanceSwitch(
                        label = permission.title,
                        checked = permission.granted || permission.required,
                        onCheckedChange = { onPermissionsChange(stanceSetPermission(permissions, permission.id, it)) },
                        description = notes.joinToString(separator).ifEmpty { null },
                        enabled = !permission.required && !saving,
                        modifier = Modifier.padding(vertical = StanceSpacing.space2),
                    )
                    if (index < permissions.lastIndex) StanceDivider()
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2, Alignment.End),
        ) {
            StanceButton(cancelLabel, onClick = onDismissRequest, variant = StanceButtonVariant.Ghost, enabled = !saving)
            StanceButton(saveLabel, onClick = onSave, loading = saving)
        }
    }
}

// ───────────── Agent status pill ─────────────

/** What an agent is doing now. */
public enum class StanceAgentStatus { Idle, Working, Waiting, Done, Error, Paused }

/** Visual size of a [StanceAgentStatusPill]. */
public enum class StanceAgentStatusPillSize { Small, Medium }

private val StanceAgentStatus.icon: ImageVector
    get() = when (this) {
        StanceAgentStatus.Idle -> StanceIcons.Circle
        StanceAgentStatus.Working -> StanceIcons.Sparkle
        StanceAgentStatus.Waiting -> StanceIcons.Clock
        StanceAgentStatus.Done -> StanceIcons.CheckCircle
        StanceAgentStatus.Error -> StanceIcons.AlertCircle
        StanceAgentStatus.Paused -> StanceIcons.Square
    }

/**
 * A compact pill showing what an agent is doing now: idle, working, waiting for you, done,
 * failed or paused.
 *
 * Each status has its own icon and words, on the ink scale. It is a live region, so a change is
 * announced once: assertively when the agent starts waiting for the person, politely otherwise.
 * With [onClick] it is a button with a 48dp touch target.
 *
 * @param detail What exactly is happening, shown after the label, for example "Step 2 of 5".
 */
@Composable
public fun StanceAgentStatusPill(
    status: StanceAgentStatus,
    modifier: Modifier = Modifier,
    label: String = stringResource(
        when (status) {
            StanceAgentStatus.Idle -> R.string.stance_ai_agent_idle
            StanceAgentStatus.Working -> R.string.stance_ai_agent_working
            StanceAgentStatus.Waiting -> R.string.stance_ai_agent_waiting
            StanceAgentStatus.Done -> R.string.stance_ai_agent_done
            StanceAgentStatus.Error -> R.string.stance_ai_agent_error
            StanceAgentStatus.Paused -> R.string.stance_ai_agent_paused
        },
    ),
    detail: String? = null,
    onClick: (() -> Unit)? = null,
    size: StanceAgentStatusPillSize = StanceAgentStatusPillSize.Medium,
) {
    val c = StanceTheme.colors
    val shape = StanceTheme.shapes.pill
    val small = size == StanceAgentStatusPillSize.Small
    val spoken = if (detail != null) defaultNamedState()(label, detail) else label
    val emphasis = status == StanceAgentStatus.Waiting
    Row(
        modifier = modifier
            .then(if (onClick != null) Modifier.minimumInteractiveComponentSize().stanceFocusRing(shape) else Modifier)
            .clip(shape)
            .then(if (onClick != null) Modifier.clickable(role = Role.Button, onClick = onClick) else Modifier)
            .background(if (emphasis) c.bgInverse else c.bgMuted)
            .border(StanceTheme.tokens.borderWidth.dp, if (status == StanceAgentStatus.Error) c.dangerBorder else c.borderDefault, shape)
            .padding(
                horizontal = if (small) StanceSpacing.space2 else StanceSpacing.space3,
                vertical = if (small) StanceSpacing.space05 else StanceSpacing.space15,
            )
            .clearAndSetSemantics {
                contentDescription = spoken
                liveRegion = if (emphasis) LiveRegionMode.Assertive else LiveRegionMode.Polite
                if (onClick != null) role = Role.Button
            },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space15),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        val content = when {
            emphasis -> c.fgInverse
            status == StanceAgentStatus.Error -> c.dangerFg
            else -> c.fgDefault
        }
        val style = if (small) StanceTheme.typography.labelSmall else StanceTheme.typography.label
        StanceIcon(status.icon, contentDescription = null, size = StanceSizes.iconSmall, tint = content)
        if (status == StanceAgentStatus.Working) {
            StanceShimmerText(label, style = style, color = content)
        } else {
            Text(label, style = style, color = content)
        }
        if (detail != null) {
            Text(detail, style = style, color = if (emphasis) c.fgInverse else c.fgMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

// ───────────── Task queue ─────────────

/**
 * One task of a [StanceTaskQueue].
 *
 * @param progress From 0 to 1 while running, or null when the amount of work is not known.
 * @param detail What is happening, or why the task failed or waits.
 * @param startedAt The formatted start time.
 * @param paused A running task that is on hold. It reads as paused and offers resume instead of pause.
 */
@Immutable
public data class StanceAgentTask(
    val id: String,
    val title: String,
    val status: StanceStepStatus,
    val progress: Float? = null,
    val detail: String? = null,
    val startedAt: String? = null,
    val paused: Boolean = false,
)

/** The task actions a [StanceTaskQueue] offers on [task], in order. */
internal enum class StanceTaskAction { Pause, Resume, Cancel, Retry }

/**
 * The actions that fit [task]: pause a running task, resume a paused one, cancel anything not yet
 * finished, and retry a failed or skipped one.
 */
internal fun stanceTaskActions(task: StanceAgentTask): List<StanceTaskAction> {
    val running = task.status == StanceStepStatus.Running
    val paused = running && task.paused
    return buildList {
        if (running && !paused) add(StanceTaskAction.Pause)
        if (paused) add(StanceTaskAction.Resume)
        if (running || task.status == StanceStepStatus.Pending || task.status == StanceStepStatus.Waiting) add(StanceTaskAction.Cancel)
        if (task.status == StanceStepStatus.Error || task.status == StanceStepStatus.Skipped) add(StanceTaskAction.Retry)
    }
}

/** The words that name each task action of a [StanceTaskQueue]. Build with [StanceTaskQueueDefaults.labels]. */
@Immutable
public data class StanceTaskQueueLabels(
    val cancel: (String) -> String,
    val retry: (String) -> String,
    val pause: (String) -> String,
    val resume: (String) -> String,
)

/** Defaults for [StanceTaskQueue]. */
public object StanceTaskQueueDefaults {
    /** The built-in words, from string resources: each action names its task, for example "Cancel Export report". */
    @Composable
    public fun labels(): StanceTaskQueueLabels = rememberFromResources { r ->
        StanceTaskQueueLabels(
            cancel = { r.getString(R.string.stance_ai_task_cancel, it) },
            retry = { r.getString(R.string.stance_ai_task_retry, it) },
            pause = { r.getString(R.string.stance_ai_task_pause, it) },
            resume = { r.getString(R.string.stance_ai_task_resume, it) },
        )
    }
}

/**
 * The tasks an agent has queued, running and finished, with pause, cancel and retry on each.
 *
 * A list headed by a count summary. A running task shows its progress and can be paused or
 * cancelled, a paused one resumed or cancelled, a pending or waiting one cancelled, and a failed
 * or skipped one retried. Every action button names its task. Status is an icon and words.
 *
 * @param summary The count line, for example "Tasks: 4. Running: 1."
 * @param emptyText Shown when there are no tasks.
 * @param pausedLabel The status words of a paused task.
 */
@Composable
public fun StanceTaskQueue(
    tasks: List<StanceAgentTask>,
    modifier: Modifier = Modifier,
    onCancel: ((StanceAgentTask) -> Unit)? = null,
    onRetry: ((StanceAgentTask) -> Unit)? = null,
    onPause: ((StanceAgentTask) -> Unit)? = null,
    onResume: ((StanceAgentTask) -> Unit)? = null,
    onSelect: ((StanceAgentTask) -> Unit)? = null,
    label: String = stringResource(R.string.stance_ai_tasks),
    summary: String = stringResource(R.string.stance_ai_tasks_summary, tasks.size, tasks.count { it.status == StanceStepStatus.Running && !it.paused }),
    emptyText: String = stringResource(R.string.stance_ai_tasks_empty),
    statusLabel: (StanceStepStatus) -> String = defaultStepStatusLabel(),
    pausedLabel: String = stringResource(R.string.stance_ai_agent_paused),
    labels: StanceTaskQueueLabels = StanceTaskQueueDefaults.labels(),
) {
    val c = StanceTheme.colors
    AiCard(modifier.semantics { contentDescription = label }) {
        Text(
            summary,
            style = StanceTheme.typography.labelSmall,
            color = c.fgMuted,
            modifier = Modifier.padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space3).semantics { heading() },
        )
        StanceDivider()
        if (tasks.isEmpty()) {
            Text(emptyText, style = StanceTheme.typography.bodySmall, color = c.fgMuted, modifier = Modifier.padding(StanceSpacing.space4))
        }
        Column(modifier = Modifier.semantics { collectionInfo = CollectionInfo(rowCount = tasks.size, columnCount = 1) }) {
            tasks.forEachIndexed { index, task ->
                key(task.id) {
                    val paused = task.status == StanceStepStatus.Running && task.paused
                    val status = if (paused) pausedLabel else statusLabel(task.status)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = StanceSizes.touchTarget)
                            .semantics { collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1) }
                            .padding(start = StanceSpacing.space4, end = StanceSpacing.space1),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .then(if (onSelect != null) Modifier.clickable(role = Role.Button) { onSelect(task) } else Modifier)
                                .semantics(mergeDescendants = true) { stateDescription = status }
                                .padding(vertical = StanceSpacing.space2),
                            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            StepStatusMark(if (paused) StanceStepStatus.Pending else task.status)
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space05)) {
                                Text(task.title, style = StanceTheme.typography.label, color = c.fgDefault)
                                val note = listOfNotNull(if (paused) status else task.detail ?: status, task.startedAt).joinToString(stringResource(R.string.stance_list_separator))
                                Text(note, style = StanceTheme.typography.caption, color = if (task.status == StanceStepStatus.Error) c.dangerFg else c.fgMuted)
                                if (task.status == StanceStepStatus.Running) StanceProgressIndicator(task.progress, showValue = false)
                            }
                        }
                        for (action in stanceTaskActions(task)) {
                            when (action) {
                                StanceTaskAction.Pause -> if (onPause != null) StanceIconButton(StanceIcons.Square, labels.pause(task.title), onClick = { onPause(task) })
                                StanceTaskAction.Resume -> if (onResume != null) StanceIconButton(StanceIcons.ArrowRight, labels.resume(task.title), onClick = { onResume(task) })
                                StanceTaskAction.Cancel -> if (onCancel != null) StanceIconButton(StanceIcons.X, labels.cancel(task.title), onClick = { onCancel(task) })
                                StanceTaskAction.Retry -> if (onRetry != null) StanceIconButton(StanceIcons.Refresh, labels.retry(task.title), onClick = { onRetry(task) })
                            }
                        }
                    }
                    if (index < tasks.lastIndex) StanceDivider()
                }
            }
        }
    }
}

// ───────────── Subagent tree ─────────────

/**
 * An agent in a [StanceSubagentTree], with the agents it has delegated to.
 *
 * @param summary One line on what the agent is doing or found.
 */
@Immutable
public data class StanceSubagent(
    val id: String,
    val name: String,
    val status: StanceStepStatus,
    val summary: String? = null,
    val children: List<StanceSubagent> = emptyList(),
)

/** The tree nodes that draw [agents]: the status is the row's icon and its trailing words. */
internal fun stanceSubagentNodes(agents: List<StanceSubagent>, statusLabel: (StanceStepStatus) -> String): List<StanceTreeNode> =
    agents.map { agent ->
        StanceTreeNode(
            id = agent.id,
            label = agent.name,
            children = stanceSubagentNodes(agent.children, statusLabel),
            icon = agent.status.icon,
            meta = statusLabel(agent.status),
            description = agent.summary,
        )
    }

private fun findSubagent(agents: List<StanceSubagent>, id: String): StanceSubagent? {
    for (agent in agents) {
        if (agent.id == id) return agent
        findSubagent(agent.children, id)?.let { return it }
    }
    return null
}

/**
 * A tree of an agent and the agents it has delegated to, each with its status and a one line
 * summary, on [StanceTreeView].
 *
 * The tree view gives the lazy rows, the expand and collapse actions and the position of each
 * row. The status is part of every row's name, as an icon and as words. The tree scrolls inside
 * [maxHeight], so it can sit in a message.
 *
 * @param expandedIds The ids of the open agents.
 * @param onSelect Makes rows selectable and is called with the chosen agent.
 */
@Composable
public fun StanceSubagentTree(
    agents: List<StanceSubagent>,
    expandedIds: Set<String>,
    onExpandedChange: (Set<String>) -> Unit,
    modifier: Modifier = Modifier,
    selectedId: String? = null,
    onSelect: ((StanceSubagent) -> Unit)? = null,
    maxHeight: Dp = StanceSizes.pickerMaxHeight,
    label: String = stringResource(R.string.stance_ai_agents),
    statusLabel: (StanceStepStatus) -> String = defaultStepStatusLabel(),
) {
    val nodes = remember(agents, statusLabel) { stanceSubagentNodes(agents, statusLabel) }
    val select by rememberUpdatedState(onSelect)
    val current by rememberUpdatedState(agents)
    StanceTreeView(
        nodes = nodes,
        expanded = expandedIds,
        onExpandedChange = onExpandedChange,
        modifier = modifier.heightIn(max = maxHeight),
        label = label,
        selected = selectedId,
        onSelect = if (onSelect != null) ({ node -> findSubagent(current, node.id)?.let { select?.invoke(it) } }) else null,
    )
}

/** [StanceSubagentTree] that keeps its own open agents, saved across configuration changes. */
@Composable
public fun StanceSubagentTree(
    agents: List<StanceSubagent>,
    modifier: Modifier = Modifier,
    initiallyExpandedIds: Set<String> = emptySet(),
    selectedId: String? = null,
    onSelect: ((StanceSubagent) -> Unit)? = null,
) {
    var expanded by rememberSaveable(stateSaver = idSetSaver) { mutableStateOf(initiallyExpandedIds) }
    StanceSubagentTree(agents, expanded, { expanded = it }, modifier, selectedId, onSelect)
}

private const val HALF_TURN = 180f
private const val SECOND_MILLIS = 1000L
