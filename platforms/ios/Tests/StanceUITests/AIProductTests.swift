import Foundation
import SwiftUI
import Testing
@testable import StanceUI

private let english = Locale(identifier: "en")
private let arabic = Locale(identifier: "ar")
private let spanish = Locale(identifier: "es")

@Suite("AI product logic")
struct AIProductLogicTests {
    typealias Inline = StanceInlineSuggestionLogic

    @Test("The ghost text is only the part after what is typed")
    func ghost() {
        #expect(Inline.ghost(value: "Thanks for", suggestion: "Thanks for the update", anchor: "") == " the update")
        #expect(Inline.ghost(value: "", suggestion: "Hello", anchor: "") == "Hello")
        #expect(Inline.ghost(value: "Thanks for the update", suggestion: "Thanks for the update", anchor: "") == nil)
        #expect(Inline.ghost(value: "Thanks", suggestion: nil, anchor: "") == nil)
    }

    @Test("The suggestion is the remainder after the value, as on the web")
    func remainder() {
        #expect(Inline.ghost(value: "Thanks for", suggestion: " the update") == " the update")
        #expect(Inline.ghost(value: "Thanks", suggestion: "") == nil)
        #expect(Inline.accepting(value: "Thanks for", suggestion: " the update") == "Thanks for the update")
        #expect(Inline.acceptingWord(value: "Thanks for", suggestion: " the update") == "Thanks for the")
        // Typing through the suggestion shrinks it; typing something else hides it.
        #expect(Inline.ghost(value: "Thanks for th", suggestion: " the update", anchor: "Thanks for") == "e update")
        #expect(Inline.ghost(value: "Thanks for a", suggestion: " the update", anchor: "Thanks for") == nil)
        #expect(Inline.acceptWordArrow(isRightToLeft: false) == "right")
        #expect(Inline.acceptWordArrow(isRightToLeft: true) == "left")
    }

    @Test("A suggestion that no longer matches the typed text is hidden")
    func stale() {
        #expect(Inline.ghost(value: "Thanks fox", suggestion: "Thanks for the update", anchor: "") == nil)
        #expect(Inline.ghost(value: "thanks", suggestion: "Thanks for the update", anchor: "") == nil)
        #expect(Inline.accepting(value: "Thanks fox", suggestion: "Thanks for the update", anchor: "") == "Thanks fox")
        #expect(Inline.acceptingWord(value: "Thanks fox", suggestion: "Thanks for the update", anchor: "") == "Thanks fox")
    }

    @Test("Accepting takes the whole suggestion, or one word with the space before it")
    func accept() {
        let suggestion = "Thanks for the update"
        #expect(Inline.accepting(value: "Thanks", suggestion: suggestion, anchor: "") == suggestion)
        #expect(Inline.acceptingWord(value: "Thanks", suggestion: suggestion, anchor: "") == "Thanks for")
        #expect(Inline.acceptingWord(value: "Thanks f", suggestion: suggestion, anchor: "") == "Thanks for")
        #expect(Inline.acceptingWord(value: "Thanks for the", suggestion: suggestion, anchor: "") == suggestion)
        // The value never holds the suggestion until it is accepted.
        let value = "Thanks"
        _ = Inline.ghost(value: value, suggestion: suggestion)
        #expect(value == "Thanks")
    }

