@file:OptIn(ExperimentalLayoutApi::class)

package com.bindshq.stance.components.ai

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
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
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.feedback.StanceBottomSheet
import com.bindshq.stance.components.forms.StanceFilterChip
import com.bindshq.stance.components.forms.StanceRadioGroup
import com.bindshq.stance.components.forms.StanceRadioOption
import com.bindshq.stance.components.forms.StanceTextField
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.fadeEnter
import com.bindshq.stance.foundation.fadeExit
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * A source behind an answer.
 *
 * @param domain The site name shown beside the title, for example "docs.binds.si".
 * @param snippet The passage the answer drew on.
 * @param favicon Draws the site icon. A globe is shown when null.
 */
@Immutable
public data class StanceSource(
    val id: String,
    val title: String,
    val url: String? = null,
    val domain: String? = null,
    val snippet: String? = null,
    val favicon: (@Composable () -> Unit)? = null,
)

/** How much of a source a [StanceSourcePreview] shows. */
public enum class StanceSourcePreviewSize {
    /** Title and site on one row each, with a two line snippet. */
    Compact,

    /** The full snippet. */
    Regular,
}

/**
 * A card for one source: site, title, snippet and a link to open it.
 *
 * @param onOpen Shows the open link when set.
 */
@Composable
public fun StanceSourcePreview(
    source: StanceSource,
    modifier: Modifier = Modifier,
    onOpen: (() -> Unit)? = null,
    size: StanceSourcePreviewSize = StanceSourcePreviewSize.Regular,
    openLabel: String = stringResource(R.string.stance_ai_open_source),
) {
    val c = StanceTheme.colors
    StanceSurface(modifier = modifier.fillMaxWidth(), shape = StanceTheme.shapes.large, bordered = true) {
        Column(modifier = Modifier.padding(StanceSpacing.space3), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1)) {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), verticalAlignment = Alignment.CenterVertically) {
                SourceMark(source)
                if (source.domain != null) {
                    Text(source.domain, style = StanceTheme.typography.caption, color = c.fgMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            Text(
                source.title,
                style = StanceTheme.typography.label,
                color = c.fgDefault,
                maxLines = if (size == StanceSourcePreviewSize.Compact) 2 else Int.MAX_VALUE,
                overflow = TextOverflow.Ellipsis,
            )
            if (source.snippet != null) {
                Text(
                    source.snippet,
                    style = StanceTheme.typography.bodySmall,
                    color = c.fgMuted,
                    maxLines = if (size == StanceSourcePreviewSize.Compact) 2 else Int.MAX_VALUE,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (onOpen != null) {
                StanceButton(openLabel, onClick = onOpen, variant = StanceButtonVariant.Link, size = StanceButtonSize.Small, trailingIcon = StanceIcons.ExternalLink)
            }
        }
    }
}

@Composable
private fun SourceMark(source: StanceSource) {
    Box(modifier = Modifier.size(StanceSizes.iconSmall).clearAndSetSemantics { }, contentAlignment = Alignment.Center) {
        if (source.favicon != null) {
            source.favicon.invoke()
        } else {
            StanceIcon(StanceIcons.Globe, contentDescription = null, size = StanceSizes.iconSmall, tint = StanceTheme.colors.fgMuted)
        }
    }
}

/**
 * A numbered marker that links a claim to its source.
 *
 * A tap opens a bottom sheet with a [StanceSourcePreview], so the preview is reachable by
 * touch, keyboard and screen reader alike. The chip is a button named, for example,
 * "Source 2: Deployment guide". The touch target is at least 48dp.
 *
 * @param index The number shown, starting at 1.
 * @param onOpen Opens the source itself. Shown as a link in the preview.
 */
@Composable
public fun StanceCitationChip(
    index: Int,
    source: StanceSource,
    modifier: Modifier = Modifier,
    onOpen: ((StanceSource) -> Unit)? = null,
    contentDescription: String = stringResource(R.string.stance_ai_source_named, index, source.title),
    previewTitle: String = stringResource(R.string.stance_ai_source_number, index),
    openLabel: String = stringResource(R.string.stance_ai_open_source),
) {
    val c = StanceTheme.colors
    var previewing by rememberSaveable { mutableStateOf(false) }
    Box(
        modifier = modifier
            .minimumInteractiveComponentSize()
            .stanceFocusRing(StanceTheme.shapes.pill)
            .clip(StanceTheme.shapes.pill)
            .clickable(role = Role.Button) { previewing = true }
            .clearAndSetSemantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .defaultMinSize(minWidth = StanceSizes.iconMedium, minHeight = StanceSizes.iconMedium)
                .clip(StanceTheme.shapes.pill)
                .background(c.bgMuted)
                .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, StanceTheme.shapes.pill)
                .padding(horizontal = StanceSpacing.space15),
            contentAlignment = Alignment.Center,
        ) {
            Text(index.toString(), style = StanceTheme.typography.labelSmall, color = c.fgDefault)
        }
    }
    if (previewing) {
        StanceBottomSheet(onDismissRequest = { previewing = false }, title = previewTitle) {
            StanceSourcePreview(
                source = source,
                onOpen = onOpen?.let { open -> { previewing = false; open(source) } },
                openLabel = openLabel,
            )
        }
    }
}

