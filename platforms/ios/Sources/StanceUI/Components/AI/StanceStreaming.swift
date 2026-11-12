import SwiftUI

// MARK: Streaming text

/// How streamed text is revealed.
public enum StanceStreamCadence: String, CaseIterable, Sendable {
    /// A few characters per tick.
    case character
    /// A word per tick.
    case word
    /// Everything at once.
    case instant

    /// The pause between ticks, from the stream motion token.
    public var interval: TimeInterval {
        switch self {
        case .character: StanceMotion.streamInterval
        case .word: StanceMotion.streamInterval * 4
        case .instant: 0
        }
    }
}

/// The reveal state machine behind ``StanceStreamingText``.
///
/// It counts how many characters of the text so far are on screen. Text that was already
/// complete when the view appeared is shown at once: only live text is revealed step by step.
/// When the reveal falls behind the stream it takes larger steps, so it never lags far.
public struct StanceStreamReveal: Equatable, Sendable {
    /// How many characters are revealed.
    public private(set) var revealedCount: Int

    /// The backlog, in characters, that adds one more unit to each step.
    public static let catchUp = 24

    /// - Parameters:
    ///   - text: The text so far.
    ///   - isStreaming: Whether more text is arriving. Finished text starts fully revealed.
    ///   - cadence: The cadence. `instant` starts fully revealed.
    public init(text: String, isStreaming: Bool, cadence: StanceStreamCadence = .character) {
        revealedCount = isStreaming && cadence != .instant ? 0 : text.count
    }

    /// Whether all of `text` is revealed.
    public func isComplete(for text: String) -> Bool { revealedCount >= text.count }

    /// The revealed part of `text`.
    public func visible(in text: String) -> Substring { text.prefix(revealedCount) }

    /// Reveals the next step of `text`.
    /// - Returns: `true` when something new was revealed.
    @discardableResult
    public mutating func advance(in text: String, cadence: StanceStreamCadence) -> Bool {
        let total = text.count
        guard revealedCount < total else {
            // The text was replaced by something shorter.
            if revealedCount > total { revealedCount = total }
            return false
        }
        let backlog = total - revealedCount
        switch cadence {
        case .instant:
            revealedCount = total
        case .character:
            revealedCount += min(backlog, 1 + backlog / Self.catchUp)
        case .word:
            var words = 1 + backlog / (Self.catchUp * 4)
            var index = text.index(text.startIndex, offsetBy: revealedCount)
            var count = revealedCount
            while words > 0, index < text.endIndex {
                // Through any white space, then to the end of the word.
                while index < text.endIndex, text[index].isWhitespace { index = text.index(after: index); count += 1 }
                while index < text.endIndex, !text[index].isWhitespace { index = text.index(after: index); count += 1 }
                words -= 1
            }
            revealedCount = count
        }
        return true
    }

    /// Reveals everything, for Reduce Motion and the instant cadence.
    public mutating func revealAll(in text: String) { revealedCount = text.count }

    /// How many characters past the revealed part belong to the word being revealed.
    /// The view reserves their space so a word never jumps to the next line half way through.
    public func pendingWordLength(in text: String) -> Int {
        guard revealedCount > 0, revealedCount < text.count else { return 0 }
        let index = text.index(text.startIndex, offsetBy: revealedCount)
        guard !text[text.index(before: index)].isWhitespace else { return 0 }
        return text[index...].prefix { !$0.isWhitespace }.count
    }
}

/// Holds the latest text for the reveal loop, which outlives each text change.
@MainActor
private final class StanceStreamSource {
    var text = ""
    var isStreaming = false
}

