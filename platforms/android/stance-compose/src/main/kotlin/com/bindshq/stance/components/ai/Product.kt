@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.bindshq.stance.components.ai

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.DockedSearchBar
import androidx.compose.material3.SearchBarDefaults
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.SuggestionChipDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.CollectionItemInfo
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.collectionItemInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceDropdownMenu
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.data.StanceSkeleton
import com.bindshq.stance.components.feedback.StanceBottomSheet
import com.bindshq.stance.components.forms.StanceFormField
import com.bindshq.stance.components.forms.StanceTextField
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.foundation.expandEnter
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.foundation.rememberStanceWindowWidth
import com.bindshq.stance.foundation.shrinkExit
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

// Wave two, product: AI inside an ordinary product screen. Quiet by design: suggestions never
// move focus, never block typing and are dismissed with Escape.

// ───────────── Inline suggestion ─────────────

/**
 * Shows [ghost] after what the person typed, in the subtle ink, without making it part of the
 * text: the field's value, the cursor and the selection only ever cover what was typed.
 */
internal class StanceGhostTextTransformation(private val ghost: String, private val style: SpanStyle) : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        if (ghost.isEmpty()) return TransformedText(text, OffsetMapping.Identity)
        val typed = text.length
        val shown = buildAnnotatedString {
            append(text)
            withStyle(style) { append(ghost) }
        }
        return TransformedText(
            shown,
            object : OffsetMapping {
                override fun originalToTransformed(offset: Int): Int = offset

                // The cursor can never land inside the suggestion.
                override fun transformedToOriginal(offset: Int): Int = offset.coerceAtMost(typed)
            },
        )
    }

    override fun equals(other: Any?): Boolean = other is StanceGhostTextTransformation && other.ghost == ghost && other.style == style

    override fun hashCode(): Int = ghost.hashCode() * 31 + style.hashCode()
}

/** The first word of [suggestion] with the whitespace before it, as "accept one word" takes it. */
public fun stanceSuggestionWord(suggestion: String): String {
    var end = 0
    while (end < suggestion.length && suggestion[end].isWhitespace()) end++
    while (end < suggestion.length && !suggestion[end].isWhitespace()) end++
    return suggestion.substring(0, end)
}

/**
 * A text field with a ghost text completion after what the person typed.
 *
 * The suggestion is drawn by a visual transformation on the Stance text field, so it is never
 * part of the value until [onAccept] is called and the app appends it. Typing carries on without
 * interruption and focus never moves. On a hardware keyboard Tab accepts, Control with the right
 * arrow accepts one word and Escape dismisses. On touch, the accept button in the field's trailing
 * slot does the same, and it announces the suggestion once, politely, when it appears.
 *
 * @param suggestion The text to offer after [value], or null for none.
 * @param onAccept Called to take the whole suggestion. Append it to the value.
 * @param onAcceptWord Called to take the next word only. See [stanceSuggestionWord].
 * @param onDismiss Called when the person dismisses the suggestion with Escape.
 * @param loading Shows that a suggestion is on its way.
 * @param acceptDescription Names the accept button, from the suggestion, for example "Accept suggestion: by Friday".
 */
@Composable
public fun StanceInlineSuggestion(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    suggestion: String?,
    onAccept: () -> Unit,
    modifier: Modifier = Modifier,
    onAcceptWord: (() -> Unit)? = null,
    onDismiss: (() -> Unit)? = null,
    loading: Boolean = false,
    placeholder: String? = null,
    helper: String? = null,
    singleLine: Boolean = false,
    minLines: Int = 1,
    enabled: Boolean = true,
    acceptDescription: (String) -> String =
        rememberFromResources { r -> { text -> r.getString(R.string.stance_ai_suggestion_accept, text) } },
    loadingDescription: String = stringResource(R.string.stance_ai_suggestion_loading),
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    val offered = suggestion?.takeIf { it.isNotEmpty() && enabled }
    val ghost = remember(offered, c) { StanceGhostTextTransformation(offered.orEmpty(), SpanStyle(color = c.fgSubtle)) }
    val accept = {
        haptics.performHapticFeedback(HapticFeedbackType.Confirm)
        onAccept()
    }
    StanceTextField(
        value = value,
        onValueChange = onValueChange,
        label = label,
        modifier = modifier.onPreviewKeyEvent { event ->
            when {
                offered == null -> false
                event.key == Key.Tab && !event.isShiftPressed -> {
                    if (event.type == KeyEventType.KeyDown) accept()
                    true
                }
                event.key == Key.DirectionRight && event.isCtrlPressed && onAcceptWord != null -> {
                    if (event.type == KeyEventType.KeyDown) onAcceptWord()
                    true
                }
                event.key == Key.Escape && onDismiss != null -> {
                    if (event.type == KeyEventType.KeyUp) onDismiss()
                    true
                }
                else -> false
            }
        },
        placeholder = placeholder,
        helper = helper,
        enabled = enabled,
        singleLine = singleLine,
        minLines = minLines,
        visualTransformation = ghost,
        trailing = when {
            offered != null -> ({
                StanceIconButton(
                    StanceIcons.Check,
                    acceptDescription(offered),
                    onClick = accept,
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                )
            })
            loading -> ({ StanceIcon(StanceIcons.Sparkle, contentDescription = loadingDescription, size = StanceSizes.iconSmall, tint = c.fgSubtle) })
            else -> null
        },
    )
}

