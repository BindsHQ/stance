package si.binds.stance.showcase

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.ai.StanceAgentStatus
import com.bindshq.stance.components.ai.StanceAgentStatusPill
import com.bindshq.stance.components.ai.StanceAgentTask
import com.bindshq.stance.components.ai.StanceApprovalPrompt
import com.bindshq.stance.components.ai.StanceArtifactPanel
import com.bindshq.stance.components.ai.StanceArtifactVersion
import com.bindshq.stance.components.ai.StanceArtifactView
import com.bindshq.stance.components.ai.StanceAskBar
import com.bindshq.stance.components.ai.StanceCanvasSplitView
import com.bindshq.stance.components.ai.StanceCodeSuggestion
import com.bindshq.stance.components.ai.StanceConfidenceLevel
import com.bindshq.stance.components.ai.StanceContextChips
import com.bindshq.stance.components.ai.StanceContextItem
import com.bindshq.stance.components.ai.StanceCopilotPanel
import com.bindshq.stance.components.ai.StanceDiffDecision
import com.bindshq.stance.components.ai.StanceDiffFile
import com.bindshq.stance.components.ai.StanceDiffHunk
import com.bindshq.stance.components.ai.StanceDiffLine
import com.bindshq.stance.components.ai.StanceDiffLineKind
import com.bindshq.stance.components.ai.StanceDiffReview
import com.bindshq.stance.components.ai.StanceFilePreviewCard
import com.bindshq.stance.components.ai.StanceGeneratedChart
import com.bindshq.stance.components.ai.StanceGeneratedColumn
import com.bindshq.stance.components.ai.StanceGeneratedImage
import com.bindshq.stance.components.ai.StanceGeneratedTable
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceInlineSuggestion
import com.bindshq.stance.components.ai.StanceInsightCallout
import com.bindshq.stance.components.ai.StanceInsightTone
import com.bindshq.stance.components.ai.StanceLogEntry
import com.bindshq.stance.components.ai.StanceLogLevel
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
import com.bindshq.stance.components.ai.StanceRunLog
import com.bindshq.stance.components.ai.StanceSearchResult
import com.bindshq.stance.components.ai.StanceSemanticSearchResults
import com.bindshq.stance.components.ai.StanceSmartField
import com.bindshq.stance.components.ai.StanceSmartFieldStatus
import com.bindshq.stance.components.ai.StanceStepStatus
import com.bindshq.stance.components.ai.StanceStepTimeline
import com.bindshq.stance.components.ai.StanceSubagent
import com.bindshq.stance.components.ai.StanceSubagentTree
import com.bindshq.stance.components.ai.StanceSuggestion
import com.bindshq.stance.components.ai.StanceSuggestionChips
import com.bindshq.stance.components.ai.StanceSummaryCard
import com.bindshq.stance.components.ai.StanceTaskQueue
import com.bindshq.stance.components.ai.StanceThread
import com.bindshq.stance.components.ai.StanceTimelineStep
import com.bindshq.stance.components.ai.StanceToolCallCard
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceChartType
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceTheme

// One compiled example per wave two AI component: agents, output and product.
// The showcase renders them and platforms/android/scripts/generate-components-json.mjs copies
// their source into components.json. The app owns every status and decision; Stance draws them.

/** The change the sample agent proposes, shared by the examples, the previews and the Assistant screen. */
val sampleDiff = listOf(
    StanceDiffFile(
        id = "footer",
        path = "templates/sales-footer.html",
        hunks = listOf(
            StanceDiffHunk(
                id = "footer-legal",
                header = "@@ 12,3 @@",
                lines = listOf(
                    StanceDiffLine(StanceDiffLineKind.Context, "<p class=\"legal\">", 12, 12),
                    StanceDiffLine(StanceDiffLineKind.Remove, "  Binds d.o.o.", 13, null),
                    StanceDiffLine(StanceDiffLineKind.Add, "  Binds d.o.o., Ljubljana", null, 13),
                    StanceDiffLine(StanceDiffLineKind.Add, "  Registration 8421790000", null, 14),
                    StanceDiffLine(StanceDiffLineKind.Context, "</p>", 14, 15),
                ),
            ),
        ),
    ),
)

val sampleFollowUps = listOf(
    StanceSuggestion("schedule", "Schedule it for tonight", StanceIcons.Clock),
    StanceSuggestion("audit", "Show the audit"),
    StanceSuggestion("notify", "Notify Legal"),
)

