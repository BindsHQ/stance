@file:OptIn(ExperimentalLayoutApi::class)

package com.bindshq.stance.components.ai

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceIconButtonVariant
import com.bindshq.stance.components.data.StanceBadge
import com.bindshq.stance.components.data.StanceBadgeVariant
import com.bindshq.stance.components.data.StanceCircularProgressIndicator
import com.bindshq.stance.components.feedback.StanceBottomSheet
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import java.text.NumberFormat

/**
 * The message input: a text area that grows with its content up to [maxRows], with slots
 * around it and a send button that becomes a stop button while a response is on its way.
 *
 * Presentational: the draft is hoisted in [value]. [onSubmit] receives the draft as typed,
 * untrimmed, and the draft is then cleared through [onValueChange].
 *
 * - The soft keyboard shows a Send action when [submitOnEnter] is true. On a hardware
 *   keyboard Enter sends and Shift Enter adds a line.
 * - Send is disabled while [value] is blank. While [status] is busy and [onStop] is set,
 *   the one button becomes Stop: it is named [stopLabel] and calls [onStop].
 * - Sending and stopping give haptic feedback.
 *
 * @param label The accessible name of the text field.
 * @param leading Slot before the text, for an attach button.
 * @param trailing Slot between the text and the send button, for voice input or tools.
 * @param header Slot above the text, for attachments and context.
 * @param footer Slot below the text, for hints and meters.
 */
@Composable
public fun StancePromptComposer(
    value: String,
    onValueChange: (String) -> Unit,
    onSubmit: (String) -> Unit,
    modifier: Modifier = Modifier,
    onStop: (() -> Unit)? = null,
    status: StanceGenerationStatus = StanceGenerationStatus.Idle,
    placeholder: String = stringResource(R.string.stance_ai_composer_placeholder),
    enabled: Boolean = true,
    maxRows: Int = 8,
    submitOnEnter: Boolean = true,
    label: String = stringResource(R.string.stance_ai_composer_label),
    sendLabel: String = stringResource(R.string.stance_ai_send),
    stopLabel: String = stringResource(R.string.stance_ai_stop),
    leading: (@Composable RowScope.() -> Unit)? = null,
    trailing: (@Composable RowScope.() -> Unit)? = null,
    header: (@Composable ColumnScope.() -> Unit)? = null,
    footer: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    val showStop = status.isBusy && onStop != null
    val canSend = enabled && !status.isBusy && value.isNotBlank()
    val submit = {
        if (canSend) {
            haptics.performHapticFeedback(HapticFeedbackType.Confirm)
            onSubmit(value)
            onValueChange("")
        }
    }
    val textStyle = StanceTheme.typography.body.copy(color = if (enabled) c.fgDefault else c.disabledFg)
    StanceSurface(
        modifier = modifier.fillMaxWidth(),
        shape = StanceTheme.shapes.extraLarge,
        color = if (enabled) c.bgSurface else c.disabledBg,
        bordered = true,
    ) {
        Column(modifier = Modifier.padding(StanceSpacing.space2), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
            header?.invoke(this)
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
                leading?.invoke(this)
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = StanceSizes.touchTarget)
                        .padding(horizontal = StanceSpacing.space2, vertical = StanceSpacing.space3)
                        .semantics { contentDescription = label }
                        .onPreviewKeyEvent { event ->
                            val enter = event.key == Key.Enter || event.key == Key.NumPadEnter
                            if (submitOnEnter && enter && !event.isShiftPressed) {
                                if (event.type == KeyEventType.KeyUp) submit()
                                true
                            } else {
                                false
                            }
                        },
                    enabled = enabled,
                    textStyle = textStyle,
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.Sentences,
                        imeAction = if (submitOnEnter) ImeAction.Send else ImeAction.Default,
                    ),
                    keyboardActions = KeyboardActions(onSend = { submit() }),
                    minLines = 1,
                    maxLines = maxRows.coerceAtLeast(1),
                    cursorBrush = SolidColor(c.fgDefault),
                    decorationBox = { field ->
                        Box(contentAlignment = Alignment.CenterStart) {
                            if (value.isEmpty()) {
                                Text(placeholder, style = StanceTheme.typography.body, color = c.fgSubtle, modifier = Modifier.clearAndSetSemantics { })
                            }
                            field()
                        }
                    },
                )
                trailing?.invoke(this)
                // One button for both states, so focus stays put when send becomes stop.
                StanceIconButton(
                    icon = if (showStop) StanceIcons.Stop else StanceIcons.ArrowUp,
                    contentDescription = if (showStop) stopLabel else sendLabel,
                    onClick = {
                        if (showStop) {
                            haptics.performHapticFeedback(HapticFeedbackType.ContextClick)
                            onStop()
                        } else {
                            submit()
                        }
                    },
                    variant = StanceIconButtonVariant.Filled,
                    enabled = showStop || canSend,
                )
            }
            footer?.invoke(this)
        }
    }
}

