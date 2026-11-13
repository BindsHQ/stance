import SwiftUI

// AI inside a product, wave two: the summary card, insight callout, semantic search results and
// the docked copilot panel.

// MARK: Summary card

/// Words a ``StanceSummaryCard`` uses. Leave a value out to keep the localised default.
public struct StanceSummaryCardLabels: Sendable {
    public var title: String?
    public var regenerate: String?
    public var expand: String?
    public var showMore: (@Sendable (Int) -> String)?
    public var updated: (@Sendable (String) -> String)?
    public var failed: String?

    /// - Parameters:
    ///   - title: The heading when none is given. Defaults to a localised "Summary".
    ///   - regenerate: Defaults to a localised "Regenerate".
    ///   - expand: Opens the original. Defaults to a localised "View original".
    ///   - showMore: Reveals the hidden points, given how many. Defaults to a localised "Show 3 more".
    ///   - updated: When the summary was made, given a relative time. Defaults to a localised "Updated 5 minutes ago".
    ///   - failed: Shown when the summary failed. Defaults to a localised "The summary could not be created.".
    public init(
        title: String? = nil,
        regenerate: String? = nil,
        expand: String? = nil,
        showMore: (@Sendable (Int) -> String)? = nil,
        updated: (@Sendable (String) -> String)? = nil,
        failed: String? = nil
    ) {
        self.title = title
        self.regenerate = regenerate
        self.expand = expand
        self.showMore = showMore
        self.updated = updated
        self.failed = failed
    }
}

