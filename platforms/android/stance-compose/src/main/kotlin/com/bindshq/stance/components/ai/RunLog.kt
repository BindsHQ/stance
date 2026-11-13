@file:OptIn(ExperimentalLayoutApi::class)

package com.bindshq.stance.components.ai

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceCopyButton
import com.bindshq.stance.components.forms.StanceFilterChip
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import kotlinx.coroutines.launch

/** How serious a line of a [StanceRunLog] is, from least to most. */
public enum class StanceLogLevel { Debug, Info, Warn, Error }

/**
 * One line of a [StanceRunLog].
 *
 * @param id Unique and stable, so the list keeps its place while lines arrive.
 * @param time The formatted time, for example "10:41:07".
 */
@Immutable
public data class StanceLogEntry(
    val id: String,
    val level: StanceLogLevel,
    val text: String,
    val time: String? = null,
)

/** The lines of [entries] whose level is in [levels], in order. */
public fun stanceFilterLog(entries: List<StanceLogEntry>, levels: Set<StanceLogLevel>): List<StanceLogEntry> =
    if (levels.size == StanceLogLevel.entries.size) entries else entries.filter { it.level in levels }

/** The [levels] after [level] is switched on or off. */
public fun stanceToggleLogLevel(levels: Set<StanceLogLevel>, level: StanceLogLevel): Set<StanceLogLevel> =
    if (level in levels) levels - level else levels + level

/** A log line as plain text, as it is copied: time, level, text. */
internal fun stanceLogLine(entry: StanceLogEntry, level: String): String =
    listOfNotNull(entry.time, level, entry.text).joinToString(" ")

internal fun logLevelLabelRes(level: StanceLogLevel): Int = when (level) {
    StanceLogLevel.Debug -> R.string.stance_ai_log_debug
    StanceLogLevel.Info -> R.string.stance_ai_log_info
    StanceLogLevel.Warn -> R.string.stance_ai_log_warn
    StanceLogLevel.Error -> R.string.stance_ai_log_error
}

/**
 * A live, monospaced log of an agent run, on a lazy column.
 *
 * It follows the newest line the way [StanceThread] does: only while the reader is at the bottom,
 * releasing as soon as they scroll up, with a button to return. Lines are keyed by id and only the
 * visible ones are composed, so a long run stays smooth. Log text reads left to right in every
 * language.
 *
 * Each line carries its level as a word, never by colour alone. For screen readers the log is a
 * region named [label] and lines are not announced as they arrive. Only errors are: the header
 * keeps a count of them with the latest one, as a polite live region, so each new error is heard once.
 *
 * @param follow Follow the newest line while the reader is at the bottom.
 * @param levels The levels shown.
 * @param onLevelsChange Shows the level filter chips when set, and is called with the new set.
 * @param wrap Wraps long lines. Otherwise the log scrolls sideways.
 * @param maxHeight The tallest the log grows before it scrolls.
 * @param copyable Adds a button that copies the shown lines.
 * @param errorSummary The words of the error count, from the number of errors and the latest one.
 */
