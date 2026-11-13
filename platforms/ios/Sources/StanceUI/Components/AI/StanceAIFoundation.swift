import SwiftUI

// Shared types for the Stance AI components.
//
// The components are presentational. They make no network calls and import no model SDK: the
// app owns the conversation and passes text and status in. Surfaces use the ink scale only;
// identity comes from the sparkle icon, motion and clear labelling.

/// The state of one generation, shared by the composer, messages and streaming components.
public enum StanceGenerationStatus: String, CaseIterable, Sendable {
    /// Nothing is in progress.
    case idle
    /// The request was sent and no content has arrived yet.
    case submitted
    /// Content is arriving.
    case streaming
    /// The response finished normally.
    case complete
    /// The reader stopped the response.
    case stopped
    /// The response failed.
    case error

    /// Whether a response is being requested or generated.
    public var isActive: Bool { self == .submitted || self == .streaming }

    /// Whether the generation has ended, in any way.
    public var isFinished: Bool { self == .complete || self == .stopped || self == .error }

    /// A change worth telling assistive technology about. Each is announced once, never per token.
    public enum Event: String, CaseIterable, Sendable {
        case started, finished, stopped, failed
    }

    /// The event for a status change, or `nil` when the change is not worth announcing.
    ///
    /// Moving from `submitted` to `streaming` is silent: the start was already announced.
    public static func event(from old: StanceGenerationStatus, to new: StanceGenerationStatus) -> Event? {
        guard old != new else { return nil }
        switch new {
        case .idle: return nil
        case .submitted: return old == .streaming ? nil : .started
        case .streaming: return old == .submitted ? nil : .started
        case .complete: return .finished
        case .stopped: return .stopped
        case .error: return .failed
        }
    }

    /// The polite announcement for a status change, localised for `locale`.
    public static func announcement(from old: StanceGenerationStatus, to new: StanceGenerationStatus, locale: Locale = .current) -> String? {
        switch event(from: old, to: new) {
        case nil: nil
        case .started: stanceString("stance.ai.status.started", locale)
        case .finished: stanceString("stance.ai.status.finished", locale)
        case .stopped: stanceString("stance.ai.status.stopped", locale)
        case .failed: stanceString("stance.ai.status.failed", locale)
        }
    }

    /// The status in words for an accessibility value, or `nil` when there is nothing to say.
    public func accessibilityDescription(locale: Locale = .current) -> String? {
        switch self {
        case .idle, .complete: nil
        case .submitted: stanceString("stance.ai.status.waiting", locale)
        case .streaming: stanceString("stance.ai.status.generating", locale)
        case .stopped: stanceString("stance.ai.status.stopped", locale)
        case .error: stanceString("stance.ai.status.failed", locale)
        }
    }
}

/// Who a message is from.
public enum StanceMessageRole: String, CaseIterable, Sendable {
    case user, assistant, system

    /// The name used when no author is given, localised for `locale`.
    public func defaultName(locale: Locale = .current) -> String {
        switch self {
        case .user: stanceString("stance.ai.role.user", locale)
        case .assistant: stanceString("stance.ai.role.assistant", locale)
        case .system: stanceString("stance.ai.role.system", locale)
        }
    }
}

/// A thumbs up or thumbs down rating.
public enum StanceRating: String, CaseIterable, Sendable {
    case up, down

    /// The rating after a tap: tapping the current rating clears it.
    public static func toggled(_ current: StanceRating?, tapped: StanceRating) -> StanceRating? {
        current == tapped ? nil : tapped
    }
}

// MARK: Agent types (wave two)

/// The state of one step, tool call or task in an agent run. Shared by the agent components.
public enum StanceStepStatus: String, CaseIterable, Sendable {
    /// Not started yet.
    case pending
    /// In progress now.
    case running
    /// Finished normally.
    case complete
    /// Failed.
    case error
    /// Left out on purpose.
    case skipped
    /// Paused until the person answers, for example an approval.
    case waiting

    /// Whether the step is in progress.
    public var isActive: Bool { self == .running }

    /// Whether the step has ended, in any way.
    public var isFinished: Bool { self == .complete || self == .error || self == .skipped }

    /// The step status that matches a generation status: a stopped response is a skipped step.
    public init(_ generation: StanceGenerationStatus) {
        switch generation {
        case .idle: self = .pending
        case .submitted, .streaming: self = .running
        case .complete: self = .complete
        case .stopped: self = .skipped
        case .error: self = .error
        }
    }

