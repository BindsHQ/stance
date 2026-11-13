import SwiftUI

// Agent components (wave two): reviewing what an agent did. The run log and the diff review.
// Logs and diffs are always laid out left to right, also inside right to left screens.

// MARK: Run log

/// How important a ``StanceLogEntry`` is.
public enum StanceLogLevel: String, CaseIterable, Sendable {
    case debug, info, warn, error

    /// The level in words, such as "Warning", localised for `locale`.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .debug: stanceString("stance.ai.log.level.debug", locale)
        case .info: stanceString("stance.ai.log.level.info", locale)
        case .warn: stanceString("stance.ai.log.level.warn", locale)
        case .error: stanceString("stance.ai.log.level.error", locale)
        }
    }
}

/// One line of a ``StanceRunLog``.
public struct StanceLogEntry: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    /// When the line was written.
    public var time: Date?
    /// How important the line is.
    public var level: StanceLogLevel
    /// The text, shown exactly as given.
    public var text: String

    /// Creates a log line.
    public init(id: String, time: Date? = nil, level: StanceLogLevel = .info, text: String) {
        self.id = id
        self.time = time
        self.level = level
        self.text = text
    }
}

/// Words a ``StanceRunLog`` uses. Leave a value out to keep the localised default.
public struct StanceRunLogLabels: Sendable {
    public var copy: String?
    public var copied: String?
    public var levels: String?
    public var empty: String?

    /// - Parameters:
    ///   - copy: The copy button. Defaults to a localised "Copy log".
    ///   - copied: The confirmation. Defaults to a localised "Copied".
    ///   - levels: The accessible name of the level filter. Defaults to a localised "Log levels".
    ///   - empty: Shown when there are no lines. Defaults to a localised "No log lines yet".
    public init(copy: String? = nil, copied: String? = nil, levels: String? = nil, empty: String? = nil) {
        self.copy = copy
        self.copied = copied
        self.levels = levels
        self.empty = empty
    }
}

