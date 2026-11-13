@file:OptIn(ExperimentalMaterial3Api::class)

package com.bindshq.stance.components.feedback

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.data.StanceCircularProgressIndicator
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.foundation.colors
import com.bindshq.stance.foundation.icon
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import androidx.compose.ui.res.stringResource
import com.bindshq.stance.R
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import com.bindshq.stance.foundation.expandEnter
import com.bindshq.stance.foundation.shrinkExit
import com.bindshq.stance.foundation.fadeEnter
import com.bindshq.stance.foundation.fadeExit
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.activity.compose.PredictiveBackHandler
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.LaunchedEffect

/**
 * A dialog for a focused task with custom content. Dismisses on back and outside taps.
 * The [title] is the dialog's heading.
 *
 * With predictive back (Android 14 and later, `android:enableOnBackInvokedCallback="true"`) the
 * dialog shrinks slightly as the back gesture progresses and restores if the gesture is cancelled.
 * With animations off it dismisses without the preview.
 */
@Composable
public fun StanceDialog(
    title: String,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    actions: @Composable () -> Unit = {},
    content: @Composable ColumnScope.() -> Unit,
) {
    BasicAlertDialog(onDismissRequest = onDismissRequest, modifier = modifier) {
        StanceSurface(
            modifier = Modifier.predictiveBackScale(onDismissRequest),
            shape = StanceTheme.shapes.extraLarge,
            color = StanceTheme.colors.bgOverlay,
            elevation = StanceTheme.elevation.xl,
            bordered = true,
        ) {
            Column(modifier = Modifier.padding(StanceSpacing.space6), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
                Text(title, style = StanceTheme.typography.headingSmall, modifier = Modifier.semantics { heading() })
                content()
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2, Alignment.End),
                ) { actions() }
            }
        }
    }
}

/**
 * Asks for a decision before something important happens.
 *
 * Uses the platform alert dialog. With [destructive] the confirm action uses the danger colour;
 * label it with the action's verb, for example "Delete template".
 */
@Composable
public fun StanceAlertDialog(
    title: String,
    message: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    cancelLabel: String = stringResource(R.string.stance_cancel),
    destructive: Boolean = false,
    confirmLoading: Boolean = false,
) {
    val c = StanceTheme.colors
    AlertDialog(
        onDismissRequest = { if (!confirmLoading) onDismissRequest() },
        confirmButton = {
            StanceButton(
                confirmLabel,
                onClick = onConfirm,
                variant = if (destructive) StanceButtonVariant.Danger else StanceButtonVariant.Primary,
                loading = confirmLoading,
            )
        },
        dismissButton = { StanceButton(cancelLabel, onClick = onDismissRequest, variant = StanceButtonVariant.Ghost, enabled = !confirmLoading) },
        modifier = modifier,
        icon = if (destructive) ({ StanceIcon(StanceIcons.AlertTriangle, contentDescription = null, tint = c.dangerFg, size = StanceSizes.iconLarge) }) else null,
        title = { Text(title, style = StanceTheme.typography.headingSmall) },
        text = { Text(message, style = StanceTheme.typography.bodySmall) },
        shape = StanceTheme.shapes.extraLarge,
        containerColor = c.bgOverlay,
        titleContentColor = c.fgDefault,
        textContentColor = c.fgMuted,
    )
}

/**
 * A modal bottom sheet for secondary tasks. Supports drag to dismiss, back and scrim taps,
 * and handles the navigation bar and keyboard insets. Predictive back is handled by the
 * Material sheet: it scales down with the gesture when the app opts in to
 * `android:enableOnBackInvokedCallback`.
 */
@Composable
public fun StanceBottomSheet(
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    title: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    StanceBottomSheet(onDismissRequest, rememberModalBottomSheetState(), modifier, title, content)
}

/**
 * [StanceBottomSheet] with a hoisted [SheetState], for expanding or hiding the sheet in code.
 * Marked experimental because the Material sheet state API is.
 */