    /// The status in words, such as "Running" or "Waiting for you", localised for `locale`.
    /// Status is always shown with this text, never by colour or icon alone.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .pending: stanceString("stance.ai.step.pending", locale)
        case .running: stanceString("stance.ai.step.running", locale)
        case .complete: stanceString("stance.ai.step.complete", locale)
        case .error: stanceString("stance.ai.step.error", locale)
        case .skipped: stanceString("stance.ai.step.skipped", locale)
        case .waiting: stanceString("stance.ai.step.waiting", locale)
        }
    }

    /// The accessible name of something with a status, for example "Search the web, complete".
    public func accessibilityName(for title: String, locale: Locale = .current) -> String {
        stanceString("stance.ai.step.name \(title) \(label(locale: locale))", locale)
    }

    /// The announcement for a status change, or `nil` when there is nothing to say.
    /// Each change is announced once. A step that goes back to pending is silent.
    public static func announcement(for title: String, from old: StanceStepStatus, to new: StanceStepStatus, locale: Locale = .current) -> String? {
        guard old != new, new != .pending else { return nil }
        return new.accessibilityName(for: title, locale: locale)
    }

    /// Whether the change should interrupt: a failure, or the agent waiting for the person.
    public var isUrgent: Bool { self == .error || self == .waiting }

    /// The tone used for the status mark. Tone always comes with the label.
    var tone: StanceTone {
        switch self {
        case .pending, .skipped, .running: .neutral
        case .complete: .success
        case .error: .danger
        case .waiting: .warning
        }
    }

    /// The Stance icon for the status. Running is drawn as a spinner by ``StanceStepStatusMark``.
    var icon: StanceIconName {
        switch self {
        case .pending: .circle
        case .running: .refresh
        case .complete: .checkCircle
        case .error: .alertCircle
        case .skipped: .minus
        case .waiting: .clock
        }
    }
}

/// How much is at stake in an action an agent asks to take.
public enum StanceRiskLevel: String, CaseIterable, Comparable, Sendable {
    /// Easy to undo and stays inside the product.
    case low
    /// Changes data or is visible to other people.
    case medium
    /// Hard to undo, spends money or leaves the product.
    case high

    public static func < (lhs: StanceRiskLevel, rhs: StanceRiskLevel) -> Bool {
        allCases.firstIndex(of: lhs)! < allCases.firstIndex(of: rhs)!
    }

    /// The risk in words, such as "High risk", localised for `locale`.
    public func label(locale: Locale = .current) -> String {
        switch self {
        case .low: stanceString("stance.ai.risk.low", locale)
        case .medium: stanceString("stance.ai.risk.medium", locale)
        case .high: stanceString("stance.ai.risk.high", locale)
        }
    }

    /// The tone used beside the label.
    var tone: StanceTone {
        switch self {
        case .low: .neutral
        case .medium: .warning
        case .high: .danger
        }
    }
}

// MARK: Internal building blocks

/// The glyph for a ``StanceStepStatus``: a spinner while running, otherwise a Stance icon in the
/// status tone. Decorative: the caller always shows or speaks the status label as well.
struct StanceStepStatusMark: View {
    let status: StanceStepStatus
    var size: CGFloat = StanceSize.iconSm
    @Environment(\.stanceTheme) private var theme
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1

    var body: some View {
        Group {
            if status == .running {
                ProgressView().controlSize(.small).tint(theme.colors.fgMuted)
            } else {
                StanceIcon(status.icon, size: size)
                    .foregroundStyle(status.tone == .neutral ? theme.colors.fgSubtle : status.tone.foreground(theme))
            }
        }
        .frame(width: size * scale, height: size * scale)
        .accessibilityHidden(true)
    }
}

/// Announces a step status change to VoiceOver once, when `status` changes.
struct StanceStepStatusAnnouncer: ViewModifier {
    let title: String
    let status: StanceStepStatus
    @Environment(\.locale) private var locale

    func body(content: Content) -> some View {
        content.onChange(of: status) { old, new in
            if let text = StanceStepStatus.announcement(for: title, from: old, to: new, locale: locale) {
                StanceAnnouncer.announce(text, urgent: new.isUrgent)
            }
        }
    }
}


/// An SF Symbol sized like a Stance icon. Used for system glyphs: send, stop, microphone, thumbs.
struct StanceSymbol: View {
    private let name: String
    private let variableValue: Double?
    @ScaledMetric private var size: CGFloat

    init(_ name: String, size: CGFloat = StanceSize.iconMd, variableValue: Double? = nil) {
        self.name = name
        self.variableValue = variableValue
        _size = ScaledMetric(wrappedValue: size, relativeTo: .body)
    }