/** How a [StanceSourceList] lays out its sources. */
public enum class StanceSourceListVariant {
    /** A compact row of site chips that expands to the full list. */
    Inline,

    /** Every source as a card. */
    List,
}

/**
 * The sources behind an answer, with hoisted [expanded] state.
 *
 * The inline variant shows up to [max] sources as chips and a button that expands to the
 * full list. The list variant shows up to [max] cards until expanded.
 *
 * @param onSourceOpen Opens a source. Rows are plain text when null.
 */
@Composable
public fun StanceSourceList(
    sources: List<StanceSource>,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    variant: StanceSourceListVariant = StanceSourceListVariant.Inline,
    max: Int = 3,
    onSourceOpen: ((StanceSource) -> Unit)? = null,
    title: String = stringResource(R.string.stance_ai_sources),
    showAllLabel: String = pluralStringResource(R.plurals.stance_ai_show_all_sources, sources.size, sources.size),
    showLessLabel: String = stringResource(R.string.stance_ai_show_fewer_sources),
    openLabel: String = stringResource(R.string.stance_ai_open_source),
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val limit = max.coerceAtLeast(1)
    val overflow = sources.size > limit
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        Text(title, style = StanceTheme.typography.labelSmall, color = c.fgMuted, modifier = Modifier.semantics { heading() })
        val showCards = variant == StanceSourceListVariant.List || expanded
        AnimatedContent(
            targetState = showCards,
            transitionSpec = { motion.fadeEnter() togetherWith motion.fadeExit() },
            label = "stance-source-list",
        ) { cards ->
            if (cards) {
                val shown = if (expanded || !overflow) sources else sources.take(limit)
                Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                    shown.forEach { source ->
                        StanceSourcePreview(
                            source = source,
                            onOpen = onSourceOpen?.let { open -> { open(source) } },
                            size = StanceSourcePreviewSize.Compact,
                            openLabel = openLabel,
                        )
                    }
                }
            } else {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                ) {
                    sources.take(limit).forEach { source -> SourceChip(source, onSourceOpen) }
                }
            }
        }
        if (overflow || (variant == StanceSourceListVariant.Inline && sources.isNotEmpty())) {
            StanceButton(
                text = if (expanded) showLessLabel else showAllLabel,
                onClick = { onExpandedChange(!expanded) },
                variant = StanceButtonVariant.Ghost,
                size = StanceButtonSize.Small,
                trailingIcon = if (expanded) StanceIcons.ChevronUp else StanceIcons.ChevronDown,
            )
        }
    }
}

/** [StanceSourceList] that keeps its own expanded state. */
@Composable
public fun StanceSourceList(
    sources: List<StanceSource>,
    modifier: Modifier = Modifier,
    variant: StanceSourceListVariant = StanceSourceListVariant.Inline,
    max: Int = 3,
    onSourceOpen: ((StanceSource) -> Unit)? = null,
    initiallyExpanded: Boolean = false,
) {
    var expanded by rememberSaveable { mutableStateOf(initiallyExpanded) }
    StanceSourceList(sources, expanded, { expanded = it }, modifier, variant, max, onSourceOpen)
}