/// An AI summary of a longer item: key points, a generated label, its sources, and a way back
/// to the original.
///
/// Pass key points, or your own content. The card always carries ``StanceAIGeneratedLabel``,
/// lists sources with ``StanceSourceList`` and, when collapsible, folds with the system
/// `DisclosureGroup`. A pending summary shows a skeleton; the result is announced once.
public struct StanceSummaryCard<Content: View>: View {
    private let title: String?
    private let points: [String]?
    private let maxPoints: Int?
    private let status: StanceGenerationStatus
    private let sources: [StanceSource]
    private let updatedAt: Date?
    private let now: Date
    private let isCollapsible: Bool
    private let labels: StanceSummaryCardLabels
    private let onRegenerate: (() -> Void)?
    private let onExpand: (() -> Void)?
    private let content: Content
    @State private var isExpanded = true
    @State private var showsAllPoints = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// Creates a summary with your own content.
    /// - Parameters:
    ///   - title: The heading. Defaults to a localised "Summary".
    ///   - status: The state of the summary. A skeleton shows while it is requested.
    ///   - sources: What the summary is based on.
    ///   - updatedAt: When the summary was made, shown as a relative time.
    ///   - now: The reference time for `updatedAt`.
    ///   - isCollapsible: Lets the card fold to its heading.
    ///   - labels: Replacements for the built in words.
    ///   - onRegenerate: Asks for a new summary.
    ///   - onExpand: Opens the original item.
    ///   - content: The summary.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        status: StanceGenerationStatus = .complete,
        sources: [StanceSource] = [],
        updatedAt: Date? = nil,
        now: Date = .now,
        isCollapsible: Bool = false,
        labels: StanceSummaryCardLabels = .init(),
        onRegenerate: (() -> Void)? = nil,
        onExpand: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        points = nil
        maxPoints = nil
        self.status = status
        self.sources = sources
        self.updatedAt = updatedAt
        self.now = now
        self.isCollapsible = isCollapsible
        self.labels = labels
        self.onRegenerate = onRegenerate
        self.onExpand = onExpand
        self.content = content()
    }

    /// The points to show for an optional maximum, and how many are held back.
    public nonisolated static func visiblePoints(_ points: [String], max: Int?, showsAll: Bool) -> (shown: [String], hidden: Int) {
        guard let max, max >= 0, !showsAll, points.count > max else { return (points, 0) }
        return (Array(points.prefix(max)), points.count - max)
    }

    /// When the summary was made in words, such as "Updated 5 minutes ago", localised for `locale`.
    public nonisolated static func updatedText(_ date: Date, now: Date = .now, locale: Locale = .current) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = locale
        formatter.unitsStyle = .full
        return stanceString("stance.ai.summary.updated \(formatter.localizedString(for: date, relativeTo: now))", locale)
    }

    private var resolvedTitle: String { title ?? labels.title ?? stanceString("stance.ai.summary.title", locale) }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            if isCollapsible {
                DisclosureGroup(isExpanded: $isExpanded) { details } label: { heading }
                    .disclosureGroupStyle(.stance)
            } else {
                heading
                details
            }
        }
        .stanceCard()
        .onChange(of: status) { old, new in
            if let text = StanceGenerationStatus.announcement(from: old, to: new, locale: locale) { StanceAnnouncer.announce(text, urgent: new == .error) }
        }
    }

    private var heading: some View {
        HStack(spacing: StanceSpacing.sm) {
            StanceIcon(.sparkle, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted).accessibilityHidden(true)
            Text(resolvedTitle).stanceText(.subheading).multilineTextAlignment(.leading).accessibilityAddTraits(.isHeader)
        }
    }

    private var details: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            switch status {
            case .submitted:
                StanceStreamingSkeleton()
            case .error:
                Label {
                    Text(labels.failed ?? stanceString("stance.ai.summary.failed", locale))
                } icon: {
                    StanceIcon(.alertCircle, size: StanceSize.iconSm)
                }
                .stanceText(.bodySmall)
                .foregroundStyle(theme.colors.dangerFg)
            default:
                if let points { pointList(points) } else { content.frame(maxWidth: .infinity, alignment: .leading) }
                if !sources.isEmpty { StanceSourceList(sources) }
            }
            StanceFlowLayout(spacing: StanceSpacing.md, lineSpacing: StanceSpacing.xs) {
                StanceAIGeneratedLabel(.generated)
                if let updatedAt {
                    Text(updatedLabel(updatedAt)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                }
            }
            if onRegenerate != nil || onExpand != nil {
                // One row while it fits, stacked at large text sizes.
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: StanceSpacing.sm) { footerButtons }
                    VStack(alignment: .leading, spacing: StanceSpacing.xs) { footerButtons }
                }
            }
        }
    }

    @ViewBuilder private var footerButtons: some View {
        if let onExpand {
            StanceButton(labels.expand ?? stanceString("stance.ai.summary.expand", locale), variant: .outline, size: .small, action: onExpand)
                .fixedSize()
        }
        if let onRegenerate {
            StanceButton(labels.regenerate ?? stanceString("stance.ai.summary.regenerate", locale), variant: .ghost, size: .small, leadingIcon: .refresh, action: onRegenerate)
                .fixedSize()
                .disabled(status.isActive)
        }
    }

    private func updatedLabel(_ date: Date) -> String {
        guard let custom = labels.updated else { return Self.updatedText(date, now: now, locale: locale) }
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = locale
        formatter.unitsStyle = .full
        return custom(formatter.localizedString(for: date, relativeTo: now))
    }

    private func pointList(_ points: [String]) -> some View {
        let visible = Self.visiblePoints(points, max: maxPoints, showsAll: showsAllPoints)
        return VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            ForEach(Array(visible.shown.enumerated()), id: \.offset) { _, point in
                HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
                    Text(verbatim: "\u{2022}").stanceText(.body).foregroundStyle(theme.colors.fgMuted).accessibilityHidden(true)
                    Text(point).stanceText(.body).foregroundStyle(theme.colors.fgDefault).fixedSize(horizontal: false, vertical: true)
                }
                .accessibilityElement(children: .combine)
            }
            if visible.hidden > 0 {
                StanceButton(labels.showMore?(visible.hidden) ?? stanceString("stance.ai.summary.showMore \(visible.hidden)", locale), variant: .link, size: .small) {
                    showsAllPoints = true
                }
            }
        }
    }
}

