package com.bindshq.stance.components.ai

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.ResolvedTextDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.data.StanceProgressIndicator
import com.bindshq.stance.components.data.StanceSkeleton
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.foundation.colors
import com.bindshq.stance.foundation.expandEnter
import com.bindshq.stance.foundation.shrinkExit
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlin.math.ceil
import kotlin.math.min

/** How much text [StanceStreamingText] reveals on each beat of the `stream` motion token. */
public enum class StanceStreamCadence {
    /** One character per beat. */
    Character,

    /** One word per beat. */
    Word,

    /** No reveal: text shows as soon as it arrives. */
    Instant,
}

/**
 * The position after one more chunk of [text] is revealed, starting at [from].
 * A chunk is one character or one word with the whitespace before it.
 * Never splits a surrogate pair.
 */
public fun stanceNextReveal(text: String, from: Int, cadence: StanceStreamCadence): Int {
    val length = text.length
    if (from >= length) return length
    val start = from.coerceAtLeast(0)
    return when (cadence) {
        StanceStreamCadence.Instant -> length
        StanceStreamCadence.Character -> start + Character.charCount(text.codePointAt(start))
        StanceStreamCadence.Word -> {
            var index = start
            while (index < length && text[index].isWhitespace()) index++
            while (index < length && !text[index].isWhitespace()) index++
            index
        }
    }
}

/**
 * One beat of the reveal. Normally one chunk; when the text is far ahead of the reveal it
 * takes more chunks, so the reveal never trails the stream by more than about a second.
 */
internal fun stanceRevealAdvance(text: String, from: Int, cadence: StanceStreamCadence): Int {
    val backlog = (text.length - from).coerceAtLeast(0)
    val window = if (cadence == StanceStreamCadence.Word) WORD_CATCH_UP_WINDOW else CHARACTER_CATCH_UP_WINDOW
    var index = from
    repeat(1 + backlog / window) { index = stanceNextReveal(text, index, cadence) }
    return index
}

// Characters of backlog that add one more chunk per beat.
private const val CHARACTER_CATCH_UP_WINDOW = 40
private const val WORD_CATCH_UP_WINDOW = 240

private class TextLayoutHolder {
    var value: TextLayoutResult? = null
}

/**
 * Shows text as it arrives, revealed at the steady cadence of the `stream` motion token.
 *
 * Pass the full text so far in [text] and keep [streaming] true until the response ends.
 * The reveal is drawn as a clip over one text layout, so a beat redraws and never recomposes
 * or lays out the text again, and lines above the reading position do not move.
 * When the system has animations turned off, or with [StanceStreamCadence.Instant], text shows at once.
 *
 * Screen readers get nothing while text is arriving. When the response is complete the text is
 * exposed and announced once through a polite live region, never token by token.
 * Lines that mix left to right and right to left text reveal by paragraph direction.
 *
 * @param caret Draws a caret at the reading position while text is arriving.
 * @param onRevealEnd Called once when [streaming] has ended and the reveal has caught up.
 */