// ───────────── Smart field ─────────────

/** Where an AI suggestion for a [StanceSmartField] is. */
public enum class StanceSmartFieldStatus {
    /** No suggestion. */
    Idle,

    /** A suggestion is being worked out. */
    Suggesting,

    /** A suggestion is ready to use. */
    Suggested,

    /** The value in the field came from AI. */
    Accepted,
}

/** The words of a [StanceSmartField]. Build with [StanceSmartFieldDefaults.labels]. */
@Immutable
public data class StanceSmartFieldLabels(
    val suggesting: String,
    val use: String,
    val undo: String,
    val regenerate: String,
    val filled: String,
    /** The suggestion line, from the suggested value. */
    val suggested: (String) -> String,
    /** Where the value came from, from the source. */
    val source: (String) -> String,
)

/** Defaults for [StanceSmartField]. */
public object StanceSmartFieldDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        suggesting: String = stringResource(R.string.stance_ai_smart_suggesting),
        use: String = stringResource(R.string.stance_ai_smart_use),
        undo: String = stringResource(R.string.stance_undo),
        regenerate: String = stringResource(R.string.stance_ai_regenerate),
        filled: String = stringResource(R.string.stance_ai_smart_filled),
    ): StanceSmartFieldLabels {
        val suggested: (String) -> String = rememberFromResources { r -> { value -> r.getString(R.string.stance_ai_smart_suggested, value) } }
        val source: (String) -> String = rememberFromResources { r -> { from -> r.getString(R.string.stance_ai_smart_source, from) } }
        return StanceSmartFieldLabels(suggesting, use, undo, regenerate, filled, suggested, source)
    }
}

/**
 * A form field that AI can fill in. It says in words that a value was suggested and where it came
 * from, and lets people use it, ask again or undo it.
 *
 * The note under the field is a polite live region, so a new suggestion and an undo are each
 * announced once. The AI mark is tied to the value it was accepted with: as soon as the person
 * edits the field the mark goes, also before the app moves [status] on.
 *
 * @param suggestedValue The value AI proposes, shown while [status] is [StanceSmartFieldStatus.Suggested].
 * @param suggestionSource Where the suggestion came from, for example "Invoice 1042".
 * @param onAccept Puts the suggestion in the field. Set [value] and move [status] to accepted.
 * @param onUndo Restores what was there before. Shown once a suggestion is accepted.
 * @param field The control, when it is not a text field. It replaces the built-in one and is labelled by [label].
 */
@Composable
public fun StanceSmartField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    status: StanceSmartFieldStatus = StanceSmartFieldStatus.Idle,
    suggestedValue: String? = null,
    suggestionSource: String? = null,
    onAccept: (() -> Unit)? = null,
    onUndo: (() -> Unit)? = null,
    onRegenerate: (() -> Unit)? = null,
    placeholder: String? = null,
    enabled: Boolean = true,
    labels: StanceSmartFieldLabels = StanceSmartFieldDefaults.labels(),
    field: (@Composable () -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    // The value the field held when it became accepted. Any edit after that drops the AI mark.
    val acceptedValue = remember(status) { value }
    val marked = status == StanceSmartFieldStatus.Accepted && value == acceptedValue
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
        if (field != null) {
            StanceFormField(label = label, enabled = enabled) { field() }
        } else {
            StanceTextField(
                value = value,
                onValueChange = onValueChange,
                label = label,
                placeholder = placeholder,
                enabled = enabled,
                leadingIcon = if (marked) StanceIcons.Sparkle else null,
            )
        }
        Column(modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }) {
            when {
                status == StanceSmartFieldStatus.Suggesting -> StanceShimmerText(labels.suggesting, style = StanceTheme.typography.caption)
                status == StanceSmartFieldStatus.Suggested && suggestedValue != null -> FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    itemVerticalAlignment = Alignment.CenterVertically,
                ) {
                    SmartNote(listOfNotNull(labels.suggested(suggestedValue), suggestionSource?.let(labels.source)))
                    if (onAccept != null) {
                        StanceButton(labels.use, onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                            onAccept()
                        }, variant = StanceButtonVariant.Secondary, size = StanceButtonSize.Small, enabled = enabled)
                    }
                    if (onRegenerate != null) StanceIconButton(StanceIcons.Refresh, labels.regenerate, onClick = onRegenerate, enabled = enabled)
                }
                marked -> FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    itemVerticalAlignment = Alignment.CenterVertically,
                ) {
                    SmartNote(listOfNotNull(labels.filled, suggestionSource?.let(labels.source)))
                    if (onUndo != null) StanceButton(labels.undo, onClick = onUndo, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, enabled = enabled)
                }
            }
        }
    }
}

