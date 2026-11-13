package com.bindshq.stance.components.ai

import androidx.activity.compose.BackHandler
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonGroup
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceCopyButton
import com.bindshq.stance.components.actions.StanceDropdownMenu
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.data.StanceChart
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceChartType
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.components.data.StanceDataTable
import com.bindshq.stance.components.data.StanceProgressIndicator
import com.bindshq.stance.components.data.StanceTableColumn
import com.bindshq.stance.components.feedback.predictiveBackScale
import com.bindshq.stance.components.navigation.StanceTabs
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.foundation.rememberStanceWindowWidth
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import java.text.NumberFormat
import java.util.Locale

// Wave two, output: what the assistant made, drawn safely and with the means to use it.
// StanceMarkdownRenderer is in Markdown.kt.

/**
 * Runs [onBack] on the back gesture. With predictive back the surface shrinks a little as the
 * gesture progresses, as [com.bindshq.stance.components.feedback.StanceDialog] does. Does nothing
 * where there is no back dispatcher, such as a bare ComposeView.
 */
@Composable
internal fun Modifier.dismissOnBack(onBack: () -> Unit): Modifier {
    if (LocalOnBackPressedDispatcherOwner.current == null) return this
    if (StanceTheme.motion.reduceMotion) {
        BackHandler(onBack = onBack)
        return this
    }
    return predictiveBackScale(onBack)
}

// ───────────── Code suggestion ─────────────

/**
 * A generated code block with its language and file name, and actions to copy, apply and run it,
 * plus the result of a run. Builds on [StanceCodeBlock], with its highlighting.
 *
 * Apply confirms itself: the button turns into "Applied" and that is announced. The run status is
 * a polite live region, so starting, finishing and failing are each heard once. While [streaming]
 * the actions wait, since half a snippet should not be applied or run. Apply gives haptic feedback.
 *
 * @param filename Shown in the header, for example "Deploy.kt".
 * @param onApply Shows the apply button when set.
 * @param onRun Shows the run button when set.
 * @param runStatus Where the last run is, or null when the code has not been run.
 * @param runOutput What the run printed.
 * @param applied Set once the code has been applied.
 */
@Composable
public fun StanceCodeSuggestion(
    code: String,
    modifier: Modifier = Modifier,
    language: String? = null,
    filename: String? = null,
    onApply: (() -> Unit)? = null,
    onRun: (() -> Unit)? = null,
    onCopy: ((Boolean) -> Unit)? = null,
    runStatus: StanceStepStatus? = null,
    runOutput: String? = null,
    applied: Boolean = false,
    wrap: Boolean = false,
    showLineNumbers: Boolean = false,
    streaming: Boolean = false,
    applyLabel: String = stringResource(R.string.stance_ai_code_apply),
    appliedLabel: String = stringResource(R.string.stance_ai_code_applied),
    runLabel: String = stringResource(R.string.stance_ai_code_run),
    outputLabel: String = stringResource(R.string.stance_ai_tool_output),
    statusLabel: (StanceStepStatus) -> String = defaultStepStatusLabel(),
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceCodeBlock(code, title = filename, language = language, showLineNumbers = showLineNumbers, copyable = false, wrap = wrap)
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StanceCopyButton(text = code, showLabel = true, enabled = !streaming, onCopy = onCopy)
            if (onApply != null) {
                StanceButton(
                    if (applied) appliedLabel else applyLabel,
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                        onApply()
                    },
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                    variant = StanceButtonVariant.Secondary,
                    size = StanceButtonSize.Small,
                    enabled = !applied && !streaming,
                    leadingIcon = if (applied) StanceIcons.Check else null,
                )
            }
            if (onRun != null) {
                StanceButton(
                    runLabel,
                    onClick = onRun,
                    variant = StanceButtonVariant.Outline,
                    size = StanceButtonSize.Small,
                    enabled = !streaming,
                    loading = runStatus == StanceStepStatus.Running,
                    leadingIcon = StanceIcons.Terminal,
                )
            }
        }
        if (runStatus != null) {
            Row(
                modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                StepStatusMark(runStatus)
                Text(
                    defaultNamedState()(runLabel, statusLabel(runStatus)),
                    style = StanceTheme.typography.caption,
                    color = if (runStatus == StanceStepStatus.Error) c.dangerFg else c.fgMuted,
                )
            }
        }
        if (runOutput != null) StanceCodeBlock(runOutput, title = outputLabel, copyable = false, wrap = true)
    }
}