extension StanceSummaryCard where Content == EmptyView {
    /// Creates a summary from key points.
    /// - Parameters:
    ///   - title: The heading. Defaults to a localised "Summary".
    ///   - points: The key points, one per line.
    ///   - maxPoints: Shows at most this many points and a button for the rest.
    ///   - status: The state of the summary. A skeleton shows while it is requested.
    ///   - sources: What the summary is based on.
    ///   - updatedAt: When the summary was made, shown as a relative time.
    ///   - now: The reference time for `updatedAt`.
    ///   - isCollapsible: Lets the card fold to its heading.
    ///   - labels: Replacements for the built in words.
    ///   - onRegenerate: Asks for a new summary.
    ///   - onExpand: Opens the original item.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        points: [String],
        maxPoints: Int? = nil,
        status: StanceGenerationStatus = .complete,
        sources: [StanceSource] = [],
        updatedAt: Date? = nil,
        now: Date = .now,
        isCollapsible: Bool = false,
        labels: StanceSummaryCardLabels = .init(),
        onRegenerate: (() -> Void)? = nil,
        onExpand: (() -> Void)? = nil
    ) {
        self.title = title
        self.points = points
        self.maxPoints = maxPoints
        self.status = status
        self.sources = sources
        self.updatedAt = updatedAt
        self.now = now
        self.isCollapsible = isCollapsible
        self.labels = labels
        self.onRegenerate = onRegenerate
        self.onExpand = onExpand
        content = EmptyView()
    }

    /// Creates a summary from key points, with a title looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        points: [String],
        maxPoints: Int? = nil,
        status: StanceGenerationStatus = .complete,
        sources: [StanceSource] = [],
        updatedAt: Date? = nil,
        now: Date = .now,
        isCollapsible: Bool = false,
        labels: StanceSummaryCardLabels = .init(),
        onRegenerate: (() -> Void)? = nil,
        onExpand: (() -> Void)? = nil
    ) {
        self.init(
            String(localized: titleKey), points: points, maxPoints: maxPoints, status: status, sources: sources, updatedAt: updatedAt, now: now,
            isCollapsible: isCollapsible, labels: labels, onRegenerate: onRegenerate, onExpand: onExpand
        )
    }
}

extension StanceSummaryCard {
    /// Creates a summary with your own content and a title looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        status: StanceGenerationStatus = .complete,
        sources: [StanceSource] = [],
        updatedAt: Date? = nil,
        now: Date = .now,
        isCollapsible: Bool = false,
        labels: StanceSummaryCardLabels = .init(),
        onRegenerate: (() -> Void)? = nil,
        onExpand: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.init(
            String(localized: titleKey), status: status, sources: sources, updatedAt: updatedAt, now: now, isCollapsible: isCollapsible,
            labels: labels, onRegenerate: onRegenerate, onExpand: onExpand, content: content
        )
    }
}

// MARK: Insight callout

/// How a ``StanceInsightCallout`` reads. Tone is carried by an icon and words on the ink scale.
public enum StanceInsightTone: String, CaseIterable, Sendable {
    /// Something worth knowing.
    case neutral
    /// A change for the better.
    case positive
    /// Something that needs a look.
    case attention

    /// The tone in words, such as "Needs attention", localised for `locale`.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .neutral: stanceString("stance.ai.insight.neutral", locale)
        case .positive: stanceString("stance.ai.insight.positive", locale)
        case .attention: stanceString("stance.ai.insight.attention", locale)
        }
    }

    var icon: StanceIconName {
        switch self {
        case .neutral: .sparkle
        case .positive: .checkCircle
        case .attention: .alertTriangle
        }
    }
}

/// Words a ``StanceInsightCallout`` uses. Leave a value out to keep the localised default.
public struct StanceInsightCalloutLabels: Sendable {
    public var tone: String?
    public var evidence: String?
    public var dismiss: String?

    /// - Parameters:
    ///   - tone: The eyebrow above the title. Defaults to the tone in words, such as "Insight".
    ///   - evidence: The disclosure that holds the evidence. Defaults to a localised "Evidence".
    ///   - dismiss: Defaults to a localised "Dismiss".
    public init(tone: String? = nil, evidence: String? = nil, dismiss: String? = nil) {
        self.tone = tone
        self.evidence = evidence
        self.dismiss = dismiss
    }
}

