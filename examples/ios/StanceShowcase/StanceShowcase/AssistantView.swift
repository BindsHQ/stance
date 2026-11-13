import StanceUI
import SwiftUI

/// Sample content for the AI demos. Everything is local: the showcase makes no network requests.
enum AISample {
    static let now = Date(timeIntervalSince1970: 1_794_390_060)

    static let sources = [
        StanceSource(id: "q3", title: "Q3 budget review", url: URL(string: "https://docs.binds.si/finance/q3-review"), domain: "docs.binds.si", snippet: "Travel spend rose 8% on the quarter, driven by two customer workshops in Vienna."),
        StanceSource(id: "policy", title: "Travel and expenses policy", url: URL(string: "https://docs.binds.si/people/travel-policy"), domain: "docs.binds.si", snippet: "Trips over 400 EUR need approval from the budget owner before booking."),
        StanceSource(id: "forecast", title: "FY27 forecast workbook", url: URL(string: "https://docs.binds.si/finance/fy27"), domain: "docs.binds.si", snippet: "Software subscriptions are forecast to fall 3% after the tooling consolidation."),
    ]

    static let models = [
        StanceModel(id: "atlas", name: "Atlas", description: "Everyday work", badges: ["Fast"]),
        StanceModel(id: "atlas-pro", name: "Atlas Pro", description: "Long documents", badges: ["Reasoning", "Vision"]),
        StanceModel(id: "atlas-lab", name: "Atlas Lab", description: "Not available on your plan", isDisabled: true),
    ]

    static let starters = [
        StanceStarter(id: "summary", label: "Summarise a document", description: "Key points in one paragraph", icon: .fileText),
        StanceStarter(id: "compare", label: "Compare two versions", description: "What changed and why it matters", icon: .copy),
        StanceStarter(id: "draft", label: "Draft a reply", description: "A short, polite answer to a customer", icon: .mail),
    ]

    static let mentions = [
        StanceSuggestion(id: "budget", label: "Budget FY27.xlsx", description: "Updated yesterday", icon: .file, group: "Files"),
        StanceSuggestion(id: "policy", label: "Travel policy.pdf", description: "12 pages", icon: .fileText, group: "Files"),
        StanceSuggestion(id: "priya", label: "Priya Nair", description: "Finance lead", icon: .user, group: "People"),
    ]

    static let commands = [
        StanceSlashCommand(id: "summarise", name: "summarise", description: "Shorten the attached document", icon: .fileText),
        StanceSlashCommand(id: "translate", name: "translate", description: "Translate the last answer", icon: .globe),
        StanceSlashCommand(id: "clear", name: "clear", description: "Start a new conversation", icon: .trash),
    ]

    static let conversations = [
        StanceConversation(id: "1", title: "Budget changes for FY27", updatedAt: now.addingTimeInterval(-1200), isPinned: true),
        StanceConversation(id: "2", title: "Reply to the Vienna workshop invite", updatedAt: now.addingTimeInterval(-7200)),
        StanceConversation(id: "3", title: "Signature template wording", updatedAt: now.addingTimeInterval(-90000)),
        StanceConversation(id: "4", title: "Onboarding checklist for new sales hires", updatedAt: now.addingTimeInterval(-400_000)),
        StanceConversation(id: "5", title: "Translate the release notes", updatedAt: now.addingTimeInterval(-3_000_000)),
    ]

    static let reasons = [
        StanceFeedbackReason(id: "accurate", label: "Accurate"),
        StanceFeedbackReason(id: "clear", label: "Easy to follow"),
        StanceFeedbackReason(id: "sources", label: "Good sources"),
    ]

    static let reportCategories = [
        StanceReportCategory(id: "incorrect", label: "Incorrect", description: "Facts or figures are wrong"),
        StanceReportCategory(id: "harmful", label: "Harmful or unsafe"),
        StanceReportCategory(id: "other", label: "Something else"),
    ]

