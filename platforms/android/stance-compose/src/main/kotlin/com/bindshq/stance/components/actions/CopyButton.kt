package com.bindshq.stance.components.actions

import android.content.ClipData
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.ClipEntry
import androidx.compose.ui.platform.LocalClipboard
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.bindshq.stance.R
import com.bindshq.stance.icons.StanceIcons
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Copies text to the clipboard and confirms it.
 *
 * Writes through the platform clipboard, gives haptic feedback, and for [timeoutMillis] shows a
 * check with [copiedLabel], announced politely. Android 13 and later also show their own
 * clipboard confirmation.
 *
 * @param value Returns the text at the moment of the tap.
 * @param showLabel Shows [label] beside the icon. Otherwise it is an icon button named by [label].
 * @param onCopy Called after the copy with whether it succeeded.
 */
@Composable
public fun StanceCopyButton(
    value: () -> String,
    modifier: Modifier = Modifier,
    label: String = stringResource(R.string.stance_copy),
    copiedLabel: String = stringResource(R.string.stance_copied),
    showLabel: Boolean = false,
    variant: StanceButtonVariant = StanceButtonVariant.Outline,
    size: StanceButtonSize = StanceButtonSize.Small,
    enabled: Boolean = true,
    timeoutMillis: Long = COPIED_HOLD_MILLIS,
    onCopy: ((Boolean) -> Unit)? = null,
) {
    val clipboard = LocalClipboard.current
    val haptics = LocalHapticFeedback.current
    val scope = rememberCoroutineScope()
    var copied by remember { mutableStateOf(false) }
    LaunchedEffect(copied) {
        if (copied) {
            delay(timeoutMillis)
            copied = false
        }
    }
    val copy: () -> Unit = {
        val text = value()
        scope.launch {
            val success = runCatching { clipboard.setClipEntry(ClipEntry(ClipData.newPlainText(label, text))) }.isSuccess
            if (success) {
                haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                copied = true
            }
            onCopy?.invoke(success)
        }
    }
    val announce = modifier.semantics { liveRegion = LiveRegionMode.Polite }
    if (showLabel) {
        StanceButton(
            text = if (copied) copiedLabel else label,
            onClick = copy,
            modifier = announce,
            variant = variant,
            size = size,
            enabled = enabled,
            leadingIcon = if (copied) StanceIcons.Check else StanceIcons.Copy,
        )
    } else {
        StanceIconButton(
            icon = if (copied) StanceIcons.Check else StanceIcons.Copy,
            contentDescription = if (copied) copiedLabel else label,
            onClick = copy,
            modifier = announce,
            enabled = enabled,
        )
    }
}

/** [StanceCopyButton] for text that is known when composing. */
@Composable
public fun StanceCopyButton(
    text: String,
    modifier: Modifier = Modifier,
    label: String = stringResource(R.string.stance_copy),
    copiedLabel: String = stringResource(R.string.stance_copied),
    showLabel: Boolean = false,
    enabled: Boolean = true,
    onCopy: ((Boolean) -> Unit)? = null,
) {
    StanceCopyButton(
        value = { text },
        modifier = modifier,
        label = label,
        copiedLabel = copiedLabel,
        showLabel = showLabel,
        enabled = enabled,
        onCopy = onCopy,
    )
}

// How long the button reads "Copied". A reading time, not an animation, so it has no motion token.
private const val COPIED_HOLD_MILLIS = 2000L