@Composable
public fun StanceStreamingText(
    text: String,
    modifier: Modifier = Modifier,
    streaming: Boolean = false,
    cadence: StanceStreamCadence = StanceStreamCadence.Word,
    caret: Boolean = true,
    style: TextStyle = StanceTheme.typography.body,
    color: Color = StanceTheme.colors.fgDefault,
    onRevealEnd: (() -> Unit)? = null,
) {
    val motion = StanceTheme.motion
    val instant = cadence == StanceStreamCadence.Instant || motion.reduceMotion
    val currentText = rememberUpdatedState(text)
    val revealed = remember { mutableIntStateOf(if (streaming && !instant) 0 else text.length) }
    val holder = remember { TextLayoutHolder() }
    var sawStreaming by remember { mutableStateOf(streaming) }
    LaunchedEffect(streaming) { if (streaming) sawStreaming = true }

    if (!instant) {
        val beat = motion.streamMillis.toLong()
        LaunchedEffect(cadence, beat) {
            while (true) {
                val length = currentText.value.length
                if (revealed.intValue > length) revealed.intValue = length
                if (revealed.intValue < length) {
                    delay(beat)
                    revealed.intValue = stanceRevealAdvance(currentText.value, revealed.intValue, cadence)
                } else {
                    snapshotFlow { currentText.value.length }.first { it != revealed.intValue }
                }
            }
        }
    }

    val caughtUp by remember { derivedStateOf { revealed.intValue >= currentText.value.length } }
    val complete = !streaming && (instant || caughtUp)
    val onEnd = rememberUpdatedState(onRevealEnd)
    LaunchedEffect(complete) { if (complete && sawStreaming) onEnd.value?.invoke() }

    val announce = sawStreaming
    val semantics = if (complete) {
        Modifier.semantics { if (announce) liveRegion = LiveRegionMode.Polite }
    } else {
        Modifier.clearAndSetSemantics { }
    }
    val caretWidth = StanceSpacing.space05
    val showCaret = caret && !complete
    Text(
        text = text,
        style = style,
        color = color,
        onTextLayout = { holder.value = it },
        modifier = modifier
            .then(semantics)
            .layout { measurable, constraints ->
                val placeable = measurable.measure(constraints)
                val result = holder.value
                val count = revealed.intValue
                // The height follows the line being revealed, so no blank space opens below it.
                val height = if (instant || result == null || count >= result.layoutInput.text.length) {
                    placeable.height
                } else {
                    min(placeable.height, ceil(result.getLineBottom(result.getLineForOffset(count))).toInt())
                }
                layout(placeable.width, height) { placeable.place(0, 0) }
            }
            .drawWithContent {
                val result = holder.value
                if (result == null) {
                    drawContent()
                    return@drawWithContent
                }
                val length = result.layoutInput.text.length
                val count = if (instant) length else min(revealed.intValue, length)
                if (count >= length) {
                    drawContent()
                } else {
                    val line = result.getLineForOffset(count)
                    val top = result.getLineTop(line)
                    val bottom = result.getLineBottom(line)
                    val edge = result.getHorizontalPosition(count, usePrimaryDirection = true)
                    val rtl = result.getParagraphDirection(count) == ResolvedTextDirection.Rtl
                    if (top > 0f) clipRect(bottom = top) { this@drawWithContent.drawContent() }
                    clipRect(
                        left = if (rtl) edge else 0f,
                        top = top,
                        right = if (rtl) size.width else edge,
                        bottom = bottom,
                    ) { this@drawWithContent.drawContent() }
                }
                if (showCaret) {
                    val cursor = result.getCursorRect(count)
                    val rtl = length > 0 && result.getParagraphDirection(min(count, length - 1)) == ResolvedTextDirection.Rtl
                    val width = caretWidth.toPx()
                    drawRect(
                        color = color,
                        topLeft = Offset(if (rtl) cursor.left - width else cursor.left, cursor.top),
                        size = Size(width, cursor.height),
                    )
                }
            },
    )
}

/**
 * Text with a slow light sweep, for labels of work in progress such as "Searching the web".
 *
 * The sweep takes one `shimmer` duration and runs from the start edge to the end edge, so it
 * mirrors in right to left layouts. With [active] false, or when the system has animations
 * turned off, it is plain text. Screen readers always read it as plain text.
 */
@Composable
public fun StanceShimmerText(
    text: String,
    modifier: Modifier = Modifier,
    active: Boolean = true,
    style: TextStyle = StanceTheme.typography.bodySmall,
    color: Color = StanceTheme.colors.fgMuted,
) {
    val motion = StanceTheme.motion
    if (!active || motion.reduceMotion) {
        Text(text, modifier = modifier, style = style, color = color)
        return
    }
    val highlight = StanceTheme.colors.fgDefault
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val transition = rememberInfiniteTransition(label = "stance-shimmer")
    val progress = transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(motion.shimmerMillis, easing = motion.linearEasing), RepeatMode.Restart),
        label = "stance-shimmer-progress",
    )
    Text(
        text,
        style = style,
        color = color,
        modifier = modifier
            .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
            .drawWithContent {
                drawContent()
                val band = size.width * SHIMMER_BAND
                val position = if (rtl) 1f - progress.value else progress.value
                val start = position * (size.width + band) - band
                drawRect(
                    brush = Brush.horizontalGradient(
                        0f to Color.Transparent,
                        0.5f to highlight,
                        1f to Color.Transparent,
                        startX = start,
                        endX = start + band,
                    ),
                    blendMode = BlendMode.SrcAtop,
                )
            },
    )
}

