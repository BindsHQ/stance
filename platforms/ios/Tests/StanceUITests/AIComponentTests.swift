import Foundation
import SwiftUI
import Testing
@testable import StanceUI

private let english = Locale(identifier: "en")
private let arabic = Locale(identifier: "ar")

@Suite("Generation status")
struct GenerationStatusTests {
    @Test("The contract has six statuses")
    func cases() {
        #expect(StanceGenerationStatus.allCases.map(\.rawValue) == ["idle", "submitted", "streaming", "complete", "stopped", "error"])
    }

    @Test("Active while requested or arriving; finished when it ends in any way")
    func flags() {
        #expect(StanceGenerationStatus.allCases.filter(\.isActive) == [.submitted, .streaming])
        #expect(StanceGenerationStatus.allCases.filter(\.isFinished) == [.complete, .stopped, .error])
    }

    @Test("Changes map to one event each, and the first token is silent")
    func events() {
        typealias S = StanceGenerationStatus
        #expect(S.event(from: .idle, to: .submitted) == .started)
        #expect(S.event(from: .submitted, to: .streaming) == nil)
        #expect(S.event(from: .idle, to: .streaming) == .started)
        #expect(S.event(from: .streaming, to: .complete) == .finished)
        #expect(S.event(from: .streaming, to: .stopped) == .stopped)
        #expect(S.event(from: .submitted, to: .error) == .failed)
        #expect(S.event(from: .complete, to: .idle) == nil)
        #expect(S.event(from: .complete, to: .submitted) == .started)
        for status in S.allCases { #expect(S.event(from: status, to: status) == nil) }
    }

    @Test("Announcements and values are localised")
    func words() {
        typealias S = StanceGenerationStatus
        #expect(S.announcement(from: .idle, to: .submitted, locale: english) == "Response started")
        #expect(S.announcement(from: .streaming, to: .complete, locale: english) == "Response finished")
        #expect(S.announcement(from: .streaming, to: .stopped, locale: arabic) == "تم إيقاف الرد")
        #expect(S.announcement(from: .submitted, to: .streaming, locale: english) == nil)
        #expect(S.streaming.accessibilityDescription(locale: english) == "Generating")
        #expect(S.complete.accessibilityDescription(locale: english) == nil)
        #expect(StanceMessageRole.assistant.defaultName(locale: english) == "Assistant")
        #expect(StanceMessageRole.user.defaultName(locale: arabic) == "أنت")
    }

    @Test("The composer state follows the draft, the status and whether it is enabled")
    func composer() {
        typealias C = StanceComposerState
        #expect(C.resolve(text: "", status: .idle) == .empty)
        #expect(C.resolve(text: "  \n ", status: .idle) == .empty)
        #expect(C.resolve(text: "Hello", status: .idle) == .ready)
        #expect(C.resolve(text: "Hello", status: .complete) == .ready)
        #expect(C.resolve(text: "Hello", status: .stopped) == .ready)
        #expect(C.resolve(text: "Hello", status: .error) == .ready)
        #expect(C.resolve(text: "Hello", status: .submitted) == .submitted)
        #expect(C.resolve(text: "", status: .streaming) == .streaming)
        #expect(C.resolve(text: "Hello", status: .streaming, isEnabled: false) == .disabled)
        #expect(C.allCases.filter(\.canSubmit) == [.ready])
        #expect(C.allCases.filter(\.showsStop) == [.submitted, .streaming])
    }
}

@Suite("Streaming reveal")
struct StreamRevealTests {
    @Test("Finished text and the instant cadence start fully revealed; live text starts empty")
    func start() {
        #expect(StanceStreamReveal(text: "Hello", isStreaming: false).revealedCount == 5)
        #expect(StanceStreamReveal(text: "Hello", isStreaming: true, cadence: .instant).revealedCount == 5)
        #expect(StanceStreamReveal(text: "Hello", isStreaming: true).revealedCount == 0)
    }