/// A finding the system noticed in your data, with the evidence behind it and one suggested action.
///
/// The tone is stated by an icon and an eyebrow in words on ink scale surfaces, never by a hue.
/// Evidence sits in a system `DisclosureGroup`, confidence in a ``StanceConfidenceBadge``.
public struct StanceInsightCallout<Content: View, Evidence: View>: View {
    private let title: String
    private let tone: StanceInsightTone
    private let confidence: StanceConfidenceLevel?
    private let actionTitle: String?
    private let labels: StanceInsightCalloutLabels
    private let action: (() -> Void)?
    private let onDismiss: (() -> Void)?
    private let content: Content
    private let evidence: Evidence
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The finding in one line.
    ///   - tone: Neutral, positive or attention.
    ///   - confidence: How sure the system is, shown in words.
    ///   - actionTitle: The one suggested action.
    ///   - labels: Replacements for the built in words.
    ///   - action: Runs the suggested action.
    ///   - onDismiss: Adds a dismiss button.
    ///   - content: The explanation.
    ///   - evidence: The data behind the finding, shown in a disclosure.
    @_disfavoredOverload
    public init(
        _ title: String,
        tone: StanceInsightTone = .neutral,
        confidence: StanceConfidenceLevel? = nil,
        actionTitle: String? = nil,
        labels: StanceInsightCalloutLabels = .init(),
        action: (() -> Void)? = nil,
        onDismiss: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content,
        @ViewBuilder evidence: () -> Evidence = { EmptyView() }
    ) {
        self.title = title
        self.tone = tone
        self.confidence = confidence
        self.actionTitle = actionTitle
        self.labels = labels
        self.action = action
        self.onDismiss = onDismiss
        self.content = content()
        self.evidence = evidence()
    }

    /// Creates a callout whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        tone: StanceInsightTone = .neutral,
        confidence: StanceConfidenceLevel? = nil,
        actionTitle: String? = nil,
        labels: StanceInsightCalloutLabels = .init(),
        action: (() -> Void)? = nil,
        onDismiss: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content,
        @ViewBuilder evidence: () -> Evidence = { EmptyView() }
    ) {
        self.init(
            String(localized: titleKey), tone: tone, confidence: confidence, actionTitle: actionTitle, labels: labels, action: action,
            onDismiss: onDismiss, content: content, evidence: evidence
        )
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous)
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            HStack(alignment: .top, spacing: StanceSpacing.md) {
                StanceIcon(tone.icon, size: StanceSize.iconMd).foregroundStyle(theme.colors.fgDefault).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                    Text(labels.tone ?? tone.label(locale: locale)).stanceText(.eyebrow).foregroundStyle(theme.colors.fgMuted)
                    Text(title).stanceText(.label).accessibilityAddTraits(.isHeader)
                    content.stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted)
                }
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                if let onDismiss {
                    StanceProductIconButton(icon: .x, label: labels.dismiss ?? stanceString("stance.dismiss", locale), action: onDismiss)
                        .padding(.top, -StanceSpacing.md)
                        .padding(.trailing, -StanceSpacing.md)
                }
            }
            if let confidence { StanceConfidenceBadge(confidence) }
            if Evidence.self != EmptyView.self {
                DisclosureGroup {
                    evidence.frame(maxWidth: .infinity, alignment: .leading)
                } label: {
                    Text(labels.evidence ?? stanceString("stance.ai.insight.evidence", locale))
                }
                .disclosureGroupStyle(.stance)
            }
            if let actionTitle, let action {
                StanceButton(actionTitle, variant: .outline, size: .small, action: action)
            }
        }
        .padding(StanceSpacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tone == .neutral ? theme.colors.bgSurface : tone == .positive ? theme.colors.bgSubtle : theme.colors.bgMuted, in: shape)
        .overlay {
            shape.strokeBorder(tone == .attention ? theme.colors.borderStrong : theme.colors.borderDefault, lineWidth: tone == .attention ? theme.controlBorderWidth : theme.borderWidth)
        }
        .accessibilityElement(children: .contain)
    }
}

// MARK: Semantic search results