    static let question = "What changed in the FY27 budget compared with last year?"
    static let reasoning = "Compared the FY27 workbook with the Q3 review, then checked the travel policy for the approval limit."
    static let answer = "Three things changed. Travel is up 8% because of two customer workshops in Vienna. Software subscriptions fall 3% after the tooling consolidation. Trips over 400 EUR now need approval from the budget owner before booking."
    static let followUp = "The largest single line is still salaries, which did not change. If you want, I can list the ten biggest movements as a table."
}

/// One turn in the sample conversation.
struct SampleTurn: Identifiable {
    let id = UUID()
    let role: StanceMessageRole
    var text: String
    var status: StanceGenerationStatus = .complete
    var reasoningSeconds: TimeInterval?
    var showsSources = false
    var rating: StanceRating?
    /// Set for a turn that is an agent run rather than text: the phase it opens at.
    var agentPhase: AgentRunPhase?
}

/// A realistic conversation screen composed from the Stance AI components.
/// Responses are canned text streamed by a local timer. "Run a budget review" starts a sample
/// agent run: a plan to approve, tool calls, an approval prompt, a diff to review, then a
/// generated table and chart with follow up prompts.
struct AssistantView: View {
    @State private var turns: [SampleTurn] = [
        SampleTurn(role: .user, text: AISample.question),
        SampleTurn(role: .assistant, text: AISample.answer, reasoningSeconds: 12, showsSources: true),
    ]
    @State private var draft = ""
    @State private var status = StanceGenerationStatus.idle
    @State private var model = "atlas"
    @State private var context = [StanceContextItem(id: "budget", label: "Budget FY27.xlsx", icon: .file, kind: "File")]
    @State private var showsMentions = false
    @State private var showsCommands = false
    @State private var showsReport = false
    @State private var elapsed: TimeInterval = 0
    @State private var generation: Task<Void, Never>?
    @Environment(\.stanceTheme) private var theme
    @Environment(StanceToastCenter.self) private var toasts

    /// `-assistant-empty` starts with no messages, to show the empty state.
    private let startsEmpty = ProcessInfo.processInfo.arguments.contains("-assistant-empty")

    /// Prompts offered under the latest answer. The first one starts the sample agent run.
    private let followUps = [StanceSuggestionChip(id: "agent", label: "Run a budget review", icon: .sparkle)] + AIProductSample.followUps