// ───────────── Artifact panel ─────────────

/** One saved version of an artifact. */
@Immutable
public data class StanceArtifactVersion(val id: String, val label: String)

/** What a [StanceArtifactPanel] shows. */
public enum class StanceArtifactView { Preview, Code }

/** The words of a [StanceArtifactPanel]. Build with [StanceArtifactPanelDefaults.labels]. */
@Immutable
public data class StanceArtifactLabels(
    val close: String,
    val preview: String,
    val code: String,
    val version: String,
    val generating: String,
)

/** Defaults for [StanceArtifactPanel]. */
public object StanceArtifactPanelDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        close: String = stringResource(R.string.stance_ai_artifact_close),
        preview: String = stringResource(R.string.stance_ai_artifact_preview),
        code: String = stringResource(R.string.stance_ai_artifact_code),
        version: String = stringResource(R.string.stance_ai_artifact_version),
        generating: String = stringResource(R.string.stance_ai_artifact_generating),
    ): StanceArtifactLabels = StanceArtifactLabels(close, preview, code, version, generating)
}

/**
 * A panel for a generated document, page or app: a title, a version switcher, preview and code
 * tabs, actions and the content.
 *
 * Compose it while it should be open. On expanded widths it is a pane to place beside the
 * conversation, announced by its title. On compact and medium widths it is a full screen dialog.
 * Back closes it either way, with the predictive back preview where the system offers one. When a
 * dialog closes, the platform returns focus to what opened it.
 *
 * @param kind What the artifact is, shown under the title, for example "Document".
 * @param versions The saved versions. A switcher shows when there is more than one and [onVersionChange] is set.
 * @param onViewChange Shows the preview and code tabs when set.
 * @param status Shows a generating note while the artifact is still being written.
 * @param actions Buttons in the header, such as download.
 * @param content The artifact, for the view that is showing.
 */
@Composable
public fun StanceArtifactPanel(
    title: String,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
    kind: String? = null,
    versions: List<StanceArtifactVersion> = emptyList(),
    versionId: String? = null,
    onVersionChange: ((String) -> Unit)? = null,
    view: StanceArtifactView = StanceArtifactView.Preview,
    onViewChange: ((StanceArtifactView) -> Unit)? = null,
    status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    windowWidth: StanceWindowWidth = rememberStanceWindowWidth(),
    labels: StanceArtifactLabels = StanceArtifactPanelDefaults.labels(),
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable (StanceArtifactView) -> Unit,
) {
    val c = StanceTheme.colors
    val pane: @Composable (Modifier) -> Unit = { paneModifier ->
        StanceSurface(
            modifier = paneModifier.dismissOnBack(onClose).semantics { paneTitle = title },
            shape = StanceTheme.shapes.large,
            bordered = true,
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(start = StanceSpacing.space4, end = StanceSpacing.space1, top = StanceSpacing.space1),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(title, style = StanceTheme.typography.title, color = c.fgDefault, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.semantics { heading() })
                        if (kind != null) Text(kind, style = StanceTheme.typography.caption, color = c.fgMuted)
                    }
                    if (versions.size > 1 && onVersionChange != null) ArtifactVersions(versions, versionId, onVersionChange, labels.version)
                    actions()
                    StanceIconButton(StanceIcons.X, labels.close, onClick = onClose)
                }
                if (status.isBusy) {
                    StanceShimmerText(
                        labels.generating,
                        modifier = Modifier.padding(horizontal = StanceSpacing.space4).semantics { liveRegion = LiveRegionMode.Polite },
                    )
                }
                if (onViewChange != null) {
                    StanceTabs(
                        tabs = listOf(labels.preview, labels.code),
                        selectedIndex = view.ordinal,
                        onSelect = { onViewChange(StanceArtifactView.entries[it]) },
                    )
                } else {
                    StanceDivider()
                }
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) { content(view) }
            }
        }
    }
    if (windowWidth == StanceWindowWidth.Expanded) {
        pane(modifier)
    } else {
        Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
            pane(modifier.fillMaxSize())
        }
    }
}

