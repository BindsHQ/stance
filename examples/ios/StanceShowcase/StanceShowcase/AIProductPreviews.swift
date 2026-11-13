import StanceUI
import SwiftUI

/// Sample content for the product AI components. Everything is local.
enum AIProductSample {
    static let followUps = [
        StanceSuggestionChip(id: "table", label: "Show the ten biggest changes", icon: .list),
        StanceSuggestionChip(id: "chart", label: "Chart travel by month", icon: .barChart),
        StanceSuggestionChip(id: "explain", label: "Explain the travel increase"),
    ]

    static let questions = [
        StanceSuggestionChip(id: "approval", label: "Who approves travel?"),
        StanceSuggestionChip(id: "limit", label: "What is the trip limit?"),
    ]

    static let summaryPoints = [
        "Travel is up 8% because of two customer workshops in Vienna.",
        "Software subscriptions fall 3% after the tooling consolidation.",
        "Trips over 400 EUR now need approval from the budget owner.",
        "Salaries, the largest line, did not change.",
    ]

    static let searchResults = [
        StanceSearchResult(
            id: "policy", title: "Travel and expenses policy", url: URL(string: "https://docs.binds.si/people/travel-policy"),
            snippet: "Trips over 400 EUR need approval from the budget owner before booking.", highlights: ["approval", "budget owner"],
            source: "docs.binds.si", score: 0.92, reason: "It names who approves travel."
        ),
        StanceSearchResult(
            id: "q3", title: "Q3 budget review", url: URL(string: "https://docs.binds.si/finance/q3-review"),
            snippet: "Travel spend rose 8% on the quarter, driven by two customer workshops.", highlights: ["Travel spend"],
            source: "docs.binds.si", score: 0.74, reason: "It covers recent travel costs."
        ),
    ]

    static let reply = "Thanks for the update. I will review the budget today and reply by Friday."
    /// The suggestion as the remainder after "Thanks for the update.", which is what the field holds.
    static let replyRest = " I will review the budget today and reply by Friday."
    static let original = "Trips that cost more than 400 EUR have to be approved by whoever owns the budget before anyone books them."
    static let rewritten = "Trips over 400 EUR need approval from the budget owner before booking."
    static let searchAnswer = "Trips over 400 EUR need approval from the budget owner before booking."
}

/// Preview compositions for the product AI components, keyed by `components.json` slug.
@MainActor
enum AIProductPreviewCatalog {
    typealias Entry = PreviewCatalog.Entry

