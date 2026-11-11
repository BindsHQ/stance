package com.bindshq.stance.components.data

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.foundation.colors
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * A row in a list: optional leading content, a headline, supporting text and trailing content.
 * With [onClick] the whole row is one button for screen readers.
 */
@Composable
public fun StanceListItem(
    headline: String,
    modifier: Modifier = Modifier,
    supporting: String? = null,
    overline: String? = null,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = StanceSizes.touchTarget + StanceSpacing.space2)
            .then(if (onClick != null) Modifier.clickable(enabled = enabled, role = Role.Button, onClick = onClick) else Modifier)
            .padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space2),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        leading?.invoke()
        Column(modifier = Modifier.weight(1f)) {
            if (overline != null) Text(overline, style = StanceTheme.typography.labelSmall, color = c.fgMuted)
            Text(headline, style = StanceTheme.typography.body, color = if (enabled) c.fgDefault else c.fgDisabled)
            if (supporting != null) Text(supporting, style = StanceTheme.typography.bodySmall, color = if (enabled) c.fgMuted else c.fgDisabled)
        }
        trailing?.invoke()
    }
}

/**
 * Linear progress. Pass [progress] between 0 and 1, or null while the amount is unknown.
 * Announced with the label and percentage.
 */
@Composable
public fun StanceProgressIndicator(
    progress: Float?,
    modifier: Modifier = Modifier,
    label: String? = null,
    tone: StanceTone = StanceTone.Neutral,
    showValue: Boolean = true,
) {
    val c = StanceTheme.colors
    val color = if (tone == StanceTone.Neutral) c.accentBg else tone.colors().solid
    val percent = progress?.let { "${(it.coerceIn(0f, 1f) * 100).toInt()}%" }
    Column(
        modifier = modifier.semantics(mergeDescendants = true) {
            if (label != null) contentDescription = label
            if (percent != null) stateDescription = percent
        },
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space15),
    ) {
        if (label != null || (showValue && percent != null)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(label.orEmpty(), style = StanceTheme.typography.label, color = c.fgDefault, modifier = Modifier.clearAndSetSemantics {})
                if (showValue && percent != null) {
                    Text(percent, style = StanceTheme.typography.label, color = c.fgMuted, modifier = Modifier.clearAndSetSemantics {})
                }
            }
        }
        if (progress != null) {
            LinearProgressIndicator(
                progress = { progress.coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().height(StanceSpacing.space2),
                color = color,
                trackColor = c.bgEmphasis,
                strokeCap = StrokeCap.Round,
                drawStopIndicator = {},
            )
        } else {
            LinearProgressIndicator(
                modifier = Modifier.fillMaxWidth().height(StanceSpacing.space2),
                color = color,
                trackColor = c.bgEmphasis,
                strokeCap = StrokeCap.Round,
            )
        }
    }
}

/** Circular progress, determinate when [progress] is set. [contentDescription] names what is loading. */
@Composable
public fun StanceCircularProgressIndicator(
    contentDescription: String,
    modifier: Modifier = Modifier,
    progress: Float? = null,
    size: Dp = StanceSizes.controlMedium,
) {
    val c = StanceTheme.colors
    val base = modifier.size(size).semantics { this.contentDescription = contentDescription }
    if (progress != null) {
        CircularProgressIndicator(progress = { progress.coerceIn(0f, 1f) }, modifier = base, color = c.accentBg, trackColor = c.bgEmphasis)
    } else {
        CircularProgressIndicator(modifier = base, color = c.accentBg, trackColor = c.bgEmphasis)
    }
}

/**
 * A placeholder shown while content loads. Hidden from screen readers: announce loading on the
 * container instead. The pulse stops when the system has animations turned off.
 */