@Composable
private fun ArtifactVersions(versions: List<StanceArtifactVersion>, versionId: String?, onVersionChange: (String) -> Unit, label: String) {
    var open by remember { mutableStateOf(false) }
    val current = versions.firstOrNull { it.id == versionId } ?: versions.last()
    val named = stringResource(R.string.stance_ai_labelled_value, label, current.label)
    Box {
        StanceButton(
            current.label,
            onClick = { open = true },
            modifier = Modifier.semantics { contentDescription = named },
            variant = StanceButtonVariant.Ghost,
            size = StanceButtonSize.Small,
            trailingIcon = StanceIcons.ChevronDown,
        )
        StanceDropdownMenu(
            expanded = open,
            onDismissRequest = { open = false },
            items = versions.map { version ->
                StanceMenuItem(version.label, onClick = { onVersionChange(version.id) }, icon = if (version.id == current.id) StanceIcons.Check else null)
            },
        )
    }
}

// ───────────── Generated image ─────────────

/** One alternative of a generated image. [contentDescription] is required: it is the image's text alternative. */
@Immutable
public data class StanceImageVariation(val id: String, val painter: Painter, val contentDescription: String)

/** The words of a [StanceGeneratedImage]. Build with [StanceGeneratedImageDefaults.labels]. */
@Immutable
public data class StanceGeneratedImageLabels(
    val generating: String,
    val download: String,
    val regenerate: String,
    val edit: String,
    val variations: String,
    val prompt: String,
)

/** Defaults for [StanceGeneratedImage]. */
public object StanceGeneratedImageDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        generating: String = stringResource(R.string.stance_ai_image_generating),
        download: String = stringResource(R.string.stance_ai_download),
        regenerate: String = stringResource(R.string.stance_ai_regenerate),
        edit: String = stringResource(R.string.stance_ai_edit),
        variations: String = stringResource(R.string.stance_ai_image_variations),
        prompt: String = stringResource(R.string.stance_ai_image_prompt),
    ): StanceGeneratedImageLabels = StanceGeneratedImageLabels(generating, download, regenerate, edit, variations, prompt)
}

/**
 * A generated image with a loading state, variations, and actions to download, regenerate and edit.
 *
 * It takes a [Painter], so the app loads the picture with whatever it already uses: Stance does
 * no networking. The [contentDescription] is required. While the [status] is busy the image area
 * is a progress bar with its label and percentage. Variations are a radio group of thumbnails,
 * each at least 48dp, named by their own description.
 *
 * @param painter The image, or null while there is none yet.
 * @param progress From 0 to 1 while generating, or null when the amount of work is not known.
 * @param aspectRatio Width over height of the image area.
 * @param prompt The prompt the image was made from, shown under it.
 */
@Composable
public fun StanceGeneratedImage(
    painter: Painter?,
    contentDescription: String,
    modifier: Modifier = Modifier,
    status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    progress: Float? = null,
    aspectRatio: Float = 1f,
    variations: List<StanceImageVariation> = emptyList(),
    selectedId: String? = null,
    onSelect: ((StanceImageVariation) -> Unit)? = null,
    onDownload: (() -> Unit)? = null,
    onRegenerate: (() -> Unit)? = null,
    onEdit: (() -> Unit)? = null,
    prompt: String? = null,
    labels: StanceGeneratedImageLabels = StanceGeneratedImageDefaults.labels(),
) {
    val c = StanceTheme.colors
    val shape = StanceTheme.shapes.large
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(aspectRatio.coerceAtLeast(MIN_ASPECT))
                .clip(shape)
                .background(c.bgMuted)
                .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, shape),
            contentAlignment = Alignment.Center,
        ) {
            if (painter != null && !status.isBusy) {
                Image(painter, contentDescription, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            } else if (status.isBusy) {
                StanceGenerationProgress(labels.generating, progress = progress, modifier = Modifier.padding(StanceSpacing.space4))
            } else {
                StanceIcon(StanceIcons.Image, contentDescription = contentDescription, size = StanceSizes.iconLarge, tint = c.fgSubtle)
            }
        }
        if (variations.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .horizontalScroll(rememberScrollState())
                    .selectableGroup()
                    .semantics { this.contentDescription = labels.variations },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            ) {
                variations.forEach { variation ->
                    key(variation.id) {
                        val selected = variation.id == selectedId
                        val thumb = StanceTheme.shapes.medium
                        Image(
                            variation.painter,
                            variation.contentDescription,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(StanceSizes.touchTarget + StanceSpacing.space2)
                                .stanceFocusRing(thumb)
                                .clip(thumb)
                                .border(
                                    if (selected) StanceTheme.tokens.focusWidth.dp else StanceTheme.tokens.borderWidth.dp,
                                    if (selected) c.accentBg else c.borderDefault,
                                    thumb,
                                )
                                .selectable(selected = selected, enabled = onSelect != null, role = Role.RadioButton) { onSelect?.invoke(variation) },
                        )
                    }
                }
            }
        }
        if (prompt != null) {
            Text(
                stringResource(R.string.stance_ai_labelled_value, labels.prompt, prompt),
                style = StanceTheme.typography.caption,
                color = c.fgMuted,
            )
        }
        if (onDownload != null || onRegenerate != null || onEdit != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1), verticalAlignment = Alignment.CenterVertically) {
                StanceAIGeneratedLabel(modifier = Modifier.weight(1f))
                val ready = !status.isBusy
                if (onEdit != null) StanceIconButton(StanceIcons.Pencil, labels.edit, onClick = onEdit, enabled = ready)
                if (onRegenerate != null) StanceIconButton(StanceIcons.Refresh, labels.regenerate, onClick = onRegenerate, enabled = ready)
                if (onDownload != null) StanceIconButton(StanceIcons.Download, labels.download, onClick = onDownload, enabled = ready && painter != null)
            }
        }
    }
}