/** Whether an attachment is shown as an image or a file. */
public enum class StanceAttachmentKind { Image, File }

/**
 * One attachment on a draft or a sent message.
 *
 * @param sizeLabel The formatted size, for example "1.2 MB".
 * @param preview Draws the image thumbnail. An icon is shown when null.
 * @param progress Upload progress from 0 to 1, or null when not uploading.
 * @param error What went wrong with the upload, or null.
 */
@Immutable
public data class StanceAttachment(
    val id: String,
    val name: String,
    val kind: StanceAttachmentKind = StanceAttachmentKind.File,
    val sizeLabel: String? = null,
    val preview: (@Composable () -> Unit)? = null,
    val progress: Float? = null,
    val error: String? = null,
)

/**
 * The attachments on a draft or a sent message, as a row that scrolls sideways.
 *
 * Each item is read as its name with its size, progress or error. Upload errors are a polite
 * live region. Each remove button names its file.
 *
 * @param onRemove Shows a remove button on each item when set and [readOnly] is false.
 */
@Composable
public fun StanceAttachmentTray(
    items: List<StanceAttachment>,
    modifier: Modifier = Modifier,
    onRemove: ((StanceAttachment) -> Unit)? = null,
    readOnly: Boolean = false,
    label: String = stringResource(R.string.stance_ai_attachments),
    removeDescription: (name: String) -> String = defaultRemoveDescription(),
    uploadingDescription: (percent: Int) -> String = defaultUploadingDescription(),
) {
    val c = StanceTheme.colors
    if (items.isEmpty()) return
    Row(
        modifier = modifier
            .semantics { contentDescription = label }
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
    ) {
        items.forEach { item ->
            val failed = item.error != null
            val shape = StanceTheme.shapes.medium
            Row(
                modifier = Modifier
                    .widthIn(max = StanceSizes.drawerWidth)
                    .clip(shape)
                    .background(c.bgMuted)
                    .border(StanceTheme.tokens.borderWidth.dp, if (failed) c.dangerBorder else c.borderDefault, shape)
                    .padding(start = StanceSpacing.space2),
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier.size(StanceSizes.controlSmall).clip(StanceTheme.shapes.small).background(c.bgEmphasis).clearAndSetSemantics { },
                    contentAlignment = Alignment.Center,
                ) {
                    if (item.preview != null) {
                        item.preview.invoke()
                    } else {
                        StanceIcon(
                            if (item.kind == StanceAttachmentKind.Image) StanceIcons.Image else StanceIcons.FileText,
                            contentDescription = null,
                            size = StanceSizes.iconSmall,
                            tint = c.fgMuted,
                        )
                    }
                }
                Column(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .padding(vertical = StanceSpacing.space2)
                        .semantics(mergeDescendants = true) { },
                ) {
                    Text(item.name, style = StanceTheme.typography.label, color = c.fgDefault, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    when {
                        item.error != null -> Text(
                            item.error,
                            style = StanceTheme.typography.caption,
                            color = c.dangerFg,
                            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                        )
                        item.progress != null -> {
                            val percent = (item.progress.coerceIn(0f, 1f) * PERCENT).toInt()
                            Text(uploadingDescription(percent), style = StanceTheme.typography.caption, color = c.fgMuted)
                        }
                        item.sizeLabel != null -> Text(item.sizeLabel, style = StanceTheme.typography.caption, color = c.fgMuted)
                    }
                }
                if (onRemove != null && !readOnly) {
                    StanceIconButton(StanceIcons.X, removeDescription(item.name), onClick = { onRemove(item) })
                } else {
                    Box(Modifier.width(StanceSpacing.space1))
                }
            }
        }
    }
}