    var body: some View {
        VStack(spacing: 0) {
            if turns.isEmpty {
                ScrollView {
                    StanceThreadEmptyState(description: "Ask about your documents, or start from one of these.", starters: AISample.starters) { starter in
                        send(starter.label)
                    }
                }
            } else {
                StanceThread {
                    ForEach($turns) { $turn in message($turn) }
                    if status == .submitted {
                        StanceThinkingIndicator(elapsed: elapsed)
                    }
                    if !status.isActive, let last = turns.last, last.role == .assistant, last.agentPhase == nil {
                        StanceSuggestionChips(followUps, label: "Follow up") { chip in
                            if chip.id == "agent" { startAgentRun() } else { send(chip.label) }
                        }
                    }
                }
            }
            composer
        }
        .background(theme.colors.bgCanvas.ignoresSafeArea())
        .navigationTitle("Assistant")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("New chat", systemImage: "square.and.pencil") {
                    stop()
                    turns = []
                    status = .idle
                }
            }
        }
        .stanceReportDialog(isPresented: $showsReport, categories: AISample.reportCategories) { _ in
            try? await Task.sleep(for: .seconds(0.8))
            toasts.show("Report sent", tone: .success)
        }
        .onAppear {
            if startsEmpty { turns = [] }
            if let phase = AgentRunPhase.launch, !turns.contains(where: { $0.agentPhase != nil }) {
                turns = [SampleTurn(role: .user, text: "Run a budget review"), SampleTurn(role: .assistant, text: "", agentPhase: phase)]
            }
        }
        .onChange(of: draft) { _, new in
            showsMentions = StanceMentionPicker.activeQuery(in: new) != nil
            showsCommands = StanceSlashCommandMenu.query(in: new) != nil
        }
    }

    @ViewBuilder private func message(_ turn: Binding<SampleTurn>) -> some View {
        let value = turn.wrappedValue
        if value.role == .user {
            StanceMessage(role: .user) { Text(value.text) }
        } else if let phase = value.agentPhase {
            AgentRunView(startingAt: phase) { send($0) }
        } else {
            StanceMessage(role: .assistant, status: value.status, author: "Assistant") {
                VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                    if let seconds = value.reasoningSeconds {
                        StanceReasoningDisclosure(status: .done, duration: seconds) { Text(AISample.reasoning) }
                    }
                    StanceStreamingText(value.text, isStreaming: value.status == .streaming)
                }
            } actions: {
                if value.status == .complete {
                    StanceMessageActions(rating: value.rating) {
                        toasts.show("Copied")
                    } onRetry: {
                        respond(replacing: value.id)
                    } onRate: { rating in
                        turn.wrappedValue.rating = rating
                    } extra: {
                        Menu {
                            Button("Report", systemImage: "flag") { showsReport = true }
                        } label: {
                            Image(systemName: "ellipsis")
                                .foregroundStyle(theme.colors.fgMuted)
                                .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                                .contentShape(Rectangle())
                        }
                        .accessibilityLabel("More")
                    }
                }
            } footer: {
                if value.status == .stopped {
                    StanceInterruptedState(reason: .stopped, onRetry: { respond(replacing: value.id) })
                } else if value.showsSources, value.status == .complete {
                    StanceSourceList(AISample.sources)
                }
            }
        }
    }

    private var composer: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            StanceMentionPicker(isPresented: $showsMentions, query: StanceMentionPicker.activeQuery(in: draft) ?? "", items: AISample.mentions) { item in
                if let at = draft.lastIndex(of: "@") { draft = String(draft[..<at]) }
                if !context.contains(where: { $0.id == item.id }) {
                    context.append(StanceContextItem(id: item.id, label: item.label, icon: item.icon, kind: item.group))
                }
            }
            StanceSlashCommandMenu(isPresented: $showsCommands, query: StanceSlashCommandMenu.query(in: draft) ?? "", commands: AISample.commands) { command in
                draft = ""
                if command.id == "clear" { turns = [] } else { send("/\(command.name)") }
            }
            StancePromptComposer(text: $draft, status: status, placeholder: "Ask anything") { message in
                send(message)
            } onStop: {
                stop()
            } header: {
                if !context.isEmpty {
                    StanceContextChips(context, onRemove: { item in context.removeAll { $0.id == item.id } })
                        .padding(.top, StanceSpacing.xs)
                }
            } footer: {
                HStack {
                    StanceModelPicker(models: AISample.models, selection: $model)
                    Spacer()
                    StanceTokenBudgetMeter(used: 2400 + turns.reduce(0) { $0 + $1.text.count * 6 }, limit: 16000, variant: .text)
                        .padding(.trailing, StanceSpacing.sm)
                }
                .padding(.leading, -StanceSpacing.md)
            }
            StanceDisclaimerNote()
        }
        .padding(.horizontal, StanceSpacing.lg)
        .padding(.vertical, StanceSpacing.sm)
    }

    private func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        turns.append(SampleTurn(role: .user, text: trimmed))
        respond(replacing: nil)
    }

    /// Adds the sample agent run to the conversation, starting with its plan.
    private func startAgentRun() {
        stop()
        turns.append(SampleTurn(role: .user, text: "Run a budget review"))
        turns.append(SampleTurn(role: .assistant, text: "", agentPhase: .plan))
        status = .idle
    }

    /// Streams a canned answer in small chunks, the way a model would.
    private func respond(replacing id: UUID?) {
        stop()
        if let id { turns.removeAll { $0.id == id } }
        status = .submitted
        elapsed = 0
        let reply = turns.count > 2 ? AISample.followUp : AISample.answer
        generation = Task {
            for _ in 0 ..< 2 {
                try? await Task.sleep(for: .seconds(1))
                if Task.isCancelled { return }
                elapsed += 1
            }
            var turn = SampleTurn(role: .assistant, text: "", status: .streaming, reasoningSeconds: 2, showsSources: true)
            turns.append(turn)
            status = .streaming
            for word in reply.split(separator: " ") {
                try? await Task.sleep(for: .milliseconds(70))
                if Task.isCancelled { return }
                turn.text += (turn.text.isEmpty ? "" : " ") + word
                if let index = turns.firstIndex(where: { $0.id == turn.id }) { turns[index].text = turn.text }
            }
            if let index = turns.firstIndex(where: { $0.id == turn.id }) { turns[index].status = .complete }
            status = .complete
        }
    }

    private func stop() {
        generation?.cancel()
        generation = nil
        if let index = turns.lastIndex(where: { $0.status == .streaming }) { turns[index].status = .stopped }
        if status.isActive { status = .stopped }
    }
}

