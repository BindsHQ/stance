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
import com.bindshq.stance.components.ai.StanceAttachment
import com.bindshq.stance.components.ai.StanceAttachmentTray
import com.bindshq.stance.components.ai.StanceBranchSwitcher
import com.bindshq.stance.components.ai.StanceCitationChip
import com.bindshq.stance.components.ai.StanceContextChips
import com.bindshq.stance.components.ai.StanceContextItem
import com.bindshq.stance.components.ai.StanceDisclaimerNote
import com.bindshq.stance.components.ai.StanceGenerationStatus
import com.bindshq.stance.components.ai.StanceInterruptedReason
import com.bindshq.stance.components.ai.StanceInterruptedState
import com.bindshq.stance.components.ai.StanceMessage
import com.bindshq.stance.components.ai.StanceMessageActions
import com.bindshq.stance.components.ai.StanceMessageRole
import com.bindshq.stance.components.ai.StanceModelPicker
import com.bindshq.stance.components.ai.StancePromptComposer
import com.bindshq.stance.components.ai.StanceRating
import com.bindshq.stance.components.ai.StanceReasoningDisclosure
import com.bindshq.stance.components.ai.StanceReasoningStatus
import com.bindshq.stance.components.ai.StanceReportCategory
import com.bindshq.stance.components.ai.StanceReportDialog
import com.bindshq.stance.components.ai.StanceSourceList
import com.bindshq.stance.components.ai.StanceStarter
import com.bindshq.stance.components.ai.StanceStreamingText
import com.bindshq.stance.components.ai.StanceThinkingIndicator
import com.bindshq.stance.components.ai.StanceThread
import com.bindshq.stance.components.ai.StanceThreadEmptyState
import com.bindshq.stance.components.ai.StanceTokenBudgetMeter
import com.bindshq.stance.components.ai.StanceTokenBudgetVariant
import com.bindshq.stance.components.ai.StanceVoiceInputButton
import com.bindshq.stance.components.ai.StanceVoiceInputState
import com.bindshq.stance.components.ai.rememberStanceMessageCustomActions
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
)

/**
 * A full conversation screen built only from Stance components. The reply is canned and
 * revealed by a local timer: there is no network and no model.
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