@Composable
internal fun defaultRemoveDescription(): (String) -> String =
    rememberFromResources { r -> { name -> r.getString(R.string.stance_ai_remove_named, name) } }

@Composable
internal fun defaultUploadingDescription(): (Int) -> String =
    rememberFromResources { r -> { percent -> r.getString(R.string.stance_ai_uploading, percent) } }

private const val PERCENT = 100

/** One entry of a [StanceMentionPicker]: a file, person or tool that can be referenced. */
@Immutable
public data class StanceMentionItem(
    val id: String,
    val label: String,
    val description: String? = null,
    val icon: ImageVector? = null,
    /** Items with the same group are listed under one heading. */
    val group: String? = null,
)

/** One entry of a [StanceSlashCommandMenu]. */
@Immutable
public data class StanceSlashCommand(
    val id: String,
    /** The command without its slash, for example "summarise". */
    val name: String,
    val description: String? = null,
    val icon: ImageVector? = null,
    /** A keyboard shortcut shown at the end of the row. */
    val shortcut: String? = null,
)

/** The [items] whose label or description contains [query], ignoring case. A blank query keeps all. */
public fun stanceFilterMentions(items: List<StanceMentionItem>, query: String): List<StanceMentionItem> {
    val q = query.trim()
    if (q.isEmpty()) return items
    return items.filter { it.label.contains(q, ignoreCase = true) || it.description?.contains(q, ignoreCase = true) == true }
}

/** The [commands] whose name starts with or contains [query], ignoring case, prefix matches first. */
public fun stanceFilterCommands(commands: List<StanceSlashCommand>, query: String): List<StanceSlashCommand> {
    val q = query.trim().removePrefix("/")
    if (q.isEmpty()) return commands
    val (prefix, rest) = commands.filter { it.name.contains(q, ignoreCase = true) }.partition { it.name.startsWith(q, ignoreCase = true) }
    return prefix + rest
}

/**
 * Handles the keys of an open [StanceMentionPicker] or [StanceSlashCommandMenu] from the
 * composer, which keeps input focus: Up and Down move the active row, Enter or Tab picks it
 * and Escape closes. Put it on the composer's modifier.
 */
public fun Modifier.stancePickerKeys(
    expanded: Boolean,
    itemCount: Int,
    activeIndex: Int,
    onActiveIndexChange: (Int) -> Unit,
    onSelectActive: () -> Unit,
    onDismissRequest: () -> Unit,
): Modifier = if (!expanded) {
    this
} else {
    onPreviewKeyEvent { event ->
        val handled = when (event.key) {
            Key.DirectionDown, Key.DirectionUp, Key.Escape -> true
            Key.Enter, Key.NumPadEnter, Key.Tab -> itemCount > 0
            else -> false
        }
        if (handled && event.type == KeyEventType.KeyDown) {
            when (event.key) {
                Key.DirectionDown -> if (itemCount > 0) onActiveIndexChange((activeIndex + 1).mod(itemCount))
                Key.DirectionUp -> if (itemCount > 0) onActiveIndexChange((activeIndex - 1).mod(itemCount))
                Key.Escape -> onDismissRequest()
                else -> onSelectActive()
            }
        }
        handled
    }
}

/**
 * A filterable list that opens above the composer from a trigger character, to reference
 * files, people or tools.
 *
 * Place it in the same [Box] as the composer: it is a popup anchored above its parent and it
 * does not take input focus, so typing continues. It closes on back, Escape and outside taps.
 * The row at [activeIndex] is marked selected; drive it with [stancePickerKeys].
 *
 * @param query Filters [items] with [stanceFilterMentions]. Pass an empty string when the
 * items are already filtered.
 * @param loading Shows [loadingLabel] instead of the list.
 */