@Composable
private fun SourceChip(source: StanceSource, onOpen: ((StanceSource) -> Unit)?) {
    val c = StanceTheme.colors
    val shape = StanceTheme.shapes.pill
    Row(
        modifier = Modifier
            .then(if (onOpen != null) Modifier.minimumInteractiveComponentSize().stanceFocusRing(shape) else Modifier)
            .clip(shape)
            .then(if (onOpen != null) Modifier.clickable(role = Role.Button) { onOpen(source) } else Modifier)
            .background(c.bgMuted)
            .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, shape)
            .padding(horizontal = StanceSpacing.space25, vertical = StanceSpacing.space15)
            .semantics(mergeDescendants = true) { contentDescription = source.title },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space15),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SourceMark(source)
        Text(
            source.domain ?: source.title,
            style = StanceTheme.typography.labelSmall,
            color = c.fgDefault,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.clearAndSetSemantics { },
        )
    }
}

/** How sure the system is. */
public enum class StanceConfidenceLevel { High, Medium, Low, Unknown }

/**
 * States how sure the system is, in words. The level is carried by the label and a distinct
 * icon for each level, never by colour: the badge uses the ink scale only.
 *
 * @param description A short explanation shown after the label.
 */
@Composable
public fun StanceConfidenceBadge(
    level: StanceConfidenceLevel,
    modifier: Modifier = Modifier,
    label: String = stringResource(
        when (level) {
            StanceConfidenceLevel.High -> R.string.stance_ai_confidence_high
            StanceConfidenceLevel.Medium -> R.string.stance_ai_confidence_medium
            StanceConfidenceLevel.Low -> R.string.stance_ai_confidence_low
            StanceConfidenceLevel.Unknown -> R.string.stance_ai_confidence_unknown
        },
    ),
    description: String? = null,
    showIcon: Boolean = true,
) {
    val c = StanceTheme.colors
    val icon = when (level) {
        StanceConfidenceLevel.High -> StanceIcons.CheckCircle
        StanceConfidenceLevel.Medium -> StanceIcons.Contrast
        StanceConfidenceLevel.Low -> StanceIcons.Circle
        StanceConfidenceLevel.Unknown -> StanceIcons.HelpCircle
    }
    Row(
        modifier = modifier.semantics(mergeDescendants = true) { },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .clip(StanceTheme.shapes.pill)
                .background(c.bgMuted)
                .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, StanceTheme.shapes.pill)
                .padding(horizontal = StanceSpacing.space2, vertical = StanceSpacing.space05),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (showIcon) StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgDefault)
            Text(label, style = StanceTheme.typography.labelSmall, color = c.fgDefault)
        }
        if (description != null) Text(description, style = StanceTheme.typography.caption, color = c.fgMuted)
    }
}

/** How AI took part in a piece of content. */
public enum class StanceAIGeneratedVariant {
    /** Written by AI. */
    Generated,

    /** Written by a person with help from AI. */
    Assisted,

    /** Written by a person and edited by AI. */
    Edited,
}

/** Visual size of a [StanceAIGeneratedLabel]. */
public enum class StanceAIGeneratedLabelSize { Small, Medium }

/**
 * Marks content as written or edited by AI, with the sparkle icon and plain words.
 *
 * @param model The model name, shown after the label when set.
 */