    static let entries: [Entry] = [
        Entry("stance-inline-suggestion") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                ProductStateful("Thanks for the update.") { StanceInlineSuggestion("Reply", text: $0, suggestion: AIProductSample.replyRest, helper: "Tab accepts, Escape dismisses, Command and the arrow take one word.") }
                ProductStateful("") { StanceInlineSuggestion("Subject", text: $0, suggestion: nil, placeholder: "Budget review", isLoading: true) }
            }
            .stanceCard()
        },
        Entry("stance-smart-field") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceSmartField("City", status: .suggested, suggestedValue: "Ljubljana", suggestionSource: "Invoice 2026-114", onAccept: {}, onRegenerate: {}) {
                    ProductTextField(text: "")
                }
                StanceSmartField("Budget owner", status: .accepted, suggestionSource: "Travel policy.pdf", onUndo: {}) {
                    ProductTextField(text: "Priya Nair")
                }
            }
            .stanceCard()
        },
        Entry("stance-rewrite-menu") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                Text(AIProductSample.original).stanceText(.body)
                StanceRewriteMenu(allowsCustom: true, onAction: { _ in }) {
                    Text(AIProductSample.rewritten)
                } onAcceptPreview: {} onDiscardPreview: {}
            }
            .stanceCard()
        },
        Entry("stance-summary-card") {
            StanceSummaryCard(
                "Budget changes for FY27", points: AIProductSample.summaryPoints, maxPoints: 3, sources: Array(AISample.sources.prefix(2)),
                updatedAt: AISample.now.addingTimeInterval(-300), now: AISample.now, onRegenerate: {}, onExpand: {}
            )
        },
        Entry("stance-ask-bar") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceAskBar(text: .constant(""), placeholder: "Ask about this page", suggestions: AIProductSample.questions, shortcut: "⌘K") { _ in }
                StanceAskBar(text: .constant("Who approves travel?"), status: .complete) { _ in } answer: {
                    Text(AIProductSample.searchAnswer).stanceText(.body)
                }
            }
        },
        Entry("stance-suggestion-chips") {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                Text("Travel is up 8% and software subscriptions fall 3%.").stanceText(.body)
                StanceSuggestionChips(AIProductSample.followUps, label: "Follow up") { _ in }
                StanceDivider()
                StanceSuggestionChips([], isLoading: true) { _ in }
            }
            .stanceCard()
        },
        Entry("stance-insight-callout") {
            VStack(spacing: StanceSpacing.md) {
                StanceInsightCallout("Travel spend is 8% over plan", tone: .attention, confidence: .medium, actionTitle: "Review trips", action: {}, onDismiss: {}) {
                    Text("Two customer workshops in Vienna were not in the forecast.")
                } evidence: {
                    StanceDescriptionList([("Planned", "42,000 EUR"), ("Actual", "45,360 EUR")])
                }
                StanceInsightCallout("Deployments recovered", tone: .positive) {
                    Text("No mailbox rejected a signature this week.")
                }
            }
        },
        Entry("stance-semantic-search-results") {
            StanceSemanticSearchResults(query: "who approves travel", results: AIProductSample.searchResults) {
                VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                    StanceAIGeneratedLabel(.generated)
                    Text(AIProductSample.searchAnswer).stanceText(.body)
                }
            }
        },
        Entry("stance-copilot-panel") {
            StanceCopilotPanel("Assistant", onClose: {}) {
                StanceThread(showsScrollToLatest: false) {
                    StanceMessage(role: .user) { Text("Shorten the legal disclaimer.") }
                    StanceMessage(role: .assistant) { Text("Done. The disclaimer is now two lines and keeps the registration number.") }
                }
            } context: {
                StanceContextChips([StanceContextItem(id: "page", label: "Sales team signature", icon: .signature, kind: "Template")])
            } composer: {
                StancePromptComposer(text: .constant(""), placeholder: "Ask about this template") { _ in }
            }
            .frame(height: 440)
            .stanceSurface(.surface, cornerRadius: StanceRadius.xl)
        },
    ]
}

/// Text inputs in previews need real state.
private struct ProductStateful<Value, Content: View>: View {
    @State private var value: Value
    private let content: (Binding<Value>) -> Content

    init(_ value: Value, @ViewBuilder content: @escaping (Binding<Value>) -> Content) {
        _value = State(initialValue: value)
        self.content = content
    }

    var body: some View { content($value) }
}

/// A plain text field in the Stance field box, used as the control inside a smart field.
private struct ProductTextField: View {
    @State var text: String
    var onEdit: ((String) -> Void)?
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        TextField("", text: $text)
            .stanceText(.body)
            .padding(.horizontal, StanceSpacing.md)
            .frame(minHeight: StanceSize.touchTarget)
            .background(theme.colors.bgSurface, in: RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
            .overlay { RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous).strokeBorder(theme.colors.borderControl, lineWidth: theme.controlBorderWidth) }
            .onChange(of: text) { _, new in onEdit?(new) }
    }
}