@Composable
private fun SmartNote(parts: List<String>) {
    val c = StanceTheme.colors
    Row(
        modifier = Modifier.semantics(mergeDescendants = true) { },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
        Text(parts.joinToString(stringResource(R.string.stance_list_separator)), style = StanceTheme.typography.caption, color = c.fgMuted)
    }
}

// ───────────── Rewrite menu ─────────────

/**
 * One way to change text in a [StanceRewriteMenu].
 *
 * @param children Choices one level down, for example the tones under "Change tone".
 */
@Immutable
public data class StanceRewriteAction(
    val id: String,
    val label: String,
    val icon: ImageVector? = null,
    val children: List<StanceRewriteAction> = emptyList(),
)

/**
 * The menu items for one level of rewrite actions. An action with children keeps the menu open
 * and opens its level; a level below the top starts with a back item.
 */
internal fun stanceRewriteItems(
    actions: List<StanceRewriteAction>,
    parent: StanceRewriteAction?,
    backLabel: String,
    onOpen: (StanceRewriteAction?) -> Unit,
    onAction: (StanceRewriteAction) -> Unit,
): List<StanceMenuItem> = buildList {
    if (parent != null) add(StanceMenuItem(backLabel, onClick = { onOpen(null) }, icon = StanceIcons.ChevronLeft, keepOpen = true))
    (parent?.children ?: actions).forEachIndexed { index, action ->
        val nested = action.children.isNotEmpty()
        add(
            StanceMenuItem(
                label = action.label,
                onClick = { if (nested) onOpen(action) else onAction(action) },
                icon = action.icon,
                startsGroup = parent != null && index == 0,
                trailingIcon = if (nested) StanceIcons.ChevronRight else null,
                keepOpen = nested,
            ),
        )
    }
}

/**
 * A menu of ways to change selected text: improve, shorten, lengthen, change tone, translate, or
 * a custom instruction. Built on [StanceDropdownMenu].
 *
 * Android menus do not cascade, so an action with children opens its choices in place, with a
 * Back item at the top. The menu dismisses on back, outside taps and Escape. Place it in a box
 * with the element that opens it. Show the result with [StanceRewritePreview].
 *
 * @param onAction Called with the chosen action, which has no children.
 * @param allowCustom Adds a field for a free instruction under the actions.
 * @param onCustomSubmit Called with the trimmed instruction.
 */
@Composable
public fun StanceRewriteMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    actions: List<StanceRewriteAction>,
    onAction: (StanceRewriteAction) -> Unit,
    modifier: Modifier = Modifier,
    offset: DpOffset = DpOffset.Zero,
    allowCustom: Boolean = false,
    onCustomSubmit: ((String) -> Unit)? = null,
    customLabel: String = stringResource(R.string.stance_ai_rewrite_custom),
    customPlaceholder: String = stringResource(R.string.stance_ai_rewrite_custom_placeholder),
    submitLabel: String = stringResource(R.string.stance_ai_rewrite_submit),
    backLabel: String = stringResource(R.string.stance_ai_rewrite_back),
) {
    var parent by remember { mutableStateOf<StanceRewriteAction?>(null) }
    var instruction by rememberSaveable { mutableStateOf("") }
    // Every opening starts at the top level.
    LaunchedEffect(expanded) { if (!expanded) parent = null }
    val items = remember(actions, parent, backLabel, onAction) { stanceRewriteItems(actions, parent, backLabel, { parent = it }, onAction) }
    val submit = {
        val text = instruction.trim()
        if (text.isNotEmpty() && onCustomSubmit != null) {
            instruction = ""
            onDismissRequest()
            onCustomSubmit(text)
        }
    }
    StanceDropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismissRequest,
        items = items,
        modifier = modifier,
        offset = offset,
        footer = if (allowCustom && onCustomSubmit != null && parent == null) {
            {
                StanceDivider()
                StanceTextField(
                    value = instruction,
                    onValueChange = { instruction = it },
                    label = customLabel,
                    modifier = Modifier.padding(horizontal = StanceSpacing.space3, vertical = StanceSpacing.space2),
                    placeholder = customPlaceholder,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = { submit() }),
                    trailing = { StanceIconButton(StanceIcons.Send, submitLabel, onClick = submit, enabled = instruction.isNotBlank()) },
                )
            }
        } else {
            null
        },
    )
}

/**
 * The result of a rewrite, shown where the text is before it replaces anything: a labelled
 * region with the new text and Replace and Discard.
 *
 * Nothing changes until the person presses Replace. While the [status] is busy a skeleton stands
 * in and Replace waits. Replace and Discard give haptic feedback.
 *
 * @param text The rewritten text. Ignored when [content] is set.
 * @param content Draws the result yourself, for example as a diff.
 */