@Composable
fun StanceToolCallCardExample() {
    StanceToolCallCard(
        title = "Search the rollout audit",
        status = StanceStepStatus.Complete,
        name = "audit.search",
        input = "{ \"footer\": \"old\", \"team\": \"Sales\" }",
        output = "[\"ana@binds.si\", \"marko@binds.si\"]",
        durationSeconds = 2,
        initiallyExpanded = true,
    )
}

@Composable
fun StanceStepTimelineExample() {
    StanceStepTimeline(
        steps = listOf(
            StanceTimelineStep("read", "Read the brand policy", StanceStepStatus.Complete, durationLabel = "4 s"),
            StanceTimelineStep("find", "Find mailboxes on the old footer", StanceStepStatus.Running, "Checking 50 mailboxes") {
                Text("48 checked so far, 2 still on the old footer.")
            },
            StanceTimelineStep("update", "Update the template", StanceStepStatus.Pending),
        ),
        initiallyExpandedIds = setOf("find"),
    )
}

@Composable
fun StancePlanChecklistExample() {
    var plan by remember {
        mutableStateOf(
            listOf(
                StancePlanItem("footer", "Update the legal footer"),
                StancePlanItem("assign", "Assign the template to Sales"),
                StancePlanItem("notify", "Tell Legal when it is live"),
            ),
        )
    }
    StancePlanChecklist(
        items = plan,
        editable = true,
        onItemsChange = { plan = it },
        onApprove = { println("Plan approved") },
        onReject = { println("Plan rejected") },
    )
}

@Composable
fun StanceApprovalPromptExample() {
    var decision by remember { mutableStateOf("Waiting for a decision") }
    Column {
        StanceApprovalPrompt(
            title = "Send the new footer to 48 mailboxes",
            description = "Everyone in Sales gets the updated template on their next sync.",
            risk = StanceRiskLevel.Medium,
            onAllow = { decision = "Allowed once" },
            onAllowAlways = { decision = "Always allowed" },
            onDeny = { reason -> decision = "Denied: $reason" },
            denyOnBack = false,
        )
        Text(decision)
    }
}

@Composable
fun StancePermissionSheetExample() {
    var open by remember { mutableStateOf(false) }
    var permissions by remember {
        mutableStateOf(
            listOf(
                StancePermission("read", "Read templates", granted = true, description = "See every signature template", required = true),
                StancePermission("edit", "Edit templates", granted = true),
                StancePermission("send", "Send email", granted = false, description = "As you, to people in your organisation", risk = StanceRiskLevel.High),
            ),
        )
    }
    StanceButton("Review access", onClick = { open = true }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Shield)
    if (open) {
        StancePermissionSheet(
            onDismissRequest = { open = false },
            title = "Rollout agent",
            description = "Choose what this agent may do on your behalf.",
            permissions = permissions,
            onPermissionsChange = { permissions = it },
            onSave = { open = false },
        )
    }
}

@Composable
fun StanceAgentStatusPillExample() {
    var status by remember { mutableStateOf(StanceAgentStatus.Working) }
    StanceAgentStatusPill(
        status = status,
        detail = "Step 2 of 3",
        onClick = { status = if (status == StanceAgentStatus.Working) StanceAgentStatus.Waiting else StanceAgentStatus.Working },
    )
}

@Composable
fun StanceTaskQueueExample() {
    var tasks by remember {
        mutableStateOf(
            listOf(
                StanceAgentTask("export", "Export the audit", StanceStepStatus.Running, progress = 0.6f, startedAt = "10:41"),
                StanceAgentTask("notify", "Notify Legal", StanceStepStatus.Error, detail = "The address bounced"),
                StanceAgentTask("archive", "Archive old templates", StanceStepStatus.Pending),
            ),
        )
    }
    fun pause(id: String, paused: Boolean) {
        tasks = tasks.map { if (it.id == id) it.copy(paused = paused) else it }
    }
    StanceTaskQueue(
        tasks = tasks,
        onCancel = { task -> tasks = tasks - task },
        onRetry = { println("Retry ${it.title}") },
        onPause = { pause(it.id, true) },
        onResume = { pause(it.id, false) },
    )
}

