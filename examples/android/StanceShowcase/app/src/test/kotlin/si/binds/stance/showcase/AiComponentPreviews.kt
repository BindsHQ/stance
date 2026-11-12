package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.ai.StanceAIGeneratedLabel
import com.bindshq.stance.components.ai.StanceAIGeneratedVariant
import com.bindshq.stance.components.ai.StanceCitationChip
import com.bindshq.stance.components.ai.StanceConfidenceBadge
import com.bindshq.stance.components.ai.StanceConfidenceLevel
import com.bindshq.stance.components.ai.StanceContextChips
import com.bindshq.stance.components.ai.StanceContextItem
import com.bindshq.stance.components.ai.StanceDisclaimerNote
import com.bindshq.stance.components.ai.StanceFeedbackBar
import com.bindshq.stance.components.ai.StanceFeedbackReason
import com.bindshq.stance.components.ai.StanceGenerationProgress
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceInterruptedReason
import com.bindshq.stance.components.ai.StanceInterruptedState
import com.bindshq.stance.components.ai.StanceMentionItem
import com.bindshq.stance.components.ai.StanceMentionPicker
import com.bindshq.stance.components.ai.StanceMessage
import com.bindshq.stance.components.ai.StanceMessageActions
import com.bindshq.stance.components.ai.StanceMessageRole
import com.bindshq.stance.components.ai.StancePromptComposer
import com.bindshq.stance.components.ai.StanceRating
import com.bindshq.stance.components.ai.StanceReasoningDisclosure
import com.bindshq.stance.components.ai.StanceReasoningStatus
import com.bindshq.stance.components.ai.StanceReportCategory
import com.bindshq.stance.components.ai.StanceReportDialog
import com.bindshq.stance.components.ai.StanceSensitiveContentGate
import com.bindshq.stance.components.ai.StanceSlashCommand
import com.bindshq.stance.components.ai.StanceSlashCommandMenu
import com.bindshq.stance.components.ai.StanceSourceList
import com.bindshq.stance.components.ai.StanceSourceListVariant
import com.bindshq.stance.components.ai.StanceSourcePreview
import com.bindshq.stance.components.ai.StanceStreamCadence
import com.bindshq.stance.components.ai.StanceStreamingSkeleton
import com.bindshq.stance.components.ai.StanceStreamingSkeletonVariant
import com.bindshq.stance.components.ai.StanceStreamingText
import com.bindshq.stance.components.ai.StanceThinkingIndicator
import com.bindshq.stance.components.ai.StanceThinkingVariant
import com.bindshq.stance.components.ai.StanceThread
import com.bindshq.stance.components.ai.StanceTokenBudgetMeter
import com.bindshq.stance.components.ai.StanceTokenBudgetVariant
import com.bindshq.stance.components.ai.StanceVoiceInputButton
import com.bindshq.stance.components.ai.StanceVoiceInputState
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSpacing

private val gap = Arrangement.spacedBy(StanceSpacing.space3)
private val wideGap = Arrangement.spacedBy(StanceSpacing.space4)

private val threadMessages = listOf(
    StanceMessageRole.User to "Who still has the old legal footer?",
    StanceMessageRole.Assistant to "Two people in Sales. Their mailboxes sync tonight.",
    StanceMessageRole.User to "Can I roll out the new footer today?",
    StanceMessageRole.Assistant to "Yes. Publish the template, then assign it to the Sales group.",
)

@androidx.compose.runtime.Composable
private fun AnchoredAtBottom(content: @androidx.compose.runtime.Composable () -> Unit) {
    Box(Modifier.fillMaxSize().padding(StanceSpacing.space4), contentAlignment = Alignment.BottomStart) {
        Box(Modifier.fillMaxWidth()) { content() }
    }
}