    var body: some View {
        Image(systemName: name, variableValue: variableValue)
            .resizable()
            .scaledToFit()
            .fontWeight(.medium)
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

/// The pressed and disabled treatment for quiet, icon sized controls.
struct StanceQuietButtonStyle: ButtonStyle {
    var isOn = false

    func makeBody(configuration: Configuration) -> some View {
        QuietBody(configuration: configuration, isOn: isOn)
    }

    private struct QuietBody: View {
        let configuration: ButtonStyleConfiguration
        let isOn: Bool
        @Environment(\.stanceTheme) private var theme
        @Environment(\.isEnabled) private var isEnabled

        var body: some View {
            configuration.label
                .foregroundStyle(!isEnabled ? theme.colors.disabledFg : isOn ? theme.colors.fgDefault : theme.colors.fgMuted)
                .background(configuration.isPressed ? theme.colors.interactiveActive : .clear, in: RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
                .contentShape(Rectangle())
        }
    }
}

/// Bounces a symbol when `value` changes. Still under Reduce Motion.
struct StanceSymbolBounce: ViewModifier {
    let value: Int
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        if reduceMotion { content } else { content.symbolEffect(.bounce, value: value) }
    }
}

/// A quiet icon button with a 44pt target and a required accessible name.
struct StanceQuietIconButton: View {
    let symbol: String
    let label: String
    var isOn: Bool?
    var bounce = 0
    let action: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Button(action: action) {
            StanceSymbol(symbol, size: StanceSize.iconSm + StanceSpacing.xxs)
                .contentTransition(reduceMotion ? .identity : .symbolEffect(.replace))
                .modifier(StanceSymbolBounce(value: bounce))
                .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
        }
        .buttonStyle(StanceQuietButtonStyle(isOn: isOn ?? false))
        .accessibilityLabel(label)
        .accessibilityAddTraits(isOn == nil ? [] : isOn == true ? [.isToggle, .isSelected] : .isToggle)
        #if os(iOS)
        .hoverEffect(.highlight)
        #endif
    }
}

/// A filled circle with a symbol: the send, stop and microphone buttons.
struct StanceCircleSymbol: View {
    let symbol: String
    var diameter: CGFloat = StanceSize.controlMd
    var filled = true
    @Environment(\.stanceTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1

    var body: some View {
        let size = diameter * min(scale, StanceSize.controlLg / StanceSize.controlMd)
        StanceSymbol(symbol, size: StanceSize.iconSm)
            .contentTransition(reduceMotion ? .identity : .symbolEffect(.replace))
            .foregroundStyle(!isEnabled ? theme.colors.disabledFg : filled ? theme.colors.accentFg : theme.colors.fgDefault)
            .frame(width: size, height: size)
            .background(!filled ? Color.clear : isEnabled ? theme.colors.accentBg : theme.colors.disabledBg, in: Circle())
            .overlay { Circle().strokeBorder(filled ? .clear : isEnabled ? theme.colors.borderControl : theme.colors.disabledBorder, lineWidth: theme.controlBorderWidth) }
            .frame(minWidth: StanceSize.touchTarget, minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
    }
}

/// A selectable chip: feedback reasons and similar short choices.
struct StanceChoiceChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        Button(action: action) {
            HStack(spacing: StanceSpacing.xs) {
                if isSelected { StanceIcon(.check, size: StanceSize.iconSm - StanceSpacing.xxs) }
                Text(title).stanceText(.label).multilineTextAlignment(.leading)
            }
            .padding(.horizontal, StanceSpacing.md)
            .padding(.vertical, StanceSpacing.xs)
            .frame(minHeight: StanceSize.controlSm + StanceSpacing.xs)
            .foregroundStyle(isSelected ? theme.colors.interactiveSelectedFg : theme.colors.fgDefault)
            .background(isSelected ? theme.colors.interactiveSelected : .clear, in: RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous)
                    .strokeBorder(isSelected ? theme.colors.borderStrong : theme.colors.borderControl, lineWidth: theme.controlBorderWidth)
            }
            .frame(minHeight: StanceSize.touchTarget)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? [.isToggle, .isSelected] : .isToggle)
    }
}

/// A row shaped button on a surface: starter prompts and suggestion rows.
struct StanceRowButtonStyle: ButtonStyle {
    var bordered = true

    func makeBody(configuration: Configuration) -> some View {
        RowBody(configuration: configuration, bordered: bordered)
    }