@Composable
public fun StanceMentionPicker(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    items: List<StanceMentionItem>,
    onSelect: (StanceMentionItem) -> Unit,
    modifier: Modifier = Modifier,
    query: String = "",
    activeIndex: Int = 0,
    loading: Boolean = false,
    label: String = stringResource(R.string.stance_ai_mentions),
    emptyLabel: String = stringResource(R.string.stance_no_results),
    loadingLabel: String = stringResource(R.string.stance_loading),
) {
    val filtered = remember(items, query) { stanceFilterMentions(items, query) }
    val rows = remember(filtered) {
        // Stable sort by group in order of first appearance, so headings never repeat.
        val order = filtered.map { it.group }.distinct()
        filtered.sortedBy { order.indexOf(it.group) }
            .map { PickerRow(it.id, it.label, it.description, it.icon, it.group, trailing = null) }
    }
    val byId = remember(filtered) { filtered.associateBy { it.id } }
    PickerPopup(expanded, onDismissRequest, modifier, label, rows, activeIndex, loading, emptyLabel, loadingLabel) { row ->
        byId[row.id]?.let(onSelect)
    }
}

/**
 * A command list that opens above the composer when the draft starts with a slash.
 * Same behaviour as [StanceMentionPicker].
 *
 * @param query The text after the slash. Filters [commands] with [stanceFilterCommands].
 */
@Composable
public fun StanceSlashCommandMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    commands: List<StanceSlashCommand>,
    onSelect: (StanceSlashCommand) -> Unit,
    modifier: Modifier = Modifier,
    query: String = "",
    activeIndex: Int = 0,
    label: String = stringResource(R.string.stance_ai_commands),
    emptyLabel: String = stringResource(R.string.stance_no_results),
) {
    val filtered = remember(commands, query) { stanceFilterCommands(commands, query) }
    val rows = remember(filtered) {
        filtered.map { PickerRow(it.id, "/${it.name}", it.description, it.icon ?: StanceIcons.Command, group = null, trailing = it.shortcut) }
    }
    val byId = remember(filtered) { filtered.associateBy { it.id } }
    PickerPopup(expanded, onDismissRequest, modifier, label, rows, activeIndex, loading = false, emptyLabel, loadingLabel = "") { row ->
        byId[row.id]?.let(onSelect)
    }
}

@Immutable
private data class PickerRow(
    val id: String,
    val label: String,
    val description: String?,
    val icon: ImageVector?,
    val group: String?,
    val trailing: String?,
)

/** Places the popup above its anchor, aligned to the start edge, or below when there is no room. */
private class AbovePositionProvider(private val gap: Int, private val onAnchorWidth: (Int) -> Unit) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset {
        onAnchorWidth(anchorBounds.width)
        val x = if (layoutDirection == LayoutDirection.Rtl) anchorBounds.right - popupContentSize.width else anchorBounds.left
        val above = anchorBounds.top - gap - popupContentSize.height
        val y = if (above >= 0) above else anchorBounds.bottom + gap
        return IntOffset(
            x.coerceIn(0, (windowSize.width - popupContentSize.width).coerceAtLeast(0)),
            y.coerceIn(0, (windowSize.height - popupContentSize.height).coerceAtLeast(0)),
        )
    }
}

