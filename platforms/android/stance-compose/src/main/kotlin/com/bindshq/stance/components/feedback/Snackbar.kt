package com.bindshq.stance.components.feedback

import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.SnackbarVisuals
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.theme.StanceTheme

/** Snackbar content with a Stance tone. */
public class StanceSnackbarVisuals(
    override val message: String,
    public val tone: StanceTone = StanceTone.Neutral,
    override val actionLabel: String? = null,
    override val withDismissAction: Boolean = false,
    override val duration: SnackbarDuration = if (actionLabel == null) SnackbarDuration.Short else SnackbarDuration.Long,
) : SnackbarVisuals

/**
 * Shows a brief message about a completed action: the Android counterpart of the web Toast.
 * Messages queue: a new one waits until the current one is dismissed.
 *
 * @return Whether the action was performed or the snackbar was dismissed.
 */
public suspend fun SnackbarHostState.showStanceSnackbar(
    message: String,
    tone: StanceTone = StanceTone.Neutral,
    actionLabel: String? = null,
    withDismissAction: Boolean = false,
): SnackbarResult = showSnackbar(StanceSnackbarVisuals(message, tone, actionLabel, withDismissAction))

/**
 * Hosts Stance snackbars. Snackbars are announced by screen readers as they appear
 * (a polite live region). Danger snackbars use the danger colours.
 */
@Composable
public fun StanceSnackbarHost(hostState: SnackbarHostState, modifier: Modifier = Modifier) {
    SnackbarHost(hostState = hostState, modifier = modifier) { data ->
        val c = StanceTheme.colors
        val danger = (data.visuals as? StanceSnackbarVisuals)?.tone == StanceTone.Danger
        Snackbar(
            snackbarData = data,
            shape = StanceTheme.shapes.medium,
            containerColor = if (danger) c.dangerSolid else c.bgInverse,
            contentColor = if (danger) c.dangerOnSolid else c.fgInverse,
            actionColor = if (danger) c.dangerOnSolid else c.fgInverse,
            dismissActionContentColor = if (danger) c.dangerOnSolid else c.fgInverse,
        )
    }
}