/// Reveals text as it arrives at a steady cadence with an optional caret.
///
/// Pass the full text so far and whether more is coming. Earlier lines never reflow: text is
/// only added at the end, and the space for the word in progress is reserved. Under Reduce
/// Motion the text appears at once. VoiceOver hears the text once, when it is complete, and
/// never token by token.
///
/// ```swift
/// StanceStreamingText(reply, isStreaming: status == .streaming)
/// ```
public struct StanceStreamingText: View {
    private let text: String
    private let isStreaming: Bool
    private let cadence: StanceStreamCadence
    private let showsCaret: Bool
    private let announcesCompletion: Bool
    private let onRevealEnd: (() -> Void)?
    @State private var reveal: StanceStreamReveal
    @State private var didStream: Bool
    @State private var source = StanceStreamSource()
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - text: The full text so far.
    ///   - isStreaming: Whether more text is arriving.
    ///   - cadence: Reveal by character, by word or at once.
    ///   - showsCaret: Show a caret at the reveal point while text is arriving.
    ///   - announcesCompletion: Announce the finished text to VoiceOver, once.
    ///   - onRevealEnd: Called when the stream has ended and all of it is on screen.
    public init(
        _ text: String,
        isStreaming: Bool = false,
        cadence: StanceStreamCadence = .character,
        showsCaret: Bool = true,
        announcesCompletion: Bool = true,
        onRevealEnd: (() -> Void)? = nil
    ) {
        self.text = text
        self.isStreaming = isStreaming
        self.cadence = cadence
        self.showsCaret = showsCaret
        self.announcesCompletion = announcesCompletion
        self.onRevealEnd = onRevealEnd
        _reveal = State(initialValue: StanceStreamReveal(text: text, isStreaming: isStreaming, cadence: cadence))
        _didStream = State(initialValue: isStreaming)
    }

    private var isInstant: Bool { reduceMotion || cadence == .instant }
    private var visibleCount: Int { isInstant ? text.count : min(reveal.revealedCount, text.count) }
    private var isDone: Bool { !isStreaming && visibleCount >= text.count }
    private var isTicking: Bool { !isInstant && (isStreaming || reveal.revealedCount < text.count) }

    public var body: some View {
        Group {
            if showsCaret, !isDone, !reduceMotion {
                // The caret blinks once per pulse. Reduce Motion keeps it still.
                TimelineView(.periodic(from: .now, by: StanceMotion.pulseDuration / 2)) { context in
                    let on = Int(context.date.timeIntervalSinceReferenceDate / (StanceMotion.pulseDuration / 2)) % 2 == 0
                    Text(attributed(caret: on ? theme.colors.fgDefault : theme.colors.fgSubtle))
                }
            } else {
                Text(attributed(caret: showsCaret && !isDone ? theme.colors.fgDefault : nil))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(isDone ? text : stanceString("stance.ai.status.generating", locale))
        .accessibilityAddTraits(isDone ? .isStaticText : [.isStaticText, .updatesFrequently])
        .onChange(of: text, initial: true) { _, new in
            source.text = new
            if isInstant { reveal.revealAll(in: new) } else if reveal.revealedCount > new.count { reveal.advance(in: new, cadence: cadence) }
        }
        .onChange(of: isStreaming, initial: true) { _, new in
            source.isStreaming = new
            if new { didStream = true }
        }
        .onChange(of: isInstant) { _, instant in
            if instant { reveal.revealAll(in: text) }
        }
        .task(id: isTicking) {
            guard isTicking else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(cadence.interval))
                if Task.isCancelled { break }
                reveal.advance(in: source.text, cadence: cadence)
                if !source.isStreaming, reveal.isComplete(for: source.text) { break }
            }
        }
        .onChange(of: isDone) { _, done in
            guard done, didStream else { return }
            didStream = false
            onRevealEnd?()
            if announcesCompletion, !text.isEmpty { StanceAnnouncer.announce(text) }
        }
    }

    /// The revealed text, the reserved space for the word in progress, then the caret.
    private func attributed(caret: Color?) -> AttributedString {
        let count = visibleCount
        var result = AttributedString(String(text.prefix(count)))
        if !isInstant {
            let pending = reveal.pendingWordLength(in: text)
            if pending > 0 {
                var reserved = AttributedString(String(text.dropFirst(count).prefix(pending)))
                reserved.foregroundColor = .clear
                result += reserved
            }
        }
        if let caret {
            var mark = AttributedString("\u{2009}\u{258D}")
            mark.foregroundColor = caret
            result += mark
        }
        return result
    }
}