/// A live, monospaced log of an agent run that follows the newest line until the reader scrolls
/// up, with level filters and copy.
///
/// Built on a `ScrollView` with a `LazyVStack`, so long logs stay light. It follows the tail the
/// way ``StanceThread`` does, with the same ``StanceThreadScrollState``, and releases as soon as
/// the reader scrolls up. Only new errors are announced to VoiceOver, never every line.
public struct StanceRunLog: View {
    private let title: String?
    private let entries: [StanceLogEntry]
    private let follows: Bool
    private let wraps: Bool
    private let maxHeight: CGFloat
    private let labels: StanceRunLogLabels
    private let externalLevels: Binding<Set<StanceLogLevel>>?
    private let onCopy: ((String) -> Void)?
    @State private var internalLevels = Set(StanceLogLevel.allCases)
    @State private var scroll = StanceThreadScrollState()
    @State private var viewportHeight: CGFloat = 0
    @State private var frame: StanceRunLogFrame?
    @State private var copied = false
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.timeZone) private var timeZone
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1

    private static var bottomID: String { "stance-run-log-bottom" }

    /// - Parameters:
    ///   - title: The heading and accessible name. Defaults to a localised "Run log".
    ///   - entries: The lines, oldest first.
    ///   - levels: The levels shown, when the app owns the filter. By default every level is shown.
    ///   - follows: Follow the newest line while the reader is at the bottom.
    ///   - wraps: Wraps long lines. When `false` the log scrolls sideways instead.
    ///   - maxHeight: The height of the log at the default text size. It grows with Dynamic Type.
    ///   - labels: Replacements for the built in words.
    ///   - onCopy: Called after copying, with the copied text.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        entries: [StanceLogEntry],
        levels: Binding<Set<StanceLogLevel>>? = nil,
        follows: Bool = true,
        wraps: Bool = true,
        maxHeight: CGFloat = StanceSize.controlLg * 5,
        labels: StanceRunLogLabels = .init(),
        onCopy: ((String) -> Void)? = nil
    ) {
        self.title = title
        self.entries = entries
        externalLevels = levels
        self.follows = follows
        self.wraps = wraps
        self.maxHeight = maxHeight
        self.labels = labels
        self.onCopy = onCopy
    }

    // MARK: Logic

    /// The lines whose level is in `levels`, in their given order.
    public nonisolated static func filter(_ entries: [StanceLogEntry], levels: Set<StanceLogLevel>) -> [StanceLogEntry] {
        entries.filter { levels.contains($0.level) }
    }

    /// The levels after a filter chip is tapped: the level is added or removed.
    public nonisolated static func toggled(_ levels: Set<StanceLogLevel>, level: StanceLogLevel) -> Set<StanceLogLevel> {
        var levels = levels
        if levels.contains(level) { levels.remove(level) } else { levels.insert(level) }
        return levels
    }

    /// The time of a line as hours, minutes and seconds.
    public nonisolated static func timeText(_ date: Date, locale: Locale = .current, timeZone: TimeZone = .current) -> String {
        var style = Date.FormatStyle(date: .omitted, time: .standard, locale: locale)
        style.timeZone = timeZone
        return date.formatted(style.hour(.twoDigits(amPM: .omitted)).minute(.twoDigits).second(.twoDigits))
    }

    /// The log as plain text, one line per entry: time, level and text.
    public nonisolated static func plainText(_ entries: [StanceLogEntry], locale: Locale = .current, timeZone: TimeZone = .current) -> String {
        entries.map { entry in
            ([entry.time.map { timeText($0, locale: locale, timeZone: timeZone) }, entry.level.rawValue.uppercased(), entry.text] as [String?]).compactMap { $0 }.joined(separator: " ")
        }
        .joined(separator: "\n")
    }

    /// The errors among the lines added after the first `seenCount`. Only these are announced.
    public nonisolated static func newErrors(in entries: [StanceLogEntry], after seenCount: Int) -> [StanceLogEntry] {
        guard seenCount < entries.count else { return [] }
        return entries.dropFirst(max(0, seenCount)).filter { $0.level == .error }
    }

    /// What VoiceOver reads for a line, for example "Error: Relay timed out".
    public nonisolated static func accessibilityLabel(for entry: StanceLogEntry, locale: Locale = .current) -> String {
        stanceString("stance.ai.log.line \(entry.level.label(locale: locale)) \(entry.text)", locale)
    }

    // MARK: View

    private var levels: Set<StanceLogLevel> { externalLevels?.wrappedValue ?? internalLevels }
    private var heading: String { title ?? stanceString("stance.ai.log", locale) }
    private var copyLabel: String { labels.copy ?? stanceString("stance.ai.log.copy", locale) }
    private var copiedLabel: String { labels.copied ?? stanceString("stance.ai.actions.copied", locale) }

    public var body: some View {
        let shown = Self.filter(entries, levels: levels)
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: StanceSpacing.sm) {
                Text(heading).stanceText(.label).accessibilityAddTraits(.isHeader)
                Spacer(minLength: 0)
                Button {
                    copy(shown)
                } label: {
                    HStack(spacing: StanceSpacing.xs) {
                        StanceIcon(copied ? .check : .copy, size: StanceSize.iconSm)
                        Text(copied ? copiedLabel : stanceString("stance.ai.actions.copy", locale)).stanceText(.caption)
                    }
                    .foregroundStyle(theme.colors.fgMuted)
                    .padding(.horizontal, StanceSpacing.sm)
                    .frame(minHeight: StanceSize.touchTarget)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(copied ? copiedLabel : copyLabel)
                .disabled(shown.isEmpty)
            }
            .padding(.leading, StanceSpacing.md)
            .padding(.trailing, StanceSpacing.xs)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: StanceSpacing.sm) {
                    ForEach(StanceLogLevel.allCases, id: \.self) { level in
                        StanceChoiceChip(title: level.label(locale: locale), isSelected: levels.contains(level)) {
                            let new = Self.toggled(levels, level: level)
                            if let externalLevels { externalLevels.wrappedValue = new } else { internalLevels = new }
                            StanceHaptics.selection()
                        }
                    }
                }
                .padding(.horizontal, StanceSpacing.md)
                .padding(.bottom, StanceSpacing.xs)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(labels.levels ?? stanceString("stance.ai.log.levels", locale))
            StanceDivider()
            log(shown)
        }
        .background(theme.colors.bgSubtle, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
        .onChange(of: entries.count) { old, _ in
            // Only errors are announced, and only the newest when several arrive together.
            if let error = Self.newErrors(in: entries, after: old).last {
                StanceAnnouncer.announce(Self.accessibilityLabel(for: error, locale: locale), urgent: true)
            }
        }
    }

    private func log(_ shown: [StanceLogEntry]) -> some View {
        ScrollViewReader { proxy in
            ScrollView(wraps ? .vertical : [.vertical, .horizontal]) {
                VStack(alignment: .leading, spacing: 0) {
                    if shown.isEmpty {
                        Text(labels.empty ?? stanceString("stance.ai.log.empty", locale))
                            .stanceText(.bodySmall)
                            .foregroundStyle(theme.colors.fgMuted)
                            .frame(maxWidth: .infinity, minHeight: StanceSize.touchTarget, alignment: .leading)
                    }
                    LazyVStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                        ForEach(shown) { entry in line(entry) }
                    }
                    Color.clear.frame(height: 0).id(Self.bottomID)
                }
                .padding(StanceSpacing.md)
                .frame(maxWidth: wraps ? .infinity : nil, alignment: .leading)
                .onGeometryChange(for: StanceRunLogFrame.self) { geometry in
                    let frame = geometry.frame(in: .scrollView)
                    return StanceRunLogFrame(bottom: frame.maxY, height: frame.height)
                } action: { new in
                    frame = new
                    update(new, proxy: proxy)
                }
            }
            .defaultScrollAnchor(follows ? .bottom : .top)
            .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { height in
                viewportHeight = height
                if let frame { update(frame, proxy: proxy) }
            }
            .overlay(alignment: .bottom) {
                StanceScrollToLatest(isVisible: follows && !scroll.isPinned) {
                    withAnimation(StanceMotion.slow.animation(reduceMotion: reduceMotion)) {
                        proxy.scrollTo(Self.bottomID, anchor: .bottom)
                    }
                }
                .padding(.bottom, StanceSpacing.sm)
            }
        }
        .frame(height: maxHeight * scale)
        // A log reads left to right in every language.
        .environment(\.layoutDirection, .leftToRight)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(heading)
    }

    private func line(_ entry: StanceLogEntry) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
            if let time = entry.time {
                Text(verbatim: Self.timeText(time, locale: locale, timeZone: timeZone)).foregroundStyle(theme.colors.fgSubtle)
            }
            Text(verbatim: entry.level.rawValue.uppercased())
                .fontWeight(entry.level == .error || entry.level == .warn ? .semibold : .regular)
                .foregroundStyle(entry.level == .error ? theme.colors.dangerFg : entry.level == .warn ? theme.colors.warningFg : theme.colors.fgMuted)
            Text(verbatim: entry.text)
                .foregroundStyle(entry.level == .debug ? theme.colors.fgMuted : theme.colors.fgDefault)
                .fixedSize(horizontal: !wraps, vertical: wraps)
                .textSelection(.enabled)
        }
        .stanceText(.mono)
        .monospacedDigit()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Self.accessibilityLabel(for: entry, locale: locale))
        .accessibilityValue(entry.time.map { Self.timeText($0, locale: locale, timeZone: timeZone) } ?? "")
    }

    private func update(_ frame: StanceRunLogFrame, proxy: ScrollViewProxy) {
        guard viewportHeight > 0 else { return }
        let follow = scroll.update(distanceFromBottom: frame.bottom - viewportHeight, contentHeight: frame.height, viewportHeight: viewportHeight, threshold: StanceSize.touchTarget)
        if follow, follows { proxy.scrollTo(Self.bottomID, anchor: .bottom) }
    }

    private func copy(_ shown: [StanceLogEntry]) {
        let text = Self.plainText(shown, locale: locale, timeZone: timeZone)
        StanceClipboard.copy(text)
        onCopy?(text)
        copied = true
        StanceHaptics.success()
        StanceAnnouncer.announce(copiedLabel)
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(StanceMotion.confirmationDuration))
            copied = false
        }
    }
}