/// One result in ``StanceSemanticSearchResults``.
public struct StanceSearchResult: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// The title of the matching item.
    public var title: String
    /// Where the item lives. Only http and https links are opened.
    public var url: URL?
    /// The matching passage.
    public var snippet: String
    /// Words or phrases in the snippet to mark.
    public var highlights: [String]
    /// Where the result comes from, such as a workspace or a site.
    public var source: String?
    /// How close the match is, from 0 to 1.
    public var score: Double?
    /// Why it matched, in a sentence.
    public var reason: String?

    /// Creates a result.
    public init(id: String, title: String, url: URL? = nil, snippet: String, highlights: [String] = [], source: String? = nil, score: Double? = nil, reason: String? = nil) {
        self.id = id
        self.title = title
        self.url = url
        self.snippet = snippet
        self.highlights = highlights
        self.source = source
        self.score = score
        self.reason = reason
    }
}

/// Words ``StanceSemanticSearchResults`` uses. Leave a value out to keep the localised default.
public struct StanceSemanticSearchLabels: Sendable {
    public var list: String?
    public var answer: String?
    public var loading: String?
    public var score: (@Sendable (String) -> String)?
    public var reason: (@Sendable (String) -> String)?
    public var count: (@Sendable (Int) -> String)?

    /// - Parameters:
    ///   - list: The accessible name of the results. Defaults to a localised "Search results".
    ///   - answer: The name of the answer region. Defaults to a localised "Answer".
    ///   - loading: The name of the loading state. Defaults to a localised "Searching".
    ///   - score: The match in words, given a percentage. Defaults to a localised "92% match".
    ///   - reason: Why a result matched, given the reason. Defaults to a localised "Why it matched: reason".
    ///   - count: The result count, shown and announced. Defaults to a localised "12 results".
    public init(
        list: String? = nil,
        answer: String? = nil,
        loading: String? = nil,
        score: (@Sendable (String) -> String)? = nil,
        reason: (@Sendable (String) -> String)? = nil,
        count: (@Sendable (Int) -> String)? = nil
    ) {
        self.list = list
        self.answer = answer
        self.loading = loading
        self.score = score
        self.reason = reason
        self.count = count
    }
}