// MARK: Shimmer text

/// Text with a slow light sweep for labels of work in progress, such as "Searching the web".
///
/// The sweep runs in the reading direction and lasts one shimmer token. With Reduce Motion, or
/// when inactive, it is plain text. Assistive technology always reads plain text.
public struct StanceShimmerText: View {
    private let text: String
    private let isActive: Bool
    @State private var swept = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - text: The label.
    ///   - isActive: Whether the sweep runs.
    public init(_ text: String, isActive: Bool = true) {
        self.text = text
        self.isActive = isActive
    }

    public var body: some View {
        let animates = isActive && !reduceMotion
        Text(text)
            .foregroundStyle(theme.colors.fgMuted)
            .overlay {
                if animates {
                    Text(text)
                        .foregroundStyle(theme.colors.fgDefault)
                        .mask {
                            GeometryReader { geometry in
                                let band = geometry.size.width / 2
                                let direction: CGFloat = layoutDirection == .rightToLeft ? -1 : 1
                                // Mask values only: opaque shows the highlight, clear hides it.
                                LinearGradient(colors: [.clear, .black, .clear], startPoint: .leading, endPoint: .trailing)
                                    .frame(width: band)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .offset(x: direction * (swept ? geometry.size.width : -band))
                            }
                        }
                        .accessibilityHidden(true)
                        .onAppear {
                            withAnimation(StanceMotion.shimmer(reduceMotion: reduceMotion)) { swept = true }
                        }
                        .onDisappear { swept = false }
                }
            }
    }
}

// MARK: Thinking indicator

/// How a ``StanceThinkingIndicator`` moves.
public enum StanceThinkingVariant: String, CaseIterable, Sendable {
    /// Three dots that light in turn.
    case dots
    /// The sparkle breathing.
    case pulse
    /// A light sweep across the label.
    case shimmer
}

/// The size of a ``StanceThinkingIndicator``.
public enum StanceThinkingSize: String, CaseIterable, Sendable {
    case small, medium
}

/// Shows that the assistant is working before any text arrives, with an optional label and
/// elapsed time.
///
/// Motion uses the pulse and shimmer tokens. With Reduce Motion it is a still sparkle with the
/// label. The label is announced once when the indicator appears.
public struct StanceThinkingIndicator: View {
    private let label: String?
    private let variant: StanceThinkingVariant
    private let elapsed: TimeInterval?
    private let size: StanceThinkingSize
    @State private var breathing = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - label: What the assistant is doing. Defaults to a localised "Thinking".
    ///   - variant: Dots, pulse or shimmer.
    ///   - elapsed: Seconds since the work started, shown after the label.
    ///   - size: Small or medium text.
    public init(_ label: String? = nil, variant: StanceThinkingVariant = .dots, elapsed: TimeInterval? = nil, size: StanceThinkingSize = .medium) {
        self.label = label
        self.variant = variant
        self.elapsed = elapsed
        self.size = size
    }

    public var body: some View {
        let title = label ?? stanceString("stance.ai.thinking", locale)
        HStack(spacing: StanceSpacing.sm) {
            mark
            Group {
                if variant == .shimmer {
                    StanceShimmerText(title)
                } else {
                    Text(title).foregroundStyle(theme.colors.fgMuted)
                }
            }
            .stanceText(size == .small ? .caption : .bodySmall)
            if let elapsed {
                Text(elapsed.stanceDuration(locale: locale, width: .narrow))
                    .stanceText(.caption)
                    .monospacedDigit()
                    .foregroundStyle(theme.colors.fgSubtle)
                    .contentTransition(.numericText(value: elapsed))
                    .stanceAnimation(.fast, value: Int(elapsed))
            }
        }
        .frame(minHeight: StanceSize.controlXs)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityValue(elapsed.map { $0.stanceDuration(locale: locale) } ?? "")
        .accessibilityAddTraits(.updatesFrequently)
        .onAppear { StanceAnnouncer.announce(title) }
    }