@Composable
private fun PickerPopup(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    modifier: Modifier,
    label: String,
    rows: List<PickerRow>,
    activeIndex: Int,
    loading: Boolean,
    emptyLabel: String,
    loadingLabel: String,
    onSelect: (PickerRow) -> Unit,
) {
    if (!expanded) return
    val c = StanceTheme.colors
    val density = androidx.compose.ui.platform.LocalDensity.current
    val gap = with(density) { StanceSpacing.space2.roundToPx() }
    // The list takes the width of the composer it is anchored to, once that is known.
    var anchorWidth by remember { mutableIntStateOf(0) }
    val width = if (anchorWidth > 0) {
        Modifier.width(with(density) { anchorWidth.toDp() })
    } else {
        Modifier.widthIn(min = StanceSizes.drawerWidth, max = StanceSizes.contentMaxWidth)
    }
    BackHandler(onBack = onDismissRequest)
    Popup(
        popupPositionProvider = remember(gap) { AbovePositionProvider(gap) { anchorWidth = it } },
        onDismissRequest = onDismissRequest,
        properties = PopupProperties(focusable = false, dismissOnClickOutside = true),
    ) {
        StanceSurface(
            modifier = modifier.then(width),
            shape = StanceTheme.shapes.large,
            color = c.bgOverlay,
            elevation = StanceTheme.elevation.lg,
            bordered = true,
        ) {
            Column(
                modifier = Modifier
                    .heightIn(max = StanceSizes.touchTarget * PICKER_VISIBLE_ROWS)
                    .verticalScroll(rememberScrollState())
                    .selectableGroup()
                    .semantics { contentDescription = label }
                    .padding(vertical = StanceSpacing.space1),
            ) {
                when {
                    loading -> PickerNote(loadingLabel)
                    rows.isEmpty() -> PickerNote(emptyLabel)
                    else -> rows.forEachIndexed { index, row ->
                        if (row.group != null && (index == 0 || rows[index - 1].group != row.group)) {
                            Text(
                                row.group,
                                style = StanceTheme.typography.labelSmall,
                                color = c.fgMuted,
                                modifier = Modifier
                                    .padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space1)
                                    .semantics { heading() },
                            )
                        }
                        val active = index == activeIndex
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = StanceSizes.touchTarget)
                                .background(if (active) c.interactiveSelected else androidx.compose.ui.graphics.Color.Transparent)
                                .selectable(selected = active, role = Role.Button, onClick = { onSelect(row) })
                                .padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space1),
                            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            if (row.icon != null) StanceIcon(row.icon, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
                            Column(modifier = Modifier.weight(1f)) {
                                Text(row.label, style = StanceTheme.typography.label, color = if (active) c.interactiveSelectedFg else c.fgDefault)
                                if (row.description != null) {
                                    Text(row.description, style = StanceTheme.typography.caption, color = c.fgMuted, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                }
                            }
                            if (row.trailing != null) Text(row.trailing, style = StanceTheme.typography.code, color = c.fgSubtle)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PickerNote(text: String) {
    Text(
        text,
        style = StanceTheme.typography.bodySmall,
        color = StanceTheme.colors.fgMuted,
        modifier = Modifier
            .padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space3)
            .semantics { liveRegion = LiveRegionMode.Polite },
    )
}

private const val PICKER_VISIBLE_ROWS = 5

/**
 * A model a person can choose.
 *
 * @param badges Short capability labels, for example "Fast" or "Vision".
 */
@Immutable
public data class StanceModel(
    val id: String,
    val name: String,
    val description: String? = null,
    val badges: List<String> = emptyList(),
    val enabled: Boolean = true,
)

/**
 * Chooses the model for the next message.
 *
 * A button showing the current model opens a bottom sheet with every model, its description
 * and capability badges. The sheet is a radio group: the chosen model is announced as selected.
 *
 * @param label Names the choice. It is the sheet title and part of the button's accessible name.
 * @param size Visual height of the button. The touch target stays at least 48dp.
 */
@Composable
public fun StanceModelPicker(
    models: List<StanceModel>,
    selectedId: String?,
    onSelect: (StanceModel) -> Unit,
    modifier: Modifier = Modifier,
    size: StanceButtonSize = StanceButtonSize.Small,
    enabled: Boolean = true,
    label: String = stringResource(R.string.stance_ai_model),
) {
    val c = StanceTheme.colors
    var open by rememberSaveable { mutableStateOf(false) }
    val current = models.firstOrNull { it.id == selectedId }
    val description = stringResource(R.string.stance_ai_labelled_value, label, current?.name ?: label)
    StanceButton(
        text = current?.name ?: label,
        onClick = { open = true },
        modifier = modifier.semantics {
            contentDescription = description
            role = Role.DropdownList
        },
        variant = StanceButtonVariant.Ghost,
        size = size,
        enabled = enabled,
        trailingIcon = StanceIcons.ChevronDown,
    )
    if (open) {
        StanceBottomSheet(onDismissRequest = { open = false }, title = label) {
            Column(modifier = Modifier.selectableGroup()) {
                models.forEach { model ->
                    val selected = model.id == selectedId
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = StanceSizes.touchTarget)
                            .clip(StanceTheme.shapes.medium)
                            .selectable(selected = selected, enabled = model.enabled, role = Role.RadioButton) {
                                open = false
                                onSelect(model)
                            }
                            .padding(horizontal = StanceSpacing.space2, vertical = StanceSpacing.space2),
                        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
                            Text(model.name, style = StanceTheme.typography.label, color = if (model.enabled) c.fgDefault else c.disabledFg)
                            if (model.description != null) {
                                Text(model.description, style = StanceTheme.typography.caption, color = if (model.enabled) c.fgMuted else c.disabledFg)
                            }
                            if (model.badges.isNotEmpty()) {
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                                    verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                                ) {
                                    model.badges.forEach { StanceBadge(it, variant = StanceBadgeVariant.Outline) }
                                }
                            }
                        }
                        if (selected) StanceIcon(StanceIcons.Check, contentDescription = null, tint = c.fgDefault)
                    }
                }
            }
        }
    }
}

