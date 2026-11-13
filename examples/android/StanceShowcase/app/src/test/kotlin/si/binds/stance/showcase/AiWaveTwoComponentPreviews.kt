package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.ai.StanceAgentStatus
import com.bindshq.stance.components.ai.StanceAgentStatusPill
import com.bindshq.stance.components.ai.StanceAgentStatusPillSize
import com.bindshq.stance.components.ai.StanceApprovalPrompt
import com.bindshq.stance.components.ai.StanceArtifactPanel
import com.bindshq.stance.components.ai.StanceArtifactVersion
import com.bindshq.stance.components.ai.StanceAttachmentKind
import com.bindshq.stance.components.ai.StanceArtifactView
import com.bindshq.stance.components.ai.StanceAskBar
import com.bindshq.stance.components.ai.StanceCanvasSplitView
import com.bindshq.stance.components.ai.StanceCodeSuggestion
import com.bindshq.stance.components.ai.StanceContextChips
import com.bindshq.stance.components.ai.StanceContextItem
import com.bindshq.stance.components.ai.StanceCopilotPanel
import com.bindshq.stance.components.ai.StanceDiffDecision
import com.bindshq.stance.components.ai.StanceDiffReview
import com.bindshq.stance.components.ai.StanceDiffView
import com.bindshq.stance.components.ai.StanceFilePreviewCard
import com.bindshq.stance.components.ai.StanceGeneratedChart
import com.bindshq.stance.components.ai.StanceGeneratedImage
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceImageVariation
import com.bindshq.stance.components.ai.StanceInlineSuggestion
import com.bindshq.stance.components.ai.StanceMarkdownRenderer
import com.bindshq.stance.components.ai.StanceMessage
import com.bindshq.stance.components.ai.StanceMessageRole
import com.bindshq.stance.components.ai.StancePermission
import com.bindshq.stance.components.ai.StancePermissionSheet
import com.bindshq.stance.components.ai.StancePlanChecklist
import com.bindshq.stance.components.ai.StancePlanItem
import com.bindshq.stance.components.ai.StancePromptComposer
import com.bindshq.stance.components.ai.StanceRewriteAction
import com.bindshq.stance.components.ai.StanceRewriteMenu
import com.bindshq.stance.components.ai.StanceRewritePreview
import com.bindshq.stance.components.ai.StanceRiskLevel
import com.bindshq.stance.components.ai.StanceSearchResult
import com.bindshq.stance.components.ai.StanceSemanticSearchResults
import com.bindshq.stance.components.ai.StanceSmartField
import com.bindshq.stance.components.ai.StanceSmartFieldStatus
import com.bindshq.stance.components.ai.StanceStepStatus
import com.bindshq.stance.components.ai.StanceSuggestion
import com.bindshq.stance.components.ai.StanceSuggestionChips
import com.bindshq.stance.components.ai.StanceThread
import com.bindshq.stance.components.ai.StanceToolCallCard
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

private val gap = Arrangement.spacedBy(StanceSpacing.space3)

private const val ROLLOUT_PLAN = "## Rollout plan\nThe new legal footer goes live **tonight**.\n\n1. Publish the template\n2. Assign it to Sales\n3. Tell Legal when it is live"