@Composable
public fun StanceSkeleton(
    modifier: Modifier = Modifier,
    width: Dp? = null,
    height: Dp = StanceSpacing.space4,
    circle: Boolean = false,
) {
    val c = StanceTheme.colors
    val alpha = if (StanceTheme.motion.reduceMotion) {
        1f
    } else {
        val transition = rememberInfiniteTransition(label = "stance-skeleton")
        val value by transition.animateFloat(
            initialValue = 1f,
            targetValue = 0.5f,
            animationSpec = infiniteRepeatable(tween(StanceTheme.motion.slowMillis * 3), RepeatMode.Reverse),
            label = "stance-skeleton-alpha",
        )
        value
    }
    Box(
        modifier = modifier
            .then(if (width != null) Modifier.width(width) else Modifier.fillMaxWidth())
            .height(height)
            .alpha(alpha)
            .clip(if (circle) CircleShape else StanceTheme.shapes.small)
            .background(c.bgEmphasis)
            .clearAndSetSemantics {},
    )
}

/**
 * Explains an empty screen or list and offers the next step.
 */
@Composable
public fun StanceEmptyState(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    icon: ImageVector = StanceIcons.Inbox,
    action: (@Composable () -> Unit)? = null,
) {
    val c = StanceTheme.colors
    Column(
        modifier = modifier.fillMaxWidth().padding(StanceSpacing.space8),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
    ) {
        Box(
            modifier = Modifier.size(StanceSizes.controlLarge + StanceSpacing.space2).clip(CircleShape).background(c.bgMuted),
            contentAlignment = Alignment.Center,
        ) { StanceIcon(icon, contentDescription = null, size = StanceSizes.iconLarge, tint = c.fgMuted) }
        Text(title, style = StanceTheme.typography.headingSmall, color = c.fgDefault, textAlign = TextAlign.Center, modifier = Modifier.semantics { heading() })
        if (description != null) {
            Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = StanceSizes.contentMaxWidth / 2))
        }
        if (action != null) {
            Spacer(Modifier.height(StanceSpacing.space1))
            action()
        }
    }
}

/** One event in a [StanceTimeline]. */
public data class StanceTimelineEvent(
    val title: String,
    val time: String,
    val description: String? = null,
    val tone: StanceTone = StanceTone.Neutral,
)

/**
 * A vertical sequence of events, newest or oldest first. Each event is read as one item.
 */
@Composable
public fun StanceTimeline(events: List<StanceTimelineEvent>, modifier: Modifier = Modifier) {
    val c = StanceTheme.colors
    Column(modifier = modifier) {
        events.forEachIndexed { index, event ->
            Row(
                modifier = Modifier.fillMaxWidth().semantics(mergeDescendants = true) {},
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier
                            .padding(top = StanceSpacing.space15)
                            .size(StanceSpacing.space25)
                            .clip(CircleShape)
                            .background(if (event.tone == StanceTone.Neutral) c.accentBg else event.tone.colors().solid),
                    )
                    if (index < events.lastIndex) {
                        Box(Modifier.width(StanceSpacing.hairline * 2).height(StanceSpacing.space12).background(c.borderDefault))
                    }
                }
                Column(modifier = Modifier.weight(1f).padding(bottom = StanceSpacing.space4)) {
                    Text(event.title, style = StanceTheme.typography.title, color = c.fgDefault)
                    Text(event.time, style = StanceTheme.typography.caption, color = c.fgMuted)
                    if (event.description != null) {
                        Text(event.description, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
                    }
                }
            }
        }
    }
}

/**
 * A key figure with its label and change. The change is spoken in words, for example
 * "up 12% from last month", so its meaning does not depend on colour or an arrow.
 *
 * @param changeDescription Full sentence for screen readers.
 * @param positive Whether the change is good news; null shows it neutrally.
 */