// Width of the light band as a fraction of the text width.
private const val SHIMMER_BAND = 0.4f

/** The motion a [StanceThinkingIndicator] uses. */
public enum class StanceThinkingVariant {
    /** Three dots that brighten in turn. */
    Dots,

    /** The sparkle mark breathing. */
    Pulse,

    /** The sparkle mark with a shimmering label. */
    Shimmer,
}

/** Visual size of a [StanceThinkingIndicator]. */
public enum class StanceThinkingSize { Small, Medium }

/**
 * Shows that the assistant is working before any text arrives.
 *
 * A status: the [label] is announced politely once when the indicator appears. The elapsed
 * time is visual only, so it is not announced every second. When the system has animations
 * turned off, a static sparkle mark is shown with the label.
 *
 * @param elapsedSeconds Time spent so far. Shown after the label when set.
 * @param elapsedText The words for [elapsedSeconds].
 */
@Composable
public fun StanceThinkingIndicator(
    modifier: Modifier = Modifier,
    label: String = stringResource(R.string.stance_ai_thinking),
    variant: StanceThinkingVariant = StanceThinkingVariant.Dots,
    elapsedSeconds: Int? = null,
    size: StanceThinkingSize = StanceThinkingSize.Medium,
    elapsedText: String? = elapsedSeconds?.let { pluralStringResource(R.plurals.stance_ai_seconds, it, it) },
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val textStyle = if (size == StanceThinkingSize.Small) StanceTheme.typography.caption else StanceTheme.typography.bodySmall
    val markSize = if (size == StanceThinkingSize.Small) StanceSizes.iconSmall else StanceSizes.iconMedium
    Row(
        modifier = modifier.clearAndSetSemantics {
            contentDescription = label
            liveRegion = LiveRegionMode.Polite
        },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (motion.reduceMotion) {
            StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = markSize, tint = c.fgMuted)
            Text(label, style = textStyle, color = c.fgMuted)
        } else {
            val transition = rememberInfiniteTransition(label = "stance-thinking")
            val breath = transition.animateFloat(
                initialValue = 0f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(tween(motion.pulseMillis, easing = motion.linearEasing), RepeatMode.Restart),
                label = "stance-thinking-breath",
            )
            when (variant) {
                StanceThinkingVariant.Dots -> {
                    ThinkingDots(breath, dot = markSize / 3)
                    Text(label, style = textStyle, color = c.fgMuted)
                }
                StanceThinkingVariant.Pulse -> {
                    StanceIcon(
                        StanceIcons.Sparkle,
                        contentDescription = null,
                        size = markSize,
                        tint = c.fgDefault,
                        modifier = Modifier.graphicsLayer {
                            val wave = pulseWave(breath.value)
                            alpha = PULSE_REST + (1f - PULSE_REST) * wave
                            scaleX = PULSE_SCALE_REST + (1f - PULSE_SCALE_REST) * wave
                            scaleY = scaleX
                        },
                    )
                    Text(label, style = textStyle, color = c.fgMuted)
                }
                StanceThinkingVariant.Shimmer -> {
                    StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = markSize, tint = c.fgMuted)
                    StanceShimmerText(label, style = textStyle)
                }
            }
        }
        if (elapsedText != null) Text(elapsedText, style = textStyle, color = c.fgSubtle)
    }
}