/**
 * Something the assistant can see for this message: a file, a page or a selection.
 *
 * @param kind A short type word read after the label, for example "File".
 */
@Immutable
public data class StanceContextItem(
    val id: String,
    val label: String,
    val icon: ImageVector? = null,
    val kind: String? = null,
)

/**
 * Shows what the assistant can see for this message, each item removable.
 *
 * Chips wrap onto more lines at large font sizes. Items past [max] collapse into a
 * "more" chip that expands them. A removable chip is one button named by [removeDescription].
 *
 * @param onRemove Makes chips removable when set.
 * @param onAdd Shows an add button when set.
 */
@Composable
public fun StanceContextChips(
    items: List<StanceContextItem>,
    modifier: Modifier = Modifier,
    onRemove: ((StanceContextItem) -> Unit)? = null,
    onAdd: (() -> Unit)? = null,
    max: Int = Int.MAX_VALUE,
    label: String = stringResource(R.string.stance_ai_context),
    addLabel: String = stringResource(R.string.stance_ai_add_context),
    removeDescription: (label: String) -> String = defaultRemoveDescription(),
    moreLabel: String = (items.size - max.coerceAtLeast(0)).coerceAtLeast(0).let { pluralStringResource(R.plurals.stance_ai_more, it, it) },
) {
    val c = StanceTheme.colors
    var showAll by rememberSaveable { mutableStateOf(false) }
    val limit = max.coerceAtLeast(0)
    val shown = if (showAll || items.size <= limit) items else items.take(limit)
    val shape = StanceTheme.shapes.pill
    FlowRow(
        modifier = modifier.semantics { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
        itemVerticalAlignment = Alignment.CenterVertically,
    ) {
        shown.forEach { item ->
            val name = if (item.kind != null) stringResource(R.string.stance_ai_labelled_value, item.kind, item.label) else item.label
            val remove = removeDescription(item.label)
            Row(
                modifier = Modifier
                    .then(if (onRemove != null) Modifier.minimumInteractiveComponentSize().stanceFocusRing(shape) else Modifier)
                    .clip(shape)
                    .then(
                        if (onRemove != null) Modifier.clickable(role = Role.Button, onClickLabel = remove) { onRemove(item) } else Modifier,
                    )
                    .background(c.bgMuted)
                    .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, shape)
                    .padding(horizontal = StanceSpacing.space25, vertical = StanceSpacing.space15)
                    .clearAndSetSemantics {
                        contentDescription = name
                        if (onRemove != null) {
                            role = Role.Button
                            onClick(label = remove) { onRemove(item); true }
                        }
                    },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space15),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (item.icon != null) StanceIcon(item.icon, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
                Text(item.label, style = StanceTheme.typography.labelSmall, color = c.fgDefault, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (onRemove != null) StanceIcon(StanceIcons.X, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
            }
        }
        if (shown.size < items.size) {
            StanceButton(moreLabel, onClick = { showAll = true }, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small)
        }
        if (onAdd != null) {
            StanceButton(addLabel, onClick = onAdd, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, leadingIcon = StanceIcons.Plus)
        }
    }
}

/** What a [StanceVoiceInputButton] is doing. */
public enum class StanceVoiceInputState { Idle, Listening, Processing, Unavailable }

/**
 * A microphone button with idle, listening and processing states and a level ring.
 *
 * A toggle button: on while listening. The state is read as its state description and is a
 * polite live region, so changes are announced. While listening, a ring grows with [level];
 * it moves at once when the system has animations turned off.
 *
 * @param level Input loudness from 0 to 1 while listening.
 */
@Composable
public fun StanceVoiceInputButton(
    state: StanceVoiceInputState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    level: Float = 0f,
    label: String = stringResource(R.string.stance_ai_voice_input),
    stateLabel: String = stringResource(
        when (state) {
            StanceVoiceInputState.Idle -> R.string.stance_ai_voice_idle
            StanceVoiceInputState.Listening -> R.string.stance_ai_voice_listening
            StanceVoiceInputState.Processing -> R.string.stance_ai_voice_processing
            StanceVoiceInputState.Unavailable -> R.string.stance_ai_voice_unavailable
        },
    ),
) {
    val c = StanceTheme.colors
    val listening = state == StanceVoiceInputState.Listening
    val ring by animateFloatAsState(
        targetValue = if (listening) level.coerceIn(0f, 1f) else 0f,
        animationSpec = StanceTheme.motion.fast(),
        label = "stance-voice-level",
    )
    val ringColor = c.borderStrong
    val a11y = Modifier.semantics {
        stateDescription = stateLabel
        toggleableState = if (listening) ToggleableState.On else ToggleableState.Off
        liveRegion = LiveRegionMode.Polite
    }
    Box(
        modifier = modifier.drawBehind {
            if (listening) {
                // The ring sits inside the 48dp target and thickens with the input level.
                val stroke = StanceSpacing.space05.toPx() + StanceSpacing.space1.toPx() * ring
                drawCircle(ringColor, radius = (size.minDimension - stroke) / 2f, style = Stroke(stroke))
            }
        },
        contentAlignment = Alignment.Center,
    ) {
        if (state == StanceVoiceInputState.Processing) {
            Box(Modifier.minimumInteractiveComponentSize().then(a11y), contentAlignment = Alignment.Center) {
                StanceCircularProgressIndicator(contentDescription = label, size = StanceSizes.iconMedium)
            }
        } else {
            StanceIconButton(
                icon = StanceIcons.Microphone,
                contentDescription = label,
                onClick = onClick,
                modifier = a11y,
                variant = if (listening) StanceIconButtonVariant.Filled else StanceIconButtonVariant.Ghost,
                enabled = state != StanceVoiceInputState.Unavailable,
            )
        }
    }
}

/** How a [StanceStopButton] looks. */
public enum class StanceStopButtonVariant {
    /** A filled icon button. */
    Icon,

    /** An outline button with the stop icon and its label. */
    Labelled,
}

/**
 * Stops a response that is being generated. Gives haptic feedback.
 *
 * @param label The accessible name, and the visible text of the labelled variant.
 * @param size Visual height of the labelled variant. The touch target stays at least 48dp.
 */
@Composable
public fun StanceStopButton(
    onStop: () -> Unit,
    modifier: Modifier = Modifier,
    label: String = stringResource(R.string.stance_ai_stop),
    size: StanceButtonSize = StanceButtonSize.Medium,
    variant: StanceStopButtonVariant = StanceStopButtonVariant.Icon,
) {
    val haptics = LocalHapticFeedback.current
    val stop = {
        haptics.performHapticFeedback(HapticFeedbackType.ContextClick)
        onStop()
    }
    when (variant) {
        StanceStopButtonVariant.Icon -> StanceIconButton(StanceIcons.Stop, label, stop, modifier, StanceIconButtonVariant.Filled)
        StanceStopButtonVariant.Labelled -> StanceButton(label, stop, modifier, StanceButtonVariant.Outline, size, leadingIcon = StanceIcons.Stop)
    }
}

/** How close a [StanceTokenBudgetMeter] is to its limit. */
public enum class StanceBudgetLevel { Normal, Warning, Exceeded }

/**
 * The level for [used] out of [limit]: [StanceBudgetLevel.Warning] from the [warnAt] fraction
 * and [StanceBudgetLevel.Exceeded] from the limit itself. A limit of zero or less is never reached.
 */
public fun stanceBudgetLevel(used: Long, limit: Long, warnAt: Float = 0.8f): StanceBudgetLevel = when {
    limit <= 0L -> StanceBudgetLevel.Normal
    used >= limit -> StanceBudgetLevel.Exceeded
    used.toFloat() / limit.toFloat() >= warnAt -> StanceBudgetLevel.Warning
    else -> StanceBudgetLevel.Normal
}

/** How a [StanceTokenBudgetMeter] is drawn. */
public enum class StanceTokenBudgetVariant { Ring, Bar, Text }

/**
 * A compact meter of how much of the context or message limit is used.
 *
 * Read as a progress value named [label] with the formatted amount as its value text. Near
 * the limit a warning icon appears with [warningLabel], or [exceededLabel] at the limit. That
 * mark is a polite live region, so crossing the threshold is announced once, and the warning
 * never depends on colour alone.
 *
 * @param warnAt The fraction of [limit] from which the warning shows.
 * @param format Formats the value text from [used] and [limit].
 */
@Composable
public fun StanceTokenBudgetMeter(
    used: Long,
    limit: Long,
    modifier: Modifier = Modifier,
    warnAt: Float = 0.8f,
    format: (used: Long, limit: Long) -> String = defaultBudgetFormat(),
    label: String = stringResource(R.string.stance_ai_budget_label),
    variant: StanceTokenBudgetVariant = StanceTokenBudgetVariant.Ring,
    warningLabel: String = stringResource(R.string.stance_ai_budget_warning),
    exceededLabel: String = stringResource(R.string.stance_ai_budget_exceeded),
) {
    val c = StanceTheme.colors
    val level = stanceBudgetLevel(used, limit, warnAt)
    val fraction = if (limit > 0L) (used.toDouble() / limit.toDouble()).toFloat().coerceIn(0f, 1f) else 0f
    val valueText = format(used, limit)
    val fill = when (level) {
        StanceBudgetLevel.Normal -> c.fgMuted
        StanceBudgetLevel.Warning -> c.warningFg
        StanceBudgetLevel.Exceeded -> c.dangerFg
    }
    val track = c.bgEmphasis
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .weight(1f, fill = false)
                .clearAndSetSemantics {
                    contentDescription = label
                    stateDescription = valueText
                    progressBarRangeInfo = ProgressBarRangeInfo(fraction, 0f..1f)
                },
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            when (variant) {
                StanceTokenBudgetVariant.Ring -> Canvas(Modifier.size(StanceSizes.iconMedium)) {
                    val stroke = StanceSpacing.space05.toPx() * RING_STROKE_STEPS
                    val inset = stroke / 2f
                    val arc = Size(size.width - stroke, size.height - stroke)
                    drawArc(track, 0f, FULL_TURN, useCenter = false, topLeft = Offset(inset, inset), size = arc, style = Stroke(stroke))
                    // Clockwise from the top, anticlockwise in right to left layouts.
                    val sweep = FULL_TURN * fraction * if (rtl) -1f else 1f
                    drawArc(fill, TOP_ANGLE, sweep, useCenter = false, topLeft = Offset(inset, inset), size = arc, style = Stroke(stroke, cap = StrokeCap.Round))
                }
                StanceTokenBudgetVariant.Bar -> LinearProgressIndicator(
                    progress = { fraction },
                    modifier = Modifier.width(StanceSpacing.space16),
                    color = fill,
                    trackColor = track,
                    drawStopIndicator = {},
                )
                StanceTokenBudgetVariant.Text -> Unit
            }
            if (variant != StanceTokenBudgetVariant.Ring) {
                Text(valueText, style = StanceTheme.typography.caption, color = c.fgMuted)
            }
        }
        if (level != StanceBudgetLevel.Normal) {
            val words = if (level == StanceBudgetLevel.Exceeded) exceededLabel else warningLabel
            Row(
                modifier = Modifier.clearAndSetSemantics {
                    contentDescription = words
                    liveRegion = LiveRegionMode.Polite
                },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                StanceIcon(StanceIcons.AlertTriangle, contentDescription = null, size = StanceSizes.iconSmall, tint = fill)
                if (variant != StanceTokenBudgetVariant.Ring) Text(words, style = StanceTheme.typography.caption, color = fill)
            }
        }
    }
}

@Composable
internal fun defaultBudgetFormat(): (Long, Long) -> String = rememberFromResources { r ->
    val numbers = NumberFormat.getIntegerInstance(r.configuration.locales[0]);
    { used, limit -> r.getString(R.string.stance_ai_budget_value, numbers.format(used), numbers.format(limit)) }
}

private const val FULL_TURN = 360f
private const val TOP_ANGLE = -90f
private const val RING_STROKE_STEPS = 1.5f
