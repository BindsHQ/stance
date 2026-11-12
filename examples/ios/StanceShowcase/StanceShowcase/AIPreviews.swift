import StanceUI
import SwiftUI

/// Preview compositions for the AI components, keyed by `components.json` slug.
/// `PreviewCatalog.all` appends these to the other entries.
@MainActor
enum AIPreviewCatalog {
    typealias Entry = PreviewCatalog.Entry

    static let entries: [Entry] = [
        // Conversation
        Entry("stance-thread") {
            StanceThread(showsScrollToLatest: false) {
                StanceMessage(role: .user) { Text(AISample.question) }
                StanceMessage(role: .assistant, author: "Assistant") { Text(AISample.answer) }
                StanceMessage(role: .user) { Text("Which trips need approval?") }
                StanceMessage(role: .assistant, status: .streaming) { StanceStreamingText("Any trip over 400 EUR", isStreaming: true) }
            }
            .frame(height: 400)
            .stanceSurface(.canvas, cornerRadius: StanceRadius.xl)
        },
        Entry("stance-message") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceMessage(role: .user) { Text(AISample.question) }
                StanceMessage(role: .assistant, author: "Assistant", timestamp: AISample.now) {
                    Text("Travel is up 8% and software subscriptions fall 3%.")
                } actions: {
                    StanceMessageActions(rating: .up, onCopy: {}, onRetry: {}, onRate: { _ in })
                }
                StanceMessage(role: .system) { Text("Priya Nair joined the conversation") }
            }
        },
        Entry("stance-message-group") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceMessageGroup(role: .user, author: "Priya Nair") {
                    StanceMessage(role: .user) { Text("Here is the workbook.") }
                    StanceMessage(role: .user) { Text("What changed since last year?") }
                }
                StanceMessageGroup(role: .assistant, author: "Assistant") {
                    StanceMessage(role: .assistant, variant: .bubble) { Text("Travel is up 8%.") }
                    StanceMessage(role: .assistant, variant: .bubble) { Text("Software subscriptions fall 3%.") }
                }
            }
        },
        Entry("stance-message-actions") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text("Travel is up 8% because of two customer workshops.").stanceText(.body)
                StanceMessageActions(rating: .up, onCopy: {}, onRetry: {}, onEdit: {}, onRate: { _ in })
            }
            .stanceCard()
        },
        Entry("stance-branch-switcher") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text("Travel is up 8% because of two customer workshops.").stanceText(.body)
                HStack(spacing: 0) {
                    StanceMessageActions(onCopy: {}, onRetry: {})
                    StanceBranchSwitcher(count: 3, index: .constant(1))
                }
            }
            .stanceCard()
        },
        Entry("stance-scroll-to-latest") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceMessage(role: .assistant) { Text(AISample.answer) }
                HStack(spacing: StanceSpacing.xl) {
                    Spacer()
                    StanceScrollToLatest {}
                    StanceScrollToLatest(unreadCount: 3) {}
                    Spacer()
                }
            }
            .stanceCard()
        },
        Entry("stance-conversation-list") {
            StanceConversationList(AISample.conversations, selection: .constant("1"), now: AISample.now, onDelete: { _ in }, onPin: { _ in })
                .frame(height: 440)
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
        },
        Entry("stance-thread-empty-state") {
            StanceThreadEmptyState(description: "Ask about your documents, or start from one of these.", starters: AISample.starters) { _ in }
        },
        // Prompt
        Entry("stance-prompt-composer") {
            VStack(spacing: StanceSpacing.md) {
                StancePromptComposer(text: .constant(""), placeholder: "Ask anything") { _ in }
                StancePromptComposer(text: .constant("Which trips need approval before booking?")) { _ in } header: {
                    StanceContextChips([StanceContextItem(id: "1", label: "Travel policy.pdf", icon: .fileText)], onRemove: { _ in }).padding(.top, StanceSpacing.xs)
                } footer: {
                    StanceModelPicker(models: AISample.models, selection: .constant("atlas")).padding(.leading, -StanceSpacing.md)
                }
                StancePromptComposer(text: .constant(""), status: .streaming, placeholder: "Ask a follow up") { _ in } onStop: {}
            }
        },
        Entry("stance-attachment-tray") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceAttachmentTray([
                    StanceAttachmentItem(id: "1", name: "Budget FY27.xlsx", size: 482_000),
                    StanceAttachmentItem(id: "2", name: "Whiteboard.png", kind: .image, progress: 0.4),
                ]) { _ in }
                StanceAttachmentTray([StanceAttachmentItem(id: "3", name: "Recording.mov", error: "Too large to upload")]) { _ in }
                StanceAttachmentTray([StanceAttachmentItem(id: "4", name: "Travel policy.pdf", size: 96_000)], isReadOnly: true)
            }
        },
        Entry("stance-mention-picker") {
            VStack(spacing: StanceSpacing.sm) {
                StanceMentionPicker(isPresented: .constant(true), items: AISample.mentions) { _ in }
                StancePromptComposer(text: .constant("Compare @"), placeholder: "Ask anything") { _ in }
            }
        },
        Entry("stance-slash-command-menu") {
            VStack(spacing: StanceSpacing.sm) {
                StanceSlashCommandMenu(isPresented: .constant(true), commands: AISample.commands) { _ in }
                StancePromptComposer(text: .constant("/"), placeholder: "Ask anything") { _ in }
            }
        },
        Entry("stance-model-picker") {
            HStack {
                StanceModelPicker(models: AISample.models, selection: .constant("atlas"))
                Spacer()
                StanceModelPicker(models: AISample.models, selection: .constant("atlas-pro"), size: .medium)
            }
            .stanceCard()
        },
        Entry("stance-context-chips") {
            StanceContextChips([
                StanceContextItem(id: "1", label: "Budget FY27.xlsx", icon: .file),
                StanceContextItem(id: "2", label: "Travel policy.pdf", icon: .fileText),
                StanceContextItem(id: "3", label: "Selection", icon: .type),
                StanceContextItem(id: "4", label: "Forecast"),
            ], max: 3, onRemove: { _ in }, onAdd: {})
                .stanceCard()
        },
        Entry("stance-voice-input-button") {
            HStack(spacing: StanceSpacing.xl) {
                ForEach(StanceVoiceInputState.allCases, id: \.self) { state in
                    VStack(spacing: StanceSpacing.xs) {
                        StanceVoiceInputButton(state: state, level: 0.7) {}
                        Text(state.description()).stanceText(.caption)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .stanceCard()
        },
        Entry("stance-stop-button") {
            HStack(spacing: StanceSpacing.lg) {
                StanceStopButton(size: .small) {}
                StanceStopButton {}
                StanceStopButton(size: .large) {}
                StanceStopButton(variant: .labelled) {}
            }
            .stanceCard()
        },
        Entry("stance-token-budget-meter") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceTokenBudgetMeter(used: 6400, limit: 16000, variant: .bar)
                StanceTokenBudgetMeter(used: 13600, limit: 16000, variant: .bar)
                HStack(spacing: StanceSpacing.xl) {
                    StanceTokenBudgetMeter(used: 6400, limit: 16000)
                    StanceTokenBudgetMeter(used: 16000, limit: 16000)
                }
                StanceTokenBudgetMeter(used: 6400, limit: 16000, variant: .text)
            }
            .stanceCard()
        },
        // Streaming
        Entry("stance-streaming-text") {
            StanceStreamingText("Travel is up 8% because of two customer workshops in Vienna. Software subscriptions", isStreaming: true, cadence: .instant)
                .stanceText(.body)
                .stanceCard()
        },
        Entry("stance-thinking-indicator") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceThinkingIndicator(elapsed: 4)
                StanceThinkingIndicator("Reading 3 files", variant: .pulse)
                StanceThinkingIndicator("Searching the web", variant: .shimmer, size: .small)
            }
            .stanceCard()
        },
        Entry("stance-reasoning-disclosure") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceReasoningDisclosure(status: .thinking) { Text("Comparing the FY27 workbook with the Q3 review.") }
                StanceReasoningDisclosure(status: .done, duration: 12) { Text(AISample.reasoning) }
            }
            .stanceCard()
        },
        Entry("stance-shimmer-text") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                StanceShimmerText("Searching the web").stanceText(.body)
                StanceShimmerText("Reading Budget FY27.xlsx", isActive: false).stanceText(.bodySmall)
            }
            .stanceCard()
        },
        Entry("stance-generation-progress") {
            VStack(spacing: StanceSpacing.md) {
                StanceGenerationProgress("Creating image", value: 0.4, stage: "Rendering details") {}
                StanceGenerationProgress("Writing report", stage: "Collecting sources")
            }
        },
        Entry("stance-streaming-skeleton") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceStreamingSkeleton()
                StanceStreamingSkeleton(lines: 2, variant: .card)
            }
        },
        Entry("stance-interrupted-state") {
            VStack(spacing: StanceSpacing.md) {
                StanceInterruptedState(reason: .stopped, onRetry: {}, onContinue: {})
                StanceInterruptedState(reason: .network, onRetry: {})
                StanceInterruptedState(reason: .limit, onContinue: {})
            }
        },
        // Trust
        Entry("stance-citation-chip") {
            HStack(spacing: StanceSpacing.sm) {
                Text("Travel is up 8% on the quarter").stanceText(.body)
                StanceCitationChip(index: 1, source: AISample.sources[0])
                StanceCitationChip(index: 2, source: AISample.sources[1])
                Spacer(minLength: 0)
            }
            .stanceCard()
        },
        Entry("stance-source-list") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceSourceList(AISample.sources)
                StanceSourceList(AISample.sources, variant: .list, max: 2)
            }
            .stanceCard()
        },
        Entry("stance-source-preview") { StanceSourcePreview(AISample.sources[0]).stanceCard() },
        Entry("stance-confidence-badge") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                HStack(spacing: StanceSpacing.sm) {
                    StanceConfidenceBadge(.high)
                    StanceConfidenceBadge(.medium)
                }
                HStack(spacing: StanceSpacing.sm) {
                    StanceConfidenceBadge(.low)
                    StanceConfidenceBadge(.unknown)
                }
                StanceConfidenceBadge(.medium, description: "Based on two sources that partly disagree.")
            }
            .stanceCard()
        },
        Entry("stance-ai-generated-label") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                StanceAIGeneratedLabel(.generated)
                StanceAIGeneratedLabel(.assisted, model: "Atlas")
                StanceAIGeneratedLabel(.edited, size: .medium)
            }
            .stanceCard()
        },
        Entry("stance-disclaimer-note") {
            VStack(spacing: StanceSpacing.sm) {
                StancePromptComposer(text: .constant(""), placeholder: "Ask anything") { _ in }
                StanceDisclaimerNote()
            }
        },
        Entry("stance-feedback-bar") { FeedbackPreview() },
        Entry("stance-report-dialog", .screen) { ReportScreen() },
        Entry("stance-sensitive-content-gate") {
            VStack(spacing: StanceSpacing.md) {
                StanceSensitiveContentGate { Text("Hidden") }
                StanceSensitiveContentGate(defaultRevealed: true) {
                    Text("Invoice 2026-114 lists the customer's home address.").stanceText(.body)
                }
                .stanceCard()
            }
        },
    ]
}

private struct FeedbackPreview: View {
    @State private var idle: StanceRating?
    @State private var rated: StanceRating? = .up

    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            StanceFeedbackBar(value: $idle, reasons: AISample.reasons)
            StanceDivider()
            // A rated bar with no detail step: the rating is sent at once.
            StanceFeedbackBar(value: $rated, allowsComment: false)
        }
        .stanceCard()
    }
}

private struct ReportScreen: View {
    @State private var shown = false
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        NavigationStack {
            Page(title: "Assistant") {
                StanceMessage(role: .user) { Text(AISample.question) }
                StanceMessage(role: .assistant, author: "Assistant") {
                    Text(AISample.answer)
                } actions: {
                    StanceButton("Report", variant: .outline, size: .small) { shown = true }.accessibilityIdentifier("preview-trigger")
                }
            }
        }
        .stanceReportDialog(isPresented: $shown, categories: AISample.reportCategories) { _ in }
    }
}
