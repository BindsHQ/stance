import SwiftUI

// MARK: Sources

/// A source behind a claim or an answer.
public struct StanceSource: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The title.
    public var title: String
    /// Where the source lives.
    public var url: URL?
    /// The site name. Defaults to the host of `url`.
    public var domain: String?
    /// A site icon supplied by the app. Nothing is loaded from the network.
    public var favicon: Image?
    /// A short quote from the source.
    public var snippet: String?

    /// Creates a source.
    public init(id: String, title: String, url: URL? = nil, domain: String? = nil, favicon: Image? = nil, snippet: String? = nil) {
        self.id = id
        self.title = title
        self.url = url
        self.domain = domain
        self.favicon = favicon
        self.snippet = snippet
    }

    /// The site to show: `domain`, or the host of `url` without a leading "www.".
    public var displayDomain: String? {
        if let domain, !domain.isEmpty { return domain }
        guard let host = url?.host(percentEncoded: false) else { return nil }
        return host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
    }
}

/// The size of a ``StanceSourcePreview``.
public enum StanceSourcePreviewSize: String, CaseIterable, Sendable {
    case compact, regular
}

/// A card for one source: title, site, snippet and a link to open it.
///
/// Opening calls `onOpen`, or hands the URL to the system when no handler is given.
public struct StanceSourcePreview: View {
    private let source: StanceSource
    private let size: StanceSourcePreviewSize
    private let openLabel: String?
    private let onOpen: ((StanceSource) -> Void)?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.openURL) private var openURL

    /// - Parameters:
    ///   - source: The source.
    ///   - size: Compact clamps the title and snippet to two lines.
    ///   - openLabel: The link text. Defaults to a localised "Open source".
    ///   - onOpen: Opens the source. Without it, the URL is opened by the system.
    public init(_ source: StanceSource, size: StanceSourcePreviewSize = .regular, openLabel: String? = nil, onOpen: ((StanceSource) -> Void)? = nil) {
        self.source = source
        self.size = size
        self.openLabel = openLabel
        self.onOpen = onOpen
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            if let domain = source.displayDomain {
                HStack(spacing: StanceSpacing.xs) {
                    StanceSourceIcon(source: source)
                    Text(domain).stanceText(.caption).foregroundStyle(theme.colors.fgMuted).lineLimit(1)
                }
            }
            Text(source.title).stanceText(.label).lineLimit(size == .compact ? 2 : nil)
            if let snippet = source.snippet, !snippet.isEmpty {
                Text(snippet).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted).lineLimit(size == .compact ? 2 : 6)
            }
            if onOpen != nil || source.url != nil {
                Button {
                    if let onOpen { onOpen(source) } else if let url = source.url { openURL(url) }
                } label: {
                    HStack(spacing: StanceSpacing.xs) {
                        Text(openLabel ?? stanceString("stance.ai.sources.open", locale))
                        StanceIcon(.externalLink, size: StanceSize.iconSm - StanceSpacing.xxs)
                    }
                }
                .buttonStyle(.stance(.link, size: .small))
                .accessibilityAddTraits(.isLink)
            }
        }
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
    }
}