private const val MIN_ASPECT = 0.25f

// ───────────── Generated table ─────────────

/** A column of a [StanceGeneratedTable]. Numeric columns align to the end and sort by value. */
@Immutable
public data class StanceGeneratedColumn(val id: String, val header: String, val numeric: Boolean = false)

/** How a [StanceGeneratedTable] is sorted: the column index, from zero, and the direction. */
@Immutable
public data class StanceTableSort(val column: Int, val descending: Boolean = false)

/**
 * The sort after the header of [column] is tapped: ascending first, then descending, then back
 * to the order the rows arrived in.
 */
public fun stanceNextSort(current: StanceTableSort?, column: Int): StanceTableSort? = when {
    current == null || current.column != column -> StanceTableSort(column)
    !current.descending -> StanceTableSort(column, descending = true)
    else -> null
}

private val notNumeric = Regex("[^0-9.+-]")

/**
 * [rows] in the order of [sort]. Numeric columns compare by value, ignoring units and
 * separators, with cells that hold no number last. Other columns compare as text, ignoring case.
 * Rows that tie keep their order.
 */
public fun stanceSortRows(rows: List<List<String>>, sort: StanceTableSort?, numeric: Boolean): List<List<String>> {
    if (sort == null) return rows
    fun cell(row: List<String>): String = row.getOrElse(sort.column) { "" }
    val sorted = if (numeric) {
        fun value(row: List<String>): Double? = notNumeric.replace(cell(row), "").toDoubleOrNull()
        val (numbers, others) = rows.partition { value(it) != null }
        (if (sort.descending) numbers.sortedByDescending { value(it) } else numbers.sortedBy { value(it) }) + others
    } else if (sort.descending) {
        rows.sortedWith(compareByDescending(String.CASE_INSENSITIVE_ORDER) { cell(it) })
    } else {
        rows.sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { cell(it) })
    }
    return sorted
}

/** A leading =, +, @, tab or return, or a minus that does not start a number, which a spreadsheet would run as a formula. */
private val csvFormula = Regex("^(?:[=+@\\t\\r]|-(?![\\d.,]+%?$))")

/**
 * The table as comma separated values. Cells with a comma, a quote or a line break are quoted.
 *
 * A cell a spreadsheet would run as a formula, one starting with =, +, @ or a minus that is not a
 * negative number, gets a leading apostrophe so it opens as text.
 */
public fun stanceTableCsv(headers: List<String>, rows: List<List<String>>): String {
    fun cell(value: String): String {
        val text = if (csvFormula.containsMatchIn(value)) "'$value" else value
        return if (text.any { it == ',' || it == '"' || it == '\n' || it == '\r' }) "\"" + text.replace("\"", "\"\"") + "\"" else text
    }
    return (listOf(headers) + rows).joinToString("\n") { row -> row.joinToString(",") { cell(it) } }
}

/** The words of a [StanceGeneratedTable]. Build with [StanceGeneratedTableDefaults.labels]. */
@Immutable
public data class StanceGeneratedTableLabels(
    val copy: String,
    val export: String,
    val showAll: String,
    val receiving: String,
    /** The row count line, from the number of rows shown and the total. */
    val rowsShown: (shown: Int, total: Int) -> String,
)

/** Defaults for [StanceGeneratedTable]. */
public object StanceGeneratedTableDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        copy: String = stringResource(R.string.stance_ai_table_copy),
        export: String = stringResource(R.string.stance_ai_table_export),
        showAll: String = stringResource(R.string.stance_ai_table_show_all),
        receiving: String = stringResource(R.string.stance_ai_table_receiving),
    ): StanceGeneratedTableLabels {
        val rowsShown: (Int, Int) -> String =
            rememberFromResources { r -> { shown, total -> r.getString(R.string.stance_ai_table_rows, shown, total) } }
        return StanceGeneratedTableLabels(copy, export, showAll, receiving, rowsShown)
    }
}