@Composable
public fun StanceRewritePreview(
    text: String,
    onReplace: () -> Unit,
    onDiscard: () -> Unit,
    modifier: Modifier = Modifier,
    status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    title: String = stringResource(R.string.stance_ai_rewrite_preview),
    replaceLabel: String = stringResource(R.string.stance_ai_rewrite_replace),
    discardLabel: String = stringResource(R.string.stance_ai_rewrite_discard),
    content: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    AiCard(modifier.semantics { isTraversalGroup = true }) {
        Column(modifier = Modifier.padding(StanceSpacing.space3), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1), verticalAlignment = Alignment.CenterVertically) {
                StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
                Text(title, style = StanceTheme.typography.labelSmall, color = c.fgMuted, modifier = Modifier.semantics { heading() })
            }
            when {
                status.isBusy -> StanceStreamingSkeleton(lines = 2)
                content != null -> content()
                else -> Text(text, style = StanceTheme.typography.body, color = c.fgDefault, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
            }
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                StanceButton(replaceLabel, onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                    onReplace()
                }, size = StanceButtonSize.Small, enabled = !status.isBusy)
                StanceButton(discardLabel, onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.Reject)
                    onDiscard()
                }, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small)
            }
        }
    }
}

// ───────────── Summary card ─────────────

/**
 * An AI summary of a longer item: key points, a generated label, sources, and a way to see the
 * original.
 *
 * The points are a list that announces its size. While the [status] is busy a skeleton stands in
 * and is read as one status. With [collapsible] the title is a button that reports Expanded or
 * Collapsed.
 *
 * @param points The key points, one short sentence each. Ignored when [content] is set.
 * @param updatedAt When the summary was made, already formatted, for example "2 min ago".
 * @param onExpand Opens the original item.
 * @param content Draws the body yourself, for example with a Markdown renderer.
 */
@Composable
public fun StanceSummaryCard(
    modifier: Modifier = Modifier,
    title: String = stringResource(R.string.stance_ai_summary),
    points: List<String> = emptyList(),
    status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    sources: List<StanceSource> = emptyList(),
    updatedAt: String? = null,
    onRegenerate: (() -> Unit)? = null,
    onExpand: (() -> Unit)? = null,
    onSourceOpen: ((StanceSource) -> Unit)? = null,
    collapsible: Boolean = false,
    initiallyExpanded: Boolean = true,
    regenerateLabel: String = stringResource(R.string.stance_ai_regenerate),
    expandLabel: String = stringResource(R.string.stance_ai_summary_original),
    updatedText: String? = updatedAt?.let { stringResource(R.string.stance_ai_summary_updated, it) },
    content: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    var expanded by rememberSaveable { mutableStateOf(initiallyExpanded) }
    val open = expanded || !collapsible
    val expandedText = stringResource(R.string.stance_expanded)
    val collapsedText = stringResource(R.string.stance_collapsed)
    AiCard(modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = StanceSizes.touchTarget)
                .then(if (collapsible) Modifier.clickable(role = Role.Button) { expanded = !expanded } else Modifier)
                .semantics(mergeDescendants = true) {
                    heading()
                    if (collapsible) {
                        stateDescription = if (open) expandedText else collapsedText
                        if (open) collapse { expanded = false; true } else expand { expanded = true; true }
                    }
                }
                .padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space2),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = StanceTheme.typography.title, color = c.fgDefault)
                Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), verticalAlignment = Alignment.CenterVertically) {
                    StanceAIGeneratedLabel()
                    if (updatedText != null) Text(updatedText, style = StanceTheme.typography.caption, color = c.fgSubtle)
                }
            }
            if (collapsible) {
                StanceIcon(if (open) StanceIcons.ChevronUp else StanceIcons.ChevronDown, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
            }
        }
        AnimatedVisibility(visible = open, enter = motion.expandEnter(), exit = motion.shrinkExit()) {
            Column(
                modifier = Modifier.padding(start = StanceSpacing.space4, end = StanceSpacing.space4, bottom = StanceSpacing.space3),
                verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
            ) {
                when {
                    status.isBusy -> StanceStreamingSkeleton()
                    content != null -> content()
                    else -> Column(
                        modifier = Modifier.semantics { collectionInfo = CollectionInfo(rowCount = points.size, columnCount = 1) },
                        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                    ) {
                        points.forEachIndexed { index, point ->
                            Row(
                                modifier = Modifier.semantics(mergeDescendants = true) {
                                    collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1)
                                },
                                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                            ) {
                                Text(BULLET, style = StanceTheme.typography.bodySmall, color = c.fgMuted, modifier = Modifier.clearAndSetSemantics { })
                                Text(point, style = StanceTheme.typography.bodySmall, color = c.fgDefault, modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
                if (sources.isNotEmpty() && !status.isBusy) StanceSourceList(sources, onSourceOpen = onSourceOpen)
                if (onRegenerate != null || onExpand != null) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                        if (onExpand != null) {
                            StanceButton(expandLabel, onClick = onExpand, variant = StanceButtonVariant.Outline, size = StanceButtonSize.Small, trailingIcon = StanceIcons.ArrowUpRight)
                        }
                        if (onRegenerate != null) {
                            StanceButton(regenerateLabel, onClick = onRegenerate, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, enabled = !status.isBusy, leadingIcon = StanceIcons.Refresh)
                        }
                    }
                }
            }
        }
    }
}