/// Search results ranked by meaning, under an optional AI answer.
///
/// Each result shows the matching passage with its highlights in bold on a tinted background
/// (weight as well as tone, never colour alone), where it comes from, how close the match is
/// in words and why it matched. Results are buttons; without a handler, http and https links
/// open with the system. The count is announced once when loading ends.
public struct StanceSemanticSearchResults<Answer: View, EmptyContent: View>: View {
    private let query: String
    private let results: [StanceSearchResult]
    private let status: StanceGenerationStatus
    private let labels: StanceSemanticSearchLabels
    private let onResultSelect: ((StanceSearchResult) -> Void)?
    private let answer: Answer
    private let emptyState: EmptyContent
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.openURL) private var openURL

    /// - Parameters:
    ///   - query: What was searched for, used in the empty state.
    ///   - results: The results, best first.
    ///   - status: The state of the search. Skeletons show while it is active.
    ///   - labels: Replacements for the built in words.
    ///   - answer: An AI answer shown above the results.
    ///   - emptyState: Shown when the search finished with no results. Defaults to a localised message.
    ///   - onResultSelect: Opens a result. Without it, http and https links open with the system.
    public init(
        query: String,
        results: [StanceSearchResult],
        status: StanceGenerationStatus = .complete,
        labels: StanceSemanticSearchLabels = .init(),
        @ViewBuilder answer: () -> Answer = { EmptyView() },
        @ViewBuilder emptyState: () -> EmptyContent = { EmptyView() },
        onResultSelect: ((StanceSearchResult) -> Void)? = nil
    ) {
        self.query = query
        self.results = results
        self.status = status
        self.labels = labels
        self.onResultSelect = onResultSelect
        self.answer = answer()
        self.emptyState = emptyState()
    }

    /// Where the highlights fall in a snippet, ignoring case and accents. Ranges are in order,
    /// and overlapping or touching ranges are merged.
    public nonisolated static func highlightRanges(in snippet: String, highlights: [String]) -> [Range<String.Index>] {
        var found: [Range<String.Index>] = []
        for highlight in highlights {
            let term = highlight.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !term.isEmpty else { continue }
            var start = snippet.startIndex
            while start < snippet.endIndex, let range = snippet.range(of: term, options: [.caseInsensitive, .diacriticInsensitive], range: start ..< snippet.endIndex), !range.isEmpty {
                found.append(range)
                start = range.upperBound
            }
        }
        found.sort { $0.lowerBound < $1.lowerBound }
        var merged: [Range<String.Index>] = []
        for range in found {
            if let last = merged.last, range.lowerBound <= last.upperBound {
                merged[merged.count - 1] = last.lowerBound ..< max(last.upperBound, range.upperBound)
            } else {
                merged.append(range)
            }
        }
        return merged
    }

    /// The parts of a snippet in order, each marked as highlighted or not.
    public nonisolated static func segments(of snippet: String, highlights: [String]) -> [(text: String, isHighlighted: Bool)] {
        var parts: [(text: String, isHighlighted: Bool)] = []
        var cursor = snippet.startIndex
        for range in highlightRanges(in: snippet, highlights: highlights) {
            if cursor < range.lowerBound { parts.append((String(snippet[cursor ..< range.lowerBound]), false)) }
            parts.append((String(snippet[range]), true))
            cursor = range.upperBound
        }
        if cursor < snippet.endIndex { parts.append((String(snippet[cursor...]), false)) }
        return parts
    }

    /// A score in words, such as "92% match", localised for `locale`. The score is kept between 0 and 1.
    public nonisolated static func scoreText(_ score: Double, locale: Locale = .current) -> String {
        let clamped = min(max(score, 0), 1)
        return stanceString("stance.ai.semantic.score \(clamped.formatted(.percent.precision(.fractionLength(0)).locale(locale)))", locale)
    }

    /// Whether a link may be opened: only http and https.
    public nonisolated static func isSafeLink(_ url: URL?) -> Bool {
        guard let scheme = url?.scheme?.lowercased() else { return false }
        return scheme == "http" || scheme == "https"
    }

    private func countText(_ count: Int) -> String {
        labels.count?(count) ?? stanceString("stance.results.count \(count)", locale)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            if Answer.self != EmptyView.self, !status.isActive, status != .error {
                answer
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .stanceCard(padding: StanceSpacing.md)
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(labels.answer ?? stanceString("stance.ai.semantic.answer", locale))
            }
            if status.isActive {
                VStack(spacing: StanceSpacing.sm) {
                    ForEach(0 ..< 3, id: \.self) { _ in StanceStreamingSkeleton(lines: 2, variant: .card, label: labels.loading ?? stanceString("stance.ai.semantic.loading", locale)) }
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(labels.loading ?? stanceString("stance.ai.semantic.loading", locale))
                .accessibilityAddTraits(.updatesFrequently)
            } else if results.isEmpty {
                if EmptyContent.self != EmptyView.self {
                    emptyState
                } else {
                    StanceEmptyState(icon: .search, title: stanceString("stance.results.none", locale), message: stanceString("stance.results.noneMessage \(query)", locale))
                }
            } else {
                Text(countText(results.count)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                VStack(spacing: StanceSpacing.sm) {
                    ForEach(results) { result in row(result) }
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(labels.list ?? stanceString("stance.ai.semantic.label", locale))
            }
        }
        .onChange(of: status) { old, new in
            // The count is announced once, when loading ends.
            guard old.isActive, new == .complete else { return }
            StanceAnnouncer.announce(results.isEmpty ? stanceString("stance.results.none", locale) : countText(results.count))
        }
    }

    private func highlighted(_ result: StanceSearchResult) -> AttributedString {
        var text = AttributedString()
        for segment in Self.segments(of: result.snippet, highlights: result.highlights) {
            var part = AttributedString(segment.text)
            if segment.isHighlighted {
                part.inlinePresentationIntent = .stronglyEmphasized
                part.foregroundColor = theme.colors.fgDefault
                part.backgroundColor = theme.colors.bgEmphasis
                if theme.isHighContrast { part.underlineStyle = .single }
            }
            text += part
        }
        return text
    }

    private func reasonText(_ reason: String) -> String {
        labels.reason?(reason) ?? stanceString("stance.ai.semantic.reason \(reason)", locale)
    }

    private func scoreLabel(_ score: Double) -> String {
        guard let custom = labels.score else { return Self.scoreText(score, locale: locale) }
        return custom(min(max(score, 0), 1).formatted(.percent.precision(.fractionLength(0)).locale(locale)))
    }

    private func row(_ result: StanceSearchResult) -> some View {
        let canOpen = onResultSelect != nil || Self.isSafeLink(result.url)
        return Button {
            if let onResultSelect { onResultSelect(result) } else if Self.isSafeLink(result.url), let url = result.url { openURL(url) }
        } label: {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                Text(result.title).stanceText(.label).foregroundStyle(theme.colors.fgDefault)
                Text(highlighted(result)).stanceText(.bodySmall).foregroundStyle(theme.colors.fgMuted).fixedSize(horizontal: false, vertical: true)
                if result.source != nil || result.score != nil {
                    StanceFlowLayout(spacing: StanceSpacing.md, lineSpacing: StanceSpacing.xxs) {
                        if let source = result.source { Text(source) }
                        if let score = result.score { Text(scoreLabel(score)).monospacedDigit() }
                    }
                    .stanceText(.caption)
                    .foregroundStyle(theme.colors.fgMuted)
                }
                if let reason = result.reason {
                    Text(reasonText(reason)).stanceText(.caption).foregroundStyle(theme.colors.fgMuted).fixedSize(horizontal: false, vertical: true)
                }
            }
            .multilineTextAlignment(.leading)
        }
        .buttonStyle(StanceRowButtonStyle())
        .disabled(!canOpen)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(canOpen ? .isButton : [])
    }
}