/// Every AI component with its variants and states.
struct AIDemo: View {
    @State private var draft = ""
    @State private var status = StanceGenerationStatus.idle
    @State private var model = "atlas"
    @State private var branch = 1
    @State private var rating: StanceRating?
    @State private var feedback: StanceRating?
    @State private var selection: String? = "1"
    @State private var conversations = AISample.conversations
    @State private var voice = StanceVoiceInputState.idle
    @State private var streaming = false
    @State private var streamed = AISample.answer
    @State private var showsReport = false
    @State private var showsMentions = true
    @State private var showsCommands = true
    @State private var used = 9600.0
    @State private var context = [
        StanceContextItem(id: "1", label: "Budget FY27.xlsx", icon: .file, kind: "File"),
        StanceContextItem(id: "2", label: "Travel policy.pdf", icon: .fileText, kind: "File"),
        StanceContextItem(id: "3", label: "Selection", icon: .type, kind: "Text"),
    ]
    @Environment(StanceToastCenter.self) private var toasts

    var body: some View {
        Page(title: "AI") {
            StanceSection("Conversation", caption: "Presentational: the app owns the data and passes status in.") {
                NavigationLink {
                    AssistantView()
                } label: {
                    StanceListRow("Open the full conversation", subtitle: "A composed screen with simulated streaming") { StanceIcon(.sparkle) } trailing: { StanceIcon(.chevronRight, size: 16) }
                        .stanceCard(padding: StanceSpacing.md)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("open-conversation")
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    StanceMessage(role: .user) { Text(AISample.question) }
                    StanceMessage(role: .assistant, author: "Assistant", timestamp: AISample.now) {
                        Text(AISample.answer)
                    } actions: {
                        HStack(spacing: 0) {
                            StanceMessageActions(rating: rating, onCopy: { toasts.show("Copied") }, onRetry: {}, onRate: { rating = $0 })
                            StanceBranchSwitcher(count: 3, index: $branch)
                        }
                    }
                    StanceMessage(role: .system) { Text("Priya Nair joined the conversation") }
                }
                .stanceCard()
                StanceThreadEmptyState(description: "Ask about your documents.", starters: Array(AISample.starters.prefix(2))) { _ in }.stanceCard(padding: 0)
            }
            StanceSection("Past conversations", caption: "Swipe or touch and hold to rename, pin or delete.") {
                StanceConversationList(conversations, selection: $selection, now: AISample.now) { item, title in
                    if let index = conversations.firstIndex(of: item) { conversations[index].title = title }
                } onDelete: { item in
                    conversations.removeAll { $0.id == item.id }
                } onPin: { item in
                    if let index = conversations.firstIndex(of: item) { conversations[index].isPinned.toggle() }
                }
                .frame(height: 360)
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
            }
            StanceSection("Prompt", caption: "Send becomes stop while a response is generated.") {
                StancePromptComposer(text: $draft, status: status, placeholder: "Ask anything") { _ in
                    status = .streaming
                } onStop: {
                    status = .stopped
                } header: {
                    StanceContextChips(context, max: 2, onRemove: { item in context.removeAll { $0.id == item.id } }, onAdd: {}).padding(.top, StanceSpacing.xs)
                } trailing: {
                    StanceVoiceInputButton(state: voice, level: 0.6) { voice = voice == .listening ? .idle : .listening }
                } footer: {
                    StanceModelPicker(models: AISample.models, selection: $model).padding(.leading, -StanceSpacing.md)
                }
                StanceAttachmentTray([
                    StanceAttachmentItem(id: "1", name: "Budget FY27.xlsx", size: 482_000),
                    StanceAttachmentItem(id: "2", name: "Whiteboard.png", kind: .image, progress: 0.4),
                    StanceAttachmentItem(id: "3", name: "Recording.mov", error: "Too large"),
                ]) { _ in }
                StanceMentionPicker(isPresented: $showsMentions, items: AISample.mentions) { _ in showsMentions = true }
                StanceSlashCommandMenu(isPresented: $showsCommands, commands: AISample.commands) { _ in showsCommands = true }
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceSlider("Tokens used", value: $used, in: 0 ... 16000, step: 400)
                    StanceTokenBudgetMeter(used: Int(used), limit: 16000, variant: .bar)
                    HStack(spacing: StanceSpacing.lg) {
                        StanceTokenBudgetMeter(used: Int(used), limit: 16000)
                        StanceTokenBudgetMeter(used: Int(used), limit: 16000, variant: .text)
                    }
                    HStack(spacing: StanceSpacing.md) {
                        StanceStopButton {}
                        StanceStopButton(variant: .labelled) {}
                    }
                }
                .stanceCard()
            }
            StanceSection("Streaming", caption: "Motion uses the stream, shimmer and pulse tokens, and stops under Reduce Motion.") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceThinkingIndicator(elapsed: 4)
                    StanceThinkingIndicator("Reading 3 files", variant: .pulse)
                    StanceThinkingIndicator("Searching the web", variant: .shimmer)
                    StanceReasoningDisclosure(status: .done, duration: 12) { Text(AISample.reasoning) }
                    StanceStreamingText(streamed, isStreaming: streaming)
                    StanceButton("Stream again", variant: .outline, size: .small) { replay() }
                }
                .stanceCard()
                StanceGenerationProgress("Creating image", value: 0.4, stage: "Rendering details") {}
                StanceGenerationProgress("Writing report", stage: "Collecting sources")
                StanceStreamingSkeleton().stanceCard()
                StanceInterruptedState(reason: .stopped, onRetry: {}, onContinue: {})
                StanceInterruptedState(reason: .network, onRetry: {})
            }
            StanceSection("Trust", caption: "Confidence, sources and AI labels are stated in words.") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    HStack(spacing: StanceSpacing.sm) {
                        Text("Travel is up 8%").stanceText(.body)
                        StanceCitationChip(index: 1, source: AISample.sources[0])
                        StanceCitationChip(index: 2, source: AISample.sources[1])
                    }
                    StanceSourceList(AISample.sources)
                    HStack(spacing: StanceSpacing.sm) {
                        StanceConfidenceBadge(.high)
                        StanceConfidenceBadge(.low)
                        StanceConfidenceBadge(.unknown)
                    }
                    StanceAIGeneratedLabel(.generated, model: "Atlas")
                    StanceAIGeneratedLabel(.edited, size: .medium)
                    StanceFeedbackBar(value: $feedback, reasons: AISample.reasons) { _ in }
                    StanceDisclaimerNote()
                }
                .stanceCard()
                StanceSourcePreview(AISample.sources[0]).stanceCard()
                StanceSensitiveContentGate { Text("Invoice 2026-114 lists the customer's home address.").stanceText(.body) }
                StanceButton("Report a response", variant: .outline, leadingIcon: .alertTriangle) { showsReport = true }
            }
            AIAgentsDemo()
            AIOutputDemo()
            AIProductDemo()
        }
        .stanceReportDialog(isPresented: $showsReport, categories: AISample.reportCategories) { _ in
            try? await Task.sleep(for: .seconds(0.8))
            toasts.show("Report sent", tone: .success)
        }
    }

    private func replay() {
        streamed = ""
        streaming = true
        Task {
            for word in AISample.answer.split(separator: " ") {
                try? await Task.sleep(for: .milliseconds(70))
                streamed += (streamed.isEmpty ? "" : " ") + word
            }
            streaming = false
        }
    }
}