private const val BULLET = "•"

// ───────────── Suggestion chips ─────────────

/** A short follow up prompt or next action. */
@Immutable
public data class StanceSuggestion(val id: String, val label: String, val icon: ImageVector? = null)

/**
 * Short follow up prompts or next actions, offered after a response or beside content, on the
 * Material 3 suggestion chip.
 *
 * A group named [label]. Each chip is a button with a 48dp touch target. While [loading],
 * placeholders stand in and are read as one status.
 *
 * @param wrap Wraps onto more rows. Otherwise the chips are one row that scrolls sideways.
 */
@Composable
public fun StanceSuggestionChips(
    items: List<StanceSuggestion>,
    onSelect: (StanceSuggestion) -> Unit,
    modifier: Modifier = Modifier,
    loading: Boolean = false,
    wrap: Boolean = true,
    enabled: Boolean = true,
    label: String = stringResource(R.string.stance_ai_suggestions),
    loadingDescription: String = stringResource(R.string.stance_ai_suggestion_loading),
) {
    val c = StanceTheme.colors
    val chips: @Composable () -> Unit = {
        if (loading) {
            Row(
                modifier = Modifier.clearAndSetSemantics { contentDescription = loadingDescription },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            ) {
                repeat(LOADING_CHIPS) { StanceSkeleton(width = StanceSpacing.space24, height = StanceSizes.controlSmall) }
            }
        } else {
            items.forEach { item ->
                SuggestionChip(
                    onClick = { onSelect(item) },
                    label = { Text(item.label, style = StanceTheme.typography.label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    enabled = enabled,
                    icon = item.icon?.let { icon -> { StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall) } },
                    shape = StanceTheme.shapes.pill,
                    colors = SuggestionChipDefaults.suggestionChipColors(
                        containerColor = c.bgSurface,
                        labelColor = c.fgDefault,
                        iconContentColor = c.fgMuted,
                        disabledContainerColor = c.disabledBg,
                        disabledLabelColor = c.disabledFg,
                        disabledIconContentColor = c.disabledFg,
                    ),
                    border = BorderStroke(StanceTheme.tokens.controlBorderWidth.dp, if (enabled) c.borderControl else c.disabledBorder),
                )
            }
        }
    }
    val group = modifier.semantics { contentDescription = label }
    if (wrap) {
        FlowRow(modifier = group, horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) { chips() }
    } else {
        Row(modifier = group.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) { chips() }
    }
}

private const val LOADING_CHIPS = 3

// ───────────── Ask bar ─────────────

/**
 * A single line "ask anything" bar for a page or a product, on the Material 3 docked search bar, with
 * suggestion chips under it and an inline answer area.
 *
 * The bar is a search field: the keyboard's search key and the send button submit, and the clear
 * button empties it. Suggestions are [StanceSuggestionChips]. While the [status] is busy the answer
 * area shows a thinking indicator, and when the answer is complete it is a polite live region,
 * so it is announced once.
 *
 * @param onSuggestionSelect Called with a tapped suggestion. Defaults to submitting its label.
 * @param onClear Called when the bar is cleared. The value is also set to empty.
 * @param answer The answer, shown under the bar once there is a status to show.
 */
@Composable
public fun StanceAskBar(
    value: String,
    onValueChange: (String) -> Unit,
    onSubmit: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = stringResource(R.string.stance_ai_composer_placeholder),
    suggestions: List<StanceSuggestion> = emptyList(),
    onSuggestionSelect: ((StanceSuggestion) -> Unit)? = null,
    status: StanceGenerationStatus = StanceGenerationStatus.Idle,
    onClear: (() -> Unit)? = null,
    enabled: Boolean = true,
    submitDescription: String = stringResource(R.string.stance_ai_ask_submit),
    clearDescription: String = stringResource(R.string.stance_ai_ask_clear),
    answerLabel: String = stringResource(R.string.stance_ai_ask_answer),
    answer: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val haptics = LocalHapticFeedback.current
    val submit = { text: String ->
        if (text.isNotBlank() && !status.isBusy) {
            haptics.performHapticFeedback(HapticFeedbackType.Confirm)
            onSubmit(text.trim())
        }
    }
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        DockedSearchBar(
            inputField = {
                SearchBarDefaults.InputField(
                    query = value,
                    onQueryChange = onValueChange,
                    onSearch = submit,
                    expanded = false,
                    onExpandedChange = { },
                    modifier = Modifier.semantics { contentDescription = placeholder },
                    enabled = enabled,
                    placeholder = { Text(placeholder, style = StanceTheme.typography.body) },
                    leadingIcon = { StanceIcon(StanceIcons.Sparkle, contentDescription = null, tint = c.fgMuted) },
                    trailingIcon = if (value.isNotEmpty()) {
                        {
                            Row {
                                StanceIconButton(StanceIcons.X, clearDescription, onClick = {
                                    onValueChange("")
                                    onClear?.invoke()
                                }, enabled = enabled)
                                StanceIconButton(StanceIcons.Send, submitDescription, onClick = { submit(value) }, enabled = enabled && !status.isBusy)
                            }
                        }
                    } else {
                        null
                    },
                    colors = SearchBarDefaults.inputFieldColors(
                        focusedTextColor = c.fgDefault,
                        unfocusedTextColor = c.fgDefault,
                        disabledTextColor = c.disabledFg,
                        cursorColor = c.fgDefault,
                        focusedPlaceholderColor = c.fgSubtle,
                        unfocusedPlaceholderColor = c.fgSubtle,
                    ),
                )
            },
            expanded = false,
            onExpandedChange = { },
            modifier = Modifier.fillMaxWidth().border(StanceTheme.tokens.controlBorderWidth.dp, c.borderControl, StanceTheme.shapes.pill),
            shape = StanceTheme.shapes.pill,
            colors = SearchBarDefaults.colors(containerColor = c.bgSurface, dividerColor = c.separator),
            tonalElevation = StanceSpacing.none,
            shadowElevation = StanceSpacing.none,
        ) { }
        if (suggestions.isNotEmpty()) {
            StanceSuggestionChips(
                items = suggestions,
                onSelect = { suggestion -> if (onSuggestionSelect != null) onSuggestionSelect(suggestion) else submit(suggestion.label) },
                wrap = false,
                enabled = enabled && !status.isBusy,
            )
        }
        when {
            status.isBusy -> StanceThinkingIndicator()
            answer != null && status != StanceGenerationStatus.Idle -> Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(StanceTheme.shapes.large)
                    .background(c.bgSubtle)
                    .semantics {
                        contentDescription = answerLabel
                        if (status == StanceGenerationStatus.Complete) liveRegion = LiveRegionMode.Polite
                    }
                    .padding(StanceSpacing.space4),
                verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                content = answer,
            )
        }
    }
}