// MARK: Copilot panel

/// The edge a copilot panel docks to in regular width.
public enum StanceCopilotSide: String, CaseIterable, Sendable {
    /// The leading edge: left in left to right layouts.
    case leading
    /// The trailing edge, where the system inspector sits.
    case trailing
}

/// Sizing and placement rules for a copilot panel, usable without a view.
public enum StanceCopilotPanelLayout {
    /// The narrowest the docked panel may be.
    public static let minWidth: CGFloat = StanceSize.readableWidth / 2
    /// The widest the docked panel may be.
    public static let maxWidth: CGFloat = StanceSize.readableWidth * 3 / 4
    /// The width used when none is asked for.
    public static let defaultWidth: CGFloat = (minWidth + maxWidth) / 2

    /// The docked width for a requested width, kept between ``minWidth`` and ``maxWidth``.
    public nonisolated static func clampedWidth(_ width: CGFloat?) -> CGFloat {
        guard let width, width.isFinite else { return defaultWidth }
        return min(max(width, minWidth), maxWidth)
    }

    /// Whether the system inspector presents the panel: always in compact width, where it is a
    /// sheet, and on the trailing edge in regular width. A leading panel in regular width is a column.
    public nonisolated static func usesInspector(side: StanceCopilotSide, isRegularWidth: Bool) -> Bool {
        !isRegularWidth || side == .trailing
    }
}

/// Words a ``StanceCopilotPanel`` uses. Leave a value out to keep the localised default.
public struct StanceCopilotPanelLabels: Sendable {
    public var title: String?
    public var close: String?

    /// - Parameters:
    ///   - title: The heading when none is given. Defaults to a localised "Assistant".
    ///   - close: Defaults to a localised "Close".
    public init(title: String? = nil, close: String? = nil) {
        self.title = title
        self.close = close
    }
}