/// The site icon for a source, or a globe when the app supplies none.
struct StanceSourceIcon: View {
    let source: StanceSource
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        Group {
            if let favicon = source.favicon {
                favicon.resizable().scaledToFit().clipShape(RoundedRectangle(cornerRadius: StanceRadius.xs, style: .continuous))
            } else {
                StanceIcon(.globe, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .frame(width: StanceSize.iconSm, height: StanceSize.iconSm)
        .accessibilityHidden(true)
    }
}

/// The numbered mark shared by citation chips and source rows.
struct StanceSourceNumber: View {
    let index: Int
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    var body: some View {
        Text(index.formatted(.number.locale(locale)))
            .stanceText(.caption)
            .fontWeight(.semibold)
            .monospacedDigit()
            .foregroundStyle(theme.colors.fgDefault)
            .padding(.horizontal, StanceSpacing.s1_5)
            .frame(minWidth: StanceSize.iconMd, minHeight: StanceSize.iconMd)
            .background(theme.colors.bgEmphasis, in: Capsule())
            .overlay { Capsule().strokeBorder(theme.isHighContrast ? theme.colors.borderStrong : .clear, lineWidth: theme.borderWidth) }
    }
}

/// An inline numbered marker that links a claim to its source and previews it on tap.
///
/// The preview is a popover on iPad and a sheet with a medium detent on iPhone. VoiceOver reads
/// "Source 2: title".
public struct StanceCitationChip: View {
    private let index: Int
    private let source: StanceSource
    private let onOpen: ((StanceSource) -> Void)?
    @State private var showsPreview = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    /// - Parameters:
    ///   - index: The number shown, starting at 1.
    ///   - source: The source the claim comes from.
    ///   - onOpen: Opens the source from the preview. Without it, the URL is opened by the system.
    public init(index: Int, source: StanceSource, onOpen: ((StanceSource) -> Void)? = nil) {
        self.index = index
        self.source = source
        self.onOpen = onOpen
    }

    /// The accessible name, for example "Source 2: Quarterly report".
    public nonisolated static func accessibilityName(index: Int, title: String, locale: Locale = .current) -> String {
        stanceString("stance.ai.sources.name \(index) \(title)", locale)
    }

    public var body: some View {
        Button {
            showsPreview = true
        } label: {
            StanceSourceNumber(index: index)
                // The mark is small enough to sit in a line of text. The target is still 44pt.
                .contentShape(Rectangle().inset(by: -(StanceSize.touchTarget - StanceSize.iconMd) / 2))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Self.accessibilityName(index: index, title: source.title, locale: locale))
        .popover(isPresented: $showsPreview) {
            StanceSourcePreview(source) { opened in
                showsPreview = false
                if let onOpen { onOpen(opened) } else if let url = opened.url { open(url) }
            }
            .padding(StanceSpacing.lg)
            .frame(idealWidth: StanceSize.readableWidth / 2, alignment: .topLeading)
            .frame(maxHeight: .infinity, alignment: .top)
            .background(theme.colors.bgSurface)
            .presentationCompactAdaptation(.sheet)
            .presentationDetents([.medium])
            .presentationDragIndicator(.visible)
            .modifier(StancePresentationChrome(theme: theme, locale: locale, layoutDirection: layoutDirection))
        }
    }

    @Environment(\.openURL) private var openURL

    private func open(_ url: URL) { openURL(url) }
}

/// How a ``StanceSourceList`` is drawn.
public enum StanceSourceListVariant: String, CaseIterable, Sendable {
    /// A compact row that expands to the full list.
    case inline
    /// The full list, always open.
    case list
}

/// The words used by ``StanceSourceList``. Leave a value `nil` for the localised default.
public struct StanceSourceListLabels: Sendable {
    /// Replaces the built in text for "title".
    public var title: String?
    /// The compact row's text, from the number of sources. For example "4 sources".
    public var count: (@Sendable (Int) -> String)?
    /// The button that reveals the rest, from how many are hidden.
    public var showMore: (@Sendable (Int) -> String)?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(title: String? = nil, count: (@Sendable (Int) -> String)? = nil, showMore: (@Sendable (Int) -> String)? = nil) {
        self.title = title
        self.count = count
        self.showMore = showMore
    }
}

/// The sources behind an answer, as a compact row that expands to a full list.
public struct StanceSourceList: View {
    private let sources: [StanceSource]
    private let variant: StanceSourceListVariant
    private let max: Int?
    private let labels: StanceSourceListLabels
    private let onSourceOpen: ((StanceSource) -> Void)?
    @State private var isExpanded = false
    @State private var showsAll = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - sources: The sources, in citation order.
    ///   - variant: A compact row that expands, or the full list.
    ///   - max: The most rows to show before a "Show more" button.
    ///   - labels: Replacement words for the built in labels.
    ///   - onSourceOpen: Opens a source. Without it, the URL is opened by the system.
    public init(
        _ sources: [StanceSource],
        variant: StanceSourceListVariant = .inline,
        max: Int? = nil,
        labels: StanceSourceListLabels = .init(),
        onSourceOpen: ((StanceSource) -> Void)? = nil
    ) {
        self.sources = sources
        self.variant = variant
        self.max = max
        self.labels = labels
        self.onSourceOpen = onSourceOpen
    }

    /// How many rows are on screen for a total, an optional maximum and whether all were asked for.
    public nonisolated static func visibleCount(total: Int, max: Int?, showsAll: Bool) -> Int {
        guard let max, max >= 0, !showsAll else { return Swift.max(total, 0) }
        return Swift.min(Swift.max(total, 0), max)
    }

    public var body: some View {
        if !sources.isEmpty {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                switch variant {
                case .inline:
                    Button {
                        withAnimation(StanceMotion.normal.animation(reduceMotion: reduceMotion)) { isExpanded.toggle() }
                    } label: {
                        HStack(spacing: StanceSpacing.sm) {
                            StanceIcon(.link, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted)
                            Text(labels.count?(sources.count) ?? stanceString("stance.ai.sources.count \(sources.count)", locale)).stanceText(.label)
                            StanceIcon(.chevronDown, size: StanceSize.iconSm - StanceSpacing.xxs)
                                .rotationEffect(.degrees(isExpanded ? 180 : 0))
                                .foregroundStyle(theme.colors.fgMuted)
                        }
                        .padding(.horizontal, StanceSpacing.md)
                        .frame(minHeight: StanceSize.controlSm)
                        .background(theme.colors.bgMuted, in: Capsule())
                        .overlay { Capsule().strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
                        .frame(minHeight: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityValue(stanceString(isExpanded ? "stance.expanded" : "stance.collapsed", locale))
                    if isExpanded { rows }
                case .list:
                    Text(labels.title ?? stanceString("stance.ai.sources", locale))
                        .stanceText(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(theme.colors.fgMuted)
                        .accessibilityAddTraits(.isHeader)
                    rows
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder private var rows: some View {
        let shown = Self.visibleCount(total: sources.count, max: max, showsAll: showsAll)
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(sources.prefix(shown).enumerated()), id: \.element.id) { offset, source in
                Button {
                    if let onSourceOpen { onSourceOpen(source) } else if let url = source.url { openURL(url) }
                } label: {
                    HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.md) {
                        StanceSourceNumber(index: offset + 1)
                        VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                            Text(source.title).stanceText(.label).lineLimit(2)
                            if let domain = source.displayDomain {
                                Text(domain).stanceText(.caption).foregroundStyle(theme.colors.fgMuted).lineLimit(1)
                            }
                        }
                        .multilineTextAlignment(.leading)
                        Spacer(minLength: StanceSpacing.sm)
                        StanceIcon(.arrowUpRight, size: StanceSize.iconSm - StanceSpacing.xxs).foregroundStyle(theme.colors.fgSubtle)
                    }
                    .padding(.vertical, StanceSpacing.xs)
                    .frame(minHeight: StanceSize.touchTarget)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(
                    [StanceCitationChip.accessibilityName(index: offset + 1, title: source.title, locale: locale), source.displayDomain]
                        .compactMap { $0 }
                        .formatted(.list(type: .and, width: .narrow).locale(locale))
                )
                .accessibilityAddTraits(.isLink)
                if offset < shown - 1 { StanceDivider() }
            }
            if shown < sources.count {
                let hidden = sources.count - shown
                Button(labels.showMore?(hidden) ?? stanceString("stance.ai.sources.showMore \(hidden)", locale)) { showsAll = true }
                    .buttonStyle(.stance(.link, size: .small))
            }
        }
    }
}

// MARK: Confidence

/// How sure the system is.
public enum StanceConfidenceLevel: String, CaseIterable, Sendable {
    case high, medium, low, unknown

    /// The level in words, localised for `locale`.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .high: stanceString("stance.ai.confidence.high", locale)
        case .medium: stanceString("stance.ai.confidence.medium", locale)
        case .low: stanceString("stance.ai.confidence.low", locale)
        case .unknown: stanceString("stance.ai.confidence.unknown", locale)
        }
    }

    /// How full the bars icon is, from 0 to 1, or `nil` when the level is unknown.
    public var barValue: Double? {
        switch self {
        case .high: 1
        case .medium: 0.67
        case .low: 0.34
        case .unknown: nil
        }
    }
}

/// States how sure the system is in words, never colour alone.
///
/// The icon is a set of bars that fills with the level, in ink. The words carry the meaning.
public struct StanceConfidenceBadge: View {
    private let level: StanceConfidenceLevel
    private let label: String?
    private let description: String?
    private let showsIcon: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - level: High, medium, low or unknown.
    ///   - label: Replaces the default words for the level.
    ///   - description: A line under the badge that explains the level.
    ///   - showsIcon: Show the bars icon.
    public init(_ level: StanceConfidenceLevel, label: String? = nil, description: String? = nil, showsIcon: Bool = true) {
        self.level = level
        self.label = label
        self.description = description
        self.showsIcon = showsIcon
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            HStack(spacing: StanceSpacing.xs) {
                if showsIcon {
                    if let value = level.barValue {
                        StanceSymbol("cellularbars", size: StanceSize.iconSm - StanceSpacing.xxs, variableValue: value)
                    } else {
                        StanceIcon(.helpCircle, size: StanceSize.iconSm - StanceSpacing.xxs)
                    }
                }
                Text(label ?? level.label(locale: locale)).stanceText(.caption).fontWeight(.semibold)
            }
            .padding(.horizontal, StanceSpacing.sm)
            .padding(.vertical, StanceSpacing.xxs)
            .foregroundStyle(theme.colors.fgDefault)
            .background(theme.colors.bgEmphasis, in: Capsule())
            .overlay { Capsule().strokeBorder(theme.isHighContrast ? theme.colors.borderDefault : .clear, lineWidth: theme.borderWidth) }
            if let description {
                Text(description).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: AI generated label

/// How AI was involved in a piece of content.
public enum StanceAIGeneratedVariant: String, CaseIterable, Sendable {
    /// Written by AI.
    case generated
    /// Written by a person with AI help.
    case assisted
    /// Written by a person and edited by AI.
    case edited
}

/// The size of a ``StanceAIGeneratedLabel``.
public enum StanceAIGeneratedLabelSize: String, CaseIterable, Sendable {
    case small, medium
}

/// Marks content as written or edited by AI.
///
/// The sparkle and the words identify it. There is no colour to learn.
public struct StanceAIGeneratedLabel: View {
    private let variant: StanceAIGeneratedVariant
    private let label: String?
    private let model: String?
    private let size: StanceAIGeneratedLabelSize
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - variant: Generated, assisted or edited.
    ///   - label: Replaces the default words.
    ///   - model: The model's name, added to the default words.
    ///   - size: Small or medium text.
    public init(_ variant: StanceAIGeneratedVariant = .generated, label: String? = nil, model: String? = nil, size: StanceAIGeneratedLabelSize = .small) {
        self.variant = variant
        self.label = label
        self.model = model
        self.size = size
    }

    /// The default words, for example "AI generated" or "AI generated with Atlas".
    public nonisolated static func text(_ variant: StanceAIGeneratedVariant, model: String? = nil, locale: Locale = .current) -> String {
        switch (variant, model) {
        case (.generated, nil): stanceString("stance.ai.label.generated", locale)
        case (.assisted, nil): stanceString("stance.ai.label.assisted", locale)
        case (.edited, nil): stanceString("stance.ai.label.edited", locale)
        case let (.generated, model?): stanceString("stance.ai.label.generatedWith \(model)", locale)
        case let (.assisted, model?): stanceString("stance.ai.label.assistedWith \(model)", locale)
        case let (.edited, model?): stanceString("stance.ai.label.editedWith \(model)", locale)
        }
    }

    public var body: some View {
        HStack(spacing: StanceSpacing.xs) {
            StanceIcon(.sparkle, size: size == .small ? StanceSize.iconSm - StanceSpacing.xxs : StanceSize.iconSm)
            Text(label ?? Self.text(variant, model: model, locale: locale)).stanceText(size == .small ? .caption : .bodySmall)
        }
        .foregroundStyle(theme.colors.fgMuted)
        .accessibilityElement(children: .combine)
    }
}

// MARK: Disclaimer

/// A quiet note under the composer or a response, such as a reminder to check important facts.
public struct StanceDisclaimerNote<Action: View>: View {
    private let text: String?
    private let icon: StanceIconName?
    private let action: Action
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - text: The note. Defaults to a localised reminder that AI can make mistakes.
    ///   - icon: An icon before the note, or `nil` for none.
    ///   - action: A link or button after the note.
    public init(_ text: String? = nil, icon: StanceIconName? = .info, @ViewBuilder action: () -> Action = { EmptyView() }) {
        self.text = text
        self.icon = icon
        self.action = action()
    }

    public var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.xs) {
            if let icon {
                StanceIcon(icon, size: StanceSize.iconSm - StanceSpacing.xxs)
                    .alignmentGuide(.firstTextBaseline) { $0[.bottom] - StanceSpacing.xxs }
            }
            Text(text ?? stanceString("stance.ai.disclaimer", locale)).stanceText(.caption)
            action
        }
        .foregroundStyle(theme.colors.fgMuted)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: Feedback

/// A reason offered after a rating.
public struct StanceFeedbackReason: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The visible text.
    public var label: String

    /// Creates a reason.
    public init(id: String, label: String) {
        self.id = id
        self.label = label
    }
}

/// What the reader submitted.
public struct StanceFeedback: Equatable, Sendable {
    /// The rating.
    public var value: StanceRating
    /// The identifiers of the chosen reasons, in the order they were chosen.
    public var reasons: [String]
    /// The comment the reader wrote.
    public var comment: String

    /// Creates feedback.
    public init(value: StanceRating, reasons: [String] = [], comment: String = "") {
        self.value = value
        self.reasons = reasons
        self.comment = comment
    }
}

/// The feedback flow behind ``StanceFeedbackBar``: idle, rated, detail, submitted.
public struct StanceFeedbackFlow: Equatable, Sendable {
    /// Where the reader is in the flow.
    public enum Stage: String, CaseIterable, Sendable {
        /// No rating yet.
        case idle
        /// Rated, with no detail open.
        case rated
        /// Rated, choosing reasons or writing a comment.
        case detail
        /// Detail was sent. The bar shows a thank you.
        case submitted
    }

    /// Where the reader is in the flow.
    public private(set) var stage: Stage
    /// The rating.
    public private(set) var value: StanceRating?
    /// The identifiers of the chosen reasons, in the order they were chosen.
    public private(set) var reasons: [String] = []
    /// The comment the reader wrote.
    public var comment = ""

    /// Creates a flow, starting from an existing rating if there is one.
    public init(value: StanceRating? = nil) {
        self.value = value
        stage = value == nil ? .idle : .rated
    }

    /// Records a tap on a thumb. Tapping the current rating clears it.
    ///
    /// - Parameter hasDetail: Whether reasons or a comment can follow.
    /// - Returns: The feedback to send now, when there is no detail step.
    public mutating func rate(_ tapped: StanceRating, hasDetail: Bool) -> StanceFeedback? {
        guard stage != .submitted else { return nil }
        let new = StanceRating.toggled(value, tapped: tapped)
        if new != value {
            reasons = []
            comment = ""
        }
        value = new
        guard let new else {
            stage = .idle
            return nil
        }
        stage = hasDetail ? .detail : .rated
        return hasDetail ? nil : StanceFeedback(value: new)
    }

    /// Selects or clears a reason while detail is open.
    public mutating func toggleReason(_ id: String) {
        guard stage == .detail else { return }
        if let index = reasons.firstIndex(of: id) { reasons.remove(at: index) } else { reasons.append(id) }
    }

    /// Closes the detail step without sending reasons or a comment.
    /// - Returns: The bare rating to send.
    public mutating func skip() -> StanceFeedback? {
        guard stage == .detail, let value else { return nil }
        reasons = []
        comment = ""
        stage = .rated
        return StanceFeedback(value: value)
    }

    /// Sends the rating with its reasons and comment.
    public mutating func submit() -> StanceFeedback? {
        guard stage == .detail, let value else { return nil }
        stage = .submitted
        return StanceFeedback(value: value, reasons: reasons, comment: comment.trimmingCharacters(in: .whitespacesAndNewlines))
    }
}

/// The words used by ``StanceFeedbackBar``. Leave a value `nil` for the localised default.
public struct StanceFeedbackBarLabels: Sendable {
    /// Replaces the built in text for "prompt".
    public var prompt: String?
    /// Replaces the built in text for "good response".
    public var goodResponse: String?
    /// Replaces the built in text for "bad response".
    public var badResponse: String?
    /// Replaces the built in text for "reasons up".
    public var reasonsUp: String?
    /// Replaces the built in text for "reasons down".
    public var reasonsDown: String?
    /// Replaces the built in text for "comment".
    public var comment: String?
    /// Replaces the built in text for "submit".
    public var submit: String?
    /// Replaces the built in text for "skip".
    public var skip: String?
    /// Replaces the built in text for "thanks".
    public var thanks: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(
        prompt: String? = nil, goodResponse: String? = nil, badResponse: String? = nil, reasonsUp: String? = nil, reasonsDown: String? = nil,
        comment: String? = nil, submit: String? = nil, skip: String? = nil, thanks: String? = nil
    ) {
        self.prompt = prompt
        self.goodResponse = goodResponse
        self.badResponse = badResponse
        self.reasonsUp = reasonsUp
        self.reasonsDown = reasonsDown
        self.comment = comment
        self.submit = submit
        self.skip = skip
        self.thanks = thanks
    }
}

/// Thumbs up or down, followed by optional reasons and a comment, then a thank you.
///
/// The thumbs are toggle buttons. Reasons are a labelled group of toggles. The thank you is
/// announced when the feedback is sent.
public struct StanceFeedbackBar: View {
    private let reasons: [StanceFeedbackReason]
    private let allowsComment: Bool
    private let labels: StanceFeedbackBarLabels
    private let onSubmit: (StanceFeedback) -> Void
    @Binding private var value: StanceRating?
    @State private var flow: StanceFeedbackFlow
    @State private var bounce = 0
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// - Parameters:
    ///   - value: The rating.
    ///   - reasons: Reasons offered after a rating.
    ///   - allowsComment: Offer a comment field after a rating.
    ///   - labels: Replacement words for the built in labels.
    ///   - onSubmit: Called with the rating, and again with reasons and a comment if the reader adds them.
    public init(
        value: Binding<StanceRating?>,
        reasons: [StanceFeedbackReason] = [],
        allowsComment: Bool = true,
        labels: StanceFeedbackBarLabels = .init(),
        onSubmit: @escaping (StanceFeedback) -> Void = { _ in }
    ) {
        _value = value
        self.reasons = reasons
        self.allowsComment = allowsComment
        self.labels = labels
        self.onSubmit = onSubmit
        _flow = State(initialValue: StanceFeedbackFlow(value: value.wrappedValue))
    }

    private var hasDetail: Bool { !reasons.isEmpty || allowsComment }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            if flow.stage == .submitted {
                HStack(spacing: StanceSpacing.sm) {
                    StanceIcon(.checkCircle, size: StanceSize.iconSm)
                    Text(labels.thanks ?? stanceString("stance.ai.feedback.thanks", locale)).stanceText(.bodySmall)
                }
                .foregroundStyle(theme.colors.fgMuted)
                .frame(minHeight: StanceSize.touchTarget)
                .accessibilityElement(children: .combine)
            } else {
                StanceFlowLayout(spacing: StanceSpacing.xs, lineSpacing: 0) {
                    Text(labels.prompt ?? stanceString("stance.ai.feedback.prompt", locale))
                        .stanceText(.bodySmall)
                        .foregroundStyle(theme.colors.fgMuted)
                        .frame(minHeight: StanceSize.touchTarget)
                    HStack(spacing: 0) {
                        StanceQuietIconButton(
                            symbol: flow.value == .up ? "hand.thumbsup.fill" : "hand.thumbsup",
                            label: labels.goodResponse ?? stanceString("stance.ai.actions.good", locale),
                            isOn: flow.value == .up,
                            bounce: flow.value == .up ? bounce : 0
                        ) { rate(.up) }
                        StanceQuietIconButton(
                            symbol: flow.value == .down ? "hand.thumbsdown.fill" : "hand.thumbsdown",
                            label: labels.badResponse ?? stanceString("stance.ai.actions.bad", locale),
                            isOn: flow.value == .down,
                            bounce: flow.value == .down ? bounce : 0
                        ) { rate(.down) }
                    }
                }
                if flow.stage == .detail { detail }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .stanceAnimation(.normal, value: flow.stage)
        .onChange(of: value) { _, new in
            if new != flow.value { flow = StanceFeedbackFlow(value: new) }
        }
    }

    private var detail: some View {
        let title = flow.value == .up
            ? labels.reasonsUp ?? stanceString("stance.ai.feedback.reasonsUp", locale)
            : labels.reasonsDown ?? stanceString("stance.ai.feedback.reasonsDown", locale)
        let commentLabel = labels.comment ?? stanceString("stance.ai.feedback.comment", locale)
        return VStack(alignment: .leading, spacing: StanceSpacing.md) {
            if !reasons.isEmpty {
                VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                    Text(title).stanceText(.label).accessibilityAddTraits(.isHeader)
                    StanceFlowLayout(spacing: StanceSpacing.sm, lineSpacing: 0) {
                        ForEach(reasons) { reason in
                            StanceChoiceChip(title: reason.label, isSelected: flow.reasons.contains(reason.id)) {
                                flow.toggleReason(reason.id)
                                StanceHaptics.selection()
                            }
                        }
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(title)
            }
            if allowsComment {
                TextField(commentLabel, text: $flow.comment, axis: .vertical)
                    .lineLimit(1 ... 4)
                    .padding(.vertical, StanceSpacing.sm)
                    .modifier(StanceFieldChrome(isFocused: false, isInvalid: false))
                    .accessibilityLabel(commentLabel)
            }
            StanceButtonGroup {
                StanceButton(labels.submit ?? stanceString("stance.ai.feedback.submit", locale), size: .small) {
                    guard let feedback = flow.submit() else { return }
                    onSubmit(feedback)
                    StanceHaptics.success()
                    StanceAnnouncer.announce(labels.thanks ?? stanceString("stance.ai.feedback.thanks", locale))
                }
                StanceButton(labels.skip ?? stanceString("stance.ai.feedback.skip", locale), variant: .ghost, size: .small) {
                    if let feedback = flow.skip() { onSubmit(feedback) }
                }
            }
        }
        .padding(StanceSpacing.md)
        .background(theme.colors.bgSubtle, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .transition(.opacity)
    }

    private func rate(_ tapped: StanceRating) {
        StanceHaptics.selection()
        bounce += 1
        let immediate = flow.rate(tapped, hasDetail: hasDetail)
        value = flow.value
        if let immediate { onSubmit(immediate) }
    }
}

// MARK: Report dialog

/// A reason a response can be reported for.
public struct StanceReportCategory: Identifiable, Hashable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The visible text.
    public var label: String
    /// A short supporting line.
    public var description: String?

    /// Creates a category.
    public init(id: String, label: String, description: String? = nil) {
        self.id = id
        self.label = label
        self.description = description
    }
}

/// A submitted report.
public struct StanceReport: Equatable, Sendable {
    /// The identifier of the chosen category.
    public var category: String
    /// What the reader wrote.
    public var details: String

    /// Creates a report.
    public init(category: String, details: String = "") {
        self.category = category
        self.details = details
    }
}

/// The words used by ``StanceReportDialog``. Leave a value `nil` for the localised default.
public struct StanceReportDialogLabels: Sendable {
    /// Replaces the built in text for "title".
    public var title: String?
    /// Replaces the built in text for "description".
    public var description: String?
    /// Replaces the built in text for "category".
    public var category: String?
    /// Replaces the built in text for "details".
    public var details: String?
    /// Replaces the built in text for "details helper".
    public var detailsHelper: String?
    /// Replaces the built in text for "submit".
    public var submit: String?
    /// Replaces the built in text for "cancel".
    public var cancel: String?
    /// Replaces the built in text for "sent".
    public var sent: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(
        title: String? = nil, description: String? = nil, category: String? = nil, details: String? = nil,
        detailsHelper: String? = nil, submit: String? = nil, cancel: String? = nil, sent: String? = nil
    ) {
        self.title = title
        self.description = description
        self.category = category
        self.details = details
        self.detailsHelper = detailsHelper
        self.submit = submit
        self.cancel = cancel
        self.sent = sent
    }
}

/// A form to report a response with a category and details.
///
/// Present it with `.stanceReportDialog(isPresented:categories:onSubmit:)`, which shows it in a
/// native sheet with medium and large detents. Submit is disabled until a category is chosen,
/// and the form stays open and busy while the submission is pending.
public struct StanceReportDialog: View {
    private let categories: [StanceReportCategory]
    private let labels: StanceReportDialogLabels
    private let onSubmit: (StanceReport) async -> Void
    private let onCancel: () -> Void
    @State private var category = ""
    @State private var details = ""
    @State private var isSubmitting = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - categories: The reasons to choose from.
    ///   - labels: Replacement words for the built in labels.
    ///   - onSubmit: Called with the report. The form stays busy until it returns.
    ///   - onCancel: Called when the reader cancels.
    public init(
        categories: [StanceReportCategory],
        labels: StanceReportDialogLabels = .init(),
        onSubmit: @escaping (StanceReport) async -> Void,
        onCancel: @escaping () -> Void = {}
    ) {
        self.categories = categories
        self.labels = labels
        self.onSubmit = onSubmit
        self.onCancel = onCancel
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: StanceSpacing.lg) {
                    Text(labels.description ?? stanceString("stance.ai.report.description", locale))
                        .stanceText(.bodySmall)
                        .foregroundStyle(theme.colors.fgMuted)
                    StanceRadioGroup(
                        labels.category ?? stanceString("stance.ai.report.category", locale),
                        selection: $category,
                        options: categories.map { StanceRadioOption($0.id, label: $0.label, description: $0.description) }
                    )
                    StanceTextEditor(
                        labels.details ?? stanceString("stance.ai.report.details", locale),
                        text: $details,
                        helper: labels.detailsHelper ?? stanceString("stance.ai.report.detailsHelper", locale)
                    )
                }
                .padding(StanceSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
                .disabled(isSubmitting)
            }
            .background(theme.colors.bgCanvas)
            .navigationTitle(labels.title ?? stanceString("stance.ai.report.title", locale))
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(labels.cancel ?? stanceString("stance.cancel", locale), action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSubmitting {
                        ProgressView().accessibilityLabel(stanceString("stance.inProgress", locale))
                    } else {
                        Button(labels.submit ?? stanceString("stance.ai.report.submit", locale)) {
                            let report = StanceReport(category: category, details: details.trimmingCharacters(in: .whitespacesAndNewlines))
                            isSubmitting = true
                            Task {
                                await onSubmit(report)
                                isSubmitting = false
                                StanceHaptics.success()
                                StanceAnnouncer.announce(labels.sent ?? stanceString("stance.ai.report.sent", locale))
                            }
                        }
                        .disabled(category.isEmpty)
                    }
                }
            }
        }
    }
}

extension View {
    /// Presents ``StanceReportDialog`` in a native sheet with medium and large detents.
    ///
    /// The sheet stays open and busy while `onSubmit` runs, then closes itself. Cancel closes it.
    public func stanceReportDialog(
        isPresented: Binding<Bool>,
        categories: [StanceReportCategory],
        labels: StanceReportDialogLabels = .init(),
        onSubmit: @escaping (StanceReport) async -> Void
    ) -> some View {
        modifier(StanceReportDialogModifier(isPresented: isPresented, categories: categories, labels: labels, onSubmit: onSubmit))
    }
}

private struct StanceReportDialogModifier: ViewModifier {
    @Binding var isPresented: Bool
    let categories: [StanceReportCategory]
    let labels: StanceReportDialogLabels
    let onSubmit: (StanceReport) async -> Void
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    func body(content: Content) -> some View {
        content.sheet(isPresented: $isPresented) {
            StanceReportDialog(categories: categories, labels: labels) { report in
                await onSubmit(report)
                isPresented = false
            } onCancel: {
                isPresented = false
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
            .modifier(StancePresentationChrome(theme: theme, locale: locale, layoutDirection: layoutDirection))
        }
    }
}

// MARK: Sensitive content gate

/// The words used by ``StanceSensitiveContentGate``. Leave a value `nil` for the localised default.
public struct StanceSensitiveContentLabels: Sendable {
    /// Replaces the built in text for "show".
    public var show: String?
    /// Replaces the built in text for "hide".
    public var hide: String?

    /// Creates the labels. Every value defaults to the localised built in text.
    public init(show: String? = nil, hide: String? = nil) {
        self.show = show
        self.hide = hide
    }
}

/// Hides content behind a notice until the reader chooses to see it.
///
/// While hidden, the content is not in the view tree, so it is not in the accessibility tree
/// either. On reveal, VoiceOver focus moves to the content.
public struct StanceSensitiveContentGate<Content: View>: View {
    private let title: String?
    private let description: String?
    private let labels: StanceSensitiveContentLabels
    private let external: Binding<Bool>?
    private let onRevealedChange: ((Bool) -> Void)?
    private let content: Content
    @State private var internalRevealed: Bool
    @AccessibilityFocusState private var contentFocused: Bool
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// Creates a gate that manages its own state.
    /// - Parameters:
    ///   - title: The notice title. Defaults to a localised "Sensitive content".
    ///   - description: Why the content is hidden. Defaults to a short localised line.
    ///   - defaultRevealed: Whether the content starts visible.
    ///   - labels: Replacement words for the show and hide buttons.
    ///   - onRevealedChange: Called when the reader shows or hides the content.
    ///   - content: The content behind the gate.
    public init(
        title: String? = nil,
        description: String? = nil,
        defaultRevealed: Bool = false,
        labels: StanceSensitiveContentLabels = .init(),
        onRevealedChange: ((Bool) -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.description = description
        self.labels = labels
        external = nil
        self.onRevealedChange = onRevealedChange
        self.content = content()
        _internalRevealed = State(initialValue: defaultRevealed)
    }

    /// Creates a gate whose revealed state the app owns.
    public init(
        title: String? = nil,
        description: String? = nil,
        isRevealed: Binding<Bool>,
        labels: StanceSensitiveContentLabels = .init(),
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.description = description
        self.labels = labels
        external = isRevealed
        onRevealedChange = nil
        self.content = content()
        _internalRevealed = State(initialValue: isRevealed.wrappedValue)
    }

    private var isRevealed: Bool { external?.wrappedValue ?? internalRevealed }

    private func setRevealed(_ new: Bool) {
        if let external { external.wrappedValue = new } else { internalRevealed = new }
        onRevealedChange?(new)
        if new {
            // After the content is in the tree, move VoiceOver to it.
            Task { contentFocused = true }
        }
    }

    public var body: some View {
        Group {
            if isRevealed {
                VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                    content.accessibilityFocused($contentFocused)
                    StanceButton(labels.hide ?? stanceString("stance.ai.sensitive.hide", locale), variant: .ghost, size: .small, leadingIcon: .eyeOff) {
                        setRevealed(false)
                    }
                }
                .transition(.opacity)
            } else {
                let shape = RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
                HStack(alignment: .top, spacing: StanceSpacing.md) {
                    StanceIcon(.eyeOff, size: StanceSize.iconMd).foregroundStyle(theme.colors.fgMuted)
                    VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                            Text(title ?? stanceString("stance.ai.sensitive.title", locale)).stanceText(.label)
                            Text(description ?? stanceString("stance.ai.sensitive.description", locale)).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                        }
                        .accessibilityElement(children: .combine)
                        StanceButton(labels.show ?? stanceString("stance.ai.sensitive.show", locale), variant: .outline, size: .small, leadingIcon: .eye) {
                            setRevealed(true)
                        }
                        .padding(.top, StanceSpacing.xs)
                    }
                    Spacer(minLength: 0)
                }
                .padding(StanceSpacing.md)
                .background(theme.colors.bgSubtle, in: shape)
                .overlay { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
                .transition(.opacity)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .stanceAnimation(.normal, value: isRevealed)
    }
}