@Composable
public fun StanceAIGeneratedLabel(
    modifier: Modifier = Modifier,
    variant: StanceAIGeneratedVariant = StanceAIGeneratedVariant.Generated,
    label: String = stringResource(
        when (variant) {
            StanceAIGeneratedVariant.Generated -> R.string.stance_ai_label_generated
            StanceAIGeneratedVariant.Assisted -> R.string.stance_ai_label_assisted
            StanceAIGeneratedVariant.Edited -> R.string.stance_ai_label_edited
        },
    ),
    size: StanceAIGeneratedLabelSize = StanceAIGeneratedLabelSize.Small,
    model: String? = null,
) {
    val c = StanceTheme.colors
    val small = size == StanceAIGeneratedLabelSize.Small
    val style = if (small) StanceTheme.typography.caption else StanceTheme.typography.label
    Row(
        modifier = modifier.semantics(mergeDescendants = true) { },
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        StanceIcon(StanceIcons.Sparkle, contentDescription = null, size = if (small) StanceSizes.iconSmall else StanceSizes.iconMedium, tint = c.fgMuted)
        Text(label, style = style, color = c.fgMuted)
        if (model != null) Text(model, style = style, color = c.fgSubtle)
    }
}

/**
 * A quiet note under the composer or a response, such as a reminder to check important facts.
 *
 * @param icon Decorative icon before the text, or null for none.
 * @param action An optional link or button after the text.
 */
@Composable
public fun StanceDisclaimerNote(
    text: String,
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = StanceIcons.Info,
    action: (@Composable () -> Unit)? = null,
) {
    val c = StanceTheme.colors
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgSubtle)
        Text(text, style = StanceTheme.typography.caption, color = c.fgMuted, modifier = Modifier.weight(1f, fill = false))
        action?.invoke()
    }
}

/** One reason a person can give with a rating. */
@Immutable
public data class StanceFeedbackReason(val id: String, val label: String)

/** What a person submitted from a [StanceFeedbackBar]. */
@Immutable
public data class StanceFeedback(val rating: StanceRating, val reasonIds: List<String>, val comment: String)

/** The words of a [StanceFeedbackBar]. Build with [StanceFeedbackBarDefaults.labels]. */
@Immutable
public data class StanceFeedbackLabels(
    val prompt: String,
    val goodResponse: String,
    val badResponse: String,
    val reasons: String,
    val comment: String,
    val submit: String,
    val thanks: String,
)

/** Defaults for [StanceFeedbackBar]. */
public object StanceFeedbackBarDefaults {
    /** The built-in words, from string resources. Override any of them. */
    @Composable
    public fun labels(
        prompt: String = stringResource(R.string.stance_ai_feedback_prompt),
        goodResponse: String = stringResource(R.string.stance_ai_good_response),
        badResponse: String = stringResource(R.string.stance_ai_bad_response),
        reasons: String = stringResource(R.string.stance_ai_feedback_reasons),
        comment: String = stringResource(R.string.stance_ai_feedback_comment),
        submit: String = stringResource(R.string.stance_ai_feedback_submit),
        thanks: String = stringResource(R.string.stance_ai_feedback_thanks),
    ): StanceFeedbackLabels = StanceFeedbackLabels(prompt, goodResponse, badResponse, reasons, comment, submit, thanks)
}

/**
 * Thumbs up or down, then optional reasons and a comment, then a thank you.
 *
 * The rating and [submitted] are hoisted. The draft reasons and comment are kept inside until
 * [onSubmit] hands them over. The rating buttons are toggles, the reasons are a labelled
 * group, and the thank you is announced politely. A rating gives haptic feedback.
 *
 * @param rating The current rating, or null for none.
 * @param onRatingChange Called with the new rating, or null when the active one is tapped again.
 * @param reasons Reasons to offer once a rating is given.
 * @param onSubmit Receives the details. With no [reasons] and no comment, it is called as
 * soon as a rating is given. When null, a rating alone is the whole flow.
 * @param submitted Set to true after [onSubmit] to show the thank you.
 */