@Composable
private fun ThinkingDots(breath: State<Float>, dot: androidx.compose.ui.unit.Dp) {
    val color = StanceTheme.colors.fgMuted
    Row(horizontalArrangement = Arrangement.spacedBy(dot / 2), verticalAlignment = Alignment.CenterVertically) {
        repeat(DOT_COUNT) { index ->
            Box(
                Modifier
                    .size(dot)
                    .graphicsLayer {
                        val shifted = (breath.value - index * DOT_STAGGER + 1f) % 1f
                        alpha = PULSE_REST + (1f - PULSE_REST) * pulseWave(shifted)
                    }
                    .background(color, CircleShape),
            )
        }
    }
}

/** A triangle wave: 0 at rest, 1 at the peak of the breath, back to 0. */
private fun pulseWave(progress: Float): Float = if (progress < 0.5f) progress * 2f else (1f - progress) * 2f

private const val DOT_COUNT = 3
private const val DOT_STAGGER = 0.2f
private const val PULSE_REST = 0.35f
private const val PULSE_SCALE_REST = 0.85f

/** Whether the assistant is still reasoning. */
public enum class StanceReasoningStatus { Thinking, Done }

/**
 * A collapsible block for the assistant's reasoning, with hoisted [expanded] state.
 *
 * The header is a button that reports expanded or collapsed to screen readers. While
 * [status] is [StanceReasoningStatus.Thinking] it shimmers; when done it reads as a summary,
 * for example "Thought for 12 seconds".
 *
 * @param durationSeconds How long the reasoning took. Used by the default [doneLabel].
 */
@Composable
public fun StanceReasoningDisclosure(
    status: StanceReasoningStatus,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    durationSeconds: Int? = null,
    thinkingLabel: String = stringResource(R.string.stance_ai_thinking),
    doneLabel: String = durationSeconds?.let { pluralStringResource(R.plurals.stance_ai_thought_for, it, it) }
        ?: stringResource(R.string.stance_ai_reasoning),
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val rotation by animateFloatAsState(if (expanded) HALF_TURN else 0f, motion.fast(), label = "stance-reasoning-chevron")
    Column(modifier = modifier) {
        Row(
            modifier = Modifier
                .clip(StanceTheme.shapes.medium)
                .clickable(role = Role.Button) { onExpandedChange(!expanded) }
                .heightIn(min = StanceSizes.touchTarget)
                .padding(end = StanceSpacing.space2)
                .semantics {
                    if (expanded) {
                        collapse { onExpandedChange(false); true }
                    } else {
                        expand { onExpandedChange(true); true }
                    }
                },
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
            if (status == StanceReasoningStatus.Thinking) {
                StanceShimmerText(thinkingLabel, style = StanceTheme.typography.label)
            } else {
                Text(doneLabel, style = StanceTheme.typography.label, color = c.fgMuted)
            }
            StanceIcon(
                StanceIcons.ChevronDown,
                contentDescription = null,
                size = StanceSizes.iconSmall,
                tint = c.fgMuted,
                modifier = Modifier.graphicsLayer { rotationZ = rotation },
            )
        }
        AnimatedVisibility(visible = expanded, enter = motion.expandEnter(), exit = motion.shrinkExit()) {
            Row(modifier = Modifier.height(IntrinsicSize.Min).padding(start = StanceSpacing.space2, top = StanceSpacing.space1)) {
                StanceDivider(vertical = true, modifier = Modifier.fillMaxHeight(), color = c.borderDefault)
                CompositionLocalProvider(LocalContentColor provides c.fgMuted) {
                    ProvideTextStyle(StanceTheme.typography.bodySmall) {
                        Column(
                            modifier = Modifier.padding(start = StanceSpacing.space3),
                            verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                            content = content,
                        )
                    }
                }
            }
        }
    }
}

/**
 * [StanceReasoningDisclosure] that keeps its own state: open while thinking and collapsed
 * to its summary when [status] becomes [StanceReasoningStatus.Done], unless the reader
 * toggled it while it was thinking.
 *
 * @param initiallyExpanded Whether it starts open. Defaults to open while thinking.
 */