@Composable
public fun StanceStatCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    change: String? = null,
    changeDescription: String? = null,
    positive: Boolean? = null,
    icon: ImageVector? = null,
) {
    val c = StanceTheme.colors
    StanceCard(modifier = modifier.semantics(mergeDescendants = true) {}) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            if (icon != null) StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
            Text(label, style = StanceTheme.typography.label, color = c.fgMuted)
        }
        Spacer(Modifier.height(StanceSpacing.space2))
        Text(value, style = StanceTheme.typography.headingLarge, color = c.fgDefault)
        if (change != null) {
            Spacer(Modifier.height(StanceSpacing.space1))
            val color = when (positive) {
                true -> c.successFg
                false -> c.dangerFg
                null -> c.fgMuted
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                modifier = Modifier.clearAndSetSemantics { contentDescription = changeDescription ?: change },
            ) {
                if (positive != null) {
                    StanceIcon(if (positive) StanceIcons.ArrowUp else StanceIcons.ArrowDown, null, size = StanceSizes.iconSmall, tint = color)
                }
                Text(change, style = StanceTheme.typography.label, color = color)
            }
        }
    }
}

/**
 * Pairs of terms and details, such as the properties of a contract. Each pair is read together.
 */
@Composable
public fun StanceDescriptionList(items: List<Pair<String, String>>, modifier: Modifier = Modifier) {
    val c = StanceTheme.colors
    Column(modifier = modifier) {
        items.forEachIndexed { index, (term, detail) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = StanceSpacing.space3)
                    .semantics(mergeDescendants = true) {},
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4),
            ) {
                Text(term, style = StanceTheme.typography.bodySmall, color = c.fgMuted, modifier = Modifier.weight(1f))
                Text(detail, style = StanceTheme.typography.bodySmall, color = c.fgDefault, modifier = Modifier.weight(2f))
            }
            if (index < items.lastIndex) StanceDivider()
        }
    }
}

/** A column in a [StanceDataTable]. */
public data class StanceTableColumn<T>(val header: String, val width: Dp = StanceSizes.tableColumnWidth, val numeric: Boolean = false, val cell: (T) -> String)

/**
 * A simple table for small sets of records. It scrolls horizontally when columns do not fit,
 * headers are marked as headings, and each row is read as "header: value" pairs.
 * For long lists on phones prefer `StanceListItem`.
 */
@Composable
public fun <T> StanceDataTable(
    columns: List<StanceTableColumn<T>>,
    rows: List<T>,
    modifier: Modifier = Modifier,
    caption: String? = null,
    onRowClick: ((T) -> Unit)? = null,
) {
    val c = StanceTheme.colors
    Column(modifier = modifier.semantics { if (caption != null) contentDescription = caption }) {
        Column(modifier = Modifier.horizontalScroll(rememberScrollState())) {
            Row(modifier = Modifier.background(c.bgSubtle)) {
                columns.forEach { column ->
                    Text(
                        column.header,
                        style = StanceTheme.typography.labelSmall,
                        color = c.fgMuted,
                        textAlign = if (column.numeric) TextAlign.End else TextAlign.Start,
                        modifier = Modifier
                            .width(column.width)
                            .padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space3)
                            .semantics { heading() },
                    )
                }
            }
            StanceDivider()
            rows.forEachIndexed { index, row ->
                val description = columns.joinToString(", ") { "${it.header}: ${it.cell(row)}" }
                Row(
                    modifier = Modifier
                        .heightIn(min = StanceSizes.touchTarget)
                        .then(if (onRowClick != null) Modifier.clickable(role = Role.Button) { onRowClick(row) } else Modifier)
                        .clearAndSetSemantics { contentDescription = description },
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    columns.forEach { column ->
                        Text(
                            column.cell(row),
                            style = StanceTheme.typography.bodySmall,
                            color = c.fgDefault,
                            textAlign = if (column.numeric) TextAlign.End else TextAlign.Start,
                            modifier = Modifier.width(column.width).padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space3),
                        )
                    }
                }
                if (index < rows.lastIndex) StanceDivider()
            }
        }
    }
}