@Composable
fun StanceSubagentTreeExample() {
    StanceSubagentTree(
        agents = listOf(
            StanceSubagent(
                "lead", "Rollout lead", StanceStepStatus.Running, "Coordinating the footer change",
                children = listOf(
                    StanceSubagent("audit", "Auditor", StanceStepStatus.Complete, "Found 2 mailboxes behind"),
                    StanceSubagent("writer", "Template writer", StanceStepStatus.Waiting, "Needs your approval"),
                ),
            ),
        ),
        initiallyExpandedIds = setOf("lead"),
    )
}

@Composable
fun StanceRunLogExample() {
    var levels by remember { mutableStateOf(StanceLogLevel.entries.toSet()) }
    StanceRunLog(
        entries = listOf(
            StanceLogEntry("1", StanceLogLevel.Info, "Run started", "10:41:02"),
            StanceLogEntry("2", StanceLogLevel.Debug, "Loaded 50 mailboxes", "10:41:03"),
            StanceLogEntry("3", StanceLogLevel.Warn, "2 mailboxes on the old footer", "10:41:06"),
            StanceLogEntry("4", StanceLogLevel.Error, "Sync refused for marko@binds.si", "10:41:09"),
        ),
        levels = levels,
        onLevelsChange = { levels = it },
    )
}

@Composable
fun StanceDiffReviewExample() {
    var decisions by remember { mutableStateOf(emptyMap<String, StanceDiffDecision>()) }
    StanceDiffReview(files = sampleDiff, decisions = decisions, onDecisionsChange = { decisions = it })
}

@Composable
fun StanceMarkdownRendererExample() {
    StanceMarkdownRenderer(
        markdown = "### Rollout\nTwo mailboxes are **behind** [1]. Read the [guide](https://www.stanceui.com).\n\n" +
            "- [x] Update the footer\n- [ ] Notify Legal\n\n" +
            "| Team | Behind |\n| --- | ---: |\n| Sales | 2 |\n\n```bash\nnpm run rollout -- --team sales\n```",
        citations = mapOf(1 to sampleSources[2]),
    )
}

@Composable
fun StanceCodeSuggestionExample() {
    var applied by remember { mutableStateOf(false) }
    var run by remember { mutableStateOf<StanceStepStatus?>(null) }
    StanceCodeSuggestion(
        code = "fun footer(team: String) = \"Binds d.o.o., \$team\"",
        language = "kotlin",
        filename = "Footer.kt",
        onApply = { applied = true },
        onRun = { run = StanceStepStatus.Complete },
        applied = applied,
        runStatus = run,
        runOutput = if (run != null) "Binds d.o.o., Sales" else null,
    )
}

@Composable
fun StanceArtifactPanelExample() {
    var open by remember { mutableStateOf(false) }
    var view by remember { mutableStateOf(StanceArtifactView.Preview) }
    var version by remember { mutableStateOf("v2") }
    StanceButton("Open the rollout plan", onClick = { open = true }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.FileText)
    if (open) {
        StanceArtifactPanel(
            title = "Rollout plan",
            kind = "Document",
            onClose = { open = false },
            versions = listOf(StanceArtifactVersion("v1", "Version 1"), StanceArtifactVersion("v2", "Version 2")),
            versionId = version,
            onVersionChange = { version = it },
            view = view,
            onViewChange = { view = it },
        ) { shown ->
            StanceMarkdownRenderer(if (shown == StanceArtifactView.Preview) "## Rollout plan\nPublish tonight." else "```html\n<h2>Rollout plan</h2>\n```")
        }
    }
}

/** Stands in for a generated picture: a signature drawn in the theme's ink. Apps pass their own painter. */
@Composable
fun rememberSampleImage(icon: ImageVector = StanceIcons.Signature): Painter {
    val ink = StanceTheme.colors.fgDefault
    val drawing = rememberVectorPainter(icon)
    return remember(drawing, ink) {
        object : Painter() {
            override val intrinsicSize: Size get() = drawing.intrinsicSize

            override fun DrawScope.onDraw() {
                with(drawing) { draw(size, colorFilter = ColorFilter.tint(ink)) }
            }
        }
    }
}

@Composable
fun StanceGeneratedImageExample() {
    StanceGeneratedImage(
        // Any Painter works: the one your image loader gives you, or a drawable.
        painter = rememberSampleImage(),
        contentDescription = "A handwritten signature in dark ink",
        aspectRatio = 16f / 9f,
        prompt = "A handwritten signature",
        onDownload = { println("Download") },
        onRegenerate = { println("Regenerate") },
    )
}

