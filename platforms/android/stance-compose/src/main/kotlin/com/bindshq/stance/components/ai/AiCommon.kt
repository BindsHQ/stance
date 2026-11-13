package com.bindshq.stance.components.ai

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.IconToggleButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.Dp
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.navigation.StanceStepState
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * Where a response is in its life. The app owns this value and passes it in;
 * Stance components only present it.
 */
public enum class StanceGenerationStatus {
    /** Nothing has been asked yet. */
    Idle,

    /** The request was sent and no content has arrived. */
    Submitted,

    /** Content is arriving. */
    Streaming,

    /** The response finished. */
    Complete,

    /** The person stopped the response part way. */
    Stopped,

    /** The response failed. */
    Error,
    ;

    /** True while a response is on its way: [Submitted] or [Streaming]. */
    public val isBusy: Boolean get() = this == Submitted || this == Streaming
}

/** A thumbs up or thumbs down on a response. */
public enum class StanceRating { Up, Down }

/**
 * The words screen readers hear for a status, or null when the status needs none
 * ([StanceGenerationStatus.Idle] and [StanceGenerationStatus.Complete]).
 */
@Composable
internal fun StanceGenerationStatus.description(): String? = when (this) {
    StanceGenerationStatus.Idle, StanceGenerationStatus.Complete -> null
    StanceGenerationStatus.Submitted -> stringResource(R.string.stance_ai_status_submitted)
    StanceGenerationStatus.Streaming -> stringResource(R.string.stance_ai_status_streaming)
    StanceGenerationStatus.Stopped -> stringResource(R.string.stance_ai_status_stopped)
    StanceGenerationStatus.Error -> stringResource(R.string.stance_ai_status_error)
}

/** An icon button with an on and off state, for ratings. The touch target is 48dp. */
@Composable
internal fun AiIconToggle(
    icon: ImageVector,
    contentDescription: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    IconToggleButton(
        checked = checked,
        onCheckedChange = onCheckedChange,
        modifier = modifier.stanceFocusRing(StanceTheme.shapes.pill),
        enabled = enabled,
        colors = IconButtonDefaults.iconToggleButtonColors(
            containerColor = Color.Transparent,
            contentColor = c.fgMuted,
            disabledContentColor = c.disabledFg,
            checkedContainerColor = c.interactiveSelected,
            checkedContentColor = c.interactiveSelectedFg,
        ),
    ) { StanceIcon(icon, contentDescription) }
}

/**
 * Where one step of an agent run is. Shared by the agent components: tool calls, timelines,
 * plans, task queues and subagent trees. The app owns this value and passes it in.
 */
public enum class StanceStepStatus {
    /** Not started yet. */
    Pending,

    /** In progress now. */
    Running,

    /** Finished successfully. */
    Complete,

    /** Failed. */
    Error,

    /** Left out on purpose. */
    Skipped,

    /** Paused until a person answers, for example an approval. */
    Waiting,
    ;

    /** True while the step still has work ahead of it: [Pending], [Running] or [Waiting]. */
    public val isOpen: Boolean get() = this == Pending || this == Running || this == Waiting

    /** True once the step needs nothing more: [Complete] or [Skipped]. */
    public val isDone: Boolean get() = this == Complete || this == Skipped
}

/** How much harm an agent action could do. Shown in words and with an icon, never by colour alone. */
public enum class StanceRiskLevel { Low, Medium, High }

/** The state the Stance stepper shows for a step status, so agent steps read like any other steps. */
internal fun StanceStepStatus.stepState(): StanceStepState = when (this) {
    StanceStepStatus.Complete -> StanceStepState.Complete
    StanceStepStatus.Running, StanceStepStatus.Waiting -> StanceStepState.Current
    StanceStepStatus.Error -> StanceStepState.Error
    StanceStepStatus.Pending, StanceStepStatus.Skipped -> StanceStepState.Upcoming
}

/** A distinct icon for each status. With the label, it carries the status without colour. */
internal val StanceStepStatus.icon: ImageVector
    get() = when (this) {
        StanceStepStatus.Pending -> StanceIcons.Circle
        StanceStepStatus.Running -> StanceIcons.Refresh
        StanceStepStatus.Complete -> StanceIcons.CheckCircle
        StanceStepStatus.Error -> StanceIcons.AlertCircle
        StanceStepStatus.Skipped -> StanceIcons.Minus
        StanceStepStatus.Waiting -> StanceIcons.Clock
    }