/// Where the log's content sits in its scroll view.
private struct StanceRunLogFrame: Equatable, Sendable {
    var bottom: CGFloat
    var height: CGFloat
}

extension StanceRunLog {
    /// Creates a run log whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        entries: [StanceLogEntry],
        levels: Binding<Set<StanceLogLevel>>? = nil,
        follows: Bool = true,
        wraps: Bool = true,
        maxHeight: CGFloat = StanceSize.controlLg * 5,
        labels: StanceRunLogLabels = .init(),
        onCopy: ((String) -> Void)? = nil
    ) {
        self.init(String(localized: titleKey), entries: entries, levels: levels, follows: follows, wraps: wraps, maxHeight: maxHeight, labels: labels, onCopy: onCopy)
    }
}

// MARK: Diff review

/// What happened to a file in a proposed change.
public enum StanceDiffFileStatus: String, CaseIterable, Sendable {
    case added, modified, deleted, renamed

    /// The status in words, such as "Modified", localised for `locale`.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .added: stanceString("stance.ai.diff.status.added", locale)
        case .modified: stanceString("stance.ai.diff.status.modified", locale)
        case .deleted: stanceString("stance.ai.diff.status.deleted", locale)
        case .renamed: stanceString("stance.ai.diff.status.renamed", locale)
        }
    }
}

