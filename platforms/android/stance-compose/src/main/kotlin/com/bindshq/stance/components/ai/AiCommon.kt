package com.bindshq.stance.components.ai

import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.IconToggleButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.icons.StanceIcon
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
