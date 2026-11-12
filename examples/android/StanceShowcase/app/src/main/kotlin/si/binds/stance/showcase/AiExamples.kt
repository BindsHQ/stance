package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.ai.StanceAIGeneratedLabel
import com.bindshq.stance.components.ai.StanceAIGeneratedVariant
import com.bindshq.stance.components.ai.StanceAttachment
import com.bindshq.stance.components.ai.StanceAttachmentKind
import com.bindshq.stance.components.ai.StanceAttachmentTray
import com.bindshq.stance.components.ai.StanceBranchSwitcher
import com.bindshq.stance.components.ai.StanceCitationChip
import com.bindshq.stance.components.ai.StanceConfidenceBadge
import com.bindshq.stance.components.ai.StanceConfidenceLevel
import com.bindshq.stance.components.ai.StanceContextChips
import com.bindshq.stance.components.ai.StanceContextItem
import com.bindshq.stance.components.ai.StanceConversation
import com.bindshq.stance.components.ai.StanceConversationList
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
import com.bindshq.stance.components.ai.StanceMessageGroup
import com.bindshq.stance.components.ai.StanceMessageRole
import com.bindshq.stance.components.ai.StanceModel
import com.bindshq.stance.components.ai.StanceModelPicker
import com.bindshq.stance.components.ai.StancePromptComposer
import com.bindshq.stance.components.ai.StanceRating
import com.bindshq.stance.components.ai.StanceReasoningDisclosure
import com.bindshq.stance.components.ai.StanceReasoningStatus
import com.bindshq.stance.components.ai.StanceReportCategory
import com.bindshq.stance.components.ai.StanceReportDialog
import com.bindshq.stance.components.ai.StanceScrollToLatest
import com.bindshq.stance.components.ai.StanceSensitiveContentGate
import com.bindshq.stance.components.ai.StanceShimmerText
import com.bindshq.stance.components.ai.StanceSlashCommand
import com.bindshq.stance.components.ai.StanceSlashCommandMenu
import com.bindshq.stance.components.ai.StanceSource
import com.bindshq.stance.components.ai.StanceSourceList
import com.bindshq.stance.components.ai.StanceSourcePreview
import com.bindshq.stance.components.ai.StanceStarter
import com.bindshq.stance.components.ai.StanceStopButton
import com.bindshq.stance.components.ai.StanceStopButtonVariant
import com.bindshq.stance.components.ai.StanceStreamingSkeleton
import com.bindshq.stance.components.ai.StanceStreamingText
import com.bindshq.stance.components.ai.StanceThinkingIndicator
import com.bindshq.stance.components.ai.StanceThinkingVariant
import com.bindshq.stance.components.ai.StanceThread
import com.bindshq.stance.components.ai.StanceThreadEmptyState
import com.bindshq.stance.components.ai.StanceTokenBudgetMeter
import com.bindshq.stance.components.ai.StanceTokenBudgetVariant
import com.bindshq.stance.components.ai.StanceVoiceInputButton
import com.bindshq.stance.components.ai.StanceVoiceInputState
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing

// One compiled example per AI component. The showcase renders them and
// platforms/android/scripts/generate-components-json.mjs copies their source into components.json.
// Stance draws the conversation. The app owns the messages, the status and the transport.

val sampleSources = listOf(
    StanceSource("guide", "Deploying signatures", domain = "docs.binds.si", snippet = "Templates reach every mailbox within an hour of publishing."),
    StanceSource("policy", "Brand policy 2026", domain = "intranet.binds.si", snippet = "Every external email carries the legal footer."),
    StanceSource("audit", "Rollout audit, March", domain = "reports.binds.si", snippet = "48 of 50 users received the update on the first sync."),
    StanceSource("faq", "Signature FAQ", domain = "help.binds.si", snippet = "Mobile clients apply the template on next send."),
)

val sampleModels = listOf(
    StanceModel("swift", "Swift", "Quick answers for everyday questions", badges = listOf("Fast")),
    StanceModel("atlas", "Atlas", "Careful reasoning for long documents", badges = listOf("Reasoning", "Files")),
    StanceModel("legacy", "Legacy", "Retired next month", enabled = false),
)

@Composable
fun StanceThreadExample() {
    val messages = remember { listOf("How do I roll out a new signature?", "Publish the template, then assign it to a group.") }
    StanceThread(modifier = Modifier.height(StanceSizes.pickerMaxHeight / 2), label = "Signature rollout") {
        items(messages, key = { it }) { text ->
            val role = if (text.endsWith("?")) StanceMessageRole.User else StanceMessageRole.Assistant
            StanceMessage(role) { Text(text) }
        }
    }
}