// ───────────── Insight callout ─────────────

/** What kind of finding a [StanceInsightCallout] is. Shown by its icon and border, on the ink scale. */
public enum class StanceInsightTone { Neutral, Positive, Attention }

/**
 * A highlighted finding the system noticed in your data, with the evidence and one suggested action.
 *
 * It stays on the ink scale: the tone changes the icon and the weight of the border, never the
 * hue. The title is a heading, the confidence is a [StanceConfidenceBadge] in words, and the
 * dismiss button is named.
 *
 * @param confidence How sure the system is, or null to leave it out.
 * @param actionLabel The one suggested action. Shown with [onAction].
 * @param evidence The numbers or rows behind the finding, under an "Evidence" label.
 * @param content The finding in plain words.
 */
@Composable
public fun StanceInsightCallout(
    title: String,
    modifier: Modifier = Modifier,
    tone: StanceInsightTone = StanceInsightTone.Neutral,
    confidence: StanceConfidenceLevel? = null,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
    onDismiss: (() -> Unit)? = null,
    dismissDescription: String = stringResource(R.string.stance_dismiss),
    evidenceLabel: String = stringResource(R.string.stance_ai_insight_evidence),
    evidence: (@Composable ColumnScope.() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = StanceTheme.colors
    val shape = StanceTheme.shapes.large
    val attention = tone == StanceInsightTone.Attention
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(c.bgSubtle)
            .border(
                if (attention) StanceTheme.tokens.controlBorderWidth.dp else StanceTheme.tokens.borderWidth.dp,
                if (attention) c.borderStrong else c.borderDefault,
                shape,
            )
            .padding(start = StanceSpacing.space4, top = StanceSpacing.space3, bottom = StanceSpacing.space4),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
    ) {
        StanceIcon(
            when (tone) {
                StanceInsightTone.Neutral -> StanceIcons.Sparkle
                StanceInsightTone.Positive -> StanceIcons.ArrowUpRight
                StanceInsightTone.Attention -> StanceIcons.AlertTriangle
            },
            contentDescription = null,
            tint = c.fgDefault,
            modifier = Modifier.padding(top = StanceSpacing.space2),
        )
        Column(modifier = Modifier.weight(1f).padding(top = StanceSpacing.space2), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            Text(title, style = StanceTheme.typography.title, color = c.fgDefault, modifier = Modifier.semantics { heading() })
            content()
            if (confidence != null) StanceConfidenceBadge(confidence)
            if (evidence != null) {
                Column(
                    modifier = Modifier.semantics { contentDescription = evidenceLabel },
                    verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                ) {
                    Text(evidenceLabel, style = StanceTheme.typography.labelSmall, color = c.fgMuted, modifier = Modifier.clearAndSetSemantics { })
                    evidence()
                }
            }
            if (actionLabel != null && onAction != null) {
                StanceButton(actionLabel, onClick = onAction, variant = StanceButtonVariant.Secondary, size = StanceButtonSize.Small)
            }
        }
        if (onDismiss != null) StanceIconButton(StanceIcons.X, dismissDescription, onClick = onDismiss) else Box(Modifier.width(StanceSpacing.space3))
    }
}

