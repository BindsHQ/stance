package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.ai.StanceAIGeneratedLabel
import com.bindshq.stance.components.ai.StanceAgentStatus
import com.bindshq.stance.components.ai.StanceAgentStatusPill
import com.bindshq.stance.components.ai.StanceApprovalPrompt
import com.bindshq.stance.components.ai.StanceAttachment
import com.bindshq.stance.components.ai.StanceAttachmentTray
import com.bindshq.stance.components.ai.StanceBranchSwitcher
import com.bindshq.stance.components.ai.StanceCitationChip
import com.bindshq.stance.components.ai.StanceContextChips
import com.bindshq.stance.components.ai.StanceContextItem
import com.bindshq.stance.components.ai.StanceDiffDecision
import com.bindshq.stance.components.ai.StanceDiffReview
import com.bindshq.stance.components.ai.StanceDisclaimerNote
import com.bindshq.stance.components.ai.StanceGeneratedColumn
import com.bindshq.stance.components.ai.StanceGeneratedTable
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceInterruptedReason
import com.bindshq.stance.components.ai.StanceInterruptedState
import com.bindshq.stance.components.ai.StanceMessage
import com.bindshq.stance.components.ai.StanceMessageActions
import com.bindshq.stance.components.ai.StanceMessageRole
import com.bindshq.stance.components.ai.StanceModelPicker
import com.bindshq.stance.components.ai.StancePlanChecklist
import com.bindshq.stance.components.ai.StancePlanItem
import com.bindshq.stance.components.ai.StancePromptComposer
import com.bindshq.stance.components.ai.StanceRating
import com.bindshq.stance.components.ai.StanceReasoningDisclosure
import com.bindshq.stance.components.ai.StanceReasoningStatus
import com.bindshq.stance.components.ai.StanceReportCategory
import com.bindshq.stance.components.ai.StanceReportDialog
import com.bindshq.stance.components.ai.StanceRiskLevel
import com.bindshq.stance.components.ai.StanceSourceList
import com.bindshq.stance.components.ai.StanceStarter
import com.bindshq.stance.components.ai.StanceStepStatus
import com.bindshq.stance.components.ai.StanceStreamingText
import com.bindshq.stance.components.ai.StanceSuggestionChips
import com.bindshq.stance.components.ai.StanceThinkingIndicator
import com.bindshq.stance.components.ai.StanceThread
import com.bindshq.stance.components.ai.StanceThreadEmptyState
import com.bindshq.stance.components.ai.StanceToolCallCard
import com.bindshq.stance.components.ai.StanceTokenBudgetMeter
import com.bindshq.stance.components.ai.StanceTokenBudgetVariant
import com.bindshq.stance.components.ai.StanceVoiceInputButton
import com.bindshq.stance.components.ai.StanceVoiceInputState
import com.bindshq.stance.components.ai.rememberStanceMessageCustomActions
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import kotlinx.coroutines.delay

/** One turn of the sample conversation. The app owns this model; Stance only draws it. */
@Immutable
private data class Turn(
    val id: Int,
    val role: StanceMessageRole,
    val text: String,
    val time: String,
    val status: StanceGenerationStatus = StanceGenerationStatus.Complete,
    val reasoning: String? = null,
    val cited: Boolean = false,
    val attachment: StanceAttachment? = null,
    /** The turn carries the sample agent run under its text. */
    val run: Boolean = false,
)

private const val CANNED_ANSWER =
    "Yes. Publish the template, then assign it to the Sales group. Mailboxes pick it up within an hour, " +
        "and mobile clients apply it on the next send. I can schedule the change for tonight if you prefer."

private val history = listOf(
    Turn(1, StanceMessageRole.User, "Who still has the old legal footer?", "10:41", attachment = StanceAttachment("policy", "Brand policy.pdf", sizeLabel = "1.2 MB")),
    Turn(
        2, StanceMessageRole.Assistant,
        "Two people in Sales still send the old footer. Their mailboxes last synced before the policy changed, and both pick up the new template tonight.",
        "10:41",
        reasoning = "The policy requires the footer on external mail. The March audit lists two mailboxes that synced before the change.",
        cited = true,
    ),
    Turn(3, StanceMessageRole.User, "Update the legal footer for everyone in Sales.", "10:43"),
    Turn(4, StanceMessageRole.Assistant, "Here is my plan. Nothing changes until you approve it.", "10:43", run = true),
)