@Composable
fun StanceMessageExample() {
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
        StanceMessage(StanceMessageRole.User, timestamp = "10:41") { Text("Who still has the old footer?") }
        StanceMessage(StanceMessageRole.Assistant, timestamp = "10:41", status = StanceGenerationStatus.Complete) {
            Text("Two people in Sales. Their mailboxes sync tonight.")
        }
    }
}

@Composable
fun StanceMessageGroupExample() {
    StanceMessageGroup(StanceMessageRole.Assistant, timestamp = "10:42") {
        StanceMessage(StanceMessageRole.Assistant, showHeader = false) { Text("I found two mailboxes on the old footer.") }
        StanceMessage(StanceMessageRole.Assistant, showHeader = false) { Text("Both sync tonight, so no action is needed.") }
    }
}

@Composable
fun StanceMessageActionsExample() {
    var rating by remember { mutableStateOf<StanceRating?>(null) }
    StanceMessageActions(onCopy = { println("Copied") }, onRetry = { println("Retry") }, onRate = { rating = it }, rating = rating)
}

@Composable
fun StanceBranchSwitcherExample() {
    var index by remember { mutableIntStateOf(1) }
    StanceBranchSwitcher(count = 3, index = index, onIndexChange = { index = it })
}

@Composable
fun StanceScrollToLatestExample() {
    StanceScrollToLatest(visible = true, onClick = { println("Scroll to latest") }, unreadCount = 2)
}

@Composable
fun StanceConversationListExample() {
    var selected by remember { mutableStateOf("rollout") }
    StanceConversationList(
        items = listOf(
            StanceConversation("rollout", "Signature rollout", updatedAt = "10:42", group = "Today"),
            StanceConversation("footer", "Legal footer wording", updatedAt = "Monday", group = "This week", pinned = true),
            StanceConversation("audit", "March audit summary", updatedAt = "Tuesday", group = "This week"),
        ),
        selectedId = selected,
        onSelect = { selected = it.id },
        onRename = { println("Rename ${it.title}") },
        onDelete = { println("Delete ${it.title}") },
        onPin = { item, pinned -> println("Pin ${item.title}: $pinned") },
        modifier = Modifier.height(StanceSizes.pickerMaxHeight / 2),
    )
}

@Composable
fun StanceThreadEmptyStateExample() {
    StanceThreadEmptyState(
        title = "How can I help?",
        description = "Ask about templates, rollouts and policies.",
        starters = listOf(
            StanceStarter("audit", "Summarise the last rollout", "Who received it and who did not", StanceIcons.BarChart),
            StanceStarter("footer", "Draft a legal footer", "Based on the brand policy", StanceIcons.FileText),
        ),
        onStarterSelect = { println("Starter ${it.id}") },
    )
}

@Composable
fun StancePromptComposerExample() {
    var draft by remember { mutableStateOf("") }
    var status by remember { mutableStateOf(StanceGenerationStatus.Idle) }
    StancePromptComposer(
        value = draft,
        onValueChange = { draft = it },
        onSubmit = { status = StanceGenerationStatus.Streaming },
        onStop = { status = StanceGenerationStatus.Stopped },
        status = status,
        leading = { StanceIconButton(StanceIcons.Paperclip, "Attach a file", onClick = { println("Attach") }) },
        footer = { StanceDisclaimerNote("Answers can be wrong. Check important facts.", icon = null) },
    )
}

@Composable
fun StanceAttachmentTrayExample() {
    StanceAttachmentTray(
        items = listOf(
            StanceAttachment("policy", "Brand policy.pdf", sizeLabel = "1.2 MB"),
            StanceAttachment("logo", "Logo.png", kind = StanceAttachmentKind.Image, progress = 0.4f),
            StanceAttachment("scan", "Scan.tiff", kind = StanceAttachmentKind.Image, error = "Too large"),
        ),
        onRemove = { println("Remove ${it.name}") },
    )
}

@Composable
fun StanceMentionPickerExample() {
    var open by remember { mutableStateOf(false) }
    Box {
        StanceButton("Mention", onClick = { open = true }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.AtSign)
        StanceMentionPicker(
            expanded = open,
            onDismissRequest = { open = false },
            items = listOf(
                StanceMentionItem("policy", "Brand policy.pdf", "Shared file", StanceIcons.FileText, group = "Files"),
                StanceMentionItem("ana", "Ana Novak", "Legal", StanceIcons.User, group = "People"),
            ),
            onSelect = { open = false },
        )
    }
}