// ───────────── Semantic search results ─────────────

/**
 * One result of a [StanceSemanticSearchResults].
 *
 * @param snippet The passage that matched.
 * @param highlights The words or phrases of [snippet] to mark.
 * @param source Where the result lives, for example "Help centre".
 * @param score How close the match is, from 0 to 1.
 * @param reason Why it matched, in plain words.
 */
@Immutable
public data class StanceSearchResult(
    val id: String,
    val title: String,
    val snippet: String,
    val highlights: List<String> = emptyList(),
    val source: String? = null,
    val score: Float? = null,
    val reason: String? = null,
)

/** The ranges of [text] that [highlights] mark, ignoring case, merged where they touch or overlap, in order. */
internal fun stanceHighlightRanges(text: String, highlights: List<String>): List<IntRange> {
    val found = highlights.filter { it.isNotBlank() }.flatMap { phrase ->
        generateSequence(text.indexOf(phrase, ignoreCase = true).takeIf { it >= 0 }) { at ->
            text.indexOf(phrase, at + phrase.length, ignoreCase = true).takeIf { it >= 0 }
        }.map { it until it + phrase.length }.toList()
    }.sortedBy { it.first }
    val merged = mutableListOf<IntRange>()
    for (range in found) {
        val last = merged.lastOrNull()
        if (last != null && range.first <= last.last + 1) merged[merged.lastIndex] = last.first..maxOf(last.last, range.last) else merged += range
    }
    return merged
}

/**
 * Search results ranked by meaning, each with the matching passage marked and why it matched,
 * under an optional AI answer. A lazy list, so long result sets stay smooth: give it a height.
 *
 * The count is a polite live region, so it is announced once when loading ends. Marked words are
 * heavier and sit on the emphasis background, so they do not depend on colour. Each result reads
 * as one item with its title, passage, source and reason.
 *
 * @param query What was searched for, used in the empty message.
 * @param status While busy, placeholders stand in for the results.
 * @param onResultSelect Makes results tappable.
 * @param scoreText Formats a score for display, for example "92%".
 * @param answer An AI answer above the results.
 */
@Composable
public fun StanceSemanticSearchResults(
    query: String,
    results: List<StanceSearchResult>,
    modifier: Modifier = Modifier,
    status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    onResultSelect: ((StanceSearchResult) -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(StanceSpacing.none),
    countText: String = pluralStringResource(R.plurals.stance_results, results.size, results.size),
    emptyText: String = stringResource(R.string.stance_nothing_matches, query),
    loadingDescription: String = stringResource(R.string.stance_loading),
    reasonText: (String) -> String = rememberFromResources { r -> { reason -> r.getString(R.string.stance_ai_search_reason, reason) } },
    scoreText: (Float) -> String = rememberFromResources { r -> { score -> r.getString(R.string.stance_percent, (score.coerceIn(0f, 1f) * PERCENT).toInt()) } },
    answer: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    val mark = SpanStyle(fontWeight = FontWeight.SemiBold, background = c.bgEmphasis, color = c.fgDefault)
    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        contentPadding = contentPadding,
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
    ) {
        if (answer != null) {
            item(key = "stance-answer", contentType = "answer") {
                StanceCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                        StanceAIGeneratedLabel()
                        answer()
                    }
                }
            }
        }
        item(key = "stance-count", contentType = "count") {
            if (status.isBusy) {
                StanceStreamingSkeleton(variant = StanceStreamingSkeletonVariant.Card, contentDescription = loadingDescription)
            } else {
                Text(
                    if (results.isEmpty()) emptyText else countText,
                    style = StanceTheme.typography.labelSmall,
                    color = c.fgMuted,
                    modifier = Modifier.semantics {
                        heading()
                        liveRegion = LiveRegionMode.Polite
                    },
                )
            }
        }
        if (!status.isBusy) {
            itemsIndexed(results, key = { _, result -> result.id }, contentType = { _, _ -> "result" }) { index, result ->
                val snippet = remember(result, mark) {
                    buildAnnotatedString {
                        append(result.snippet)
                        stanceHighlightRanges(result.snippet, result.highlights).forEach { addStyle(mark, it.first, it.last + 1) }
                    }
                }
                StanceCard(
                    modifier = Modifier.fillMaxWidth().semantics(mergeDescendants = true) {
                        collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1)
                    },
                    onClick = onResultSelect?.let { select -> { select(result) } },
                    contentPadding = PaddingValues(StanceSpacing.space3),
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), verticalAlignment = Alignment.CenterVertically) {
                        Text(result.title, style = StanceTheme.typography.label, color = c.fgDefault, modifier = Modifier.weight(1f))
                        if (result.score != null) Text(scoreText(result.score), style = StanceTheme.typography.labelSmall, color = c.fgMuted)
                    }
                    if (result.source != null) Text(result.source, style = StanceTheme.typography.caption, color = c.fgSubtle)
                    Text(snippet, style = StanceTheme.typography.bodySmall, color = c.fgMuted, modifier = Modifier.padding(top = StanceSpacing.space1))
                    if (result.reason != null) {
                        Text(reasonText(result.reason), style = StanceTheme.typography.caption, color = c.fgMuted, modifier = Modifier.padding(top = StanceSpacing.space1))
                    }
                }
            }
        }
    }
}