@Composable
fun StanceGeneratedTableExample() {
    StanceGeneratedTable(
        columns = listOf(StanceGeneratedColumn("team", "Team"), StanceGeneratedColumn("behind", "Behind", numeric = true)),
        rows = listOf(listOf("Sales", "2"), listOf("Legal", "0"), listOf("Finance", "1")),
        caption = "Mailboxes on the old footer",
        onExport = { println("Export") },
    )
}

@Composable
fun StanceGeneratedChartExample() {
    StanceGeneratedChart(
        title = "Mailboxes updated",
        takeaway = "Almost every mailbox had the new footer by Thursday.",
        categories = listOf("Mon", "Tue", "Wed", "Thu"),
        series = listOf(StanceChartSeries("Updated", listOf(12f, 31f, 44f, 48f))),
        type = StanceChartType.Bar,
        source = "Rollout audit",
    )
}

@Composable
fun StanceFilePreviewCardExample() {
    StanceFilePreviewCard(
        name = "Rollout audit.pdf",
        typeLabel = "PDF",
        sizeLabel = "1.2 MB",
        meta = "12 pages",
        onOpen = { println("Open") },
        onDownload = { println("Download") },
    )
}

@Composable
fun StanceCanvasSplitViewExample() {
    StanceCanvasSplitView(
        conversation = { StanceMessage(StanceMessageRole.Assistant) { Text("I drafted the rollout plan.") } },
        canvas = { StanceMarkdownRenderer("## Rollout plan\n1. Publish the template\n2. Assign it to Sales") },
        modifier = Modifier.height(StanceSizes.pickerMaxHeight / 2),
    )
}

@Composable
fun StanceInlineSuggestionExample() {
    var text by remember { mutableStateOf("The new footer goes live") }
    var suggestion by remember { mutableStateOf<String?>(" tonight for everyone in Sales.") }
    StanceInlineSuggestion(
        value = text,
        onValueChange = { text = it },
        label = "Announcement",
        suggestion = suggestion,
        onAccept = {
            text += suggestion.orEmpty()
            suggestion = null
        },
        onDismiss = { suggestion = null },
    )
}

@Composable
fun StanceSmartFieldExample() {
    var company by remember { mutableStateOf("") }
    var status by remember { mutableStateOf(StanceSmartFieldStatus.Suggested) }
    StanceSmartField(
        label = "Company",
        value = company,
        onValueChange = { company = it },
        status = status,
        suggestedValue = "Binds d.o.o.",
        suggestionSource = "Invoice 1042",
        onAccept = {
            company = "Binds d.o.o."
            status = StanceSmartFieldStatus.Accepted
        },
        onUndo = {
            company = ""
            status = StanceSmartFieldStatus.Suggested
        },
    )
}

@Composable
fun StanceRewriteMenuExample() {
    var open by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf<String?>(null) }
    Column {
        Box {
            StanceButton("Rewrite", onClick = { open = true }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Sparkle)
            StanceRewriteMenu(
                expanded = open,
                onDismissRequest = { open = false },
                actions = listOf(
                    StanceRewriteAction("shorten", "Shorten"),
                    StanceRewriteAction("tone", "Change tone", children = listOf(StanceRewriteAction("formal", "Formal"), StanceRewriteAction("friendly", "Friendly"))),
                ),
                onAction = { result = "The footer goes live tonight." },
            )
        }
        result?.let { StanceRewritePreview(text = it, onReplace = { result = null }, onDiscard = { result = null }) }
    }
}

@Composable
fun StanceSummaryCardExample() {
    StanceSummaryCard(
        points = listOf("Two mailboxes in Sales still send the old footer.", "Both pick up the new template tonight."),
        sources = sampleSources.take(2),
        updatedAt = "2 min ago",
        onRegenerate = { println("Regenerate") },
        onExpand = { println("Open the audit") },
    )
}

@Composable
fun StanceAskBarExample() {
    var question by remember { mutableStateOf("") }
    var status by remember { mutableStateOf(StanceGenerationStatus.Idle) }
    StanceAskBar(
        value = question,
        onValueChange = { question = it },
        onSubmit = { status = StanceGenerationStatus.Complete },
        suggestions = listOf(StanceSuggestion("behind", "Who is behind?"), StanceSuggestion("when", "When does it sync?")),
        status = status,
        placeholder = "Ask about this rollout",
    ) {
        Text("Two mailboxes in Sales. Both sync tonight.")
    }
}

@Composable
fun StanceSuggestionChipsExample() {
    StanceSuggestionChips(items = sampleFollowUps, onSelect = { println("Ask: ${it.label}") })
}