@Composable
fun StanceSlashCommandMenuExample() {
    var open by remember { mutableStateOf(false) }
    Box {
        StanceButton("Commands", onClick = { open = true }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Command)
        StanceSlashCommandMenu(
            expanded = open,
            onDismissRequest = { open = false },
            commands = listOf(
                StanceSlashCommand("summarise", "summarise", "Shorten the attached document"),
                StanceSlashCommand("translate", "translate", "Translate the last answer"),
            ),
            onSelect = { open = false },
        )
    }
}

@Composable
fun StanceModelPickerExample() {
    var model by remember { mutableStateOf("swift") }
    StanceModelPicker(models = sampleModels, selectedId = model, onSelect = { model = it.id })
}

@Composable
fun StanceContextChipsExample() {
    var items by remember {
        mutableStateOf(
            listOf(
                StanceContextItem("policy", "Brand policy.pdf", StanceIcons.FileText, kind = "File"),
                StanceContextItem("page", "Rollout settings", StanceIcons.Globe, kind = "Page"),
            ),
        )
    }
    StanceContextChips(items = items, onRemove = { removed -> items = items - removed }, onAdd = { println("Add context") })
}

@Composable
fun StanceVoiceInputButtonExample() {
    var listening by remember { mutableStateOf(false) }
    StanceVoiceInputButton(
        state = if (listening) StanceVoiceInputState.Listening else StanceVoiceInputState.Idle,
        onClick = { listening = !listening },
        level = 0.6f,
    )
}

@Composable
fun StanceStopButtonExample() {
    Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3), verticalAlignment = Alignment.CenterVertically) {
        StanceStopButton(onStop = { println("Stopped") })
        StanceStopButton(onStop = { println("Stopped") }, variant = StanceStopButtonVariant.Labelled)
    }
}

@Composable
fun StanceTokenBudgetMeterExample() {
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        StanceTokenBudgetMeter(used = 42_000, limit = 100_000, variant = StanceTokenBudgetVariant.Bar)
        StanceTokenBudgetMeter(used = 91_000, limit = 100_000, variant = StanceTokenBudgetVariant.Bar)
    }
}

@Composable
fun StanceStreamingTextExample() {
    var streaming by remember { mutableStateOf(true) }
    StanceStreamingText(
        text = "Publish the template, then assign it to a group. Mailboxes pick it up within an hour.",
        streaming = streaming,
        onRevealEnd = { println("Reveal finished") },
    )
    StanceButton("Finish", onClick = { streaming = false }, variant = StanceButtonVariant.Ghost)
}

@Composable
fun StanceThinkingIndicatorExample() {
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        StanceThinkingIndicator(elapsedSeconds = 4)
        StanceThinkingIndicator(label = "Reading the policy", variant = StanceThinkingVariant.Shimmer)
    }
}

@Composable
fun StanceReasoningDisclosureExample() {
    StanceReasoningDisclosure(status = StanceReasoningStatus.Done, durationSeconds = 12, initiallyExpanded = true) {
        Text("The policy requires the footer on external mail only.")
        Text("Two Sales mailboxes last synced before the change.")
    }
}

@Composable
fun StanceShimmerTextExample() {
    StanceShimmerText("Searching the brand policy")
}

@Composable
fun StanceGenerationProgressExample() {
    StanceGenerationProgress(
        label = "Creating rollout report",
        progress = 0.42f,
        stage = "Rendering page 2 of 5",
        onCancel = { println("Cancelled") },
    )
}

@Composable
fun StanceStreamingSkeletonExample() {
    StanceStreamingSkeleton(lines = 3)
}

@Composable
fun StanceInterruptedStateExample() {
    StanceInterruptedState(
        reason = StanceInterruptedReason.Network,
        description = "The answer stopped part way. Your draft is safe.",
        onRetry = { println("Retry") },
        onContinue = { println("Continue") },
    )
}

@Composable
fun StanceCitationChipExample() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text("Templates reach every mailbox within an hour.")
        StanceCitationChip(index = 1, source = sampleSources[0], onOpen = { println("Open ${it.url}") })
    }
}

@Composable
fun StanceSourceListExample() {
    StanceSourceList(sources = sampleSources, max = 2, onSourceOpen = { println("Open ${it.title}") })
}

