package com.bindshq.stance.components.ai

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.LayoutDirection
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.foundation.rememberStanceWindowWidth
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** What a line of a diff does. */
public enum class StanceDiffLineKind { Add, Remove, Context }

/**
 * One line of a diff.
 *
 * @param oldNumber Its line number before the change, or null for an added line.
 * @param newNumber Its line number after the change, or null for a removed line.
 */
@Immutable
public data class StanceDiffLine(
    val kind: StanceDiffLineKind,
    val text: String,
    val oldNumber: Int? = null,
    val newNumber: Int? = null,
)

/**
 * A group of neighbouring changed lines, decided on as one.
 *
 * @param id Unique across the whole review.
 * @param header The position line, for example "@@ 12,6 @@".
 */
@Immutable
public data class StanceDiffHunk(val id: String, val lines: List<StanceDiffLine>, val header: String? = null)

/** What a change does to a file. */
public enum class StanceDiffFileStatus { Added, Modified, Deleted, Renamed }

/** One changed file of a [StanceDiffReview]. */
@Immutable
public data class StanceDiffFile(
    val id: String,
    val path: String,
    val hunks: List<StanceDiffHunk>,
    val status: StanceDiffFileStatus = StanceDiffFileStatus.Modified,
)

/** The person's call on one hunk. */
public enum class StanceDiffDecision { Accepted, Rejected }

/** How a [StanceDiffReview] lays out a hunk. */
public enum class StanceDiffView {
    /** Old and new lines in one column, for narrow windows. */
    Unified,

    /** Old lines on the left and new lines on the right, for wide windows. */
    Split,
}

/**
 * The decisions after [decision] is given for the hunk [hunkId]. Giving the decision a hunk
 * already has takes it back, so a hunk can return to undecided.
 */
public fun stanceDiffDecide(
    decisions: Map<String, StanceDiffDecision>,
    hunkId: String,
    decision: StanceDiffDecision,
): Map<String, StanceDiffDecision> = if (decisions[hunkId] == decision) decisions - hunkId else decisions + (hunkId to decision)

/** [decision] for every hunk of [files], as accept all and reject all give. */
public fun stanceDiffDecideAll(files: List<StanceDiffFile>, decision: StanceDiffDecision): Map<String, StanceDiffDecision> =
    files.flatMap { it.hunks }.associate { it.id to decision }

/** How many lines [lines] add and remove. */
internal fun stanceDiffCounts(lines: List<StanceDiffLine>): Pair<Int, Int> =
    lines.count { it.kind == StanceDiffLineKind.Add } to lines.count { it.kind == StanceDiffLineKind.Remove }

/** One row of the split view: the old line and the new line that sit side by side. Either can be absent. */
internal data class StanceDiffSplitRow(val old: StanceDiffLine?, val new: StanceDiffLine?)

/**
 * The rows of the split view. A context line fills both sides. A run of removed lines is paired
 * with the run of added lines that follows it, and the longer run leaves gaps on the other side.
 */
internal fun stanceDiffSplitRows(lines: List<StanceDiffLine>): List<StanceDiffSplitRow> {
    val rows = mutableListOf<StanceDiffSplitRow>()
    var i = 0
    while (i < lines.size) {
        if (lines[i].kind == StanceDiffLineKind.Context) {
            rows += StanceDiffSplitRow(lines[i], lines[i])
            i++
            continue
        }
        val removed = mutableListOf<StanceDiffLine>()
        while (i < lines.size && lines[i].kind == StanceDiffLineKind.Remove) removed += lines[i++]
        val added = mutableListOf<StanceDiffLine>()
        while (i < lines.size && lines[i].kind == StanceDiffLineKind.Add) added += lines[i++]
        for (row in 0 until maxOf(removed.size, added.size)) rows += StanceDiffSplitRow(removed.getOrNull(row), added.getOrNull(row))
    }
    return rows
}

/** The mark that starts a diff line, so a change never depends on colour: plus, minus or a space. */
internal fun stanceDiffPrefix(kind: StanceDiffLineKind): Char = when (kind) {
    StanceDiffLineKind.Add -> '+'
    StanceDiffLineKind.Remove -> '-'
    StanceDiffLineKind.Context -> ' '
}