/// The product AI components with their states, for the AI page of the showcase.
struct AIProductDemo: View {
    @State private var reply = "Thanks for the update."
    @State private var city = StanceSmartFieldState(value: "")
    @State private var cityText = ""
    @State private var paragraph = AIProductSample.original
    @State private var rewriteStatus = StanceGenerationStatus.idle
    @State private var hasRewrite = false
    @State private var question = ""
    @State private var askStatus = StanceGenerationStatus.idle
    @State private var searchStatus = StanceGenerationStatus.complete
    @State private var showsInsight = true
    @State private var showsCopilot = false
    @State private var copilotDraft = ""
    @Environment(StanceToastCenter.self) private var toasts
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        StanceSection("In product suggestions", caption: "Quiet by design: a suggestion never moves focus and is never part of the value until accepted.") {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceInlineSuggestion("Reply", text: $reply, suggestion: AIProductSample.replyRest, helper: "Tab accepts, Escape dismisses.", onAcceptWord: { _ in })
                StanceSmartField(
                    "City", status: city.status, suggestedValue: city.suggestedValue, suggestionSource: "Invoice 2026-114",
                    onAccept: {
                        city.accept()
                        cityText = city.value
                    },
                    onUndo: {
                        city.undo()
                        cityText = city.value
                    },
                    onRegenerate: suggestCity
                ) {
                    TextField("", text: $cityText)
                        .stanceText(.body)
                        .padding(.horizontal, StanceSpacing.md)
                        .frame(minHeight: StanceSize.touchTarget)
                        .background(theme.colors.bgSurface, in: RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
                        .overlay { RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous).strokeBorder(theme.colors.borderControl, lineWidth: theme.controlBorderWidth) }
                        .onChange(of: cityText) { _, new in city.edit(new) }
                }
                Text(paragraph).stanceText(.body)
                if hasRewrite {
                    StanceRewriteMenu(allowsCustom: true, status: rewriteStatus, onAction: { _ in rewrite() }) {
                        Text(AIProductSample.rewritten)
                    } onCustomSubmit: { _ in
                        rewrite()
                    } onAcceptPreview: {
                        paragraph = AIProductSample.rewritten
                        hasRewrite = false
                    } onDiscardPreview: {
                        hasRewrite = false
                    }
                } else {
                    StanceRewriteMenu(allowsCustom: true, status: rewriteStatus, onAction: { _ in rewrite() }, onCustomSubmit: { _ in rewrite() })
                }
            }
            .stanceCard()
        }
        StanceSection("Ask and search", caption: "The answer is announced once when it is ready.") {
            StanceAskBar(text: $question, placeholder: "Ask about this page", suggestions: AIProductSample.questions, status: askStatus, shortcut: "⌘K") { _ in
                ask()
            } onClear: {
                askStatus = .idle
            } answer: {
                Text(AIProductSample.searchAnswer).stanceText(.body)
            }
            StanceSemanticSearchResults(query: "who approves travel", results: AIProductSample.searchResults, status: searchStatus) {
                Text(AIProductSample.searchAnswer).stanceText(.body)
            }
            StanceButton("Search again", variant: .outline, size: .small, leadingIcon: .refresh) { search() }
        }
        StanceSection("Summaries and insights", caption: "Tone is stated with an icon and words on the ink scale.") {
            StanceSummaryCard(
                "Budget changes for FY27", points: AIProductSample.summaryPoints, maxPoints: 3, sources: Array(AISample.sources.prefix(2)),
                updatedAt: AISample.now.addingTimeInterval(-300), now: AISample.now, isCollapsible: true,
                onRegenerate: { toasts.show("Summary regenerated") }, onExpand: { toasts.show("Opening the workbook") }
            )
            if showsInsight {
                StanceInsightCallout("Travel spend is 8% over plan", tone: .attention, confidence: .medium, actionTitle: "Review trips", action: { toasts.show("Opening trips") }, onDismiss: { showsInsight = false }) {
                    Text("Two customer workshops in Vienna were not in the forecast.")
                } evidence: {
                    StanceDescriptionList([("Planned", "42,000 EUR"), ("Actual", "45,360 EUR")])
                }
            }
            StanceSuggestionChips(AIProductSample.followUps, label: "Follow up") { chip in toasts.show(chip.label) }
        }
        StanceSection("Copilot panel", caption: "A column beside the page on iPad and a sheet on iPhone.") {
            StanceButton("Open the assistant", variant: .outline, leadingIcon: .sparkle) { showsCopilot = true }
                .stanceCopilotPanel(isPresented: $showsCopilot) {
                    StanceCopilotPanel("Assistant", onClose: { showsCopilot = false }) {
                        StanceThread {
                            StanceMessage(role: .assistant) { Text("Ask me about this template, or tell me what to change.") }
                        }
                    } context: {
                        StanceContextChips([StanceContextItem(id: "page", label: "Sales team signature", icon: .signature, kind: "Template")])
                    } composer: {
                        StancePromptComposer(text: $copilotDraft, placeholder: "Ask about this template") { _ in copilotDraft = "" }
                    }
                }
        }
        .onAppear { if city.status == .idle, cityText.isEmpty { suggestCity() } }
    }

    private func suggestCity() {
        city.beginSuggesting()
        Task {
            try? await Task.sleep(for: .seconds(1))
            city.suggest("Ljubljana")
        }
    }

    private func rewrite() {
        rewriteStatus = .streaming
        hasRewrite = false
        Task {
            try? await Task.sleep(for: .seconds(1))
            hasRewrite = true
            rewriteStatus = .complete
        }
    }

    private func ask() {
        askStatus = .submitted
        Task {
            try? await Task.sleep(for: .seconds(1))
            askStatus = .complete
        }
    }

    private func search() {
        searchStatus = .streaming
        Task {
            try? await Task.sleep(for: .seconds(1))
            searchStatus = .complete
        }
    }
}