@Composable
fun StanceSourcePreviewExample() {
    StanceSourcePreview(source = sampleSources[0], onOpen = { println("Open source") })
}

@Composable
fun StanceConfidenceBadgeExample() {
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceConfidenceBadge(StanceConfidenceLevel.High, description = "Three sources agree")
        StanceConfidenceBadge(StanceConfidenceLevel.Low, description = "Based on one source")
    }
}

@Composable
fun StanceAIGeneratedLabelExample() {
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceAIGeneratedLabel(model = "Atlas")
        StanceAIGeneratedLabel(variant = StanceAIGeneratedVariant.Edited)
    }
}

@Composable
fun StanceDisclaimerNoteExample() {
    StanceDisclaimerNote("Answers can be wrong. Check important facts.")
}

@Composable
fun StanceFeedbackBarExample() {
    var rating by remember { mutableStateOf<StanceRating?>(null) }
    var submitted by remember { mutableStateOf(false) }
    StanceFeedbackBar(
        rating = rating,
        onRatingChange = { rating = it },
        reasons = listOf(StanceFeedbackReason("wrong", "Not accurate"), StanceFeedbackReason("long", "Too long")),
        onSubmit = { submitted = true },
        submitted = submitted,
    )
}

@Composable
fun StanceReportDialogExample() {
    var open by remember { mutableStateOf(false) }
    StanceButton("Report", onClick = { open = true }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Flag)
    if (open) {
        StanceReportDialog(
            onDismissRequest = { open = false },
            categories = listOf(
                StanceReportCategory("wrong", "Incorrect", "Facts or figures are wrong"),
                StanceReportCategory("harm", "Harmful", "Could hurt someone"),
            ),
            onSubmit = { open = false },
        )
    }
}

@Composable
fun StanceSensitiveContentGateExample() {
    StanceSensitiveContentGate {
        Text("A customer complaint with strong language.")
    }
}

/** The AI section of the components catalogue. */
val aiCatalogue: List<Pair<String, @Composable () -> Unit>> = listOf(
    "StanceThread" to { StanceThreadExample() },
    "StanceMessage" to { StanceMessageExample() },
    "StanceMessageGroup" to { StanceMessageGroupExample() },
    "StanceMessageActions" to { StanceMessageActionsExample() },
    "StanceBranchSwitcher" to { StanceBranchSwitcherExample() },
    "StanceScrollToLatest" to { StanceScrollToLatestExample() },
    "StanceConversationList" to { StanceConversationListExample() },
    "StanceThreadEmptyState" to { StanceThreadEmptyStateExample() },
    "StancePromptComposer" to { StancePromptComposerExample() },
    "StanceAttachmentTray" to { StanceAttachmentTrayExample() },
    "StanceMentionPicker" to { StanceMentionPickerExample() },
    "StanceSlashCommandMenu" to { StanceSlashCommandMenuExample() },
    "StanceModelPicker" to { StanceModelPickerExample() },
    "StanceContextChips" to { StanceContextChipsExample() },
    "StanceVoiceInputButton" to { StanceVoiceInputButtonExample() },
    "StanceStopButton" to { StanceStopButtonExample() },
    "StanceTokenBudgetMeter" to { StanceTokenBudgetMeterExample() },
    "StanceStreamingText" to { Column { StanceStreamingTextExample() } },
    "StanceThinkingIndicator" to { StanceThinkingIndicatorExample() },
    "StanceReasoningDisclosure" to { StanceReasoningDisclosureExample() },
    "StanceShimmerText" to { StanceShimmerTextExample() },
    "StanceGenerationProgress" to { StanceGenerationProgressExample() },
    "StanceStreamingSkeleton" to { StanceStreamingSkeletonExample() },
    "StanceInterruptedState" to { StanceInterruptedStateExample() },
    "StanceCitationChip" to { StanceCitationChipExample() },
    "StanceSourceList" to { StanceSourceListExample() },
    "StanceSourcePreview" to { StanceSourcePreviewExample() },
    "StanceConfidenceBadge" to { StanceConfidenceBadgeExample() },
    "StanceAIGeneratedLabel" to { StanceAIGeneratedLabelExample() },
    "StanceDisclaimerNote" to { StanceDisclaimerNoteExample() },
    "StanceFeedbackBar" to { StanceFeedbackBarExample() },
    "StanceReportDialog" to { Column { StanceReportDialogExample() } },
    "StanceSensitiveContentGate" to { StanceSensitiveContentGateExample() },
)