@ExperimentalMaterial3Api
@Composable
public fun StanceBottomSheet(
    onDismissRequest: () -> Unit,
    sheetState: SheetState,
    modifier: Modifier = Modifier,
    title: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = StanceTheme.colors
    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        modifier = modifier,
        sheetState = sheetState,
        shape = StanceTheme.shapes.sheet,
        containerColor = c.bgOverlay,
        contentColor = c.fgDefault,
        scrimColor = c.bgScrim,
        dragHandle = { BottomSheetDefaults.DragHandle(color = c.borderStrong) },
    ) {
        Column(
            modifier = Modifier.padding(horizontal = StanceSpacing.space6).padding(bottom = StanceSpacing.space6),
            verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4),
        ) {
            if (title != null) Text(title, style = StanceTheme.typography.headingSmall, modifier = Modifier.semantics { heading() })
            content()
        }
    }
}

/**
 * Shows a short hint on long press, hover or keyboard focus. Supplementary only:
 * never put essential information in a tooltip.
 */
@Composable
public fun StanceTooltip(text: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val c = StanceTheme.colors
    TooltipBox(
        positionProvider = TooltipDefaults.rememberPlainTooltipPositionProvider(),
        tooltip = {
            PlainTooltip(containerColor = c.bgInverse, contentColor = c.fgInverse, shape = StanceTheme.shapes.small) {
                Text(text, style = StanceTheme.typography.caption)
            }
        },
        state = rememberTooltipState(),
        modifier = modifier,
        content = content,
    )
}

@Composable
private fun StatusMessage(
    tone: StanceTone,
    title: String?,
    message: String,
    modifier: Modifier,
    fullWidth: Boolean,
    action: (@Composable () -> Unit)?,
    onDismiss: (() -> Unit)?,
    dismissDescription: String,
    visible: Boolean,
) {
    val t = tone.colors()
    val shape = if (fullWidth) StanceTheme.shapes.extraSmall else StanceTheme.shapes.large
    val urgent = tone == StanceTone.Danger || tone == StanceTone.Warning
    val motion = StanceTheme.motion
    // Starts hidden so the message eases in when it first appears. With animations off it is simply there.
    // The entrance plays once: a message scrolled back into a lazy list does not ease in again.
    var appeared by rememberSaveable { mutableStateOf(false) }
    val visibility = remember { MutableTransitionState(visible && (appeared || motion.reduceMotion)) }
    visibility.targetState = visible
    LaunchedEffect(Unit) { appeared = true }
    AnimatedVisibility(visibleState = visibility, modifier = modifier, enter = motion.expandEnter(), exit = motion.shrinkExit()) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(t.background)
            .border(StanceTheme.tokens.borderWidth.dp, t.border, shape)
            .padding(StanceSpacing.space4)
            .semantics(mergeDescendants = true) { liveRegion = if (urgent) LiveRegionMode.Assertive else LiveRegionMode.Polite },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
        verticalAlignment = Alignment.Top,
    ) {
        StanceIcon(tone.icon, contentDescription = null, tint = t.foreground)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
            if (title != null) Text(title, style = StanceTheme.typography.title, color = StanceTheme.colors.fgDefault)
            Text(message, style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgDefault)
            action?.invoke()
        }
        if (onDismiss != null) StanceIconButton(StanceIcons.X, dismissDescription, onDismiss)
    }
    }
}

/**
 * A status message inside the content it relates to. Warnings and errors are announced
 * immediately; information and success politely.
 *
 * @param visible Keep the alert in composition and set this to false to ease it out.
 * It eases in when it first appears. Both are instant when animations are off.
 */
@Composable
public fun StanceInlineAlert(
    message: String,
    modifier: Modifier = Modifier,
    tone: StanceTone = StanceTone.Info,
    title: String? = null,
    action: (@Composable () -> Unit)? = null,
    onDismiss: (() -> Unit)? = null,
    dismissDescription: String = stringResource(R.string.stance_dismiss),
    visible: Boolean = true,
) {
    StatusMessage(tone, title, message, modifier, fullWidth = false, action, onDismiss, dismissDescription, visible)
}