@Composable
public fun StanceReasoningDisclosure(
    status: StanceReasoningStatus,
    modifier: Modifier = Modifier,
    durationSeconds: Int? = null,
    initiallyExpanded: Boolean = status == StanceReasoningStatus.Thinking,
    thinkingLabel: String = stringResource(R.string.stance_ai_thinking),
    doneLabel: String = durationSeconds?.let { pluralStringResource(R.plurals.stance_ai_thought_for, it, it) }
        ?: stringResource(R.string.stance_ai_reasoning),
    content: @Composable ColumnScope.() -> Unit,
) {
    var expanded by rememberSaveable { mutableStateOf(initiallyExpanded) }
    var lastStatus by rememberSaveable { mutableStateOf(status) }
    var toggled by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(status) {
        if (status != lastStatus) {
            if (!toggled) expanded = status == StanceReasoningStatus.Thinking
            lastStatus = status
            toggled = false
        }
    }
    StanceReasoningDisclosure(
        status = status,
        expanded = expanded,
        onExpandedChange = {
            expanded = it
            if (status == StanceReasoningStatus.Thinking) toggled = true
        },
        modifier = modifier,
        durationSeconds = durationSeconds,
        thinkingLabel = thinkingLabel,
        doneLabel = doneLabel,
        content = content,
    )
}

private const val HALF_TURN = 180f

/**
 * Progress for longer generations such as images or documents.
 *
 * A progress bar with its [label] and percentage. The [stage] is a polite live region, so a
 * change of stage is announced once.
 *
 * @param progress From 0 to 1, or null when the amount of work is not known.
 * @param stage What is happening now, for example "Rendering page 2".
 * @param onCancel Shows a cancel button when set.
 */
@Composable
public fun StanceGenerationProgress(
    label: String,
    modifier: Modifier = Modifier,
    progress: Float? = null,
    stage: String? = null,
    onCancel: (() -> Unit)? = null,
    cancelLabel: String = stringResource(R.string.stance_ai_cancel_generation),
) {
    val c = StanceTheme.colors
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        StanceIcon(StanceIcons.Sparkle, contentDescription = null, tint = c.fgMuted)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
            StanceProgressIndicator(progress = progress, label = label)
            if (stage != null) {
                Text(
                    stage,
                    style = StanceTheme.typography.caption,
                    color = c.fgMuted,
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                )
            }
        }
        if (onCancel != null) StanceIconButton(StanceIcons.X, cancelLabel, onCancel)
    }
}

/** The shape of a [StanceStreamingSkeleton]. */
public enum class StanceStreamingSkeletonVariant {
    /** Lines of text. */
    Text,

    /** A bordered card with a heading line and text lines. */
    Card,

    /** An image area with a caption line. */
    Image,
}

/**
 * Placeholder for a response that has been requested and has not started.
 *
 * Read by screen readers as one status with [contentDescription]. The pulse stops when the
 * system has animations turned off.
 *
 * @param lines Number of text lines. The last one is shorter.
 */
@Composable
public fun StanceStreamingSkeleton(
    modifier: Modifier = Modifier,
    lines: Int = 3,
    variant: StanceStreamingSkeletonVariant = StanceStreamingSkeletonVariant.Text,
    contentDescription: String = stringResource(R.string.stance_ai_loading_response),
) {
    val description = Modifier.clearAndSetSemantics { this.contentDescription = contentDescription }
    val gap = Arrangement.spacedBy(StanceSpacing.space3)
    when (variant) {
        StanceStreamingSkeletonVariant.Text -> Column(modifier.fillMaxWidth().then(description), verticalArrangement = gap) {
            SkeletonLines(lines)
        }
        StanceStreamingSkeletonVariant.Card -> Column(
            modifier = modifier
                .fillMaxWidth()
                .then(description)
                .border(StanceTheme.tokens.borderWidth.dp, StanceTheme.colors.borderDefault, StanceTheme.shapes.large)
                .padding(StanceSpacing.space4),
            verticalArrangement = gap,
        ) {
            StanceSkeleton(modifier = Modifier.fillMaxWidth(SKELETON_HEADING), height = StanceSpacing.space5)
            SkeletonLines(lines)
        }
        StanceStreamingSkeletonVariant.Image -> Column(modifier.fillMaxWidth().then(description), verticalArrangement = gap) {
            Box(Modifier.fillMaxWidth().aspectRatio(SKELETON_IMAGE_RATIO)) {
                StanceSkeleton(modifier = Modifier.matchParentSize(), height = StanceSpacing.space32)
            }
            StanceSkeleton(modifier = Modifier.fillMaxWidth(SKELETON_LAST_LINE))
        }
    }
}