/// Whether a diff line was added, removed or is unchanged context.
public enum StanceDiffLineKind: String, CaseIterable, Sendable {
    case add, remove, context

    /// The text prefix that marks the line: a plus, a minus or a space. Never colour alone.
    public var prefix: String {
        switch self {
        case .add: "+"
        case .remove: "-"
        case .context: " "
        }
    }

    /// The word VoiceOver reads before the line: "Added", "Removed" or "Unchanged".
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .add: stanceString("stance.ai.diff.added", locale)
        case .remove: stanceString("stance.ai.diff.removed", locale)
        case .context: stanceString("stance.ai.diff.unchanged", locale)
        }
    }
}

/// One line of a diff.
public struct StanceDiffLine: Equatable, Sendable {
    public var kind: StanceDiffLineKind
    /// The text of the line, without a plus or minus.
    public var text: String
    /// The line number before the change, from 1.
    public var oldNumber: Int?
    /// The line number after the change, from 1.
    public var newNumber: Int?

    /// Creates a diff line.
    public init(_ kind: StanceDiffLineKind, _ text: String, oldNumber: Int? = nil, newNumber: Int? = nil) {
        self.kind = kind
        self.text = text
        self.oldNumber = oldNumber
        self.newNumber = newNumber
    }
}

/// A group of neighbouring changed lines that is accepted or rejected as one.
public struct StanceDiffHunk: Identifiable, Equatable, Sendable {
    /// A stable identifier, unique in the review. Decisions are keyed by it.
    public let id: String
    /// The hunk header, such as `@@ -12,6 +12,8 @@`.
    public var header: String?
    public var lines: [StanceDiffLine]

    /// Creates a hunk.
    public init(id: String, header: String? = nil, lines: [StanceDiffLine]) {
        self.id = id
        self.header = header
        self.lines = lines
    }
}

/// A file in a proposed change, with its hunks.
public struct StanceDiffFile: Identifiable, Equatable, Sendable {
    /// A stable identifier.
    public let id: String
    public var path: String
    public var status: StanceDiffFileStatus
    public var hunks: [StanceDiffHunk]

    /// Creates a file.
    public init(id: String, path: String, status: StanceDiffFileStatus = .modified, hunks: [StanceDiffHunk]) {
        self.id = id
        self.path = path
        self.status = status
        self.hunks = hunks
    }
}

/// The decision on one hunk.
public enum StanceDiffDecision: String, CaseIterable, Sendable {
    case accepted, rejected

    /// The decision in words, localised for `locale`.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .accepted: stanceString("stance.ai.diff.accepted", locale)
        case .rejected: stanceString("stance.ai.diff.rejected", locale)
        }
    }
}

/// How a ``StanceDiffReview`` lays out its lines.
public enum StanceDiffLayout: String, CaseIterable, Sendable {
    /// Unified in compact width, split in regular width.
    case automatic
    /// Old and new lines in one column.
    case unified
    /// Old lines on the left and new lines on the right.
    case split
}