/** Documentation images of the wave two AI components, keyed by their name in components.json. */
@OptIn(ExperimentalLayoutApi::class)
val aiWaveTwoComponentPreviews: Map<String, ComponentPreview> = mapOf(
    "StanceToolCallCard" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceToolCallCardExample()
            StanceToolCallCard("Send the test email", StanceStepStatus.Running, expanded = false, onExpandedChange = {}, icon = StanceIcons.Mail, input = "{}")
            StanceToolCallCard("Sync marko@binds.si", StanceStepStatus.Error, expanded = false, onExpandedChange = {}, error = "The mailbox refused the sync.")
        }
    },
    "StanceStepTimeline" to ComponentPreview { StanceStepTimelineExample() },
    "StancePlanChecklist" to ComponentPreview {
        StancePlanChecklist(
            items = listOf(
                StancePlanItem("footer", "Update the legal footer", StanceStepStatus.Complete),
                StancePlanItem("assign", "Assign the template to Sales", StanceStepStatus.Running, "48 mailboxes"),
                StancePlanItem("notify", "Tell Legal when it is live"),
            ),
            onApprove = {},
            onReject = {},
        )
    },
    "StanceApprovalPrompt" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceApprovalPrompt(
                title = "Send the new footer to 48 mailboxes",
                description = "Everyone in Sales gets the updated template on their next sync.",
                risk = StanceRiskLevel.Medium,
                onAllow = {},
                onAllowAlways = {},
                onDeny = {},
            ) { StanceCodeBlock("stance rollout --team sales", language = "bash", copyable = false) }
            StanceApprovalPrompt(title = "Delete 12 archived templates", description = "This cannot be undone.", risk = StanceRiskLevel.High, onAllow = {}, onDeny = {})
        }
    },
    "StancePermissionSheet" to ComponentPreview(frame = PreviewFrame.Overlay, height = 560) {
        StancePermissionSheet(
            onDismissRequest = {},
            title = "Rollout agent",
            description = "Choose what this agent may do on your behalf.",
            permissions = listOf(
                StancePermission("read", "Read templates", granted = true, description = "See every signature template", required = true),
                StancePermission("edit", "Edit templates", granted = true),
                StancePermission("send", "Send email", granted = false, description = "As you, inside your organisation", risk = StanceRiskLevel.High),
            ),
            onPermissionsChange = {},
            onSave = {},
        )
    },
    "StanceAgentStatusPill" to ComponentPreview {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            StanceAgentStatusPill(StanceAgentStatus.Working, detail = "Step 2 of 3")
            StanceAgentStatusPill(StanceAgentStatus.Waiting)
            StanceAgentStatusPill(StanceAgentStatus.Done)
            StanceAgentStatusPill(StanceAgentStatus.Error)
            StanceAgentStatusPill(StanceAgentStatus.Paused)
            StanceAgentStatusPill(StanceAgentStatus.Idle, size = StanceAgentStatusPillSize.Small)
        }
    },
    "StanceTaskQueue" to ComponentPreview { StanceTaskQueueExample() },
    "StanceSubagentTree" to ComponentPreview { StanceSubagentTreeExample() },
    "StanceRunLog" to ComponentPreview { StanceRunLogExample() },
    "StanceDiffReview" to ComponentPreview {
        StanceDiffReview(sampleDiff, mapOf("footer-legal" to StanceDiffDecision.Accepted), {}, view = StanceDiffView.Unified)
    },
    "StanceMarkdownRenderer" to ComponentPreview {
        StanceMarkdownRenderer(
            markdown = "### Rollout\nTwo mailboxes are **behind** [1]. Read the [guide](https://www.stanceui.com).\n\n" +
                "- [x] Update the footer\n- [ ] Notify Legal\n\n" +
                "| Team | Behind |\n| --- | ---: |\n| Sales | 2 |\n\n```bash\nnpm run rollout # tonight\n```",
            citations = mapOf(1 to sampleSources[2]),
        )
    },
    "StanceCodeSuggestion" to ComponentPreview {
        StanceCodeSuggestion(
            code = "fun footer(team: String): String {\n    return \"Binds, \$team\" // legal\n}",
            language = "kotlin",
            filename = "Footer.kt",
            onApply = {},
            onRun = {},
            applied = true,
            runStatus = StanceStepStatus.Complete,
            runOutput = "Binds, Sales",
        )
    },
    "StanceArtifactPanel" to ComponentPreview(PreviewFrame.Wide) {
        Row(Modifier.fillMaxSize().padding(StanceSpacing.space4), horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
            Column(Modifier.weight(1f), verticalArrangement = gap) {
                StanceMessage(StanceMessageRole.User, timestamp = "10:41") { Text("Draft the rollout plan.") }
                StanceMessage(StanceMessageRole.Assistant, timestamp = "10:41") {
                    Text("Here is a first version.")
                    StanceFilePreviewCard("Rollout plan", typeLabel = "Document", meta = "Version 2", onOpen = {})
                }
            }
            StanceArtifactPanel(
                title = "Rollout plan",
                kind = "Document",
                onClose = {},
                modifier = Modifier.weight(1f).fillMaxSize(),
                versions = listOf(StanceArtifactVersion("v1", "Version 1"), StanceArtifactVersion("v2", "Version 2")),
                versionId = "v2",
                onVersionChange = {},
                view = StanceArtifactView.Preview,
                onViewChange = {},
                windowWidth = StanceWindowWidth.Expanded,
                actions = { StanceIconButton(StanceIcons.Download, "Download", onClick = {}) },
            ) { Box(Modifier.padding(StanceSpacing.space4)) { StanceMarkdownRenderer(ROLLOUT_PLAN) } }
        }
    },
    "StanceGeneratedImage" to ComponentPreview {
        val signature = rememberSampleImage()
        val pen = rememberSampleImage(StanceIcons.PenNib)
        StanceGeneratedImage(
            painter = signature,
            contentDescription = "A handwritten signature in dark ink",
            aspectRatio = 16f / 9f,
            variations = listOf(StanceImageVariation("a", signature, "Signature, first version"), StanceImageVariation("b", pen, "A pen nib")),
            selectedId = "a",
            onSelect = {},
            prompt = "A handwritten signature",
            onDownload = {},
            onRegenerate = {},
            onEdit = {},
        )
    },
    "StanceGeneratedTable" to ComponentPreview { StanceGeneratedTableExample() },
    "StanceGeneratedChart" to ComponentPreview { StanceGeneratedChartExample() },
    "StanceFilePreviewCard" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceFilePreviewCardExample()
            StanceFilePreviewCard("Signature preview.png", kind = StanceAttachmentKind.Image, status = StanceGenerationStatus.Streaming, progress = 0.6f)
        }
    },
    "StanceCanvasSplitView" to ComponentPreview(PreviewFrame.Wide) {
        StanceCanvasSplitView(
            conversation = {
                Column(Modifier.padding(StanceSpacing.space4), verticalArrangement = gap) {
                    StanceMessage(StanceMessageRole.User, timestamp = "10:41") { Text("Draft the rollout plan.") }
                    StanceMessage(StanceMessageRole.Assistant, timestamp = "10:41") { Text("I drafted it in the canvas. Tell me what to change.") }
                }
            },
            canvas = { Box(Modifier.padding(StanceSpacing.space4)) { StanceMarkdownRenderer(ROLLOUT_PLAN) } },
            modifier = Modifier.fillMaxSize(),
            windowWidth = StanceWindowWidth.Expanded,
        )
    },
    "StanceInlineSuggestion" to ComponentPreview {
        StanceInlineSuggestion(
            value = "The new footer goes live",
            onValueChange = {},
            label = "Announcement",
            suggestion = " tonight for everyone in Sales.",
            onAccept = {},
            helper = "Press Tab or the tick to take the suggestion.",
        )
    },
    "StanceSmartField" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceSmartFieldExample()
            StanceSmartField("Registration number", "8421790000", {}, status = StanceSmartFieldStatus.Accepted, suggestionSource = "Invoice 1042", onUndo = {})
        }
    },
    "StanceRewriteMenu" to ComponentPreview(frame = PreviewFrame.Overlay, height = 420) {
        Box(Modifier.fillMaxSize().padding(StanceSpacing.space6)) {
            Box {
                StanceButton("Rewrite", onClick = {}, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Sparkle)
                StanceRewriteMenu(
                    expanded = true,
                    onDismissRequest = {},
                    actions = listOf(
                        StanceRewriteAction("improve", "Improve writing", StanceIcons.Sparkle),
                        StanceRewriteAction("shorten", "Shorten", StanceIcons.Minimize),
                        StanceRewriteAction("tone", "Change tone", StanceIcons.Sliders, children = listOf(StanceRewriteAction("formal", "Formal"))),
                    ),
                    onAction = {},
                )
            }
            StanceRewritePreview("The footer goes live tonight.", onReplace = {}, onDiscard = {}, modifier = Modifier.align(Alignment.BottomCenter))
        }
    },
    "StanceSummaryCard" to ComponentPreview { StanceSummaryCardExample() },
    "StanceAskBar" to ComponentPreview {
        StanceAskBar(
            value = "Who is behind?",
            onValueChange = {},
            onSubmit = {},
            suggestions = listOf(StanceSuggestion("behind", "Who is behind?"), StanceSuggestion("when", "When does it sync?")),
            status = StanceGenerationStatus.Complete,
            placeholder = "Ask about this rollout",
        ) { Text("Two mailboxes in Sales. Both sync tonight.", style = StanceTheme.typography.bodySmall) }
    },
    "StanceSuggestionChips" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceSuggestionChipsExample()
            StanceSuggestionChips(emptyList(), {}, loading = true)
        }
    },
    "StanceInsightCallout" to ComponentPreview { StanceInsightCalloutExample() },
    "StanceSemanticSearchResults" to ComponentPreview {
        StanceSemanticSearchResults(
            query = "when does the footer update",
            results = listOf(
                StanceSearchResult(
                    "guide", "Deploying signatures", "Templates reach every mailbox within an hour of publishing.",
                    highlights = listOf("within an hour"), source = "docs.binds.si", score = 0.92f, reason = "It describes rollout timing",
                ),
                StanceSearchResult("faq", "Signature FAQ", "Mobile clients apply the template on next send.", listOf("next send"), "help.binds.si", 0.71f),
            ),
            onResultSelect = {},
        ) { Text("New templates reach mailboxes within an hour.", style = StanceTheme.typography.bodySmall) }
    },
    "StanceCopilotPanel" to ComponentPreview(PreviewFrame.Wide) {
        Row(Modifier.fillMaxSize()) {
            Column(Modifier.weight(1f).padding(StanceSpacing.space6), verticalArrangement = gap) {
                Text("Rollout settings", style = StanceTheme.typography.headingSmall)
                StanceSummaryCardExample()
            }
            StanceCopilotPanel(
                onDismissRequest = {},
                title = "Rollout assistant",
                windowWidth = StanceWindowWidth.Expanded,
                focusComposer = false,
                context = { StanceContextChips(listOf(StanceContextItem("page", "Rollout settings", StanceIcons.Globe))) },
                composer = { StancePromptComposer(value = "", onValueChange = {}, onSubmit = {}) },
            ) {
                StanceThread(label = "Rollout assistant") {
                    item { StanceMessage(StanceMessageRole.User) { Text("Who is behind?") } }
                    item { StanceMessage(StanceMessageRole.Assistant) { Text("Two mailboxes in Sales. Both sync tonight.") } }
                }
            }
        }
    },
)