@Composable
private fun SkeletonLines(lines: Int) {
    val count = lines.coerceAtLeast(1)
    repeat(count) { index ->
        StanceSkeleton(modifier = if (index == count - 1 && count > 1) Modifier.fillMaxWidth(SKELETON_LAST_LINE) else Modifier)
    }
}

private const val SKELETON_LAST_LINE = 0.6f
private const val SKELETON_HEADING = 0.4f
private const val SKELETON_IMAGE_RATIO = 16f / 9f

/** Why a response ended early. */
public enum class StanceInterruptedReason {
    /** The person stopped it. */
    Stopped,

    /** The response failed. */
    Error,

    /** The connection was lost. */
    Network,

    /** A usage or length limit was reached. */
    Limit,
}

/**
 * Marks a response that was stopped or failed part way, with retry and continue actions.
 *
 * An error or a lost connection is an alert and is announced immediately. A stopped
 * response or a reached limit is a status and is announced politely. The icon and words carry the meaning, not colour alone.
 *
 * @param onRetry Shows a retry button when set.
 * @param onContinue Shows a continue button when set.
 */
@Composable
public fun StanceInterruptedState(
    reason: StanceInterruptedReason,
    modifier: Modifier = Modifier,
    title: String = stringResource(
        when (reason) {
            StanceInterruptedReason.Stopped -> R.string.stance_ai_interrupted_stopped
            StanceInterruptedReason.Error -> R.string.stance_ai_interrupted_error
            StanceInterruptedReason.Network -> R.string.stance_ai_interrupted_network
            StanceInterruptedReason.Limit -> R.string.stance_ai_interrupted_limit
        },
    ),
    description: String? = null,
    onRetry: (() -> Unit)? = null,
    onContinue: (() -> Unit)? = null,
    retryLabel: String = stringResource(R.string.stance_try_again),
    continueLabel: String = stringResource(R.string.stance_ai_continue),
) {
    val c = StanceTheme.colors
    val tone = when (reason) {
        StanceInterruptedReason.Stopped -> StanceTone.Neutral
        StanceInterruptedReason.Limit -> StanceTone.Warning
        StanceInterruptedReason.Error, StanceInterruptedReason.Network -> StanceTone.Danger
    }
    val icon = when (reason) {
        StanceInterruptedReason.Stopped -> StanceIcons.Stop
        StanceInterruptedReason.Limit, StanceInterruptedReason.Network -> StanceIcons.AlertTriangle
        StanceInterruptedReason.Error -> StanceIcons.AlertCircle
    }
    val t = tone.colors()
    val shape = StanceTheme.shapes.large
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(t.background)
            .border(StanceTheme.tokens.borderWidth.dp, t.border, shape)
            .padding(StanceSpacing.space3),
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
    ) {
        Row(
            modifier = Modifier.semantics(mergeDescendants = true) {
                val alert = reason == StanceInterruptedReason.Error || reason == StanceInterruptedReason.Network
                liveRegion = if (alert) LiveRegionMode.Assertive else LiveRegionMode.Polite
            },
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.Top,
        ) {
            StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = t.foreground, modifier = Modifier.padding(top = StanceSpacing.space05))
            Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space05)) {
                Text(title, style = StanceTheme.typography.label, color = c.fgDefault)
                if (description != null) Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
            }
        }
        if (onRetry != null || onContinue != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                if (onContinue != null) {
                    StanceButton(continueLabel, onClick = onContinue, variant = StanceButtonVariant.Secondary, size = StanceButtonSize.Small)
                }
                if (onRetry != null) {
                    StanceButton(retryLabel, onClick = onRetry, variant = StanceButtonVariant.Outline, size = StanceButtonSize.Small, leadingIcon = StanceIcons.Refresh)
                }
            }
        }
    }
}