    @Test("Smart field: suggest, accept, undo")
    func smartField() {
        var state = StanceSmartFieldState(value: "")
        #expect(state.status == .idle && !state.isAIFilled && !state.canUndo)
        state.beginSuggesting()
        #expect(state.status == .suggesting)
        do { let accepted = state.accept(); #expect(!accepted) }
        state.suggest("Ljubljana")
        #expect(state.status == .suggested && state.value == "" && state.suggestedValue == "Ljubljana")
        do { let accepted = state.accept(); #expect(accepted) }
        #expect(state.status == .accepted && state.value == "Ljubljana" && state.isAIFilled && state.canUndo)
        do { let undone = state.undo(); #expect(undone) }
        #expect(state.status == .idle && state.value == "" && !state.canUndo)
        do { let undone = state.undo(); #expect(!undone) }
    }

    @Test("Smart field: editing clears the AI mark, dismissing keeps the value")
    func smartFieldEditing() {
        var state = StanceSmartFieldState(value: "Vienna")
        state.suggest("Ljubljana")
        state.accept()
        state.edit("Ljubljana")
        #expect(state.isAIFilled, "the same value is not an edit")
        state.edit("Ljubljana, Slovenia")
        #expect(state.status == .idle && !state.isAIFilled && !state.canUndo && state.value == "Ljubljana, Slovenia")
        state.suggest("Maribor")
        state.dismiss()
        #expect(state.status == .idle && state.suggestedValue == nil && state.value == "Ljubljana, Slovenia")
        #expect(StanceSmartFieldStatus.allCases.map(\.rawValue) == ["idle", "suggesting", "suggested", "accepted"])
    }

    @Test("Rewrite actions flatten to the choices, and are found at any depth")
    func rewrite() {
        let actions = StanceRewriteAction.standard(locale: english)
        #expect(actions.map(\.id) == ["improve", "shorten", "lengthen", "tone"])
        #expect(StanceRewriteAction.flattened(actions).map(\.id) == ["improve", "shorten", "lengthen", "tone.professional", "tone.friendly", "tone.direct"])
        #expect(StanceRewriteAction.find("tone.friendly", in: actions)?.label == "Friendly")
        #expect(StanceRewriteAction.find("translate", in: actions) == nil)
        #expect(StanceRewriteAction.path(to: "tone.friendly", in: actions) == ["Change tone", "Friendly"])
        #expect(StanceRewriteAction.path(to: "missing", in: actions).isEmpty)
        #expect(StanceRewriteAction.standard(locale: spanish).first?.label == "Mejorar la redacción")
        #expect(StanceRewriteMenu<EmptyView>.instruction("  ") == nil)
        #expect(StanceRewriteMenu<EmptyView>.instruction(" Make it formal \n") == "Make it formal")
    }

    @Test("Summary points collapse past the maximum")
    func summary() {
        typealias Card = StanceSummaryCard<EmptyView>
        let points = ["One", "Two", "Three", "Four"]
        #expect(Card.visiblePoints(points, max: nil, showsAll: false).shown == points)
        #expect(Card.visiblePoints(points, max: 2, showsAll: false).shown == ["One", "Two"])
        #expect(Card.visiblePoints(points, max: 2, showsAll: false).hidden == 2)
        #expect(Card.visiblePoints(points, max: 2, showsAll: true).hidden == 0)
        #expect(Card.visiblePoints(points, max: 9, showsAll: false).hidden == 0)
        let now = Date(timeIntervalSince1970: 1_794_390_060)
        #expect(Card.updatedText(now.addingTimeInterval(-300), now: now, locale: english) == "Updated 5 minutes ago")
        #expect(Card.updatedText(now.addingTimeInterval(-300), now: now, locale: spanish) == "Actualizado hace 5 minutos")
    }

    @Test("The ask bar sends trimmed questions, never blank ones or while an answer is in progress")
    func askBar() {
        typealias Bar = StanceAskBar<EmptyView>
        #expect(Bar.submission(text: "  What changed?  ", status: .idle) == "What changed?")
        #expect(Bar.submission(text: " \n ", status: .idle) == nil)
        #expect(Bar.submission(text: "What changed?", status: .submitted) == nil)
        #expect(Bar.submission(text: "What changed?", status: .streaming) == nil)
        #expect(Bar.submission(text: "What changed?", status: .complete) == "What changed?")
        #expect(Bar.submission(text: "What changed?", status: .error) == "What changed?")
        #expect(Bar.showsSuggestions(status: .idle, count: 2))
        #expect(!Bar.showsSuggestions(status: .idle, count: 0))
        #expect(!Bar.showsSuggestions(status: .complete, count: 2))
    }

    @Test("Suggestion chips are unique and found by identifier")
    func chips() {
        let items = [StanceSuggestionChip(id: "a", label: "Show as a table"), StanceSuggestionChip(id: "b", label: "Explain"), StanceSuggestionChip(id: "a", label: "Again")]
        #expect(StanceSuggestionChips.unique(items).map(\.label) == ["Show as a table", "Explain"])
        #expect(StanceSuggestionChips.item("b", in: items)?.label == "Explain")
        #expect(StanceSuggestionChips.item("z", in: items) == nil)
    }

    @Test("Highlights are found ignoring case and accents, in order, and merged")
    func highlights() {
        typealias Results = StanceSemanticSearchResults<EmptyView, EmptyView>
        let snippet = "Travel spend rose 8% after the Travel policy changed in Café Wien."
        let ranges = Results.highlightRanges(in: snippet, highlights: ["travel", "cafe", "missing", " "])
        #expect(ranges.map { String(snippet[$0]) } == ["Travel", "Travel", "Café"])
        let merged = Results.highlightRanges(in: "travel policy", highlights: ["travel pol", "policy"])
        #expect(merged.count == 1 && String("travel policy"[merged[0]]) == "travel policy")
        let segments = Results.segments(of: "Trips over 400 EUR need approval", highlights: ["400 EUR"])
        #expect(segments.map(\.text) == ["Trips over ", "400 EUR", " need approval"])
        #expect(segments.map(\.isHighlighted) == [false, true, false])
        #expect(Results.segments(of: "Plain", highlights: []).map(\.text) == ["Plain"])
        #expect(Results.segments(of: "", highlights: ["x"]).isEmpty)
    }

    @Test("Scores are stated in words and links are limited to http and https")
    func scoreAndLinks() {
        typealias Results = StanceSemanticSearchResults<EmptyView, EmptyView>
        #expect(Results.scoreText(0.92, locale: english) == "92% match")
        #expect(Results.scoreText(4, locale: english) == "100% match")
        #expect(Results.scoreText(-1, locale: english) == "0% match")
        #expect(Results.scoreText(0.5, locale: arabic).hasPrefix("تطابق"))
        #expect(Results.isSafeLink(URL(string: "https://docs.binds.si/a")))
        #expect(Results.isSafeLink(URL(string: "HTTP://docs.binds.si/a")))
        #expect(!Results.isSafeLink(URL(string: "javascript:alert(1)")))
        #expect(!Results.isSafeLink(URL(string: "file:///etc/hosts")))
        #expect(!Results.isSafeLink(nil))
    }

    @Test("The copilot panel width is clamped and the leading side is a column in regular width")
    func copilot() {
        typealias Layout = StanceCopilotPanelLayout
        #expect(Layout.clampedWidth(nil) == Layout.defaultWidth)
        #expect(Layout.clampedWidth(10) == Layout.minWidth)
        #expect(Layout.clampedWidth(4000) == Layout.maxWidth)
        #expect(Layout.clampedWidth(.infinity) == Layout.defaultWidth)
        #expect(Layout.clampedWidth(Layout.minWidth + 10) == Layout.minWidth + 10)
        #expect(Layout.minWidth < Layout.defaultWidth && Layout.defaultWidth < Layout.maxWidth)
        #expect(Layout.usesInspector(side: .trailing, isRegularWidth: true))
        #expect(Layout.usesInspector(side: .trailing, isRegularWidth: false))
        #expect(Layout.usesInspector(side: .leading, isRegularWidth: false))
        #expect(!Layout.usesInspector(side: .leading, isRegularWidth: true))
    }

    @Test("Built in words are localised")
    func words() {
        #expect(StanceInsightTone.attention.label(locale: english) == "Needs attention")
        #expect(StanceInsightTone.positive.label(locale: spanish) == "Buena noticia")
        #expect(StanceInsightTone.neutral.label(locale: arabic) == "ملاحظة")
        #expect(StanceLocalization.string("stance.ai.inline.accept", locale: english) == "Accept suggestion")
        #expect(StanceLocalization.string("stance.ai.summary.showMore \(3)", locale: english) == "Show 3 more")
        #expect(StanceLocalization.string("stance.ai.smartField.suggestion \("Ljubljana")", locale: english) == "Suggested: Ljubljana")
    }
}

/// Renders the product components off screen in every theme, at accessibility sizes and right to left.
@Suite("AI product rendering")
@MainActor
struct AIProductRenderingTests {
    struct Gallery: View {
        @State private var draft = "Thanks for"
        @State private var city = "Ljubljana"
        @State private var question = ""
        @State private var open = true
        let source = StanceSource(id: "1", title: "Quarterly report", url: URL(string: "https://www.example.com/q3"), snippet: "Revenue grew 12% on the quarter.")
        let chips = [StanceSuggestionChip(id: "1", label: "Show as a table", icon: .list), StanceSuggestionChip(id: "2", label: "Explain the travel increase")]

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceInlineSuggestion("Reply", text: $draft, suggestion: "Thanks for the update, I will review it today.", onAcceptWord: { _ in })
                StanceInlineSuggestion("Notes", text: $draft, suggestion: "Thanks for the long explanation of the changes", axis: .vertical, isLoading: true)
                StanceSmartField("City", status: .suggesting) { TextField("", text: $city) }
                StanceSmartField("City", status: .suggested, suggestedValue: "Ljubljana", suggestionSource: "Invoice 2026-114", onAccept: {}, onRegenerate: {}) { TextField("", text: $city) }
                StanceSmartField("City", status: .accepted, suggestionSource: "Invoice 2026-114", onUndo: {}, onRegenerate: {}) { TextField("", text: $city) }
                StanceRewriteMenu(allowsCustom: true, onAction: { _ in }) {
                    Text("Trips over 400 EUR need approval before booking.")
                } onAcceptPreview: {} onDiscardPreview: {}
                StanceRewriteMenu(status: .streaming, onAction: { _ in })
                StanceSummaryCard(points: ["Travel is up 8%", "Software falls 3%", "Approval over 400 EUR"], maxPoints: 2, sources: [source], updatedAt: Date(timeIntervalSince1970: 1_794_390_000), now: Date(timeIntervalSince1970: 1_794_390_060), onRegenerate: {}, onExpand: {})
                StanceSummaryCard("Thread summary", status: .submitted, isCollapsible: true) { Text("Custom content") }
                StanceSummaryCard(points: [], status: .error)
                StanceAskBar(text: $question, suggestions: chips, shortcut: "⌘K") { _ in }
                StanceAskBar(text: .constant("What changed?"), status: .complete) { _ in } answer: { Text("Travel is up 8%.") }
                StanceAskBar(text: .constant("What changed?"), status: .submitted) { _ in } answer: { Text("") }
                StanceSuggestionChips(chips) { _ in }
                StanceSuggestionChips(chips, wraps: false) { _ in }
                StanceSuggestionChips([], isLoading: true) { _ in }
                StanceInsightCallout("Travel spend is 8% over plan", tone: .attention, confidence: .medium, actionTitle: "Review trips", action: {}, onDismiss: {}) {
                    Text("Two workshops in Vienna were not in the forecast.")
                } evidence: {
                    Text("Q3 review, travel line.")
                }
                StanceInsightCallout("Deployments recovered", tone: .positive) { Text("Failures fell to zero this week.") }
                StanceInsightCallout("Most signatures use the 2026 logo") { Text("44 of 48 mailboxes.") }
                StanceSemanticSearchResults(query: "travel approval", results: [
                    .init(id: "1", title: "Travel and expenses policy", url: URL(string: "https://docs.binds.si/p"), snippet: "Trips over 400 EUR need approval from the budget owner.", highlights: ["approval", "400 EUR"], source: "docs.binds.si", score: 0.92, reason: "Describes who approves travel"),
                    .init(id: "2", title: "Q3 budget review", snippet: "Travel spend rose 8% on the quarter."),
                ]) { Text("Trips over 400 EUR need approval.") }
                StanceSemanticSearchResults(query: "travel", results: [], status: .streaming)
                StanceSemanticSearchResults(query: "zebra", results: [])
                StanceCopilotPanel("Assistant", onClose: {}) {
                    Text("How can I help with this page?").padding()
                } context: {
                    Text("Sales team signature").stanceText(.caption)
                } headerActions: {
                    Button("New") {}
                } composer: {
                    StancePromptComposer(text: $question) { _ in }
                }
                .frame(height: 320)
            }
            .padding()
            .frame(width: 390)
        }
    }

    private func image<V: View>(_ view: V) throws -> CGImage {
        let renderer = ImageRenderer(content: view)
        renderer.scale = 1
        return try #require(renderer.cgImage)
    }

    @Test("Every product component renders in every theme", arguments: StanceTheme.Mode.allCases, [DynamicTypeSize.large, .accessibility5])
    func renders(mode: StanceTheme.Mode, size: DynamicTypeSize) throws {
        let theme = StanceTheme(mode: mode)
        let rendered = try image(
            Gallery()
                .environment(\.stanceTheme, theme)
                .environment(\.dynamicTypeSize, size)
                .foregroundStyle(theme.colors.fgDefault)
                .background(theme.colors.bgCanvas)
        )
        #expect(rendered.width == 390)
        #expect(rendered.height > 2400)
    }

    @Test("Layout reflows at the largest text size and right to left")
    func reflows() throws {
        let standard = try image(Gallery())
        let large = try image(Gallery().environment(\.dynamicTypeSize, .accessibility5))
        // macOS has no Dynamic Type, so sizes only grow there where a layout switches on purpose.
        #if os(iOS)
        #expect(large.height > standard.height)
        #else
        #expect(large.height >= standard.height)
        #endif
        let arabic = try image(
            Gallery()
                .environment(\.locale, Locale(identifier: "ar"))
                .environment(\.layoutDirection, .rightToLeft)
        )
        #expect(arabic.width == 390 && arabic.height > 2400)
    }

    @Test("A presented copilot panel renders beside its content")
    func copilotPresentation() throws {
        let rendered = try image(
            Text("Page")
                .frame(width: 800, height: 400)
                .stanceCopilotPanel(isPresented: .constant(true), side: .leading, width: 360) {
                    StanceCopilotPanel { Text("Thread") }
                }
                .environment(\.horizontalSizeClass, .regular)
        )
        #expect(rendered.height == 400)
        #expect(rendered.width > 800)
    }

    @Test("Product controls keep the 44pt minimum target")
    func targets() throws {
        func size<V: View>(_ view: V) throws -> CGSize {
            let rendered = try image(view.environment(\.stanceTheme, .light))
            return CGSize(width: rendered.width, height: rendered.height)
        }
        #expect(try size(StanceSuggestionChips([.init(id: "1", label: "Explain")]) { _ in }).height >= 44)
        #expect(try size(StanceAskBar(text: .constant("")) { _ in }.frame(width: 320)).height >= 44)
        #expect(try size(StanceRewriteMenu(onAction: { _ in })).height >= 44)
        #expect(try size(StanceInlineSuggestion("Reply", text: .constant(""), suggestion: nil).frame(width: 320)).height >= 44)
        #expect(try size(StanceProductIconButton(icon: .x, label: "Close") {}).width >= 44)
    }
}