@Composable
public fun StanceFeedbackBar(
    rating: StanceRating?,
    onRatingChange: (StanceRating?) -> Unit,
    modifier: Modifier = Modifier,
    reasons: List<StanceFeedbackReason> = emptyList(),
    onSubmit: ((StanceFeedback) -> Unit)? = null,
    allowComment: Boolean = true,
    submitted: Boolean = false,
    labels: StanceFeedbackLabels = StanceFeedbackBarDefaults.labels(),
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val haptics = LocalHapticFeedback.current
    var selectedReasons by rememberSaveable { mutableStateOf(emptyList<String>()) }
    var comment by rememberSaveable { mutableStateOf("") }
    val hasDetail = reasons.isNotEmpty() || allowComment
    val detail = rating != null && onSubmit != null && !submitted && hasDetail
    val rate = { value: StanceRating, on: Boolean ->
        haptics.performHapticFeedback(if (on) HapticFeedbackType.ToggleOn else HapticFeedbackType.ToggleOff)
        onRatingChange(if (on) value else null)
        // With nothing more to ask, the rating is the whole submission.
        if (on && !hasDetail && onSubmit != null) onSubmit(StanceFeedback(value, emptyList(), ""))
    }

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        if (submitted) {
            Row(
                modifier = Modifier.heightIn(min = StanceSizes.touchTarget).semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                StanceIcon(StanceIcons.Check, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
                Text(labels.thanks, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1), verticalAlignment = Alignment.CenterVertically) {
                Text(labels.prompt, style = StanceTheme.typography.bodySmall, color = c.fgMuted, modifier = Modifier.padding(end = StanceSpacing.space1))
                AiIconToggle(StanceIcons.ThumbsUp, labels.goodResponse, checked = rating == StanceRating.Up, onCheckedChange = { rate(StanceRating.Up, it) })
                AiIconToggle(StanceIcons.ThumbsDown, labels.badResponse, checked = rating == StanceRating.Down, onCheckedChange = { rate(StanceRating.Down, it) })
            }
        }
        AnimatedVisibility(visible = detail, enter = motion.fadeEnter(), exit = motion.fadeExit()) {
            Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
                if (reasons.isNotEmpty()) {
                    Column(
                        modifier = Modifier.semantics { contentDescription = labels.reasons },
                        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                    ) {
                        Text(labels.reasons, style = StanceTheme.typography.label, color = c.fgDefault, modifier = Modifier.clearAndSetSemantics { })
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                            reasons.forEach { reason ->
                                val selected = reason.id in selectedReasons
                                StanceFilterChip(
                                    label = reason.label,
                                    selected = selected,
                                    onClick = { selectedReasons = if (selected) selectedReasons - reason.id else selectedReasons + reason.id },
                                )
                            }
                        }
                    }
                }
                if (allowComment) {
                    StanceTextField(value = comment, onValueChange = { comment = it }, label = labels.comment, singleLine = false, minLines = 2)
                }
                StanceButton(
                    labels.submit,
                    onClick = {
                        val given = rating
                        if (given != null && onSubmit != null) onSubmit(StanceFeedback(given, selectedReasons, comment.trim()))
                    },
                    variant = StanceButtonVariant.Secondary,
                    size = StanceButtonSize.Small,
                )
            }
        }
    }
}

/** A kind of problem a person can report. */
@Immutable
public data class StanceReportCategory(val id: String, val label: String, val description: String? = null)

/** What a person submitted from a [StanceReportDialog]. */
@Immutable
public data class StanceReport(val categoryId: String, val details: String)

/**
 * A bottom sheet to report a response, with a category and details.
 *
 * Compose it while it should be open, as with [StanceBottomSheet]. It dismisses on drag,
 * back and scrim taps. Submit is enabled once a category is chosen.
 *
 * @param submitting Set while the report is being sent: the sheet stays open, the form is
 * disabled, the submit button shows progress and dismissal is ignored. Remove the dialog when done.
 */