/**
 * A page-level announcement across the top of a screen, such as maintenance or an expired plan.
 *
 * @param visible Keep the banner in composition and set this to false to ease it out.
 * It eases in when it first appears. Both are instant when animations are off.
 */
@Composable
public fun StanceBanner(
    message: String,
    modifier: Modifier = Modifier,
    tone: StanceTone = StanceTone.Info,
    title: String? = null,
    action: (@Composable () -> Unit)? = null,
    onDismiss: (() -> Unit)? = null,
    dismissDescription: String = stringResource(R.string.stance_dismiss),
    visible: Boolean = true,
) {
    StatusMessage(tone, title, message, modifier, fullWidth = true, action, onDismiss, dismissDescription, visible)
}

/**
 * Covers its content with a scrim and a progress indicator while [visible].
 * Taps are blocked and the [message] is announced.
 */
@Composable
public fun StanceLoadingOverlay(
    visible: Boolean,
    modifier: Modifier = Modifier,
    message: String = stringResource(R.string.stance_loading),
    content: @Composable () -> Unit,
) {
    Box(modifier = modifier) {
        content()
        val motion = StanceTheme.motion
        AnimatedVisibility(visible = visible, modifier = Modifier.matchParentSize(), enter = motion.fadeEnter(), exit = motion.fadeExit()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(StanceTheme.colors.bgScrim)
                    .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null, onClick = {})
                    .semantics(mergeDescendants = true) {
                        contentDescription = message
                        liveRegion = LiveRegionMode.Polite
                    },
                contentAlignment = Alignment.Center,
            ) {
                // The message sits on its own surface so it stays readable over any content.
                StanceSurface(shape = StanceTheme.shapes.large, color = StanceTheme.colors.bgOverlay, elevation = StanceTheme.elevation.lg, bordered = true) {
                    Row(
                        modifier = Modifier.padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space3),
                        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // The overlay itself announces the message; the spinner and text are decorative here.
                        StanceCircularProgressIndicator(contentDescription = message, size = StanceSizes.iconLarge, modifier = Modifier.clearAndSetSemantics {})
                        Text(message, style = StanceTheme.typography.label, color = StanceTheme.colors.fgDefault, modifier = Modifier.clearAndSetSemantics {})
                    }
                }
            }
        }
    }
}

/**
 * Explains that something failed and how to recover, with a retry action.
 */
@Composable
public fun StanceErrorState(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    retryLabel: String = stringResource(R.string.stance_try_again),
    onRetry: (() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    Column(
        modifier = modifier.fillMaxSize().padding(StanceSpacing.space8),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3, Alignment.CenterVertically),
    ) {
        StanceIcon(StanceIcons.AlertTriangle, contentDescription = null, size = StanceSizes.controlLarge, tint = c.dangerFg)
        Text(title, style = StanceTheme.typography.headingSmall, color = c.fgDefault, textAlign = TextAlign.Center, modifier = Modifier.semantics { heading() })
        if (description != null) Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted, textAlign = TextAlign.Center)
        if (onRetry != null) StanceButton(retryLabel, onClick = onRetry, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Refresh)
    }
}

/**
 * Previews the back gesture on a dialog surface: it shrinks a little as the gesture progresses,
 * then [onBack] runs when the gesture commits. Does nothing when no back dispatcher is available
 * or when animations are off, where the platform dialog handles back on its own.
 */
@Composable
internal fun Modifier.predictiveBackScale(onBack: () -> Unit): Modifier {
    if (StanceTheme.motion.reduceMotion || LocalOnBackPressedDispatcherOwner.current == null) return this
    var progress by remember { mutableFloatStateOf(0f) }
    val currentOnBack by rememberUpdatedState(onBack)
    PredictiveBackHandler { events ->
        try {
            events.collect { progress = it.progress }
            currentOnBack()
        } finally {
            progress = 0f
        }
    }
    return graphicsLayer {
        val scale = 1f - PREDICTIVE_BACK_SHRINK * progress
        scaleX = scale
        scaleY = scale
    }
}

/** How much a dialog shrinks at the end of a back gesture, as a fraction of its size. */
private const val PREDICTIVE_BACK_SHRINK = 0.1f