/// How many hunks are accepted, rejected and still to review.
public struct StanceDiffSummary: Equatable, Sendable {
    public var accepted: Int
    public var rejected: Int
    public var pending: Int
}

/// One row of the split layout: the old line on the left and the new line on the right.
public struct StanceDiffSplitRow: Equatable, Sendable {
    public var old: StanceDiffLine?
    public var new: StanceDiffLine?
}

/// Words a ``StanceDiffReview`` uses. Leave a value out to keep the localised default.
public struct StanceDiffReviewLabels: Sendable {
    public var title: String?
    public var acceptAll: String?
    public var rejectAll: String?
    public var accept: String?
    public var reject: String?

    /// - Parameters:
    ///   - title: The heading. Defaults to a localised "Changes".
    ///   - acceptAll: Defaults to a localised "Accept all".
    ///   - rejectAll: Defaults to a localised "Reject all".
    ///   - accept: Defaults to a localised "Accept".
    ///   - reject: Defaults to a localised "Reject".
    public init(title: String? = nil, acceptAll: String? = nil, rejectAll: String? = nil, accept: String? = nil, reject: String? = nil) {
        self.title = title
        self.acceptAll = acceptAll
        self.rejectAll = rejectAll
        self.accept = accept
        self.reject = reject
    }
}