/** The words of a [StanceDiffReview]. Build with [StanceDiffReviewDefaults.labels]. */
@Immutable
public data class StanceDiffLabels(
    val accept: String,
    val reject: String,
    val acceptAll: String,
    val rejectAll: String,
    val accepted: String,
    val rejected: String,
    /** Spoken before an added line. */
    val added: String,
    /** Spoken before a removed line. */
    val removed: String,
    val fileStatus: (StanceDiffFileStatus) -> String,
    /** Names a hunk, from its position in the file, the number of hunks and the path. */
    val change: (index: Int, count: Int, path: String) -> String,
)

/** Defaults for [StanceDiffReview]. */
public object StanceDiffReviewDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        accept: String = stringResource(R.string.stance_ai_diff_accept),
        reject: String = stringResource(R.string.stance_ai_diff_reject),
        acceptAll: String = stringResource(R.string.stance_ai_diff_accept_all),
        rejectAll: String = stringResource(R.string.stance_ai_diff_reject_all),
        accepted: String = stringResource(R.string.stance_ai_diff_accepted),
        rejected: String = stringResource(R.string.stance_ai_diff_rejected),
        added: String = stringResource(R.string.stance_ai_diff_added),
        removed: String = stringResource(R.string.stance_ai_diff_removed),
    ): StanceDiffLabels {
        val fileStatus: (StanceDiffFileStatus) -> String = rememberFromResources { r ->
            { status ->
                r.getString(
                    when (status) {
                        StanceDiffFileStatus.Added -> R.string.stance_ai_diff_file_added
                        StanceDiffFileStatus.Modified -> R.string.stance_ai_diff_file_modified
                        StanceDiffFileStatus.Deleted -> R.string.stance_ai_diff_file_deleted
                        StanceDiffFileStatus.Renamed -> R.string.stance_ai_diff_file_renamed
                    },
                )
            }
        }
        val change: (Int, Int, String) -> String =
            rememberFromResources { r -> { index, count, path -> r.getString(R.string.stance_ai_diff_change, index, count, path) } }
        return StanceDiffLabels(accept, reject, acceptAll, rejectAll, accepted, rejected, added, removed, fileStatus, change)
    }
}