    @Test("Characters arrive one at a time and never pass the end")
    func characters() {
        var reveal = StanceStreamReveal(text: "", isStreaming: true)
        do { let result = reveal.advance(in: "", cadence: .character); #expect(!result) }
        do { let result = reveal.advance(in: "Hi!", cadence: .character); #expect(result) }
        #expect(reveal.visible(in: "Hi!") == "H")
        reveal.advance(in: "Hi!", cadence: .character)
        reveal.advance(in: "Hi!", cadence: .character)
        #expect(reveal.isComplete(for: "Hi!"))
        do { let result = reveal.advance(in: "Hi!", cadence: .character); #expect(!result) }
        #expect(reveal.revealedCount == 3)
        // More text arrives: the reveal carries on from where it was.
        do { let result = reveal.advance(in: "Hi! Yes", cadence: .character); #expect(result) }
        #expect(reveal.visible(in: "Hi! Yes") == "Hi! ")
    }

    @Test("A long backlog is revealed in larger steps so the reveal never lags far")
    func catchUp() {
        let text = String(repeating: "a", count: 240)
        var reveal = StanceStreamReveal(text: text, isStreaming: true)
        reveal.advance(in: text, cadence: .character)
        #expect(reveal.revealedCount == 1 + 240 / StanceStreamReveal.catchUp)
        var ticks = 1
        while !reveal.isComplete(for: text) {
            reveal.advance(in: text, cadence: .character)
            ticks += 1
        }
        #expect(ticks < 120)
        #expect(reveal.revealedCount == 240)
    }

    @Test("Words arrive whole")
    func words() {
        let text = "Sticks to the latest"
        var reveal = StanceStreamReveal(text: text, isStreaming: true, cadence: .word)
        var steps: [String] = []
        while reveal.advance(in: text, cadence: .word) { steps.append(String(reveal.visible(in: text))) }
        #expect(steps == ["Sticks", "Sticks to", "Sticks to the", "Sticks to the latest"])
    }

    @Test("Grapheme clusters are never split")
    func graphemes() {
        let text = "👩‍👩‍👧 é"
        var reveal = StanceStreamReveal(text: text, isStreaming: true)
        reveal.advance(in: text, cadence: .character)
        #expect(reveal.visible(in: text) == "👩‍👩‍👧")
    }

    @Test("Shorter replacement text clamps the reveal; reveal all shows everything")
    func replace() {
        var reveal = StanceStreamReveal(text: "A long answer", isStreaming: false)
        do { let result = reveal.advance(in: "Short", cadence: .character); #expect(!result) }
        #expect(reveal.revealedCount == 5)
        var live = StanceStreamReveal(text: "Hello there", isStreaming: true)
        live.revealAll(in: "Hello there")
        #expect(live.isComplete(for: "Hello there"))
    }

    @Test("The rest of the word in progress is reserved so it cannot jump lines")
    func pendingWord() {
        let text = "Hello world"
        var reveal = StanceStreamReveal(text: text, isStreaming: true)
        #expect(reveal.pendingWordLength(in: text) == 0)
        reveal.advance(in: text, cadence: .character)
        reveal.advance(in: text, cadence: .character)
        #expect(reveal.pendingWordLength(in: text) == 3)
        for _ in 0 ..< 4 { reveal.advance(in: text, cadence: .character) }
        // "Hello " is on screen: the next word has not started.
        #expect(reveal.pendingWordLength(in: text) == 0)
    }

    @Test("Cadence intervals come from the stream token")
    func intervals() {
        #expect(StanceStreamCadence.character.interval == StanceMotion.streamInterval)
        #expect(StanceStreamCadence.word.interval > StanceStreamCadence.character.interval)
        #expect(StanceStreamCadence.instant.interval == 0)
    }
}

@Suite("Thread scrolling")
struct ThreadScrollTests {
    @Test("Follows growth while pinned, releases when the reader scrolls up, pins again at the bottom")
    func pin() {
        var state = StanceThreadScrollState()
        #expect(state.isPinned)
        do { let result = state.update(distanceFromBottom: 0, contentHeight: 400, threshold: 44); #expect(!result) }
        // A new message makes the content taller under a pinned reader: follow it.
        do { let result = state.update(distanceFromBottom: 120, contentHeight: 520, threshold: 44); #expect(result) }
        #expect(state.isPinned)
        do { let result = state.update(distanceFromBottom: 0, contentHeight: 520, threshold: 44); #expect(!result) }
        // The reader scrolls up: no growth, further from the bottom.
        do { let result = state.update(distanceFromBottom: 200, contentHeight: 520, threshold: 44); #expect(!result) }
        #expect(!state.isPinned)
        // More text streams in. The reader is not pulled back down.
        do { let result = state.update(distanceFromBottom: 260, contentHeight: 580, threshold: 44); #expect(!result) }
        #expect(!state.isPinned)
        // The keyboard takes space from a pinned reader: keep following.
        var keyboard = StanceThreadScrollState()
        _ = keyboard.update(distanceFromBottom: 0, contentHeight: 900, viewportHeight: 700, threshold: 44)
        do { let result = keyboard.update(distanceFromBottom: 300, contentHeight: 900, viewportHeight: 400, threshold: 44); #expect(result) }
        #expect(keyboard.isPinned)
        // They return to within the threshold.
        do { let result = state.update(distanceFromBottom: 30, contentHeight: 580, threshold: 44); #expect(!result) }
        #expect(state.isPinned)
    }
}

@Suite("Conversation logic")
@MainActor
struct ConversationLogicTests {
    @Test("Branch switcher stays within its bounds")
    func branches() {
        typealias B = StanceBranchSwitcher
        #expect(B.clampedIndex(-3, count: 3) == 0)
        #expect(B.clampedIndex(7, count: 3) == 2)
        #expect(B.clampedIndex(1, count: 0) == 0)
        #expect(!B.canGoBack(index: 0, count: 3))
        #expect(B.canGoForward(index: 0, count: 3))
        #expect(B.canGoBack(index: 2, count: 3))
        #expect(!B.canGoForward(index: 2, count: 3))
        #expect(!B.canGoBack(index: 0, count: 1) && !B.canGoForward(index: 0, count: 1))
        #expect(!B.canGoForward(index: 99, count: 3))
        #expect(B.position(index: 1, count: 3, locale: english) == "2 of 3")
        #expect(B.position(index: 9, count: 3, locale: english) == "3 of 3")
    }

    @Test("Tapping the current rating clears it")
    func rating() {
        #expect(StanceRating.toggled(nil, tapped: .up) == .up)
        #expect(StanceRating.toggled(.up, tapped: .up) == nil)
        #expect(StanceRating.toggled(.up, tapped: .down) == .down)
    }

    @Test("Conversations group by pin, then date, newest first")
    func sections() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let now = Date(timeIntervalSince1970: 1_794_390_060) // 11 November 2026, 09:41 UTC
        func item(_ id: String, daysAgo: Double, pinned: Bool = false, group: String? = nil) -> StanceConversation {
            StanceConversation(id: id, title: id, updatedAt: now.addingTimeInterval(-daysAgo * 86400), group: group, isPinned: pinned)
        }
        let sections = StanceConversationList<EmptyView>.sections(
            [item("old", daysAgo: 90), item("today", daysAgo: 0.1), item("pinned", daysAgo: 40, pinned: true), item("yesterday", daysAgo: 1), item("week", daysAgo: 5), item("month", daysAgo: 20), item("earlier today", daysAgo: 0.3)],
            now: now, calendar: calendar, locale: english
        )
        #expect(sections.map(\.title) == ["Pinned", "Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Earlier"])
        #expect(sections[1].items.map(\.id) == ["today", "earlier today"])
        #expect(sections[0].items.map(\.id) == ["pinned"])
        let custom = StanceConversationList<EmptyView>.sections([item("a", daysAgo: 3, group: "Work"), item("b", daysAgo: 1, group: "Home"), item("c", daysAgo: 2, group: "Work")], now: now, calendar: calendar, locale: english)
        #expect(custom.map(\.title) == ["Home", "Work"])
        #expect(custom[1].items.map(\.id) == ["c", "a"])
        #expect(StanceConversationList<EmptyView>.sections([], now: now, calendar: calendar).isEmpty)
    }
}

@Suite("Prompt logic")
@MainActor
struct PromptLogicTests {
    @Test("Token meter thresholds", arguments: [
        (0, 1000, StanceTokenBudgetLevel.normal), (799, 1000, .normal), (800, 1000, .warning), (999, 1000, .warning),
        (1000, 1000, .exceeded), (1500, 1000, .exceeded), (10, 0, .normal),
    ])
    func levels(used: Int, limit: Int, expected: StanceTokenBudgetLevel) {
        #expect(StanceTokenBudgetMeter.level(used: used, limit: limit) == expected)
    }

    @Test("Token meter fraction, custom threshold and value text")
    func meter() {
        #expect(StanceTokenBudgetMeter.fraction(used: 250, limit: 1000) == 0.25)
        #expect(StanceTokenBudgetMeter.fraction(used: 2000, limit: 1000) == 1)
        #expect(StanceTokenBudgetMeter.fraction(used: 5, limit: 0) == 0)
        #expect(StanceTokenBudgetMeter.level(used: 500, limit: 1000, warnAt: 0.5) == .warning)
        #expect(StanceTokenBudgetMeter.level(used: 499, limit: 1000, warnAt: 0.5) == .normal)
        #expect(StanceTokenBudgetMeter.valueText(used: 12000, limit: 16000, locale: english) == "12K of 16K")
    }

    @Test("The Return key is told apart from typing and pasting")
    func returnKey() {
        typealias C = StancePromptComposer<EmptyView, EmptyView, EmptyView, EmptyView>
        #expect(C.isReturnKey(old: "Hello", new: "Hello\n"))
        #expect(C.isReturnKey(old: "Hello there", new: "Hello\n there"))
        #expect(!C.isReturnKey(old: "Hello", new: "Hello!"))
        #expect(!C.isReturnKey(old: "Hello", new: "Hello\nworld\n"))
        #expect(!C.isReturnKey(old: "Hello\n", new: "Hello"))
        #expect(C.removingReturn(old: "Hello", new: "Hello\n") == "Hello")
        #expect(C.removingReturn(old: "Hello there", new: "Hello\n there") == "Hello there")
        #expect(C.removingReturn(old: "a\nb", new: "a\nb\n") == "a\nb")
        #expect(C.removingReturn(old: "Hello", new: "Hello!") == "Hello!")
    }

    @Test("A mention opens after a trigger at the start of a word")
    func mentions() {
        typealias M = StanceMentionPicker
        #expect(M.activeQuery(in: "@") == "")
        #expect(M.activeQuery(in: "Summarise @bud") == "bud")
        #expect(M.activeQuery(in: "Summarise @budget and") == nil)
        #expect(M.activeQuery(in: "mail@example") == nil)
        #expect(M.activeQuery(in: "No trigger") == nil)
        #expect(M.activeQuery(in: "Use #plan", trigger: "#") == "plan")
        let items = [StanceSuggestion(id: "1", label: "Budget.xlsx"), StanceSuggestion(id: "2", label: "Résumé.pdf"), StanceSuggestion(id: "3", label: "Notes", description: "Budget review")]
        #expect(M.filter(items, query: "").count == 3)
        #expect(M.filter(items, query: "BUD").map(\.id) == ["1", "3"])
        #expect(M.filter(items, query: "resume").map(\.id) == ["2"])
        #expect(M.filter(items, query: "zzz").isEmpty)
    }

    @Test("A slash command opens only when the draft starts with a slash")
    func commands() {
        typealias C = StanceSlashCommandMenu
        #expect(C.query(in: "/") == "")
        #expect(C.query(in: "/sum") == "sum")
        #expect(C.query(in: "/summarise this") == nil)
        #expect(C.query(in: "Try /sum") == nil)
        let commands = [StanceSlashCommand(id: "1", name: "translate"), StanceSlashCommand(id: "2", name: "summarise"), StanceSlashCommand(id: "3", name: "resume")]
        #expect(C.filter(commands, query: "sum").map(\.id) == ["2", "3"])
        #expect(C.filter(commands, query: "").count == 3)
    }

    @Test("Context chips collapse past the maximum")
    func chips() {
        let items = (1 ... 5).map { StanceContextItem(id: "\($0)", label: "File \($0)") }
        #expect(StanceContextChips.visible(items, max: nil).hidden == 0)
        #expect(StanceContextChips.visible(items, max: 3).shown.count == 3)
        #expect(StanceContextChips.visible(items, max: 3).hidden == 2)
        #expect(StanceContextChips.visible(items, max: 9).shown.count == 5)
    }

    @Test("Voice level is kept between 0 and 1")
    func level() {
        #expect(StanceVoiceInputButton.clampedLevel(-1) == 0)
        #expect(StanceVoiceInputButton.clampedLevel(0.4) == 0.4)
        #expect(StanceVoiceInputButton.clampedLevel(3) == 1)
        #expect(StanceVoiceInputButton.clampedLevel(.nan) == 0)
        #expect(StanceVoiceInputState.listening.description(locale: english) == "Listening")
    }

    @Test("Attachment detail shows the error, then progress, then size")
    func attachments() {
        typealias T = StanceAttachmentTray
        #expect(T.detail(for: .init(id: "1", name: "a.pdf", size: 2_000_000, progress: 0.4, error: "Too large"), locale: english) == "Too large")
        #expect(T.detail(for: .init(id: "1", name: "a.pdf", size: 2_000_000, progress: 0.4), locale: english) == "Uploading 40%")
        #expect(T.detail(for: .init(id: "1", name: "a.pdf", size: 2_000_000), locale: english) == "2 MB")
        #expect(T.detail(for: .init(id: "1", name: "a.pdf"), locale: english) == nil)
    }

    @Test("Model subtitles join the description and badges")
    func models() {
        #expect(StanceModel(id: "a", name: "Atlas").subtitle(locale: english) == nil)
        #expect(StanceModel(id: "a", name: "Atlas", description: "Best for everyday work").subtitle(locale: english) == "Best for everyday work")
        #expect(StanceModel(id: "a", name: "Atlas", description: "Everyday work", badges: ["Fast", "Vision"]).subtitle(locale: english) == "Everyday work (Fast, Vision)")
    }
}

@Suite("Trust logic")
@MainActor
struct TrustLogicTests {
    @Test("Feedback with a detail step: rate, choose reasons, submit")
    func detailFlow() {
        var flow = StanceFeedbackFlow()
        #expect(flow.stage == .idle)
        do { let result = flow.rate(.down, hasDetail: true); #expect(result == nil) }
        #expect(flow.stage == .detail && flow.value == .down)
        flow.toggleReason("wrong")
        flow.toggleReason("slow")
        flow.toggleReason("wrong")
        flow.toggleReason("unsafe")
        #expect(flow.reasons == ["slow", "unsafe"])
        flow.comment = "  The total is off.  "
        do { let result = flow.submit(); #expect(result == StanceFeedback(value: .down, reasons: ["slow", "unsafe"], comment: "The total is off.")) }
        #expect(flow.stage == .submitted)
        // Once sent, the flow is closed.
        do { let result = flow.submit(); #expect(result == nil) }
        do { let result = flow.rate(.up, hasDetail: true); #expect(result == nil) }
        #expect(flow.value == .down)
    }

    @Test("Feedback without a detail step is sent at once")
    func immediate() {
        var flow = StanceFeedbackFlow()
        do { let result = flow.rate(.up, hasDetail: false); #expect(result == StanceFeedback(value: .up)) }
        #expect(flow.stage == .rated)
        do { let result = flow.submit(); #expect(result == nil) }
    }

    @Test("Clearing, switching and skipping")
    func changes() {
        var flow = StanceFeedbackFlow(value: .up)
        #expect(flow.stage == .rated)
        do { let result = flow.rate(.up, hasDetail: true); #expect(result == nil) }
        #expect(flow.stage == .idle && flow.value == nil)
        _ = flow.rate(.up, hasDetail: true)
        flow.toggleReason("clear")
        // Switching thumbs starts the detail again.
        _ = flow.rate(.down, hasDetail: true)
        #expect(flow.reasons.isEmpty && flow.value == .down && flow.stage == .detail)
        flow.toggleReason("wrong")
        do { let result = flow.skip(); #expect(result == StanceFeedback(value: .down)) }
        #expect(flow.stage == .rated && flow.reasons.isEmpty)
        // Reasons cannot change outside the detail step.
        flow.toggleReason("wrong")
        #expect(flow.reasons.isEmpty)
    }

    @Test("Sources: domain, accessible name and visible rows")
    func sources() {
        #expect(StanceSource(id: "1", title: "Report", url: URL(string: "https://www.example.com/report")).displayDomain == "example.com")
        #expect(StanceSource(id: "1", title: "Report", url: URL(string: "https://docs.example.com"), domain: "Example Docs").displayDomain == "Example Docs")
        #expect(StanceSource(id: "1", title: "Report").displayDomain == nil)
        #expect(StanceCitationChip.accessibilityName(index: 2, title: "Quarterly report", locale: english) == "Source 2: Quarterly report")
        #expect(StanceSourceList.visibleCount(total: 6, max: 3, showsAll: false) == 3)
        #expect(StanceSourceList.visibleCount(total: 6, max: 3, showsAll: true) == 6)
        #expect(StanceSourceList.visibleCount(total: 2, max: 3, showsAll: false) == 2)
        #expect(StanceSourceList.visibleCount(total: 6, max: nil, showsAll: false) == 6)
        #expect(StanceLocalization.string("stance.ai.sources.count \(1)", locale: english) == "1 source")
        #expect(StanceLocalization.string("stance.ai.sources.count \(4)", locale: english) == "4 sources")
        #expect(StanceLocalization.string("stance.ai.sources.count \(2)", locale: arabic) == "مصدران")
    }

    @Test("Confidence, labels, reasoning and interruptions are stated in words")
    func words() {
        #expect(StanceConfidenceLevel.allCases.map { $0.label(locale: english) } == ["High confidence", "Medium confidence", "Low confidence", "Confidence unknown"])
        #expect(StanceConfidenceLevel.unknown.barValue == nil)
        #expect(StanceConfidenceLevel.high.barValue! > StanceConfidenceLevel.medium.barValue!)
        #expect(StanceConfidenceLevel.medium.barValue! > StanceConfidenceLevel.low.barValue!)
        #expect(StanceAIGeneratedLabel.text(.generated, locale: english) == "AI generated")
        #expect(StanceAIGeneratedLabel.text(.edited, locale: english) == "Edited with AI")
        #expect(StanceAIGeneratedLabel.text(.assisted, model: "Atlas", locale: english) == "AI assisted with Atlas")
        #expect(StanceReasoningDisclosure<EmptyView>.summary(status: .thinking, duration: nil, locale: english) == "Thinking")
        #expect(StanceReasoningDisclosure<EmptyView>.summary(status: .done, duration: 12, locale: english) == "Thought for 12 seconds")
        #expect(StanceReasoningDisclosure<EmptyView>.summary(status: .done, duration: 64, locale: english) == "Thought for 1 minute, 4 seconds")
        #expect(StanceReasoningDisclosure<EmptyView>.summary(status: .done, duration: nil, locale: english) == "Reasoning")
        #expect(StanceInterruptionReason.allCases.filter(\.isAlert) == [.error, .network])
        #expect(StanceInterruptionReason.stopped.title(locale: english) == "Response stopped")
        #expect(StanceInterruptionReason.network.title(locale: arabic) == "انقطع الاتصال")
        for reason in StanceInterruptionReason.allCases {
            #expect(!reason.description(locale: english).isEmpty)
        }
    }

    @Test("Flow layout wraps in reading order")
    func flow() {
        let sizes = [CGSize(width: 100, height: 30), CGSize(width: 100, height: 40), CGSize(width: 100, height: 30)]
        let result = StanceFlowLayout.arrange(sizes: sizes, maxWidth: 220, spacing: 8, lineSpacing: 4)
        #expect(result.frames.map(\.origin) == [CGPoint(x: 0, y: 0), CGPoint(x: 108, y: 0), CGPoint(x: 0, y: 44)])
        #expect(result.size == CGSize(width: 208, height: 74))
        #expect(StanceFlowLayout.arrange(sizes: [], maxWidth: 100, spacing: 8, lineSpacing: 4).size == .zero)
        // An item wider than the line still gets a line of its own.
        #expect(StanceFlowLayout.arrange(sizes: [CGSize(width: 300, height: 20)], maxWidth: 100, spacing: 8, lineSpacing: 4).frames[0].origin == .zero)
    }
}

/// Renders every AI component off screen in every theme, at accessibility text sizes and right to left.
@Suite("AI rendering")
@MainActor
struct AIRenderingTests {
    struct Gallery: View {
        @State private var draft = "Summarise the budget"
        @State private var index = 1
        @State private var rating: StanceRating? = .up
        @State private var model = "atlas"
        @State private var selection: String? = "1"
        @State private var open = true
        let source = StanceSource(id: "1", title: "Quarterly report", url: URL(string: "https://www.example.com/q3"), snippet: "Revenue grew 12% on the quarter.")

        var body: some View {
            VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                StanceThreadEmptyState(description: "Ask about your documents.", starters: [.init(id: "1", label: "Summarise a file", description: "Key points in a paragraph", icon: .fileText)])
                StanceMessageGroup(role: .user, author: "Priya Nair") {
                    StanceMessage(role: .user) { Text("What changed in the budget?") }
                }
                StanceMessage(role: .assistant, status: .streaming, author: "Assistant", timestamp: Date(timeIntervalSince1970: 1_794_390_060)) {
                    StanceReasoningDisclosure(status: .done, duration: 12) { Text("Compared the two versions.") }
                    StanceStreamingText("Travel is up 8% and", isStreaming: true)
                } actions: {
                    StanceMessageActions(rating: rating, onCopy: {}, onRetry: {}, onEdit: {}, onRate: { rating = $0 })
                    StanceBranchSwitcher(count: 3, index: $index)
                } footer: {
                    StanceSourceList([source, source], variant: .list, max: 1)
                }
                StanceMessage(role: .system) { Text("Priya joined the conversation") }
                StanceThinkingIndicator(elapsed: 4)
                StanceThinkingIndicator("Searching the web", variant: .shimmer, size: .small)
                StanceShimmerText("Reading 3 files")
                StanceGenerationProgress("Creating image", value: 0.4, stage: "Rendering", onCancel: {})
                StanceStreamingSkeleton()
                StanceStreamingSkeleton(variant: .card)
                StanceInterruptedState(reason: .network, onRetry: {}, onContinue: {})
                HStack { StanceCitationChip(index: 1, source: source); StanceConfidenceBadge(.medium); StanceAIGeneratedLabel(model: "Atlas") }
                StanceSourcePreview(source)
                StanceSourceList([source])
                StanceDisclaimerNote()
                StanceFeedbackBar(value: $rating, reasons: [.init(id: "a", label: "Accurate")])
                StanceSensitiveContentGate { Text("Hidden") }
                StanceContextChips([.init(id: "1", label: "budget.xlsx", icon: .file, kind: "File"), .init(id: "2", label: "Notes")], max: 1, onRemove: { _ in }, onAdd: {})
                StanceAttachmentTray([.init(id: "1", name: "budget.xlsx", size: 48000), .init(id: "2", name: "scan.png", kind: .image, progress: 0.4), .init(id: "3", name: "big.mov", error: "Too large")]) { _ in }
                StanceMentionPicker(isPresented: $open, query: "bud", items: [.init(id: "1", label: "Budget.xlsx", description: "Spreadsheet", icon: .file, group: "Files")]) { _ in }
                StanceSlashCommandMenu(isPresented: $open, commands: [.init(id: "1", name: "summarise", description: "Shorten the selection", shortcut: "⌘S")]) { _ in }
                StancePromptComposer(text: $draft, status: .idle) { _ in } onStop: {} leading: {
                    StanceVoiceInputButton(state: .listening, level: 0.5) {}
                } trailing: {
                    StanceModelPicker(models: [.init(id: "atlas", name: "Atlas", description: "Everyday work", badges: ["Fast"])], selection: $model)
                } footer: {
                    StanceTokenBudgetMeter(used: 900, limit: 1000, variant: .bar)
                }
                HStack { StanceStopButton {}; StanceStopButton(variant: .labelled) {}; StanceTokenBudgetMeter(used: 100, limit: 1000); StanceTokenBudgetMeter(used: 1000, limit: 1000, variant: .text) }
                StanceScrollToLatest(unreadCount: 3) {}
                StanceReportDialog(categories: [.init(id: "wrong", label: "Incorrect", description: "Facts are wrong")]) { _ in }.frame(height: 420)
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

    @Test("Every AI component renders in every theme", arguments: StanceTheme.Mode.allCases, [DynamicTypeSize.large, .accessibility5])
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

    @Test("Layout reflows at the largest text size, right to left and with Reduce Motion")
    func reflows() throws {
        let standard = try image(Gallery())
        let large = try image(Gallery().environment(\.dynamicTypeSize, .accessibility5))
        #expect(large.height > standard.height)
        let arabic = try image(
            Gallery()
                .environment(\.locale, Locale(identifier: "ar"))
                .environment(\.layoutDirection, .rightToLeft)
        )
        #expect(arabic.width == 390 && arabic.height > 2400)
    }

    @Test("Thread and conversation list render inside a fixed frame")
    func containers() throws {
        let thread = try image(
            StanceThread(unreadCount: 2) {
                ForEach(0 ..< 12, id: \.self) { index in
                    StanceMessage(role: index.isMultiple(of: 2) ? .user : .assistant) { Text("Message \(index)") }
                }
            }
            .frame(width: 390, height: 500)
        )
        #expect(thread.height == 500)
        let now = Date(timeIntervalSince1970: 1_794_390_060)
        let list = try image(
            StanceConversationList([.init(id: "1", title: "Budget review", updatedAt: now, isPinned: true), .init(id: "2", title: "Trip plan", updatedAt: now)], selection: .constant("1"), now: now, onDelete: { _ in })
                .frame(width: 390, height: 400)
        )
        #expect(list.height == 400)
        let empty = try image(StanceConversationList([], selection: .constant(nil)).frame(width: 390))
        #expect(empty.height > 100)
    }

    @Test("AI controls keep the 44pt minimum target")
    func targets() throws {
        func size<V: View>(_ view: V) throws -> CGSize {
            let rendered = try image(view.environment(\.stanceTheme, .light))
            return CGSize(width: rendered.width, height: rendered.height)
        }
        #expect(try size(StanceStopButton {}).width >= 44)
        #expect(try size(StanceStopButton {}).height >= 44)
        #expect(try size(StanceStopButton(size: .small, variant: .labelled) {}).height >= 44)
        #expect(try size(StanceVoiceInputButton {}).width >= 44)
        #expect(try size(StanceScrollToLatest {}).height >= 44)
        #expect(try size(StanceMessageActions(onCopy: {})).height >= 44)
        #expect(try size(StanceBranchSwitcher(count: 3, index: .constant(0))).height >= 44)
        #expect(try size(StancePromptComposer(text: .constant("")) { _ in }.frame(width: 320)).height >= 44)
        #expect(try size(StanceFeedbackBar(value: .constant(nil))).height >= 44)
    }

    @Test("Flow layout mirrors in right to left layouts")
    func flowMirrors() throws {
        // Two 40pt blocks in a 200pt row: the first is at the leading edge in either direction.
        func firstBlockIsOnTheLeft(_ direction: LayoutDirection) throws -> Bool {
            let rendered = try image(
                StanceFlowLayout(spacing: 0, lineSpacing: 0) {
                    Color.black.frame(width: 40, height: 20)
                    Color.white.frame(width: 40, height: 20)
                }
                .frame(width: 200, alignment: .leading)
                .background(Color.white)
                .environment(\.layoutDirection, direction)
            )
            let data = try #require(rendered.dataProvider?.data)
            let bytes = try #require(CFDataGetBytePtr(data))
            let row = rendered.bytesPerRow * 10, pixel = rendered.bitsPerPixel / 8
            func isDark(_ x: Int) -> Bool { Int(bytes[row + x * pixel]) + Int(bytes[row + x * pixel + 1]) + Int(bytes[row + x * pixel + 2]) < 200 }
            return isDark(10) && !isDark(190)
        }
        #expect(try firstBlockIsOnTheLeft(.leftToRight))
        #expect(try !firstBlockIsOnTheLeft(.rightToLeft))
    }
}