    @ViewBuilder private var mark: some View {
        let sparkle = StanceIcon(.sparkle, size: size == .small ? StanceSize.iconSm - StanceSpacing.xxs : StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
        if reduceMotion {
            sparkle
        } else {
            switch variant {
            case .dots:
                let easing = StanceMotion.standardEasing
                PhaseAnimator([0, 1, 2]) { phase in
                    HStack(spacing: StanceSpacing.xs) {
                        ForEach(0 ..< 3, id: \.self) { index in
                            Circle()
                                .fill(theme.colors.fgMuted)
                                .frame(width: StanceSpacing.s1_5, height: StanceSpacing.s1_5)
                                .opacity(index == phase ? 1 : StanceMotion.pulseRestOpacity)
                        }
                    }
                } animation: { _ in
                    .timingCurve(easing.0, easing.1, easing.2, easing.3, duration: StanceMotion.pulseDuration / 3)
                }
            case .pulse:
                sparkle
                    .opacity(breathing ? StanceMotion.pulseRestOpacity : 1)
                    .onAppear { withAnimation(StanceMotion.pulse(reduceMotion: reduceMotion)) { breathing = true } }
            case .shimmer:
                sparkle
            }
        }
    }
}

// MARK: Reasoning disclosure

/// Whether the assistant is still reasoning.
public enum StanceReasoningStatus: String, CaseIterable, Sendable {
    case thinking, done
}

/// The words used by ``StanceReasoningDisclosure``. Leave a value `nil` for the localised default.
public struct StanceReasoningLabels: Sendable {
    /// Replaces the built in text for "thinking".
    public var thinking: String?
    /// The summary once done, from the duration in words. For example "Thought for 12 seconds".
    public var thoughtFor: (@Sendable (String) -> String)?
    /// The summary once done when no duration is known.
    public var done: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(thinking: String? = nil, thoughtFor: (@Sendable (String) -> String)? = nil, done: String? = nil) {
        self.thinking = thinking
        self.thoughtFor = thoughtFor
        self.done = done
    }
}

/// A collapsible block for the assistant's reasoning: open while thinking, collapsed to a
/// summary when done.
///
/// Built on the native `DisclosureGroup` with the Stance style, so VoiceOver hears a button
/// with its expanded state.
public struct StanceReasoningDisclosure<Content: View>: View {
    private let status: StanceReasoningStatus
    private let duration: TimeInterval?
    private let labels: StanceReasoningLabels
    private let external: Binding<Bool>?
    private let onExpandedChange: ((Bool) -> Void)?
    private let content: Content
    @State private var internalExpanded: Bool
    @State private var readerToggled = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Creates a disclosure that manages its own state: open while thinking, then collapsed.
    /// It stays as the reader left it if they opened or closed it while thinking.
    /// - Parameters:
    ///   - status: Thinking or done.
    ///   - duration: How long the reasoning took, in seconds, for the summary.
    ///   - defaultExpanded: Whether it starts open. Defaults to open while thinking.
    ///   - labels: Replacement words for the built in labels.
    ///   - onExpandedChange: Called when the reader opens or closes it.
    ///   - content: The reasoning.
    public init(
        status: StanceReasoningStatus,
        duration: TimeInterval? = nil,
        defaultExpanded: Bool? = nil,
        labels: StanceReasoningLabels = .init(),
        onExpandedChange: ((Bool) -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.status = status
        self.duration = duration
        self.labels = labels
        external = nil
        self.onExpandedChange = onExpandedChange
        self.content = content()
        _internalExpanded = State(initialValue: defaultExpanded ?? (status == .thinking))
    }

    /// Creates a disclosure whose open state the app owns.
    public init(
        status: StanceReasoningStatus,
        duration: TimeInterval? = nil,
        isExpanded: Binding<Bool>,
        labels: StanceReasoningLabels = .init(),
        @ViewBuilder content: () -> Content
    ) {
        self.status = status
        self.duration = duration
        self.labels = labels
        external = isExpanded
        onExpandedChange = nil
        self.content = content()
        _internalExpanded = State(initialValue: isExpanded.wrappedValue)
    }

    /// The header text: "Thinking" while working, then "Thought for 12 seconds".
    public nonisolated static func summary(status: StanceReasoningStatus, duration: TimeInterval?, locale: Locale = .current) -> String {
        switch status {
        case .thinking: stanceString("stance.ai.thinking", locale)
        case .done:
            if let duration {
                stanceString("stance.ai.reasoning.thoughtFor \(duration.stanceDuration(locale: locale))", locale)
            } else {
                stanceString("stance.ai.reasoning.done", locale)
            }
        }
    }

    private var summary: String {
        switch status {
        case .thinking: labels.thinking ?? Self.summary(status: status, duration: duration, locale: locale)
        case .done:
            if let duration, let thoughtFor = labels.thoughtFor { thoughtFor(duration.stanceDuration(locale: locale)) }
            else if duration == nil, let done = labels.done { done }
            else { Self.summary(status: status, duration: duration, locale: locale) }
        }
    }

    private var expanded: Binding<Bool> {
        Binding(
            get: { external?.wrappedValue ?? internalExpanded },
            set: { new in
                if let external { external.wrappedValue = new } else { internalExpanded = new }
                if status == .thinking { readerToggled = true }
                onExpandedChange?(new)
            }
        )
    }

    public var body: some View {
        DisclosureGroup(isExpanded: expanded) {
            content
                .stanceText(.bodySmall)
                .foregroundStyle(theme.colors.fgMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, StanceSpacing.md)
                .overlay(alignment: .leading) {
                    Rectangle().fill(theme.colors.borderDefault).frame(width: max(theme.borderWidth, StanceSpacing.xxs))
                }
        } label: {
            HStack(spacing: StanceSpacing.sm) {
                StanceIcon(.sparkle, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                if status == .thinking { StanceShimmerText(summary) } else { Text(summary).foregroundStyle(theme.colors.fgMuted) }
            }
        }
        .disclosureGroupStyle(.stance)
        .onChange(of: status) { _, new in
            // Collapse to the summary when the reasoning ends, unless the app owns the state or
            // the reader chose for themselves while it was thinking.
            guard new == .done, external == nil, internalExpanded, !readerToggled else { return }
            withAnimation(StanceMotion.normal.animation(reduceMotion: reduceMotion)) { internalExpanded = false }
        }
    }
}

// MARK: Generation progress

/// The words used by ``StanceGenerationProgress``. Leave a value `nil` for the localised default.
public struct StanceGenerationProgressLabels: Sendable {
    /// Replaces the built in text for "cancel".
    public var cancel: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(cancel: String? = nil) { self.cancel = cancel }
}

/// Progress for longer generations such as images or documents: determinate or indeterminate,
/// with a stage label.
///
/// Built on the native `ProgressView`. Stage changes are announced politely, and reaching the
/// end gives a success tap.
public struct StanceGenerationProgress: View {
    private let label: String?
    private let value: Double?
    private let stage: String?
    private let labels: StanceGenerationProgressLabels
    private let onCancel: (() -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - label: What is being generated. Defaults to a localised "Generating".
    ///   - value: Progress from 0 to 1, or `nil` when it cannot be measured.
    ///   - stage: The current step, such as "Rendering".
    ///   - labels: Replacement words for the built in labels.
    ///   - onCancel: Cancels the generation. Without it, there is no cancel button.
    public init(_ label: String? = nil, value: Double? = nil, stage: String? = nil, labels: StanceGenerationProgressLabels = .init(), onCancel: (() -> Void)? = nil) {
        self.label = label
        self.value = value.map { min(max($0, 0), 1) }
        self.stage = stage
        self.labels = labels
        self.onCancel = onCancel
    }

    public var body: some View {
        let title = label ?? stanceString("stance.ai.status.generating", locale)
        let percent = value.map { $0.formatted(.percent.precision(.fractionLength(0)).locale(locale)) }
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                HStack(spacing: StanceSpacing.sm) {
                    StanceIcon(.sparkle, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                    Text(title).stanceText(.label)
                    Spacer(minLength: StanceSpacing.sm)
                    if let value, let percent {
                        Text(percent).stanceText(.label).monospacedDigit().foregroundStyle(theme.colors.fgMuted)
                            .contentTransition(.numericText(value: value))
                            .stanceAnimation(.normal, value: value)
                    }
                }
                Group {
                    if let value { ProgressView(value: value) } else { ProgressView().progressViewStyle(.linear) }
                }
                .tint(theme.colors.accentBg)
                if let stage {
                    Group {
                        if value == nil { StanceShimmerText(stage) } else { Text(stage).foregroundStyle(theme.colors.fgMuted) }
                    }
                    .stanceText(.caption)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(title)
            .accessibilityValue([percent ?? stanceString("stance.inProgress", locale), stage].compactMap { $0 }.formatted(.list(type: .and, width: .narrow).locale(locale)))
            .accessibilityAddTraits(.updatesFrequently)
            if let onCancel {
                Button(labels.cancel ?? stanceString("stance.cancel", locale), action: onCancel).buttonStyle(.stance(.ghost, size: .small))
            }
        }
        .stanceCard(padding: StanceSpacing.md)
        .onChange(of: stage) { _, new in
            if let new { StanceAnnouncer.announce(new) }
        }
        .sensoryFeedback(.success, trigger: (value ?? 0) >= 1) { _, complete in complete }
    }
}

// MARK: Streaming skeleton

/// The shape of a ``StanceStreamingSkeleton``.
public enum StanceStreamingSkeletonVariant: String, CaseIterable, Sendable {
    case text, card, image
}

/// Placeholder lines for a response that has been requested and has not started.
public struct StanceStreamingSkeleton: View {
    private let lines: Int
    private let variant: StanceStreamingSkeletonVariant
    private let label: String?
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - lines: How many text lines to draw.
    ///   - variant: Text lines, a card or an image block.
    ///   - label: The accessible name. Defaults to a localised "Loading response".
    public init(lines: Int = 3, variant: StanceStreamingSkeletonVariant = .text, label: String? = nil) {
        self.lines = max(1, lines)
        self.variant = variant
        self.label = label
    }

    public var body: some View {
        Group {
            switch variant {
            case .text:
                textLines
            case .card:
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    StanceSkeleton(.circle, height: StanceSize.controlSm)
                    textLines
                }
                .stanceCard(padding: StanceSpacing.md)
            case .image:
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    StanceSkeleton(.rectangle, height: StanceSize.touchTarget * 4)
                    StanceSkeleton(.text, height: StanceSpacing.md).frame(maxWidth: StanceSize.touchTarget * 4)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? stanceString("stance.ai.skeleton", locale))
        .accessibilityAddTraits(.updatesFrequently)
    }

    private var textLines: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.s2_5) {
            ForEach(0 ..< lines, id: \.self) { index in
                if index == lines - 1, lines > 1 {
                    // The last line is shorter, like the end of a paragraph.
                    Color.clear
                        .frame(height: StanceSpacing.md)
                        .overlay(alignment: .leading) {
                            GeometryReader { geometry in
                                StanceSkeleton(.text, width: geometry.size.width * 0.6, height: StanceSpacing.md)
                            }
                        }
                } else {
                    StanceSkeleton(.text, height: StanceSpacing.md)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: Interrupted state

/// Why a response ended early.
public enum StanceInterruptionReason: String, CaseIterable, Sendable {
    /// The reader stopped it.
    case stopped
    /// It failed.
    case error
    /// The connection dropped.
    case network
    /// It reached a length or usage limit.
    case limit

    /// Whether the reason is announced as an alert. Errors and lost connections are alerts;
    /// stopping and reaching a limit are polite statuses.
    public var isAlert: Bool { self == .error || self == .network }

    /// The default title, localised for `locale`.
    public func title(locale: Locale = .current) -> String {
        switch self {
        case .stopped: stanceString("stance.ai.interrupted.stopped.title", locale)
        case .error: stanceString("stance.error.title", locale)
        case .network: stanceString("stance.ai.interrupted.network.title", locale)
        case .limit: stanceString("stance.ai.interrupted.limit.title", locale)
        }
    }

    /// The default description, localised for `locale`.
    public func description(locale: Locale = .current) -> String {
        switch self {
        case .stopped: stanceString("stance.ai.interrupted.stopped.description", locale)
        case .error: stanceString("stance.ai.interrupted.error.description", locale)
        case .network: stanceString("stance.ai.interrupted.network.description", locale)
        case .limit: stanceString("stance.ai.interrupted.limit.description", locale)
        }
    }
}

/// The words used by ``StanceInterruptedState``. Leave a value `nil` for the localised default.
public struct StanceInterruptedLabels: Sendable {
    /// Replaces the built in text for "retry".
    public var retry: String?
    /// Replaces the built in text for "continue".
    public var `continue`: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(retry: String? = nil, continue: String? = nil) {
        self.retry = retry
        self.continue = `continue`
    }
}

/// Marks a response that was stopped or failed part way, with retry and continue.
///
/// Errors and lost connections are announced as alerts, stopping and limits as polite statuses. The reason is shown with an icon
/// and words, never colour alone.
public struct StanceInterruptedState: View {
    private let reason: StanceInterruptionReason
    private let title: String?
    private let description: String?
    private let labels: StanceInterruptedLabels
    private let onRetry: (() -> Void)?
    private let onContinue: (() -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - reason: Why the response ended.
    ///   - title: Replaces the default title for the reason.
    ///   - description: Replaces the default description for the reason.
    ///   - labels: Replacement words for the buttons.
    ///   - onRetry: Asks for the response again. Without it, there is no retry button.
    ///   - onContinue: Continues from where the response ended. Without it, there is no continue button.
    public init(
        reason: StanceInterruptionReason,
        title: String? = nil,
        description: String? = nil,
        labels: StanceInterruptedLabels = .init(),
        onRetry: (() -> Void)? = nil,
        onContinue: (() -> Void)? = nil
    ) {
        self.reason = reason
        self.title = title
        self.description = description
        self.labels = labels
        self.onRetry = onRetry
        self.onContinue = onContinue
    }

    private var tint: Color {
        switch reason {
        case .stopped: theme.colors.fgMuted
        case .error, .network: theme.colors.dangerFg
        case .limit: theme.colors.warningFg
        }
    }

    public var body: some View {
        let heading = title ?? reason.title(locale: locale)
        let detail = description ?? reason.description(locale: locale)
        let shape = RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
        HStack(alignment: .top, spacing: StanceSpacing.md) {
            Group {
                switch reason {
                case .stopped: StanceSymbol("stop.circle", size: StanceSize.iconMd)
                case .error: StanceIcon(.alertCircle, size: StanceSize.iconMd)
                case .network: StanceSymbol("wifi.slash", size: StanceSize.iconMd)
                case .limit: StanceIcon(.alertTriangle, size: StanceSize.iconMd)
                }
            }
            .foregroundStyle(tint)
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                    Text(heading).stanceText(.label)
                    Text(detail).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                }
                .accessibilityElement(children: .combine)
                if onRetry != nil || onContinue != nil {
                    StanceButtonGroup {
                        if let onRetry {
                            StanceButton(labels.retry ?? stanceString("stance.retry", locale), variant: .outline, size: .small, leadingIcon: .refresh, action: onRetry)
                        }
                        if let onContinue {
                            StanceButton(labels.continue ?? stanceString("stance.ai.interrupted.continue", locale), variant: .ghost, size: .small, action: onContinue)
                        }
                    }
                    .padding(.top, StanceSpacing.xs)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(StanceSpacing.md)
        .background(theme.colors.bgSubtle, in: shape)
        .overlay { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .accessibilityElement(children: .contain)
        .onAppear {
            StanceAnnouncer.announce([heading, detail].joined(separator: ". "), urgent: reason.isAlert)
        }
    }
}