@Composable
public fun StanceRunLog(
    entries: List<StanceLogEntry>,
    modifier: Modifier = Modifier,
    follow: Boolean = true,
    levels: Set<StanceLogLevel> = StanceLogLevel.entries.toSet(),
    onLevelsChange: ((Set<StanceLogLevel>) -> Unit)? = null,
    wrap: Boolean = true,
    maxHeight: Dp = StanceSpacing.space32 * 2,
    state: StanceThreadState = rememberStanceThreadState(),
    copyable: Boolean = true,
    onCopy: ((Boolean) -> Unit)? = null,
    label: String = stringResource(R.string.stance_ai_log),
    copyLabel: String = stringResource(R.string.stance_ai_log_copy),
    emptyText: String = stringResource(R.string.stance_ai_log_empty),
    levelLabel: (StanceLogLevel) -> String = rememberFromResources { r -> { level -> r.getString(logLevelLabelRes(level)) } },
    errorSummary: (count: Int, latest: String) -> String =
        rememberFromResources { r -> { count, latest -> r.getString(R.string.stance_ai_log_errors, count, latest) } },
) {
    val c = StanceTheme.colors
    val shape = StanceTheme.shapes.medium
    // Derived, so a list that is appended to in place, such as a snapshot state list, is followed too.
    val current by rememberUpdatedState(entries)
    val shown by remember(levels) { derivedStateOf { stanceFilterLog(current, levels) } }
    val errors by remember { derivedStateOf { current.filter { it.level == StanceLogLevel.Error } } }
    val stick by rememberUpdatedState(follow)
    LaunchedEffect(state) { state.followNewest { stick } }
    val scope = rememberCoroutineScope()
    val animate = !StanceTheme.motion.reduceMotion
    val listState = state.listState
    val away by remember(state) { derivedStateOf { listState.canScrollForward && !state.isPinned } }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(c.bgSubtle)
            .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, shape),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().heightIn(min = StanceSizes.touchTarget).padding(start = StanceSpacing.space4),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(label, style = StanceTheme.typography.label, color = c.fgMuted, modifier = Modifier.weight(1f).semantics { heading() })
            if (errors.isNotEmpty()) {
                Row(
                    modifier = Modifier.clearAndSetSemantics {
                        contentDescription = errorSummary(errors.size, errors.last().text)
                        liveRegion = LiveRegionMode.Polite
                    },
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    StanceIcon(StanceIcons.AlertCircle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.dangerFg)
                    Text(errors.size.toString(), style = StanceTheme.typography.labelSmall, color = c.dangerFg)
                }
            }
            if (copyable) {
                StanceCopyButton(
                    value = { shown.joinToString("\n") { stanceLogLine(it, levelLabel(it.level)) } },
                    label = copyLabel,
                    onCopy = onCopy,
                )
            }
        }
        if (onLevelsChange != null) {
            // The chips wrap, so every level stays in reach at any text size.
            FlowRow(
                modifier = Modifier.padding(horizontal = StanceSpacing.space4),
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            ) {
                StanceLogLevel.entries.forEach { level ->
                    StanceFilterChip(levelLabel(level), selected = level in levels, onClick = { onLevelsChange(stanceToggleLogLevel(levels, level)) })
                }
            }
        }
        StanceDivider()
        if (shown.isEmpty()) {
            Text(emptyText, style = StanceTheme.typography.bodySmall, color = c.fgMuted, modifier = Modifier.padding(StanceSpacing.space4))
        }
        Box(modifier = Modifier.heightIn(max = maxHeight)) {
            // Log output is written left to right in every language.
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                val time = SpanStyle(color = c.fgSubtle)
                val word = SpanStyle(fontWeight = FontWeight.SemiBold)
                // Every line keeps its full line height, so a wrapped line is spaced like the lines around it.
                val code = StanceTheme.typography.code
                val lineStyle = remember(code) { code.copy(lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None)) }
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .then(if (wrap) Modifier else Modifier.horizontalScroll(rememberScrollState()))
                        .semantics {
                            contentDescription = label
                            isTraversalGroup = true
                        },
                    state = listState,
                    contentPadding = PaddingValues(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space3),
                ) {
                    items(shown, key = { it.id }, contentType = { it.level }) { entry ->
                        val line = remember(entry, time, word) { logLine(entry, levelLabel(entry.level), time, word) }
                        Text(
                            line,
                            style = lineStyle,
                            color = when (entry.level) {
                                StanceLogLevel.Error -> c.dangerFg
                                StanceLogLevel.Debug -> c.fgMuted
                                else -> c.fgDefault
                            },
                            softWrap = wrap,
                        )
                    }
                }
            }
            Box(modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = StanceSpacing.space2)) {
                StanceScrollToLatest(away, onClick = { scope.launch { state.scrollToLatest(animate) } })
            }
        }
    }
}

private fun logLine(entry: StanceLogEntry, level: String, time: SpanStyle, word: SpanStyle): AnnotatedString = buildAnnotatedString {
    if (entry.time != null) {
        withStyle(time) { append(entry.time) }
        append(' ')
    }
    withStyle(word) { append(level) }
    append(' ')
    append(entry.text)
}