/// Shows a proposed change as a diff, by file and by hunk, with accept and reject for each hunk
/// and for all.
///
/// Unified in compact width and split in regular width. Added and removed lines carry a plus or
/// minus prefix and a word for VoiceOver ("Added", "Removed") as well as the success and danger
/// roles of the theme, so a change is never shown by colour alone. Each file is a native
/// `DisclosureGroup`, each hunk a group with its own accept and reject, and every decision gives
/// haptic feedback. Diffs are laid out left to right in every language.
public struct StanceDiffReview: View {
    private let files: [StanceDiffFile]
    private let layout: StanceDiffLayout
    private let labels: StanceDiffReviewLabels
    private let externalCollapsed: Binding<Set<String>>?
    private let onAcceptAll: (() -> Void)?
    private let onRejectAll: (() -> Void)?
    @Binding private var decisions: [String: StanceDiffDecision]
    @State private var internalCollapsed = Set<String>()
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.horizontalSizeClass) private var sizeClass

    /// - Parameters:
    ///   - files: The changed files.
    ///   - decisions: The decision for each hunk, keyed by hunk identifier. Hunks without an entry are undecided.
    ///   - layout: Unified, split, or automatic by width.
    ///   - collapsed: The identifiers of collapsed files, when the app owns them.
    ///   - labels: Replacements for the built in words.
    ///   - onAcceptAll: Called after every hunk was accepted.
    ///   - onRejectAll: Called after every hunk was rejected.
    public init(
        files: [StanceDiffFile],
        decisions: Binding<[String: StanceDiffDecision]>,
        layout: StanceDiffLayout = .automatic,
        collapsed: Binding<Set<String>>? = nil,
        labels: StanceDiffReviewLabels = .init(),
        onAcceptAll: (() -> Void)? = nil,
        onRejectAll: (() -> Void)? = nil
    ) {
        self.files = files
        _decisions = decisions
        self.layout = layout
        externalCollapsed = collapsed
        self.labels = labels
        self.onAcceptAll = onAcceptAll
        self.onRejectAll = onRejectAll
    }

    // MARK: Logic

    /// The identifiers of every hunk, in file order.
    public nonisolated static func hunkIDs(_ files: [StanceDiffFile]) -> [String] {
        files.flatMap { $0.hunks.map(\.id) }
    }

    /// Decisions that accept every hunk.
    public nonisolated static func acceptAll(_ files: [StanceDiffFile]) -> [String: StanceDiffDecision] {
        Dictionary(uniqueKeysWithValues: Set(hunkIDs(files)).map { ($0, StanceDiffDecision.accepted) })
    }

    /// Decisions that reject every hunk.
    public nonisolated static func rejectAll(_ files: [StanceDiffFile]) -> [String: StanceDiffDecision] {
        Dictionary(uniqueKeysWithValues: Set(hunkIDs(files)).map { ($0, StanceDiffDecision.rejected) })
    }

    /// The decisions after a hunk's accept or reject is pressed. Pressing the current decision
    /// again clears it, so a hunk can go back to undecided.
    public nonisolated static func deciding(_ decisions: [String: StanceDiffDecision], hunk: String, as decision: StanceDiffDecision) -> [String: StanceDiffDecision] {
        var decisions = decisions
        decisions[hunk] = decisions[hunk] == decision ? nil : decision
        return decisions
    }

    /// How many hunks are accepted, rejected and still to review. Decisions for unknown hunks are ignored.
    public nonisolated static func summary(_ files: [StanceDiffFile], decisions: [String: StanceDiffDecision]) -> StanceDiffSummary {
        let ids = hunkIDs(files)
        let accepted = ids.filter { decisions[$0] == .accepted }.count
        let rejected = ids.filter { decisions[$0] == .rejected }.count
        return StanceDiffSummary(accepted: accepted, rejected: rejected, pending: ids.count - accepted - rejected)
    }

    /// The summary in words, for example "2 accepted, 1 rejected, 3 to review".
    public nonisolated static func summaryText(_ files: [StanceDiffFile], decisions: [String: StanceDiffDecision], locale: Locale = .current) -> String {
        let summary = summary(files, decisions: decisions)
        return stanceString("stance.ai.diff.summary \(summary.accepted) \(summary.rejected) \(summary.pending)", locale)
    }

    /// How many lines a file adds and removes.
    public nonisolated static func stats(_ file: StanceDiffFile) -> (added: Int, removed: Int) {
        let lines = file.hunks.flatMap(\.lines)
        return (lines.filter { $0.kind == .add }.count, lines.filter { $0.kind == .remove }.count)
    }

    /// The rows of the split layout. A run of removed lines is paired with the run of added
    /// lines that follows it; context lines appear on both sides.
    public nonisolated static func splitRows(_ lines: [StanceDiffLine]) -> [StanceDiffSplitRow] {
        var rows: [StanceDiffSplitRow] = []
        var removed: [StanceDiffLine] = []
        var added: [StanceDiffLine] = []
        func flush() {
            for index in 0 ..< max(removed.count, added.count) {
                rows.append(StanceDiffSplitRow(old: index < removed.count ? removed[index] : nil, new: index < added.count ? added[index] : nil))
            }
            removed = []
            added = []
        }
        for line in lines {
            switch line.kind {
            case .remove:
                if !added.isEmpty { flush() }
                removed.append(line)
            case .add: added.append(line)
            case .context:
                flush()
                rows.append(StanceDiffSplitRow(old: line, new: line))
            }
        }
        flush()
        return rows
    }

    /// What VoiceOver reads for a line, for example "Added: let total = 4".
    public nonisolated static func accessibilityLabel(for line: StanceDiffLine, locale: Locale = .current) -> String {
        stanceString("stance.ai.diff.line \(line.kind.label(locale: locale)) \(line.text)", locale)
    }

    /// Whether lines are shown side by side for a layout and width.
    public nonisolated static func isSplit(_ layout: StanceDiffLayout, isRegularWidth: Bool) -> Bool {
        switch layout {
        case .automatic: isRegularWidth
        case .unified: false
        case .split: true
        }
    }

    // MARK: View

    private var isSplit: Bool { Self.isSplit(layout, isRegularWidth: sizeClass == .regular) }

    private func isOpen(_ id: String) -> Binding<Bool> {
        Binding(
            get: { !(externalCollapsed?.wrappedValue ?? internalCollapsed).contains(id) },
            set: { open in
                var set = externalCollapsed?.wrappedValue ?? internalCollapsed
                if open { set.remove(id) } else { set.insert(id) }
                if let externalCollapsed { externalCollapsed.wrappedValue = set } else { internalCollapsed = set }
            }
        )
    }

    public var body: some View {
        let total = Self.hunkIDs(files).count
        let starts = files.indices.map { index in files[..<index].reduce(0) { $0 + $1.hunks.count } }
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text(labels.title ?? stanceString("stance.ai.diff", locale)).stanceText(.subheading).accessibilityAddTraits(.isHeader)
                Text(Self.summaryText(files, decisions: decisions, locale: locale)).stanceText(.caption).monospacedDigit().foregroundStyle(theme.colors.fgMuted)
                StanceButtonGroup {
                    StanceButton(labels.rejectAll ?? stanceString("stance.ai.diff.rejectAll", locale), variant: .outline, size: .small) {
                        decisions = Self.rejectAll(files)
                        StanceHaptics.warning()
                        StanceAnnouncer.announce(Self.summaryText(files, decisions: decisions, locale: locale))
                        onRejectAll?()
                    }
                    StanceButton(labels.acceptAll ?? stanceString("stance.ai.diff.acceptAll", locale), size: .small, leadingIcon: .check) {
                        decisions = Self.acceptAll(files)
                        StanceHaptics.success()
                        StanceAnnouncer.announce(Self.summaryText(files, decisions: decisions, locale: locale))
                        onAcceptAll?()
                    }
                }
                .disabled(total == 0)
            }
            ForEach(Array(files.enumerated()), id: \.element.id) { index, file in
                fileView(file, firstHunk: starts[index], total: total)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func fileView(_ file: StanceDiffFile, firstHunk: Int, total: Int) -> some View {
        let stats = Self.stats(file)
        return DisclosureGroup(isExpanded: isOpen(file.id)) {
            VStack(alignment: .leading, spacing: StanceSpacing.md) {
                ForEach(Array(file.hunks.enumerated()), id: \.element.id) { index, hunk in
                    hunkView(hunk, position: firstHunk + index + 1, total: total)
                }
            }
        } label: {
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                Text(verbatim: file.path)
                    .stanceText(.mono)
                    .fontWeight(.medium)
                    .foregroundStyle(theme.colors.fgDefault)
                    .multilineTextAlignment(.leading)
                    .environment(\.layoutDirection, .leftToRight)
                HStack(spacing: StanceSpacing.sm) {
                    Text(file.status.label(locale: locale)).foregroundStyle(theme.colors.fgMuted)
                    Text(verbatim: "+\(stats.added)").foregroundStyle(theme.colors.successFg)
                    Text(verbatim: "-\(stats.removed)").foregroundStyle(theme.colors.dangerFg)
                }
                .stanceText(.caption)
                .monospacedDigit()
            }
            .padding(.vertical, StanceSpacing.xs)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel([file.path, file.status.label(locale: locale), stanceString("stance.ai.diff.stats \(stats.added) \(stats.removed)", locale)].joined(separator: ", "))
        }
        .disclosureGroupStyle(.stance)
        .padding(.horizontal, StanceSpacing.md)
        .stanceSurface(.surface, cornerRadius: StanceRadius.lg)
    }

    private func hunkView(_ hunk: StanceDiffHunk, position: Int, total: Int) -> some View {
        let decision = decisions[hunk.id]
        let name = stanceString("stance.ai.diff.hunk \(position) \(total)", locale)
        return VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: StanceSpacing.sm) {
                Text(verbatim: hunk.header ?? name)
                    .stanceText(.mono)
                    .foregroundStyle(theme.colors.fgMuted)
                    .environment(\.layoutDirection, .leftToRight)
                    .accessibilityLabel(name)
                    .accessibilityValue(decision?.label(locale: locale) ?? stanceString("stance.ai.diff.pending", locale))
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: 0)
                if let decision {
                    HStack(spacing: StanceSpacing.xs) {
                        StanceIcon(decision == .accepted ? .check : .x, size: StanceSize.iconSm)
                        Text(decision.label(locale: locale)).stanceText(.caption).fontWeight(.semibold)
                    }
                    .foregroundStyle(decision == .accepted ? theme.colors.successFg : theme.colors.dangerFg)
                    .accessibilityHidden(true)
                }
            }
            .padding(.horizontal, StanceSpacing.md)
            .padding(.vertical, StanceSpacing.sm)
            StanceDivider()
            Group {
                if isSplit { split(hunk) } else { unified(hunk) }
            }
            .opacity(decision == .rejected ? StanceMotion.pulseRestOpacity : 1)
            // A diff reads left to right in every language.
            .environment(\.layoutDirection, .leftToRight)
            StanceDivider()
            HStack(spacing: StanceSpacing.sm) {
                decisionButton(.rejected, hunk: hunk, current: decision, name: name)
                decisionButton(.accepted, hunk: hunk, current: decision, name: name)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, StanceSpacing.sm)
        }
        .background(theme.colors.bgSubtle, in: RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous).strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
        .clipShape(RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(name)
    }

    private func decisionButton(_ decision: StanceDiffDecision, hunk: StanceDiffHunk, current: StanceDiffDecision?, name: String) -> some View {
        let isOn = current == decision
        let title = decision == .accepted ? labels.accept ?? stanceString("stance.ai.diff.accept", locale) : labels.reject ?? stanceString("stance.ai.diff.reject", locale)
        return Button {
            decisions = Self.deciding(decisions, hunk: hunk.id, as: decision)
            if decision == .accepted { StanceHaptics.success() } else { StanceHaptics.warning() }
        } label: {
            HStack(spacing: StanceSpacing.xs) {
                StanceIcon(decision == .accepted ? .check : .x, size: StanceSize.iconSm)
                Text(title)
            }
        }
        .buttonStyle(.stance(isOn ? .secondary : .ghost, size: .small))
        .accessibilityLabel([title, name].joined(separator: ", "))
        .accessibilityAddTraits(isOn ? [.isToggle, .isSelected] : .isToggle)
    }

    private func unified(_ hunk: StanceDiffHunk) -> some View {
        ScrollView(.horizontal) {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(hunk.lines.enumerated()), id: \.offset) { _, line in
                    lineView(line, numbers: [line.oldNumber, line.newNumber], wraps: false)
                }
            }
            .padding(.vertical, StanceSpacing.xs)
            .frame(minWidth: 0, alignment: .leading)
        }
    }

    private func split(_ hunk: StanceDiffHunk) -> some View {
        Grid(alignment: .topLeading, horizontalSpacing: 0, verticalSpacing: 0) {
            ForEach(Array(Self.splitRows(hunk.lines).enumerated()), id: \.offset) { _, row in
                GridRow {
                    splitCell(row.old, number: row.old?.oldNumber)
                    splitCell(row.new, number: row.new?.newNumber)
                }
            }
        }
        .fixedSize(horizontal: false, vertical: true)
        .padding(.vertical, StanceSpacing.xs)
    }

    @ViewBuilder private func splitCell(_ line: StanceDiffLine?, number: Int?) -> some View {
        if let line {
            lineView(line, numbers: [number], wraps: true)
        } else {
            // Keeps the two sides aligned where one side has no line.
            Text(verbatim: " ").stanceText(.mono).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading).background(theme.colors.bgMuted).accessibilityHidden(true)
        }
    }

    private func lineView(_ line: StanceDiffLine, numbers: [Int?], wraps: Bool) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: StanceSpacing.sm) {
            ForEach(Array(numbers.enumerated()), id: \.offset) { _, number in
                Text(verbatim: number.map(String.init) ?? "")
                    .foregroundStyle(theme.colors.fgSubtle)
                    .frame(minWidth: StanceSpacing.xl, alignment: .trailing)
            }
            Text(verbatim: line.kind.prefix)
                .fontWeight(.semibold)
                .foregroundStyle(line.kind == .add ? theme.colors.successFg : line.kind == .remove ? theme.colors.dangerFg : theme.colors.fgSubtle)
            Text(verbatim: line.text.isEmpty ? " " : line.text)
                .foregroundStyle(theme.colors.fgDefault)
                .fixedSize(horizontal: !wraps, vertical: wraps)
        }
        .stanceText(.mono)
        .monospacedDigit()
        .padding(.horizontal, StanceSpacing.md)
        .frame(maxWidth: .infinity, maxHeight: wraps ? .infinity : nil, alignment: .topLeading)
        .background(line.kind == .add ? theme.colors.successBg : line.kind == .remove ? theme.colors.dangerBg : Color.clear)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Self.accessibilityLabel(for: line, locale: locale))
    }
}