@Composable
fun StanceInsightCalloutExample() {
    StanceInsightCallout(
        title = "Signing slows down on Fridays",
        tone = StanceInsightTone.Attention,
        confidence = StanceConfidenceLevel.High,
        actionLabel = "Move the reminder to Thursday",
        onAction = { println("Reminder moved") },
        onDismiss = { println("Dismissed") },
        evidence = { Text("Median time to sign: 14 hours, 31 hours on Fridays.") },
    ) {
        Text("Contracts sent on a Friday take twice as long to come back.")
    }
}

@Composable
fun StanceSemanticSearchResultsExample() {
    StanceSemanticSearchResults(
        query = "when does the footer update",
        results = listOf(
            StanceSearchResult(
                "guide", "Deploying signatures", "Templates reach every mailbox within an hour of publishing.",
                highlights = listOf("within an hour"), source = "docs.binds.si", score = 0.92f, reason = "It describes rollout timing",
            ),
            StanceSearchResult("faq", "Signature FAQ", "Mobile clients apply the template on next send.", source = "help.binds.si", score = 0.71f),
        ),
        onResultSelect = { println("Open ${it.title}") },
        modifier = Modifier.height(StanceSizes.pickerMaxHeight / 2),
    )
}

@Composable
fun StanceCopilotPanelExample() {
    var open by remember { mutableStateOf(false) }
    var draft by remember { mutableStateOf("") }
    val messages = remember { listOf("Two mailboxes are still on the old footer.") }
    StanceButton("Ask the assistant", onClick = { open = true }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Sparkle)
    if (open) {
        StanceCopilotPanel(
            onDismissRequest = { open = false },
            title = "Rollout assistant",
            context = { StanceContextChips(listOf(StanceContextItem("page", "Rollout settings", StanceIcons.Globe))) },
            composer = { StancePromptComposer(value = draft, onValueChange = { draft = it }, onSubmit = { draft = "" }) },
        ) {
            StanceThread(modifier = Modifier.height(StanceSizes.pickerMaxHeight / 4), label = "Rollout assistant") {
                items(messages, key = { it }) { text -> StanceMessage(StanceMessageRole.Assistant) { Text(text) } }
            }
        }
    }
}

/** The wave two part of the AI section of the components catalogue. */
val aiWaveTwoCatalogue: List<Pair<String, @Composable () -> Unit>> = listOf(
    "StanceToolCallCard" to { StanceToolCallCardExample() },
    "StanceStepTimeline" to { StanceStepTimelineExample() },
    "StancePlanChecklist" to { StancePlanChecklistExample() },
    "StanceApprovalPrompt" to { StanceApprovalPromptExample() },
    "StancePermissionSheet" to { Column { StancePermissionSheetExample() } },
    "StanceAgentStatusPill" to { StanceAgentStatusPillExample() },
    "StanceTaskQueue" to { StanceTaskQueueExample() },
    "StanceSubagentTree" to { StanceSubagentTreeExample() },
    "StanceRunLog" to { StanceRunLogExample() },
    "StanceDiffReview" to { StanceDiffReviewExample() },
    "StanceMarkdownRenderer" to { StanceMarkdownRendererExample() },
    "StanceCodeSuggestion" to { StanceCodeSuggestionExample() },
    "StanceArtifactPanel" to { Column { StanceArtifactPanelExample() } },
    "StanceGeneratedImage" to { StanceGeneratedImageExample() },
    "StanceGeneratedTable" to { StanceGeneratedTableExample() },
    "StanceGeneratedChart" to { StanceGeneratedChartExample() },
    "StanceFilePreviewCard" to { StanceFilePreviewCardExample() },
    "StanceCanvasSplitView" to { StanceCanvasSplitViewExample() },
    "StanceInlineSuggestion" to { StanceInlineSuggestionExample() },
    "StanceSmartField" to { StanceSmartFieldExample() },
    "StanceRewriteMenu" to { StanceRewriteMenuExample() },
    "StanceSummaryCard" to { StanceSummaryCardExample() },
    "StanceAskBar" to { StanceAskBarExample() },
    "StanceSuggestionChips" to { StanceSuggestionChipsExample() },
    "StanceInsightCallout" to { StanceInsightCalloutExample() },
    "StanceSemanticSearchResults" to { StanceSemanticSearchResultsExample() },
    "StanceCopilotPanel" to { Column { StanceCopilotPanelExample() } },
)