/**
 * A table produced by the assistant, on [StanceDataTable]: a caption, sortable columns, copy as
 * comma separated values and a way to see every row.
 *
 * Headers are buttons that sort ascending, then descending, then not at all, and say the order.
 * Rows are read as header and value pairs. While [streaming], rows that arrive are not announced
 * one by one and sorting waits until the table is complete.
 *
 * @param rows One list of cells per row, in column order.
 * @param maxRows How many rows show before "Show all rows".
 * @param onCopy Called after the copy with whether it succeeded.
 * @param onExport Shows an export button when set.
 * @param onExpand Opens the full table elsewhere. When null, "Show all rows" expands the table in place.
 */
@Composable
public fun StanceGeneratedTable(
    columns: List<StanceGeneratedColumn>,
    rows: List<List<String>>,
    modifier: Modifier = Modifier,
    caption: String? = null,
    streaming: Boolean = false,
    maxRows: Int = 8,
    onCopy: ((Boolean) -> Unit)? = null,
    onExport: (() -> Unit)? = null,
    onExpand: (() -> Unit)? = null,
    labels: StanceGeneratedTableLabels = StanceGeneratedTableDefaults.labels(),
) {
    val c = StanceTheme.colors
    var sortColumn by rememberSaveable { mutableIntStateOf(NO_SORT) }
    var sortDescending by rememberSaveable { mutableStateOf(false) }
    var showAll by rememberSaveable { mutableStateOf(false) }
    val sort = if (sortColumn == NO_SORT || streaming) null else StanceTableSort(sortColumn, sortDescending)
    val sorted = remember(rows, sort, columns) { stanceSortRows(rows, sort, sort?.let { columns.getOrNull(it.column)?.numeric } == true) }
    val limit = maxRows.coerceAtLeast(1)
    val shown = if (showAll || sorted.size <= limit) sorted else sorted.take(limit)
    AiCard(modifier) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(start = StanceSpacing.space4, end = StanceSpacing.space1),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f).padding(vertical = StanceSpacing.space2)) {
                if (caption != null) Text(caption, style = StanceTheme.typography.label, color = c.fgDefault, modifier = Modifier.semantics { heading() })
                if (streaming) {
                    StanceShimmerText(labels.receiving, style = StanceTheme.typography.caption)
                } else {
                    Text(labels.rowsShown(shown.size, rows.size), style = StanceTheme.typography.caption, color = c.fgMuted)
                }
            }
            StanceCopyButton(value = { stanceTableCsv(columns.map { it.header }, sorted) }, label = labels.copy, enabled = !streaming, onCopy = onCopy)
            if (onExport != null) StanceIconButton(StanceIcons.Download, labels.export, onClick = onExport, enabled = !streaming)
        }
        StanceDivider()
        BoxWithConstraints {
            // Columns share the width of the card, down to a readable minimum. Past that the table scrolls sideways.
            val columnWidth = (maxWidth / columns.size.coerceAtLeast(1)).coerceAtLeast(StanceSpacing.space24)
            val tableColumns = remember(columns, columnWidth) {
                columns.mapIndexed { index, column ->
                    StanceTableColumn<List<String>>(column.header, width = columnWidth, numeric = column.numeric) { row -> row.getOrElse(index) { "" } }
                }
            }
            StanceDataTable(
                columns = tableColumns,
                rows = shown,
                caption = caption,
                sortColumn = sort?.column,
                sortDescending = sort?.descending == true,
                onSortChange = if (streaming) {
                    null
                } else {
                    { column ->
                        val next = stanceNextSort(sort, column)
                        sortColumn = next?.column ?: NO_SORT
                        sortDescending = next?.descending == true
                    }
                },
            )
        }
        if (shown.size < sorted.size) {
            StanceDivider()
            StanceButton(
                labels.showAll,
                onClick = { if (onExpand != null) onExpand() else showAll = true },
                modifier = Modifier.padding(horizontal = StanceSpacing.space2),
                variant = StanceButtonVariant.Ghost,
                size = StanceButtonSize.Small,
                trailingIcon = StanceIcons.Maximize,
            )
        }
    }
}

private const val NO_SORT = -1