    private struct RowBody: View {
        let configuration: ButtonStyleConfiguration
        let bordered: Bool
        @Environment(\.stanceTheme) private var theme

        var body: some View {
            let shape = RoundedRectangle(cornerRadius: bordered ? StanceRadius.lg : StanceRadius.md, style: .continuous)
            configuration.label
                .frame(maxWidth: .infinity, minHeight: StanceSize.touchTarget, alignment: .leading)
                .padding(.horizontal, StanceSpacing.md)
                .padding(.vertical, bordered ? StanceSpacing.sm : StanceSpacing.xs)
                .background(configuration.isPressed ? theme.colors.interactiveActive : bordered ? theme.colors.bgSurface : .clear, in: shape)
                .overlay { if bordered { shape.strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) } }
                .contentShape(shape)
        }
    }
}

/// Wraps its children onto as many lines as they need, in reading order.
/// SwiftUI mirrors the placement in right to left layouts.
struct StanceFlowLayout: Layout {
    var spacing: CGFloat = StanceSpacing.sm
    var lineSpacing: CGFloat = StanceSpacing.sm

    /// Frames for items of the given sizes wrapped into `maxWidth`, and the size they occupy.
    static func arrange(sizes: [CGSize], maxWidth: CGFloat, spacing: CGFloat, lineSpacing: CGFloat) -> (frames: [CGRect], size: CGSize) {
        var frames: [CGRect] = []
        var x: CGFloat = 0, y: CGFloat = 0, lineHeight: CGFloat = 0, width: CGFloat = 0
        for size in sizes {
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += lineHeight + lineSpacing
                lineHeight = 0
            }
            frames.append(CGRect(origin: CGPoint(x: x, y: y), size: size))
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
            width = max(width, x - spacing)
        }
        return (frames, CGSize(width: width, height: y + lineHeight))
    }

    private func arrangement(_ proposal: ProposedViewSize, _ subviews: Subviews) -> (frames: [CGRect], size: CGSize) {
        let maxWidth = proposal.width ?? .infinity
        let sizes = subviews.map { $0.sizeThatFits(ProposedViewSize(width: maxWidth, height: nil)) }
        return Self.arrange(sizes: sizes, maxWidth: maxWidth, spacing: spacing, lineSpacing: lineSpacing)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrangement(proposal, subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let frames = arrangement(ProposedViewSize(width: bounds.width, height: proposal.height), subviews).frames
        for (subview, frame) in zip(subviews, frames) {
            subview.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY), anchor: .topLeading, proposal: ProposedViewSize(frame.size))
        }
    }
}

/// Carries the Stance theme, locale and layout direction into a sheet or popover.
struct StancePresentationChrome: ViewModifier {
    let theme: StanceTheme
    let locale: Locale
    let layoutDirection: LayoutDirection

    func body(content: Content) -> some View {
        content
            .environment(\.stanceTheme, theme)
            .environment(\.locale, locale)
            .environment(\.layoutDirection, layoutDirection)
            .tint(theme.colors.accentBg)
            .foregroundStyle(theme.colors.fgDefault)
            .preferredColorScheme(theme.colorScheme)
    }
}

/// The avatar or mark shown beside an author's name.
struct StanceAuthorMark: View {
    let role: StanceMessageRole
    let author: String?
    let avatar: Image?
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        if role == .assistant, avatar == nil {
            // The assistant is identified by the sparkle, not by a hue.
            StanceIcon(.sparkle, size: StanceSize.iconSm)
                .foregroundStyle(theme.colors.fgDefault)
                .frame(width: StanceSize.controlSm, height: StanceSize.controlSm)
                .background(theme.colors.bgMuted, in: Circle())
                .overlay { Circle().strokeBorder(theme.colors.borderDefault, lineWidth: theme.borderWidth) }
                .accessibilityHidden(true)
        } else if let author {
            StanceAvatar(name: author, image: avatar, size: .small).accessibilityHidden(true)
        }
    }
}

extension TimeInterval {
    /// A duration in words, such as "12 seconds" or "1 minute, 4 seconds".
    func stanceDuration(locale: Locale, width: Duration.UnitsFormatStyle.UnitWidth = .wide) -> String {
        let seconds = Int(max(0, self).rounded())
        let units: Set<Duration.UnitsFormatStyle.Unit> = seconds >= 60 ? [.minutes, .seconds] : [.seconds]
        return Duration.seconds(seconds).formatted(.units(allowed: units, width: width).locale(locale))
    }
}