/**
 * Shows a proposed change as a diff, file by file and hunk by hunk, with accept and reject for
 * each hunk and for all of them.
 *
 * The view follows the window size class: unified on compact and medium widths, split on
 * expanded widths. Added and removed lines start with a plus or a minus and are read with the
 * words Added and Removed, on the success and danger roles, so the change never depends on colour.
 * Each hunk is a named group with its own Accept and Reject buttons, also offered as accessibility
 * actions, and its decision is announced once. Code reads left to right in every language. Accept
 * and reject give haptic feedback.
 *
 * Decisions are hoisted: [onDecisionsChange] receives the whole map after every tap, and accept
 * all and reject all go through it too.
 *
 * @param decisions The decision for each hunk id. A hunk without one is undecided.
 * @param onAcceptAll Called after accept all, once the decisions have been reported.
 * @param onRejectAll Called after reject all.
 * @param collapsedIds The ids of the files whose hunks are hidden.
 * @param onCollapsedChange Makes file headers collapsible and is called with the new set.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
public fun StanceDiffReview(
    files: List<StanceDiffFile>,
    decisions: Map<String, StanceDiffDecision>,
    onDecisionsChange: (Map<String, StanceDiffDecision>) -> Unit,
    modifier: Modifier = Modifier,
    view: StanceDiffView = if (rememberStanceWindowWidth() == StanceWindowWidth.Expanded) StanceDiffView.Split else StanceDiffView.Unified,
    onAcceptAll: (() -> Unit)? = null,
    onRejectAll: (() -> Unit)? = null,
    collapsedIds: Set<String> = emptySet(),
    onCollapsedChange: ((Set<String>) -> Unit)? = null,
    labels: StanceDiffLabels = StanceDiffReviewDefaults.labels(),
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    val decide = { hunk: String, decision: StanceDiffDecision ->
        haptics.performHapticFeedback(if (decision == StanceDiffDecision.Accepted) HapticFeedbackType.Confirm else HapticFeedbackType.Reject)
        onDecisionsChange(stanceDiffDecide(decisions, hunk, decision))
    }
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            StanceButton(labels.acceptAll, onClick = {
                haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                onDecisionsChange(stanceDiffDecideAll(files, StanceDiffDecision.Accepted))
                onAcceptAll?.invoke()
            }, variant = StanceButtonVariant.Secondary, size = StanceButtonSize.Small, leadingIcon = StanceIcons.Check)
            StanceButton(labels.rejectAll, onClick = {
                haptics.performHapticFeedback(HapticFeedbackType.Reject)
                onDecisionsChange(stanceDiffDecideAll(files, StanceDiffDecision.Rejected))
                onRejectAll?.invoke()
            }, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, leadingIcon = StanceIcons.X)
        }
        files.forEach { file ->
            key(file.id) {
                val collapsed = file.id in collapsedIds
                AiCard {
                    DiffFileHeader(
                        file = file,
                        labels = labels,
                        collapsed = collapsed,
                        onToggle = onCollapsedChange?.let { change -> { change(if (collapsed) collapsedIds - file.id else collapsedIds + file.id) } },
                    )
                    if (!collapsed) {
                        file.hunks.forEachIndexed { index, hunk ->
                            key(hunk.id) {
                                StanceDivider()
                                DiffHunk(
                                    hunk = hunk,
                                    name = labels.change(index + 1, file.hunks.size, file.path),
                                    decision = decisions[hunk.id],
                                    view = view,
                                    labels = labels,
                                    onDecide = { decide(hunk.id, it) },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DiffFileHeader(file: StanceDiffFile, labels: StanceDiffLabels, collapsed: Boolean, onToggle: (() -> Unit)?) {
    val c = StanceTheme.colors
    val (added, removed) = remember(file) { stanceDiffCounts(file.hunks.flatMap { it.lines }) }
    val status = labels.fileStatus(file.status)
    val expandedText = stringResource(R.string.stance_expanded)
    val collapsedText = stringResource(R.string.stance_collapsed)
    val spoken = stringResource(R.string.stance_ai_diff_file, file.path, status, added, removed)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = StanceSizes.touchTarget)
            .then(if (onToggle != null) Modifier.clickable(role = Role.Button, onClick = onToggle) else Modifier)
            .clearAndSetSemantics {
                contentDescription = spoken
                heading()
                if (onToggle != null) {
                    stateDescription = if (collapsed) collapsedText else expandedText
                    if (collapsed) expand { onToggle(); true } else collapse { onToggle(); true }
                }
            }
            .padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space2),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        StanceIcon(StanceIcons.FileText, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
        Column(modifier = Modifier.weight(1f)) {
            // A path reads left to right in every language.
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                Text(file.path, style = StanceTheme.typography.code, color = c.fgDefault)
            }
            Text(status, style = StanceTheme.typography.caption, color = c.fgMuted)
        }
        Text("+$added", style = StanceTheme.typography.code, color = c.successFg)
        Text("-$removed", style = StanceTheme.typography.code, color = c.dangerFg)
        if (onToggle != null) {
            StanceIcon(if (collapsed) StanceIcons.ChevronDown else StanceIcons.ChevronUp, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DiffHunk(
    hunk: StanceDiffHunk,
    name: String,
    decision: StanceDiffDecision?,
    view: StanceDiffView,
    labels: StanceDiffLabels,
    onDecide: (StanceDiffDecision) -> Unit,
) {
    val c = StanceTheme.colors
    Column(
        modifier = Modifier.fillMaxWidth().semantics {
            contentDescription = name
            isTraversalGroup = true
            customActions = listOf(
                CustomAccessibilityAction(labels.accept) { onDecide(StanceDiffDecision.Accepted); true },
                CustomAccessibilityAction(labels.reject) { onDecide(StanceDiffDecision.Rejected); true },
            )
        },
    ) {
        // Code is written left to right in every language.
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            Column {
                if (hunk.header != null) {
                    Text(
                        hunk.header,
                        style = StanceTheme.typography.code,
                        color = c.fgSubtle,
                        modifier = Modifier.padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space1),
                    )
                }
                if (view == StanceDiffView.Split) {
                    val rows = remember(hunk) { stanceDiffSplitRows(hunk.lines) }
                    Row {
                        DiffSide(rows.map { it.old }, old = true, labels = labels, modifier = Modifier.weight(1f))
                        StanceDivider(vertical = true)
                        DiffSide(rows.map { it.new }, old = false, labels = labels, modifier = Modifier.weight(1f))
                    }
                } else {
                    DiffSide(hunk.lines, old = null, labels = labels, modifier = Modifier.fillMaxWidth())
                }
            }
        }
        FlowRow(
            modifier = Modifier.padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space1),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            itemVerticalAlignment = Alignment.CenterVertically,
        ) {
            StanceButton(
                labels.accept,
                onClick = { onDecide(StanceDiffDecision.Accepted) },
                variant = if (decision == StanceDiffDecision.Accepted) StanceButtonVariant.Secondary else StanceButtonVariant.Outline,
                size = StanceButtonSize.Small,
                leadingIcon = StanceIcons.Check,
            )
            StanceButton(
                labels.reject,
                onClick = { onDecide(StanceDiffDecision.Rejected) },
                variant = if (decision == StanceDiffDecision.Rejected) StanceButtonVariant.Secondary else StanceButtonVariant.Outline,
                size = StanceButtonSize.Small,
                leadingIcon = StanceIcons.X,
            )
            if (decision != null) {
                val accepted = decision == StanceDiffDecision.Accepted
                Row(
                    modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    StanceIcon(if (accepted) StanceIcons.CheckCircle else StanceIcons.XCircle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
                    Text(if (accepted) labels.accepted else labels.rejected, style = StanceTheme.typography.labelSmall, color = c.fgMuted)
                }
            }
        }
    }
}

/**
 * One column of diff lines as a single text beside its line numbers, so a long hunk is two text
 * nodes and not one per line. Line backgrounds are drawn behind the text from its layout.
 *
 * @param old True for the old side of a split view, false for the new side, null for the unified view.
 */