// ───────────── Generated chart ─────────────

/** What a [StanceGeneratedChart] shows. */
public enum class StanceGeneratedChartView { Chart, Table }

/**
 * A chart the assistant built from data, on [StanceChart], with a plain language takeaway, a
 * switch to the data as a table and a source note, with hoisted [view].
 *
 * The [takeaway] is the chart's text alternative: it is what screen readers hear for the chart,
 * and it is shown above it. The data table is always one tap away, so the numbers never depend on
 * reading a picture.
 *
 * @param takeaway One sentence on what the data shows, for example "Signatures doubled since March."
 * @param source Where the data came from, shown under the chart.
 * @param categoryLabel The header of the category column in the table view.
 * @param valueText Formats values for the table. The chart keeps its own axis format.
 */
@Composable
public fun StanceGeneratedChart(
    title: String,
    takeaway: String,
    categories: List<String>,
    series: List<StanceChartSeries>,
    view: StanceGeneratedChartView,
    onViewChange: (StanceGeneratedChartView) -> Unit,
    modifier: Modifier = Modifier,
    type: StanceChartType = StanceChartType.Line,
    source: String? = null,
    chartLabel: String = stringResource(R.string.stance_ai_chart_view_chart),
    tableLabel: String = stringResource(R.string.stance_ai_chart_view_table),
    categoryLabel: String = stringResource(R.string.stance_ai_chart_category),
    sourceText: String? = source?.let { stringResource(R.string.stance_ai_chart_source, it) },
    valueText: (Float) -> String = remember { chartValueText() },
) {
    val c = StanceTheme.colors
    AiCard(modifier) {
        Column(modifier = Modifier.padding(StanceSpacing.space4), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
            StanceButtonGroup(
                options = listOf(chartLabel, tableLabel),
                selectedIndex = view.ordinal,
                onSelect = { onViewChange(StanceGeneratedChartView.entries[it]) },
            )
            if (view == StanceGeneratedChartView.Chart) {
                StanceChart(title = title, categories = categories, series = series, type = type, description = takeaway, summary = takeaway)
            } else {
                Text(title, style = StanceTheme.typography.title, color = c.fgDefault, modifier = Modifier.semantics { heading() })
                Text(takeaway, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
                val columns = remember(series, categoryLabel, valueText) {
                    listOf(StanceTableColumn<Int>(categoryLabel) { categories.getOrElse(it) { "" } }) +
                        series.map { s -> StanceTableColumn<Int>(s.label, numeric = true) { row -> s.values.getOrNull(row)?.let(valueText).orEmpty() } }
                }
                StanceDataTable(columns = columns, rows = categories.indices.toList(), caption = title)
            }
            if (sourceText != null) Text(sourceText, style = StanceTheme.typography.caption, color = c.fgMuted)
        }
    }
}

private fun chartValueText(): (Float) -> String {
    val format = NumberFormat.getNumberInstance(Locale.getDefault()).apply { maximumFractionDigits = 1 }
    return { format.format(it) }
}

/** [StanceGeneratedChart] that keeps its own view. */
@Composable
public fun StanceGeneratedChart(
    title: String,
    takeaway: String,
    categories: List<String>,
    series: List<StanceChartSeries>,
    modifier: Modifier = Modifier,
    type: StanceChartType = StanceChartType.Line,
    source: String? = null,
    initialView: StanceGeneratedChartView = StanceGeneratedChartView.Chart,
) {
    var view by rememberSaveable { mutableStateOf(initialView) }
    StanceGeneratedChart(title, takeaway, categories, series, view, { view = it }, modifier, type, source)
}

// ───────────── File preview card ─────────────

/**
 * A card for a file the assistant made or used: name, type, size and a preview, with open and
 * download. It reuses the thumbnail of [StanceAttachmentTray], so files look the same in a
 * draft and in a response.
 *
 * The card reads as its name with its details. While the [status] is busy it shows progress and
 * the actions wait. The download button names its file.
 *
 * @param typeLabel The kind of file in words, for example "PDF".
 * @param sizeLabel The formatted size, for example "1.2 MB".
 * @param meta Anything else worth a few words, for example "12 pages".
 * @param thumbnail Draws a preview. An icon for the [kind] is shown when null.
 * @param progress From 0 to 1 while the file is being made, or null when the amount is not known.
 * @param actions More buttons before open and download.
 */
@Composable
public fun StanceFilePreviewCard(
    name: String,
    modifier: Modifier = Modifier,
    kind: StanceAttachmentKind = StanceAttachmentKind.File,
    typeLabel: String? = null,
    sizeLabel: String? = null,
    meta: String? = null,
    thumbnail: (@Composable () -> Unit)? = null,
    status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    progress: Float? = null,
    onOpen: (() -> Unit)? = null,
    onDownload: (() -> Unit)? = null,
    openLabel: String = stringResource(R.string.stance_ai_file_open),
    downloadDescription: String = stringResource(R.string.stance_ai_file_download, name),
    preparingLabel: String = stringResource(R.string.stance_ai_file_preparing),
    actions: @Composable RowScope.() -> Unit = {},
) {
    val c = StanceTheme.colors
    val ready = !status.isBusy
    val details = listOfNotNull(typeLabel, sizeLabel, meta).joinToString(stringResource(R.string.stance_list_separator))
    AiCard(modifier) {
        Row(
            modifier = Modifier.padding(start = StanceSpacing.space3, top = StanceSpacing.space2, bottom = StanceSpacing.space2, end = StanceSpacing.space1),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AttachmentThumbnail(kind, thumbnail, size = StanceSizes.controlLarge)
            Column(
                modifier = Modifier.weight(1f).semantics(mergeDescendants = true) { },
                verticalArrangement = Arrangement.spacedBy(StanceSpacing.space05),
            ) {
                Text(name, style = StanceTheme.typography.label, color = c.fgDefault, maxLines = 1, overflow = TextOverflow.Ellipsis)
                when {
                    status == StanceGenerationStatus.Error -> Text(stringResource(R.string.stance_ai_status_error), style = StanceTheme.typography.caption, color = c.dangerFg)
                    !ready -> StanceProgressIndicator(progress, label = preparingLabel, showValue = progress != null)
                    details.isNotEmpty() -> Text(details, style = StanceTheme.typography.caption, color = c.fgMuted)
                }
            }
            actions()
            if (onOpen != null) StanceButton(openLabel, onClick = onOpen, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, enabled = ready)
            if (onDownload != null) StanceIconButton(StanceIcons.Download, downloadDescription, onClick = onDownload, enabled = ready)
        }
    }
}

// ───────────── Canvas split view ─────────────

/** One of the two panes of a [StanceCanvasSplitView]. */
public enum class StanceCanvasPane { Conversation, Canvas }

/**
 * The state of a [StanceCanvasSplitView]. Create it with [rememberStanceCanvasSplitState].
 *
 * @property ratio The share of the width the conversation takes on wide windows, from 0 to 1.
 * @property narrowPane The pane shown on narrow windows.
 */
@Stable
public class StanceCanvasSplitState internal constructor(initialRatio: Float, initialPane: StanceCanvasPane) {
    public var ratio: Float by mutableFloatStateOf(initialRatio.coerceIn(0f, 1f))
    public var narrowPane: StanceCanvasPane by mutableStateOf(initialPane)

    internal companion object {
        val Saver: Saver<StanceCanvasSplitState, List<Any>> = Saver(
            save = { listOf(it.ratio, it.narrowPane.ordinal) },
            restore = { StanceCanvasSplitState(it[0] as Float, StanceCanvasPane.entries[it[1] as Int]) },
        )
    }
}

/** Remembers the split and the narrow pane of a [StanceCanvasSplitView] across configuration changes. */
@Composable
public fun rememberStanceCanvasSplitState(
    initialRatio: Float = DEFAULT_SPLIT,
    initialPane: StanceCanvasPane = StanceCanvasPane.Conversation,
): StanceCanvasSplitState = rememberSaveable(saver = StanceCanvasSplitState.Saver) { StanceCanvasSplitState(initialRatio, initialPane) }

/**
 * The share of [total] the start pane takes after the divider moves by [delta], keeping
 * [minStart] for the start pane and [minEnd] for the end pane. Sizes are in pixels. When the two
 * minimums do not fit, the ratio is left as it is.
 */
internal fun stanceSplitRatio(ratio: Float, delta: Float, total: Float, minStart: Float, minEnd: Float): Float {
    if (total <= 0f || minStart > total - minEnd) return ratio
    return (ratio * total + delta).coerceIn(minStart, total - minEnd) / total
}

/**
 * Conversation on one side and the working document on the other.
 *
 * On expanded widths the two panes sit side by side with a draggable divider between them. The
 * divider is a 48dp target that screen readers adjust like a slider, and the arrow keys move it
 * when it has focus. On compact and medium widths a segmented switch replaces the divider and one
 * pane shows at a time. Each pane is a region named by its label. The panes swap sides in right to
 * left layouts.
 *
 * @param canvasOpen With false only the conversation shows, at full width.
 * @param minConversation The narrowest the conversation pane gets.
 * @param minCanvas The narrowest the canvas pane gets.
 */
@Composable
public fun StanceCanvasSplitView(
    conversation: @Composable () -> Unit,
    canvas: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    state: StanceCanvasSplitState = rememberStanceCanvasSplitState(),
    canvasOpen: Boolean = true,
    minConversation: Dp = StanceSizes.drawerWidth,
    minCanvas: Dp = StanceSizes.drawerWidth,
    windowWidth: StanceWindowWidth = rememberStanceWindowWidth(),
    conversationLabel: String = stringResource(R.string.stance_ai_conversation),
    canvasLabel: String = stringResource(R.string.stance_ai_canvas),
    dividerDescription: String = stringResource(R.string.stance_ai_canvas_resize),
) {
    val conversationPane: @Composable (Modifier) -> Unit = { Box(it.semantics { paneTitle = conversationLabel }) { conversation() } }
    val canvasPane: @Composable (Modifier) -> Unit = { Box(it.semantics { paneTitle = canvasLabel }) { canvas() } }
    when {
        !canvasOpen -> conversationPane(modifier)
        windowWidth == StanceWindowWidth.Expanded -> {
            val density = LocalDensity.current
            val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
            var width by remember { mutableIntStateOf(0) }
            val handle = with(density) { StanceSizes.touchTarget.toPx() }
            val minStart = with(density) { minConversation.toPx() }
            val minEnd = with(density) { minCanvas.toPx() }
            val available = (width - handle).coerceAtLeast(0f)
            val move = { delta: Float -> state.ratio = stanceSplitRatio(state.ratio, delta, available, minStart, minEnd) }
            val ratio = stanceSplitRatio(state.ratio, 0f, available, minStart, minEnd).coerceIn(MIN_WEIGHT, 1f - MIN_WEIGHT)
            val step = with(density) { StanceSpacing.space6.toPx() }
            Row(modifier = modifier.onSizeChanged { width = it.width }) {
                conversationPane(Modifier.weight(ratio).fillMaxHeight())
                Box(
                    modifier = Modifier
                        .width(StanceSizes.touchTarget)
                        .fillMaxHeight()
                        .stanceFocusRing(StanceTheme.shapes.small)
                        .onKeyEvent { event ->
                            val direction = when (event.key) {
                                Key.DirectionLeft -> -1f
                                Key.DirectionRight -> 1f
                                else -> 0f
                            }
                            if (direction != 0f && event.type == KeyEventType.KeyDown) {
                                move(if (rtl) -direction * step else direction * step)
                                true
                            } else {
                                false
                            }
                        }
                        .focusable()
                        .draggable(rememberDraggableState { delta -> move(if (rtl) -delta else delta) }, Orientation.Horizontal)
                        .clearAndSetSemantics {
                            contentDescription = dividerDescription
                            progressBarRangeInfo = ProgressBarRangeInfo(ratio, 0f..1f)
                            setProgress { target ->
                                state.ratio = stanceSplitRatio(target, 0f, available, minStart, minEnd)
                                true
                            }
                        },
                    contentAlignment = Alignment.Center,
                ) {
                    StanceDivider(vertical = true, modifier = Modifier.fillMaxHeight())
                    StanceSurface(shape = StanceTheme.shapes.pill, bordered = true) {
                        StanceIcon(
                            StanceIcons.GripVertical,
                            contentDescription = null,
                            size = StanceSizes.iconSmall,
                            tint = StanceTheme.colors.fgMuted,
                            modifier = Modifier.padding(vertical = StanceSpacing.space2),
                        )
                    }
                }
                canvasPane(Modifier.weight(1f - ratio).fillMaxHeight())
            }
        }
        else -> Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            StanceButtonGroup(
                options = listOf(conversationLabel, canvasLabel),
                selectedIndex = state.narrowPane.ordinal,
                onSelect = { state.narrowPane = StanceCanvasPane.entries[it] },
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
            if (state.narrowPane == StanceCanvasPane.Conversation) {
                conversationPane(Modifier.weight(1f).fillMaxWidth())
            } else {
                canvasPane(Modifier.weight(1f).fillMaxWidth())
            }
        }
    }
}

private const val DEFAULT_SPLIT = 0.4f

// A weight must be positive, also before the first measure.
private const val MIN_WEIGHT = 0.05f