/** Documentation images of the AI components, keyed by their name in components.json. */
val aiComponentPreviews: Map<String, ComponentPreview> = mapOf(
    "StanceThread" to ComponentPreview {
        StanceThread(modifier = Modifier.height(320.dp), label = "Signature rollout") {
            items(threadMessages, key = { it.second }) { (role, text) -> StanceMessage(role, timestamp = "10:41") { Text(text) } }
        }
    },
    "StanceMessage" to ComponentPreview {
        Column(verticalArrangement = wideGap) {
            StanceMessage(StanceMessageRole.User, timestamp = "10:41") { Text("Who still has the old footer?") }
            StanceMessage(StanceMessageRole.Assistant, timestamp = "10:41") { Text("Two people in Sales. Their mailboxes sync tonight.") }
            StanceMessage(StanceMessageRole.System) { Text("Ana joined the conversation") }
        }
    },
    "StanceMessageGroup" to ComponentPreview { StanceMessageGroupExample() },
    "StanceMessageActions" to ComponentPreview {
        StanceMessageActions(onCopy = {}, onRetry = {}, onEdit = {}, onRate = {}, rating = StanceRating.Up)
    },
    "StanceBranchSwitcher" to ComponentPreview { StanceBranchSwitcherExample() },
    "StanceScrollToLatest" to ComponentPreview { StanceScrollToLatestExample() },
    "StanceConversationList" to ComponentPreview { StanceConversationListExample() },
    "StanceThreadEmptyState" to ComponentPreview { StanceThreadEmptyStateExample() },
    "StancePromptComposer" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StancePromptComposer(
                value = "", onValueChange = {}, onSubmit = {},
                leading = { StanceIconButton(StanceIcons.Paperclip, "Attach a file", onClick = {}) },
            )
            StancePromptComposer(
                value = "Can I roll out the new footer today?", onValueChange = {}, onSubmit = {}, onStop = {},
                status = StanceGenerationStatus.Streaming,
                header = { StanceContextChips(listOf(StanceContextItem("page", "Rollout settings", StanceIcons.Globe)), onRemove = {}) },
                leading = { StanceIconButton(StanceIcons.Paperclip, "Attach a file", onClick = {}) },
                footer = { StanceTokenBudgetMeter(used = 2_400, limit = 8_000, variant = StanceTokenBudgetVariant.Bar) },
            )
        }
    },
    "StanceAttachmentTray" to ComponentPreview { StanceAttachmentTrayExample() },
    "StanceMentionPicker" to ComponentPreview(frame = PreviewFrame.Overlay, height = 360) {
        AnchoredAtBottom {
            StancePromptComposer(value = "Compare with @", onValueChange = {}, onSubmit = {})
            StanceMentionPicker(
                expanded = true,
                onDismissRequest = {},
                items = listOf(
                    StanceMentionItem("policy", "Brand policy.pdf", "Shared file", StanceIcons.FileText, group = "Files"),
                    StanceMentionItem("audit", "Rollout audit.xlsx", "Shared file", StanceIcons.FileText, group = "Files"),
                    StanceMentionItem("ana", "Ana Novak", "Legal", StanceIcons.User, group = "People"),
                ),
                onSelect = {},
            )
        }
    },
    "StanceSlashCommandMenu" to ComponentPreview(frame = PreviewFrame.Overlay, height = 320) {
        AnchoredAtBottom {
            StancePromptComposer(value = "/", onValueChange = {}, onSubmit = {})
            StanceSlashCommandMenu(
                expanded = true,
                onDismissRequest = {},
                commands = listOf(
                    StanceSlashCommand("summarise", "summarise", "Shorten the attached document"),
                    StanceSlashCommand("translate", "translate", "Translate the last answer"),
                    StanceSlashCommand("draft", "draft", "Start an email from a template"),
                ),
                onSelect = {},
            )
        }
    },
    "StanceModelPicker" to ComponentPreview(
        frame = PreviewFrame.Overlay,
        prepare = { rule -> rule.onNodeWithContentDescription("Model: Swift").performClick() },
    ) { Box(Modifier.padding(StanceSpacing.space4)) { StanceModelPickerExample() } },
    "StanceContextChips" to ComponentPreview { StanceContextChipsExample() },
    "StanceVoiceInputButton" to ComponentPreview {
        androidx.compose.foundation.layout.Row(horizontalArrangement = gap, verticalAlignment = Alignment.CenterVertically) {
            StanceVoiceInputButton(StanceVoiceInputState.Idle, onClick = {})
            StanceVoiceInputButton(StanceVoiceInputState.Listening, onClick = {}, level = 0.7f)
            StanceVoiceInputButton(StanceVoiceInputState.Processing, onClick = {})
            StanceVoiceInputButton(StanceVoiceInputState.Unavailable, onClick = {})
        }
    },
    "StanceStopButton" to ComponentPreview { StanceStopButtonExample() },
    "StanceTokenBudgetMeter" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceTokenBudgetMeter(used = 42_000, limit = 100_000, variant = StanceTokenBudgetVariant.Bar)
            StanceTokenBudgetMeter(used = 91_000, limit = 100_000, variant = StanceTokenBudgetVariant.Bar)
            StanceTokenBudgetMeter(used = 100_000, limit = 100_000, variant = StanceTokenBudgetVariant.Text)
            androidx.compose.foundation.layout.Row(horizontalArrangement = gap) {
                StanceTokenBudgetMeter(used = 42_000, limit = 100_000)
                StanceTokenBudgetMeter(used = 91_000, limit = 100_000)
            }
        }
    },
    "StanceStreamingText" to ComponentPreview {
        // Instant cadence shows the text so far with the caret at the reading position.
        StanceStreamingText("Publish the template, then assign it to the Sales group. Mailboxes pick it", streaming = true, cadence = StanceStreamCadence.Instant)
    },
    "StanceThinkingIndicator" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceThinkingIndicator(elapsedSeconds = 4)
            StanceThinkingIndicator(label = "Checking the audit", variant = StanceThinkingVariant.Pulse)
            StanceThinkingIndicator(label = "Reading the policy", variant = StanceThinkingVariant.Shimmer)
        }
    },
    "StanceReasoningDisclosure" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceReasoningDisclosureExample()
            StanceReasoningDisclosure(StanceReasoningStatus.Done, expanded = false, onExpandedChange = {}, durationSeconds = 4) {}
        }
    },
    "StanceShimmerText" to ComponentPreview { StanceShimmerTextExample() },
    "StanceGenerationProgress" to ComponentPreview {
        Column(verticalArrangement = wideGap) {
            StanceGenerationProgressExample()
            StanceGenerationProgress("Creating cover image", stage = "Starting")
        }
    },
    "StanceStreamingSkeleton" to ComponentPreview {
        Column(verticalArrangement = wideGap) {
            StanceStreamingSkeleton()
            StanceStreamingSkeleton(lines = 2, variant = StanceStreamingSkeletonVariant.Card)
        }
    },
    "StanceInterruptedState" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceInterruptedState(StanceInterruptedReason.Stopped, onContinue = {}, onRetry = {})
            StanceInterruptedStateExample()
        }
    },
    "StanceCitationChip" to ComponentPreview(
        frame = PreviewFrame.Overlay,
        height = 480,
        prepare = { rule -> rule.onNodeWithContentDescription("Source 1: Deploying signatures").performClick() },
    ) { Box(Modifier.padding(StanceSpacing.space4)) { StanceCitationChipExample() } },
    "StanceSourceList" to ComponentPreview {
        Column(verticalArrangement = wideGap) {
            StanceSourceList(sampleSources, max = 2)
            StanceSourceList(sampleSources.take(2), variant = StanceSourceListVariant.List)
        }
    },
    "StanceSourcePreview" to ComponentPreview { StanceSourcePreview(sampleSources[0], onOpen = {}) },
    "StanceConfidenceBadge" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            StanceConfidenceBadge(StanceConfidenceLevel.High, description = "Three sources agree")
            StanceConfidenceBadge(StanceConfidenceLevel.Medium)
            StanceConfidenceBadge(StanceConfidenceLevel.Low, description = "Based on one source")
            StanceConfidenceBadge(StanceConfidenceLevel.Unknown)
        }
    },
    "StanceAIGeneratedLabel" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            StanceAIGeneratedLabel(model = "Atlas")
            StanceAIGeneratedLabel(variant = StanceAIGeneratedVariant.Assisted)
            StanceAIGeneratedLabel(variant = StanceAIGeneratedVariant.Edited)
        }
    },
    "StanceDisclaimerNote" to ComponentPreview { StanceDisclaimerNoteExample() },
    "StanceFeedbackBar" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceFeedbackBar(
                rating = StanceRating.Down, onRatingChange = {},
                reasons = listOf(StanceFeedbackReason("wrong", "Not accurate"), StanceFeedbackReason("long", "Too long")),
                onSubmit = {},
            )
            StanceFeedbackBar(rating = StanceRating.Up, onRatingChange = {}, submitted = true)
        }
    },
    "StanceReportDialog" to ComponentPreview(frame = PreviewFrame.Overlay, height = 640) {
        StanceReportDialog(
            onDismissRequest = {},
            categories = listOf(
                StanceReportCategory("wrong", "Incorrect", "Facts or figures are wrong"),
                StanceReportCategory("harm", "Harmful", "Could hurt someone"),
            ),
            onSubmit = {},
        )
    },
    "StanceSensitiveContentGate" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceSensitiveContentGateExample()
            StanceSensitiveContentGate(initiallyRevealed = true) { Text("A customer complaint with strong language.") }
        }
    },
)