private const val PERCENT = 100

// ───────────── Copilot panel ─────────────

/** The side of the window a [StanceCopilotPanel] is docked to, in reading direction. */
public enum class StanceCopilotSide { Start, End }

/**
 * A docked assistant panel for a product: a header with context, a thread and a composer.
 *
 * Compose it while it should be open. On expanded widths it is a pane beside the page, announced
 * by its title, with a border on the side that faces the page. On compact and medium widths it is
 * a [StanceBottomSheet], so drag, back with the predictive preview and scrim taps close it. When
 * it opens, focus goes to the composer, and when the sheet closes the platform returns focus to
 * what opened it.
 *
 * @param side Which edge the pane is docked to. Place it there in your row.
 * @param width The width of the pane on wide windows.
 * @param focusComposer Moves focus to the composer when the panel opens.
 * @param context What the assistant can see, for example [StanceContextChips].
 * @param headerActions Buttons in the header before close.
 * @param composer The input, for example [StancePromptComposer].
 * @param content The conversation, for example [StanceThread].
 */
@Composable
public fun StanceCopilotPanel(
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    title: String = stringResource(R.string.stance_ai_role_assistant),
    side: StanceCopilotSide = StanceCopilotSide.End,
    width: Dp = StanceSizes.drawerWidth + StanceSpacing.space24,
    windowWidth: StanceWindowWidth = rememberStanceWindowWidth(),
    focusComposer: Boolean = true,
    closeDescription: String = stringResource(R.string.stance_ai_copilot_close),
    context: (@Composable () -> Unit)? = null,
    headerActions: @Composable RowScope.() -> Unit = {},
    composer: @Composable () -> Unit,
    content: @Composable () -> Unit,
) {
    val c = StanceTheme.colors
    val focus = remember { FocusRequester() }
    LaunchedEffect(focusComposer) { if (focusComposer) runCatching { focus.requestFocus() } }
    if (windowWidth == StanceWindowWidth.Expanded) {
        Row(modifier = modifier.width(width).fillMaxHeight().dismissOnBack(onDismissRequest).semantics { paneTitle = title }) {
            if (side == StanceCopilotSide.End) StanceDivider(vertical = true)
            StanceSurface(modifier = Modifier.weight(1f).fillMaxHeight(), shape = StanceTheme.shapes.extraSmall, color = c.bgSurface) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(start = StanceSpacing.space4, end = StanceSpacing.space1),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
                        Text(
                            title,
                            style = StanceTheme.typography.title,
                            color = c.fgDefault,
                            modifier = Modifier.weight(1f).padding(start = StanceSpacing.space2).semantics { heading() },
                        )
                        headerActions()
                        StanceIconButton(StanceIcons.X, closeDescription, onClick = onDismissRequest)
                    }
                    if (context != null) Box(Modifier.padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space1)) { context() }
                    StanceDivider()
                    Box(modifier = Modifier.weight(1f).fillMaxWidth()) { content() }
                    Box(modifier = Modifier.padding(StanceSpacing.space3).focusRequester(focus)) { composer() }
                }
            }
            if (side == StanceCopilotSide.Start) StanceDivider(vertical = true)
        }
    } else {
        // The composer sits at the bottom, so the sheet opens at its full height and never half way.
        StanceBottomSheet(
            onDismissRequest = onDismissRequest,
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            modifier = modifier,
            title = title,
        ) {
            if (context != null) context()
            Box(modifier = Modifier.weight(1f, fill = false).fillMaxWidth()) { content() }
            Box(modifier = Modifier.focusRequester(focus)) { composer() }
        }
    }
}