@Composable
public fun StanceReportDialog(
    onDismissRequest: () -> Unit,
    categories: List<StanceReportCategory>,
    onSubmit: (StanceReport) -> Unit,
    modifier: Modifier = Modifier,
    submitting: Boolean = false,
    title: String = stringResource(R.string.stance_ai_report_title),
    categoryLabel: String = stringResource(R.string.stance_ai_report_category),
    detailsLabel: String = stringResource(R.string.stance_ai_report_details),
    submitLabel: String = stringResource(R.string.stance_ai_report_submit),
    cancelLabel: String = stringResource(R.string.stance_cancel),
) {
    var category by rememberSaveable { mutableStateOf<String?>(null) }
    var details by rememberSaveable { mutableStateOf("") }
    val options = remember(categories) { categories.map { StanceRadioOption(it.id, it.label, it.description) } }
    StanceBottomSheet(onDismissRequest = { if (!submitting) onDismissRequest() }, modifier = modifier, title = title) {
        StanceRadioGroup(label = categoryLabel, options = options, selected = category, onSelect = { category = it }, enabled = !submitting)
        StanceTextField(value = details, onValueChange = { details = it }, label = detailsLabel, singleLine = false, minLines = 3, enabled = !submitting)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2, Alignment.End),
        ) {
            StanceButton(cancelLabel, onClick = onDismissRequest, variant = StanceButtonVariant.Ghost, enabled = !submitting)
            StanceButton(
                submitLabel,
                onClick = { category?.let { onSubmit(StanceReport(it, details.trim())) } },
                enabled = category != null,
                loading = submitting,
            )
        }
    }
}

/**
 * Hides content behind a notice until the reader chooses to see it, with hoisted [revealed] state.
 *
 * Hidden content is not composed, so it is absent from the accessibility tree. On reveal,
 * focus moves to the content.
 *
 * @param hideLabel Label of the button that hides the content again, or null for no button.
 */
@Composable
public fun StanceSensitiveContentGate(
    revealed: Boolean,
    onRevealedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    title: String = stringResource(R.string.stance_ai_sensitive_title),
    description: String? = stringResource(R.string.stance_ai_sensitive_description),
    revealLabel: String = stringResource(R.string.stance_ai_sensitive_show),
    hideLabel: String? = stringResource(R.string.stance_ai_sensitive_hide),
    content: @Composable () -> Unit,
) {
    val c = StanceTheme.colors
    val motion = StanceTheme.motion
    val focus = remember { FocusRequester() }
    var wasRevealed by remember { mutableStateOf(revealed) }
    LaunchedEffect(revealed) {
        if (revealed && !wasRevealed) runCatching { focus.requestFocus() }
        wasRevealed = revealed
    }
    AnimatedContent(
        targetState = revealed,
        modifier = modifier,
        transitionSpec = { motion.fadeEnter() togetherWith motion.fadeExit() },
        label = "stance-sensitive-gate",
    ) { shown ->
        if (shown) {
            Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                Box(modifier = Modifier.focusRequester(focus).focusable()) { content() }
                if (hideLabel != null) {
                    StanceButton(hideLabel, onClick = { onRevealedChange(false) }, variant = StanceButtonVariant.Ghost, size = StanceButtonSize.Small, leadingIcon = StanceIcons.EyeOff)
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(StanceTheme.shapes.large)
                    .background(c.bgMuted)
                    .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, StanceTheme.shapes.large)
                    .padding(StanceSpacing.space4),
                verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            ) {
                Row(
                    modifier = Modifier.semantics(mergeDescendants = true) { },
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    verticalAlignment = Alignment.Top,
                ) {
                    StanceIcon(StanceIcons.EyeOff, contentDescription = null, tint = c.fgMuted)
                    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space05)) {
                        Text(title, style = StanceTheme.typography.label, color = c.fgDefault)
                        if (description != null) Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
                    }
                }
                StanceButton(revealLabel, onClick = { onRevealedChange(true) }, variant = StanceButtonVariant.Outline, size = StanceButtonSize.Small, leadingIcon = StanceIcons.Eye)
            }
        }
    }
}

/** [StanceSensitiveContentGate] that keeps its own revealed state. */
@Composable
public fun StanceSensitiveContentGate(
    modifier: Modifier = Modifier,
    initiallyRevealed: Boolean = false,
    title: String = stringResource(R.string.stance_ai_sensitive_title),
    description: String? = stringResource(R.string.stance_ai_sensitive_description),
    content: @Composable () -> Unit,
) {
    var revealed by rememberSaveable { mutableStateOf(initiallyRevealed) }
    StanceSensitiveContentGate(revealed, { revealed = it }, modifier, title, description, content = content)
}