internal fun stepStatusLabelRes(status: StanceStepStatus): Int = when (status) {
    StanceStepStatus.Pending -> R.string.stance_ai_step_pending
    StanceStepStatus.Running -> R.string.stance_ai_step_running
    StanceStepStatus.Complete -> R.string.stance_ai_step_complete
    StanceStepStatus.Error -> R.string.stance_ai_step_error
    StanceStepStatus.Skipped -> R.string.stance_ai_step_skipped
    StanceStepStatus.Waiting -> R.string.stance_ai_step_waiting
}

/** The default words for each step status, from string resources. */
@Composable
internal fun defaultStepStatusLabel(): (StanceStepStatus) -> String =
    rememberFromResources { r -> { status -> r.getString(stepStatusLabelRes(status)) } }

internal fun riskLabelRes(risk: StanceRiskLevel): Int = when (risk) {
    StanceRiskLevel.Low -> R.string.stance_ai_risk_low
    StanceRiskLevel.Medium -> R.string.stance_ai_risk_medium
    StanceRiskLevel.High -> R.string.stance_ai_risk_high
}

/** The default words for each risk level, from string resources. */
@Composable
internal fun defaultRiskLabel(): (StanceRiskLevel) -> String =
    rememberFromResources { r -> { risk -> r.getString(riskLabelRes(risk)) } }

/** Joins a name and a state for screen readers, for example "Search the web, complete". */
@Composable
internal fun defaultNamedState(): (name: String, state: String) -> String =
    rememberFromResources { r -> { name, state -> r.getString(R.string.stance_ai_named_state, name, state) } }

/**
 * The mark of a step status: its icon, turning slowly while the step runs. When the system has
 * animations turned off the icon stands still. Decorative: the status is always also in words.
 */
@Composable
internal fun StepStatusMark(status: StanceStepStatus, modifier: Modifier = Modifier, size: Dp = StanceSizes.iconSmall) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val tint = when (status) {
        StanceStepStatus.Error -> c.dangerFg
        StanceStepStatus.Pending, StanceStepStatus.Skipped -> c.fgSubtle
        else -> c.fgDefault
    }
    if (status == StanceStepStatus.Running && !motion.reduceMotion) {
        val turn by rememberInfiniteTransition(label = "stance-step-running").animateFloat(
            initialValue = 0f,
            targetValue = FULL_TURN,
            animationSpec = infiniteRepeatable(tween(motion.pulseMillis, easing = motion.linearEasing), RepeatMode.Restart),
            label = "stance-step-turn",
        )
        StanceIcon(status.icon, contentDescription = null, size = size, tint = tint, modifier = modifier.graphicsLayer { rotationZ = turn })
    } else {
        StanceIcon(status.icon, contentDescription = null, size = size, tint = tint, modifier = modifier)
    }
}

/** The icon of a risk level: a shield, a warning triangle, then an alert. */
internal val StanceRiskLevel.icon: ImageVector
    get() = when (this) {
        StanceRiskLevel.Low -> StanceIcons.Shield
        StanceRiskLevel.Medium -> StanceIcons.AlertTriangle
        StanceRiskLevel.High -> StanceIcons.AlertCircle
    }

/** A risk level in words with its icon. High risk takes the danger role; the others stay on the ink scale. */
@Composable
internal fun RiskMark(risk: StanceRiskLevel, label: String, modifier: Modifier = Modifier) {
    val c = StanceTheme.colors
    val tint = if (risk == StanceRiskLevel.High) c.dangerFg else c.fgMuted
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1), verticalAlignment = Alignment.CenterVertically) {
        StanceIcon(risk.icon, contentDescription = null, size = StanceSizes.iconSmall, tint = tint)
        Text(label, style = StanceTheme.typography.labelSmall, color = tint)
    }
}

/** A bordered AI surface on the ink scale, the shared frame of the agent and output cards. */
@Composable
internal fun AiCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    StanceSurface(modifier = modifier.fillMaxWidth(), shape = StanceTheme.shapes.large, bordered = true) {
        Column(content = content)
    }
}

private const val FULL_TURN = 360f