@Composable
private fun DiffSide(lines: List<StanceDiffLine?>, old: Boolean?, labels: StanceDiffLabels, modifier: Modifier = Modifier) {
    val c = StanceTheme.colors
    val style = StanceTheme.typography.code
    val mark = SpanStyle(fontWeight = FontWeight.SemiBold)
    val text = remember(lines, c) {
        buildAnnotatedString {
            lines.forEachIndexed { index, line ->
                if (index > 0) append('\n')
                if (line == null) return@forEachIndexed
                val colour = when (line.kind) {
                    StanceDiffLineKind.Add -> c.successFg
                    StanceDiffLineKind.Remove -> c.dangerFg
                    StanceDiffLineKind.Context -> c.fgSubtle
                }
                withStyle(mark.copy(color = colour)) { append(stanceDiffPrefix(line.kind)) }
                append(' ')
                append(line.text)
            }
        }
    }
    val spoken = remember(lines, labels) {
        lines.filterNotNull().joinToString("\n") { line ->
            when (line.kind) {
                StanceDiffLineKind.Add -> "${labels.added}: ${line.text}"
                StanceDiffLineKind.Remove -> "${labels.removed}: ${line.text}"
                StanceDiffLineKind.Context -> line.text
            }
        }
    }
    val numbers = remember(lines, old) {
        fun column(pick: (StanceDiffLine) -> Int?): String {
            val width = lines.maxOfOrNull { line -> line?.let(pick)?.toString()?.length ?: 0 } ?: 0
            return lines.joinToString("\n") { line -> (line?.let(pick)?.toString() ?: "").padStart(width) }
        }
        when (old) {
            true -> listOf(column { it.oldNumber })
            false -> listOf(column { it.newNumber })
            null -> listOf(column { it.oldNumber }, column { it.newNumber })
        }
    }
    var layout by remember { mutableStateOf<TextLayoutResult?>(null) }
    val addBackground = c.successBg
    val removeBackground = c.dangerBg
    Row(
        modifier = modifier
            .padding(vertical = StanceSpacing.space1)
            .drawBehind {
                val result = layout ?: return@drawBehind
                lines.forEachIndexed { index, line ->
                    val colour = when (line?.kind) {
                        StanceDiffLineKind.Add -> addBackground
                        StanceDiffLineKind.Remove -> removeBackground
                        else -> Color.Transparent
                    }
                    if (colour != Color.Transparent && index < result.lineCount) {
                        val top = result.getLineTop(index)
                        drawRect(colour, topLeft = Offset(0f, top), size = Size(size.width, result.getLineBottom(index) - top))
                    }
                }
            },
    ) {
        numbers.forEach { column ->
            if (column.isNotBlank()) {
                Text(
                    column,
                    style = style.copy(textAlign = TextAlign.End),
                    color = c.fgSubtle,
                    modifier = Modifier.padding(start = StanceSpacing.space2).widthIn(min = StanceSpacing.space4).clearAndSetSemantics { },
                )
            }
        }
        Text(
            text,
            style = style,
            color = c.fgDefault,
            softWrap = false,
            onTextLayout = { layout = it },
            modifier = Modifier
                .weight(1f)
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = StanceSpacing.space3)
                .clearAndSetSemantics { contentDescription = spoken },
        )
    }
}