/// The content of a docked assistant panel: a header with context, a thread and a composer.
///
/// Present it with `.stanceCopilotPanel(isPresented:)`, which docks it beside the page in
/// regular width and shows it as a sheet in compact width. Put a ``StanceThread`` in `content`
/// and a ``StancePromptComposer`` in `composer`.
public struct StanceCopilotPanel<Context: View, HeaderActions: View, Content: View, Composer: View>: View {
    private let title: String?
    private let labels: StanceCopilotPanelLabels
    private let onClose: (() -> Void)?
    private let context: Context
    private let headerActions: HeaderActions
    private let content: Content
    private let composer: Composer
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: The heading. Defaults to a localised "Assistant".
    ///   - labels: Replacements for the built in words.
    ///   - onClose: Adds a close button.
    ///   - content: The thread.
    ///   - context: What the assistant can see, such as the open page, under the heading.
    ///   - headerActions: Extra controls beside the close button.
    ///   - composer: The prompt composer, pinned to the bottom.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        labels: StanceCopilotPanelLabels = .init(),
        onClose: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content,
        @ViewBuilder context: () -> Context = { EmptyView() },
        @ViewBuilder headerActions: () -> HeaderActions = { EmptyView() },
        @ViewBuilder composer: () -> Composer = { EmptyView() }
    ) {
        self.title = title
        self.labels = labels
        self.onClose = onClose
        self.content = content()
        self.context = context()
        self.headerActions = headerActions()
        self.composer = composer()
    }

    /// Creates a panel whose heading is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        labels: StanceCopilotPanelLabels = .init(),
        onClose: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content,
        @ViewBuilder context: () -> Context = { EmptyView() },
        @ViewBuilder headerActions: () -> HeaderActions = { EmptyView() },
        @ViewBuilder composer: () -> Composer = { EmptyView() }
    ) {
        self.init(String(localized: titleKey), labels: labels, onClose: onClose, content: content, context: context, headerActions: headerActions, composer: composer)
    }

    private var resolvedTitle: String { title ?? labels.title ?? stanceString("stance.ai.role.assistant", locale) }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.none) {
            VStack(alignment: .leading, spacing: StanceSpacing.xs) {
                HStack(spacing: StanceSpacing.sm) {
                    StanceIcon(.sparkle, size: StanceSize.iconSm).foregroundStyle(theme.colors.fgMuted).accessibilityHidden(true)
                    Text(resolvedTitle).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                    Spacer(minLength: StanceSpacing.none)
                    headerActions
                    if let onClose {
                        StanceProductIconButton(icon: .x, label: labels.close ?? stanceString("stance.close", locale), action: onClose)
                            .padding(.trailing, -StanceSpacing.md)
                    }
                }
                .frame(minHeight: StanceSize.touchTarget)
                if Context.self != EmptyView.self { context }
            }
            .padding(.horizontal, StanceSpacing.lg)
            .padding(.vertical, StanceSpacing.sm)
            StanceDivider()
            content.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            if Composer.self != EmptyView.self {
                composer
                    .padding(.horizontal, StanceSpacing.lg)
                    .padding(.vertical, StanceSpacing.sm)
            }
        }
        .background(theme.colors.bgSurface)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(resolvedTitle)
    }
}

extension View {
    /// Presents a copilot panel beside this view.
    ///
    /// Built on the system inspector: a trailing column in regular width and a sheet with medium
    /// and large detents in compact width, with the system's own dismissal. A `.leading` panel
    /// in regular width is a fixed column before the content, since the inspector is trailing only.
    /// - Parameters:
    ///   - isPresented: Whether the panel is open.
    ///   - side: The edge to dock to in regular width.
    ///   - width: The docked width. It is kept inside ``StanceCopilotPanelLayout`` bounds.
    ///   - panel: The panel, usually a ``StanceCopilotPanel``.
    public func stanceCopilotPanel<Panel: View>(
        isPresented: Binding<Bool>,
        side: StanceCopilotSide = .trailing,
        width: CGFloat? = nil,
        @ViewBuilder panel: @escaping () -> Panel
    ) -> some View {
        modifier(StanceCopilotPanelModifier(isPresented: isPresented, side: side, width: width, panel: panel))
    }
}

private struct StanceCopilotPanelModifier<Panel: View>: ViewModifier {
    @Binding var isPresented: Bool
    let side: StanceCopilotSide
    let width: CGFloat?
    @ViewBuilder let panel: () -> Panel
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    func body(content: Content) -> some View {
        let columnWidth = StanceCopilotPanelLayout.clampedWidth(width)
        if StanceCopilotPanelLayout.usesInspector(side: side, isRegularWidth: sizeClass == .regular) {
            content.inspector(isPresented: $isPresented) {
                panel()
                    .inspectorColumnWidth(min: StanceCopilotPanelLayout.minWidth, ideal: columnWidth, max: StanceCopilotPanelLayout.maxWidth)
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
                    .modifier(StancePresentationChrome(theme: theme, locale: locale, layoutDirection: layoutDirection))
            }
        } else {
            HStack(spacing: StanceSpacing.none) {
                if isPresented {
                    panel().frame(width: columnWidth)
                    StanceDivider(vertical: true)
                }
                content
            }
        }
    }
}