/** Where the sample agent run is. The app owns this; Stance draws each stage. */
private enum class RunStage { Plan, Approval, Review, Done, Cancelled }

private val runPlan = listOf(
    StancePlanItem("audit", "Find mailboxes on the old footer"),
    StancePlanItem("footer", "Update the legal footer", description = "templates/sales-footer.html"),
    StancePlanItem("report", "Report who received it"),
)

private val runResults = listOf(listOf("Ana Novak", "Updated", "10:44"), listOf("Marko Kranjc", "Updated", "10:44"), listOf("48 others", "Already current", "Yesterday"))

/**
 * An agent run from plan to result: a plan to approve, a tool call, an approval before anything
 * is sent, a diff to review, then a generated table and follow ups. Every step waits for the
 * person, and each stage is plain state in the app. Nothing here talks to a network.
 */
@Composable
private fun AgentRun(onFollowUp: (String) -> Unit) {
    var stage by rememberSaveable { mutableStateOf(RunStage.Plan) }
    var plan by remember { mutableStateOf(runPlan) }
    var decisions by remember { mutableStateOf(emptyMap<String, StanceDiffDecision>()) }
    val started = stage != RunStage.Plan && stage != RunStage.Cancelled
    // The steps done so far follow from the stage.
    val done = when (stage) {
        RunStage.Plan, RunStage.Cancelled -> 0
        RunStage.Approval -> 1
        RunStage.Review -> 2
        RunStage.Done -> plan.size
    }
    val steps = plan.mapIndexed { index, item ->
        item.copy(
            status = when {
                index < done -> StanceStepStatus.Complete
                index == done && started -> if (stage == RunStage.Approval) StanceStepStatus.Waiting else StanceStepStatus.Running
                else -> StanceStepStatus.Pending
            },
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        StanceAgentStatusPill(
            status = when (stage) {
                RunStage.Plan, RunStage.Approval -> StanceAgentStatus.Waiting
                RunStage.Review -> StanceAgentStatus.Working
                RunStage.Done -> StanceAgentStatus.Done
                RunStage.Cancelled -> StanceAgentStatus.Paused
            },
            detail = if (started) "Step ${minOf(done + 1, plan.size)} of ${plan.size}" else null,
        )
        StancePlanChecklist(
            items = steps,
            editable = stage == RunStage.Plan,
            onItemsChange = { plan = it },
            onApprove = if (stage == RunStage.Plan) ({ stage = RunStage.Approval }) else null,
            onReject = if (stage == RunStage.Plan) ({ stage = RunStage.Cancelled }) else null,
        )
        if (started) {
            StanceToolCallCard(
                title = "Search the rollout audit",
                status = StanceStepStatus.Complete,
                name = "audit.search",
                input = "{ \"footer\": \"old\", \"team\": \"Sales\" }",
                output = "[\"ana@binds.si\", \"marko@binds.si\"]",
                durationSeconds = 2,
            )
        }
        if (stage == RunStage.Approval) {
            StanceApprovalPrompt(
                title = "Change the footer for 2 mailboxes",
                description = "Ana and Marko get the new legal footer on their next sync.",
                risk = StanceRiskLevel.Medium,
                onAllow = { stage = RunStage.Review },
                onDeny = { stage = RunStage.Cancelled },
                denyOnBack = false,
            ) { StanceCodeBlock("stance rollout --team sales --only-outdated", language = "bash", copyable = false, wrap = true) }
        }
        if (stage == RunStage.Review || stage == RunStage.Done) {
            StanceDiffReview(
                files = sampleDiff,
                decisions = decisions,
                onDecisionsChange = { changed ->
                    decisions = changed
                    if (sampleDiff.all { file -> file.hunks.all { changed[it.id] == StanceDiffDecision.Accepted } }) stage = RunStage.Done
                },
            )
        }
        if (stage == RunStage.Done) {
            StanceGeneratedTable(
                columns = listOf(StanceGeneratedColumn("person", "Person"), StanceGeneratedColumn("state", "Footer"), StanceGeneratedColumn("when", "Synced")),
                rows = runResults,
                caption = "Who has the new footer",
            )
            StanceSuggestionChips(sampleFollowUps, onSelect = { onFollowUp(it.label) }, label = "Follow up")
        }
        if (stage == RunStage.Cancelled) {
            StanceInterruptedState(StanceInterruptedReason.Stopped, description = "Nothing was changed.", onRetry = { stage = RunStage.Plan })
        }
    }
}

/**
 * A full conversation screen built only from Stance components. The reply is canned and
 * revealed by a local timer, and the last turn is an agent run that waits for the person at every
 * step: there is no network and no model.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AssistantScreen(padding: PaddingValues, startEmpty: Boolean = false) {
    val turns = remember { mutableStateListOf<Turn>().apply { if (!startEmpty) addAll(history) } }
    var draft by rememberSaveable { mutableStateOf("") }
    var status by remember { mutableStateOf(StanceGenerationStatus.Idle) }
    var model by rememberSaveable { mutableStateOf("atlas") }
    var rating by remember { mutableStateOf<StanceRating?>(null) }
    var branch by remember { mutableIntStateOf(1) }
    var reporting by remember { mutableStateOf(false) }
    var voice by remember { mutableStateOf(StanceVoiceInputState.Idle) }
    var context by remember { mutableStateOf(listOf(StanceContextItem("page", "Rollout settings", StanceIcons.Globe, kind = "Page"))) }

    fun update(id: Int, change: (Turn) -> Turn) {
        val index = turns.indexOfFirst { it.id == id }
        if (index >= 0) turns[index] = change(turns[index])
    }

    fun send(text: String) {
        val next = (turns.maxOfOrNull { it.id } ?: 0) + 1
        turns += Turn(next, StanceMessageRole.User, text.trim(), "Now")
        turns += Turn(next + 1, StanceMessageRole.Assistant, "", "Now", status = StanceGenerationStatus.Submitted)
        status = StanceGenerationStatus.Submitted
    }

    // Stands in for the app's transport: think, then append the canned answer word by word.
    val pending = turns.lastOrNull()?.takeIf { it.status.isBusy }?.id
    LaunchedEffect(pending) {
        if (pending == null) return@LaunchedEffect
        delay(THINKING_MILLIS)
        status = StanceGenerationStatus.Streaming
        update(pending) { it.copy(status = StanceGenerationStatus.Streaming) }
        for (word in CANNED_ANSWER.split(" ")) {
            delay(TOKEN_MILLIS)
            update(pending) { it.copy(text = if (it.text.isEmpty()) word else it.text + " " + word) }
        }
        update(pending) { it.copy(status = StanceGenerationStatus.Complete, cited = true) }
        status = StanceGenerationStatus.Complete
    }

    Column(modifier = Modifier.fillMaxSize().padding(padding).imePadding(), horizontalAlignment = Alignment.CenterHorizontally) {
        if (turns.isEmpty()) {
            Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                StanceThreadEmptyState(
                    title = "How can I help?",
                    description = "Ask about templates, rollouts and policies.",
                    starters = listOf(
                        StanceStarter("audit", "Summarise the last rollout", "Who received it and who did not", StanceIcons.BarChart),
                        StanceStarter("footer", "Can I roll out the new footer today?", "Based on the brand policy", StanceIcons.FileText),
                    ),
                    onStarterSelect = { send(it.label) },
                )
            }
        } else {
            StanceThread(modifier = Modifier.weight(1f).widthIn(max = StanceSizes.contentMaxWidth), label = "Signature rollout") {
                items(turns, key = { it.id }, contentType = { it.role }) { turn ->
                    val latest = turn.id == turns.last().id
                    if (turn.role == StanceMessageRole.User) {
                        StanceMessage(StanceMessageRole.User, timestamp = turn.time) {
                            Text(turn.text)
                            if (turn.attachment != null) StanceAttachmentTray(listOf(turn.attachment), readOnly = true)
                        }
                    } else {
                        val copy = { println("Copy turn ${turn.id}") }
                        val retry = { println("Retry turn ${turn.id}") }
                        val settled = !turn.status.isBusy
                        StanceMessage(
                            role = StanceMessageRole.Assistant,
                            status = turn.status,
                            timestamp = turn.time,
                            customActions = if (settled) rememberStanceMessageCustomActions(onCopy = copy, onRetry = retry, onRate = { rating = it }, rating = rating) else emptyList(),
                            footer = {
                                when {
                                    turn.status == StanceGenerationStatus.Stopped -> StanceInterruptedState(
                                        StanceInterruptedReason.Stopped,
                                        onContinue = {
                                            update(turn.id) { it.copy(status = StanceGenerationStatus.Complete) }
                                            status = StanceGenerationStatus.Complete
                                        },
                                    )
                                    settled && turn.cited -> StanceSourceList(sampleSources, max = 2)
                                }
                            },
                            actions = {
                                if (settled) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        StanceMessageActions(onCopy = copy, onRetry = retry, onRate = { rating = it }, rating = rating) {
                                            StanceIconButton(StanceIcons.Flag, "Report this response", onClick = { reporting = true })
                                        }
                                        Spacer(Modifier.weight(1f))
                                        if (!latest) StanceBranchSwitcher(count = 2, index = branch, onIndexChange = { branch = it })
                                    }
                                }
                            },
                        ) {
                            if (turn.reasoning != null) {
                                StanceReasoningDisclosure(StanceReasoningStatus.Done, durationSeconds = 6, initiallyExpanded = false) { Text(turn.reasoning) }
                            }
                            if (turn.status == StanceGenerationStatus.Submitted) {
                                StanceThinkingIndicator()
                            } else {
                                StanceStreamingText(turn.text, streaming = turn.status == StanceGenerationStatus.Streaming)
                            }
                            if (turn.run) AgentRun(onFollowUp = { send(it) })
                            if (settled && turn.cited) {
                                FlowRow(itemVerticalAlignment = Alignment.CenterVertically) {
                                    StanceAIGeneratedLabel(model = sampleModels.first { it.id == model }.name)
                                    sampleSources.take(2).forEachIndexed { index, source -> StanceCitationChip(index + 1, source, onOpen = { println("Open ${it.title}") }) }
                                }
                            }
                        }
                    }
                }
            }
        }

        Column(
            modifier = Modifier
                .widthIn(max = StanceSizes.contentMaxWidth)
                .fillMaxWidth()
                .padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space2),
            verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
        ) {
            StancePromptComposer(
                value = draft,
                onValueChange = { draft = it },
                onSubmit = { send(it) },
                onStop = {
                    turns.lastOrNull()?.let { last -> update(last.id) { it.copy(status = StanceGenerationStatus.Stopped) } }
                    status = StanceGenerationStatus.Stopped
                },
                status = status,
                header = { StanceContextChips(context, onRemove = { removed -> context = context - removed }) },
                leading = { StanceIconButton(StanceIcons.Paperclip, "Attach a file", onClick = { println("Attach") }) },
                trailing = {
                    StanceVoiceInputButton(
                        state = voice,
                        onClick = { voice = if (voice == StanceVoiceInputState.Idle) StanceVoiceInputState.Listening else StanceVoiceInputState.Idle },
                        level = 0.5f,
                    )
                },
                footer = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StanceModelPicker(sampleModels, model, { model = it.id })
                        Spacer(Modifier.weight(1f))
                        StanceTokenBudgetMeter(used = 2_400L + draft.length, limit = 8_000L, variant = StanceTokenBudgetVariant.Ring)
                    }
                },
            )
            StanceDisclaimerNote("Answers can be wrong. Check important facts.", modifier = Modifier.align(Alignment.CenterHorizontally))
        }
    }

    if (reporting) {
        StanceReportDialog(
            onDismissRequest = { reporting = false },
            categories = listOf(
                StanceReportCategory("wrong", "Incorrect", "Facts or figures are wrong"),
                StanceReportCategory("harm", "Harmful", "Could hurt someone"),
                StanceReportCategory("other", "Something else"),
            ),
            onSubmit = { reporting = false },
        )
    }
}

// Timings of the sample transport, not of any Stance animation.
private const val THINKING_MILLIS = 900L
private const val TOKEN_MILLIS = 60L
